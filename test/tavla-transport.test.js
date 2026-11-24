const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extract(start, end) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from);
  assert.notEqual(from, -1, `Missing source function: ${start}`);
  assert.notEqual(to, -1, `Missing end marker: ${end}`);
  return html.slice(from, to);
}

const peerOptions = extract('function tPeerOptions(){', 'function tStang(){');
const stopFunction = extract('function tStang(){', 'function tPanel(h){');
const hostFunction = extract('function tSkapa(set,forsok){', 'function tSpelare(){');
const clientFunction = extract('function tAnslut(kod,namn){', 'function tKlientData(m){');

function fakeClock() {
  let now = 0;
  let nextId = 1;
  const jobs = new Map();
  return {
    setTimeout(fn, ms) {
      const id = nextId++;
      jobs.set(id, { fn, at: now + ms });
      return id;
    },
    clearTimeout(id) { jobs.delete(id); },
    setInterval(fn, ms) { return this.setTimeout(fn, ms); },
    clearInterval(id) { jobs.delete(id); },
    advance(ms) {
      const end = now + ms;
      let guard = 0;
      while (guard++ < 1000) {
        let due = null;
        for (const [id, job] of jobs) {
          if (job.at <= end && (!due || job.at < due.job.at)) due = { id, job };
        }
        if (!due) break;
        jobs.delete(due.id);
        now = due.job.at;
        due.job.fn();
      }
      now = end;
    },
    get pending() { return jobs.size; }
  };
}

class Emitter {
  constructor() { this.handlers = {}; }
  on(name, fn) {
    (this.handlers[name] ||= []).push(fn);
    return this;
  }
  emit(name, value) {
    for (const fn of [...(this.handlers[name] || [])]) fn(value);
  }
}

class MockConnection extends Emitter {
  constructor() {
    super();
    this.open = false;
    this.closed = false;
    this.sent = [];
  }
  send(message) { this.sent.push(message); }
  close() {
    this.closed = true;
    this.open = false;
    this.emit('close');
  }
  becomeOpen() {
    this.open = true;
    this.emit('open');
  }
}

