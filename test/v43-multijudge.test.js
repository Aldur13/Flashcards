const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const addon = fs.readFileSync(path.join(root, 'flashcards-v43-multijudge.js'), 'utf8');

function gradeRaw(score, id = 'p1') {
  return JSON.stringify({
    betyg: [{ id, poang: score, kommentar: 'Kommentar ' + score, fel: '' }]
  });
}

function makeHarness(options = {}) {
  const extra = options.extra || [];
  const store = { 'flashcards-v43-judges': JSON.stringify(extra) };
  const apiCalls = [];
  const sent = [];
  const primaryPrompts = [];
  const failures = new Set(options.failExtra || []);
  const prov = {
    gemini: { namn: 'Gemini', snabb: 'gemini-fast', stark: 'gemini-pro', starkast: 'gemini-pro', modeller: ['gemini-fast'] },
    sambanova: { namn: 'SambaNova', snabb: 'GLM-5.3', stark: 'gpt-oss-120b', starkast: 'gpt-oss-120b', modeller: ['GLM-5.3','MiniMax-M3.1-Flash','gemma-4-31B-it','gpt-oss-120b'] },
    groq: { namn: 'Groq', snabb: 'groq-fast', stark: 'groq-pro', starkast: 'groq-pro', modeller: ['groq-fast'] },
    mistral: { namn: 'Mistral', snabb: 'mistral-small-latest', stark: 'mistral-small-latest', starkast: 'mistral-small-latest', modeller: ['mistral-small-latest','mistral-large-latest'] },
    anthropic: { namn: 'Anthropic', snabb: 'claude-fast', stark: 'claude-pro', starkast: 'claude-pro', modeller: ['claude-fast'] }
  };
  const state = { roll: 'host', sp: {} };
  const context = {
    PROV: prov,
    T: state,
    document: { getElementById: () => null, body: {} },
    MutationObserver: class { observe() {} },
    localStorage: {
      getItem: key => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
      setItem: (key, value) => { store[key] = String(value); }
    },
    kampAI: async prompt => {
      primaryPrompts.push(prompt);
      if (options.primaryFail) throw new Error('Primary judge failed');
      return { text: gradeRaw(options.primaryScore == null ? 80 : options.primaryScore), sok: false };
    },
    tParse: (raw, ids) => {
      const parsed = JSON.parse(String(raw));
      const scores = {};
      for (const item of (parsed.betyg || [])) {
        if (ids.includes(item.id) && Number.isFinite(Number(item.poang))) {
          scores[item.id] = {
            poang: Math.max(1, Math.min(100, Math.round(Number(item.poang)))),
            kommentar: String(item.kommentar || ''),
            fel: String(item.fel || '')
          };
        }
      }
      if (ids.some(id => !scores[id])) throw new Error('Incomplete grading response');
      return scores;
    },
    api: async (prompt, model, entry, extra) => {
      apiCalls.push({ prompt, model, key: entry && entry.key, extra });
      if (entry && entry.prov === 'mistral' && (options.tierDeniedModels || []).includes(model)) {
        const error = new Error('This model is not available in your subscription tier');
        error.status = 403;
        error.providerError = 'This model is not available in your subscription tier';
        throw error;
      }
      if (prompt.includes('Du är överdomare')) {
        if (options.adjudicatorFail) throw new Error('Adjudicator failed');
        return gradeRaw(options.adjudicatorScore == null ? 77 : options.adjudicatorScore);
      }
      if (!entry || failures.has(entry.key)) throw new Error('Extra judge failed');
      const score = options.extraScores && options.extraScores[entry.key];
      if (score == null) throw new Error('No test score configured for key');
      return gradeRaw(score);
    },
    apiJudge: async (prompt, entry, model, extra) => {
      const optionsForJudge = { ...(extra || {}), json: true };
      try {
        return await context.api(prompt, model, entry, optionsForJudge);
      } catch (error) {
        if (!entry || entry.prov !== 'mistral' || error.status !== 403 ||
            !/tier_not_allowed|not available in your subscription tier/i.test(String(error.providerError || error.message || '')) ||
            model === 'mistral-small-latest') throw error;
        entry.model = 'mistral-small-latest';
        return context.api(prompt, 'mistral-small-latest',
          { ...entry, model: 'mistral-small-latest' }, optionsForJudge);
      }
    },
    tDomare: async (kort, deltar, sek) => {
      const judged = await context.kampAI('independent-rubric-prompt');
      return {
        betyg: context.tParse(judged.text, deltar.map(person => person.id)),
        sok: !!judged.sok
      };
    },
    tStart: () => ({ started: true }),
    rattaRunda: async () => 'round-complete',
    tSand: message => { sent.push(JSON.parse(JSON.stringify(message))); },
    tResultat: () => {},
    getProv: () => 'gemini',
    modelStarkast: () => 'gemini-pro'
  };
  vm.createContext(context);
  vm.runInContext(addon, context);
  return { context, store, apiCalls, sent, primaryPrompts, state };
}

