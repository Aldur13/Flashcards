const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const v45 = require('../flashcards-v45-distributed-grading.js');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'flashcards-v45-distributed-grading.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('v4.5 loads after v4.4 and the prompt builder is shared', () => {
  assert.ok(app.indexOf('flashcards-v45-distributed-grading.js') > app.indexOf('flashcards-v44-shared.js'));
  assert.match(app, /function domarPrompt\(kort,deltar,sek\)/);
  assert.match(app, /const prompt=domarPrompt\(kort,deltar,sek\)/);
  assert.doesNotMatch(app, /tävling mellan elever i årskurs 7 \(historia och geografi\)/);
});

test('nobody grades their own answer when someone else can', () => {
  const deltar = ['h', 'p1', 'p2', 'p3', 'p4'].map(id => ({ id, text: 'x' }));
  const plan = v45.fordela(deltar, ['p1', 'p2', 'h']);
  for (const slot of Object.keys(plan)) for (const d of plan[slot]) assert.notEqual(d.id, slot);
  assert.equal(Object.values(plan).reduce((a, l) => a + l.length, 0), 5);
  const counts = Object.values(plan).map(l => l.length);
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
});

test('with a single slot the answers still get graded', () => {
  const plan = v45.fordela([{ id: 'h' }, { id: 'p1' }], ['h']);
  assert.equal(plan.h.length, 2);
});

test('job validation rejects oversized or malformed data', () => {
  const ok = { job: 'j1', sek: 60, fraga: 'Vad är x?', facit: 'y', svar: [{ id: 'p1', text: 'svar' }] };
  assert.ok(v45.rensaJobb(ok));
  assert.equal(v45.rensaJobb({ ...ok, sek: 5000 }), null);
  assert.equal(v45.rensaJobb({ ...ok, svar: [] }), null);
  assert.equal(v45.rensaJobb({ ...ok, svar: Array.from({ length: 9 }, (_, i) => ({ id: 'p' + i, text: 'a' })) }), null);
  assert.equal(v45.rensaJobb({ ...ok, svar: [{ id: 'p1', text: 'a' }, { id: 'p1', text: 'b' }] }), null);
  assert.equal(v45.rensaJobb({ ...ok, fraga: 'x'.repeat(501) }), null);
  assert.equal(v45.rensaJobb(null), null);
});

test('helper answers are validated: all ids, scores clamped, text truncated', () => {
  const r = v45.rensaSvar({ p1: { poang: 250, kommentar: 'k'.repeat(999), fel: '' } }, ['p1']);
  assert.equal(r.p1.poang, 100);
  assert.equal(r.p1.kommentar.length, 300);
  assert.throws(() => v45.rensaSvar({ p1: { poang: 50 } }, ['p1', 'p2']));
  assert.throws(() => v45.rensaSvar({ p1: { poang: 'abc' } }, ['p1']));
  assert.throws(() => v45.rensaSvar({ __proto__: { p1: { poang: 50 } } }, ['p1']));
});

/* ── hela flödet i en isolerad miljö med låtsas-appen ─────────────────────── */
function miljo(extra = '') {
  const sent = [];
  const ctx = vm.createContext({
    console, setTimeout, clearTimeout, Promise, JSON, Object, Math, Date, Array, String, Number, Error,
    document: { getElementById: () => null, body: {} }, MutationObserver: function () { this.observe = () => {}; },
    localStorage: { getItem: () => null, setItem() {} }, sent
  });
  vm.runInContext(`
    var T = null; var baseCalls = [];
    function tDomare(kort, deltar) { baseCalls.push(deltar.map(d => d.id)); const b = {}; deltar.forEach(d => b[d.id] = { poang: 10, kommentar: 'host', fel: '' }); return Promise.resolve({ betyg: b, sok: true }); }
    function tHostData() { return 'bas'; }
    function tKlientData() { return 'bas'; }
    function getSource() { return 'egen'; } function getKey() { return 'abcdefghijkl'; }
    function domarPrompt(kort, deltar, sek) { return 'PROMPT ' + deltar.length; }
    function kampAI(p) { return Promise.resolve({ text: JSON.stringify({ betyg: [] }), sok: false }); }
    function tParse(raw, ids) { const o = {}; ids.forEach(i => o[i] = { poang: 77, kommentar: 'hjälp', fel: '' }); return o; }
    ${extra}
  `, ctx);
  vm.runInContext(src, ctx);
  return ctx;
}