function makeContext(Peer, clock) {
  const elements = {};
  const context = vm.createContext({
    Peer,
    console,
    Date,
    Math,
    Object,
    Array,
    String,
    Number,
    JSON,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    setInterval: (fn, ms) => clock.setTimeout(fn, ms),
    clearInterval: clock.clearTimeout,
    $: id => elements[id] ||= {
      innerHTML: '', onclick: null, value: '', disabled: false,
      textContent: '', addEventListener() {}
    },
    esc: value => String(value).replace(/[&<>"']/g, ''),
    tPanel: html => { elements.modTavla ||= {}; elements.modTavla.innerHTML = html; },
    tLobbyHost: () => { context.lobbyRenders = (context.lobbyRenders || 0) + 1; },
    tNamn: value => value,
    profNamn: () => 'Test',
    tFel: message => { context.lastError = message; },
    tMeny: () => { context.menuOpened = true; }
  });
  vm.runInContext('let T = null;', context);
  vm.runInContext(stopFunction, context);
  return context;
}

test('join retries a transient peer-unavailable error and can join the host', () => {
  const clock = fakeClock();
  class Peer extends Emitter {
    static instances = [];
    constructor(options) {
      super();
      this.options = options;
      this.connections = [];
      this.destroyed = false;
      Peer.instances.push(this);
    }
    connect(peerId, options) {
      this.target = peerId;
      this.connectOptions = options;
      const connection = new MockConnection();
      this.connections.push(connection);
      return connection;
    }
    destroy() { this.destroyed = true; }
    reconnect() { this.emit('open', 'client-id'); }
  }

  const context = makeContext(Peer, clock);
  vm.runInContext("function tKlientData(m) { if (m.t === 'valkommen') { T.fas = 'lobby'; T.token = String(m.token); T.hasJoined = true; } }", context);
  vm.runInContext(peerOptions + clientFunction, context);
  vm.runInContext("tAnslut('ABCDE', 'Test')", context);

  const peer = Peer.instances[0];
  assert.equal(peer.options.host, '0.peerjs.com');
  assert.equal(peer.options.port, 443);
  assert.ok(peer.options.config.iceServers.some(server => server.urls === 'stun:stun.cloudflare.com:3478'));
  peer.emit('open', 'client-id');
  assert.equal(peer.connections.length, 1);
  peer.emit('error', { type: 'peer-unavailable' });
  assert.equal(peer.connections[0].closed, true);

  clock.advance(1600);
  assert.equal(peer.connections.length, 2, 'a second attempt should be started');
  const connection = peer.connections[1];
  connection.becomeOpen();
  assert.equal(connection.sent[0].t, 'join');
  connection.emit('data', { t: 'valkommen', token: 'resume-token' });
  assert.equal(vm.runInContext('T.hasJoined', context), true);
  assert.equal(vm.runInContext('T.token', context), 'resume-token');
});

test('host re-registers with PeerServer after a signaling disconnect', () => {
  const clock = fakeClock();
  class Peer extends Emitter {
    static instances = [];
    constructor(id, options) {
      super();
      this.id = id;
      this.options = options;
      this.destroyed = false;
      this.reconnectCalls = 0;
      Peer.instances.push(this);
    }
    destroy() { this.destroyed = true; }
    reconnect() {
      this.reconnectCalls++;
      this.emit('open', this.id);
    }
  }

  const context = makeContext(Peer, clock);
  vm.runInContext("function tKod(){ return 'ABCDE'; }", context);
  vm.runInContext(peerOptions + hostFunction, context);
  vm.runInContext("tSkapa({sek:60,rundor:2,max:8,kat:[]})", context);

  const peer = Peer.instances[0];
  assert.equal(peer.options.host, '0.peerjs.com');
  assert.ok(peer.options.config.iceServers.some(server => server.urls === 'stun:stun.cloudflare.com:3478'));
  peer.emit('open', peer.id);
  assert.equal(context.lobbyRenders, 1);
  peer.emit('disconnected');
  clock.advance(1200);
  assert.equal(peer.reconnectCalls, 1);
  assert.equal(context.lobbyRenders, 2);
});

test('Supabase Realtime fallback routes a client join to the host adapter', () => {
  const handlers = {};
  const sent = [];
  const channel = {
    on(_kind, _filter, fn) { handlers[_filter.event] = fn; return this; },
    subscribe(fn) { fn('SUBSCRIBED'); return this; },
    send(message) { sent.push(message); return Promise.resolve('ok'); }
  };
  const client = { channel: () => channel, removeChannel() {} };
  const context = vm.createContext({
    window: { FLASHCARDS_SUPABASE_CONFIG: { url: 'https://example.supabase.co', key: 'public-test-key' }, supabase: { createClient: () => client } },
    console, Math, Date, JSON, Object, String, Array, Number, crypto: { randomUUID: () => 'client-1' },
    setTimeout, clearTimeout, setInterval, clearInterval,
    tHostData: (conn, message) => { context.received = { id: conn._rtId, message }; conn._id = 'p1'; },
    tKlientData: message => { context.receivedClient = message; },
    tPanel: message => { context.panel = message; }
  });
  vm.runInContext('let T = null;', context);
  vm.runInContext("T={roll:'host'};", context);
  const helpers = html.slice(html.indexOf('let T_SUPABASE_CLIENT=null;'), html.indexOf('function tPanel(h){'));
  vm.runInContext(helpers, context);
  vm.runInContext("const state={kod:'ABCDE',fas:'lobby'}; T=state; tRealtimeHost(state);", context);
  handlers.game({ payload: { from: 'client-1', to: 'host', message: { t: 'join', namn: 'Test' } } });
  assert.equal(context.received.id, 'client-1');
  assert.equal(context.received.message.t, 'join');
  assert.equal(sent.length, 0);
});

test('Supabase Realtime fallback lets a client send and receive game messages', () => {
  const handlers = {};
  const sent = [];
  const channel = {
    on(_kind, _filter, fn) { handlers[_filter.event] = fn; return this; },
    subscribe(fn) { fn('SUBSCRIBED'); return this; },
    send(message) { sent.push(message); return Promise.resolve('ok'); }
  };
  const client = { channel: () => channel, removeChannel() {} };
  const context = vm.createContext({
    window: { FLASHCARDS_SUPABASE_CONFIG: { url: 'https://example.supabase.co', key: 'public-test-key' }, supabase: { createClient: () => client } },
    console, Math, Date, JSON, Object, String, Array, Number, crypto: { randomUUID: () => 'client-2' },
    setTimeout, clearTimeout, setInterval: () => 1, clearInterval,
    tHostData() {}, tKlientData: message => { context.receivedClient = message; },
    tPanel: message => { context.panel = message; }
  });
  vm.runInContext('let T = null;', context);
  const helpers = html.slice(html.indexOf('let T_SUPABASE_CLIENT=null;'), html.indexOf('function tPanel(h){'));
  vm.runInContext(helpers, context);
  vm.runInContext("const state={roll:'klient',kod:'ABCDE',namn:'Test',token:'',fas:'ansluter'}; T=state; tRealtimeJoin(state);", context);
  assert.equal(sent[0].payload.message.t, 'join');
  handlers.game({ payload: { from: 'host', to: 'client-2', message: { t: 'valkommen', token: 'resume' } } });
  assert.equal(context.receivedClient.t, 'valkommen');
  assert.equal(vm.runInContext('T.rtJoined', context), true);
});

test('Supabase Realtime spectator join is separate and resumes with its observer token', () => {
  const clock = fakeClock();
  const channels = [];
  const sent = [];
  const client = {
    channel() {
      const handlers = {};
      const channel = {
        handlers,
        statusHandler: null,
        on(_kind, filter, fn) { handlers[filter.event] = fn; return this; },
        subscribe(fn) { this.statusHandler = fn; fn('SUBSCRIBED'); return this; },
        send(message) { sent.push(message); return Promise.resolve('ok'); }
      };
      channels.push(channel);
      return channel;
    },
    removeChannel() { return Promise.resolve('ok'); }
  };
  const context = vm.createContext({
    window: { FLASHCARDS_SUPABASE_CONFIG: { url: 'https://example.supabase.co', key: 'public-test-key' }, supabase: { createClient: () => client } },
    console, Math, Date, JSON, Object, String, Array, Number,
    crypto: { randomUUID: (() => { let n = 0; return () => 'observer-' + (++n); })() },
    setTimeout: (fn, ms) => clock.setTimeout(fn, ms),
    clearTimeout: id => clock.clearTimeout(id),
    setInterval: (fn, ms) => clock.setInterval(fn, ms),
    clearInterval: id => clock.clearInterval(id),
    tHostData() {},
    tKlientData: message => { context.receivedClient = message; },
    tPanel: message => { context.panel = message; }
  });
  vm.runInContext('let T = null;', context);
  const helpers = html.slice(html.indexOf('let T_SUPABASE_CLIENT=null;'), html.indexOf('function tPanel(h){'));
  vm.runInContext(helpers, context);
  vm.runInContext("const state={roll:'klient',kod:'ABCDE',namn:'Watcher',spectator:true,token:'',fas:'ansluter'}; T=state; tRealtimeJoin(state);", context);
  assert.equal(sent[0].payload.message.t, 'spectate');

  channels[0].handlers.game({ payload: { from: 'host', to: 'observer-1', message: { t: 'observerWelcome', token: 'observer-session-token' } } });
  assert.equal(vm.runInContext('T.hasJoined', context), true);
  assert.equal(vm.runInContext('T.token', context), 'observer-session-token');

  channels[0].statusHandler('CHANNEL_ERROR');
  clock.advance(1500);
  assert.equal(channels.length, 2, 'fallback transport should resubscribe after a channel error');
  assert.equal(sent.at(-1).payload.message.t, 'spectate-resume');
  assert.equal(sent.at(-1).payload.message.token, 'observer-session-token');
});
