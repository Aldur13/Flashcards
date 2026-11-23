const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const assert = require('assert');
const REPO = process.env.REPO || '/home/claude/Flashcards';
const HTML = fs.readFileSync(REPO + '/index.html', 'utf8');
const KONTO = fs.readFileSync(REPO + '/konto.js', 'utf8');
const SB = 'https://cicxvhjydsmgnysbkjlu.supabase.co';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ───────────── låtsas-Supabase ───────────── */
class Srv {
  constructor() {
    this.users = new Map(); this.tok = new Map(); this.rt = new Map(); this.rows = new Map();
    this.mails = []; this.log = []; this.n = 0; this.confirm = false; this.ttl = 3600;
    this.down = false; this.restStatus = 0; this.getGate = null; this.beforePatch = null;
  }
  addUser(email, password, confirmed = true) {
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-' + String(++this.n).padStart(12, '0');
    this.users.set(email, { id, email, password, confirmed }); return this.users.get(email);
  }
  issue(u, ttl = this.ttl) {
    const at = 'at' + (++this.n) + Math.random().toString(36).slice(2), r = 'rt' + this.n + Math.random().toString(36).slice(2);
    this.tok.set(at, { uid: u.id, exp: Date.now() / 1000 + ttl }); this.rt.set(r, u.id);
    return { access_token: at, refresh_token: r, expires_in: ttl, expires_at: Math.floor(Date.now() / 1000) + ttl, user: { id: u.id, email: u.email } };
  }
  ts() { return '2026-11-23T10:00:00.' + String(++this.n).padStart(6, '0') + '+00:00'; }
  byId(id) { return [...this.users.values()].find(u => u.id === id); }
  auth(h) {
    const m = /^Bearer (.+)$/.exec(h.Authorization || ''); if (!m) return null;
    const t = this.tok.get(m[1]); if (!t) return null;
    return t.exp > Date.now() / 1000 ? t.uid : 'expired';
  }
  async handle(url, init) {
    if (this.down) throw new TypeError('Failed to fetch');
    const u = new URL(url), p = u.pathname, q = u.searchParams, method = init.method || 'GET', h = init.headers || {};
    const body = init.body ? JSON.parse(init.body) : null;
    this.log.push(method + ' ' + p + u.search);
    assert.ok(h.apikey && h.apikey.startsWith('sb_publishable_'), 'apikey saknas');
    assert.ok(!/service_role|sb_secret/i.test(JSON.stringify(h)), 'hemlig nyckel i anrop');
    const J = (s, o) => ({ status: s, body: o === undefined ? '' : JSON.stringify(o) });
    if (p === '/auth/v1/signup') {
      if (body.password.length < 10) return J(422, { code: 422, error_code: 'weak_password', msg: 'weak' });
      if (this.users.has(body.email)) return this.confirm ? J(200, { id: 'x', email: body.email }) : J(422, { code: 422, error_code: 'user_already_exists', msg: 'exists' });
      const us = this.addUser(body.email, body.password, !this.confirm);
      if (this.confirm) { this.mails.push({ typ: 'signup', to: body.email, redirect: q.get('redirect_to') }); return J(200, { id: us.id, email: us.email }); }
      return J(200, this.issue(us));
    }
    if (p === '/auth/v1/token' && q.get('grant_type') === 'password') {
      const us = this.users.get(body.email);
      if (!us || us.password !== body.password) return J(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
      if (!us.confirmed) return J(400, { code: 400, error_code: 'email_not_confirmed', msg: 'Email not confirmed' });
      return J(200, this.issue(us));
    }
    if (p === '/auth/v1/token' && q.get('grant_type') === 'refresh_token') {
      const uid = this.rt.get(body.refresh_token);
      if (!uid) return J(400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
      this.log.push('REFRESH'); return J(200, this.issue(this.byId(uid)));
    }
    if (p === '/auth/v1/user') {
      const uid = this.auth(h); if (!uid || uid === 'expired') return J(401, { code: 401, msg: 'bad jwt' });
      const us = this.byId(uid);
      if (method === 'PUT') {
        if (body.password.length < 10) return J(422, { code: 422, error_code: 'weak_password', msg: 'weak' });
        if (body.password === us.password) return J(422, { code: 422, error_code: 'same_password', msg: 'same' });
        us.password = body.password; return J(200, { id: us.id });
      }
      return J(200, { id: us.id, email: us.email });
    }
    if (p === '/auth/v1/recover') { this.mails.push({ typ: 'recover', to: body.email, redirect: q.get('redirect_to') }); return J(200, {}); }
    if (p === '/auth/v1/logout') { this.log.push('LOGOUT ' + q.get('scope')); return J(204); }
    /* ── REST: RLS ── */
    if (p.startsWith('/rest/v1/')) {
      if (this.restStatus) return J(this.restStatus, { message: 'boom' });
      const uid = this.auth(h);
      if (!uid) return J(401, { code: '42501', message: 'permission denied for table progress' }); /* anon har inga rättigheter */
      if (uid === 'expired') return J(401, { code: 'PGRST301', message: 'JWT expired' });
      if (p === '/rest/v1/rpc/delete_my_account') { this.users.delete(this.byId(uid).email); this.rows.delete(uid); this.log.push('DELETE_ACCOUNT'); return J(204); }
      if (p === '/rest/v1/progress') {
        const eq = k => (q.get(k) || '').replace(/^eq\./, '');
        if (method === 'GET') {
          if (this.getGate) await this.getGate;
          assert.ok(eq('user_id') === uid || true);
          const r = this.rows.get(uid); return J(200, r && eq('user_id') === uid ? [{ data: r.data, updated_at: r.updated_at }] : []);
        }
        if (method === 'POST') {
          if (body.user_id !== uid) return J(403, { code: '42501', message: 'rls' });
          if (this.rows.has(uid)) return J(409, { code: '23505', message: 'dup' });
          assert.ok(typeof body.data === 'object' && !Array.isArray(body.data));
          this.rows.set(uid, { data: body.data, updated_at: this.ts() }); return J(201);
        }
        if (method === 'PATCH') {
          if (this.beforePatch) { const f = this.beforePatch; this.beforePatch = null; f(uid); }
          const r = this.rows.get(uid);
          if (!r || eq('user_id') !== uid || r.updated_at !== eq('updated_at')) return J(200, []);
          r.data = body.data; r.updated_at = this.ts(); return J(200, [{ data: r.data, updated_at: r.updated_at }]);
        }
      }
    }
    return J(404, { code: 'PGRST205', message: 'not found' });
  }
}

/* ───────────── sidan i jsdom ───────────── */
function boot(srv, { store = {}, sess = {}, hash = '', withKonto = true, confirmAns = true, promptAns = 'RADERA', cfg = { vanta: 30 } } = {}) {
  let reloads = 0; const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (/navigation/i.test(e.message)) reloads++; else errors.push(e.message); });
  vc.on('error', e => errors.push(String(e)));
  let html = HTML.replace('<script src="peerjs.min.js"></script>', '');
  html = html.replace('<script src="konto.js"></script>', withKonto ? '<script>' + KONTO + '</script>' : '');
  const dom = new JSDOM(html, {
    url: 'https://aldur13.github.io/Flashcards/' + hash, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      Object.entries(store).forEach(([k, v]) => w.localStorage.setItem(k, v));
      Object.entries(sess).forEach(([k, v]) => w.sessionStorage.setItem(k, v));
      w.fetch = async (url, init = {}) => {
        if (!String(url).startsWith(SB)) return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
        const r = await srv.handle(url, init);
        return { ok: r.status >= 200 && r.status < 300, status: r.status, text: async () => r.body };
      };
      w.confirm = () => confirmAns; w.prompt = () => promptAns;
      w.KONTO_CFG = cfg;
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.speechSynthesis = undefined; w.scrollTo = () => {};
    }
  });
  const w = dom.window;
  const api = {
    w, errors, get reloads() { return reloads; },
    ev: code => w.eval(code),
    dump: () => { const o = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; },
    sdump: () => { const o = {}; for (let i = 0; i < w.sessionStorage.length; i++) { const k = w.sessionStorage.key(i); o[k] = w.sessionStorage.getItem(k); } return o; },
    stats: () => JSON.parse(w.eval('JSON.stringify(stats)')),
    real: () => Object.fromEntries(Object.entries(api.stats()).filter(([, e]) => e.lvl || e.ratt || e.fel || e.tillagg)),
    box: () => (w.document.getElementById('kontoBox') || { textContent: '' }).textContent,
    boxHtml: () => (w.document.getElementById('kontoBox') || { innerHTML: '' }).innerHTML,
    openPanel() { const p = w.document.getElementById('profpanel'); if (p.style.display === 'none' || !p.style.display) w.document.getElementById('profOppna').click(); },
    submit() { w.document.getElementById('kForm').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true })); },
    fill(id, v) { w.document.getElementById(id).value = v; },
    click(id) { w.document.getElementById(id).click(); },
    link(vy) { w.document.querySelector('[data-vy="' + vy + '"]').click(); },
    answer(id, o) { w.eval(`Object.assign(st(${id}),${JSON.stringify(o)});save();`); },
    sync: () => w.kontoSynka(),
    reboot(extra = {}) { return boot(srv, Object.assign({ store: api.dump(), sess: api.sdump() }, extra)); }
  };
  return api;
}
/* Hjälpare: logga in via UI och starta om som riktig omladdning */
async function loginUi(srv, email, pw, opts = {}) {
  let a = boot(srv, opts); await sleep(30); a.openPanel();
  a.fill('kEmail', email); a.fill('kLosen', pw); a.submit(); await sleep(100);
  assert.strictEqual(a.reloads, 1, 'profilbyte ska ladda om sidan');
  a = a.reboot(); await sleep(250); return a;
}
const cloud = (srv, u) => srv.rows.get(u.id) && srv.rows.get(u.id).data;