const players = [{ id: 'p1', namn: 'Spelare', text: 'Ett svar' }];
const card = { q: 'Vad testas?', a: 'Facit' };
const plain = value => JSON.parse(JSON.stringify(value));

test('the page loads scripts in safe order and all JavaScript sources parse', () => {
  const resume = app.indexOf('<script src="flashcards-v42-resume.js"></script>');
  const multi = app.indexOf('<script src="flashcards-v43-multijudge.js"></script>');
  assert.ok(resume >= 0 && multi > resume, 'v4.3 must load after the resume script');
  assert.match(addon, /Flashcards v4\.3/);
  assert.match(app, /Besvara frågan korrekt\. Utfyllnad ger inga extra poäng\./);
  assert.doesNotMatch(app, /Mer än facit ger högre poäng/);
  assert.match(app, /functions\/v1\/sambanova-proxy/);
  assert.match(app, /x-sambanova-api-key/);
  assert.match(app, /body\.response_format=\{type:'json_object'\}/);
  assert.match(app, /body\.tool_choice='none'/);
  assert.match(app, /stark:'mistral-small-latest', starkast:'mistral-small-latest'/);
  assert.match(app, /function shouldUseSharedFallback/);
  assert.match(app, /err\\.retryAfterMs=retryAfterMs/);
  assert.match(app, /poolDodMarkera\\(e\\.id,err\\.message,true,err\\.retryAfterMs\\|\\|30000\\)/);
  assert.match(app, /apiPool\\(prompt,null,true,options,entry\\?\\[entry\\.key\\]:\\[\\]\\)/);
  assert.match(app, /SambaNova did not respond/);
  new vm.Script(addon);
  for (const match of app.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    const source = match[1].trim();
    if (source) new vm.Script(source);
  }
});

test('without extra judges the existing single-judge path is unchanged', async () => {
  const h = makeHarness();
  h.context.tStart();
  const result = plain(await h.context.tDomare(card, players, 30));
  assert.equal(result.betyg.p1.poang, 80);
  assert.equal(result.judgeMeta, undefined, 'the legacy return shape stays unchanged');
  h.context.tSand({ t: 'resultat' });
  assert.deepEqual(h.sent[0].judgeMeta, {
    count: 1, configured: 1, failures: 0, range: 0,
    adjudicated: false, providers: ['Huvuddomaren']
  });
  assert.equal(h.apiCalls.length, 0);
});

test('independent judges receive their own credentials and median scores are used', async () => {
  const h = makeHarness({
    extra: [
      { prov: 'groq', key: 'key-groq', model: 'groq-model' },
      { prov: 'anthropic', key: 'key-claude', model: 'claude-model' }
    ],
    extraScores: { 'key-groq': 75, 'key-claude': 85 }
  });
  h.context.tStart();
  const result = plain(await h.context.tDomare(card, players, 30));
  assert.equal(result.betyg.p1.poang, 80);
  assert.equal(result.judgeMeta.count, 3);
  assert.equal(h.apiCalls.length, 2);
  assert.deepEqual(h.apiCalls.map(call => call.key), ['key-groq', 'key-claude']);
  assert.deepEqual(h.apiCalls.map(call => call.model), ['groq-model', 'claude-model']);
  assert.equal(h.apiCalls[0].prompt, h.apiCalls[1].prompt);
  assert.equal(h.apiCalls[0].extra.json, true, 'all judge requests explicitly require JSON mode');
});

test('large judge disagreement invokes adjudication and uses its validated score', async () => {
  const h = makeHarness({
    primaryScore: 40,
    extra: [
      { prov: 'groq', key: 'key-groq', model: '' },
      { prov: 'anthropic', key: 'key-claude', model: '' }
    ],
    extraScores: { 'key-groq': 80, 'key-claude': 95 },
    adjudicatorScore: 77
  });
  h.context.tStart();
  const result = plain(await h.context.tDomare(card, players, 30));
  assert.equal(result.betyg.p1.poang, 77);
  assert.equal(result.judgeMeta.adjudicated, true);
  assert.ok(h.apiCalls.some(call => call.prompt.includes('Du är överdomare')));
});

test('a failed extra judge does not cancel grading by judges that responded', async () => {
  const h = makeHarness({
    extra: [
      { prov: 'groq', key: 'bad-key', model: '' },
      { prov: 'anthropic', key: 'good-key', model: '' }
    ],
    extraScores: { 'good-key': 90 },
    failExtra: ['bad-key']
  });
  h.context.tStart();
  const result = plain(await h.context.tDomare(card, players, 30));
  assert.equal(result.betyg.p1.poang, 85);
  assert.equal(result.judgeMeta.count, 2);
  assert.equal(result.judgeMeta.failures, 1);
});

