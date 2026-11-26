const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../flashcards-v46-merit.js');
const P = require('../flashcards-v47-prognos.js');
const C = require('../flashcards-v47-cutoffs.js');
const D = require('../flashcards-v47-cutoffs-data.js');

const root = path.join(__dirname, '..');
const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
const sql = read('supabase', 'v4.7-merit-prognos.sql');
const app = read('index.html');
const t = (poang, max, vikt = 1, datum = '') => ({ poang, max, vikt, datum });
const allaBetyg = (b) => Object.fromEntries(M.AMNEN.map((a) => [a, b]));

/* ── prognos ─────────────────────────────────────────────────────────────── */
test('prognos: no tests gives no prognosis', () => {
  assert.equal(P.prognosAmne([]), null);
  assert.equal(P.prognosAmne(undefined), null);
});

test('prognos: one 90 % test is A likely, B cautious, marked uncertain', () => {
  const r = P.prognosAmne([t(9, 10)]);
  assert.equal(r.sannolik, 'A');
  assert.equal(r.forsiktig, 'B');
  assert.equal(r.osaker, true);
});

test('prognos: later tests weigh more than earlier ones', () => {
  const upp = P.viktatSnitt([t(5, 10, 1, '2026-09-01'), t(9, 10, 1, '2026-11-01')]);
  const ner = P.viktatSnitt([t(9, 10, 1, '2026-09-01'), t(5, 10, 1, '2026-11-01')]);
  assert.ok(upp > 70 && ner < 70 && upp > ner);
});

test('prognos: a heavier test counts more', () => {
  const a = P.viktatSnitt([t(10, 10, 3), t(0, 10, 1)]);
  const b = P.viktatSnitt([t(10, 10, 1), t(0, 10, 1)]);
  assert.ok(a > b);
});

test('prognos: margin shrinks with more tests but never below 4', () => {
  assert.equal(P.marginal(1), 12);
  assert.ok(P.marginal(4) < P.marginal(1));
  assert.equal(P.marginal(1000), 4);
});

test('prognos: bad thresholds fall back to the defaults', () => {
  assert.deepEqual(P.rensaGranser({ A: 50, B: 60, C: 40, D: 30, E: 20 }), P.STD_GRANSER);
  assert.deepEqual(P.rensaGranser(null), P.STD_GRANSER);
  assert.equal(P.rensaGranser({ A: 90, B: 75, C: 60, D: 45, E: 30 }).A, 90);
});

test('prognos: merit uses the prognosis only where there are tests', () => {
  const r = P.prognosMerit({ Fysik: [t(9, 10), t(9, 10), t(9, 10)] }, { Fysik: 'C', Kemi: 'B' });
  assert.equal(r.sparat, 32.5);
  assert.equal(r.sannolik, 37.5);
  assert.ok(r.forsiktig <= r.sannolik && r.sannolik <= r.hoppfull);
});

test('prognos: input from the cloud is cleaned', () => {
  const k = M.rensaTests({ Fysik: [t(99, 10), t(-1, 10), { poang: 'x', max: 10 }, t(5, 10)], Fusk: [t(1, 2)] });
  assert.deepEqual(Object.keys(k), ['Fysik']);
  assert.equal(k.Fysik.length, 1);
  assert.equal(M.rensaTests(M.rensaTests({ Matematik: Array(50).fill(t(1, 2)) })).Matematik.length, 20);
});

/* ── jämförelse ──────────────────────────────────────────────────────────── */
test('status: over from +5, nara within 5, under below, oppen without a cutoff', () => {
  assert.equal(C.status(285, 280), 'over');
  assert.equal(C.status(282, 280), 'nara');
  assert.equal(C.status(277.5, 280), 'nara');
  assert.equal(C.status(275, 280), 'under');
  assert.equal(C.status(100, null), 'oppen');
});

test('behorighet: E in the three core subjects plus the program subjects', () => {
  assert.equal(C.behorig('hf', allaBetyg('E')).ok, true);
  const nt = allaBetyg('E'); nt.Fysik = 'F';
  const r = C.behorig('nt', nt);
  assert.equal(r.ok, false);
  assert.deepEqual(r.saknas, ['Fysik']);
  assert.equal(C.behorig('sa', Object.assign(allaBetyg('E'), { Historia: '-' })).ok, false);
});

test('behorighet: yrkesprogram need 8 approved subjects, others 12', () => {
  const nio = { Svenska: 'E', Engelska: 'E', Matematik: 'E' };
  M.AMNEN.filter((a) => !nio[a]).slice(0, 5).forEach((a) => { nio[a] = 'E'; });
  assert.equal(C.behorig('yrke', nio).ok, true);
  assert.equal(C.behorig('hf', nio).ok, false);
  assert.equal(C.behorig('hf', nio).fler, 4);
  assert.equal(Object.keys(nio).length, 8);
});

test('jamfor sorts by highest cutoff and keeps "alla antagna" last', () => {
  const rader = [{ skola: 'A', lagsta: 100, typ: 'hf' }, { skola: 'B', lagsta: null, typ: 'hf' }, { skola: 'C', lagsta: 200, typ: 'hf' }];
  assert.deepEqual(C.jamfor(rader, 150, {}).map((r) => r.skola), ['C', 'A', 'B']);
  assert.equal(C.jamfor(rader, 150, {})[2].status, 'oppen');
});

