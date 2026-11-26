const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const m = require('../flashcards-v46-merit.js');

const root = path.join(__dirname, '..');
const sql = fs.readFileSync(path.join(root, 'supabase', 'v4.6-merit.sql'), 'utf8');
const app = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const alla = (b) => Object.fromEntries(m.AMNEN.concat([m.SPRAKVAL]).map((a) => [a, b]));

test('there are 16 subjects plus språkval, max 340', () => {
  assert.equal(m.AMNEN.length, 16);
  assert.equal(m.MAX, 340);
});

test('points follow A=20 B=17.5 C=15 D=12.5 E=10 F=0', () => {
  assert.deepEqual([m.poang('A'), m.poang('B'), m.poang('C'), m.poang('D'), m.poang('E'), m.poang('F'), m.poang('-')],
    [20, 17.5, 15, 12.5, 10, 0, 0]);
});

test('A in everything is 340, E in everything is 170, nothing is 0', () => {
  assert.equal(m.berakna(alla('A')).summa, 340);
  assert.equal(m.berakna(alla('E')).summa, 170);
  assert.equal(m.berakna({}).summa, 0);
});

test('språkval is the 17th grade', () => {
  const g = alla('A'); delete g[m.SPRAKVAL];
  assert.equal(m.berakna(g).summa, 320);
});

test('hemspråk never changes the merit value', () => {
  const g = alla('C');
  assert.equal(m.berakna(Object.assign({}, g, { [m.HEMSPRAK]: 'A' })).summa, m.berakna(g).summa);
});

test('unknown subjects and grades are dropped', () => {
  assert.deepEqual(m.rensa({ Matematik: 'A', Fusk: 'A', Fysik: 'Z', __proto__: { Bild: 'A' } }), { Matematik: 'A' });
  assert.deepEqual(m.rensa(null), {});
  assert.deepEqual(m.rensa([1, 2]), {});
});

test('what-if shows the difference without changing the input', () => {
  const g = { Fysik: 'C' };
  const r = m.vadOm(g, 'Fysik', 'B');
  assert.deepEqual(r, { fore: 15, efter: 17.5, diff: 2.5 });
  assert.equal(g.Fysik, 'C');
});

test('decimal comma is used for display', () => assert.equal(m.visaTal(17.5), '17,5'));

test('SQL: one row per account, RLS on, own rows only', () => {
  assert.match(sql, /create table if not exists public\.merit_grades/);
  assert.match(sql, /enable row level security/);
  for (const p of ['merit_las', 'merit_skapa', 'merit_andra', 'merit_ta_bort']) assert.ok(sql.includes(p), p);
  assert.ok(!/to anon/.test(sql));
});

test('v4.6 is loaded after the account-key script', () => {
  const a = app.indexOf('flashcards-account-keys.js');
  const b = app.indexOf('flashcards-v46-merit.js');
  assert.ok(a > 0 && b > a);
});