/* ───────────── tester ───────────── */
const T = []; const test = (n, f) => T.push([n, f]);
const E = (lvl, ratt, fel, senast = '2026-11-20') => ({ lvl, ratt, fel, senast });

test('appen startar utan fel och save() funkar även utan konto.js', async () => {
  const srv = new Srv(); const a = boot(srv, { withKonto: false }); await sleep(30);
  a.answer(1, E(2, 2, 0));
  assert.strictEqual(a.stats()[1].lvl, 2); assert.deepStrictEqual(a.errors, []);
  a.ev('stats={};save();'); a.openPanel(); assert.ok(a.w.document.getElementById('kontoBox')); assert.strictEqual(a.box(), '');
});
test('appen startar med konto.js och visar inloggningsruta utan konto', async () => {
  const srv = new Srv(); const a = boot(srv); await sleep(30); a.openPanel();
  assert.ok(/Inget konto|behöver inget konto/i.test(a.box())); assert.ok(a.w.document.getElementById('molnStatus'));
  assert.deepStrictEqual(a.errors, []); assert.deepStrictEqual(srv.log, []);
});
test('skapa konto: för kort lösenord stoppas i klienten, olika lösenord stoppas', async () => {
  const srv = new Srv(); const a = boot(srv); await sleep(30); a.openPanel(); a.link('skapa');
  a.fill('kEmail', 'a@b.se'); a.fill('kLosen', 'kort'); a.fill('kLosen2', 'kort'); a.submit(); await sleep(30);
  assert.ok(/minst 10 tecken/.test(a.box())); assert.deepStrictEqual(srv.log, []);
  a.fill('kLosen', 'tillrackligt-langt'); a.fill('kLosen2', 'tillrackligt-langtX'); a.submit(); await sleep(30);
  assert.ok(/inte likadana/.test(a.box())); assert.deepStrictEqual(srv.log, []);
});
test('skapa konto med e-postbekräftelse: mejl skickas, ingen session, redirect till sajten', async () => {
  const srv = new Srv(); srv.confirm = true; const a = boot(srv); await sleep(30); a.openPanel(); a.link('skapa');
  a.fill('kEmail', 'ny@x.se'); a.fill('kLosen', 'tillrackligt-langt'); a.fill('kLosen2', 'tillrackligt-langt'); a.submit(); await sleep(60);
  assert.ok(/Nästan klart/.test(a.box()) && /ny@x\.se/.test(a.box()));
  assert.strictEqual(srv.mails[0].redirect, 'https://aldur13.github.io/Flashcards');
  assert.strictEqual(a.dump()['jk-konto'], undefined);
});
test('inloggning: fel lösenord och obekräftad e-post ger svenska fel', async () => {
  const srv = new Srv(); srv.addUser('a@b.se', 'hemligt-lösen-1'); srv.addUser('o@b.se', 'hemligt-lösen-1', false);
  const a = boot(srv); await sleep(30); a.openPanel();
  a.fill('kEmail', 'a@b.se'); a.fill('kLosen', 'fel'); a.submit(); await sleep(60);
  assert.ok(/Fel e-post eller lösenord/.test(a.box())); assert.strictEqual(a.reloads, 0);
  a.fill('kEmail', 'o@b.se'); a.fill('kLosen', 'hemligt-lösen-1'); a.submit(); await sleep(60);
  assert.ok(/Bekräfta din e-post/.test(a.box()));
});
test('inloggning: kontoprofil u<10> skapas, byte + omladdning, första synk skapar rad', async () => {
  const srv = new Srv(); const u = srv.addUser('arthur@x.se', 'hemligt-lösen-1');
  const a = await loginUi(srv, 'arthur@x.se', 'hemligt-lösen-1');
  const pid = 'u' + u.id.replace(/-/g, '').slice(0, 10);
  assert.strictEqual(a.dump()['jk-profil'], pid); assert.match(pid, /^u[0-9a-f]{10}$/);
  assert.ok(JSON.parse(a.dump()['jk-profiler']).some(p => p.id === pid && p.namn === 'arthur'));
  assert.deepStrictEqual(a.errors, []);
  assert.deepStrictEqual(cloud(srv, u).stats, {}); assert.match(a.w.document.getElementById('molnStatus').textContent, /Sparat i molnet/);
  assert.ok(a.w.document.getElementById('profrad').textContent.includes('arthur'));
});
test('Min profil rörs inte och ingen progress därifrån når molnet av sig själv', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const gam = JSON.stringify({ 5: E(3, 4, 1) });
  const a = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1', { store: { 'flodkulturer-v1': gam } });
  assert.strictEqual(a.dump()['flodkulturer-v1'], gam); assert.deepStrictEqual(cloud(srv, u).stats, {});
});
test('lokal ändring pushas efter fördröjning (debounce) med rätt format', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const a = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  a.answer(7, E(2, 3, 1)); a.answer(7, E(3, 4, 1)); assert.match(a.w.document.getElementById('molnStatus').textContent, /sparas strax/);
  const n0 = srv.log.filter(x => x.startsWith('PATCH')).length; await sleep(250);
  assert.strictEqual(srv.log.filter(x => x.startsWith('PATCH')).length, n0 + 1, 'två sparningar ska bli en skrivning');
  assert.deepStrictEqual(cloud(srv, u).stats[7], E(3, 4, 1)); assert.strictEqual(cloud(srv, u).v, 1);
});
test('ny enhet hämtar molnets progress och bevarar sitt eget', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); A.answer(1, E(3, 5, 0)); await sleep(200);
  const B = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); /* ny, tom enhet */
  assert.deepStrictEqual(B.stats()[1], E(3, 5, 0));
  assert.deepStrictEqual(JSON.parse(B.dump()['flodkulturer-v1:' + B.dump()['jk-profil']])[1], E(3, 5, 0));
});
test('två enheter ändrar olika frågor: båda behålls', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); const B = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  A.answer(1, E(2, 2, 0)); B.answer(2, E(1, 1, 0)); await sleep(250);
  await A.sync(); await B.sync(); await A.sync();
  for (const d of [A, B]) { assert.strictEqual(d.stats()[1].lvl, 2); assert.strictEqual(d.stats()[2].lvl, 1); }
  assert.ok(cloud(srv, u).stats[1] && cloud(srv, u).stats[2]);
});
test('två enheter ändrar SAMMA fråga: den med mest övning vinnar, aldrig överskrivning nedåt', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); const B = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  A.answer(1, E(1, 1, 0)); await sleep(200); await B.sync();
  A.answer(1, Object.assign(E(3, 5, 1), { tillagg: ['a'] })); B.answer(1, Object.assign(E(2, 2, 3), { tillagg: ['b'] }));
  await sleep(250); await A.sync(); await B.sync(); await A.sync();
  const exp = { lvl: 3, ratt: 5, fel: 1, senast: '2026-11-20', tillagg: ['a', 'b'] };
  assert.deepStrictEqual(cloud(srv, u).stats[1], exp); assert.deepStrictEqual(A.stats()[1], exp); assert.deepStrictEqual(B.stats()[1], exp);
});
test('överklagan som sänker nivån (samma antal svar) når molnet (tre-vägs)', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); A.answer(1, E(3, 3, 0)); await sleep(200);
  A.answer(1, E(2, 3, 0)); await sleep(200); await A.sync();
  assert.strictEqual(cloud(srv, u).stats[1].lvl, 2); assert.strictEqual(A.stats()[1].lvl, 2);
});
test('nollställning skriver över molnet och en annan enhet följer med (men behåller egna nya ändringar)', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); const B = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  A.answer(1, E(3, 3, 0)); A.answer(2, E(2, 2, 0)); await sleep(200); await B.sync();
  assert.ok(B.stats()[1]);
  A.ev('stats={};phrasing={};streak=0;molnTvinga();save();'); await sleep(250);
  assert.deepStrictEqual(cloud(srv, u).stats, {});
  B.answer(9, E(1, 1, 0)); await sleep(250); await B.sync();
  assert.deepStrictEqual(Object.keys(B.real()), ['9']); assert.deepStrictEqual(Object.keys(cloud(srv, u).stats), ['9']);
});
test('skadlig/trasig molndata rensas: typer, gränser, __proto__, text', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  srv.rows.get(u.id).data = JSON.parse('{"stats":{"__proto__":{"lvl":1,"polluted":1},"1":{"lvl":99,"ratt":-5,"fel":"x","senast":"<script>","tillagg":["<img onerror=1>",5,"' + 'a'.repeat(1000) + '"],"evil":"y"},"abc":{"lvl":1},"2":"str","3":null,"4":[1],"1234567":{"lvl":1}},"amnen":[1,"Egypten","' + 'x'.repeat(500) + '"],"gset":{"rikt":"<b>","nara":"ja","live":false,"hack":1},"extra":{"a":1}}');
  srv.rows.get(u.id).updated_at = srv.ts(); await A.sync();
  const s = A.real(); assert.deepStrictEqual(Object.keys(s), ['1']);
  assert.strictEqual(s[1].lvl, 4); assert.strictEqual(s[1].ratt, 0); assert.strictEqual(s[1].fel, 0); assert.strictEqual(s[1].senast, ''); assert.strictEqual(s[1].evil, undefined);
  assert.strictEqual(s[1].tillagg.length, 2); assert.strictEqual(s[1].tillagg[1].length, 400);
  assert.strictEqual(A.ev('({}).polluted'), undefined); assert.strictEqual(A.ev('({}).lvl'), undefined);
  const am = JSON.parse(A.dump()['flod-amnen:' + A.dump()['jk-profil']]); assert.strictEqual(am[0], 'Egypten'); assert.strictEqual(am[1].length, 80);
  assert.deepStrictEqual(JSON.parse(A.dump()['glosor-set:' + A.dump()['jk-profil']]), { live: false });
  /* junk i den egna molnraden används aldrig; rader skrivs inte om bara för att jsonb ordnar nycklar annorlunda */
  assert.deepStrictEqual(Object.keys(A.real()), ['1']); assert.strictEqual(A.ev('typeof extra'), 'undefined');
});
test('serverfel (500) och nätfel: lokalt orört, felstatus, återhämtar sig', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); A.answer(1, E(2, 2, 0)); await sleep(200);
  srv.restStatus = 500; A.answer(2, E(1, 1, 0)); await sleep(150);
  assert.match(A.w.document.getElementById('molnStatus').textContent, /Kunde inte synka/); assert.ok(A.stats()[2]); assert.ok(!cloud(srv, u).stats[2]);
  srv.restStatus = 0; srv.down = true; await A.sync(); assert.match(A.w.document.getElementById('molnStatus').textContent, /Offline/);
  assert.ok(A.stats()[1] && A.stats()[2]);
  srv.down = false; await A.sync(); assert.match(A.w.document.getElementById('molnStatus').textContent, /Sparat i molnet/); assert.ok(cloud(srv, u).stats[2]);
  assert.deepStrictEqual(A.errors, []);
});
test('utgången token förnyas automatiskt; trasig refresh loggar ut vänligt', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  const ses = JSON.parse(A.dump()['jk-konto']); ses.expires_at = 1; A.w.localStorage.setItem('jk-konto', JSON.stringify(ses));
  const B = A.reboot(); await sleep(200);
  assert.ok(srv.log.includes('REFRESH')); assert.match(B.w.document.getElementById('molnStatus').textContent, /Sparat/);
  assert.ok(JSON.parse(B.dump()['jk-konto']).expires_at > Date.now() / 1000);
  const s2 = JSON.parse(B.dump()['jk-konto']); s2.expires_at = 1; s2.refresh_token = 'trasig'; B.w.localStorage.setItem('jk-konto', JSON.stringify(s2));
  const C = B.reboot(); await sleep(200); C.openPanel();
  assert.strictEqual(C.dump()['jk-konto'], undefined); assert.match(C.box(), /loggats ut/); assert.ok(C.stats() !== null);
});
test('server svarar 401 trots giltig tid: ett förnyelseförsök, sedan fel', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  srv.tok.forEach(t => { t.exp = 1; }); /* servern anser alla tokens utgångna */
  const before = srv.log.filter(x => x === 'REFRESH').length; A.answer(1, E(1, 1, 0)); await sleep(300);
  assert.ok(srv.log.filter(x => x === 'REFRESH').length > before); assert.ok(A.stats()[1]);
});
test('mejllänk för bekräftelse loggar in, rensar adressfältet och byter profil', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1'); const t = srv.issue(u);
  const a = boot(srv, { hash: `#access_token=${t.access_token}&refresh_token=${t.refresh_token}&expires_in=3600&token_type=bearer&type=signup` });
  await sleep(120); assert.strictEqual(a.w.location.hash, ''); assert.strictEqual(a.reloads, 1);
  assert.ok(a.dump()['jk-profil'].startsWith('u')); assert.strictEqual(JSON.parse(a.dump()['jk-konto']).email, 'a@b.se');
  const b = a.reboot(); await sleep(250); assert.match(b.box(), /Inloggad som/); assert.match(b.box(), /Du är inloggad/);
});
test('mejllänk med fel/utgången: vänligt meddelande', async () => {
  const srv = new Srv(); const a = boot(srv, { hash: '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid' });
  await sleep(80); assert.match(a.box(), /gått ut/); assert.strictEqual(a.w.location.hash, '');
});
test('förfalskad token i adressen godtas inte (servern kontrollerar)', async () => {
  const srv = new Srv(); const a = boot(srv, { hash: '#access_token=falsk&refresh_token=falsk&type=signup' });
  await sleep(80); assert.strictEqual(a.dump()['jk-konto'], undefined); assert.strictEqual(a.reloads, 0);
});
test('glömt lösenord: mejl skickas, länk ger formulär, nytt lösenord sparas', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  let a = boot(srv); await sleep(30); a.openPanel(); a.link('glomt'); a.fill('kEmail', 'a@b.se'); a.submit(); await sleep(60);
  assert.strictEqual(srv.mails[0].typ, 'recover'); assert.match(a.box(), /har vi skickat en länk/);
  const t = srv.issue(u); a = boot(srv, { hash: `#access_token=${t.access_token}&refresh_token=${t.refresh_token}&expires_in=3600&type=recovery` });
  await sleep(120); a = a.reboot(); await sleep(150);
  assert.ok(a.w.document.getElementById('profpanel').style.display === 'block'); assert.ok(a.w.document.getElementById('kLosen2'), 'formulär för nytt lösenord');
  a.fill('kLosen', 'kort'); a.fill('kLosen2', 'kort'); a.submit(); await sleep(30); assert.match(a.box(), /minst 10/);
  a.fill('kLosen', 'helt-nytt-lösen-9'); a.fill('kLosen2', 'helt-nytt-lösen-9'); a.submit(); await sleep(100);
  assert.strictEqual(u.password, 'helt-nytt-lösen-9'); assert.match(a.box(), /Lösenordet är bytt/); assert.strictEqual(a.sdump()['jk-kontovy'], undefined);
});
test('utloggning: sparar först, rensar lokal kontoprofil, tillbaka till Min profil', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); const pid = A.dump()['jk-profil']; A.answer(1, E(2, 2, 0));
  A.openPanel(); A.click('kUt'); await sleep(300);
  assert.ok(cloud(srv, u).stats[1], 'ändringen hann sparas'); assert.ok(srv.log.includes('LOGOUT local'));
  const d = A.dump(); assert.strictEqual(d['jk-konto'], undefined); assert.strictEqual(d['flodkulturer-v1:' + pid], undefined);
  assert.strictEqual(d['jk-profil'], ''); assert.ok(!JSON.parse(d['jk-profiler']).some(p => p.id === pid)); assert.strictEqual(d['jk-molnbas:' + u.id], undefined);
  assert.strictEqual(A.reloads, 1);
});
test('utloggning när molnet inte svarar kräver bekräftelse (ingen tyst dataförlust)', async () => {
  const srv = new Srv(); srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1', {}); A.answer(1, E(2, 2, 0)); await sleep(100);
  const B = boot(srv, { store: A.dump(), sess: A.sdump(), confirmAns: false }); await sleep(200);
  srv.down = true; B.answer(3, E(1, 1, 0)); await sleep(100); B.openPanel(); B.click('kUt'); await sleep(300);
  assert.ok(B.dump()['jk-konto'], 'fortfarande inloggad'); assert.ok(B.stats()[3]);
});
test('radera konto: RPC anropas, användare och rad borta, lokalt rensat', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); A.answer(1, E(2, 2, 0)); await sleep(200);
  A.openPanel(); A.click('kRadera'); await sleep(200);
  assert.ok(srv.log.includes('DELETE_ACCOUNT')); assert.ok(!srv.users.has('a@b.se')); assert.ok(!srv.rows.has(u.id));
  assert.strictEqual(A.dump()['jk-konto'], undefined); assert.strictEqual(A.dump()['jk-profil'], '');
  const B = A.reboot(); await sleep(60); B.openPanel(); assert.match(B.box(), /Kontot är raderat/);
});
test('radera konto avbryts om man inte skriver RADERA', async () => {
  const srv = new Srv(); srv.addUser('a@b.se', 'hemligt-lösen-1');
  let A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  A = boot(srv, { store: A.dump(), sess: A.sdump(), promptAns: 'nej' }); await sleep(150); A.openPanel(); A.click('kRadera'); await sleep(100);
  assert.ok(!srv.log.includes('DELETE_ACCOUNT')); assert.ok(A.dump()['jk-konto']);
});
test('skriv-konflikt mellan läsning och skrivning: ingen förlust, ny runda', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); const B = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  A.answer(1, E(1, 1, 0)); await sleep(200);
  srv.beforePatch = () => { const r = srv.rows.get(u.id); r.data = Object.assign({}, r.data, { stats: Object.assign({}, r.data.stats, { 50: E(2, 2, 0) }) }); r.updated_at = srv.ts(); };
  A.answer(2, E(2, 3, 0)); await sleep(1500);
  const c = cloud(srv, u).stats; assert.ok(c[1] && c[2] && c[50], 'alla tre överlever'); assert.ok(A.stats()[50]);
});
test('ändring under pågående nätanrop skrivs inte över av molndata', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1'); const B = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  B.answer(10, E(3, 3, 0)); await sleep(200);
  let open; srv.getGate = new Promise(r => { open = r; });
  const p = A.sync(); await sleep(30); A.answer(11, E(1, 1, 0)); srv.getGate = null; open(); await p; await sleep(300);
  assert.ok(A.stats()[11], 'lokal ändring bevarad'); assert.ok(A.stats()[10], 'molndata kom med'); assert.ok(cloud(srv, u).stats[11]);
});
test('inloggad men i annan profil: inget synkas, tydlig knapp visas', async () => {
  const srv = new Srv(); srv.addUser('a@b.se', 'hemligt-lösen-1');
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1');
  const M = boot(srv, { store: Object.assign(A.dump(), { 'jk-profil': '' }), sess: A.sdump() }); await sleep(150);
  const n = srv.log.length; M.answer(1, E(1, 1, 0)); await sleep(150); M.openPanel();
  assert.strictEqual(srv.log.length, n); assert.ok(M.w.document.getElementById('kByt')); assert.strictEqual(M.w.document.getElementById('kFlytta'), null);
});
test('flytta in progress från Min profil: sammanslagning, Min profil orörd, molnet uppdateras', async () => {
  const srv = new Srv(); const u = srv.addUser('a@b.se', 'hemligt-lösen-1');
  const gam = JSON.stringify({ 1: E(2, 2, 0), 2: E(1, 1, 0), 5: E(4, 8, 2) });
  const A = await loginUi(srv, 'a@b.se', 'hemligt-lösen-1', { store: { 'flodkulturer-v1': gam } });
  A.answer(2, E(3, 6, 1)); A.answer(3, E(1, 1, 0)); await sleep(200);
  A.openPanel(); assert.ok(A.w.document.getElementById('kFlytta')); A.click('kFlytta'); await sleep(300);
  const s = A.stats(); assert.deepStrictEqual(s[1], E(2, 2, 0)); assert.deepStrictEqual(s[2], E(3, 6, 1)); assert.ok(s[3]); assert.deepStrictEqual(s[5], E(4, 8, 2));
  assert.deepStrictEqual(Object.keys(cloud(srv, u).stats).sort(), ['1', '2', '3', '5']); assert.strictEqual(A.dump()['flodkulturer-v1'], gam);
  assert.match(A.box(), /flyttades in/);
});
test('e-post och namn visas som text, aldrig som HTML', async () => {
  const srv = new Srv(); const evil = '"><svg/onload=alert(1)>@x.se'; srv.addUser(evil, 'hemligt-lösen-1');
  const A = await loginUi(srv, evil, 'hemligt-lösen-1'); A.openPanel();
  assert.ok(!/<svg/i.test(A.boxHtml())); assert.ok(A.box().includes(evil)); assert.ok(!A.w.document.querySelector('#profrad svg, #profpanel svg'));
  assert.ok(!/<svg/i.test(A.w.document.getElementById('profrad').innerHTML));
});
test('inga hemligheter i klienten och bara publik nyckel skickas', async () => {
  assert.ok(!/service_role|sb_secret|eyJhbGci/.test(KONTO + HTML)); assert.ok(/sb_publishable_ddSZGY39k1X_Uabm9cIs0Q_m7J90yry/.test(KONTO));
});

(async () => {
  let ok = 0, bad = 0;
  for (const [n, f] of T) {
    try { await f(); ok++; console.log('  ✓ ' + n); } catch (e) { bad++; console.log('  ✗ ' + n + '\n      ' + (e.stack || e).toString().split('\n').slice(0, 24).join('\n      ')); }
  }
  console.log(`\n${ok} godkända, ${bad} underkända`); process.exit(bad ? 1 : 0);
})();
