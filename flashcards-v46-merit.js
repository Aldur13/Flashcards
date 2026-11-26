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
    rensa: rensa, poang: poang, berakna: berakna, vadOm: vadOm, visaTal: visaTal };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (!root || !root.document) return;

  /* ── gränssnitt ──────────────────────────────────────────────────────────── */
  var doc = root.document;
  var sparade = {};          /* det som är sparat */
  var arbets = {};           /* det som visas (i vad-om-läge kan det skilja sig) */
  var vadomLage = false;
  var molnStatus = '';
  var sparTim = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return (typeof root.kontoInloggad === 'function' && root.kontoInloggad() && typeof root.kontoUid === 'function') ? root.kontoUid() : ''; }
  function lsNyckel() { return LS_NYCKEL + (uid() || 'lokal'); }
  function lasLokalt() {
    try { return rensa(JSON.parse(root.localStorage.getItem(lsNyckel()) || '{}')); } catch (e) { return {}; }
  }
  function sparaLokalt(g) { try { root.localStorage.setItem(lsNyckel(), JSON.stringify(g)); } catch (e) { /* inget */ } }

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

  async function laddaMoln() {
    if (!uid()) { molnStatus = 'Logga in för att spara betygen i molnet.'; return; }
    try {
      var rader = await moln('GET', null, '?select=grades&limit=1');
      if (Array.isArray(rader) && rader[0]) {
        sparade = rensa(rader[0].grades);
        sparaLokalt(sparade);
      } else if (Object.keys(sparade).length) {
        await moln('POST', { grades: sparade }, '?on_conflict=user_id');
      }
      molnStatus = 'Sparas i ditt konto.';
    } catch (e) {
      molnStatus = 'Molnet svarar inte just nu. Betygen sparas på den här enheten.';
    }
  }

  function sparaSenare() {
    clearTimeout(sparTim);
    sparTim = setTimeout(async function () {
      sparaLokalt(sparade);
      if (!uid()) return;
      try { await moln('POST', { grades: sparade }, '?on_conflict=user_id'); molnStatus = 'Sparas i ditt konto.'; }
      catch (e) { molnStatus = 'Kunde inte spara i molnet. Betygen finns kvar på den här enheten.'; }
      var s = doc.getElementById('merit-status'); if (s) s.textContent = molnStatus;
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

  function rita() {
    var p = doc.getElementById('v-merit'); if (!p) return;
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
    doc.getElementById('merit-vadom').onchange = function (e) {
      vadomLage = e.target.checked;
      if (!vadomLage) arbets = JSON.parse(JSON.stringify(sparade));
      rita();
    };
    p.querySelectorAll('select[data-merit]').forEach(function (s) {
      s.onchange = function () {
        arbets[s.getAttribute('data-merit')] = s.value;
        arbets = rensa(arbets);
        if (!vadomLage) { sparade = JSON.parse(JSON.stringify(arbets)); sparaSenare(); }
        rita();
      };
    });
  }

  async function oppna() {
    sparade = lasLokalt(); arbets = JSON.parse(JSON.stringify(sparade)); vadomLage = false;
    rita();
    await laddaMoln();
    if (!vadomLage) { arbets = JSON.parse(JSON.stringify(sparade)); }
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
    // eslint-disable-next-line no-undef
    views.merit = ['t-merit', 'v-merit'];
    knapp.onclick = function () { show('merit'); oppna(); }; // eslint-disable-line no-undef
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', montera); else montera();
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
