export const DEADLINE = 8 * 3600;
export const CLOCK_RATE = 6;
export const ACTIVE = ['road', 'bus', 'crowd', 'scan'];
export const BUDGET = { road: 10, bus: 12, crowd: 14, scan: 8 };
export const GATES = [300, 480, 660];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const snap = (v, target, radius = 12) => Math.abs(v - target) <= radius ? target : v;
export function wakeTime(sleep = '00:30', seed = 42) {
  const base = { '23:00': 27960, '00:30': 28200, '02:00': 28440 }[sleep] ?? 28200;
  const n = ((seed >>> 0) * 1664525 + 1013904223) >>> 0;
  return base + (n % 61) - 30;
}
export function timeText(seconds, short = false) {
  const s = Math.floor(seconds);
  return [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, ...(short ? [] : [s % 60])]
    .map(n => String(n).padStart(2, '0')).join(':');
}
export function newRun(sleep = '00:30', seed = 42) {
  return { mode: 'map', sleep, seed, wake: wakeTime(sleep, seed), seconds: wakeTime(sleep, seed),
    energy: 0, maxEnergy: 0, frozen: false, paused: false, elapsed: 0, stageTime: 0,
    roadY: 55, actorX: 145, busX: 640, busElapsed: 0, platformY: 70, boarded: false, busArmed: false,
    crowdX: 100, crowdY: 210, crowdElapsed: 0, scanX: 280, scanY: 65, scanHold: 0,
    hasBun: false, checkpoint: null, failure: '', failedAt: '', nextStage: '', travelTime: 0 };
}
export function enter(s, mode) {
  s.mode = mode; s.elapsed = 0; s.stageTime = 0; s.frozen = false; s.paused = false;
  s.energy = s.maxEnergy = BUDGET[mode] || 0;
  if (mode === 'road') { s.actorX = 145; s.roadY = 55; }
  if (mode === 'bus') { s.busX = 640; s.busElapsed = 0; s.platformY = 70; s.boarded = false; s.busArmed = false; }
  if (mode === 'crowd') { s.crowdX = 100; s.crowdY = 210; s.crowdElapsed = 0; }
  if (mode === 'scan') { s.scanX = 280; s.scanY = 65; s.scanHold = 0; }
  if (ACTIVE.includes(mode)) s.checkpoint = { mode, seconds: s.seconds, hasBun: s.hasBun };
  return s;
}
export function restoreCheckpoint(s) {
  if (!s.checkpoint) return s;
  const c = { ...s.checkpoint }; s.seconds = c.seconds; s.hasBun = c.hasBun; s.failure = '';
  return enter(s, c.mode);
}
export function setFreeze(s, value) {
  s.frozen = !!(value && !s.paused && s.energy > 0 && ACTIVE.includes(s.mode));
}
export const roadConnected = s => Math.abs(s.roadY - 145) < .1;
export const busAligned = s => Math.abs(s.busX - 450) <= 27 && Math.abs(s.platformY - 155) <= 1;
export const scanAligned = s => Math.abs(s.scanX - 575) < 9 && Math.abs(s.scanY - 75) < 9;
export const gaps = s => GATES.map((_, i) => 210 + 60 * Math.sin(s.crowdElapsed * .78 + i * .62));
export const fitsGap = (y, center) => Math.abs(y - center) <= 46;
export function move(s, x, y, snapping = true) {
  if (!s.frozen || s.paused) return;
  if (s.mode === 'road') s.roadY = clamp(snapping ? snap(y, 145) : y, 45, 190);
  if (s.mode === 'bus') {
    s.platformY = clamp(snapping ? snap(y, 155) : y, 45, 190);
    s.busArmed = busAligned(s);
    if (s.busArmed) s.busX = 450;
  }
  if (s.mode === 'crowd') {
    const next = GATES.findIndex(g => s.crowdX < g - 15);
    const target = next < 0 ? 210 : gaps(s)[next];
    s.crowdY = clamp(snapping ? snap(y, target, 10) : y, 85, 340);
  }
  if (s.mode === 'scan') {
    s.scanX = clamp(x, 20, 700); s.scanY = clamp(y, 20, 130);
    if (snapping && Math.abs(s.scanX - 575) < 13 && Math.abs(s.scanY - 75) < 13) {
      s.scanX = 575; s.scanY = 75;
    }
  }
}
function fail(s, reason) { s.failedAt = s.mode; s.failure = reason; s.mode = 'lost'; s.frozen = false; }
function travel(s, next) {
  s.mode = 'travel'; s.nextStage = next; s.travelTime = 0; s.frozen = false;
}
export function tick(s, dt) {
  if (s.paused || dt <= 0) return s;
  dt = Math.min(dt, .05);
  if (s.mode === 'travel') {
    s.travelTime += dt; s.seconds += dt * CLOCK_RATE;
    if (s.seconds >= DEADLINE) { s.seconds = DEADLINE; fail(s, '已经八点了，签到截止。'); }
    else if (s.travelTime >= 1.15) enter(s, s.nextStage);
    return s;
  }
  if (s.mode === 'boarding') {
    s.elapsed += dt; s.seconds += dt * CLOCK_RATE; s.busX += dt * 210;
    if (s.seconds >= DEADLINE) { s.seconds = DEADLINE; fail(s, '已经八点了，签到截止。'); }
    else if (s.elapsed > 1.2) travel(s, 'crowd');
    return s;
  }
  if (!ACTIVE.includes(s.mode)) return s;
  s.elapsed += dt;
  if (s.mode === 'bus' && s.frozen && busAligned(s)) { s.busArmed = true; s.busX = 450; }
  // Spend the real-time part that was frozen, then simulate only the remainder.
  let liveDt = dt;
  if (s.frozen) {
    const frozenDt = Math.min(s.energy, dt);
    s.energy = Math.max(0, s.energy - frozenDt); liveDt = dt - frozenDt;
    if (s.energy === 0) s.frozen = false;
  }
  const before = s.seconds;
  s.seconds += liveDt * CLOCK_RATE; s.stageTime += liveDt;
  // Deadline is checked before further interactions; equality is too late.
  if (s.seconds >= DEADLINE) { s.seconds = DEADLINE; fail(s, '已经八点了，签到截止。'); return s; }
  if (s.mode === 'road' && liveDt > 0) {
    const next = s.actorX + liveDt * 48;
    if (s.actorX < 425 && next >= 425 && !roadConnected(s)) fail(s, '宿舍门和走廊还没接上。');
    else { s.actorX = next; if (next > 775) travel(s, 'bus'); }
  } else if (s.mode === 'bus' && liveDt > 0) {
    if (s.busArmed && busAligned(s)) { s.mode = 'boarding'; s.boarded = true; s.elapsed = 0; }
    else { s.busElapsed += liveDt; s.busX = 640 - ((s.busElapsed * 70) % 800); }
  } else if (s.mode === 'crowd' && liveDt > 0) {
    s.crowdElapsed += liveDt;
    const next = Math.min(755, s.crowdX + liveDt * 43);
    const centers = gaps(s);
    for (let i = 0; i < GATES.length; i++) {
      if (s.crowdX < GATES[i] - 15 && next >= GATES[i] - 15 && !fitsGap(s.crowdY, centers[i])) {
        fail(s, '被食堂人群挡住了，还没钻进空隙。'); return s;
      }
    }
    s.crowdX = next;
    if (s.crowdX >= 755 && Math.abs(s.crowdY - 210) <= 24) { s.hasBun = true; travel(s, 'scan'); }
  } else if (s.mode === 'scan') {
    s.scanHold = scanAligned(s) ? s.scanHold + dt : 0;
    if (s.scanHold >= .55 && before < DEADLINE) { s.mode = 'won'; s.frozen = false; }
  }
  return s;
}
