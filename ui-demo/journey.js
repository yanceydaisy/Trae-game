import { ACTIVE, BUDGET, DEADLINE, GATES, newRun, wakeTime, timeText, enter,
  restoreCheckpoint, setFreeze, roadConnected, busAligned, scanAligned, gaps, clamp, move, tick } from './mechanics.mjs';
import { campusMapMarkup, pixelClock } from './pixel-art.mjs';

const $ = id => document.getElementById(id);
const app = $('campusApp');
$('campusMap').innerHTML = campusMapMarkup();
$('campusMap').style.setProperty('--route-length', Math.ceil($('campusMap').querySelector('.route-progress').getTotalLength()));
const roadMarkup = $('stage').innerHTML;
let s = newRun(), view = '', scale = 1, drag = null, last = 0;
let keyHeld = false, buttonHeld = false, locked = false, muted = true, audio;
let lastClock = '', wasConnected = false, introAge = 0;
const order = ['road', 'bus', 'crowd', 'scan'];
const sceneTitles = {
  road: ['先把门，卡出去。', '按住空格停住时间，再拖动右边窗口。', '第一段 · 出宿舍'],
  bus: ['等车门，卡到站。', '等小公交靠近站台，卡住时间，再把站台拖到车门旁。', '第二段 · 校园小公交'],
  crowd: ['包子，要趁热。', '卡住人群，上下拖动通道，钻过下一处空隙。', '第三段 · 食堂买包子'],
  scan: ['最后一下，卡准。', '把手机取景框与签到二维码重合。', '第四段 · 一教签到']
};

