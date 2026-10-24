import type { InputMode } from '../shared/contracts.ts';
/** 只管理A的输入模式；没有实现B的解谜/计时规则。 */
export class FlowState {
  mode: InputMode = 'menu';
  private beforePause: InputMode = 'explore';
  set(mode: InputMode): void { this.mode = mode; }
  pause(): boolean {
    if (['menu', 'paused', 'ending'].includes(this.mode)) return false;
    this.beforePause = this.mode; this.mode = 'paused'; return true;
  }
  resume(): InputMode { if (this.mode === 'paused') this.mode = this.beforePause; return this.mode; }
}
