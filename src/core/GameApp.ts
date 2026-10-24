import { Color, DirectionalLight, HemisphereLight, PerspectiveCamera, Raycaster, Scene, SRGBColorSpace, Vector2, Vector3, WebGLRenderer } from 'three';
import type { CoreEvent, InputMode, MechanicsEvent, MechanicsPort, RunOptions, UIPort, UIActions } from '../shared/contracts.ts';
import { EventBus } from './EventBus.ts';
import { FlowState } from './FlowState.ts';
import { PlayerController } from '../player/PlayerController.ts';
import { InputController } from '../player/InputController.ts';
import { SCENES } from '../scenes/catalog.ts';
import { WhiteboxScene } from '../scenes/WhiteboxScene.ts';
import type { SceneFactory, ScenePort } from '../shared/sceneContracts.ts';
interface Options { parent: HTMLElement; mechanics: MechanicsPort; createUI(parent:HTMLElement,actions:UIActions):UIPort; createScene?:SceneFactory; development?:boolean; simulateComplete?:()=>void; simulateFailure?:()=>void }
export class GameApp {
  readonly events=new EventBus<CoreEvent>();
  private renderer:WebGLRenderer;
  private camera=new PerspectiveCamera(65,1,.1,100);
  private scene=new Scene();
  private player:PlayerController;
  private input:InputController;
  private ui:UIPort;
  private flow=new FlowState();
  private current:ScenePort;
  private levelIndex=0;
  private options:RunOptions={dorm:'榴园',destination:'一教',sleepTime:'23:30',seed:20261024};
  private unlocked=false;private exitReported=false;private phaseTime=0;private interaction='';private status='';private ending='';
  private unsub:()=>void;private frameId=0;private last=0;private disposed=false;
  private ray=new Raycaster();private direction=new Vector3();private abort=new AbortController();
  constructor(private config:Options){
    this.renderer=new WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.outputColorSpace=SRGBColorSpace;this.renderer.setClearColor('#95aa91');this.renderer.domElement.tabIndex=0;this.renderer.domElement.setAttribute('aria-label','第一人称校园游戏场景');config.parent.append(this.renderer.domElement);
    this.scene.background=new Color('#95aa91');this.scene.add(new HemisphereLight('#f6ffe2','#556b4d',2));const sun=new DirectionalLight('#fff3cf',2.5);sun.position.set(3,8,5);this.scene.add(sun);
    this.current=this.createScene(0);this.scene.add(this.current.root);this.player=new PlayerController(this.camera);this.player.reset();
    this.input=new InputController(this.renderer.domElement,{mode:()=>this.flow.mode,interact:()=>this.interact(),confirm:()=>this.confirm(),escape:()=>this.escape(),retry:()=>this.retry(),pause:()=>this.pause(),look:(x,y)=>this.player.look(x,y),status:m=>this.status=m});
    this.ui=config.createUI(config.parent,{start:o=>this.start(o),confirmPhone:()=>this.beginRun(),resume:()=>this.resume(),retry:()=>this.retry(),menu:()=>this.menu(),cancelPuzzle:()=>this.cancelPuzzle(),drag:(id,p)=>{if(this.flow.mode==='puzzle')config.mechanics.moveWindow(id,p)},confirm:()=>this.confirm(),simulateComplete:config.development?config.simulateComplete:undefined,simulateFailure:config.development?config.simulateFailure:undefined});
    this.unsub=config.mechanics.subscribe(e=>this.onMechanics(e));
    window.addEventListener('resize',()=>this.resize(),{signal:this.abort.signal});this.resize();this.menu();this.frameId=requestAnimationFrame(this.frame);
  }
  private setMode(mode:InputMode):void{this.flow.set(mode);this.phaseTime=0;this.input.clear();if(mode!=='explore')this.input.release();this.events.emit({type:'MODE_CHANGED',mode});}
  private resize():void{const w=this.config.parent.clientWidth,h=this.config.parent.clientHeight;this.renderer.setSize(w,h);this.camera.aspect=w/Math.max(1,h);this.camera.updateProjectionMatrix();}
  private createScene(index:number):ScenePort{return this.config.createScene?.(SCENES[index])??new WhiteboxScene(SCENES[index]);}
  private loadLevel(index:number,notifyMechanics=true):void{
    this.current.dispose();this.levelIndex=index;this.current=this.createScene(index);this.scene.add(this.current.root);this.player.reset();this.unlocked=false;this.exitReported=false;this.interaction='';this.status='';
    if(notifyMechanics){this.config.mechanics.enterLevel(SCENES[index].level);this.events.emit({type:'LEVEL_STARTED',level:SCENES[index].level});}
  }
  private start(options:RunOptions):void{this.options={...options};this.loadLevel(0,false);this.setMode('intro');this.camera.position.set(-3,3.5,5);this.camera.lookAt(0,1,0);}
  private beginRun():void{this.config.mechanics.start(this.options);this.config.mechanics.enterLevel(SCENES[0].level);this.player.reset();this.setMode('explore');this.events.emit({type:'LEVEL_STARTED',level:SCENES[0].level});this.input.requestLock();}
  private menu():void{this.setMode('menu');this.loadLevel(0,false);this.camera.position.set(3.8,3.1,6);this.camera.lookAt(0,1,-1);}
  private nearExtra():boolean{const p=this.current.extraPoint;if(this.camera.position.distanceTo(p)>2.5)return false;this.camera.getWorldDirection(this.direction);return p.clone().sub(this.camera.position).normalize().dot(this.direction)>.6;}
  private target():boolean{this.ray.setFromCamera(new Vector2(0,0),this.camera);return this.ray.intersectObjects(this.current.objects).some(h=>h.object.visible&&h.distance<3.2);}
  private interact():void{
    if(this.flow.mode==='intro'){this.player.reset();this.setMode('phone');return;}
    if(this.flow.mode!=='explore'||this.unlocked)return;
    const level=SCENES[this.levelIndex].level;
    if((level==='bike'||level==='crowd')&&this.nearExtra()){
      if(level==='bike')this.status='自有单车被卡住了，请使用前面的共享单车。';
      else{this.config.mechanics.reportAction('collect-bun');this.current.hideExtra();this.status='已发送领取包子请求，是否获得由 B 决定。';}return;
    }
    if(!this.target())return;
    this.config.mechanics.beginPuzzle(level);this.setMode('puzzle');this.events.emit({type:'GLITCH_ENTERED'});
  }
  private confirm():void{if(this.flow.mode==='puzzle')this.config.mechanics.confirmPuzzle();}
  private cancelPuzzle():void{if(this.flow.mode!=='puzzle')return;this.config.mechanics.cancelPuzzle();this.setMode('explore');this.events.emit({type:'GLITCH_EXITED'});}
  private escape():void{if(this.flow.mode==='puzzle')this.cancelPuzzle();else if(this.flow.mode!=='paused')this.pause();}
  private pause():void{if(this.flow.pause()){this.phaseTime=Math.max(0,this.phaseTime);this.input.release();this.events.emit({type:'MODE_CHANGED',mode:'paused'});}}
  private resume():void{if(this.flow.mode!=='paused')return;const mode=this.flow.resume();this.last=performance.now();this.input.clear();if(mode==='explore')this.input.requestLock();this.events.emit({type:'MODE_CHANGED',mode});}
  private retry():void{if(['menu','intro','phone'].includes(this.flow.mode))return;this.setMode('explore');this.config.mechanics.retryCheckpoint(SCENES[this.levelIndex].level);if(this.flow.mode==='ending')return;this.rebuildCheckpoint();}
  private rebuildCheckpoint():void{this.current.dispose();this.current=this.createScene(this.levelIndex);this.scene.add(this.current.root);this.player.reset();this.unlocked=false;this.exitReported=false;this.status='检查点已重置。';this.setMode('explore');}
  private onMechanics(event:MechanicsEvent):void{
    this.events.emit(event);
    if(event.type==='ALIGNMENT_SUCCESS'&&event.level===SCENES[this.levelIndex].level&&this.flow.mode==='puzzle'){
      this.unlocked=true;this.current.setUnlocked();this.setMode('explore');this.events.emit({type:'GLITCH_EXITED'});this.status='通路开启，向前穿过绿色出口。';
    }else if(event.type==='ALIGNMENT_FAILED'){this.status=event.message;}
    else if(event.type==='LEVEL_COMPLETED'&&event.level===SCENES[this.levelIndex].level&&!['ending','menu','transition','riding'].includes(this.flow.mode)){this.advance();}
    else if(event.type==='GAME_COMPLETED'){this.ending=event.message??(event.ending==='easter-egg'?'白跑一趟：今天停课。':'签到成功！');this.setMode('ending');}
    else if(event.type==='GAME_FAILED'){this.ending=event.message;this.setMode('ending');}
  }
  private advance():void{if(this.levelIndex>=SCENES.length-1)return;this.setMode(SCENES[this.levelIndex].level==='bike'?'riding':'transition');}
  private frame=(now:number):void=>{
    if(this.disposed)return;const dt=this.last?Math.max(0,(now-this.last)/1000):0;this.last=now;
    const mode=this.flow.mode,simulationDt=Math.min(dt,.05);
    if(!['menu','intro','phone','paused','ending'].includes(mode))this.config.mechanics.update(dt,mode);
    if(this.flow.mode===mode){
      if(mode==='intro'){this.phaseTime+=simulationDt;const t=Math.min(1,this.phaseTime/2.5);this.camera.position.set(-3*(1-t),3.5+(1.65-3.5)*t,5-.6*t);this.camera.lookAt(0,1.65,-1);if(t===1){this.player.reset();this.setMode('phone');}}
      else if(mode==='explore'){
        this.player.update(simulationDt,this.input.keys,this.current.colliders);this.current.animate(simulationDt);
        this.interaction=this.unlocked?'':this.target()?`E · ${SCENES[this.levelIndex].objectLabel}`:(['bike','crowd'].includes(SCENES[this.levelIndex].level)&&this.nearExtra()?'E · '+(this.levelIndex===1?'尝试取自己的单车':'取包子'):this.input.locked?'':'点击场景后移动，或按住鼠标拖动观察');
        if(this.unlocked&&!this.exitReported&&this.camera.position.z<-4.4){
          this.exitReported=true;
          if(this.config.mechanics.kind==='development-stub')this.advance();
          else this.config.mechanics.reportAction('exit-reached');
        }
      }else if(mode==='transition'||mode==='riding'){
        this.phaseTime+=simulationDt;
        if(this.phaseTime>=(mode==='riding'?5:.65)){
          if(mode==='riding')this.config.mechanics.reportAction('ride-finished');
          if(this.flow.mode===mode){this.loadLevel(this.levelIndex+1);this.setMode('explore');}
        }
      }
    }
    this.ui.update({mode:this.flow.mode,level:SCENES[this.levelIndex],options:this.options,mechanics:this.config.mechanics.getSnapshot(),interaction:this.flow.mode==='explore'?this.interaction:'',unlocked:this.unlocked,pointerLocked:this.input.locked,status:this.status,ending:this.ending,development:this.config.mechanics.kind==='development-stub'});
    this.renderer.render(this.scene,this.camera);this.frameId=requestAnimationFrame(this.frame);
  };
  dispose():void{this.disposed=true;cancelAnimationFrame(this.frameId);this.abort.abort();this.unsub();this.input.dispose();this.ui.dispose();this.current.dispose();this.config.mechanics.dispose();this.events.clear();this.renderer.dispose();this.renderer.domElement.remove();}
}
