/* flashcards-v44-shared.js — delade kort för alla.

   Alla kort som laddas upp blir universella: alla som öppnar appen får dem, och
   de kan användas i övning och tävling. Varje uppladdning MÅSTE klassas in i ett
   ämne (väljs ur en fast lista) och ett område.

   Databasen (tabellen shared_cards) skapas av supabase/v4.4-shared-cards.sql,
   som körs av GitHub Actions. Utan tabellen fungerar appen som förut.

   Kort-id i appen = 100000 + nr. Molnsynken släpper bara igenom siffror med
   högst sex tecken, så id:n måste vara under 1 000 000.                         */
(function (root) {
  'use strict';

  var AMNEN = ['Biologi', 'Fysik', 'Kemi', 'Teknik', 'Matematik', 'Historia', 'Geografi', 'Religion',
    'Samhällskunskap', 'Svenska', 'Engelska', 'Tyska', 'Franska', 'Spanska', 'Musik',
    'Idrott och hälsa', 'Bild', 'Slöjd', 'Hem- och konsumentkunskap', 'Övrigt'];
  var ID_BAS = 100000, ID_MAX = 999999;
  var CACHE = 'flashcards-v44-shared-cache';
  var Q_MIN = 3, Q_MAX = 240, A_MAX = 900, OMR_MIN = 2, OMR_MAX = 60;
  var FIL_MAX = 500000, ANTAL_MAX = 500, BATCH = 100;

  /* ── rena hjälpfunktioner (testas i test/v44-shared.test.js) ─────────────── */
  function ren(s, max) {
    return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function rensaKort(c) {
    if (!c || typeof c !== 'object') return null;
    var q = ren(c.q, Q_MAX), a = ren(c.a, A_MAX);
    if (q.length < Q_MIN || !a) return null;
    return { q: q, a: a, oppen: c.oppen === true || c.oppen === 1 };
  }

  /* Tar emot innehållet i en JSON-fil: {cards:[...]} eller bara [...]. */
  function tolkaFil(text) {
    var d = JSON.parse(text);
    var lista = Array.isArray(d) ? d : (d && Array.isArray(d.cards) ? d.cards : null);
    if (!lista || !lista.length) throw new Error('Filen måste innehålla en lista med kort i "cards".');
    if (lista.length > ANTAL_MAX) throw new Error('Max ' + ANTAL_MAX + ' kort per fil.');
    var sett = {}, ut = [], hoppade = 0;
    lista.forEach(function (c) {
      var r = rensaKort(c);
      if (!r) { hoppade++; return; }
      var n = r.q.toLowerCase();
      if (sett[n]) { hoppade++; return; }
      sett[n] = 1; ut.push(r);
    });
    if (!ut.length) throw new Error('Filen innehöll inga giltiga kort (fråga och svar krävs).');
    return { kort: ut, hoppade: hoppade };
  }

  function omradeOk(s) { var t = ren(s, 200); return t.length >= OMR_MIN && t.length <= OMR_MAX; }

  /* Rader från databasen -> kort för appen. */
  function radTillKort(r) {
    if (!r || typeof r !== 'object') return null;
    var nr = Math.floor(Number(r.nr));
    if (!isFinite(nr) || nr < 1 || ID_BAS + nr > ID_MAX) return null;
    if (AMNEN.indexOf(r.subject) < 0) return null;
    var k = ren(r.category, OMR_MAX), q = ren(r.q, Q_MAX), a = ren(r.a, A_MAX);
    if (k.length < OMR_MIN || q.length < Q_MIN || !a) return null;
    var kort = { id: ID_BAS + nr, k: k, q: q, a: a, delad: true, amne: r.subject };
    if (r.oppen === true) kort.oppen = 1;
    return kort;
  }

  /* Ger varje område ett unikt namn. Samma områdesnamn i två olika ämnen
     (eller samma som ett inbyggt område) får ämnet i parentes, så att
     områdesvalet i appen aldrig blandar ihop dem. */
  function namnge(kort, upptagna) {
    var agare = {};
    Object.keys(upptagna || {}).forEach(function (k) { agare[k] = upptagna[k]; });
    kort.forEach(function (c) {
      var bas = c.k, namn = bas;
      if (agare[namn] && agare[namn] !== c.amne) namn = bas + ' (' + c.amne + ')';
      if (!agare[namn]) agare[namn] = c.amne;
      c.k = namn;
    });
    return kort;
  }

  var test = { ren: ren, rensaKort: rensaKort, tolkaFil: tolkaFil, omradeOk: omradeOk, radTillKort: radTillKort, namnge: namnge, AMNEN: AMNEN };
  if (typeof module !== 'undefined' && module.exports) { module.exports = test; }
  if (typeof document === 'undefined' || typeof CARDS === 'undefined') return;

  /* ── från hit och ner körs bara i webbläsaren ──────────────────────────── */
  var $v = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var CFG = root.FLASHCARDS_SUPABASE_CONFIG || null;
  var delade = [];            /* senast hämtade, rensade rader */
  var tabellSaknas = false;

  function lagrad(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lagra(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* fullt, strunt i cachen */ } }

  async function rest(path, opt) {
    if (!CFG || !CFG.url || !CFG.key) throw new Error('Appen saknar kontakt med databasen.');
    opt = opt || {};
    var hd = { apikey: CFG.key, 'Content-Type': 'application/json' };
    if (opt.token) hd.Authorization = 'Bearer ' + opt.token;
    if (opt.prefer) hd.Prefer = opt.prefer;
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var tim = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
    var r, tx;
    try {
      r = await fetch(CFG.url + '/rest/v1/' + path, {
        method: opt.method || 'GET', headers: hd,
        body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined,
        signal: ctl ? ctl.signal : undefined
      });
      tx = await r.text();
    } catch (e) {
      clearTimeout(tim);
      var ne = new Error('Ingen kontakt med servern. Kolla nätet och försök igen.'); ne.natverk = true; throw ne;
    }
    clearTimeout(tim);
    var j = null; try { j = tx ? JSON.parse(tx) : null; } catch (e) { j = null; }
    if (!r.ok) {
      var kod = j && j.code ? String(j.code) : '';
      var msg = j && j.message ? String(j.message) : '';
      var er = new Error(
        (r.status === 404 || kod === 'PGRST205' || kod === '42P01') ? 'Delade kort är inte aktiverade ännu (databasen är inte uppdaterad).' :
        (kod === '54000') ? msg :
        (kod === '42501' || r.status === 401 || r.status === 403) ? 'Du har inte rätt att göra det. Logga in och försök igen.' :
        (kod === '23514') ? 'Något i kortet var ogiltigt (för långt, för kort eller fel ämne).' :
        'Något gick fel (' + r.status + ').');
      er.status = r.status; er.kod = kod; throw er;
    }
    return j;
  }

  /* ── hämta och sammanfoga ──────────────────────────────────────────────── */
  async function hamtaAlla() {
    var rader = [], sida = 1000;
    for (var sid = 0; sid < 30; sid++) {
      var d = await rest('shared_cards?select=nr,subject,category,q,a,oppen&order=nr.asc&limit=' + sida + '&offset=' + (sid * sida));
      if (!Array.isArray(d)) break;
      rader = rader.concat(d);
      if (d.length < sida) break;
    }
    return rader;
  }

  function sammanfoga(rader) {
    /* ta bort tidigare inlagda delade kort och områden */
    for (var i = CARDS.length - 1; i >= 0; i--) if (CARDS[i].delad) CARDS.splice(i, 1);
    for (var j = STRUKTUR.length - 1; j >= 0; j--) {
      STRUKTUR[j].kat = STRUKTUR[j].kat.filter(function (k) { return !k.delad; });
      if (!STRUKTUR[j].kat.length) STRUKTUR.splice(j, 1);
    }
    var upptagna = {};
    CARDS.forEach(function (c) { if (!upptagna[c.k]) upptagna[c.k] = 'inbyggt'; });
    STRUKTUR.forEach(function (g) { g.kat.forEach(function (k) { if (!upptagna[k.namn]) upptagna[k.namn] = 'inbyggt'; }); });
    var kort = rader.map(radTillKort).filter(Boolean);
    namnge(kort, upptagna);
    var ids = {};
    CARDS.forEach(function (c) { ids[c.id] = 1; });
    kort.forEach(function (c) { if (!ids[c.id]) { ids[c.id] = 1; CARDS.push(c); } });
    /* områden per ämne i STRUKTUR */
    var perAmne = {};
    kort.forEach(function (c) {
      var o = perAmne[c.amne] || (perAmne[c.amne] = []);
      if (o.indexOf(c.k) < 0) o.push(c.k);
    });
    Object.keys(perAmne).sort(function (a, b) { return a.localeCompare(b, 'sv'); }).forEach(function (amne) {
      var g = STRUKTUR.filter(function (x) { return x.amne === amne; })[0];
      if (!g) { g = { amne: amne, kat: [] }; STRUKTUR.push(g); }
      /* ett område per rad: tävlingsmenyn väljer på namn, så namnet måste vara unikt */
      perAmne[amne].sort(function (a, b) { return a.localeCompare(b, 'sv'); }).forEach(function (k) {
        g.kat.push({ namn: k, k: [k], delad: true });
      });
    });
    delade = rader.map(radTillKort).filter(Boolean);
    try { if (typeof ritaAmnesval === 'function' && $v('amnesval') && $v('amnesval').style.display === 'block') ritaAmnesval(); } catch (e) { /* inget */ }
  }

  async function ladda() {
    try {
      var rader = await hamtaAlla();
      tabellSaknas = false;
      sammanfoga(rader);
      var s = JSON.stringify(rader); if (s.length < 2000000) lagra(CACHE, s);
    } catch (e) {
      if (e.status === 404 || e.kod === 'PGRST205' || e.kod === '42P01') tabellSaknas = true;
      try { var c = JSON.parse(lagrad(CACHE) || '[]'); if (Array.isArray(c) && c.length) sammanfoga(c); } catch (e2) { /* inget */ }
    }
    ritaMina();
  }

  /* ── publicera ─────────────────────────────────────────────────────────── */
  async function publicera(amne, omrade, kort) {
    if (AMNEN.indexOf(amne) < 0) throw new Error('Välj ett ämne först.');
    if (!omradeOk(omrade)) throw new Error('Skriv ett område (' + OMR_MIN + '–' + OMR_MAX + ' tecken), till exempel "Cellandning".');
    if (!root.kontoInloggad || !root.kontoInloggad()) throw new Error('Du måste vara inloggad för att dela kort. Logga in under Konto.');
    var token = await root.kontoToken();
    var lagda = 0;
    for (var i = 0; i < kort.length; i += BATCH) {
      var del = kort.slice(i, i + BATCH).map(function (c) {
        return { subject: amne, category: ren(omrade, OMR_MAX), q: c.q, a: c.a, oppen: !!c.oppen };
      });
      var d = await rest('shared_cards?on_conflict=subject,q_norm&select=nr', {
        method: 'POST', token: token, body: del,
        prefer: 'resolution=ignore-duplicates,return=representation'
      });
      lagda += Array.isArray(d) ? d.length : 0;
    }
    return { nya: lagda, fanns: kort.length - lagda };
  }

  /* ── gränssnitt (läggs under AI-fliken, som v41:s generator) ────────────── */
  function byggRuta() {
    var vy = $v('v-set'); if (!vy || $v('v44-delning')) return;
    var st = document.createElement('style');
    st.textContent = '#v41-import{display:none!important}#v44-delning select,#v44-delning input[type=text]{width:100%;padding:9px;border:1px solid #D8D2C0;border-radius:8px;font:inherit;margin:4px 0 8px;box-sizing:border-box}#v44-delning .v44-rad{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #D8D2C0;font-size:13px}#v44-delning textarea{width:100%;box-sizing:border-box}';
    document.head.appendChild(st);
    var box = document.createElement('section');
    box.id = 'v44-delning'; box.className = 'v41-card';
    box.innerHTML = '<h3 style="margin:0 0 5px;font-family:Fraunces,serif">Dela kort med alla</h3>' +
      '<p style="font-size:12px;margin:0 0 9px;line-height:1.5">Kort du laddar upp blir <b>synliga för alla som använder appen</b> och kan användas i övning och tävling. De går inte att göra privata, men du kan ta bort dina egna kort här nedanför. Lägg inte upp namn, personuppgifter eller något olämpligt.</p>' +
      '<label for="v44-amne" style="font-size:13px">Ämne (måste väljas)</label>' +
      '<select id="v44-amne"><option value="">Välj ämne…</option>' + AMNEN.map(function (a) { return '<option>' + esc(a) + '</option>'; }).join('') + '</select>' +
      '<label for="v44-omrade" style="font-size:13px">Område inom ämnet</label>' +
      '<input type="text" id="v44-omrade" maxlength="60" list="v44-omraden" placeholder="Till exempel Andningen">' +
      '<datalist id="v44-omraden"></datalist>' +
      '<label style="font-size:13px;display:flex;gap:8px;align-items:flex-start;margin:4px 0 10px"><input type="checkbox" id="v44-ok" style="margin-top:3px"><span>Jag förstår att korten blir offentliga för alla.</span></label>' +
      '<div class="row"><button class="act" id="v44-fil" type="button">Ladda upp JSON-fil</button><button class="act ghost" id="v44-egna" type="button">Dela mina egna kort</button></div>' +
      '<input id="v44-fil-in" type="file" accept="application/json,.json" hidden>' +
      '<p style="font-size:12px;margin:12px 0 4px">Eller lägg till ett kort:</p>' +
      '<input type="text" id="v44-q" maxlength="240" placeholder="Fråga">' +
      '<textarea id="v44-a" maxlength="900" placeholder="Svar" style="min-height:60px"></textarea>' +
      '<div class="row"><button class="act ghost" id="v44-ett" type="button">Lägg till kortet</button></div>' +
      '<div id="v44-msg" role="status" style="font-size:13px;margin-top:8px"></div>' +
      '<h4 style="margin:16px 0 4px;font-family:Fraunces,serif">Mina delade kort</h4><div id="v44-mina" style="font-size:13px"></div>';
    vy.appendChild(box);

    $v('v44-amne').onchange = uppdateraForslag;
    $v('v44-fil').onclick = function () { if (kollaForst()) $v('v44-fil-in').click(); };
    $v('v44-fil-in').onchange = async function (e) {
      var fil = e.target.files && e.target.files[0]; e.target.value = '';
      if (!fil) return;
      try {
        if (fil.size > FIL_MAX) throw new Error('Filen är större än 500 KB.');
        var t = tolkaFil(await fil.text());
        await skicka(t.kort, t.hoppade);
      } catch (err) { msg('Kunde inte ladda upp: ' + (err.message || 'ogiltig fil'), true); }
    };
    $v('v44-ett').onclick = async function () {
      if (!kollaForst()) return;
      var k = rensaKort({ q: $v('v44-q').value, a: $v('v44-a').value });
      if (!k) { msg('Skriv både en fråga (minst ' + Q_MIN + ' tecken) och ett svar.', true); return; }
      try { await skicka([k], 0); $v('v44-q').value = ''; $v('v44-a').value = ''; } catch (err) { msg(err.message, true); }
    };
    $v('v44-egna').onclick = async function () {
      if (!kollaForst()) return;
      var egna = CARDS.filter(function (c) { return c.k === 'Eget material'; }).map(rensaKort).filter(Boolean);
      if (!egna.length) { msg('Du har inga egna kort att dela. Importera eller skapa några först.', true); return; }
      try {
        var r = await skicka(egna, 0);
        if (r) { /* de ligger nu som delade kort, ta bort de lokala kopiorna så de inte syns två gånger */
          for (var i = CARDS.length - 1; i >= 0; i--) if (CARDS[i].k === 'Eget material') CARDS.splice(i, 1);
          lagra('flashcards-v41-custom-cards', '[]');
        }
      } catch (err) { msg(err.message, true); }
    };
    uppdateraForslag(); ritaMina();
  }

  function msg(t, fel) { var m = $v('v44-msg'); if (m) { m.textContent = t; m.style.color = fel ? '#9B2C2C' : '#1F6B3A'; } }

  function kollaForst() {
    if (tabellSaknas) { msg('Delade kort är inte aktiverade ännu. Kör workflowet "Apply Supabase SQL" på GitHub.', true); return false; }
    if (AMNEN.indexOf($v('v44-amne').value) < 0) { msg('Välj ett ämne först. Alla kort måste klassas in i ett ämne.', true); $v('v44-amne').focus(); return false; }
    if (!omradeOk($v('v44-omrade').value)) { msg('Skriv ett område (' + OMR_MIN + '–' + OMR_MAX + ' tecken).', true); $v('v44-omrade').focus(); return false; }
    if (!$v('v44-ok').checked) { msg('Bocka i rutan om att korten blir offentliga.', true); return false; }
    if (!root.kontoInloggad || !root.kontoInloggad()) { msg('Logga in under Konto för att dela kort.', true); return false; }
    return true;
  }

  async function skicka(kort, hoppade) {
    msg('Laddar upp ' + kort.length + ' kort…');
    var r = await publicera($v('v44-amne').value, $v('v44-omrade').value, kort);
    await ladda();
    msg(r.nya + ' kort delades med alla.' + (r.fanns ? ' ' + r.fanns + ' fanns redan i ämnet.' : '') + (hoppade ? ' ' + hoppade + ' hoppades över (tomma eller dubbletter i filen).' : ''));
    return r;
  }

  function uppdateraForslag() {
    var dl = $v('v44-omraden'); if (!dl) return;
    var amne = $v('v44-amne').value, o = {};
    delade.forEach(function (c) { if (c.amne === amne) o[c.k] = 1; });
    dl.innerHTML = Object.keys(o).map(function (k) { return '<option value="' + esc(k) + '">'; }).join('');
  }

  async function ritaMina() {
    var d = $v('v44-mina'); if (!d) return;
    if (!root.kontoInloggad || !root.kontoInloggad()) { d.textContent = 'Logga in för att se och ta bort dina delade kort.'; return; }
    try {
      var token = await root.kontoToken();
      var rader = await rest('shared_cards?select=nr,subject,category,q&owner_id=eq.' + encodeURIComponent(root.kontoUid()) + '&order=nr.desc&limit=100', { token: token });
      if (!Array.isArray(rader) || !rader.length) { d.textContent = 'Du har inte delat några kort än.'; return; }
      d.innerHTML = rader.map(function (r) {
        var nr = Math.floor(Number(r.nr)); if (!isFinite(nr)) return '';
        return '<div class="v44-rad"><span>' + esc(ren(r.subject, 40)) + ' · ' + esc(ren(r.category, 60)) + '<br>' + esc(ren(r.q, 120)) + '</span><button class="act ghost" type="button" data-nr="' + nr + '" style="padding:5px 12px">Ta bort</button></div>';
      }).join('');
      d.querySelectorAll('button[data-nr]').forEach(function (b) {
        b.onclick = async function () {
          if (!confirm('Ta bort kortet för alla?')) return;
          try {
            await rest('shared_cards?nr=eq.' + encodeURIComponent(b.getAttribute('data-nr')), { method: 'DELETE', token: await root.kontoToken(), prefer: 'return=minimal' });
            await ladda();
          } catch (err) { msg(err.message, true); }
        };
      });
    } catch (e) { d.textContent = tabellSaknas ? '' : 'Kunde inte hämta dina kort.'; }
  }

  function start() {
    var mut = new MutationObserver(function () { if ($v('v-set') && !$v('v44-delning')) byggRuta(); });
    mut.observe(document.body, { childList: true, subtree: true });
    byggRuta();
    ladda();
    /* efter inloggning/utloggning: uppdatera listan med egna kort */
    setInterval(function () { if ($v('v44-mina')) { var inl = !!(root.kontoInloggad && root.kontoInloggad()); if (inl !== start.inl) { start.inl = inl; ritaMina(); } } }, 3000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : globalThis);
