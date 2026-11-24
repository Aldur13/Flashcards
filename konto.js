/* konto.js — konton och molnprogress för Flashcards.

   En egen liten klient mot Supabase (GoTrue för inloggning, PostgREST för data).
   Ingen extern kod laddas. Appen fungerar som förut om den här filen saknas:
   index.html anropar bara molnPush() & co om de finns.

   Så hänger det ihop
   - Varje konto får en egen lokal profil med id u<10 tecken>. Din gamla progress
     i "Min profil" rörs aldrig av sig själv; den flyttas in med en knapp.
   - molnPush() är anropet som index.html gör efter varje sparning. Det väntar en
     stund och synkar sedan.
   - Synken är en tre-vägs-sammanslagning per fråga (lokalt, molnet och senast
     synkade läget). Ingenting skrivs över: har båda sidor ändrat samma fråga
     behålls den där du övat mest.
   - Allt som kommer från molnet rensas (typer, storlekar, nycklar) innan det
     används.                                                                   */
(function () {
  'use strict';

  var CFG = {
    url: 'https://cicxvhjydsmgnysbkjlu.supabase.co',
    key: 'sb_publishable_ddSZGY39k1X_Uabm9cIs0Q_m7J90yry', /* publik, säker att ha i koden */
    site: 'https://aldur13.github.io/Flashcards',
    minLosen: 10,
    vanta: 1500
  };
  if (window.KONTO_CFG && typeof window.KONTO_CFG === 'object') Object.assign(CFG, window.KONTO_CFG);
  window.FLASHCARDS_SUPABASE_CONFIG = { url: CFG.url, key: CFG.key };

  var SES = 'jk-konto';
  var BAS = ['flodkulturer-v1', 'flod-amnen', 'glosor-set'];
  var UID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /* ── små hjälpare ───────────────────────────────────────────────────────── */
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* inget */ } }
  };
  var SS = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* inget */ } },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) { /* inget */ } }
  };
  function h(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }
  function profil() { return (typeof PROFIL === 'string') ? PROFIL : ''; }
  function pk(bas) { var p = profil(); return bas + (p ? ':' + p : ''); }
  function profIdFor(uid) { return 'u' + String(uid).replace(/-/g, '').slice(0, 10); }
  function lasJSON(k) {
    var r = LS.get(k);
    if (r === null) return undefined;
    try { return JSON.parse(r); } catch (e) { return undefined; }
  }
  function vila(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function epostOk(s) { return /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(s) && s.length <= 254; }

  /* ── rensning av data (allt från molnet går igenom här) ─────────────────── */
  function heltal(v, lo, hi) {
    v = Math.floor(Number(v));
    if (!isFinite(v)) return lo;
    return Math.max(lo, Math.min(hi, v));
  }
  function ren(s, max) { return String(s).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max); }

  function rensaEntry(e) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
    var maxL = (typeof MAX === 'number') ? MAX : 4;
    var o = {
      lvl: heltal(e.lvl, 0, maxL),
      ratt: heltal(e.ratt, 0, 100000),
      fel: heltal(e.fel, 0, 100000),
      senast: (typeof e.senast === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.senast)) ? e.senast : ''
    };
    if (Array.isArray(e.tillagg)) {
      var t = [];
      for (var i = 0; i < e.tillagg.length && t.length < 4; i++) {
        if (typeof e.tillagg[i] === 'string') {
          var s = ren(e.tillagg[i], 400).trim();
          if (s && t.indexOf(s) < 0) t.push(s);
        }
      }
      if (t.length) o.tillagg = t;
    }
    return o;
  }
  function rensaStats(s) {
    var o = {};
    if (!s || typeof s !== 'object' || Array.isArray(s)) return o;
    var n = 0;
    Object.keys(s).forEach(function (k) {
      if (n >= 5000 || !/^\d{1,6}$/.test(k)) return; /* bara siffror: stänger dörren för __proto__ & co */
      var e = rensaEntry(s[k]);
      /* appen skapar tomma poster (0/0/0) bara genom att visa statistik: en orörd fråga räknas som ingen post */
      if (e && (e.lvl || e.ratt || e.fel || e.tillagg)) { o[k] = e; n++; }
    });
    return o;
  }
  function rensaAmnen(a) {
    if (!Array.isArray(a)) return null;
    var o = [];
    for (var i = 0; i < a.length && o.length < 200; i++) {
      if (typeof a[i] === 'string') {
        var s = ren(a[i], 80).trim();
        if (s && o.indexOf(s) < 0) o.push(s);
      }
    }
    return o;
  }
  function rensaGset(g) {
    if (!g || typeof g !== 'object' || Array.isArray(g)) return null;
    var o = {};
    ['nara', 'live', 'tal'].forEach(function (k) { if (typeof g[k] === 'boolean') o[k] = g[k]; });
    if (typeof g.rikt === 'string' && /^[a-z]{2}$/.test(g.rikt)) o.rikt = g.rikt;
    return o;
  }
  function rensaData(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
    return { v: 1, stats: rensaStats(d.stats), amnen: rensaAmnen(d.amnen), gset: rensaGset(d.gset) };
  }

  /* ── lokalt läge ────────────────────────────────────────────────────────── */
  function lokal() {
    var st = (typeof stats !== 'undefined' && stats && typeof stats === 'object')
      ? stats : (lasJSON(pk('flodkulturer-v1')) || {});
    return {
      v: 1,
      stats: rensaStats(st),
      amnen: rensaAmnen(lasJSON(pk('flod-amnen'))),
      gset: rensaGset(lasJSON(pk('glosor-set')))
    };
  }
  function tillampa(m) {
    /* appen får en KOPIA: den skapar egna tomma poster i stats, och de ska inte läcka in i m */
    try { if (typeof stats !== 'undefined') stats = JSON.parse(JSON.stringify(m.stats)); } catch (e) { /* inget */ }
    LS.set(pk('flodkulturer-v1'), JSON.stringify(m.stats));
    if (m.amnen) LS.set(pk('flod-amnen'), JSON.stringify(m.amnen));
    if (m.gset) {
      var nu = rensaGset(lasJSON(pk('glosor-set'))) || {};
      LS.set(pk('glosor-set'), JSON.stringify(Object.assign({}, nu, m.gset)));
    }
    try { if (typeof statView === 'function') statView(); } catch (e) { /* inget */ }
    try { if (typeof regView === 'function') regView(); } catch (e) { /* inget */ }
  }

  /* ── sammanslagning ─────────────────────────────────────────────────────── */
  function sj(x) { return x ? JSON.stringify(x) : ''; }
  function union(a, b) {
    var o = (a || []).slice();
    (b || []).forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); });
    return o.sort().slice(0, 4); /* sorterad: alla enheter får samma ordning */
  }
  /* l = lokalt, c = molnet, b = senast synkade läget (kan saknas). */
  function valjEntry(l, c, b) {
    var sl = sj(l), sc = sj(c), sb = b ? sj(b) : null;
    if (sl === sc) return l;
    if (sb !== null) {
      if (sl === sb) return c; /* bara molnet har ändrats */
      if (sc === sb) return l; /* bara den här enheten har ändrats */
    }
    if (!l) return c;
    if (!c) return l;
    /* båda har ändrat: behåll den där du övat mest, aldrig mindre */
    var al = l.ratt + l.fel, ac = c.ratt + c.fel, v;
    if (al !== ac) v = al > ac ? l : c;
    else if (l.senast !== c.senast) v = l.senast > c.senast ? l : c;
    else v = l.lvl >= c.lvl ? l : c;
    var o = Object.assign({}, v);
    var t = union(l.tillagg, c.tillagg);
    if (t.length) o.tillagg = t;
    return o;
  }
  function valjInst(l, c, b, harBas) {
    var sl = JSON.stringify(l), sc = JSON.stringify(c);
    if (sl === sc) return l;
    if (!harBas) return c != null ? c : l; /* ny enhet: kontots inställningar gäller */
    var sb = JSON.stringify(b);
    if (sl === sb) return c;
    if (sc === sb) return l;
    return l != null ? l : c; /* båda har ändrat: den här enhetens val */
  }
  function slaIhop(l, c, b) {
    var ut = { v: 1, stats: {}, amnen: null, gset: null };
    var ids = {};
    Object.keys(l.stats).forEach(function (k) { ids[k] = 1; });
    Object.keys(c.stats).forEach(function (k) { ids[k] = 1; });
    Object.keys(ids).forEach(function (k) {
      var e = valjEntry(l.stats[k], c.stats[k], b ? b.stats[k] : undefined);
      if (e) ut.stats[k] = e;
    });
    ut.amnen = valjInst(l.amnen, c.amnen, b ? b.amnen : null, !!b);
    ut.gset = valjInst(l.gset, c.gset, b ? b.gset : null, !!b);
    return ut;
  }
  function lasBas(uid) {
    var r = lasJSON('jk-molnbas:' + uid);
    return r === undefined ? null : rensaData(r);
  }
  function sparaBas(uid, m) { LS.set('jk-molnbas:' + uid, JSON.stringify(m)); }

  /* ── nätverk ────────────────────────────────────────────────────────────── */
  function felText(j, status) {
    var kod = (j && (j.error_code || j.code)) ? String(j.error_code || j.code) : '';
    var txt = ((j && (j.msg || j.message || j.error_description || j.error)) || '').toString().toLowerCase();
    if (kod === 'invalid_credentials' || txt.indexOf('invalid login') >= 0) return 'Fel e-post eller lösenord.';
    if (kod === 'email_not_confirmed' || txt.indexOf('not confirmed') >= 0) return 'Bekräfta din e-post först. Kolla inkorgen (och skräpposten).';
    if (kod === 'user_already_exists') return 'Det finns redan ett konto med den e-posten.';
    if (kod === 'weak_password') return 'Lösenordet är för svagt. Använd minst ' + CFG.minLosen + ' tecken och blanda gärna bokstäver, siffror och tecken.';
    if (kod === 'same_password') return 'Välj ett annat lösenord än det du har nu.';
    if (kod === 'over_email_send_rate_limit' || kod === 'over_request_rate_limit' || status === 429) return 'För många försök just nu. Vänta en stund och försök igen.';
    if (kod === 'email_address_invalid' || kod === 'validation_failed') return 'Den e-postadressen går inte att använda.';
    if (kod === 'signup_disabled') return 'Det går inte att skapa nya konton just nu.';
    if (kod === 'otp_expired') return 'Länken har gått ut eller är redan använd. Be om en ny.';
    if (kod === 'PGRST205' || kod === '42P01') return 'Molnet är inte färdiguppsatt än (supabase/setup.sql har inte körts).';
    if (status === 401 || status === 403) return 'Du har inte behörighet. Logga ut och in igen.';
    if (status >= 500) return 'Servern svarar inte just nu. Försök igen om en stund.';
    return 'Något gick fel (' + status + ').';
  }
  async function api(path, opt) {
    opt = opt || {};
    var hd = { apikey: CFG.key, 'Content-Type': 'application/json' };
    if (opt.token) hd.Authorization = 'Bearer ' + opt.token;
    if (opt.headers) Object.assign(hd, opt.headers);
    var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var tim = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    var r, tx;
    try {
      r = await fetch(CFG.url + path, {
        method: opt.method || 'GET',
        headers: hd,
        body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined,
        signal: ctl ? ctl.signal : undefined
      });
      tx = await r.text();
    } catch (e) {
      clearTimeout(tim);
      var ne = new Error('Ingen kontakt med servern. Kolla nätet och försök igen.');
      ne.natverk = true;
      throw ne;
    }
    clearTimeout(tim);
    var j = null;
    try { j = tx ? JSON.parse(tx) : null; } catch (e) { j = null; }
    if (!r.ok) {
      var er = new Error(felText(j, r.status));
      er.status = r.status;
      throw er;
    }
    return j;
  }

  /* ── session ────────────────────────────────────────────────────────────── */
  var S = {
    ses: null, kor: false, igen: false, tim: null, tvinga: false, pagar: null, refP: null,
    status: '', typ: '', ok: null, senastTid: 0, vy: 'in', msg: '', msgTyp: '', retry: null, fel: 0
  };
  function lasSes() {
    var s = lasJSON(SES);
    if (s && typeof s === 'object' && typeof s.access_token === 'string' && s.access_token.length < 5000 &&
        typeof s.refresh_token === 'string' && s.refresh_token.length < 500 &&
        typeof s.uid === 'string' && UID_RE.test(s.uid) && typeof s.expires_at === 'number') {
      return { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at,
               uid: s.uid, email: typeof s.email === 'string' ? s.email.slice(0, 254) : '' };
    }
    return null;
  }
  function sparaSes(s) { LS.set(SES, JSON.stringify(s)); }
  function taSes(r, gammal) {
    var u = (r && r.user) || {};
    var uid = u.id || (gammal && gammal.uid);
    if (!r || typeof r.access_token !== 'string' || typeof r.refresh_token !== 'string' ||
        typeof uid !== 'string' || !UID_RE.test(uid)) throw new Error('Oväntat svar från servern.');
    return {
      access_token: r.access_token, refresh_token: r.refresh_token,
      expires_at: Number(r.expires_at) || (Math.floor(Date.now() / 1000) + (Number(r.expires_in) || 3600)),
      uid: uid, email: String(u.email || (gammal && gammal.email) || '').slice(0, 254)
    };
  }
  function aktiv() { return !!(S.ses && profil() === profIdFor(S.ses.uid)); }

  function token() {
    if (!S.ses) return Promise.reject(new Error('Du är inte inloggad.'));
    if (S.ses.expires_at - 60 > Date.now() / 1000) return Promise.resolve(S.ses.access_token);
    if (S.refP) return S.refP;
    var gammal = S.ses;
    S.refP = api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: gammal.refresh_token } })
      .then(function (r) {
        var n = taSes(r, gammal);
        if (n.uid !== gammal.uid) throw new Error('Oväntat svar från servern.');
        S.ses = n; sparaSes(n); S.refP = null;
        return n.access_token;
      }, function (e) {
        S.refP = null;
        if (e.status === 400 || e.status === 401 || e.status === 403) lokalUtlogg('Du har loggats ut. Logga in igen.');
        throw e;
      });
    return S.refP;
  }
  function authApi(path, opt, igen) {
    return token().then(function (t) {
      return api(path, Object.assign({}, opt, { token: t }));
    }).catch(function (e) {
      if (e.status === 401 && !igen && S.ses) { S.ses.expires_at = 0; return authApi(path, opt, true); }
      throw e;
    });
  }
  function lokalUtlogg(msg) {
    S.ses = null; LS.del(SES);
    clearTimeout(S.tim); clearTimeout(S.retry);
    status('');
    S.msg = msg || ''; S.msgTyp = 'fel'; S.vy = 'in';
    kontoRita();
  }

  /* ── status ─────────────────────────────────────────────────────────────── */
  function status(t, typ) {
    S.status = t; S.typ = typ || '';
    var a = el('molnStatus');
    if (a) { a.textContent = t ? '☁ ' + t : ''; a.style.color = typ === 'fel' ? '#FFB4A2' : ''; }
    var b = el('kStatus');
    if (b) { b.textContent = t || ''; b.style.color = typ === 'fel' ? 'var(--clay)' : '#6A6558'; }
  }
  function tid() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  /* ── synk ───────────────────────────────────────────────────────────────── */
  async function hamtaRad(uid) {
    var r = await authApi('/rest/v1/progress?select=data,updated_at&user_id=eq.' + uid);
    if (!Array.isArray(r)) throw new Error('Oväntat svar från servern.');
    return r[0] || null;
  }
  /* Skriver bara om raden är oförändrad sedan vi läste den. Annars false → ny runda. */
  async function skrivRad(uid, data, rad) {
    if (rad) {
      var r = await authApi('/rest/v1/progress?user_id=eq.' + uid + '&updated_at=eq.' + encodeURIComponent(rad.updated_at),
        { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { data: data } });
      return Array.isArray(r) && r.length > 0;
    }
    try {
      await authApi('/rest/v1/progress', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { user_id: uid, data: data } });
      return true;
    } catch (e) {
      if (e.status === 409) return false;
      throw e;
    }
  }
  async function ettVarv() {
    var uid = S.ses.uid;
    status('Synkar…');
    var loc = lokal();
    var rad = await hamtaRad(uid);
    if (S.tvinga) {
      if (!(await skrivRad(uid, loc, rad))) { S.igen = true; return; }
      S.tvinga = false; sparaBas(uid, loc); klart(); return;
    }
    var moln = rensaData(rad ? rad.data : null);
    var m = slaIhop(loc, moln, lasBas(uid));
    if (JSON.stringify(m) !== JSON.stringify(loc)) {
      /* lokalt har ändrats av molnet: gör det bara om inget hänt under tiden */
      if (JSON.stringify(lokal()) !== JSON.stringify(loc) || (typeof busy !== 'undefined' && busy)) { S.igen = true; return; }
      tillampa(m);
    }
    if (!rad || JSON.stringify(m) !== JSON.stringify(moln)) {
      if (!(await skrivRad(uid, m, rad))) { S.igen = true; return; }
    }
    sparaBas(uid, m);
    klart();
  }
  function klart() {
    S.ok = true; S.fel = 0; S.senastTid = Date.now();
    status('Sparat i molnet ' + tid());
  }
  function synka() {
    if (!aktiv()) return Promise.resolve();
    if (S.kor) { S.igen = true; return S.pagar; }
    S.kor = true;
    clearTimeout(S.retry);
    S.pagar = (async function () {
      try {
        var varv = 0;
        do {
          if (S.igen) await vila(600);
          S.igen = false; varv++;
          if (!aktiv()) return;
          await ettVarv();
        } while (S.igen && varv < 4);
        if (S.igen) { S.igen = false; S.retry = setTimeout(synka, 5000); }
      } catch (e) {
        S.ok = false; S.fel++;
        status(e.natverk ? 'Offline. Försöker igen snart.' : ('Kunde inte synka. ' + e.message), 'fel');
        if (S.ses && S.fel <= 5 && (e.natverk || !e.status || e.status >= 500)) S.retry = setTimeout(synka, 30000);
      } finally {
        S.kor = false;
      }
    })();
    return S.pagar;
  }
  window.molnPush = function () {
    if (!aktiv()) return;
    clearTimeout(S.tim);
    status('Ändrat, sparas strax…');
    S.tim = setTimeout(function () { synka(); }, CFG.vanta);
  };
  window.molnTvinga = function () { if (aktiv()) S.tvinga = true; };
  window.kontoSynka = synka;

  /* ── profil på den här enheten ──────────────────────────────────────────── */
  function namnFranEpost(e) {
    var n = String(e || '').split('@')[0].replace(/[\u0000-\u001f<>&"'`]/g, '').trim().slice(0, 16);
    return n || 'Konto';
  }
  function laggTillProfil(pid, epost) {
    if (typeof profLista !== 'function' || typeof profSpara !== 'function') return;
    var l = profLista();
    if (!l.some(function (p) { return p.id === pid; })) { l.push({ id: pid, namn: namnFranEpost(epost) }); profSpara(l); }
  }
  function tabortProfil(pid) {
    var lista = (typeof PROF_BAS !== 'undefined' && Array.isArray(PROF_BAS)) ? PROF_BAS : BAS;
    lista.forEach(function (k) { LS.del(k + ':' + pid); });
    if (typeof profLista === 'function' && typeof profSpara === 'function') {
      profSpara(profLista().filter(function (p) { return p.id !== pid; }));
    }
  }
  function bytProfil(id) {
    if (typeof profByt === 'function') profByt(id);
    else { LS.set('jk-profil', id); location.reload(); }
  }
  function minProfilHarData() {
    var s = lasJSON('flodkulturer-v1');
    return !!(s && typeof s === 'object' && Object.keys(rensaStats(s)).length);
  }
  function oppnaPanel() {
    var p = el('profpanel');
    if (!p) return;
    p.style.display = 'block';
    if (typeof profPanel === 'function') profPanel();
  }

  /* ── flöden: inloggning, konto, lösenord ────────────────────────────────── */
  function efterInlogg(ses, vy) {
    S.ses = ses; sparaSes(ses);
    S.vy = vy || 'in'; S.msg = ''; S.ok = null;
    var pid = profIdFor(ses.uid);
    laggTillProfil(pid, ses.email);
    if (vy === 'nyttlosen') SS.set('jk-kontovy', 'nyttlosen');
    if (profil() !== pid) { SS.set('jk-kontomsg', 'Du är inloggad.'); bytProfil(pid); return; }
    kontoRita(); synka();
  }
  function rensaLokaltFor(ses) {
    var pid = profIdFor(ses.uid);
    tabortProfil(pid);
    LS.del('jk-molnbas:' + ses.uid);
  }
  function msg(t, typ) {
    S.msg = t; S.msgTyp = typ || '';
    var m = el('kMsg');
    if (m) { m.textContent = t; m.style.display = t ? 'block' : 'none'; m.style.color = typ === 'ok' ? 'var(--malachite)' : 'var(--clay)'; }
  }
  function upptagen(on) {
    var b = el('kontoBox');
    if (b) Array.prototype.forEach.call(b.querySelectorAll('button'), function (x) { x.disabled = on; });
  }
  function losenOk(pw) {
    if (pw.length < CFG.minLosen) { msg('Lösenordet måste vara minst ' + CFG.minLosen + ' tecken.', 'fel'); return false; }
    return true;
  }

  async function gorInlogg(e) {
    e.preventDefault();
    var em = el('kEmail').value.trim(), pw = el('kLosen').value;
    if (!epostOk(em)) return msg('Skriv en giltig e-postadress.', 'fel');
    if (!pw) return msg('Skriv ditt lösenord.', 'fel');
    upptagen(true); msg('');
    try {
      var r = await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: em, password: pw } });
      efterInlogg(taSes(r));
    } catch (er) { msg(er.message, 'fel'); upptagen(false); }
  }
  async function gorSkapa(e) {
    e.preventDefault();
    var em = el('kEmail').value.trim(), pw = el('kLosen').value, pw2 = el('kLosen2').value;
    if (!epostOk(em)) return msg('Skriv en giltig e-postadress.', 'fel');
    if (!losenOk(pw)) return;
    if (pw !== pw2) return msg('Lösenorden är inte likadana.', 'fel');
    upptagen(true); msg('');
    try {
      var r = await api('/auth/v1/signup?redirect_to=' + encodeURIComponent(CFG.site),
        { method: 'POST', body: { email: em, password: pw } });
      if (r && r.access_token) { efterInlogg(taSes(r)); return; }
      S.vy = 'mejl'; S.msg = em; kontoRita();
    } catch (er) { msg(er.message, 'fel'); upptagen(false); }
  }
  async function gorGlomt(e) {
    e.preventDefault();
    var em = el('kEmail').value.trim();
    if (!epostOk(em)) return msg('Skriv en giltig e-postadress.', 'fel');
    upptagen(true); msg('');
    try {
      await api('/auth/v1/recover?redirect_to=' + encodeURIComponent(CFG.site), { method: 'POST', body: { email: em } });
      S.vy = 'in'; kontoRita();
      msg('Om det finns ett konto med ' + em + ' har vi skickat en länk för att välja nytt lösenord.', 'ok');
    } catch (er) { msg(er.message, 'fel'); upptagen(false); }
  }
  async function gorNyttLosen(e) {
    e.preventDefault();
    var pw = el('kLosen').value, pw2 = el('kLosen2').value;
    if (!losenOk(pw)) return;
    if (pw !== pw2) return msg('Lösenorden är inte likadana.', 'fel');
    upptagen(true); msg('');
    try {
      await authApi('/auth/v1/user', { method: 'PUT', body: { password: pw } });
      SS.del('jk-kontovy'); S.vy = 'in';
      kontoRita(); msg('Lösenordet är bytt.', 'ok');
    } catch (er) { msg(er.message, 'fel'); upptagen(false); }
  }
  async function loggaUt() {
    var ses = S.ses;
    if (!ses) return;
    upptagen(true);
    if (aktiv()) {
      status('Sparar innan utloggning…');
      try { await synka(); } catch (e) { /* synka fångar själv */ }
      if (S.ok !== true && !confirm('Det finns ändringar som inte har kunnat sparas i molnet. Logga ut ändå? De försvinner då från den här enheten.')) {
        upptagen(false); return;
      }
    }
    try { await api('/auth/v1/logout?scope=local', { method: 'POST', token: ses.access_token }); } catch (e) { /* bäst-försök */ }
    avsluta(ses, 'Du är utloggad. Din progress finns kvar i kontot.');
  }
  async function raderaKonto() {
    if (!S.ses) return;
    if (!confirm('Radera kontot? Din e-post och all progress i molnet tas bort för alltid. Det går inte att ångra.')) return;
    if (prompt('Skriv RADERA för att bekräfta.') !== 'RADERA') return;
    upptagen(true);
    var ses = S.ses;
    try {
      await authApi('/rest/v1/rpc/delete_my_account', { method: 'POST', body: {} });
    } catch (e) { msg(e.message, 'fel'); upptagen(false); return; }
    avsluta(ses, 'Kontot är raderat.');
  }
  function avsluta(ses, meddelande) {
    var pid = profIdFor(ses.uid);
    var varIProfilen = profil() === pid;
    clearTimeout(S.tim); clearTimeout(S.retry);
    S.ses = null; LS.del(SES);
    rensaLokaltFor(ses);
    SS.del('jk-kontovy');
    SS.set('jk-kontomsg', meddelande);
    status('');
    if (varIProfilen) { bytProfil(''); return; }
    S.vy = 'in'; S.msg = meddelande; S.msgTyp = 'ok';
    kontoRita();
  }
  function flyttaIn() {
    if (!aktiv()) return;
    if (!confirm('Flytta in progress från Min profil till kontot? Min profil ligger kvar som den är. Inget skrivs över: för varje fråga behålls den du övat mest.')) return;
    var gam = rensaStats(lasJSON('flodkulturer-v1'));
    var nu = lokal();
    var ny = { v: 1, stats: {}, amnen: nu.amnen || rensaAmnen(lasJSON('flod-amnen')), gset: nu.gset };
    var ids = {}, n = 0;
    Object.keys(nu.stats).forEach(function (k) { ids[k] = 1; });
    Object.keys(gam).forEach(function (k) { ids[k] = 1; });
    Object.keys(ids).forEach(function (k) {
      var e = valjEntry(nu.stats[k], gam[k], null);
      if (e) { ny.stats[k] = e; if (!nu.stats[k] || sj(nu.stats[k]) !== sj(e)) n++; }
    });
    tillampa(ny);
    kontoRita();
    msg('Klart. ' + n + ' frågor flyttades in eller uppdaterades.', 'ok');
    synka();
  }

  /* ── rutan i Profiler-panelen ───────────────────────────────────────────── */
  function falt(id, typ, etikett, ac) {
    return '<label class="lbl" for="' + id + '">' + etikett + '</label>' +
      '<input id="' + id + '" class="ginp" style="font-size:15px" type="' + typ + '" autocomplete="' + ac + '"' +
      (typ === 'email' ? ' autocapitalize="off" spellcheck="false"' : '') + '>';
  }
  function kontoRita() {
    var b = el('kontoBox');
    if (!b) return;
    var u = '<div style="border:1px solid #C9C3B2;border-radius:10px;padding:12px 12px 10px;margin:0 0 14px;background:#FBF8EF">' +
      '<p style="margin:0 0 6px;font-weight:600;font-size:15px">Konto</p>';
    var btn = 'style="padding:8px 12px"';

    if (S.ses && S.vy !== 'nyttlosen') {
      var akt = aktiv();
      u += '<p style="margin:0 0 6px;font-size:14px">Inloggad som <b>' + h(S.ses.email || 'okänd') + '</b></p>' +
        '<div id="kStatus" style="font-size:12px;margin:0 0 8px;color:#6A6558">' + h(S.status) + '</div>';
      if (!akt) {
        u += '<p style="margin:0 0 8px;font-size:13px;line-height:1.5">Du använder en annan profil just nu, så inget synkas. Byt till kontoprofilen för att synka.</p>' +
          '<div class="row"><button class="act" id="kByt" ' + btn + '>Byt till kontoprofilen</button></div>';
      } else {
        u += '<div class="row"><button class="act ghost" id="kSynka" ' + btn + '>Synka nu</button>' +
          (minProfilHarData() ? '<button class="act ghost" id="kFlytta" ' + btn + '>Flytta in progress från Min profil</button>' : '') + '</div>';
      }
      u += '<div class="row"><button class="act ghost" id="kUt" ' + btn + '>Logga ut</button>' +
        '<button class="act ghost" id="kRadera" style="padding:8px 12px;color:var(--clay)">Radera kontot</button></div>';
    } else if (S.vy === 'nyttlosen' && S.ses) {
      u += '<p style="margin:0 0 6px;font-size:13px;line-height:1.5">Välj ett nytt lösenord (minst ' + CFG.minLosen + ' tecken).</p>' +
        '<form id="kForm">' + falt('kLosen', 'password', 'Nytt lösenord', 'new-password') +
        falt('kLosen2', 'password', 'Samma lösenord igen', 'new-password') +
        '<div class="row"><button class="act" type="submit">Spara lösenordet</button></div></form>';
    } else if (S.vy === 'mejl') {
      u += '<p style="margin:0 0 8px;font-size:14px;line-height:1.5">Nästan klart! Vi har skickat ett mejl till <b>' + h(S.msg) +
        '</b>. Klicka på länken i mejlet för att bekräfta kontot. Kolla skräpposten om det inte kommer.</p>' +
        '<div class="row"><button class="act ghost" id="kTill" ' + btn + '>Tillbaka</button></div>';
    } else if (S.vy === 'skapa') {
      u += '<form id="kForm">' + falt('kEmail', 'email', 'E-post', 'email') +
        falt('kLosen', 'password', 'Lösenord (minst ' + CFG.minLosen + ' tecken)', 'new-password') +
        falt('kLosen2', 'password', 'Samma lösenord igen', 'new-password') +
        '<div class="row"><button class="act" type="submit">Skapa konto</button></div></form>' +
        '<p style="margin:10px 0 0;font-size:12px"><a href="#" data-vy="in">Jag har redan ett konto</a></p>';
    } else if (S.vy === 'glomt') {
      u += '<form id="kForm"><p style="margin:0 0 4px;font-size:13px;line-height:1.5">Skriv din e-post så skickar vi en länk för att välja nytt lösenord.</p>' +
        falt('kEmail', 'email', 'E-post', 'email') +
        '<div class="row"><button class="act" type="submit">Skicka länk</button></div></form>' +
        '<p style="margin:10px 0 0;font-size:12px"><a href="#" data-vy="in">Tillbaka</a></p>';
    } else {
      u += '<p style="margin:0 0 6px;font-size:13px;line-height:1.5;color:#6A6558">Du behöver inget konto för att plugga. Ett konto sparar bara din progress i molnet, så att du kan fortsätta på en annan enhet.</p>' +
        '<form id="kForm">' + falt('kEmail', 'email', 'E-post', 'email') +
        falt('kLosen', 'password', 'Lösenord', 'current-password') +
        '<div class="row"><button class="act" type="submit">Logga in</button></div></form>' +
        '<p style="margin:10px 0 0;font-size:12px"><a href="#" data-vy="skapa">Skapa konto</a> · <a href="#" data-vy="glomt">Glömt lösenordet?</a></p>';
    }
    u += '<div id="kMsg" style="display:none;font-size:13px;margin-top:8px;line-height:1.5"></div>';
    if (!S.ses || S.vy === 'mejl') {
      u += '<p style="margin:10px 0 0;font-size:11px;color:#8A836F;line-height:1.5">Vi sparar bara din e-post och din progress, hos Supabase. Använd ett lösenord som du inte har någon annanstans.</p>';
    }
    u += '</div>';
    b.innerHTML = u;

    var m = S.msg;
    if (m && S.vy !== 'mejl') msg(m, S.msgTyp || 'ok');
    S.msg = S.vy === 'mejl' ? S.msg : '';

    var f = el('kForm');
    if (f) {
      if (S.vy === 'nyttlosen') f.onsubmit = gorNyttLosen;
      else if (S.vy === 'skapa') f.onsubmit = gorSkapa;
      else if (S.vy === 'glomt') f.onsubmit = gorGlomt;
      else f.onsubmit = gorInlogg;
    }
    Array.prototype.forEach.call(b.querySelectorAll('[data-vy]'), function (a) {
      a.onclick = function (ev) { ev.preventDefault(); S.vy = a.getAttribute('data-vy'); S.msg = ''; kontoRita(); };
    });
    var map = { kTill: function () { S.vy = 'in'; S.msg = ''; kontoRita(); },
                kSynka: function () { status('Synkar…'); synka(); },
                kFlytta: flyttaIn, kUt: loggaUt, kRadera: raderaKonto,
                kByt: function () { if (S.ses) bytProfil(profIdFor(S.ses.uid)); } };
    Object.keys(map).forEach(function (id) { var x = el(id); if (x) x.onclick = map[id]; });
  }
  window.kontoRita = kontoRita;

  /* ── start ──────────────────────────────────────────────────────────────── */
  function rensaHash() {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* inget */ }
  }
  /* Länkarna i mejlen (bekräfta konto, glömt lösenord) kommer tillbaka med
     tokens efter # i adressen. Returnerar true om något hanterades. */
  async function hanteraHash() {
    var hs = location.hash;
    if (!hs || hs.length < 2) return false;
    var p;
    try { p = new URLSearchParams(hs.slice(1)); } catch (e) { return false; }
    if (p.get('error') || p.get('error_code')) {
      rensaHash();
      S.msg = (p.get('error_code') === 'otp_expired')
        ? 'Länken har gått ut eller är redan använd. Be om en ny.'
        : 'Något gick fel med länken. Försök igen.';
      S.msgTyp = 'fel';
      return true;
    }
    var at = p.get('access_token'), rt = p.get('refresh_token');
    if (!at || !rt) return false;
    var typ = p.get('type');
    rensaHash();
    try {
      var u = await api('/auth/v1/user', { token: at }); /* servern kontrollerar att token är äkta */
      var ses = taSes({
        access_token: at, refresh_token: rt, user: u,
        expires_at: Number(p.get('expires_at')) || 0, expires_in: Number(p.get('expires_in')) || 3600
      });
      efterInlogg(ses, typ === 'recovery' ? 'nyttlosen' : 'in');
      if (typ !== 'recovery') { S.msg = 'Du är inloggad.'; S.msgTyp = 'ok'; }
    } catch (e) {
      S.msg = e.message; S.msgTyp = 'fel';
    }
    return true;
  }
  async function kontoStart() {
    S.ses = lasSes();
    S.vy = SS.get('jk-kontovy') || 'in';
    var sparatMsg = SS.get('jk-kontomsg');
    if (sparatMsg) { S.msg = sparatMsg; S.msgTyp = 'ok'; SS.del('jk-kontomsg'); }
    if (S.vy === 'nyttlosen' && !S.ses) { S.vy = 'in'; SS.del('jk-kontovy'); }
    status(S.status);
    var hanterat = await hanteraHash();
    var harMsg = !!S.msg;
    if (!hanterat && aktiv()) synka();
    if (S.vy === 'nyttlosen' || harMsg) oppnaPanel();
    else kontoRita();
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && aktiv() && Date.now() - S.senastTid > 60000) synka();
  });
  window.addEventListener('online', function () { if (aktiv()) synka(); });
  window.addEventListener('storage', function (ev) {
    if (ev.key === SES && !LS.get(SES) && S.ses) { S.ses = null; kontoRita(); }
  });

  kontoStart();
})();
