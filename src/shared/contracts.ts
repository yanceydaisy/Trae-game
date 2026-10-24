/** A/B/C 待共同确认的接口草案；B 的逻辑不得直接依赖 DOM 或 Three.js。 */
export type LevelId = 'door' | 'bike' | 'crowd' | 'guard' | 'elevator' | 'qr';
export type InputMode = 'menu' | 'intro' | 'phone' | 'explore' | 'puzzle' | 'riding' | 'transition' | 'paused' | 'ending';
export interface RunOptions { dorm: '榴园'; destination: '一教' | '二教'; sleepTime: '22:30' | '23:30' | '00:30' | '01:30' | '02:30'; seed: number }
export interface Point { x: number; y: number }
/** 所有小游戏拖动坐标统一为1920×1080参考画布局部坐标。 */
export interface PuzzleWindow { id: string; title: string; x: number; y: number; width: number; height: number; draggable: boolean }
export interface MechanicsSnapshot {
  remainingSeconds: number | null;
  wakeTime: string | null;
  puzzleState: 'idle' | 'active' | 'ready' | 'locked' | 'completed';
  windows: readonly PuzzleWindow[];
  message?: string;
}
export type MechanicsEvent =
  | { type: 'ALIGNMENT_READY'; ready: boolean }
  | { type: 'ALIGNMENT_SUCCESS'; level: LevelId }
  | { type: 'ALIGNMENT_FAILED'; message: string }
  | { type: 'LEVEL_COMPLETED'; level: LevelId }
  | { type: 'GAME_COMPLETED'; ending: 'success' | 'easter-egg'; message?: string }
  | { type: 'GAME_FAILED'; message: string };
export interface MechanicsPort {
  readonly kind: 'development-stub' | 'production';
  start(options: RunOptions): void;
  /** 真实帧间隔。暂停状态A不调用；B统一处理0.25倍率与胜负顺序。 */
  update(realDeltaSeconds: number, mode: InputMode): void;
  getSnapshot(): MechanicsSnapshot;
  enterLevel(level: LevelId): void;
  beginPuzzle(level: LevelId): void;
  moveWindow(id: string, position: Point): void;
  confirmPuzzle(): void;
  cancelPuzzle(): void;
  /** B负责检查点逻辑、重试惩罚与随机种子复用。 */
  retryCheckpoint(level: LevelId): void;
  /** 玩家到达出口/骑行终点等事实，由B判断是否完成。 */
  reportAction(action: 'exit-reached' | 'ride-finished' | 'collect-bun'): void;
  subscribe(listener: (event: MechanicsEvent) => void): () => void;
  dispose(): void;
}
export interface SceneDescriptor { level: LevelId; title: string; hint: string; objectLabel: string }
export interface UIState {
  mode: InputMode; level: SceneDescriptor; options: RunOptions;
  mechanics: MechanicsSnapshot; interaction: string; unlocked: boolean;
  pointerLocked: boolean; status: string; ending: string; development: boolean;
}
export interface UIActions {
  start(options: RunOptions): void; confirmPhone(): void; resume(): void;
  retry(): void; menu(): void; cancelPuzzle(): void;
  drag(id: string, point: Point): void; confirm(): void;
  simulateComplete?(): void; simulateFailure?(): void;
}
export type CoreEvent = MechanicsEvent
  | { type: 'LEVEL_STARTED'; level: LevelId }
  | { type: 'GLITCH_ENTERED' | 'GLITCH_EXITED' }
  | { type: 'MODE_CHANGED'; mode: InputMode };
export interface UIPort { update(state: UIState): void; dispose(): void }
export interface SceneVisualPort { dispose(): void }