test('host splits grading with helpers, never sends keys, and merges results', async () => {
  const ctx = miljo();
  const skickat = [];
  vm.runInContext(`
    var mkConn = (id) => ({ open: true, send: (m) => sent.push([id, m]) });
    T = { roll: 'host', nr: 1, sp: {
      h: { id: 'h', namn: 'Värd' },
      p1: { id: 'p1', namn: 'A', conn: mkConn('p1'), hjalp: true },
      p2: { id: 'p2', namn: 'B', conn: mkConn('p2'), hjalp: true },
      p3: { id: 'p3', namn: 'C', conn: mkConn('p3'), hjalp: false } } };
  `, ctx);
  const deltar = ['h', 'p1', 'p2', 'p3'].map(id => ({ id, namn: id, text: 'svar ' + id }));
  ctx.deltar = deltar;
  const prom = vm.runInContext(`tDomare({ q: 'Fråga?', a: 'Facit' }, deltar, 60)`, ctx);
  await new Promise(r => setTimeout(r, 20));
  const jobb = ctx.sent;
  assert.ok(jobb.length >= 1);
  for (const [to, m] of jobb) {
    assert.equal(m.t, 'dom-jobb');
    assert.ok(!JSON.stringify(m).includes('abcdefghijkl'));
    assert.ok(!m.svar.some(s => s.id === to), 'helper got its own answer');
    assert.notEqual(to, 'p3');
    ctx.reply = { t: 'dom-svar', job: m.job, betyg: Object.fromEntries(m.svar.map(s => [s.id, { poang: 80, kommentar: 'ok', fel: '' }])) };
    ctx.conn = { _id: to };
    vm.runInContext(`tHostData(conn, reply)`, ctx);
  }
  const r = await prom;
  assert.deepEqual(Object.keys(r.betyg).sort(), ['h', 'p1', 'p2', 'p3']);
  assert.equal(r.sok, false);
});

test('a helper that fails is replaced by the host, and strangers cannot answer a job', async () => {
  const ctx = miljo();
  vm.runInContext(`
    T = { roll: 'host', nr: 1, sp: { h: { id: 'h' },
      p1: { id: 'p1', conn: { open: true, send: (m) => sent.push(['p1', m]) }, hjalp: true },
      p2: { id: 'p2', conn: { open: true, send: (m) => sent.push(['p2', m]) }, hjalp: false } } };
  `, ctx);
  ctx.deltar = [{ id: 'h', text: 'a' }, { id: 'p1', text: 'b' }, { id: 'p2', text: 'c' }];
  const prom = vm.runInContext(`tDomare({ q: 'F?', a: 'A' }, deltar, 60)`, ctx);
  await new Promise(r => setTimeout(r, 20));
  const [to, m] = ctx.sent[0];
  ctx.conn = { _id: 'p2' };
  ctx.fusk = { t: 'dom-svar', job: m.job, betyg: Object.fromEntries(m.svar.map(s => [s.id, { poang: 100 }])) };
  vm.runInContext(`T.sp.p2.hjalp = true; tHostData(conn, fusk)`, ctx);   /* fel avsändare: ignoreras */
  ctx.conn = { _id: to };
  ctx.fel = { t: 'dom-svar', job: m.job, fel: 'misslyckades' };
  vm.runInContext(`tHostData(conn, fel)`, ctx);
  const r = await prom;
  assert.deepEqual(Object.keys(r.betyg).sort(), ['h', 'p1', 'p2']);
  assert.ok(Object.values(r.betyg).every(b => b.poang === 10 || b.poang === 80), JSON.stringify(r.betyg));
});

test('without helpers (or when switched off) the host grades everything itself', async () => {
  const ctx = miljo();
  vm.runInContext(`T = { roll: 'host', nr: 1, sp: { h: { id: 'h' }, p1: { id: 'p1', conn: { open: true, send() {} }, hjalp: false } } };`, ctx);
  ctx.deltar = [{ id: 'h', text: 'a' }, { id: 'p1', text: 'b' }];
  const r = await vm.runInContext(`tDomare({ q: 'F?', a: 'A' }, deltar, 60)`, ctx);
  assert.equal(r.sok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('baseCalls', ctx))), [['h', 'p1']]);
});

test('a player with an own key announces help after joining and runs jobs with its own key only', async () => {
  const ctx = miljo();
  vm.runInContext(`T = { roll: 'klient', conn: { open: true, send: (m) => sent.push(['host', m]) } };`, ctx);
  ctx.m1 = { t: 'valkommen', id: 'p1', namn: 'A', token: 'x' };
  vm.runInContext(`tKlientData(m1)`, ctx);
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.sent[0][1])), { t: 'hjalp', ok: true });
  ctx.job = { t: 'dom-jobb', job: 'j9', fraga: 'F?', facit: 'A', sek: 60, svar: [{ id: 'p2', text: 'svar' }] };
  vm.runInContext(`tKlientData(job)`, ctx);
  await new Promise(r => setTimeout(r, 20));
  const svar = ctx.sent[1][1];
  assert.equal(svar.t, 'dom-svar');
  assert.equal(svar.betyg.p2.poang, 77);
  assert.ok(!JSON.stringify(svar).includes('abcdefghijkl'));
  ctx.dalig = { t: 'dom-jobb', job: 'j10', fraga: '', facit: 'A', sek: 60, svar: [] };
  vm.runInContext(`tKlientData(dalig)`, ctx);
  assert.equal(ctx.sent[2][1].fel, 'ogiltigt');
});
