import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolateColor, COLOR_MAP } from '../../js/common/theme-engine.js';

test('interpolateColor: returns exact light values at brightness 25', () => {
  const light = [38, 45];
  const dark = [59, 64];
  const [s, l] = interpolateColor(25, light, dark);

  assert.strictEqual(s, 38);
  assert.strictEqual(l, 45);
});

test('interpolateColor: returns exact dark values at brightness 75', () => {
  const light = [38, 45];
  const dark = [59, 64];
  const [s, l] = interpolateColor(75, light, dark);

  assert.strictEqual(s, 59);
  assert.strictEqual(l, 64);
});

test('interpolateColor: returns white (S=0, L=100) at brightness 0', () => {
  const light = [38, 45];
  const dark = [59, 64];
  const [s, l] = interpolateColor(0, light, dark);

  assert.strictEqual(s, 0);
  assert.strictEqual(l, 100);
});

test('interpolateColor: returns black (S=0, L=0) at brightness 100', () => {
  const light = [38, 45];
  const dark = [59, 64];
  const [s, l] = interpolateColor(100, light, dark);

  assert.strictEqual(s, 0);
  assert.strictEqual(l, 0);
});

test('interpolateColor: returns midpoint (L=50, S=(sLight+sDark)/2) at brightness 50', () => {
  const light = [40, 20];
  const dark = [60, 80];
  const [s, l] = interpolateColor(50, light, dark);

  assert.strictEqual(s, 50);
  assert.strictEqual(l, 50);
});

test('theme-engine: COLOR_MAP contains all standard keys with light and dark pairs', () => {
  assert.ok(COLOR_MAP['bg-app']);
  assert.ok(COLOR_MAP['color-primary']);
  assert.ok(COLOR_MAP['text-primary']);
  assert.strictEqual(COLOR_MAP['bg-app'].light.length, 2);
  assert.strictEqual(COLOR_MAP['bg-app'].dark.length, 2);
});
