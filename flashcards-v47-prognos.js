/* flashcards-v47-prognos.js — prognos för betyg utifrån provresultat.

   Svenska betyg sätts efter kunskapskraven, inte efter procent. Det här är därför
   en grov uppskattning, och den visas som ett spann (försiktigt, troligt,
   hoppfullt) i stället för ett enda betyg. Procentgränserna är en gissning och
   går att ändra.

   Så räknas det
   - Varje prov blir en procent (poäng / max). Senare prov väger tyngre:
     vikten ökar med 25 % per prov i datumordning, gånger provets egen vikt.
   - Spannet runt snittet är 12 / √(antal prov) procentenheter, minst 4.
   - Färre än 3 prov markeras som osäkert.                                      */
(function (root) {
  'use strict';

  var M = (typeof module !== 'undefined' && module.exports) ? require('./flashcards-v46-merit.js') : root.MeritCalc;
  var STD_GRANSER = { A: 85, B: 72, C: 58, D: 45, E: 32 };
  var LAGEN = ['forsiktig', 'sannolik', 'hoppfull'];

  function rensaGranser(g) {
    var o = {}, ok = g && typeof g === 'object';
    ['A', 'B', 'C', 'D', 'E'].forEach(function (k) {
      var v = ok ? +g[k] : NaN;
      o[k] = (isFinite(v) && v >= 0 && v <= 100) ? v : STD_GRANSER[k];
    });
    if (!(o.A > o.B && o.B > o.C && o.C > o.D && o.D > o.E)) return { A: 85, B: 72, C: 58, D: 45, E: 32 };
    return o;
  }

  function procent(t) { return 100 * t.poang / t.max; }

  function sortera(lista) {
    return lista.map(function (t, i) { return { t: t, i: i }; }).sort(function (a, b) {
      var da = a.t.datum || '', db = b.t.datum || '';
      if (da !== db) return da < db ? -1 : 1;
      return a.i - b.i;
    }).map(function (x) { return x.t; });
  }

  function viktatSnitt(lista) {
    var l = sortera(lista), s = 0, w = 0;
    l.forEach(function (t, i) {
      var v = (t.vikt || 1) * (1 + 0.25 * i);
      s += procent(t) * v; w += v;
    });
    return w ? s / w : null;
  }

  function betygFran(pct, g) {
    if (pct >= g.A) return 'A';
    if (pct >= g.B) return 'B';
    if (pct >= g.C) return 'C';
    if (pct >= g.D) return 'D';
    if (pct >= g.E) return 'E';
    return 'F';
  }

  function marginal(n) { return Math.max(4, 12 / Math.sqrt(n)); }

  /* Prognos för ett ämne, eller null om det saknas prov. */
  function prognosAmne(lista, granser) {
    if (!Array.isArray(lista) || !lista.length) return null;
    var g = rensaGranser(granser), n = lista.length, snitt = viktatSnitt(lista), m = marginal(n);
    return {
      snitt: snitt, n: n, marginal: m,
      forsiktig: betygFran(snitt - m, g),
      sannolik: betygFran(snitt, g),
      hoppfull: betygFran(snitt + m, g),
      osaker: n < 3
    };
  }

  /* Betyg per ämne: prognosen där det finns prov, annars det sparade betyget. */
  function prognosBetyg(tests, sparade, granser, lage) {
    var lag = LAGEN.indexOf(lage) >= 0 ? lage : 'sannolik';
    var g = M.rensa(sparade), t = M.rensaTests(tests);
    M.AMNEN.forEach(function (a) {
      var p = prognosAmne(t[a], granser);
      if (p) g[a] = p[lag];
    });
    return g;
  }

  function prognosMerit(tests, sparade, granser) {
    var r = { sparat: M.berakna(sparade).summa };
    LAGEN.forEach(function (l) { r[l] = M.berakna(prognosBetyg(tests, sparade, granser, l)).summa; });
    return r;
  }

  var API = { STD_GRANSER: STD_GRANSER, rensaGranser: rensaGranser, viktatSnitt: viktatSnitt, betygFran: betygFran,
    marginal: marginal, prognosAmne: prognosAmne, prognosBetyg: prognosBetyg, prognosMerit: prognosMerit };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.MeritPrognos = API;
  if (!root || !root.document || !root.MeritApp) return;

  /* ── gränssnitt ──────────────────────────────────────────────────────────── */
  var doc = root.document;
  var GR_NYCKEL = 'flashcards-merit-gransar';
  var valt = M.AMNEN[0];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function tal(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }
  function lasGranser() {
    try { return rensaGranser(JSON.parse(root.localStorage.getItem(GR_NYCKEL) || '{}')); } catch (e) { return rensaGranser(null); }
  }
  function sparaGranser(g) { try { root.localStorage.setItem(GR_NYCKEL, JSON.stringify(g)); } catch (e) { /* inget */ } }
  function idag() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  function rita(p) {
    var t = root.MeritApp.tests(), sp = root.MeritApp.betyg(), gr = lasGranser();
    var pm = prognosMerit(t, sp, gr);
    var lista = t[valt] || [];
    var h = '<p class="q" style="margin-bottom:4px">Prognos</p>' +
      '<p style="margin:0 0 4px;font-size:13px;color:#6A6558">Grov uppskattning av betygen utifrån dina prov. Riktiga betyg sätts efter kunskapskraven, inte procent. Fråga din lärare.</p>' +
      '<p style="margin:8px 0 2px;font-size:15px">Meritvärde: sparat <b>' + tal(pm.sparat) + '</b>, med prognos <b>' + tal(pm.forsiktig) + '</b> (försiktigt), <b>' + tal(pm.sannolik) + '</b> (troligt), <b>' + tal(pm.hoppfull) + '</b> (hoppfullt) av 340</p>' +
      '<p style="margin:14px 0 6px;font-weight:600">Lägg till prov</p>' +
      '<select id="pg-amne" aria-label="Ämne" style="font-size:16px;padding:6px 8px;border-radius:8px;width:100%;margin-bottom:8px">' +
      M.AMNEN.map(function (a) { return '<option' + (a === valt ? ' selected' : '') + '>' + esc(a) + '</option>'; }).join('') + '</select>' +
      '<div style="display:flex;gap:6px;margin-bottom:6px">' +
      '<input id="pg-poang" type="number" inputmode="decimal" min="0" step="any" placeholder="Poäng" aria-label="Poäng" style="flex:1;min-width:0;font-size:16px;padding:6px;border-radius:8px">' +
      '<input id="pg-max" type="number" inputmode="decimal" min="1" step="any" placeholder="Av max" aria-label="Maxpoäng" style="flex:1;min-width:0;font-size:16px;padding:6px;border-radius:8px">' +
      '<input id="pg-vikt" type="number" inputmode="decimal" min="0.1" max="10" step="any" placeholder="Vikt (1)" aria-label="Vikt" style="flex:1;min-width:0;font-size:16px;padding:6px;border-radius:8px"></div>' +
      '<input id="pg-datum" type="date" value="' + idag() + '" aria-label="Datum" style="font-size:16px;padding:6px;border-radius:8px;margin-bottom:8px">' +
      '<div id="pg-fel" style="color:#9C2B2B;font-size:13px;min-height:16px"></div>' +
      '<button class="act" id="pg-add" type="button" style="width:100%">Lägg till prov</button>';
    if (lista.length) {
      h += '<p style="margin:14px 0 4px;font-weight:600">Prov i ' + esc(valt) + '</p>' + lista.map(function (x, i) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;font-size:14px;padding:3px 0"><span>' +
          esc(x.poang) + ' / ' + esc(x.max) + ' (' + tal(100 * x.poang / x.max) + ' %)' + (x.vikt !== 1 ? ', vikt ' + esc(x.vikt) : '') + (x.datum ? ', ' + esc(x.datum) : '') +
          '</span><button type="button" data-pg-del="' + i + '" aria-label="Ta bort prov" style="border:0;background:transparent;font-size:18px;cursor:pointer">✕</button></div>';
      }).join('');
    }
    var med = M.AMNEN.filter(function (a) { return t[a] && t[a].length; });
    h += '<p style="margin:14px 0 4px;font-weight:600">Prognos per ämne</p>';
    if (!med.length) h += '<p style="margin:0;font-size:14px;color:#6A6558">Lägg till prov så visas en prognos här.</p>';
    med.forEach(function (a) {
      var r = prognosAmne(t[a], gr);
      h += '<div class="amne" style="cursor:default"><span class="an">' + esc(a) +
        '<span class="am">' + r.n + ' prov, snitt ' + tal(r.snitt) + ' %' + (r.osaker ? ', osäkert (få prov)' : '') + (sp[a] ? ', sparat betyg ' + esc(sp[a]) : '') + '</span></span>' +
        '<b>' + r.forsiktig + (r.forsiktig === r.hoppfull ? '' : '–' + r.hoppfull) + '</b></div>';
    });
    h += '<details style="margin-top:14px"><summary style="cursor:pointer;font-size:14px">Ändra procentgränserna</summary>' +
      '<p style="font-size:12px;color:#6A6558;margin:6px 0">Lägsta procent för varje betyg. De här gränserna är en gissning, ändra dem efter hur din lärare brukar bedöma.</p>' +
      '<div style="display:flex;gap:6px">' + ['A', 'B', 'C', 'D', 'E'].map(function (k) {
        return '<label style="flex:1;font-size:13px">' + k + '<input data-pg-gr="' + k + '" type="number" min="0" max="100" value="' + gr[k] + '" style="width:100%;font-size:16px;padding:4px;border-radius:6px"></label>';
      }).join('') + '</div></details>';
    p.innerHTML = h;

    p.querySelector('#pg-amne').onchange = function (e) { valt = e.target.value; rita(p); };
    p.querySelector('#pg-add').onclick = function () {
      var poang = parseFloat(p.querySelector('#pg-poang').value), mx = parseFloat(p.querySelector('#pg-max').value);
      var vk = p.querySelector('#pg-vikt').value === '' ? 1 : parseFloat(p.querySelector('#pg-vikt').value);
      var fel = p.querySelector('#pg-fel');
      if (!isFinite(poang) || !isFinite(mx) || mx <= 0) { fel.textContent = 'Fyll i poäng och maxpoäng.'; return; }
      if (poang < 0 || poang > mx) { fel.textContent = 'Poängen måste vara mellan 0 och maxpoängen.'; return; }
      if (!isFinite(vk) || vk < 0.1 || vk > 10) { fel.textContent = 'Vikten måste vara mellan 0,1 och 10.'; return; }
      var nya = root.MeritApp.tests();
      nya[valt] = (nya[valt] || []).concat([{ poang: poang, max: mx, vikt: vk, datum: p.querySelector('#pg-datum').value }]);
      if (nya[valt].length > 20) { fel.textContent = 'Max 20 prov per ämne.'; return; }
      root.MeritApp.sattTests(nya); rita(p);
    };
    p.querySelectorAll('[data-pg-del]').forEach(function (b) {
      b.onclick = function () {
        var nya = root.MeritApp.tests(); nya[valt].splice(+b.getAttribute('data-pg-del'), 1);
        if (!nya[valt].length) delete nya[valt];
        root.MeritApp.sattTests(nya); rita(p);
      };
    });
    p.querySelectorAll('[data-pg-gr]').forEach(function (inp) {
      inp.onchange = function () {
        var g = lasGranser(); g[inp.getAttribute('data-pg-gr')] = parseFloat(inp.value);
        sparaGranser(rensaGranser(g)); rita(p);
      };
    });
  }

  root.MeritApp.registrera('prognos', 'Prognos', rita);
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
