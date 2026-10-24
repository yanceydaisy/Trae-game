import type { InputMode } from '../shared/contracts.ts';
interface Callbacks { mode(): InputMode; interact(): void; confirm(): void; escape(): void; retry(): void; pause(): void; look(dx: number, dy: number): void; status(message: string): void }
export class InputController {
  readonly keys = new Set<string>();
  private abort = new AbortController();
  private requesting = false;
  constructor(private canvas: HTMLCanvasElement, private callbacks: Callbacks) {
    const signal = this.abort.signal;
    window.addEventListener('keydown', this.keydown, { signal });
    window.addEventListener('keyup', e => this.keys.delete(e.code), { signal });
    window.addEventListener('blur', this.pause, { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); }, { signal });
    document.addEventListener('pointerlockchange', () => { this.requesting = false; if (!this.locked && callbacks.mode() === 'explore') this.pause(); }, { signal });
    document.addEventListener('pointerlockerror', () => { this.requesting = false; callbacks.status('鼠标锁定不可用，可按住场景拖动观察。'); }, { signal });
    canvas.addEventListener('click', () => { if (callbacks.mode() === 'explore') this.requestLock(); }, { signal });
    canvas.addEventListener('pointerdown', e => { if (callbacks.mode() === 'explore' && !this.locked) canvas.setPointerCapture(e.pointerId); }, { signal });
    window.addEventListener('pointermove', e => {
      if (callbacks.mode() === 'explore' && (this.locked || (e.buttons === 1 && e.target === canvas))) callbacks.look(e.movementX, e.movementY);
    }, { signal });
  }
  get locked(): boolean { return document.pointerLockElement === this.canvas; }
  private keydown = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLElement && (e.target.matches('input,select,textarea') || e.target.isContentEditable)) return;
    const mode = this.callbacks.mode();
    if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code) && mode !== 'menu') e.preventDefault();
    if (e.repeat) return;
    this.keys.add(e.code);
    if (e.code === 'Escape') this.callbacks.escape();
    else if (e.code === 'KeyR' && !['menu', 'intro', 'phone', 'paused'].includes(mode)) this.callbacks.retry();
    else if (e.code === 'KeyE' && (mode === 'explore' || mode === 'intro')) this.callbacks.interact();
    else if (e.code === 'Space' && mode === 'puzzle') this.callbacks.confirm();
  };
  private pause = (): void => { this.clear(); this.callbacks.pause(); };
  clear(): void { this.keys.clear(); }
  requestLock(): void {
    if (this.locked || this.requesting || !this.canvas.requestPointerLock) return;
    this.requesting = true;
    try { Promise.resolve(this.canvas.requestPointerLock()).catch(() => { this.requesting = false; this.callbacks.status('点击场景或按住鼠标拖动观察。'); }); }
    catch { this.requesting = false; }
  }
  release(): void { this.clear(); if (this.locked) document.exitPointerLock(); }
  dispose(): void { this.abort.abort(); this.release(); }
}
