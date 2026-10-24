import type { Group, Mesh, Vector3 } from 'three';
import type { Bounds } from '../player/collision.ts';
import type { SceneDescriptor } from './contracts.ts';
/** C可实现这个场景端口，替换A的白盒；与B的纯逻辑类型分开。 */
export interface ScenePort {
  readonly root: Group;
  readonly colliders: Bounds[];
  readonly objects: Mesh[];
  readonly extraPoint: Vector3;
  setUnlocked(): void;
  animate(dt: number): void;
  hideExtra(): void;
  dispose(): void;
}
export type SceneFactory = (descriptor: SceneDescriptor) => ScenePort;
