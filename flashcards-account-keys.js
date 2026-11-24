/* Account-linked encrypted API key vault UI and provider fallback integration. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const PROVIDERS = Object.keys(PROV).filter(p => p !== 'custom');
  const emptyVault = () => ({ version: 1, primary: {}, judges: [] });
  let vault = emptyVault();
  let loaded = false;
  let activeKeyOverride = null;
  const safeText = value => String(value == null ? '' : value).slice(0, 160);
  const mask = key => key.length < 9 ? '••••••' : key.slice(0, 3) + '••••••' + key.slice(-3);

  function normalize(value) {
    const out = emptyVault();
    if (!value || typeof value !== 'object') return out;
    PROVIDERS.forEach(provider => {
      const rows = value.primary && Array.isArray(value.primary[provider]) ? value.primary[provider] : [];
      out.primary[provider] = rows.slice(0, 3).filter(row => row && typeof row.key === 'string' && row.key.trim())
        .map(row => ({ key: row.key.trim().slice(0, 4096), model: safeText(row.model), model2: safeText(row.model2) }));
    });
    out.judges = (Array.isArray(value.judges) ? value.judges : []).slice(0, 2)
      .filter(row => row && PROVIDERS.includes(row.prov) && typeof row.key === 'string' && row.key.trim())
      .map(row => ({ prov: row.prov, key: row.key.trim().slice(0, 4096), model: safeText(row.model) }));
    return out;
  }

  function rowsFor(provider) {
    return (vault.primary[provider] || []).slice(0, 3);
  }
  function accountReady() {
    return typeof window.flashcardsAccountReady === 'function' && window.flashcardsAccountReady();
  }
  function showMessage(message, ok) {
    const node = $('account-key-message');
    if (!node) return;
    node.textContent = message;
    node.style.color = ok ? 'var(--malachite)' : 'var(--clay)';
  }
  async function request(action, payload) {
    if (!accountReady()) throw new Error('Logga in och byt till kontoprofilen under Profil först.');
    if (typeof window.flashcardsVaultRequest !== 'function') throw new Error('Kontofunktionen är inte tillgänglig. Ladda om sidan.');
    const result = await window.flashcardsVaultRequest({ action, ...payload });
    if (result && result.error) throw new Error(result.error);
    return result || {};
  }
  async function loadVault() {
    try {
      const result = await request('get');
      vault = normalize(result.vault);
      loaded = true;
      window.FLASHCARDS_ACCOUNT_VAULT = vault;
      window.FLASHCARDS_ACCOUNT_VAULT_ACTIVE = true;
      if (typeof window.flashcardsRenderJudges === 'function') window.flashcardsRenderJudges();
      render();
      showMessage('Nyckelvalvet är synkat med ditt konto.', true);
      return true;
    } catch (error) {
      loaded = false;
      window.FLASHCARDS_ACCOUNT_VAULT_ACTIVE = false;
      showMessage(error.message || 'Kunde inte läsa nyckelvalvet.', false);
      return false;
    }
  }
  async function saveVault() {
    if (!loaded) throw new Error('Läs in nyckelvalvet från kontot först.');
    const cleaned = normalize(vault);
    await request('save', { vault: cleaned });
    vault = cleaned;
    window.FLASHCARDS_ACCOUNT_VAULT = vault;
    window.FLASHCARDS_ACCOUNT_VAULT_ACTIVE = true;
    if (typeof window.flashcardsRenderJudges === 'function') window.flashcardsRenderJudges();
    render();
    showMessage('Sparat krypterat på ditt konto.', true);
  }
  window.flashcardsAccountVaultClear = function () {
    loaded = false;
    vault = emptyVault();
    window.FLASHCARDS_ACCOUNT_VAULT = null;
    window.FLASHCARDS_ACCOUNT_VAULT_ACTIVE = false;
    render();
  };
  window.flashcardsSaveAccountJudges = async function (judges) {
    if (!loaded) return false;
    vault.judges = Array.isArray(judges) ? judges.slice(0, 2) : [];
    await saveVault();
    return true;
  };

  const baseGetKey = getKey;
  getKey = function () {
    if (activeKeyOverride) return activeKeyOverride;
    if (loaded && window.FLASHCARDS_ACCOUNT_VAULT_ACTIVE) {
      const provider = getSource() === 'delad' ? null : egenProv();
      const first = provider && rowsFor(provider)[0];
      if (first) return first.key;
    }
    return baseGetKey();
  };
  const baseGetModel = getModel;
  getModel = function () {
    if (loaded && window.FLASHCARDS_ACCOUNT_VAULT_ACTIVE && getSource() !== 'delad') {
      const first = rowsFor(egenProv())[0];
      if (first && first.model) return first.model;
    }
    return baseGetModel();
  };
  const baseGetModel2 = getModel2;
  getModel2 = function () {
    if (loaded && window.FLASHCARDS_ACCOUNT_VAULT_ACTIVE && getSource() !== 'delad') {
      const first = rowsFor(egenProv())[0];
      if (first && first.model2) return first.model2;
    }
    return baseGetModel2();
  };

  // Retry authentication/quota failures with the next private key for this provider.
  const baseApi = api;
  api = async function (prompt, modelOverride, entry, extra) {
    if (entry || !loaded || !window.FLASHCARDS_ACCOUNT_VAULT_ACTIVE || getSource() === 'delad') {
      return baseApi(prompt, modelOverride, entry, extra);
    }
    const rows = rowsFor(egenProv());
    if (rows.length < 2) return baseApi(prompt, modelOverride, entry, extra);
    let lastError;
    for (const row of rows) {
      activeKeyOverride = row.key;
      try {
        return await baseApi(prompt, modelOverride, entry, extra);
      } catch (error) {
        lastError = error;
        if (![401, 402, 403, 404, 429].includes(Number(error && error.status))) throw error;
      } finally {
        activeKeyOverride = null;
      }
    }
    throw lastError || new Error('Ingen av kontots reservnycklar fungerade.');
  };

  function providerOptions(selected) {
    return PROVIDERS.map(p => '<option value="' + p + '"' + (p === selected ? ' selected' : '') + '>' +
      esc(PROV[p].namn) + '</option>').join('');
  }
  function render() {
    const host = $('account-key-content');
    if (!host) return;
    if (!loaded) {
      host.innerHTML = '<p style="font-size:13px;color:#6A6558;line-height:1.5">Logga in och välj kontoprofilen under Profil. Tryck sedan på Hämta från konto. Nycklarna lagras krypterade på servern och delas inte med andra spelare.</p>';
      return;
    }
    let html = '<p style="font-size:13px;color:#6A6558;line-height:1.5">Upp till tre nycklar per leverantör. Den första är huvudnyckel; om den avvisas eller når kvoten provas nästa automatiskt. Nycklarna följer kontot mellan enheter.</p>';
    html += '<label class="lbl" for="account-key-provider">Leverantör</label><select id="account-key-provider">' + providerOptions(egenProv()) + '</select>';
    html += '<label class="lbl" for="account-key-input">API-nyckel</label><input id="account-key-input" type="password" autocomplete="new-password" placeholder="Klistra in ny nyckel">';
    html += '<div class="row"><button class="act" type="button" id="account-key-add">Lägg till huvud-/reservnyckel</button></div>';
    html += '<div id="account-key-list"></div><div style="height:12px"></div>';
    html += '<p style="margin:0 0 5px;font-family:Fraunces,serif;font-size:17px">Extra AI-domare</p>';
    html += '<p style="font-size:12px;color:#6A6558;margin:0 0 8px">Huvuddomaren använder leverantören ovan i vanliga AI-inställningar. Lägg till upp till två separata domare här.</p>';
    for (let i = 0; i < 2; i++) {
      const row = vault.judges[i] || { prov: 'gemini', key: '', model: '' };
      html += '<div style="border-top:1px solid #C9C3B2;padding:9px 0"><b style="font-size:13px">Domare ' + (i + 2) + '</b>';
      html += '<label class="lbl">Leverantör</label><select id="account-judge-provider-' + i + '">' + providerOptions(row.prov) + '</select>';
      html += '<label class="lbl">API-nyckel</label><input id="account-judge-key-' + i + '" type="password" autocomplete="new-password" value="' + esc(row.key) + '" placeholder="API-nyckel">';
      html += '<label class="lbl">Modell (valfritt)</label><input id="account-judge-model-' + i + '" type="text" value="' + esc(row.model) + '" placeholder="Standardmodell används annars">';
      html += '</div>';
    }
    html += '<div class="row"><button class="act" type="button" id="account-key-save">Spara nyckelvalvet</button><button class="act ghost" type="button" id="account-key-clear">Rensa alla</button></div>';
    host.innerHTML = html;

    const list = $('account-key-list');
    PROVIDERS.forEach(provider => {
      const rows = rowsFor(provider);
      if (!rows.length) return;
      const section = document.createElement('div');
      section.style.cssText = 'border-top:1px solid #C9C3B2;padding:8px 0';
      const title = document.createElement('p');
      title.className = 'rq';
      title.textContent = PROV[provider].namn;
      section.appendChild(title);
      rows.forEach((row, index) => {
        const line = document.createElement('div');
        line.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;padding:4px 0';
        const label = document.createElement('span');
        label.textContent = (index === 0 ? 'Huvudnyckel · ' : 'Reserv ' + index + ' · ') + mask(row.key);
        const remove = document.createElement('button');
        remove.type = 'button'; remove.className = 'act ghost';
        remove.style.cssText = 'flex:0 0 auto;padding:5px 9px;font-size:12px';
        remove.textContent = 'Ta bort';
        remove.onclick = async () => {
          vault.primary[provider].splice(index, 1);
          try { await saveVault(); } catch (error) { showMessage(error.message, false); }
        };
        line.append(label, remove); section.appendChild(line);
      });
      list.appendChild(section);
    });

    $('account-key-add').onclick = async () => {
      const provider = $('account-key-provider').value;
      const key = $('account-key-input').value.trim();
      if (!key) return showMessage('Skriv in en API-nyckel först.', false);
      vault.primary[provider] = rowsFor(provider);
      if (vault.primary[provider].length >= 3) return showMessage('Du kan ha högst tre nycklar per leverantör.', false);
      if (vault.primary[provider].some(row => row.key === key)) return showMessage('Den nyckeln finns redan.', false);
      vault.primary[provider].push({ key, model: '', model2: '' });
      $('account-key-input').value = '';
      try { await saveVault(); } catch (error) { showMessage(error.message, false); }
    };
    $('account-key-save').onclick = async () => {
      vault.judges = [0, 1].map(i => ({
        prov: $('account-judge-provider-' + i).value,
        key: $('account-judge-key-' + i).value.trim(),
        model: $('account-judge-model-' + i).value.trim()
      })).filter(row => row.key);
      try { await saveVault(); } catch (error) { showMessage(error.message, false); }
    };
    $('account-key-clear').onclick = async () => {
      if (!confirm('Radera alla API-nycklar och extra domare från kontot?')) return;
      vault = emptyVault();
      try { await saveVault(); } catch (error) { showMessage(error.message, false); }
    };
  }

  function mount() {
    const panel = $('v-set');
    if (!panel || $('account-key-vault')) return;
    const box = document.createElement('section');
    box.id = 'account-key-vault';
    box.className = 'v41-card';
    box.style.marginTop = '18px';
    box.innerHTML = '<h3 style="margin:0 0 5px;font-family:Fraunces,serif">API-nycklar på kontot</h3>' +
      '<p style="font-size:12px;color:#6A6558;margin:0 0 9px">Privat nyckelvalv · krypterat i databasen</p>' +
      '<div class="row"><button class="act ghost" type="button" id="account-key-load">Hämta från konto / synka</button></div>' +
      '<div id="account-key-message" style="font-size:12px;margin:8px 0"></div><div id="account-key-content"></div>';
    panel.appendChild(box);
    $('account-key-load').onclick = loadVault;
    render();
    if (accountReady()) loadVault();
  }

  mount();
  const observer = new MutationObserver(() => {
    mount();
    if (accountReady() && !loaded) loadVault();
    if (!accountReady() && loaded) window.flashcardsAccountVaultClear();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('storage', event => {
    if (event.key === 'jk-konto' && !accountReady()) window.flashcardsAccountVaultClear();
  });
})();