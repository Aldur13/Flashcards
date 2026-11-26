/* flashcards-v47-cutoffs.js — jämför ditt meritvärde med förra antagningens gränser.

   Siffrorna kommer från flashcards-v47-cutoffs-data.js. Lägsta antagningspoäng är
   meritvärdet hos den sist antagna, och den ändras varje år. Förra årets siffror
   är en vägledning, inte en garanti.

   Status: Över (minst 5 poäng över gränsen), Nära (inom 5 poäng), Under (mer än
   5 under), Alla antagna (ingen gräns förra året).

   Behörighet (särskilt lägsta betyget E, A–E räknas som godkänt):
     alla program: Svenska, Engelska, Matematik
     nt: + Biologi, Fysik, Kemi, tolv godkända ämnen totalt
     sa: + Geografi, Historia, Religionskunskap, Samhällskunskap, tolv totalt
     hf: tolv godkända ämnen totalt
     yrke: åtta godkända ämnen totalt
   Kontrollera alltid de aktuella reglerna hos Skånegy och Skolverket.         */
(function (root) {
  'use strict';

  var M = (typeof module !== 'undefined' && module.exports) ? require('./flashcards-v46-merit.js') : root.MeritCalc;
  var P = (typeof module !== 'undefined' && module.exports) ? require('./flashcards-v47-prognos.js') : root.MeritPrognos;
  var DATA = (typeof module !== 'undefined' && module.exports) ? require('./flashcards-v47-cutoffs-data.js') : root.MERIT_CUTOFFS;

  var TYPER = { nt: 'Natur och teknik', sa: 'Samhälls och humanistiska', hf: 'Ekonomi och estetiska', yrke: 'Yrkesprogram' };
  var GRUND = ['Svenska', 'Engelska', 'Matematik'];
  var EXTRA = {
    nt: { amnen: ['Biologi', 'Fysik', 'Kemi'], totalt: 12 },
    sa: { amnen: ['Geografi', 'Historia', 'Religionskunskap', 'Samhällskunskap'], totalt: 12 },
    hf: { amnen: [], totalt: 12 },
    yrke: { amnen: [], totalt: 8 }
  };

  function godkant(b) { return ['A', 'B', 'C', 'D', 'E'].indexOf(b) >= 0; }

  function status(merit, lagsta) {
    if (lagsta === null || lagsta === undefined) return 'oppen';
    var d = merit - lagsta;
    if (d >= 5) return 'over';
    if (d > -5) return 'nara';
    return 'under';
  }

  /* { ok, saknas: [ämnen utan godkänt], fler: hur många godkända ämnen som fattas } */
  function behorig(typ, grades) {
    var k = EXTRA[typ];
    if (!k) return { ok: false, saknas: [], fler: 0 };
    var g = M.rensa(grades);
    var krav = GRUND.concat(k.amnen);
    var saknas = krav.filter(function (a) { return !godkant(g[a]); });
    var antal = M.AMNEN.filter(function (a) { return godkant(g[a]); }).length;
    var fler = Math.max(0, k.totalt - antal);
    return { ok: saknas.length === 0 && fler === 0, saknas: saknas, fler: fler };
  }

  function filtrera(rader, f) {
    f = f || {};
    return rader.filter(function (r) {
      return (!f.typ || r.typ === f.typ) && (!f.skola || r.skola === f.skola);
    });
  }

  /* Rader med status, marginal och behörighet, sorterade från högst gräns. */
  function jamfor(rader, merit, grades) {
    return rader.map(function (r) {
      var alla = r.lagsta === null || r.lagsta === undefined;
      return Object.assign({}, r, {
        status: status(merit, alla ? null : r.lagsta),
        marginal: alla ? null : merit - r.lagsta,
        behorighet: behorig(r.typ, grades)
      });
    }).sort(function (a, b) {
      return (b.lagsta === null ? -1 : b.lagsta) - (a.lagsta === null ? -1 : a.lagsta) || a.skola.localeCompare(b.skola, 'sv');
    });
  }

  function skolor(rader) {
    var o = [];
    rader.forEach(function (r) { if (o.indexOf(r.skola) < 0) o.push(r.skola); });
    return o.sort(function (a, b) { return a.localeCompare(b, 'sv'); });
  }

  var API = { TYPER: TYPER, status: status, behorig: behorig, filtrera: filtrera, jamfor: jamfor, skolor: skolor };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.MeritCutoffs = API;
  if (!root || !root.document || !root.MeritApp) return;

  /* ── gränssnitt ──────────────────────────────────────────────────────────── */
  var F = { typ: '', skola: '', bara: false, grund: 'sparat' };
  var BADGE = {
    over: ['Över', '#2E7D32'], nara: ['Nära', '#B26A00'], under: ['Under', '#9C2B2B'], oppen: ['Alla antagna', '#3A4A82']
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function tal(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }

  function rita(p) {
    var sparade = root.MeritApp.betyg(), tests = root.MeritApp.tests();
    var harTests = Object.keys(tests).length > 0;
    if (!harTests && F.grund !== 'sparat') F.grund = 'sparat';
    var grades = F.grund === 'sparat' ? sparade : P.prognosBetyg(tests, sparade, null, F.grund);
    var merit = M.berakna(grades).summa;
    var rader = jamfor(filtrera(DATA.rader, F), merit, grades);
    if (F.bara) rader = rader.filter(function (r) { return r.status !== 'under'; });

    var h = '<p class="q" style="margin-bottom:4px">Jämför med förra årets gränser</p>' +
      '<p style="margin:0 0 6px;font-size:13px;color:#6A6558">Gränserna ändras varje år och är en vägledning, inte en garanti. Dina betyg räknas först efter åk 9, och reglerna kan ändras till dess.</p>' +
      '<p style="margin:6px 0 10px;font-size:15px">Ditt meritvärde: <b>' + tal(merit) + ' / 340</b></p>';
    if (harTests) {
      h += '<select id="jf-grund" aria-label="Räkna med" style="font-size:16px;padding:6px 8px;border-radius:8px;width:100%;margin-bottom:8px">' +
        [['sparat', 'Mina sparade betyg'], ['sannolik', 'Prognos, troligt'], ['forsiktig', 'Prognos, försiktigt'], ['hoppfull', 'Prognos, hoppfullt']].map(function (o) {
          return '<option value="' + o[0] + '"' + (F.grund === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select>';
    }
    h += '<div style="display:flex;gap:6px;margin-bottom:8px">' +
      '<select id="jf-typ" aria-label="Programtyp" style="flex:1;min-width:0;font-size:16px;padding:6px 8px;border-radius:8px"><option value="">Alla typer</option>' +
      Object.keys(TYPER).map(function (k) { return '<option value="' + k + '"' + (F.typ === k ? ' selected' : '') + '>' + TYPER[k] + '</option>'; }).join('') + '</select>' +
      '<select id="jf-skola" aria-label="Skola" style="flex:1;min-width:0;font-size:16px;padding:6px 8px;border-radius:8px"><option value="">Alla skolor</option>' +
      skolor(DATA.rader).map(function (s) { return '<option' + (F.skola === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></div>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin-bottom:10px"><input type="checkbox" id="jf-bara"' + (F.bara ? ' checked' : '') + '> Visa bara det jag når (Över eller Nära)</label>';

    if (!rader.length) h += '<p style="font-size:14px">Inga program matchar.</p>';
    rader.forEach(function (r) {
      var b = BADGE[r.status];
      var beh = r.behorighet.ok ? 'Du uppfyller behörigheten med dina betyg.' :
        'Behörighet saknas: ' + (r.behorighet.saknas.length ? 'godkänt betyg i ' + r.behorighet.saknas.map(esc).join(', ') : '') +
        (r.behorighet.saknas.length && r.behorighet.fler ? ' och ' : '') + (r.behorighet.fler ? r.behorighet.fler + ' fler godkända ämnen' : '') + '.';
      h += '<div style="border-top:1px solid #C9CBA0;padding:10px 0">' +
        '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><b>' + esc(r.skola) + '</b><br><span style="font-size:14px">' + esc(r.program) + (r.inriktning ? ', ' + esc(r.inriktning) : '') + '</span></div>' +
        '<span style="flex:none;background:' + b[1] + ';color:#fff;border-radius:6px;padding:3px 8px;font-size:12px">' + b[0] + '</span></div>' +
        '<div style="font-size:14px;margin-top:4px">' + (r.lagsta === null ? 'Alla antagna ' + r.ar : 'Lägsta ' + r.ar + ': <b>' + tal(r.lagsta) + '</b>' + (r.medel !== null ? ' (snitt ' + tal(r.medel) + ')' : '')) +
        (r.marginal !== null ? ', du ligger ' + (r.marginal >= 0 ? '+' : '') + tal(r.marginal) : '') + '</div>' +
        '<div style="font-size:12px;color:#6A6558;margin-top:2px">' + esc(beh) + '</div>' +
        '<div style="font-size:12px;color:#6A6558;margin-top:2px">Källa: ' + esc(r.kallnamn) + (r.kalla === 'tredjepart' ? ' (tredjepart)' : '') + ', ' + esc(r.datum) + ', hämtad ' + esc(DATA.hamtad) +
        ' · <a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">öppna</a></div></div>';
    });
    h += '<p style="font-size:12px;color:#6A6558;margin:12px 0 0">Det här är inte alla Malmös gymnasier, bara de som hunnit läggas in (' + skolor(DATA.rader).length + ' skolor, ' + DATA.rader.length + ' rader). Kontrollera alltid hos Skånegy (skanegy.se).</p>';
    p.innerHTML = h;

    function bind(id, fn) { var e = p.querySelector(id); if (e) e.onchange = fn; }
    bind('#jf-grund', function (e) { F.grund = e.target.value; rita(p); });
    bind('#jf-typ', function (e) { F.typ = e.target.value; rita(p); });
    bind('#jf-skola', function (e) { F.skola = e.target.value; rita(p); });
    bind('#jf-bara', function (e) { F.bara = e.target.checked; rita(p); });
  }

  root.MeritApp.registrera('jamfor', 'Jämför', rita);
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
