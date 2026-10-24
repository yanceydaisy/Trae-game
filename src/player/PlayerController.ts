import { PerspectiveCamera } from 'three';
import type { Bounds } from './collision.ts';
import { moveWithCollision } from './collision.ts';
export class PlayerController {
  private yaw = 0; private pitch = 0;
  constructor(private camera: PerspectiveCamera) { camera.rotation.order = 'YXZ'; }
  reset(): void { this.camera.position.set(0, 1.65, 4.4); this.yaw = 0; this.pitch = 0; this.camera.rotation.set(0, 0, 0); }
  look(dx: number, dy: number): void {
    this.yaw -= dx * .002; this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - dy * .002));
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
  update(dt: number, keys: ReadonlySet<string>, colliders: readonly Bounds[]): void {
    let x = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    let z = Number(keys.has('KeyS')) - Number(keys.has('KeyW'));
    const length = Math.hypot(x, z); if (!length) return; x /= length; z /= length;
    const speed = 3.5 * dt;
    const result = moveWithCollision(this.camera.position, (x * Math.cos(this.yaw) + z * Math.sin(this.yaw)) * speed, (-x * Math.sin(this.yaw) + z * Math.cos(this.yaw)) * speed, .28, colliders);
    this.camera.position.x = result.x; this.camera.position.z = result.z;
  }
}