function tone(freq = 660, duration = .09) {
  if (muted) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, audio.currentTime);
    gain.gain.setValueAtTime(.07, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration);
  } catch { /* Audio is optional; gameplay continues without it. */ }
}
function title(h, p, e) { $('heading').textContent = h; $('subtitle').innerHTML = p; $('eyebrow').textContent = e; }
function show(id, yes) { $(id).classList.toggle('hidden', !yes); }
function resize() {
  const w = $('stageWrap').clientWidth;
  if (w) { scale = w / 900; $('stage').style.transform = `scale(${scale})`; $('stageWrap').style.height = `${440 * scale}px`; }
}
new ResizeObserver(resize).observe($('stageWrap'));
new ResizeObserver(() => {
  const width = $('campusMap').getBoundingClientRect().width;
  if (width) $('campusMap').style.setProperty('--map-scale', width / 1100);
}).observe($('campusMap'));
function updateClock() {
  const value = timeText(s.seconds);
  if (value !== lastClock) {
    $('clock').innerHTML = `${pixelClock(value)}<small>${s.mode === 'sleep' ? '预计明早醒来 · 08:00 上课' : '08:00 上课 · 别迟到'}</small>`;
    lastClock = value;
  }
  $('clock').classList.toggle('urgent', s.seconds >= 28680);
}
function clearInput() { keyHeld = buttonHeld = locked = false; drag = null; setFreeze(s, false); }
function updateFreeze() {
  const old = s.frozen; setFreeze(s, keyHeld || buttonHeld || locked);
  if (!old && s.frozen) tone(280, .13);
  if (!s.frozen) drag = null;
  updateHud();
}
function updateHud() {
  if (s.energy <= 0 || !ACTIVE.includes(s.mode)) keyHeld = buttonHeld = locked = false;
  app.classList.toggle('frozen', s.frozen);
  $('stateLabel').textContent = s.paused ? '已暂停' : s.mode === 'boarding' ? '上车成功，坐稳了。' : s.frozen ? '时间卡住了，趁现在。' : s.energy <= 0 ? '本关卡顿用完了' : '时间正在流动';
  $('stateDot').style.background = s.frozen ? 'var(--green)' : 'var(--red)';
  $('freezeBtn').setAttribute('aria-pressed', String(s.frozen));
  $('toggleFreezeBtn').setAttribute('aria-pressed', String(locked));
  $('toggleFreezeBtn').textContent = locked ? '点击恢复运行' : '点击锁定卡顿';
  $('freezeBtn').disabled = $('toggleFreezeBtn').disabled = !ACTIVE.includes(s.mode) || s.energy <= 0;
  $('energyValue').textContent = s.energy.toFixed(1) + 's';
  $('energyFill').style.width = `${s.maxEnergy ? s.energy / s.maxEnergy * 100 : 0}%`;
  if ($('scanPhone')) $('scanPhone').setAttribute('aria-disabled', String(!s.frozen));
}
function stepper(mode) {
  const index = mode === 'boarding' ? 1 : order.indexOf(mode);
  for (let i = 0; i < 4; i++) $('step' + (i + 1)).className = i < index ? 'complete' : i === index ? 'active' : '';
}
function actorMarkup(id = 'actor') {
  return `<div class="actor" id="${id}"><span class="head"></span><span class="body"></span><span class="bag"></span><span class="leg"></span><span class="leg two"></span></div>`;
}
function busMarkup() {
  return `<div class="stage-grid"></div><div class="bus-road"></div><div class="stage-banner"><span>榴园站 · 校园小公交</span><span class="freeze-word">PING 999+ / TIME FROZEN</span></div>
  <div class="door-guide"></div><div class="bus-marker">站台出口</div><div class="bus-status" id="busStatus">小公交正在进站</div>
  <div class="scene-window station-window" id="platformWindow"><div class="window-head" id="platformHandle" role="slider" aria-label="站台窗口，卡顿时上下拖动或按方向键" aria-valuemin="45" aria-valuemax="190" aria-valuenow="70" tabindex="0"><span>站台 · 上下拖动接车门</span><span>↕</span></div><div class="station-sign">校园小公交<small>榴园站 → 教学区</small></div><div class="floor"></div></div>
  <div class="bus-vehicle" id="busVehicle"><div class="bus-top">校园小公交 · 往教学区</div><div class="bus-glass"><span><i class="bus-passenger"></i></span><span><i class="bus-passenger"></i></span><span></span></div><div class="bus-door" id="busDoor"></div><div class="bus-stripe"></div><div class="bus-name">下一站 · 食堂</div><div class="bus-wheel"></div><div class="bus-wheel second"></div></div>${actorMarkup()}<div class="scene-hint" id="sceneHint"></div>`;
}
function crowdMarkup() {
  return `<div class="canteen-floor"></div><div class="stage-banner"><span>食堂 · 包子窗口</span><span class="freeze-word">PING 999+ / TIME FROZEN</span></div>
  <div class="crowd-lane" id="crowdLane"></div><div class="crowd-target"></div>
  ${GATES.map((x, i) => `<div class="gap-label" style="left:${x}px">人群 ${i + 1}</div><div class="crowd-column" id="crowd${i}" style="left:${x}px"><div class="gap-marker" id="gap${i}"></div>${[-210,-160,-110,80,130,180].map((_, j) => `<div class="crowd-person" id="person${i}-${j}"></div>`).join('')}</div>`).join('')}
  <div class="canteen-stall"><div class="stall-awning"></div><div class="stall-name">热包子</div><div class="stall-port"></div><div class="bun-tray">${'<i class="bun"></i>'.repeat(4)}</div></div>
  <div class="crowd-handle" id="crowdHandle" role="slider" aria-label="通道窗口，卡顿时上下拖动或按方向键钻过人群" aria-valuemin="85" aria-valuemax="340" aria-valuenow="210" tabindex="0">拖动通道 · 找空隙 ↕</div>${actorMarkup()}<div class="scene-hint" id="sceneHint"></div>`;
}
function qrSvg() {
  let svg = '<svg class="qr-code" viewBox="0 0 29 29" aria-label="游戏中的签到二维码图案" role="img"><rect width="29" height="29" fill="var(--white)"/>';
  for (let y = 0; y < 29; y++) for (let x = 0; x < 29; x++) {
    if ((x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20)) continue;
    if ((x * 17 + y * 13 + x * y) % 7 < 3) svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="currentColor"/>`;
  }
  for (const [x,y] of [[0,0],[22,0],[0,22]]) svg += `<rect x="${x}" y="${y}" width="7" height="7" fill="currentColor"/><rect x="${x+1}" y="${y+1}" width="5" height="5" fill="var(--white)"/><rect x="${x+2}" y="${y+2}" width="3" height="3" fill="currentColor"/>`;
  return svg + '</svg>';
}
function scanMarkup() {
  return `<div class="scan-wall"></div><div class="stage-banner"><span>第一教学楼 · 早八签到</span><span class="freeze-word">PING 999+ / TIME FROZEN</span></div><div class="class-label">终于到了。<small>${s.hasBun ? '包子到手，签到还差一下。' : '只差最后一下，对准就好。'}</small></div><div class="qr-poster"><h3>课堂签到</h3>${qrSvg()}<small>请将二维码置于取景框内</small></div><div class="scan-phone" id="scanPhone" role="slider" aria-label="手机取景框，卡顿时拖动或使用方向键对准二维码" aria-valuemin="20" aria-valuemax="700" aria-valuenow="280" tabindex="0"><div class="phone-grip">拖动手机 · 对准签到码</div><div class="finder" id="finder"></div><div class="scan-progress"><div id="scanFill"></div></div><div class="phone-bottom" id="scanLabel">等待对准</div></div><div class="scene-hint" id="sceneHint">按住空格，再把手机框拖到右边二维码上。</div>`;
}
function updateSleep() {
  s.wake = wakeTime(s.sleep, s.seed); s.seconds = s.wake; lastClock = '';
  for (const btn of document.querySelectorAll('[data-sleep]')) {
    const selected = btn.dataset.sleep === s.sleep;
    btn.classList.toggle('selected', selected); btn.setAttribute('aria-pressed', String(selected));
  }
  $('predictedWake').textContent = timeText(s.wake); updateClock();
}
function renderMode(force = false) {
  if (!force && view === s.mode) return;
  const oldView = view; view = s.mode; wasConnected = false; lastClock = ''; clearInput();
  app.classList.remove('boarding'); $('stage').classList.remove('connected');
  show('sleepView', s.mode === 'sleep'); show('introView', s.mode === 'intro');
  show('resultView', ['won', 'lost'].includes(s.mode)); show('setup', s.mode === 'map'); show('practice', s.mode === 'map');
  show('mapView', ['map', 'sleep', 'intro', 'travel'].includes(s.mode));
  show('gameView', ACTIVE.includes(s.mode) || s.mode === 'boarding');
  $('gameView').inert = !ACTIVE.includes(s.mode) && s.mode !== 'boarding';
  $('resultView').classList.toggle('failed', s.mode === 'lost');
  $('campusMap').classList.toggle('travel', s.mode === 'travel');
  $('introView').classList.remove('introView-enter');
  if (s.mode === 'map') {
    title('还有十分钟。', '卡住时间，把道路卡上。<br>今天，应该还赶得上早八吧。', '校园里，又一个平常的早晨。');
    $('mapStatus').innerHTML = '今日目标<span>出宿舍 · 坐小公交 · 买包子 · 签到</span>';
  } else if (s.mode === 'sleep') {
    title('昨晚，再刷一会儿。', '你放下手机的时间，会改变明早的起点。', '序章 · 睡前的最后一个决定'); updateSleep();
  } else if (s.mode === 'intro') {
    introAge = 0; $('introView').classList.add('introView-enter');
    $('wakeTime').textContent = timeText(s.wake, true);
    const mins = Math.ceil((DEADLINE - s.wake) / 60);
    $('wakeCopy').innerHTML = `你摸到枕边的手机。<br>距离早八，还有 ${mins} 分钟。`;
    title('闹钟响了。', '四张床，一间还没醒来的宿舍。', '清晨 · 榴园'); tone(440, .22);
  } else if (ACTIVE.includes(s.mode)) {
    title(...sceneTitles[s.mode]); stepper(s.mode);
    if (s.mode === 'road') $('stage').innerHTML = roadMarkup;
    if (s.mode === 'bus') $('stage').innerHTML = busMarkup();
    if (s.mode === 'crowd') $('stage').innerHTML = crowdMarkup();
    if (s.mode === 'scan') $('stage').innerHTML = scanMarkup();
    resize(); updateStage();
  } else if (s.mode === 'boarding') {
    app.classList.add('boarding'); stepper('bus');
    title('上车了，坐稳！', '这回没有看着小公交从眼前开走。', '第二段 · 上车成功'); tone(880, .15);
  } else if (s.mode === 'travel') {
    const text = { bus: ['出宿舍成功', '前往校园小公交站', '下一站，小公交。'], crowd: ['小公交到站', '去食堂买个热包子', '早饭，还是得吃。'], scan: ['热包子到手', '正在赶往第一教学楼', '最后冲向一教。'] }[s.nextStage];
    $('mapStatus').innerHTML = `${text[0]}<span>${text[1]}</span>`;
    title(text[2], '这条熟悉的路，今天跑得格外着急。', '榴园 → 小公交 → 食堂 → 一教');
    if (s.nextStage === 'scan') tone(1046, .13);
  } else if (['won','lost'].includes(s.mode)) {
    const won = s.mode === 'won';
    $('resultStamp').textContent = won ? '签到成功' : '签到失败';
    $('resultTitle').textContent = won ? (s.seconds >= DEADLINE - 10 ? '极限卡点，赶上！' : '这次，赶上了。') : (s.hasBun ? '包子还是热的。' : '早八，晚了一步。');
    $('resultTime').textContent = won ? timeText(s.seconds) : '平时分 −5';
    $('resultCopy').innerHTML = won ? `第一教学楼 · 早八签到<br>${s.hasBun ? '包子买到了，平时分也保住了。' : '还有时间，翻开课本。'}` : `${s.failure}<br>重试这一段会回到该关入口的时间和预算。`;
    show('checkpointBtn', !won && !!s.checkpoint);
    $('againBtn').textContent = won ? '再赶一次早八 →' : '整局重来';
    title(won ? '刚好，赶上。' : '差一点，就到了。', won ? '四段路，一次准时签到。' : '还可以重新出发。', '榴园 → 第一教学楼');
    tone(won ? 1046 : 160, .3);
  }
  if (!['road','bus','boarding','crowd','scan'].includes(s.mode)) $('footerText').textContent = '让时间卡住，让道路卡上。';
  if (oldView !== view) $('announce').textContent = $('heading').textContent;
  updateHud(); updateClock();
}
function actorAt(x, y, running = true) {
  const a = $('actor'); if (!a) return;
  a.style.left = `${x}px`; a.style.top = `${y}px`;
  a.style.animationPlayState = running && !s.frozen ? 'running' : 'paused';
  for (const leg of a.querySelectorAll('.leg')) leg.style.animationPlayState = running && !s.frozen ? 'running' : 'paused';
}
function updateStage() {
  if (s.mode === 'road') {
    $('roadWindow').style.top = `${s.roadY}px`; $('roadHandle').setAttribute('aria-valuenow', Math.round(s.roadY));
    const c = roadConnected(s); $('stage').classList.toggle('connected', c); $('seam').textContent = c ? '✓' : '×';
    $('sceneHint').textContent = c ? '道路卡上了。松开空格，继续冲！' : '卡住时间，把右边走廊往下拖，让两条路接上。';
    if (c && !wasConnected) tone(880); wasConnected = c;
    actorAt(s.actorX, (s.actorX < 450 ? 145 : s.roadY) + 130);
  } else if (s.mode === 'bus' || s.mode === 'boarding') {
    $('platformWindow').style.top = `${s.platformY}px`; $('platformHandle').setAttribute('aria-valuenow', Math.round(s.platformY));
    $('busVehicle').style.left = `${s.busX}px`;
    const near = Math.abs(s.busX - 450) <= 27, c = busAligned(s);
    $('busStatus').textContent = s.mode === 'boarding' ? '上车成功' : c && s.busArmed ? '车门卡上了！恢复时间就上车' : near ? '车门到站！现在卡住时间' : s.busX > 450 ? '小公交正在进站' : '这班错过了，下一班马上到';
    $('busStatus').classList.toggle('ready', near); $('busDoor').classList.toggle('ready', c);
    $('sceneHint').textContent = c ? '站台和车门卡上了，恢复时间上车！' : '车门经过虚线时卡住时间，再把左边站台拖到车门的高度。';
    if (c && !wasConnected) tone(880); wasConnected = c;
    actorAt(s.mode === 'boarding' ? s.busX + 65 : 385, (s.mode === 'boarding' ? 155 : s.platformY) + 130, s.mode === 'boarding');
  } else if (s.mode === 'crowd') {
    const centers = gaps(s), next = GATES.findIndex(g => s.crowdX < g - 15);
    $('crowdLane').style.top = `${s.crowdY - 28}px`; $('crowdHandle').style.top = `${s.crowdY - 66}px`;
    $('crowdHandle').setAttribute('aria-valuenow', Math.round(s.crowdY));
    GATES.forEach((x, i) => {
      $('crowd' + i).classList.toggle('next', i === next);
      $('crowd' + i).classList.toggle('passed', s.crowdX >= x - 15);
      $('gap' + i).style.top = `${centers[i] - 50 - 66}px`;
      [-210,-160,-110,80,130,180].forEach((offset,j) => $('person' + i + '-' + j).style.top = `${centers[i] - 50 + offset}px`);
    });
    $('sceneHint').textContent = next < 0 ? '已经钻过人群，把通道接到右边的包子窗口。' : `看准第 ${next + 1} 处空隙；卡住人群，再上下拖动通道。`;
    actorAt(s.crowdX, s.crowdY - 24);
  } else if (s.mode === 'scan') {
    $('scanPhone').style.left = `${s.scanX}px`; $('scanPhone').style.top = `${s.scanY}px`;
    $('scanPhone').setAttribute('aria-valuenow', Math.round(s.scanX));
    $('finder').classList.toggle('aligned', scanAligned(s));
    $('scanLabel').textContent = scanAligned(s) ? '正在识别……' : '等待对准';
    $('scanFill').style.width = `${Math.min(1, s.scanHold / .55) * 100}%`;
  }
}

function beginSleep(newSeed = true) {
  const chosen = s.sleep; s = newRun(chosen, newSeed ? (Date.now() >>> 0) : s.seed);
  s.mode = 'sleep'; renderMode();
}
function resume() { s.paused = false; show('pauseLayer', false); last = 0; updateHud(); }
function pause() {
  if (![...ACTIVE,'boarding','travel'].includes(s.mode) || s.paused) return;
  clearInput(); s.paused = true; show('pauseLayer', true); updateHud();
}
function restartStage() { clearInput(); resume(); restoreCheckpoint(s); renderMode(true); }
$('startBtn').onclick = () => beginSleep();
for (const b of document.querySelectorAll('[data-practice]')) b.onclick = () => {
  resume(); s = newRun('00:30', 42); enter(s, b.dataset.practice); renderMode(true);
};
for (const b of document.querySelectorAll('[data-sleep]')) b.onclick = () => { s.sleep = b.dataset.sleep; updateSleep(); };
$('sleepBtn').onclick = () => { s.mode = 'intro'; renderMode(); };
$('sleepBackBtn').onclick = () => { s.mode = 'map'; renderMode(); };
$('wakeBtn').onclick = () => { enter(s, 'road'); renderMode(); };
$('retryBtn').onclick = restartStage; $('checkpointBtn').onclick = restartStage;
$('againBtn').onclick = () => { resume(); beginSleep(false); };
$('mapBtn').onclick = () => { resume(); s = newRun(s.sleep, s.seed); renderMode(); };
$('pauseBtn').onclick = pause; $('resumeBtn').onclick = resume;
$('soundBtn').onclick = () => {
  muted = !muted; $('soundBtn').setAttribute('aria-pressed', String(!muted));
  $('soundBtn').setAttribute('aria-label', muted ? '开启音效' : '关闭音效'); tone();
};
$('toggleFreezeBtn').onclick = () => { locked = !locked; updateFreeze(); };
$('freezeBtn').onpointerdown = e => { e.preventDefault(); buttonHeld = true; $('freezeBtn').setPointerCapture(e.pointerId); updateFreeze(); };
for (const name of ['pointerup','pointercancel','lostpointercapture']) $('freezeBtn').addEventListener(name, () => { buttonHeld = false; updateFreeze(); });

function activeHandle() {
  return ({ road: $('roadHandle'), bus: $('platformHandle'), crowd: $('crowdHandle'), scan: $('scanPhone') })[s.mode];
}
document.addEventListener('keydown', e => {
  if (e.code === 'Escape') { e.preventDefault(); s.paused ? resume() : pause(); return; }
  if (s.paused) return;
  if (e.code === 'Space' && ACTIVE.includes(s.mode)) { e.preventDefault(); keyHeld = true; updateFreeze(); }
  if (e.code === 'KeyR' && (ACTIVE.includes(s.mode) || s.mode === 'lost')) { e.preventDefault(); restartStage(); }
  if (s.frozen && document.activeElement === activeHandle() && e.key.startsWith('Arrow')) {
    e.preventDefault(); const amount = e.shiftKey ? 20 : 5;
    if (s.mode === 'scan') move(s, s.scanX + (e.key === 'ArrowRight' ? amount : e.key === 'ArrowLeft' ? -amount : 0), s.scanY + (e.key === 'ArrowDown' ? amount : e.key === 'ArrowUp' ? -amount : 0), false);
    else if (['ArrowUp','ArrowDown'].includes(e.key)) {
      const y = s.mode === 'road' ? s.roadY : s.mode === 'bus' ? s.platformY : s.crowdY;
      move(s, 0, y + (e.key === 'ArrowDown' ? amount : -amount), false);
    }
    updateStage();
  }
});
document.addEventListener('keyup', e => { if (e.code === 'Space') { keyHeld = false; updateFreeze(); } });
$('stage').addEventListener('pointerdown', e => {
  const handle = activeHandle();
  if (!handle || !handle.contains(e.target) || s.paused) return;
  if (!s.frozen) { $('announce').textContent = '请先按住空格或点击锁定卡顿，再拖动。'; return; }
  const r = $('stage').getBoundingClientRect(), x = (e.clientX - r.left) / scale, y = (e.clientY - r.top) / scale;
  const objectY = s.mode === 'road' ? s.roadY : s.mode === 'bus' ? s.platformY : s.mode === 'crowd' ? s.crowdY : s.scanY;
  const handleOffset = s.mode === 'crowd' ? 66 : 0;
  drag = { dx: x - (s.mode === 'scan' ? s.scanX : 0), dy: y - objectY, handleOffset };
  e.preventDefault(); handle.focus({ preventScroll: true }); $('stage').setPointerCapture(e.pointerId);
});
$('stage').addEventListener('pointermove', e => {
  if (!drag || !s.frozen || s.paused) return;
  const r = $('stage').getBoundingClientRect(), x = (e.clientX - r.left) / scale, y = (e.clientY - r.top) / scale;
  move(s, x - drag.dx, y - drag.dy); updateStage();
});
for (const event of ['pointerup','pointercancel','lostpointercapture']) $('stage').addEventListener(event, () => { drag = null; });
document.addEventListener('visibilitychange', () => { last = 0; if (document.hidden) pause(); });
window.addEventListener('blur', pause);

function frame(t) {
  const dt = last ? Math.min((t - last) / 1000, .05) : 0; last = t;
  if (!document.hidden) {
    if (s.mode === 'intro') introAge += dt;
    tick(s, dt); renderMode();
    if (ACTIVE.includes(s.mode) || s.mode === 'boarding') { updateStage(); updateHud(); }
    updateClock();
  }
  requestAnimationFrame(frame);
}
$('announce').className = 'sr-only';
renderMode(); requestAnimationFrame(frame);
