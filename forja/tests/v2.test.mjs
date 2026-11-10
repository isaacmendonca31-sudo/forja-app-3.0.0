// Testes do FORJA 2.0: preferências, esforço, rascunho com pausa e cronômetro de treino.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSettings, sanitizeSession, sanitizeDraft, DEFAULT_SETTINGS } from '../js/validate.js';
import { elapsedMs, adjustedEnd, fmtElapsed } from '../js/summary.js';

test('configurações antigas (sem campos 2.0) recebem os padrões', () => {
  const s = sanitizeSettings({ restCompound: 120, restIsolation: 60, keepAwake: false, vibrate: true, sound: true });
  assert.equal(s.motion, 'normal');
  assert.equal(s.rankEffects, true);
  assert.equal(s.autoRest, true);
  assert.equal(s.restCompound, 120);
  assert.equal(s.keepAwake, false);
});

test('valores inválidos de movimento/efeitos caem no padrão', () => {
  const s = sanitizeSettings({ motion: 'extreme', rankEffects: 'sim', autoRest: 1 });
  assert.equal(s.motion, DEFAULT_SETTINGS.motion);
  assert.equal(s.rankEffects, true);
  assert.equal(s.autoRest, true);
  assert.equal(sanitizeSettings({ motion: 'reduced', autoRest: false }).motion, 'reduced');
  assert.equal(sanitizeSettings({ autoRest: false }).autoRest, false);
});

test('tema aceita apenas as quatro paletas disponíveis', () => {
  assert.equal(DEFAULT_SETTINGS.theme, 'green');
  for (const theme of ['green', 'blue', 'purple', 'orange']) {
    assert.equal(sanitizeSettings({ theme }).theme, theme);
  }
  assert.equal(sanitizeSettings({ theme: 'custom' }).theme, 'green');
});

const base = { id: 'x1', date: '2026-10-01', items: [{ exerciseId: 'e1', sets: [{ weight: 40, reps: 10 }] }] };
test('esforço (RPE) é opcional e limitado a 1–10', () => {
  assert.equal(sanitizeSession(base).effort, undefined);
  assert.equal(sanitizeSession({ ...base, effort: 7 }).effort, 7);
  assert.equal(sanitizeSession({ ...base, effort: 0 }).effort, undefined);
  assert.equal(sanitizeSession({ ...base, effort: 11 }).effort, undefined);
  assert.equal(sanitizeSession({ ...base, effort: 'alto' }).effort, undefined);
});

test('rascunho antigo continua válido e ganha pausa zerada', () => {
  const d = sanitizeDraft({ id: 'd1', dayId: 'day1', date: '2026-10-01', startedAt: 1000,
    items: [{ key: 'k1', exerciseId: 'e1', sets: [{ weight: '40', reps: '10', done: true }] }] });
  assert.equal(d.pausedMs, 0);
  assert.equal(d.pausedAt, 0);
  assert.equal(d.items[0].swapNote, '');
});

test('rascunho preserva pausa e nota de troca', () => {
  const d = sanitizeDraft({ id: 'd1', dayId: 'day1', date: '2026-10-01', startedAt: 1000, pausedMs: 5000, pausedAt: 9000,
    items: [{ key: 'k1', exerciseId: 'e1', swapNote: 'Substitui Supino', sets: [] }] });
  assert.equal(d.pausedMs, 5000);
  assert.equal(d.pausedAt, 9000);
  assert.equal(d.items[0].swapNote, 'Substitui Supino');
});

test('elapsedMs desconta pausas fechadas e a pausa em curso', () => {
  assert.equal(elapsedMs({ startedAt: 0, pausedMs: 0, pausedAt: 0 }, 60_000), 60_000);
  assert.equal(elapsedMs({ startedAt: 0, pausedMs: 10_000, pausedAt: 0 }, 60_000), 50_000);
  assert.equal(elapsedMs({ startedAt: 0, pausedMs: 10_000, pausedAt: 40_000 }, 60_000), 30_000);
  assert.equal(elapsedMs({ startedAt: 100, pausedMs: 0, pausedAt: 0 }, 50), 0); // nunca negativo
});

test('adjustedEnd gera duração sem o tempo em pausa', () => {
  const d = { startedAt: 1000, pausedMs: 20_000, pausedAt: 0 };
  assert.equal(adjustedEnd(d, 101_000) - d.startedAt, 80_000);
});

test('fmtElapsed', () => {
  assert.equal(fmtElapsed(0), '0:00');
  assert.equal(fmtElapsed(65_000), '1:05');
  assert.equal(fmtElapsed(3_725_000), '1:02:05');
});
