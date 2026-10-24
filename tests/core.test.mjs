import test from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus.ts';
import { FlowState } from '../src/core/FlowState.ts';
import { intersects, moveWithCollision } from '../src/player/collision.ts';
import { DevelopmentMechanics } from '../src/core/dev/DevelopmentMechanics.ts';
import { WhiteboxScene } from '../src/scenes/WhiteboxScene.ts';
import { SCENES } from '../src/scenes/catalog.ts';

test('暂停恢复原输入模式，重复暂停不覆盖原模式',()=>{
  for(const mode of ['explore','puzzle','phone','intro','riding','transition']){
    const flow=new FlowState();flow.set(mode);assert.equal(flow.pause(),true);assert.equal(flow.pause(),false);flow.resume();assert.equal(flow.mode,mode);
  }
});
test('菜单与结算不进入可恢复的游戏暂停',()=>{const f=new FlowState();assert.equal(f.pause(),false);f.set('ending');assert.equal(f.pause(),false);});
test('事件订阅可解除，不残留关卡监听器',()=>{const bus=new EventBus();let count=0;const off=bus.subscribe(()=>count++);bus.emit({});off();bus.emit({});assert.equal(count,1);});
test('圆形玩家足迹与碰撞盒角落按实际距离判定',()=>{const box={minX:0,maxX:1,minZ:0,maxZ:1};assert.equal(intersects({x:-.2,z:-.2},.25,box),false);assert.equal(intersects({x:-.1,z:-.1},.25,box),true);});
test('大帧位移也不能穿过薄墙',()=>{const wall={minX:-1,maxX:1,minZ:0,maxZ:.1};const p=moveWithCollision({x:0,z:2},0,-5,.25,[wall]);assert.ok(p.z>=.35-1e-8);});
test('撞墙后仍可沿墙滑动',()=>{const wall={minX:0,maxX:.1,minZ:-20,maxZ:20};const p=moveWithCollision({x:-1,z:2},3,-2,.25,[wall]);assert.ok(p.x<=-.25);assert.ok(p.z<.1);});
test('联调占位不伪造计时、Ready或空格通关',()=>{
  const b=new DevelopmentMechanics();const events=[];b.subscribe(e=>events.push(e));b.start({dorm:'榴园',destination:'一教',sleepTime:'23:30',seed:1});b.beginPuzzle('door');b.update(10,'puzzle');b.confirmPuzzle();assert.equal(b.getSnapshot().remainingSeconds,null);assert.equal(b.getSnapshot().puzzleState,'active');assert.deepEqual(events.map(e=>e.type),['ALIGNMENT_FAILED']);
});
test('拖动仅改可拖窗口，重试恢复布局',()=>{const b=new DevelopmentMechanics();b.beginPuzzle('door');b.moveWindow('fixed',{x:1,y:2});assert.equal(b.getSnapshot().windows[0].x,320);b.moveWindow('movable',{x:1,y:2});assert.equal(b.getSnapshot().windows[1].x,1);b.retryCheckpoint('door');b.beginPuzzle('door');assert.equal(b.getSnapshot().windows[1].x,1030);});
test('仅显式联调动作发出模拟完成事件，签到模拟进入结局',()=>{const b=new DevelopmentMechanics();let events=[];b.subscribe(e=>events.push(e));b.enterLevel('qr');b.simulateComplete();assert.deepEqual(events.map(e=>e.type),['ALIGNMENT_SUCCESS','GAME_COMPLETED']);b.dispose();b.simulateFailure();assert.equal(events.length,2);});
test('旋转交互标记后解锁仍移除原碰撞体，六个场景出口都可通行',()=>{
  for(const desc of SCENES){const scene=new WhiteboxScene(desc);scene.animate(2);const before=moveWithCollision({x:0,z:2},0,-8,.28,scene.colliders);assert.ok(before.z>-.7);scene.setUnlocked();scene.setUnlocked();const after=moveWithCollision({x:0,z:2},0,-8,.28,scene.colliders);assert.ok(after.z<-4.4);scene.dispose();assert.equal(scene.colliders.length,0);}
});
