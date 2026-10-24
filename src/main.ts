import { GameApp } from './core/GameApp.ts';
import { DevelopmentMechanics } from './core/dev/DevelopmentMechanics.ts';
import { DevelopmentUI } from './core/dev/DevelopmentUI.ts';
import './core/dev/development.css';

// B交付后，仅在这里把mechanics替换为实现MechanicsPort的适配器。
// C交付后，替换createUI和场景视觉工厂；无需接管玩家输入。
const root=document.querySelector<HTMLDivElement>('#app')!;
const mechanics=new DevelopmentMechanics();
const development=new URLSearchParams(location.search).get('dev')==='1';
try{
  const app=new GameApp({parent:root,mechanics,development,createUI:(p,a)=>new DevelopmentUI(p,a),simulateComplete:()=>mechanics.simulateComplete(),simulateFailure:()=>mechanics.simulateFailure()});
  window.addEventListener('pagehide',()=>app.dispose(),{once:true});
}catch(error){
  root.textContent='3D 场景初始化失败，请开启浏览器硬件加速并使用支持 WebGL 2 的浏览器。';
  console.error(error);
}
