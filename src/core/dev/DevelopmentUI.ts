import type { UIPort, UIState, UIActions, RunOptions } from '../../shared/contracts.ts';
/** 临时调试界面，集中放A目录；C交付后可整体替换，不占用src/ui。 */
export class DevelopmentUI implements UIPort {
  private root: HTMLDivElement;
  private actions: UIActions;
  private mode = '';
  private drags = new Map<string, HTMLDivElement>();
  private drag: { id:string; offsetX:number; offsetY:number; pointer:number } | null = null;
  private abort = new AbortController();
  private current: UIState | null = null;
  constructor(parent:HTMLElement, actions:UIActions) {
    this.actions=actions;this.root=document.createElement('div');this.root.className='dev-ui';
    this.root.innerHTML=`<header><b>卡点早八<span>最后一分钟</span></b><small>A / CORE INTEGRATION</small><strong data-clock>--:--</strong></header><div class="dev-badge">A 操作框架 · B 机制 / C 正式美术待接入</div><section class="task"><small data-title></small><p data-hint></p></section><div class="crosshair">+</div><div class="interact" data-interaction></div><footer><span>WASD 移动 · 点击场景锁定鼠标 / 按住拖动观察</span><span>E 交互 · SPACE 确认 · ESC 取消/暂停 · R 重试</span></footer><div class="puzzle hidden"><div class="puzzle-heading"><b>卡窗操作接入测试</b><p>拖动窗口标题栏 · 空格将确认请求交给 B · Esc 返回</p></div><div class="puzzle-board"></div><div class="puzzle-status"></div><div class="debug-actions"></div></div><div class="modal hidden"></div><div class="toast"></div>`;
    parent.append(this.root);
    const signal=this.abort.signal;
    this.root.addEventListener('click',this.click,{signal});
    this.root.addEventListener('pointerdown',this.down,{signal});
    this.root.addEventListener('pointermove',this.move,{signal});
    this.root.addEventListener('pointerup',this.up,{signal});
    this.root.addEventListener('pointercancel',this.up,{signal});
    window.addEventListener('blur',this.up,{signal});
  }
  private find<T extends HTMLElement=HTMLElement>(selector:string):T{return this.root.querySelector<T>(selector)!;}
  private click=(e:MouseEvent):void=>{
    const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');if(!button)return;
    switch(button.dataset.action){
      case 'start':{const form=this.find<HTMLFormElement>('form');const data=new FormData(form);this.actions.start({dorm:'榴园',destination:data.get('destination') as RunOptions['destination'],sleepTime:data.get('sleepTime') as RunOptions['sleepTime'],seed:20261024});break;}
      case 'unavailable':this.find('.toast').textContent='该宿舍路线正在开发，请选择榴园。';break;
      case 'phone':this.actions.confirmPhone();break;
      case 'resume':this.actions.resume();break;
      case 'retry':this.actions.retry();break;
      case 'menu':this.actions.menu();break;
      case 'simulate':this.actions.simulateComplete?.();break;
      case 'failure':this.actions.simulateFailure?.();break;
      case 'confirm':this.actions.confirm();break;
      case 'cancel':this.actions.cancelPuzzle();break;
    }
  };
  private down=(e:PointerEvent):void=>{
    const title=(e.target as HTMLElement).closest<HTMLElement>('.window-title');
    if(!title||this.current?.mode!=='puzzle')return;
    const id=title.dataset.id!,w=this.current.mechanics.windows.find(w=>w.id===id);if(!w?.draggable)return;
    e.preventDefault();const board=this.find('.puzzle-board').getBoundingClientRect();
    this.drag={id,offsetX:(e.clientX-board.left)/board.width*1920-w.x,offsetY:(e.clientY-board.top)/board.height*1080-w.y,pointer:e.pointerId};
    title.setPointerCapture(e.pointerId);
  };
  private move=(e:PointerEvent):void=>{
    if(!this.drag||this.current?.mode!=='puzzle')return;
    const board=this.find('.puzzle-board').getBoundingClientRect();const w=this.current.mechanics.windows.find(w=>w.id===this.drag!.id);if(!w)return;
    this.actions.drag(this.drag.id,{x:Math.max(0,Math.min(1920-w.width,(e.clientX-board.left)/board.width*1920-this.drag.offsetX)),y:Math.max(0,Math.min(1080-w.height,(e.clientY-board.top)/board.height*1080-this.drag.offsetY))});
  };
  private up=():void=>{this.drag=null;};
  update(s:UIState):void{
    this.current=s;const seconds=s.mechanics.remainingSeconds;
    this.find('[data-clock]').textContent=seconds===null?'--:--':`${String(Math.floor(Math.max(0,seconds)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;
    this.find('[data-title]').textContent=`${s.level.title} · 榴园 → ${s.options.destination}`;
    this.find('[data-hint]').textContent=s.unlocked?'通路已开启，向前穿过绿色出口。':s.level.hint;
    this.find('[data-interaction]').textContent=s.interaction;
    this.find('.toast').textContent=s.status;
    this.find('.dev-badge').classList.toggle('hidden',!s.development);
    this.find('.crosshair').classList.toggle('hidden',s.mode!=='explore');
    this.find('.puzzle').classList.toggle('hidden',s.mode!=='puzzle');
    if(this.mode!==s.mode){
      this.drag=null;this.mode=s.mode;const modal=this.find('.modal');modal.classList.toggle('hidden',['explore','puzzle'].includes(s.mode));
      const button=(action:string,label:string)=>`<button type="button" data-action="${action}">${label}</button>`;
      switch(s.mode){
        case 'menu':modal.innerHTML=`<div class="sheet"><small>LIUYUAN → CLASSROOM / 07:51</small><h1>早八，只差<br><em>最后一分钟。</em></h1><p>第一人称操作与关卡串联框架。<br>当前尚未接入 B 的计时、通关规则与 C 的正式视觉。</p><form><label>出生宿舍</label><div class="choices"><span class="selected">榴园 · 已开放</span>${button('unavailable','桃园 · 未开放')}${button('unavailable','桂园 · 未开放')}</div><label>目标教学楼</label><select name="destination"><option>一教</option><option>二教</option></select><label>昨晚几点入睡？</label><select name="sleepTime"><option>22:30</option><option selected>23:30</option><option>00:30</option><option>01:30</option><option>02:30</option></select></form>${button('start','进入榴园 →')}<small>计时显示 --:-- 代表 B 尚未提供时间状态。</small></div>`;break;
        case 'intro':modal.innerHTML='<div class="caption"><small>闹钟响了。</small><h2>今天，早八。</h2><p>宿舍醒来镜头占位 · 按 E 拿起手机</p></div>';break;
        case 'phone':modal.innerHTML=`<div class="sheet phone"><small>07:-- · 醒来时间待 B 计算</small><h2>08:00<br>早八课程</h2><p>今天的目标：${s.options.destination}<br>昨晚入睡：${s.options.sleepTime}</p>${button('phone','确认课表，开始赶路 →')}</div>`;break;
        case 'paused':modal.innerHTML=`<div class="sheet"><small>PAUSED</small><h2>暂停一下。</h2><p>玩家操作已停，B 的计时更新也已停止。</p>${button('resume','继续游戏 →')}${button('menu','返回菜单')}</div>`;break;
        case 'riding':modal.innerHTML='<div class="caption"><h2>骑行前往教学区</h2><p>预设骑行转场占位 · 视角与操作暂时锁定</p></div>';break;
        case 'transition':modal.innerHTML='<div class="caption"><h2>前往下一地点…</h2></div>';break;
        case 'ending':modal.innerHTML=`<div class="sheet"><small>RUN FINISHED</small><h2 data-ending></h2><p>${s.development?'这是联调结果，正式胜负与彩蛋由 B 判定。':'本局结束。'}</p>${button('retry','重试当前检查点')}${button('menu','返回菜单')}</div>`;this.find('[data-ending]').textContent=s.ending;break;
      }
      if(s.mode==='puzzle')this.find('.debug-actions').innerHTML=`${button('confirm','空格 / 发送确认')}${button('cancel','取消')}${s.development&&this.actions.simulateComplete?button('simulate','仅联调：模拟本关完成'):''}${s.development&&this.actions.simulateFailure?button('failure','仅联调：模拟失败'):''}`;
      if(s.mode!=='puzzle'){this.find('.puzzle-board').replaceChildren();this.drags.clear();}
    }
    if(s.mode==='puzzle'){
      const board=this.find('.puzzle-board');
      for(const w of s.mechanics.windows){let node=this.drags.get(w.id);if(!node){node=document.createElement('div');node.className='test-window';const title=document.createElement('div');title.className='window-title';title.dataset.id=w.id;title.textContent=w.title;node.append(title);const body=document.createElement('div');body.className='window-body';body.textContent=w.draggable?'鼠标拖动此标题栏':'B 输出窗口数据后呈现';node.append(body);board.append(node);this.drags.set(w.id,node);}node.style.left=`${w.x/1920*100}%`;node.style.top=`${w.y/1080*100}%`;node.style.width=`${w.width/1920*100}%`;node.style.height=`${w.height/1080*100}%`;node.dataset.ready=String(s.mechanics.puzzleState==='ready');}
      for(const[id,node]of this.drags)if(!s.mechanics.windows.some(w=>w.id===id)){node.remove();this.drags.delete(id);}
      this.find('.puzzle-status').textContent=s.mechanics.message??s.mechanics.puzzleState;
    }
  }
  dispose():void{this.abort.abort();this.root.remove();}
}