/* ── data ────────────────────────────────────────────────────────────────── */
test('data: every row has source, year, date, link and a valid cutoff', () => {
  assert.match(D.hamtad, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(D.rader.length >= 15);
  const sett = new Set();
  for (const r of D.rader) {
    const id = [r.skola, r.program, r.inriktning || '', r.ar].join('|');
    assert.ok(!sett.has(id), 'dubblett: ' + id); sett.add(id);
    for (const f of ['skola', 'program', 'datum', 'kallnamn', 'url']) assert.ok(r[f] && String(r[f]).trim(), f + ' saknas: ' + id);
    assert.ok(['skolverket', 'tredjepart'].includes(r.kalla), id);
    assert.ok(['nt', 'sa', 'hf', 'yrke'].includes(r.typ), id);
    assert.match(r.url, /^https:\/\//);
    assert.ok(r.ar >= 2024 && r.ar <= 2026, 'ar: ' + id);
    if (r.lagsta === null) continue;
    assert.ok(r.lagsta >= 0 && r.lagsta <= 340, id);
    assert.equal((r.lagsta * 2) % 5, 0, 'inte ett möjligt meritvärde (steg om 2,5): ' + id);
    if (r.medel !== null) assert.ok(r.medel >= r.lagsta && r.medel <= 340, 'medel under lägsta: ' + id);
  }
});

test('data: Skolverket rows link to Skolverket', () => {
  for (const r of D.rader.filter((x) => x.kalla === 'skolverket')) assert.match(r.url, /skolverket\.se/);
});

/* ── SQL och inkoppling ──────────────────────────────────────────────────── */
test('SQL v4.7 only adds the tests column, keeps RLS untouched and is repeatable', () => {
  assert.match(sql, /add column if not exists tests jsonb/);
  assert.match(sql, /grant update \(tests\)/);
  assert.ok(!/drop table|disable row level security|to anon/i.test(sql));
  assert.ok(!/create policy/i.test(sql));
});

test('scripts load in the right order after v4.6', () => {
  const i = (n) => app.indexOf(n);
  assert.ok(i('flashcards-v46-merit.js') > 0);
  assert.ok(i('flashcards-v47-cutoffs-data.js') > i('flashcards-v46-merit.js'));
  assert.ok(i('flashcards-v47-prognos.js') > i('flashcards-v47-cutoffs-data.js'));
  assert.ok(i('flashcards-v47-cutoffs.js') > i('flashcards-v47-prognos.js'));
});

/* ── gränssnitt i jsdom ──────────────────────────────────────────────────── */
test('UI: sub-views appear, prognosis adds a test, comparison shows sources', async () => {
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); } catch (e) { return; }
  const dom = new JSDOM('<body><div class="tabs"><button id="t-set"></button></div><div id="v-set"></div></body>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://aldur13.github.io/Flashcards/' });
  const w = dom.window;
  w.eval('var views={}; function show(n){ window.__vy = n; }');
  for (const f of ['flashcards-v46-merit.js', 'flashcards-v47-cutoffs-data.js', 'flashcards-v47-prognos.js', 'flashcards-v47-cutoffs.js']) w.eval(read(f));
  const d = w.document;
  assert.ok(d.getElementById('t-merit'), 'tab');
  d.getElementById('t-merit').click();
  await new Promise((r) => setTimeout(r, 50));
  const knappar = [...d.querySelectorAll('#merit-nav button')].map((b) => b.textContent);
  assert.deepEqual(knappar, ['Betyg', 'Prognos', 'Jämför']);

  /* sätt några betyg, lägg till ett prov */
  d.querySelector('select[data-merit="Matematik"]').value = 'A';
  d.querySelector('select[data-merit="Matematik"]').dispatchEvent(new w.Event('change'));
  [...d.querySelectorAll('#merit-nav button')][1].click();
  d.getElementById('pg-amne').value = 'Fysik'; d.getElementById('pg-amne').dispatchEvent(new w.Event('change'));
  d.getElementById('pg-poang').value = '8'; d.getElementById('pg-max').value = '10';
  d.getElementById('pg-add').click();
  assert.match(d.getElementById('merit-vy').textContent, /1 prov, snitt 80 %/);
  assert.equal(w.MeritApp.tests().Fysik.length, 1);
  await new Promise((r) => setTimeout(r, 700)); /* sparandet väntar 0,6 s */
  assert.equal(JSON.parse(w.localStorage.getItem('flashcards-merit-tests:lokal')).Fysik.length, 1);

  d.getElementById('pg-poang').value = '15'; d.getElementById('pg-max').value = '10';
  d.getElementById('pg-add').click();
  assert.match(d.getElementById('pg-fel').textContent, /mellan 0 och maxpoängen/);

  [...d.querySelectorAll('#merit-nav button')][2].click();
  const txt = d.getElementById('merit-vy').textContent;
  assert.match(txt, /Malmö Borgarskola/);
  assert.match(txt, /Källa: Skolverkets Utbildningsguide, 1 juli 2026, hämtad 2026-11-26/);
  assert.match(txt, /inte en garanti/);
  assert.ok(d.getElementById('jf-grund'), 'prognosval syns när det finns prov');
  w.close();
});
