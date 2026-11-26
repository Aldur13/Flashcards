const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const v44 = require('../flashcards-v44-shared.js');

const root = path.join(__dirname, '..');
const sql = fs.readFileSync(path.join(root, 'supabase', 'v4.4-shared-cards.sql'), 'utf8');
const app = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('v4.4 is loaded after v4.3 and before the account-key script', () => {
  const a = app.indexOf('flashcards-v43-multijudge.js');
  const b = app.indexOf('flashcards-v44-shared.js');
  const c = app.indexOf('flashcards-account-keys.js');
  assert.ok(a > 0 && b > a && c > b);
});

test('every upload needs a subject from the fixed list and the SQL list matches', () => {
  for (const s of v44.AMNEN) assert.ok(sql.includes(`'${s}'`), s);
  assert.match(sql, /constraint shared_cards_subject_ok check \(subject in/);
});

test('file parser accepts {cards} and arrays, drops empties and duplicates', () => {
  const r = v44.tolkaFil(JSON.stringify({ cards: [
    { q: 'Vad är cellandning?', a: 'x', type: 'open', options: [], correctIndex: 0 },
    { q: 'vad är cellandning?  ', a: 'dubblett' },
    { q: '', a: 'tom' }, { q: 'Ok fråga', a: '' }, null
  ] }));
  assert.equal(r.kort.length, 1);
  assert.equal(r.hoppade, 4);
  assert.equal(v44.tolkaFil(JSON.stringify([{ q: 'Fråga här', a: 'svar' }])).kort.length, 1);
  assert.throws(() => v44.tolkaFil('{"cards":[]}'));
  assert.throws(() => v44.tolkaFil('inte json'));
});

test('text is cleaned and truncated', () => {
  const k = v44.rensaKort({ q: 'A\u0000B   C' + 'x'.repeat(500), a: 'y'.repeat(2000) });
  assert.ok(k.q.length <= 240 && k.a.length <= 900 && !/\u0000/.test(k.q));
});

test('database rows become cards with ids the cloud sync accepts (1-6 digits)', () => {
  const c = v44.radTillKort({ nr: 7, subject: 'Biologi', category: 'Andningen', q: 'Vad är diafragman?', a: 'En muskel.' });
  assert.equal(c.id, 100007);
  assert.match(String(c.id), /^\d{1,6}$/);
  assert.equal(v44.radTillKort({ nr: 900000, subject: 'Biologi', category: 'Ab', q: 'Fråga?', a: 'x' }), null);
  assert.equal(v44.radTillKort({ nr: 1, subject: 'Påhittat', category: 'Ab', q: 'Fråga?', a: 'x' }), null);
});

test('area names that clash between subjects get the subject in brackets', () => {
  const kort = [
    { k: 'Grunder', amne: 'Fysik' }, { k: 'Grunder', amne: 'Kemi' }, { k: 'Egypten', amne: 'Historia' }
  ];
  v44.namnge(kort, { Egypten: 'inbyggt' });
  assert.deepEqual(kort.map(c => c.k), ['Grunder', 'Grunder (Kemi)', 'Egypten (Historia)']);
});

test('migration is public-read, login-to-write and hides cards via dolt', () => {
  assert.match(sql, /for select to anon, authenticated using \(dolt = false\)/);
  assert.match(sql, /for insert to authenticated/);
  assert.match(sql, /owner_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /grant insert \(subject, category, q, a, oppen\)/);
  assert.equal((sql.match(/\('Biologi','/g) || []).length, 53);
});
