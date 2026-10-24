export interface Bounds { minX: number; maxX: number; minZ: number; maxZ: number }
export interface Position { x: number; z: number }
/** 玩家圆形足迹对轴对齐盒。边界接触允许，穿透禁止。 */
export function intersects(position: Position, radius: number, box: Bounds): boolean {
  const dx = position.x - Math.max(box.minX, Math.min(box.maxX, position.x));
  const dz = position.z - Math.max(box.minZ, Math.min(box.maxZ, position.z));
  return dx * dx + dz * dz < radius * radius;
}
export function moveWithCollision(start: Position, dx: number, dz: number, radius: number, boxes: readonly Bounds[]): Position {
  const result = { ...start };
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (radius * .5)));
  for (let i = 0; i < steps; i++) {
    const x = { x: result.x + dx / steps, z: result.z };
    if (!boxes.some(b => intersects(x, radius, b))) result.x = x.x;
    const z = { x: result.x, z: result.z + dz / steps };
    if (!boxes.some(b => intersects(z, radius, b))) result.z = z.z;
  }
  return result;
}