test('judge configuration is frozen at match start and API keys are not broadcast', async () => {
  const h = makeHarness({
    extra: [{ prov: 'groq', key: 'private-key-should-not-leak', model: '' }],
    extraScores: { 'private-key-should-not-leak': 90 }
  });
  h.context.tStart();
  h.store['flashcards-v43-judges'] = '[]';
  assert.equal(Object.isFrozen(h.state.v43JudgeConfig), true);
  assert.equal(Object.isFrozen(h.state.v43JudgeConfig[0]), true);
  const result = await h.context.tDomare(card, players, 30);
  assert.equal(result.judgeMeta.count, 2);
  h.context.tSand({ t: 'resultat' });
  assert.equal(JSON.stringify(h.sent).includes('private-key-should-not-leak'), false);
});

test('if every judge fails, the grader raises an error instead of inventing a score', async () => {
  const h = makeHarness({
    primaryFail: true,
    extra: [
      { prov: 'groq', key: 'bad-one', model: '' },
      { prov: 'anthropic', key: 'bad-two', model: '' }
    ],
    failExtra: ['bad-one', 'bad-two']
  });
  h.context.tStart();
  await assert.rejects(h.context.tDomare(card, players, 30), /Primary judge failed/);
});

test('an unavailable adjudicator leaves the robust median intact', async () => {
  const h = makeHarness({
    primaryScore: 30,
    extra: [{ prov: 'groq', key: 'key-groq', model: '' }],
    extraScores: { 'key-groq': 90 },
    adjudicatorFail: true
  });
  h.context.tStart();
  const result = plain(await h.context.tDomare(card, players, 30));
  assert.equal(result.betyg.p1.poang, 60);
  assert.equal(result.judgeMeta.adjudicated, false);
  assert.equal(result.judgeMeta.range, 60);
});

test('SambaNova is available as an independent extra judge provider', async () => {
  const h = makeHarness({
    extra: [{ prov: 'sambanova', key: 'sambanova-test-key', model: 'GLM-5.3' }],
    extraScores: { 'sambanova-test-key': 88 }
  });
  h.context.tStart();
  const result = plain(await h.context.tDomare(card, players, 30));
  assert.equal(result.betyg.p1.poang, 84);
  assert.equal(result.judgeMeta.count, 2);
  assert.equal(h.apiCalls.length, 1);
  assert.equal(h.apiCalls[0].key, 'sambanova-test-key');
  assert.equal(h.apiCalls[0].model, 'GLM-5.3');
});


test('Mistral automatically retries with Small when the selected Large model is not allowed', async () => {
  const h = makeHarness({
    extra: [{ prov: 'mistral', key: 'mistral-key', model: 'mistral-large-latest' }],
    extraScores: { 'mistral-key': 88 },
    tierDeniedModels: ['mistral-large-latest']
  });
  h.context.tStart();
  const result = plain(await h.context.tDomare(card, players, 30));
  assert.equal(result.judgeMeta.count, 2);
  assert.deepEqual(h.apiCalls.map(call => call.model), ['mistral-large-latest', 'mistral-small-latest']);
  const mistral = result.judgeMeta.details.find(x => x.leverantor === 'Mistral');
  assert.equal(mistral.lyckades, true);
  assert.equal(mistral.modell, 'mistral-small-latest');
});

test('failed judges retain provider, model, timing and sanitized failure diagnostics', async () => {
  const h = makeHarness({
    extra: [
      { prov: 'groq', key: 'bad-key', model: 'broken-model' },
      { prov: 'anthropic', key: 'good-key', model: 'claude-model' }
    ],
    extraScores: { 'good-key': 90 },
    failExtra: ['bad-key']
  });
  h.context.tStart();
  const result = plain(await h.context.tDomare(card, players, 30));
  assert.equal(result.judgeMeta.failures, 1);
  const failed = result.judgeMeta.details.find(x => !x.lyckades);
  assert.equal(failed.leverantor, 'Groq');
  assert.equal(failed.modell, 'broken-model');
  assert.equal(typeof failed.tidMs, 'number');
  assert.match(failed.fel, /Extra judge failed/);
  assert.equal(JSON.stringify(result.judgeMeta).includes('bad-key'), false);
});

test('all-failed rounds attach diagnostic details to the thrown error', async () => {
  const h = makeHarness({
    primaryFail: true,
    extra: [{ prov: 'groq', key: 'bad-one', model: 'bad-model' }],
    failExtra: ['bad-one']
  });
  h.context.tStart();
  let caught;
  try { await h.context.tDomare(card, players, 30); } catch (e) { caught = e; }
  assert.ok(caught);
  assert.equal(caught.judgeMeta.count, 0);
  assert.equal(caught.judgeMeta.details.length, 2);
  assert.equal(caught.judgeMeta.details.every(x => !x.lyckades), true);
});
