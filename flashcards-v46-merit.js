/* flashcards-v46-merit.js — meritvärdesräknare (sista fliken under Plugga).

   Poäng: A=20, B=17,5, C=15, D=12,5, E=10, F=0, "–" (streck)=0.
   Meritvärdet är summan av de 16 ämnena plus Språkval (moderna språk) som 17:e
   betyg, alltså högst 340. Hemspråk (modersmål) är ett eget ämne som inte ger
   något 17:e betyg och räknas därför inte med här.

   Betygen sparas lokalt, och i molnet (tabellen merit_grades, se
   supabase/v4.6-merit.sql) när man är inloggad. Utan konto eller tabell
   fungerar fliken ändå, bara lokalt.                                          */
(function (root) {
  'use strict';

  var POANG = { A: 20, B: 17.5, C: 15, D: 12.5, E: 10, F: 0, '-': 0 };
  var BETYG = ['A', 'B', 'C', 'D', 'E', 'F', '-'];
  var AMNEN = ['Bild', 'Biologi', 'Engelska', 'Fysik', 'Geografi', 'Hem- och konsumentkunskap',
    'Historia', 'Idrott och hälsa', 'Kemi', 'Matematik', 'Musik', 'Religionskunskap',
    'Samhällskunskap', 'Slöjd', 'Svenska', 'Teknik'];
  var SPRAKVAL = 'Språkval';
  var HEMSPRAK = 'Hemspråk';
  var MAX = 340;
  var LS_NYCKEL = 'flashcards-merit:';

  /* ── rena hjälpfunktioner (testas i test/v46-merit.test.js) ──────────────── */
  function rensa(g) {
    var o = {};
    if (!g || typeof g !== 'object' || Array.isArray(g)) return o;
    AMNEN.concat([SPRAKVAL, HEMSPRAK]).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(g, k) && BETYG.indexOf(g[k]) >= 0) o[k] = g[k];
    });
    return o;
  }

  function rensaTests(t) {
    var o = {};
    if (!t || typeof t !== 'object' || Array.isArray(t)) return o;
    AMNEN.forEach(function (a) {
      if (!Object.prototype.hasOwnProperty.call(t, a) || !Array.isArray(t[a])) return;
      var l = [];
      t[a].slice(0, 20).forEach(function (x) {
        if (!x || typeof x !== 'object') return;
        var mx = +x.max, p = +x.poang, v = x.vikt === undefined ? 1 : +x.vikt;
        if (!isFinite(mx) || mx <= 0 || mx > 1000 || !isFinite(p) || p < 0 || p > mx) return;
        if (!isFinite(v) || v < 0.1 || v > 10) v = 1;
        var d = (typeof x.datum === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.datum)) ? x.datum : '';
        l.push({ poang: Math.round(p * 100) / 100, max: Math.round(mx * 100) / 100, vikt: Math.round(v * 100) / 100, datum: d });
      });
      if (l.length) o[a] = l;
    });
    return o;
  }

  function poang(b) { return Object.prototype.hasOwnProperty.call(POANG, b) ? POANG[b] : 0; }

  function berakna(grades) {
    var g = rensa(grades), summa = 0;
    AMNEN.forEach(function (a) { summa += poang(g[a]); });
    summa += poang(g[SPRAKVAL]);
    return { summa: summa, max: MAX };
  }

  /* Skillnad om ett ämne ändras: ger { fore, efter, diff }. */
  function vadOm(grades, amne, nyttBetyg) {
    var fore = berakna(grades).summa, g = rensa(grades);
    if (BETYG.indexOf(nyttBetyg) >= 0) g[amne] = nyttBetyg;
    var efter = berakna(g).summa;
    return { fore: fore, efter: efter, diff: efter - fore };
  }

  function visaTal(n) { return String(n).replace('.', ','); }

  var API = { POANG: POANG, BETYG: BETYG, AMNEN: AMNEN, SPRAKVAL: SPRAKVAL, HEMSPRAK: HEMSPRAK, MAX: MAX,
    rensa: rensa, rensaTests: rensaTests, poang: poang, berakna: berakna, vadOm: vadOm, visaTal: visaTal };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.MeritCalc = API;
  if (!root || !root.document) return;

  /* ── gränssnitt ──────────────────────────────────────────────────────────── */
  var doc = root.document;
  var sparade = {};          /* sparade betyg */
  var arbets = {};           /* det som visas (i vad-om-läge kan det skilja sig) */
  var tests = {};            /* provresultat per ämne (används av fliken Prognos) */
  var vadomLage = false;
  var molnStatus = '';
  var sparTim = null;
  var testsMoln = true;      /* false om kolumnen tests saknas i databasen (SQL v4.7 ej körd) */
  var vy = 'betyg';
  var vyer = [];             /* andra vyer som registrerar sig: Prognos, Jämför */

  function kopia(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return doc.getElementById(id); }
  function uid() { return (typeof root.kontoInloggad === 'function' && root.kontoInloggad() && typeof root.kontoUid === 'function') ? root.kontoUid() : ''; }
  function lsNyckel() { return LS_NYCKEL + (uid() || 'lokal'); }
  function lsTestNyckel() { return 'flashcards-merit-tests:' + (uid() || 'lokal'); }
  function lasLokalt() {
    try { return rensa(JSON.parse(root.localStorage.getItem(lsNyckel()) || '{}')); } catch (e) { return {}; }
  }
  function lasLokaltTests() {
    try { return rensaTests(JSON.parse(root.localStorage.getItem(lsTestNyckel()) || '{}')); } catch (e) { return {}; }
  }
  function sparaLokalt() {
    try {
      root.localStorage.setItem(lsNyckel(), JSON.stringify(sparade));
      root.localStorage.setItem(lsTestNyckel(), JSON.stringify(tests));
    } catch (e) { /* inget */ }
  }

  function cfg() { return root.FLASHCARDS_SUPABASE_CONFIG || null; }
  async function moln(metod, kropp, fraga) {
    var c = cfg();
    if (!c || typeof root.kontoToken !== 'function') throw new Error('Inget konto.');
    var t = await root.kontoToken();
    var h = { apikey: c.key, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' };
    if (metod === 'POST') h.Prefer = 'resolution=merge-duplicates,return=minimal';
    var r = await root.fetch(c.url + '/rest/v1/merit_grades' + (fraga || ''), {
      method: metod, headers: h, body: kropp ? JSON.stringify(kropp) : undefined
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return metod === 'GET' ? r.json() : null;
  }

  var STATUS_OK = 'Sparas i ditt konto.';
  var STATUS_UTAN_TESTS = 'Betygen sparas i ditt konto. Proven sparas bara på den här enheten tills SQL v4.7 har körts.';

  /* Sparar betyg (och prov om databasen har kolumnen). */
  async function skrivMoln() {
    var kropp = { grades: sparade };
    if (testsMoln) kropp.tests = tests;
    try {
      await moln('POST', kropp, '?on_conflict=user_id');
    } catch (e) {
      if (!testsMoln) throw e;
      await moln('POST', { grades: sparade }, '?on_conflict=user_id');
      testsMoln = false;
    }
    molnStatus = testsMoln ? STATUS_OK : STATUS_UTAN_TESTS;
  }

  async function laddaMoln() {
    if (!uid()) { molnStatus = 'Logga in för att spara i molnet.'; return; }
    try {
      var rader;
      try { rader = await moln('GET', null, '?select=grades,tests&limit=1'); testsMoln = true; }
      catch (e) { rader = await moln('GET', null, '?select=grades&limit=1'); testsMoln = false; }
      if (Array.isArray(rader) && rader[0]) {
        sparade = rensa(rader[0].grades);
        if (testsMoln) tests = rensaTests(rader[0].tests);
        sparaLokalt();
      } else if (Object.keys(sparade).length || Object.keys(tests).length) {
        await skrivMoln();
      }
      molnStatus = testsMoln ? STATUS_OK : STATUS_UTAN_TESTS;
    } catch (e) {
      molnStatus = 'Molnet svarar inte just nu. Allt sparas på den här enheten.';
    }
  }

  function sparaSenare() {
    clearTimeout(sparTim);
    sparTim = setTimeout(async function () {
      sparaLokalt();
      if (!uid()) return;
      try { await skrivMoln(); }
      catch (e) { molnStatus = 'Kunde inte spara i molnet. Allt finns kvar på den här enheten.'; }
      var s = el('merit-status'); if (s) s.textContent = molnStatus;
    }, 600);
  }

  function rad(amne, extra) {
    var v = arbets[amne] || '-';
    var opt = BETYG.map(function (b) {
      return '<option value="' + b + '"' + (b === v ? ' selected' : '') + '>' + (b === '-' ? '–' : b) + '</option>';
    }).join('');
    return '<div class="amne" style="cursor:default"><span class="an">' + esc(amne) +
      (extra ? '<span class="am">' + esc(extra) + '</span>' : '') + '</span>' +
      '<select data-merit="' + esc(amne) + '" aria-label="Betyg i ' + esc(amne) + '" style="font-size:16px;padding:6px 8px;border-radius:8px">' + opt + '</select></div>';
  }

  function ritaBetyg(p) {
    var r = berakna(arbets), diffHtml = '';
    if (vadomLage) {
      var d = r.summa - berakna(sparade).summa;
      diffHtml = '<span class="chip" style="margin-left:8px">' + (d > 0 ? '+' : '') + visaTal(d) + ' mot sparat</span>';
    }
    p.innerHTML =
      '<p class="q" style="margin-bottom:4px">Meritvärde</p>' +
      '<p style="margin:0 0 12px;font-size:26px;font-weight:700" id="merit-summa">' + visaTal(r.summa) + ' / ' + r.max + diffHtml + '</p>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin-bottom:12px"><input type="checkbox" id="merit-vadom"' + (vadomLage ? ' checked' : '') + '> Vad-om-läge (ändringar sparas inte)</label>' +
      AMNEN.map(function (a) { return rad(a); }).join('') +
      rad(SPRAKVAL, 'Moderna språk, ger 17:e betyget') +
      rad(HEMSPRAK, 'Räknas inte med i meritvärdet') +
      '<p id="merit-status" style="margin:12px 0 0;font-size:12px;color:#6A6558">' + esc(molnStatus) + '</p>';
    el('merit-vadom').onchange = function (e) {
      vadomLage = e.target.checked;
      if (!vadomLage) arbets = kopia(sparade);
      rita();
    };
    p.querySelectorAll('select[data-merit]').forEach(function (s) {
      s.onchange = function () {
        arbets[s.getAttribute('data-merit')] = s.value;
        arbets = rensa(arbets);
        if (!vadomLage) { sparade = kopia(arbets); sparaSenare(); }
        rita();
      };
    });
  }

  function rita() {
    var p = el('v-merit'); if (!p) return;
    var alla = [{ id: 'betyg', titel: 'Betyg' }].concat(vyer);
    if (!alla.some(function (v) { return v.id === vy; })) vy = 'betyg';
    var nav = alla.length > 1 ? '<div style="display:flex;gap:6px;margin:0 0 14px" id="merit-nav">' + alla.map(function (v) {
      var pa = v.id === vy;
      return '<button type="button" data-mv="' + esc(v.id) + '" aria-pressed="' + pa + '" style="flex:1;padding:8px 4px;font:inherit;font-size:14px;border-radius:8px;cursor:pointer;border:1px solid var(--ink);' +
        (pa ? 'background:var(--ink);color:var(--lime)' : 'background:transparent;color:var(--ink)') + '">' + esc(v.titel) + '</button>';
    }).join('') + '</div>' : '';
    p.innerHTML = nav + '<div id="merit-vy"></div>';
    p.querySelectorAll('button[data-mv]').forEach(function (b) {
      b.onclick = function () { vy = b.getAttribute('data-mv'); rita(); };
    });
    var inne = el('merit-vy');
    if (vy === 'betyg') { ritaBetyg(inne); return; }
    vyer.forEach(function (v) { if (v.id === vy) v.rita(inne); });
  }

  /* Andra moduler (Prognos, Jämför) kopplar in sig här. */
  root.MeritApp = {
    registrera: function (id, titel, ritaFn) { vyer.push({ id: id, titel: titel, rita: ritaFn }); },
    betyg: function () { return kopia(sparade); },
    tests: function () { return kopia(tests); },
    sattTests: function (t) { tests = rensaTests(t); sparaSenare(); },
    rita: rita
  };

  async function oppna() {
    sparade = lasLokalt(); arbets = kopia(sparade); tests = lasLokaltTests(); vadomLage = false;
    rita();
    await laddaMoln();
    if (!vadomLage) { arbets = kopia(sparade); }
    rita();
  }

  function montera() {
    var rad0 = doc.getElementById('t-set');
    if (!rad0 || doc.getElementById('t-merit')) return;
    var knapp = doc.createElement('button');
    knapp.className = 'tab'; knapp.id = 't-merit'; knapp.setAttribute('role', 'tab');
    knapp.setAttribute('aria-selected', 'false'); knapp.textContent = 'Merit';
    rad0.parentNode.appendChild(knapp);
    var panel = doc.createElement('div');
    panel.id = 'v-merit'; panel.className = 'panel'; panel.style.display = 'none';
    var set = doc.getElementById('v-set'); set.parentNode.insertBefore(panel, set.nextSibling);
    /* views och show() finns i index.html */
    if (typeof views === 'undefined' || typeof show !== 'function') return; // eslint-disable-line no-undef
    views.merit = ['t-merit', 'v-merit']; // eslint-disable-line no-undef
    knapp.onclick = function () { show('merit'); oppna(); }; // eslint-disable-line no-undef
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', montera); else montera();
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
