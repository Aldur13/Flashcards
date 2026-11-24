const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const addon = fs.readFileSync(path.join(root, 'flashcards-v41.js'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase', 'v4.1-match-history.sql'), 'utf8');

test('v4.2 compatibility add-on is loaded and exposes its version badge', () => {
  assert.match(app, /<script src="flashcards-v41\.js"><\/script>/);
  assert.match(addon, /const VERSION = '4\.2'/);
  assert.match(addon, /badge\.textContent='Flashcards v'\+VERSION/);
});

test('all requested team sizes are offered and require a complete 2-team lobby', () => {
  for (const format of ['2v2', '4v4', '8v8', '12v12']) assert.ok(addon.includes(`value="${format}"`));
  assert.match(addon, /const needed=T\.format&&T\.format!=='solo'\?T\.teamSize\*2:2/);
  assert.match(addon, /players\.length===needed/);
  assert.match(addon, /team\.members\.every\(pid=>team\.approvals\[pid\]\)/);
});

test('spectators have a separate role and receive live-only answer updates', () => {
  assert.match(addon, /Observatörsinloggning/);
  assert.match(addon, /window\.v41JoinRole='spectator'/);
  assert.match(app, /state\.spectator\?\(state\.token\?\{t:'spectate-resume'/);
  assert.match(addon, /m\.t==='live'/);
  assert.match(addon, /if\(T\.roll!=='spectator'\)return false/);
});

test('team edits are host-authoritative and edits clear previous approvals', () => {
  assert.match(addon, /m\.t==='team-edit'.*expected===m\.teamId/s);
  assert.match(addon, /team\.approvals=\{\};team\.submitted=false/);
  assert.match(addon, /team\.members\.every\(pid=>team\.approvals\[pid\]\)/);
});

test('public history requires consent and an authenticated host', () => {
  assert.match(addon, /state\.historyConsent===true/);
  assert.match(addon, /p\.historyConsent===true/);
  assert.match(addon, /window\.flashcardsGetAccessToken/);
  assert.match(migration, /for insert\s+to authenticated/i);
  assert.match(migration, /owner_id = auth\.uid\(\)/i);
  assert.match(migration, /public_match_history/);
  assert.match(migration, /grant select on public\.public_match_history to anon, authenticated/i);
  assert.doesNotMatch(migration, /grant select on table public\.match_history/i);
});

test('public history uses anonymous participant labels and strips common contact details', () => {
  assert.match(addon, /Deltagare '\+\(aliases\.size\+1\)/);
  assert.match(addon, /e-post borttagen/);
  assert.match(addon, /telefonnummer borttaget/);
  assert.match(addon, /länk borttagen/);
});

test('team state resets each round and team standings accumulate across rounds', () => {
  assert.match(app, /if\(T\.teams\)Object\.values\(T\.teams\)\.forEach\(team=>\{team\.text='';team\.approvals=\{\};team\.submitted=false/);
  assert.match(addon, /prior\.summa\|\|0\)\+\(r\?r\.summa:0\)/);
});

test('spectator reconnection keeps the observer token briefly after a disconnect', () => {
  assert.match(addon, /spectate-resume/);
  assert.match(addon, /s\.bortTimer=setTimeout\(\(\)=>\{if\(T&&T\.spectators/);
  assert.match(addon, /90000/);
});


test('spectators require host permission and public history consent is optional for playing', () => {
  assert.match(addon, /if\(!T\.allowSpectators\).*Värden har inte aktiverat åskådare/s);
  assert.match(addon, /Tillåt åskådare att se alla utkast live/);
  assert.match(addon, /window\.v41PendingConsent=!!\$v\('v41-player-consent-check'\)\.checked/);
  assert.doesNotMatch(addon, /Du måste godkänna offentlig, anonym matchhistorik för att delta/);
  assert.match(addon, /if\(!consent\).*Inte publicerad: alla deltagare gav inte samtycke/s);
});
