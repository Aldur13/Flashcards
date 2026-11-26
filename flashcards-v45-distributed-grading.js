/* flashcards-v45-distributed-grading.js — spridd rättning i tävlingar.

   Förut rättade värdens AI-nyckel alla svar i varje runda. Nu kan de andra
   spelarna hjälpa till med sina egna nycklar, så att belastningen sprids.

   Så fungerar det
   - Spelare som har en egen nyckel och inte har stängt av det anmäler sig
     ("hjalp") när de gått med i spelet.
   - Vid rättning delar värden upp svaren mellan hjälparna och sig själv. Ingen
     rättar sitt eget svar (om det går att undvika).
   - Värden skickar bara DATA till hjälparen: frågan, facit och svaren. Hjälparens
     webbläsare bygger själv rättningsprompten och använder sin egen nyckel.
     Nycklar skickas aldrig mellan spelare.
   - Svaret valideras av värden (rätt id:n, poäng 1–100, korta kommentarer).
     Uteblir eller misslyckas en hjälpare rättar värden de svaren själv.

   Begränsning: en hjälpare kan i teorin skicka tillbaka fusk-poäng. Därför får
   man aldrig rätta sina egna svar, men poängen går inte att bevisa i efterhand.  */
(function (root) {
  'use strict';

  var KEY_HJALP = 'flashcards-v45-hjalp';        /* "0" = jag vill inte hjälpa till */
  var KEY_SPRID = 'flashcards-v45-spridning';    /* "0" = värden rättar allt själv  */
  var JOBB_TIMEOUT = 70000, MAX_SVAR = 8, MAX_JOBB_PER_SPEL = 300;

  /* ── rena hjälpfunktioner (testas i test/v45-distributed.test.js) ────────── */
  function str(s, max) {
    return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, max);
  }

  /* Delar ut svaren på "platser" (id för dem som rättar). Ett svar går aldrig till
     sin egen författare om det finns någon annan plats. Jämnast fördelning vinner;
     vid lika många går svaret till den första platsen, så lägg värden sist. */
  function fordela(deltar, platser) {
    var ut = {}, antal = {};
    platser.forEach(function (p) { ut[p] = []; antal[p] = 0; });
    deltar.forEach(function (d) {
      var kand = platser.filter(function (p) { return p !== d.id; });
      if (!kand.length) kand = platser.slice();
      var bast = kand[0];
      kand.forEach(function (p) { if (antal[p] < antal[bast]) bast = p; });
      ut[bast].push(d); antal[bast]++;
    });
    return ut;
  }

  function dela(lista, n) {
    var ut = [];
    for (var i = 0; i < lista.length; i += n) ut.push(lista.slice(i, i + n));
    return ut;
  }

  /* Ett jobb från värden, rensat. Null om något är fel. */
  function rensaJobb(m) {
    if (!m || typeof m !== 'object' || typeof m.job !== 'string' || m.job.length > 20) return null;
    var sek = Math.floor(Number(m.sek));
    if (!isFinite(sek) || sek < 5 || sek > 600) return null;
    if (typeof m.fraga !== 'string' || typeof m.facit !== 'string' || !m.fraga || m.fraga.length > 500 || m.facit.length > 2000) return null;
    if (!Array.isArray(m.svar) || !m.svar.length || m.svar.length > MAX_SVAR) return null;
    var svar = [], sett = {};
    for (var i = 0; i < m.svar.length; i++) {
      var s = m.svar[i];
      if (!s || typeof s.id !== 'string' || !s.id || s.id.length > 12 || typeof s.text !== 'string' || sett[s.id]) return null;
      sett[s.id] = 1; svar.push({ id: s.id, text: str(s.text, 1200) });
    }
    return { job: m.job, sek: sek, kort: { q: str(m.fraga, 500), a: str(m.facit, 2000) }, svar: svar };
  }

  /* Betyg från en hjälpare, rensade. Kastar om något id saknas. */
  function rensaSvar(betyg, ids) {
    if (!betyg || typeof betyg !== 'object') throw new Error('Ogiltigt svar från hjälpare.');
    var ut = {};
    ids.forEach(function (id) {
      var b = Object.prototype.hasOwnProperty.call(betyg, id) ? betyg[id] : null;
      var p = b ? Math.round(Number(b.poang)) : NaN;
      if (!b || !isFinite(p)) throw new Error('Hjälparen gav inte betyg åt alla svar.');
      ut[id] = { poang: Math.max(1, Math.min(100, p)), kommentar: str(b.kommentar, 300), fel: str(b.fel, 300) };
    });
    return ut;
  }

  var test = { fordela: fordela, dela: dela, rensaJobb: rensaJobb, rensaSvar: rensaSvar, MAX_SVAR: MAX_SVAR };
  if (typeof module !== 'undefined' && module.exports) module.exports = test;
  if (typeof tDomare !== 'function' || typeof tHostData !== 'function' || typeof tKlientData !== 'function') return;

  /* ── från hit och ner körs bara i webbläsaren ──────────────────────────── */
  var lasBool = function (k) { try { return localStorage.getItem(k) !== '0'; } catch (e) { return true; } };
  var skrivBool = function (k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) { /* inget */ } };

  function kanHjalpa() {
    try {
      return lasBool(KEY_HJALP) && getSource() === 'egen' && String(getKey() || '').length >= 8;
    } catch (e) { return false; }
  }

  /* Värdens egna AI-anrop går en i taget: v4.3 håller sin domare i en global variabel. */
  var kedja = Promise.resolve();
  function seriellt(f) { var p = kedja.then(function () { return f(); }); kedja = p.catch(function () { /* inget */ }); return p; }

  /* ---- värden ---- */
  var baseDomare = tDomare;
  var jobbNr = 0;

  function skickaJobb(s, kort, svar, sek) {
    return new Promise(function (res, rej) {
      if (!T.v45) T.v45 = { jobb: {} };
      var id = 'j' + (++jobbNr);
      var post = { slot: s.id, ids: svar.map(function (d) { return d.id; }), res: res, rej: rej };
      post.timer = setTimeout(function () { delete T.v45.jobb[id]; rej(new Error('Hjälparen svarade inte i tid.')); }, JOBB_TIMEOUT);
      T.v45.jobb[id] = post;
      try {
        s.conn.send({ t: 'dom-jobb', job: id, nr: T.nr, fraga: kort.q, facit: kort.a, sek: sek, svar: svar.map(function (d) { return { id: d.id, text: d.text }; }) });
      } catch (e) { clearTimeout(post.timer); delete T.v45.jobb[id]; rej(e); }
    });
  }

  tDomare = async function (kort, deltar, sek) {
    if (!T || T.roll !== 'host' || !lasBool(KEY_SPRID) || deltar.length < 2) return baseDomare(kort, deltar, sek);
    var hj = Object.values(T.sp).filter(function (s) { return s.id !== 'h' && s.hjalp === true && s.conn && s.conn.open !== false; });
    if (!hj.length) return baseDomare(kort, deltar, sek);

    var platser = hj.map(function (s) { return s.id; }).concat('h');
    var plan = fordela(deltar, platser);
    var betyg = {}, hostSok = false, andras = 0, jobb = [];
    var egen = function (svar) {
      return seriellt(function () { return baseDomare(kort, svar, sek); }).then(function (r) {
        Object.keys(r.betyg).forEach(function (id) { betyg[id] = r.betyg[id]; });
        hostSok = !!r.sok;
      });
    };

    platser.forEach(function (p) {
      var svar = plan[p];
      if (!svar || !svar.length) return;
      if (p === 'h') { jobb.push(egen(svar)); return; }
      var s = T.sp[p];
      dela(svar, MAX_SVAR).forEach(function (del) {
        jobb.push(skickaJobb(s, kort, del, sek).then(function (r) {
          Object.keys(r).forEach(function (id) { betyg[id] = r[id]; });
          andras += del.length;
        }).catch(function () {
          /* hjälparen föll bort eller gav konstigt svar: värden rättar de svaren själv */
          return seriellt(function () { return baseDomare(kort, del, sek); }).then(function (r) {
            Object.keys(r.betyg).forEach(function (id) { betyg[id] = r.betyg[id]; });
          });
        }));
      });
    });

    await Promise.all(jobb);
    deltar.forEach(function (d) { if (!betyg[d.id]) throw new Error('AI:n gav inte betyg åt alla svar.'); });
    return { betyg: betyg, sok: andras ? false : hostSok };
  };

  var baseHost = tHostData;
  tHostData = function (c, m) {
    if (m && typeof m === 'object' && (m.t === 'hjalp' || m.t === 'dom-svar')) {
      try { if (JSON.stringify(m).length > 6000) return; } catch (e) { return; }
      if (!T || T.roll !== 'host' || !c || !c._id || !T.sp[c._id]) return;
      if (m.t === 'hjalp') { T.sp[c._id].hjalp = m.ok === true; return; }
      var post = T.v45 && typeof m.job === 'string' ? T.v45.jobb[m.job] : null;
      if (!post || post.slot !== c._id) return;          /* bara den som fick jobbet får svara */
      clearTimeout(post.timer); delete T.v45.jobb[m.job];
      if (m.fel) { post.rej(new Error('Hjälparen kunde inte rätta.')); return; }
      try { post.res(rensaSvar(m.betyg, post.ids)); } catch (e) { post.rej(e); }
      return;
    }
    return baseHost.apply(this, arguments);
  };

  /* ---- hjälparen (en vanlig spelare) ---- */
  var upptagen = false, jobbAntal = 0;
  var svara = function (m) { try { if (T && T.conn && T.conn.open !== false) T.conn.send(m); } catch (e) { /* inget */ } };

  async function klientJobb(m) {
    var jobb = rensaJobb(m);
    var id = m && typeof m.job === 'string' ? m.job.slice(0, 20) : '';
    if (!jobb) { svara({ t: 'dom-svar', job: id, fel: 'ogiltigt' }); return; }
    if (!kanHjalpa() || upptagen || ++jobbAntal > MAX_JOBB_PER_SPEL) { svara({ t: 'dom-svar', job: id, fel: 'upptagen' }); return; }
    upptagen = true;
    try {
      var prompt = domarPrompt(jobb.kort, jobb.svar, jobb.sek);
      var r = await kampAI(prompt);
      var ut = tParse(r.text, jobb.svar.map(function (d) { return d.id; }));
      var kort = {};
      Object.keys(ut).forEach(function (k) { kort[k] = { poang: ut[k].poang, kommentar: str(ut[k].kommentar, 90), fel: str(ut[k].fel, 90) }; });
      svara({ t: 'dom-svar', job: jobb.job, betyg: kort });
    } catch (e) {
      svara({ t: 'dom-svar', job: jobb.job, fel: 'misslyckades' });   /* inga detaljer: de kan innehålla nyckelfragment */
    } finally { upptagen = false; }
  }

  var baseKlient = tKlientData;
  tKlientData = function (m) {
    if (m && typeof m === 'object' && m.t === 'dom-jobb') { if (T && T.roll === 'klient') klientJobb(m); return; }
    var r = baseKlient.apply(this, arguments);
    if (m && typeof m === 'object' && (m.t === 'valkommen' || m.t === 'aterkommen')) svara({ t: 'hjalp', ok: kanHjalpa() });
    return r;
  };

  /* ---- inställningar (AI-fliken) ---- */
  function byggRuta() {
    var vy = document.getElementById('v-set');
    if (!vy || document.getElementById('v45-spridning')) return;
    var box = document.createElement('section');
    box.id = 'v45-spridning'; box.className = 'v41-card';
    box.innerHTML = '<h3 style="margin:0 0 5px;font-family:Fraunces,serif">Spridd rättning i tävlingar</h3>' +
      '<p style="font-size:12px;margin:0 0 9px;line-height:1.5">I en tävling kan spelarna dela på rättningen med sina egna AI-nycklar, så att värdens nyckel inte tar all belastning. Din nyckel lämnar aldrig din enhet. Bara frågan, facit och svaren i rundan skickas till din AI-tjänst. Du rättar aldrig ditt eget svar.</p>' +
      '<label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:6px 0"><input type="checkbox" id="v45-hjalp" style="margin-top:3px"><span>Hjälp till att rätta andras svar med min nyckel (kräver att du använder egen nyckel)</span></label>' +
      '<label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:6px 0"><input type="checkbox" id="v45-sprid" style="margin-top:3px"><span>När jag är värd: låt andra spelares nycklar hjälpa till</span></label>' +
      '<p id="v45-status" style="font-size:12px;margin:8px 0 0;color:#6a6558"></p>';
    vy.appendChild(box);
    var h = document.getElementById('v45-hjalp'), s = document.getElementById('v45-sprid'), st = document.getElementById('v45-status');
    h.checked = lasBool(KEY_HJALP); s.checked = lasBool(KEY_SPRID);
    var rita = function () {
      var egen = false; try { egen = getSource() === 'egen' && String(getKey() || '').length >= 8; } catch (e) { /* inget */ }
      st.textContent = egen ? 'Din egna nyckel är sparad på den här enheten, så du kan hjälpa till.' : 'Du använder delad nyckel eller har ingen egen nyckel sparad, så du hjälper inte till med rättningen.';
    };
    h.onchange = function () { skrivBool(KEY_HJALP, h.checked); };
    s.onchange = function () { skrivBool(KEY_SPRID, s.checked); };
    rita();
  }
  var mut = new MutationObserver(function () { if (document.getElementById('v-set') && !document.getElementById('v45-spridning')) byggRuta(); });
  mut.observe(document.body, { childList: true, subtree: true });
  byggRuta();
})(typeof window !== 'undefined' ? window : globalThis);
