import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, wakeTime, enter, setFreeze, move, tick, gaps, GATES,
  restoreCheckpoint, DEADLINE } from '../mechanics.mjs';

test('sleep choices produce ordered, repeatable wake times with bounded variation', () => {
  for (const seed of [0, 42, 999, 4294967295]) {
    const early = wakeTime('23:00', seed), middle = wakeTime('00:30', seed), late = wakeTime('02:00', seed);
    assert.ok(early < middle && middle < late);
    assert.ok(Math.abs(middle - 28200) <= 30);
    assert.equal(middle, wakeTime('00:30', seed));
  }
});
test('freeze consumes real budget while clock and world stop; pause consumes neither', () => {
  const s = newRun(); enter(s, 'road'); setFreeze(s, true);
  const before = { seconds: s.seconds, x: s.actorX };
  tick(s, .05); assert.equal(s.seconds, before.seconds); assert.equal(s.actorX, before.x);
  assert.ok(s.energy < 10); const energy = s.energy; s.paused = true;
  tick(s, .05); assert.equal(s.energy, energy); assert.equal(s.seconds, before.seconds);
});
test('energy exhaustion resumes only the unfrozen remainder of a frame', () => {
  const s = newRun(); enter(s, 'road'); s.energy = .02; setFreeze(s, true);
  const seconds = s.seconds; tick(s, .05);
  assert.equal(s.energy, 0); assert.equal(s.frozen, false);
  assert.ok(Math.abs(s.seconds - seconds - .18) < .00001);
});
test('disconnected road fails and checkpoint restores the stage entry', () => {
  const s = newRun(); enter(s, 'road'); const start = s.seconds;
  for (let i = 0; i < 130; i++) tick(s, .05);
  assert.equal(s.mode, 'lost'); restoreCheckpoint(s);
  assert.equal(s.mode, 'road'); assert.equal(s.seconds, start); assert.equal(s.energy, 10); assert.equal(s.actorX, 145);
});
test('bus must be frozen at the platform; early alignment alone is not boarding', () => {
  const s = newRun(); enter(s, 'bus'); s.busX = 450; s.platformY = 155;
  tick(s, .01); assert.equal(s.mode, 'bus');
  s.busX = 450; setFreeze(s, true); tick(s, .01); setFreeze(s, false); tick(s, .01);
  assert.equal(s.mode, 'boarding'); assert.equal(s.boarded, true);
});
test('a crowd collision fails and retry clears positions and timers', () => {
  const s = newRun(); enter(s, 'crowd'); s.crowdX = 284; s.crowdY = 85;
  tick(s, .05); assert.equal(s.mode, 'lost'); restoreCheckpoint(s);
  assert.equal(s.crowdX, 100); assert.equal(s.crowdElapsed, 0); assert.equal(s.energy, 14);
});
test('the deadline is a failure, including equality with eight o’clock', () => {
  const s = newRun(); enter(s, 'scan'); s.seconds = DEADLINE - .01;
  tick(s, .05); assert.equal(s.mode, 'lost'); assert.equal(s.seconds, DEADLINE);
});
test('the complete four-stage route is solvable for every sleep choice', () => {
  for (const sleep of ['23:00', '00:30', '02:00']) {
    const s = newRun(sleep, 42); enter(s, 'road'); let steps = 0;
    while (!['won', 'lost'].includes(s.mode) && steps++ < 4000) {
      if (s.mode === 'road') { setFreeze(s, true); move(s, 0, 145); setFreeze(s, false); }
      if (s.mode === 'bus' && Math.abs(s.busX - 450) < 20) {
        setFreeze(s, true); move(s, 0, 155); tick(s, .05); setFreeze(s, false);
      }
      if (s.mode === 'crowd') {
        const n = GATES.findIndex(x => s.crowdX < x - 15);
        if (n >= 0 && GATES[n] - 15 - s.crowdX < 15) {
          setFreeze(s, true); move(s, 0, gaps(s)[n]); tick(s, .05); setFreeze(s, false);
        } else if (n < 0) { setFreeze(s, true); move(s, 0, 210); setFreeze(s, false); }
      }
      if (s.mode === 'scan') { setFreeze(s, true); move(s, 575, 75); }
      tick(s, .05);
    }
    assert.equal(s.mode, 'won', `${sleep}: ${JSON.stringify(s)}`);
    assert.equal(s.hasBun, true); assert.ok(s.seconds < DEADLINE);
  }
});
