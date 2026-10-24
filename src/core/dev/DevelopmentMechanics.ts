import type { InputMode, LevelId, MechanicsEvent, MechanicsPort, MechanicsSnapshot, Point, RunOptions } from '../../shared/contracts.ts';
import { EventBus } from '../EventBus.ts';
/** 联调占位：不计时、不计算Ready、不判断几何，不声称六关玩法已完成。 */
export class DevelopmentMechanics implements MechanicsPort {
  readonly kind = 'development-stub' as const;
  private level: LevelId = 'door';
  private events = new EventBus<MechanicsEvent>();
  private snapshot: MechanicsSnapshot = this.initial();
  private initial(): MechanicsSnapshot { return { remainingSeconds: null, wakeTime: null, puzzleState: 'idle', windows: [], message: '等待 B 接入判定与计时；此处只验证操作与流程。' }; }
  start(_options: RunOptions): void { this.snapshot = this.initial(); }
  update(_dt: number, _mode: InputMode): void {}
  getSnapshot(): MechanicsSnapshot { return this.snapshot; }
  enterLevel(level: LevelId): void { this.level = level; this.snapshot = this.initial(); }
  beginPuzzle(_level: LevelId): void {
    this.snapshot = { ...this.initial(), puzzleState: 'active', windows: [
      { id: 'fixed', title: '参考窗口 · B待接入', x: 320, y: 300, width: 440, height: 280, draggable: false },
      { id: 'movable', title: '拖动测试窗口', x: 1030, y: 430, width: 440, height: 280, draggable: true }
    ] };
  }
  moveWindow(id: string, point: Point): void {
    this.snapshot = { ...this.snapshot, windows: this.snapshot.windows.map(w => w.id === id && w.draggable ? { ...w, ...point } : w) };
  }
  confirmPuzzle(): void { this.events.emit({ type: 'ALIGNMENT_FAILED', message: '操作已传递。B 的 Ready / 吸附 / 通关判定尚未接入。' }); }
  cancelPuzzle(): void { this.snapshot = this.initial(); }
  retryCheckpoint(level: LevelId): void { this.enterLevel(level); }
  reportAction(_action: 'exit-reached' | 'ride-finished' | 'collect-bun'): void {}
  subscribe(listener: (event: MechanicsEvent) => void): () => void { return this.events.subscribe(listener); }
  /** 只供带?dev=1的页面通过明确标注的按钮调用。 */
  simulateComplete(): void {
    this.snapshot = { ...this.snapshot, puzzleState: 'completed', windows: [] };
    this.events.emit({ type: 'ALIGNMENT_SUCCESS', level: this.level });
    if (this.level === 'qr') this.events.emit({ type: 'GAME_COMPLETED', ending: 'success', message: '联调模拟签到成功；正式判定待 B 接入。' });
  }
  simulateFailure(): void { this.events.emit({ type: 'GAME_FAILED', message: '联调模拟超时；未运行真实倒计时。' }); }
  dispose(): void { this.events.clear(); }
}
