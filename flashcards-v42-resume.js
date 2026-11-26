/* Flashcards v4.2 – persistent player reconnection and local answer recovery.
   The host remains the authoritative match server. Player credentials and drafts
   are kept only in that player's browser so a closed tab/browser can reconnect. */
(function () {
  'use strict';

  const SESSION_KEY = 'flashcards-v42-player-sessions';
  const DRAFT_PREFIX = 'flashcards-v42-player-draft-';
  const MAX_SESSIONS = 10;
  const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
  const byId = id => document.getElementById(id);

  function cleanCode(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  }
  function readSessions() {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  function writeSessions(value) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(value)); } catch (_) {}
  }
  function getSession(code) {
    const item = readSessions()[cleanCode(code)];
    if (!item || !item.token || !item.code) return null;
    if (Date.now() - (+item.updatedAt || 0) > MAX_AGE) return null;
    return item;
  }
  function latestSession() {
    return Object.values(readSessions())
      .filter(item => item && item.token && item.code && Date.now() - (+item.updatedAt || 0) <= MAX_AGE)
      .sort((a, b) => (+b.updatedAt || 0) - (+a.updatedAt || 0))[0] || null;
  }
  function saveSession(code, name, token) {
    code = cleanCode(code);
    if (code.length !== 5 || !token) return;
    const sessions = readSessions();
    sessions[code] = {
      code,
      name: String(name || 'Spelare').slice(0, 16),
      token: String(token).slice(0, 80),
      updatedAt: Date.now()
    };
    const kept = Object.values(sessions)
      .filter(item => item && item.token && Date.now() - (+item.updatedAt || 0) <= MAX_AGE)
      .sort((a, b) => (+b.updatedAt || 0) - (+a.updatedAt || 0))
      .slice(0, MAX_SESSIONS);
    const compact = {};
    kept.forEach(item => { compact[cleanCode(item.code)] = item; });
    writeSessions(compact);
  }
  function forgetSession(code) {
    code = cleanCode(code);
    const sessions = readSessions();
    delete sessions[code];
    writeSessions(sessions);
    try { localStorage.removeItem(DRAFT_PREFIX + code); } catch (_) {}
  }
  function readDraft(code) {
    try {
      const value = JSON.parse(localStorage.getItem(DRAFT_PREFIX + cleanCode(code)) || 'null');
      if (!value || typeof value !== 'object') return null;
      return { nr: +value.nr, format: value.format === 'team' ? 'team' : 'solo', text: String(value.text || '').slice(0, 1200) };
    } catch (_) { return null; }
  }
  function writeDraft(code, nr, format, value) {
    if (!code || !nr) return;
    try {
      localStorage.setItem(DRAFT_PREFIX + cleanCode(code), JSON.stringify({
        nr: +nr,
        format: format === 'team' ? 'team' : 'solo',
        text: String(value || '').slice(0, 1200),
        updatedAt: Date.now()
      }));
    } catch (_) {}
  }
  function clearDraft(code) {
    try { localStorage.removeItem(DRAFT_PREFIX + cleanCode(code)); } catch (_) {}
  }
  function persistCurrentSession() {
    try {
      if (!T || T.roll !== 'klient' || T.spectator) return;
      if (T.token) saveSession(T.kod, T.namn, T.token);
      if (T.fas === 'runda') {
        const answer = byId('tSvar');
        if (answer) writeDraft(T.kod, T.nr, T.format && T.format !== 'solo' ? 'team' : 'solo', answer.value);
      }
    } catch (_) {}
  }

  // A player can resume the latest saved session without retyping the code.
  if (typeof tGaMed === 'function') {
    const priorJoinMenu = tGaMed;
    tGaMed = function () {
      priorJoinMenu();
      const session = latestSession();
      const panel = byId('modTavla') && byId('modTavla').querySelector('.panel');
      if (!session || !panel) return;
      const title = panel.querySelector('.q');
      const card = document.createElement('div');
      card.className = 'v41-card';
      const caption = document.createElement('p');
      caption.style.cssText = 'font-size:12px;margin:0 0 8px';
      caption.textContent = 'Sparad spelare: ' + session.name + ' · matchkod ' + session.code;
      const row = document.createElement('div');
      row.className = 'row';
      const resume = document.createElement('button');
      resume.type = 'button';
      resume.className = 'act';
      resume.textContent = 'Återanslut till matchen';
      resume.onclick = () => tAnslut(session.code, session.name);
      const forget = document.createElement('button');
      forget.type = 'button';
      forget.className = 'act ghost';
      forget.textContent = 'Glöm sparad match';
      forget.onclick = () => { forgetSession(session.code); tGaMed(); };
      row.append(resume, forget);
      card.append(caption, row);
      if (title) title.insertAdjacentElement('afterend', card);
      else panel.insertBefore(card, panel.firstChild);
    };
  }

  // Inject the stored resume token before the asynchronous connection handshake.
  if (typeof tAnslut === 'function') {
    const priorConnect = tAnslut;
    tAnslut = function (code, name) {
      const normalized = cleanCode(code);
      const saved = getSession(normalized);
      priorConnect(normalized, saved ? saved.name : name);
      if (T && T.roll === 'klient' && !T.spectator) {
        T.v42SessionCode = normalized;
        if (saved) {
          T.token = saved.token;
          T.namn = saved.name;
        }
      }
    };
  }

  // Save the token when the host first welcomes the player, then refresh it on resume.
  if (typeof tKlientData === 'function') {
    const priorClientData = tKlientData;
    tKlientData = function (message) {
      if (!T || T.roll !== 'klient' || T.spectator || !message || typeof message !== 'object') {
        return priorClientData(message);
      }

      if (message.t === 'valkommen' || message.t === 'aterkommen') {
        if (message.id) T.playerId = String(message.id);
        if (message.namn) T.namn = String(message.namn).slice(0, 16);
        if (message.token) T.token = String(message.token);
        if (T.token) saveSession(T.kod, T.namn, T.token);
      }

      let recovered = null;
      let usedLocalBackup = false;
      let savedDraft = null;
      if (message.t === 'runda') {
        const roundNo = +message.nr || 0;
        savedDraft = readDraft(T.kod);
        const backupMatches = savedDraft && savedDraft.nr === roundNo;
        const teamMode = message.format && message.format !== 'solo';

        if (teamMode) {
          const teamSnapshot = message.drafts && message.teamId && message.drafts[message.teamId];
          const serverText = String(message.teamText != null ? message.teamText : (teamSnapshot && teamSnapshot.text) || '');
          const backupText = backupMatches && savedDraft.format === 'team' && !message.teamSubmitted ? savedDraft.text : '';
          recovered = serverText || backupText;
          usedLocalBackup = !serverText && !!backupText;
          message.teamText = recovered;
          T.format = message.format;
          T.teamId = message.teamId;
          T.teamText = recovered;
        } else {
          const ownSnapshot = message.drafts && T.playerId && message.drafts[T.playerId];
          const serverText = ownSnapshot ? String(ownSnapshot.text || '') : '';
          const hasLocalBackup = !!(backupMatches && savedDraft.format === 'solo');
          // A solo player's same-round local draft is their most recent input,
          // including an intentionally emptied answer, so restore it over an older host snapshot.
          recovered = hasLocalBackup ? savedDraft.text : serverText;
          usedLocalBackup = hasLocalBackup && savedDraft.text !== serverText;
          T.nr = roundNo; // Prevent the base handler from clearing a restored draft.
          T.svarDraft = recovered;
          T.svarText = message.inskickat ? recovered : '';
        }
      }

      if (message.t === 'avvisa' && T.token) forgetSession(T.kod);
      const result = priorClientData(message);

      if (message.t === 'runda' && T && T.roll === 'klient') {
        const answer = byId('tSvar');
        if (answer && typeof recovered === 'string') answer.value = recovered;
        if (answer) writeDraft(T.kod, T.nr, T.format && T.format !== 'solo' ? 'team' : 'solo', answer.value);
        // If the host had not received the last local edit before the tab closed,
        // send that recovered draft back into the host's authoritative match state.
        if (usedLocalBackup && T.conn && T.conn.open) {
          try {
            if (message.format && message.format !== 'solo') {
              T.conn.send({ t: 'team-edit', nr: T.nr, teamId: T.teamId, text: recovered });
            } else {
              T.conn.send({ t: 'draft', nr: T.nr, text: recovered });
            }
          } catch (_) {}
        }
      } else if (message.t === 'resultat' || message.t === 'slut') {
        clearDraft(T.kod);
      }
      return result;
    };
  }

  // Persist each typed character locally; this protects edits made just before disconnect.
  if (typeof tRundaVy === 'function') {
    const priorRoundView = tRundaVy;
    tRundaVy = function () {
      const result = priorRoundView.apply(this, arguments);
      const answer = byId('tSvar');
      if (answer && T && T.roll === 'klient' && !T.spectator) {
        answer.addEventListener('input', () => persistCurrentSession());
        answer.addEventListener('change', () => persistCurrentSession());
        persistCurrentSession();
      }
      return result;
    };
  }

  window.addEventListener('pagehide', persistCurrentSession);
  window.addEventListener('beforeunload', persistCurrentSession);
  window.addEventListener('online', () => {
    if (T && T.roll === 'klient' && !T.spectator && T.token) saveSession(T.kod, T.namn, T.token);
  });

  const badge = byId('v41-badge');
  if (badge) badge.textContent = 'Flashcards v4.2';
})();
