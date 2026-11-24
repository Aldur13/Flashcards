/* Flashcards v4.1 – progressive add-on.
   Keeps the existing host-authoritative PeerJS -> Supabase Realtime architecture.
   Team edits, approvals and spectator updates are always mediated by the host. */
(function () {
  'use strict';

  const VERSION = '4.2';
  const LS_DAILY = 'flashcards-v41-daily';
  const LS_SETTINGS = 'flashcards-v41-settings';
  const LS_HISTORY = 'flashcards-v41-history';
  const TEAM_LABEL = { A: 'Lag A', B: 'Lag B' };
  const $v = id => document.getElementById(id);
  const h = value => (typeof esc === 'function' ? esc(String(value == null ? '' : value)) : String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])));
  const getSettings = () => { try { return Object.assign({ dark:false, sound:true }, JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}')); } catch (_) { return { dark:false, sound:true }; } };
  const putSettings = s => { try { localStorage.setItem(LS_SETTINGS, JSON.stringify(s)); } catch (_) {} };
  const dayKey = () => { const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
  const dailyData = () => { try { const d=JSON.parse(localStorage.getItem(LS_DAILY)||'{}'); return d.day===dayKey()?d:{day:dayKey(),done:0,goal:10}; } catch (_) { return {day:dayKey(),done:0,goal:10}; } };
  const storeDaily = d => { try { localStorage.setItem(LS_DAILY,JSON.stringify(d)); } catch (_) {} };
  const old = {};
  ['tInst','tSkapa','tLobbyHost','tStart','tNasta','tRundaVy','tSkicka','tKollaKlar','tSand','tHostData','tNer','tAktuellStatus','tKlientData','rattaRunda','tSlutHost','tMeny','tGaMed','tResultat','pick','render','check','audio','tone'].forEach(k=>{ try { old[k]=window[k] || eval(k); } catch (_) {} });

  function addStyle() {
    if ($v('v41-style')) return;
    const s=document.createElement('style'); s.id='v41-style'; s.textContent=`
      #v41-badge{position:fixed;right:10px;bottom:10px;z-index:50;background:#1B2A5B;color:#fff;border:1px solid #6070a5;border-radius:18px;padding:5px 10px;font-size:11px;letter-spacing:.03em;box-shadow:0 2px 9px #0003;pointer-events:none}
      #v41-dash{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:9px 0 12px}
      #v41-dash .v41-pill{border:1px solid #52618e;background:#26376f;color:#fff;border-radius:18px;padding:5px 9px;font-size:11px;line-height:1.4}
      #v41-dash button{border:1px solid #52618e;background:transparent;color:#e9e9f2;border-radius:18px;padding:5px 9px;font:inherit;font-size:11px;cursor:pointer}
      .v41-card{background:#e2dccb;border-radius:10px;padding:12px;margin:10px 0;color:#171a24}
      .v41-choice{display:block;width:100%;text-align:left;background:#fff;border:1px solid #c9c3b2;border-radius:9px;padding:11px;margin:7px 0;color:#171a24;font:inherit;cursor:pointer}
      .v41-choice[aria-pressed="true"]{outline:2px solid #1b2a5b;background:#eef0f7}
      .v41-live{border:1px solid #d8d2c0;border-radius:9px;padding:9px;margin:7px 0;background:#fff;white-space:pre-wrap;overflow-wrap:anywhere}
      .v41-live small{display:block;color:#6a6558;margin-bottom:4px}
      .v41-observer{background:#e2dccb;border-radius:10px;padding:10px;margin:8px 0;color:#171a24}
      .v41-teamline{font-size:12px;color:#6a6558;margin:8px 0;line-height:1.5}
      body.v41-dark{background:#111827;color:#e5e7eb}
      body.v41-dark .panel{background:#202b3b;color:#e5e7eb}
      body.v41-dark .q{color:#f3f4f6}
      body.v41-dark .meta,body.v41-dark .sub{color:#aebbd1}
      body.v41-dark .amne{border-color:#3a4658}
      body.v41-dark .amne .an,body.v41-dark td,body.v41-dark th{color:#e5e7eb}
      body.v41-dark .amne .am,body.v41-dark .lvl{color:#b4bfd0}
      body.v41-dark textarea,body.v41-dark input,body.v41-dark select{background:#111827;color:#f3f4f6;border-color:#526174}
      body.v41-dark .v41-card,body.v41-dark .v41-observer{background:#283548;color:#f3f4f6}
      body.v41-dark .v41-live{background:#172233;color:#f3f4f6;border-color:#526174}
      @media(max-width:480px){#v41-dash{gap:5px}#v41-dash .v41-pill,#v41-dash button{font-size:10px;padding:5px 7px}}
    `; document.head.appendChild(s);
  }

  function renderDash() {
    const d=dailyData();
    let total=0, known=0, answered=0;
    if (typeof CARDS!=='undefined' && typeof st==='function') CARDS.forEach(c=>{ const x=st(c.id); total+=4; known+=Math.max(0,Math.min(4,+x.lvl||0)); answered+=(+x.ratt||0)+(+x.fel||0); });
    const pct=total?Math.round(known/total*100):0;
    const level=Math.max(1,Math.floor(known/20)+1);
    const badges=[];
    if(answered>=1)badges.push('Första steget');
    if(answered>=25)badges.push('25 svar');
    if(answered>=100)badges.push('100 svar');
    if(pct>=50)badges.push('Halvvägs');
    const el=$v('v41-dash'); if(!el)return;
    el.innerHTML=`<span class="v41-pill">Nivå ${level}</span><span class="v41-pill">Kunskap ${pct}%</span><span class="v41-pill">Dagens mål ${Math.min(d.done,d.goal)}/${d.goal}</span><span class="v41-pill">${badges.length?badges.join(' · '):'Första märket väntar'}</span><button type="button" id="v41-dark">${getSettings().dark?'Ljust tema':'Mörkt tema'}</button><button type="button" id="v41-sound">Ljud ${getSettings().sound?'på':'av'}</button><button type="button" id="v41-daily">Dagens utmaning</button>`;
    $v('v41-dark').onclick=()=>{const s=getSettings();s.dark=!s.dark;putSettings(s);applySettings();renderDash();};
    $v('v41-sound').onclick=()=>{const s=getSettings();s.sound=!s.sound;putSettings(s);renderDash();};
    $v('v41-daily').onclick=startDaily;
  }
  function applySettings(){ document.body.classList.toggle('v41-dark',!!getSettings().dark); }
  function startDaily(){
    if(typeof CARDS==='undefined'||!CARDS.length||typeof render!=='function')return;
    const d=dayKey().replace(/-/g,'');let n=0;for(let i=0;i<d.length;i++)n=(n*31+d.charCodeAt(i))>>>0;
    const c=CARDS[n%CARDS.length]; if(!c)return;
    cur=c; prevId=null; sistaRattning=null; render();
    const tag=document.createElement('div');tag.className='v41-card';tag.textContent='Dagens utmaning: försök förklara svaret med egna ord.';
    const q=$v('q');if(q&&q.parentNode)q.parentNode.insertBefore(tag,q.nextSibling);
  }
  function scheduleNext(c, verdict) {
    if(!c||typeof st!=='function')return;
    const x=st(c.id);const now=Date.now();
    if(verdict==='ratt'){
      const intervals=[1,1,3,7,14,30]; x.dueAt=now+intervals[Math.min(5,Math.max(0,x.lvl||0))]*86400000;
    }else if(verdict==='nastan')x.dueAt=now+86400000;
    else x.dueAt=now+30*60000;
  }
  if(typeof pick==='function'){
    pick=function(){
      const valda=valdaAmnen();let pool=CARDS.filter(c=>valda.indexOf(c.k)>=0&&c.id!==prevId);
      if(!pool.length)pool=CARDS.filter(c=>valda.indexOf(c.k)>=0);if(!pool.length)pool=CARDS.slice();
      const now=Date.now(),due=pool.filter(c=>!st(c.id).dueAt||+st(c.id).dueAt<=now);
      if(due.length)pool=due;
      const w=pool.map(c=>Math.pow(MAX-st(c.id).lvl,2)+1);let t=w.reduce((a,b)=>a+b,0),r=Math.random()*t;
      for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0)return pool[i];}return pool[0];
    };
  }

  // Explanations and daily progress are layered on top of the existing AI grader.
  if(typeof check==='function'){
    check=async function(){
      const before=sistaRattning; await old.check();
      if(sistaRattning && sistaRattning!==before){
        scheduleNext(sistaRattning.kort,sistaRattning.verdict);
        const d=dailyData();d.done=Math.min(d.goal,d.done+1);storeDaily(d);if(typeof save==='function')save();renderDash();
        const res=$v('res'); if(res&&!$v('v41-explain')){
          const b=document.createElement('button');b.id='v41-explain';b.className='act ghost';b.style.width='100%';b.style.marginTop='8px';b.textContent='Förklara svaret steg för steg';
          const out=document.createElement('div');out.id='v41-explanation';out.className='v41-card';out.style.display='none';res.append(b,out);
          b.onclick=async()=>{b.disabled=true;b.textContent='Förklarar…';try{const r=await callAI(`Förklara på enkel svenska för en elev i årskurs 7 varför svaret bedömdes så här. Ge en kort steg-för-steg-förklaring och ett minnesknep. Hitta inte på fakta.\nFråga: ${sistaRattning.shown}\nFacit: ${sistaRattning.kort.a}\nElevens svar: ${sistaRattning.svar}\nBedömning: ${sistaRattning.verdict}\nFeedback: ${sistaRattning.feedback}`);out.textContent=r;out.style.display='block';}catch(e){out.textContent='Kunde inte skapa förklaringen: '+(e.message||'AI-fel');out.style.display='block';}finally{b.disabled=false;b.textContent='Förklara igen';}};
        }
      }
    };
  }

  // Optional AI question-set generator. Generated cards stay local until the user exports them.
  function addGenerator(){
    const view=$v('v-set');if(!view||$v('v41-generator'))return;
    const box=document.createElement('section');box.id='v41-generator';box.className='v41-card';
    box.innerHTML=`<h3 style="margin:0 0 5px;font-family:Fraunces,serif">Skapa egna frågor med AI</h3><p style="font-size:12px;margin:0 0 9px">Klistra in egna anteckningar. AI gör skrivfrågor, flervalsfrågor och sant/falskt-frågor. Granska dem innan du pluggar.</p><textarea id="v41-notes" placeholder="Klistra in anteckningar här…" style="min-height:110px;width:100%"></textarea><div class="row"><button class="act" id="v41-generate">Skapa 5 frågor</button><button class="act ghost" id="v41-export">Exportera egna frågor</button><button class="act ghost" id="v41-import">Importera frågor</button></div><input id="v41-import-file" type="file" accept="application/json,.json" hidden><div id="v41-gen-msg" style="font-size:12px;margin-top:8px"></div>`;
    view.appendChild(box);
    $v('v41-generate').onclick=async()=>{
      const notes=($v('v41-notes').value||'').trim();if(notes.length<80){$v('v41-gen-msg').textContent='Klistra in minst 80 tecken anteckningar.';return;}
      const b=$v('v41-generate');b.disabled=true;b.textContent='Skapar…';
      try{
        const prompt=`Skapa exakt fem bra övningsfrågor på svenska av anteckningarna. Blanda 2 skrivfrågor, 2 flervalsfrågor med fyra alternativ och 1 sant/falskt-fråga. Håll dig strikt till anteckningarna. Returnera endast JSON: {"cards":[{"q":"...","a":"...","type":"open|multiple|boolean","options":["..."],"correctIndex":0,"k":"Eget material"}]}. För skrivfrågor behövs inte options eller correctIndex. För multiple ska a vara exakt rätt alternativ. För boolean ska options vara ["Sant","Falskt"] och a vara rätt alternativ.\nANTECKNINGAR:\n${notes.slice(0,10000)}`;
        const raw=await callAI(prompt);const match=String(raw).match(/\{[\s\S]*\}/);if(!match)throw new Error('AI-svaret var inte giltig JSON.');
        const data=JSON.parse(match[0]);if(!Array.isArray(data.cards)||data.cards.length!==5)throw new Error('AI gav inte fem frågor.');
        let id=CARDS.reduce((m,c)=>Math.max(m,+c.id||0),0)+1;
        const clean=data.cards.map(c=>({id:id++,k:'Eget material',q:String(c.q||'').slice(0,240),a:String(c.a||'').slice(0,900),type:['multiple','boolean','open'].includes(c.type)?c.type:'open',options:Array.isArray(c.options)?c.options.slice(0,4).map(x=>String(x).slice(0,160)):[],correctIndex:Math.max(0,Math.min(3,+c.correctIndex||0))})).filter(c=>c.q&&c.a);
        if(clean.length!==5)throw new Error('Några frågor saknade innehåll. Försök igen.');
        clean.forEach(c=>CARDS.push(c));try{localStorage.setItem('flashcards-v41-custom-cards',JSON.stringify(CARDS.filter(c=>c.k==='Eget material')));}catch(_){}
        if(typeof sattAmnen==='function')sattAmnen([...new Set([...valdaAmnen(),'Eget material'])]);
        $v('v41-gen-msg').textContent='Fem frågor har lagts till i området Eget material. De finns kvar i den här webbläsaren.';
      }catch(e){$v('v41-gen-msg').textContent='Kunde inte skapa frågorna: '+(e.message||'AI-fel');}finally{b.disabled=false;b.textContent='Skapa 5 frågor';}
    };
    $v('v41-export').onclick=()=>{const cards=CARDS.filter(c=>c.k==='Eget material');const blob=new Blob([JSON.stringify({version:VERSION,cards},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='flashcards-egna-fragor.json';a.click();URL.revokeObjectURL(a.href);};
    $v('v41-import').onclick=()=>$v('v41-import-file').click();
    $v('v41-import-file').onchange=async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;try{if(file.size>500000)throw new Error('Filen är större än 500 KB.');const data=JSON.parse(await file.text());if(!Array.isArray(data.cards)||!data.cards.length||data.cards.length>200)throw new Error('JSON-filen måste innehålla 1–200 frågor i cards.');let id=CARDS.reduce((m,c)=>Math.max(m,+c.id||0),0)+1;const clean=data.cards.map(c=>({id:id++,k:'Eget material',q:String(c.q||'').slice(0,240),a:String(c.a||'').slice(0,900),type:['multiple','boolean','open'].includes(c.type)?c.type:'open',options:Array.isArray(c.options)?c.options.slice(0,4).map(x=>String(x).slice(0,160)):[],correctIndex:Math.max(0,Math.min(3,+c.correctIndex||0))})).filter(c=>c.q&&c.a);if(!clean.length)throw new Error('Filen innehöll inga giltiga frågor.');for(let i=CARDS.length-1;i>=0;i--)if(CARDS[i].k==='Eget material')CARDS.splice(i,1);clean.forEach(c=>CARDS.push(c));localStorage.setItem('flashcards-v41-custom-cards',JSON.stringify(clean));if(typeof sattAmnen==='function')sattAmnen([...new Set([...valdaAmnen(),'Eget material'])]);$v('v41-gen-msg').textContent=clean.length+' frågor importerades.';}catch(err){$v('v41-gen-msg').textContent='Kunde inte importera: '+(err.message||'Ogiltig fil');}finally{e.target.value='';}};
  }
  function loadCustomCards(){
    try{const rows=JSON.parse(localStorage.getItem('flashcards-v41-custom-cards')||'[]');if(Array.isArray(rows))rows.forEach(c=>{if(c&&typeof c.q==='string'&&typeof c.a==='string'&&!CARDS.some(x=>x.id===c.id))CARDS.push(c);});}catch(_){}
  }
  if(typeof render==='function'){
    render=function(){
      const prior=$v('v41-choices');if(prior)prior.remove();
      old.render();
      if(cur&&Array.isArray(cur.options)&&cur.options.length){
        const ans=$v('ans');if(ans)ans.style.display='none';
        const choices=document.createElement('div');choices.id='v41-choices';choices.style.margin='8px 0 12px';
        choices.innerHTML=cur.options.map((o,i)=>`<button type="button" class="v41-choice" data-choice="${i}" aria-pressed="false">${String.fromCharCode(65+i)}. ${h(o)}</button>`).join('');
        const q=$v('q');if(q&&q.parentNode)q.parentNode.insertBefore(choices,ans);
        choices.querySelectorAll('[data-choice]').forEach(btn=>btn.onclick=()=>{choices.querySelectorAll('[data-choice]').forEach(x=>x.setAttribute('aria-pressed','false'));btn.setAttribute('aria-pressed','true');if(ans)ans.value=cur.options[+btn.dataset.choice];});
      }else if($v('ans'))$v('ans').style.display='';
    };
  }

  // -------------------------------------------------------------------------
  // Multiplayer v4.1: spectator role, live answer board, and team co-authoring.
  // -------------------------------------------------------------------------
  function tBroadcast(m){
    if(!T)return;
    const send=(s,msg)=>{try{if(s&&s.conn&&s.conn.open)s.conn.send(msg);}catch(_){} };
    if(m&&m.t==='team-sync'){
      const team=T.teams&&T.teams[m.teamId];if(team)(team.members||[]).forEach(id=>{const s=T.sp&&T.sp[id];if(s)send(s,m);});
      return;
    }
    if(m&&m.t==='live'){Object.values(T.spectators||{}).forEach(s=>send(s,m));return;}
    if(m&&m.t==='runda'&&T.format&&T.format!=='solo'){
      (typeof tSpelare==='function'?tSpelare():[]).forEach(s=>{
        const teamId=T.playerTeams&&T.playerTeams[s.id];const team=teamId&&T.teams&&T.teams[teamId];
        send(s,{...m,format:T.format,teamId:teamId||null,teamText:team?team.text:'',teamApprovals:team?Object.keys(team.approvals).length:0,teamMembers:team?team.members.length:0,teamApproved:team?!!team.approvals[s.id]:false,teamSubmitted:team?!!team.submitted:false});
      });
      Object.values(T.spectators||{}).forEach(s=>send(s,m));
      return;
    }
    (typeof tSpelare==='function'?tSpelare():[]).forEach(s=>send(s,m));
    Object.values(T.spectators||{}).forEach(s=>send(s,m));
  }
  function liveDraftSnapshot(){
    if(!T)return {};
    const out={};
    if(T.format&&T.format!=='solo'&&T.teams){Object.keys(T.teams).forEach(k=>out[k]={name:TEAM_LABEL[k],text:T.teams[k].text||''});return out;}
    Object.keys(T.liveDrafts||{}).forEach(id=>{const p=T.sp&&T.sp[id];out[id]={name:p?p.namn:(id==='h'?'Värd':'Spelare'),text:String(T.liveDrafts[id]&&T.liveDrafts[id].text||'').slice(0,1200)};});
    return out;
  }
  function broadcastLive(){ if(!T||T.fas!=='runda')return; tBroadcast({t:'live',nr:T.nr,drafts:liveDraftSnapshot()}); }
  function updateDraft(id,text){
    if(!T||T.fas!=='runda'||!id)return;
    text=String(text||'').slice(0,1200);
    if(T.format&&T.format!=='solo'){
      const teamId=T.playerTeams&&T.playerTeams[id],team=teamId&&T.teams&&T.teams[teamId];if(!team||team.submitted)return;
      team.text=text;team.rev=(team.rev||0)+1;team.approvals={};team.submitted=false;T.skickat=false;delete T.svar['team_'+teamId];
      T.liveDrafts['team_'+teamId]={name:TEAM_LABEL[teamId],text};
      if(T.playerTeams&&T.playerTeams.h===teamId){const ta=$v('tSvar'),b=$v('tLas');if(ta&&document.activeElement!==ta)ta.value=text;if(b){b.disabled=false;b.textContent=`Godkänn lagets svar (0/${team.members.length})`;}}
      tBroadcast({t:'team-sync',teamId,text,approved:[],memberCount:team.members.length,submitted:false,rev:team.rev});
    }else{
      T.liveDrafts=T.liveDrafts||{};T.liveDrafts[id]={name:T.sp&&T.sp[id]?T.sp[id].namn:(id==='h'?'Värd':'Spelare'),text};
    }
    broadcastLive();persistProgressHistory(false);
  }
  function teamApprove(id){
    if(!T||T.fas!=='runda'||!T.teams)return;
    const teamId=T.playerTeams&&T.playerTeams[id],team=teamId&&T.teams[teamId];if(!team||team.submitted)return;
    if(String(team.text||'').trim().length<2){if(id==='h')alert('Skriv ett svar innan laget godkänner.');return;}
    team.approvals[id]=true;
    const approved=Object.keys(team.approvals);
    if(team.members.every(pid=>team.approvals[pid])){team.submitted=true;T.svar['team_'+teamId]=team.text;}
    tBroadcast({t:'team-sync',teamId,text:team.text,approved,memberCount:team.members.length,submitted:team.submitted,rev:team.rev||0});
    const mine=team.members.includes('h')&&T.playerTeams.h===teamId;if(mine){T.skickat=true;const b=$v('tLas'),ta=$v('tSvar');if(b){b.textContent=team.submitted?'Lagets svar är låst':`Godkänn lagets svar (${approved.length}/${team.members.length})`;b.disabled=!!team.submitted||!!team.approvals.h;}if(ta)ta.disabled=!!team.submitted;}
    broadcastLive();persistProgressHistory(false);
    if(typeof tKollaKlar==='function')tKollaKlar();
  }
  function createTeams(){
    const n=Math.max(2,+T.teamSize||2),players=tSpelare();
    T.teams={A:{id:'A',text:'',members:[],approvals:{},submitted:false,rev:0},B:{id:'B',text:'',members:[],approvals:{},submitted:false,rev:0}};
    T.playerTeams={};T.liveDrafts={};
    players.forEach((p,i)=>{const id=i<n?'A':'B';T.playerTeams[p.id]=id;T.teams[id].members.push(p.id);});
  }
  function appendRoundHistory(m){
    if(!T||!Array.isArray(T.historyRounds)||!m||!Array.isArray(m.rader))return;
    if(T.historyRounds.some(r=>r.nr===m.nr))return;
    T.historyRounds.push({nr:m.nr,question:String(m.fraga||'').slice(0,300),referenceAnswer:String(m.facit||'').slice(0,1500),webChecked:!!m.sok,timeoutIncomplete:!!m.timeoutIncomplete,answers:m.rader.map(r=>({name:String(r.namn||'').slice(0,24),answer:String(r.svar||'').slice(0,1200),score:Math.max(1,Math.min(100,+r.poang||1)),feedback:String(r.kommentar||'').slice(0,300),errors:String(r.fel||'').slice(0,300)}))});
    persistProgressHistory(false);
  }
  function redactPublic(s){return String(s||'').slice(0,1200).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[e-post borttagen]').replace(/\+?\d[\d ()-]{8,}\d/g,m=>(m.match(/\d/g)||[]).length>=10?'[telefonnummer borttaget]':m).replace(/https?:\/\/\S+/gi,'[länk borttagen]');}
  function anonymizeRounds(rows){const aliases=new Map();return (rows||[]).map(r=>({nr:r.nr,question:redactPublic(r.question),referenceAnswer:redactPublic(r.referenceAnswer),webChecked:!!r.webChecked,timeoutIncomplete:!!r.timeoutIncomplete,answers:(r.answers||[]).map(a=>{const original=String(a.name||'');let name;if(/^Lag [AB]$/.test(original))name=original;else{if(!aliases.has(original))aliases.set(original,'Deltagare '+(aliases.size+1));name=aliases.get(original);}return {name,answer:redactPublic(a.answer),score:a.score,feedback:redactPublic(a.feedback),errors:redactPublic(a.errors)};})}));}
  let historyDbPromise=null;
  function openLocalHistoryDb(){
    if(historyDbPromise)return historyDbPromise;
    historyDbPromise=new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(new Error('IndexedDB saknas'));return;}
      const request=indexedDB.open('flashcards-v42-history',1);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('matches'))db.createObjectStore('matches',{keyPath:'matchId'});};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Kunde inte öppna historiklagret'));
    });
    return historyDbPromise;
  }
  function saveHistoryToIndexedDb(record){
    if(!record||!record.matchId)return;
    openLocalHistoryDb().then(db=>new Promise((resolve,reject)=>{
      const tx=db.transaction('matches','readwrite');tx.objectStore('matches').put(record);
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('Historiken kunde inte sparas'));tx.onabort=()=>reject(tx.error||new Error('Historiksparningen avbröts'));
    })).catch(()=>{});
  }
  function localHistory(record){
    try{const a=JSON.parse(localStorage.getItem(LS_HISTORY)||'[]');const id=record&&record.matchId;const index=id?a.findIndex(x=>x&&x.matchId===id):-1;if(index>=0)a[index]={...a[index],...record};else a.unshift(record);a.sort((x,y)=>String(y.updated_at||y.created_at||'').localeCompare(String(x.updated_at||x.created_at||'')));localStorage.setItem(LS_HISTORY,JSON.stringify(a.slice(0,25)));}catch(_){}
    saveHistoryToIndexedDb(record);
  }
  function persistProgressHistory(completed){
    if(!T||!Array.isArray(T.historyRounds)||!T.matchId)return;
    const players=Object.values(T.sp||{}).filter(p=>p.id==='h'||p.token);
    const labels={};let next=1;players.forEach(p=>{labels[p.id]=p.id==='h'?'Värd':'Deltagare '+(next++);});
    let drafts=[];
    if(T.format&&T.format!=='solo'&&T.teams){drafts=Object.keys(T.teams).map(id=>({name:TEAM_LABEL[id]||('Lag '+id),answer:String(T.teams[id].text||'').slice(0,1200)}));}
    else{const snap=typeof liveDraftSnapshot==='function'?liveDraftSnapshot():(T.liveDrafts||{});drafts=Object.keys(snap||{}).map(id=>({name:labels[id]||'Deltagare',answer:String(snap[id]&&snap[id].text||'').slice(0,1200)}));}
    const currentRound=!completed&&T.fas==='runda'&&T.q?{nr:T.nr,question:String(T.q.q||'').slice(0,300),drafts,submitted:Object.keys(T.svar||{}).length}:null;
    localHistory({matchId:T.matchId,created_at:T.matchStartedAt||new Date().toISOString(),updated_at:new Date().toISOString(),completed:!!completed,format:T.format||'solo',tournament:!!(T.set&&T.set.tournament),players:players.map((p,i)=>({name:labels[p.id]||('Deltagare '+(i+1))})),rounds:anonymizeRounds(T.historyRounds),currentRound});
  }
  async function authenticatedSupabase(){
    const client=typeof tSupabaseClient==='function'?tSupabaseClient():null;if(!client)return null;
    try{
      if(typeof window.flashcardsGetAccessToken!=='function')return null;
      const access=await window.flashcardsGetAccessToken();
      const raw=JSON.parse(localStorage.getItem('jk-konto')||'null');if(!access||!raw||!raw.refresh_token||!client.auth||!client.auth.setSession)return null;
      const r=await client.auth.setSession({access_token:access,refresh_token:raw.refresh_token});if(r&&r.error)throw r.error;
      return client;
    }catch(e){return null;}
  }
  async function publishHistory(){
    if(!T||!T.historyRounds||!T.historyRounds.length)return;
    const state=T;const players=Object.values(state.sp||{}).filter(p=>p.id==='h'||p.token);
    const consent=state.historyConsent===true&&players.every(p=>p.id==='h'?state.historyConsent===true:p.historyConsent===true);
    const record={matchId:state.matchId||null,created_at:state.matchStartedAt||new Date().toISOString(),updated_at:new Date().toISOString(),completed:true,currentRound:null,format:state.format||'solo',tournament:!!(state.set&&state.set.tournament),rounds:anonymizeRounds(state.historyRounds),players:players.map((p,i)=>({name:'Deltagare '+(i+1)}))};
    localHistory(record);
    if(!consent){state.historyPublishStatus='Inte publicerad: alla deltagare gav inte samtycke.';return;}
    const client=await authenticatedSupabase();if(!client){state.historyPublishStatus='Sparad lokalt. Logga in på Konto som värd för att publicera historiken.';return;}
    try{
      const res=await client.from('match_history').insert({format:record.format,tournament:record.tournament,players:record.players,rounds:record.rounds});
      if(res&&res.error)throw res.error;state.historyPublishStatus='Publicerad anonymt i matchhistoriken.';
    }catch(e){state.historyPublishStatus='Sparad lokalt, men kunde inte publiceras. Kontrollera att match-history SQL har körts i Supabase.';}
  }
  function leaveSpectator(){if(T&&T.roll==='spectator'&&T.conn&&T.conn.open){try{T.conn.send({t:'spectate-leave'});}catch(_){}}tMeny();}
  function spectatorLogin(){
    tPanel(`<p class="q">Observatörsinloggning</p><p style="font-size:13px;color:#6A6558">Det här är en separat observatörsroll. Du räknas inte som spelare och kan inte skicka in svar.</p><input id="v41-ob-code" class="ginp" maxlength="5" placeholder="Spelkod (5 tecken)" style="text-transform:uppercase;letter-spacing:4px;margin-bottom:8px"><input id="v41-ob-name" class="ginp" maxlength="16" placeholder="Observatörsnamn"><div class="err" id="v41-ob-err" style="display:none"></div><div class="row"><button class="act ghost" id="v41-ob-back">Tillbaka</button><button class="act" id="v41-ob-go">Logga in som observatör</button></div>`);
    $v('v41-ob-back').onclick=tMeny;
    $v('v41-ob-go').onclick=()=>{const code=($v('v41-ob-code').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5),name=tNamn($v('v41-ob-name').value);if(code.length!==5||!name){$v('v41-ob-err').textContent='Fyll i en korrekt kod och ett observatörsnamn.';$v('v41-ob-err').style.display='block';return;}window.v41JoinRole='spectator';tAnslut(code,name);window.v41JoinRole='player';};
  }
  function spectatorView(m){
    if(!T)return;
    if(m.t==='observerWelcome'){T.roll='spectator';T.token=String(m.token||'');T.hasJoined=true;T.fas='lobby';tPanel(`<p class="q">Du tittar på matchen</p><p style="font-size:13px;color:#6A6558">Observatörsläge · du påverkar inte matchen. Svar som skrivs visas live.</p><div id="v41-ob-state"></div><button class="act ghost" id="v41-ob-leave">Lämna visningen</button>`);$v('v41-ob-leave').onclick=leaveSpectator;return true;}
    if(T.roll!=='spectator')return false;
    if(m.t==='lobby'){T.fas='lobby';tPanel(`<p class="q">Observatör · väntar på start</p><p style="font-size:13px;color:#6A6558">Spelkod ${h(m.kod||T.kod)}. Spelare: ${(m.namn||[]).map(h).join(', ')}</p><div id="v41-ob-state">Matchen har inte börjat.</div><button class="act ghost" id="v41-ob-leave">Lämna</button>`);$v('v41-ob-leave').onclick=leaveSpectator;return true;}
    if(m.t==='runda'){T.fas='runda';T.nr=+m.nr||0;T.currentQuestion=String(m.fraga||'');T.liveBoard=m.drafts||T.liveBoard||{};renderSpectatorRound();return true;}
    if(m.t==='live'){if(+m.nr===T.nr){T.liveBoard=m.drafts||{};renderSpectatorRound();}return true;}
    if(m.t==='team-sync'){if(T.liveBoard)T.liveBoard[m.teamId]={name:TEAM_LABEL[m.teamId],text:m.text||''};renderSpectatorRound();return true;}
    if(m.t==='rattar'){T.fas='ratta';tPanel('<p class="q">AI:n rättar svaren…</p><p style="font-size:13px;color:#6A6558">Du kan se resultatet när värden är klar.</p>');return true;}
    if(m.t==='resultat'){T.fas='visar';tResultat(m,false);return true;}
    if(m.t==='slut'){T.fas='slut';tSlutVy(m.tab||[]);return true;}
    if(m.t==='avvisa'){tFel(String(m.orsak||'Observatörsåtkomsten nekades.'));return true;}
    return true;
  }
  function renderSpectatorRound(){
    if(!T||T.roll!=='spectator')return;
    const data=T.liveBoard||{};let html=`<div class="meta"><span class="chip">Runda ${T.nr||0}</span><span class="chip">LIVE · observatör</span></div><p class="q">${h(T.currentQuestion||'Väntar på frågan…')}</p><p style="font-size:12px;color:#6A6558">Alla svar uppdateras medan spelarna skriver.</p>`;
    const rows=Object.values(data);if(!rows.length)html+='<p class="v41-live">Väntar på svar…</p>';
    rows.forEach(r=>html+=`<div class="v41-live"><small>${h(r.name||'Spelare')}</small>${h(r.text||'Skriver…')}</div>`);
    html+='<p style="font-size:11px;color:#6A6558">Observatörer kan bara titta. Värden bestämmer när rundan avslutas.</p><button class="act ghost" id="v41-ob-leave">Lämna visningen</button>';
    tPanel(html);$v('v41-ob-leave').onclick=leaveSpectator;
  }

  // Extend the existing host setup without replacing its original stable UI.
  if(typeof tInst==='function')tInst=function(){old.tInst();const panel=$v('modTavla').querySelector('.panel');if(!panel||$v('v41-format'))return;const anchor=$v('tErr');const box=document.createElement('div');box.id='v41-create-options';box.innerHTML=`<div style="margin:10px 0"><label style="font-size:14px">Spelformat</label><select id="v41-format" class="ginp"><option value="solo">Individuellt</option><option value="2v2">2 mot 2 – delat lagsvar</option><option value="4v4">4 mot 4 – delat lagsvar</option><option value="8v8">8 mot 8 – delat lagsvar</option><option value="12v12">12 mot 12 – delat lagsvar</option></select><p style="font-size:11px;color:#6A6558;margin:4px 0">Lagspelet kräver exakt antal spelare. Alla i laget redigerar samma svar.</p><label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-top:7px"><input id="v41-tournament" type="checkbox">Turneringsmatch (formatet sparas i matchhistoriken)</label></div>`;if(anchor)anchor.parentNode.insertBefore(box,anchor);else panel.appendChild(box);};
  if(typeof tSkapa==='function')tSkapa=function(set,forsok){const fmt=$v('v41-format')?$v('v41-format').value:'solo';set.format=fmt;set.teamSize=fmt==='solo'?0:+fmt.split('v')[0];if(fmt!=='solo')set.max=set.teamSize*2;set.tournament=!!($v('v41-tournament')&&$v('v41-tournament').checked);old.tSkapa(set,forsok);if(T&&T.roll==='host'){T.format=set.format;T.teamSize=set.teamSize;T.spectators=T.spectators||{};T.historyRounds=T.historyRounds||[];T.historyConsent=false;T.allowSpectators=false;T.historyPublishStatus='Väntar på matchslut.';}};

  if(typeof tMeny==='function')tMeny=function(){old.tMeny();const panel=$v('modTavla').querySelector('.panel');if(!panel||$v('v41-spectate'))return;panel.insertAdjacentHTML('beforeend',`<div class="amne" id="v41-spectate"><span class="an">Spectata match<span class="am">Separat observatörsinloggning · se svar i realtid</span></span><span style="font-size:22px">›</span></div><div class="amne" id="v41-history"><span class="an">Publik matchhistorik<span class="am">Se tidigare matcher, alla svar och AI-bedömningar</span></span><span style="font-size:22px">›</span></div>`);$v('v41-spectate').onclick=spectatorLogin;$v('v41-history').onclick=showHistory;};

  if(typeof tGaMed==='function')tGaMed=function(){old.tGaMed();const err=$v('tErr');if(!err||$v('v41-player-consent'))return;err.insertAdjacentHTML('beforebegin',`<label id="v41-player-consent" style="display:flex;gap:8px;align-items:flex-start;font-size:12px;color:#6A6558;margin:9px 0"><input id="v41-player-consent-check" type="checkbox" style="margin-top:3px">Jag godkänner att mina svar och AI-bedömningar sparas anonymt i en offentlig matchhistorik. Jag delar inte privata uppgifter.</label>`);const btn=$v('tGo'),go=btn.onclick;btn.onclick=()=>{window.v41PendingConsent=!!$v('v41-player-consent-check').checked;go();window.v41PendingConsent=false;};};

  // Host lobby consent and exact team capacity checks.
  if(typeof tLobbyHost==='function')tLobbyHost=function(){old.tLobbyHost();if(!T||T.roll!=='host')return;const panel=$v('modTavla').querySelector('.panel');if(!panel)return;const all=Object.values(T.sp||{}).filter(s=>s.id!=='h').every(s=>s.historyConsent===true);const players=tSpelare();const needed=T.format&&T.format!=='solo'?T.teamSize*2:2;const full=players.length>=needed&&(T.format==='solo'||players.length===needed);panel.insertAdjacentHTML('beforeend',`<div class="v41-card"><label style="display:flex;gap:8px;align-items:flex-start;font-size:12px"><input id="v41-host-consent" type="checkbox" ${T.historyConsent?'checked':''} style="margin-top:3px">Jag godkänner att matchens svar och AI-bedömningar publiceras anonymt. Dela inte privata uppgifter.</label><p style="font-size:11px;margin:7px 0 0">${T.format&&T.format!=='solo'?h(T.format)+' kräver '+needed+' spelare. ':''}Samtycke till offentlig historik: ${all&&T.historyConsent?'alla har godkänt':'saknas – matchen kan spelas privat'}. </p><label style="display:flex;gap:8px;align-items:flex-start;font-size:12px;margin-top:8px"><input id="v41-allow-observers" type="checkbox" ${T.allowSpectators?'checked':''} style="margin-top:3px">Tillåt åskådare att se alla utkast live</label><p style="font-size:11px;margin:5px 0 0">${Object.keys(T.spectators||{}).length} observatörer tittar just nu. </p><p style="font-size:11px;margin:5px 0 0">Offentlig publicering kräver samtycke från alla, att värden är inloggad under Konto och att v4.1 SQL-migrationen har körts.</p></div>`);$v('v41-host-consent').onchange=()=>{T.historyConsent=$v('v41-host-consent').checked;tLobbyHost();};$v('v41-allow-observers').onchange=()=>{T.allowSpectators=$v('v41-allow-observers').checked;tLobbyHost();};const start=$v('tStart');if(start){start.disabled=!full;if(!full)start.textContent=players.length<needed?'Väntar på spelare…':'För många spelare';}};

  if(typeof tStart==='function')tStart=function(){if(!T)return;Object.keys(T.sp||{}).forEach(id=>{const player=T.sp[id];if(id!=='h'&&(!player.conn||!player.conn.open)){if(player.bortTimer)clearTimeout(player.bortTimer);delete T.sp[id];}});const allPlayers=tSpelare();if(T.format&&T.format!=='solo'){const needed=T.teamSize*2;if(allPlayers.length!==needed){tLobbyHost();return;}createTeams();}else{T.playerTeams={};T.teams=null;T.liveDrafts={};}T.historyRounds=[];T.matchId=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,9);T.matchStartedAt=new Date().toISOString();old.tStart();if(T&&T.format&&T.format!=='solo'){T.tot={team_A:{namn:'Lag A',summa:0,vinster:0},team_B:{namn:'Lag B',summa:0,vinster:0}};}persistProgressHistory(false);};

  // The host is authoritative for every live edit and every approval.
  if(typeof tHostData==='function')tHostData=function(c,m){
    if(T&&T.roll==='host'&&c&&m&&typeof m==='object'){
      if(m.t==='spectate'&&!c._id){T.spectators=T.spectators||{};if(!T.allowSpectators){try{c.send({t:'avvisa',orsak:'Värden har inte aktiverat åskådare.'});}catch(_){}return;}if(Object.keys(T.spectators).length>=20){try{c.send({t:'avvisa',orsak:'Observatörsrummet är fullt.'});}catch(_){}return;}T.observerN=(T.observerN||0)+1;const id='o'+T.observerN,token=tKod()+tKod();c._id=id;c._spectator=true;const observer={id,namn:tNamn(m.namn)||'Observatör',conn:c,token};T.spectators[id]=observer;try{c.send({t:'observerWelcome',token});}catch(_){}tSkickaTill(c,tAktuellStatus(c));broadcastLive();return;}
      if(m.t==='spectate-resume'&&!c._id){const s=Object.values(T.spectators||{}).find(x=>x.token&&x.token===m.token);if(!s){try{c.send({t:'avvisa',orsak:'Observatörssessionen finns inte längre.'});}catch(_){}return;}if(s.bortTimer)clearTimeout(s.bortTimer);s.conn=c;c._id=s.id;c._spectator=true;try{c.send({t:'observerWelcome',token:s.token});}catch(_){}tSkickaTill(c,tAktuellStatus(c));broadcastLive();return;}
      if(m.t==='spectate-leave'&&c._spectator){const s=T.spectators&&T.spectators[c._id];if(s&&s.bortTimer)clearTimeout(s.bortTimer);if(T.spectators)delete T.spectators[c._id];c._spectator=false;return;}
      if(c._spectator)return;
      if(m.t==='draft'&&c._id&&T.fas==='runda'&&+m.nr===T.nr){updateDraft(c._id,m.text);return;}
      if(m.t==='team-edit'&&c._id&&T.fas==='runda'&&+m.nr===T.nr){const expected=T.playerTeams&&T.playerTeams[c._id];if(expected&&expected===m.teamId)updateDraft(c._id,m.text);return;}
      if(m.t==='team-approve'&&c._id&&T.fas==='runda'&&+m.nr===T.nr){if(T.playerTeams&&T.playerTeams[c._id]===m.teamId)teamApprove(c._id);return;}
    }
    const result=old.tHostData(c,m);if(m.t==='svar')persistProgressHistory(false);return result;
  };

  if(typeof tNer==='function')tNer=function(c){if(T&&c&&c._spectator&&T.spectators&&T.spectators[c._id]){const s=T.spectators[c._id];if(s.conn!==c)return;s.conn=null;if(s.bortTimer)clearTimeout(s.bortTimer);s.bortTimer=setTimeout(()=>{if(T&&T.spectators&&T.spectators[s.id]===s&&!s.conn)delete T.spectators[s.id];},90000);return;}return old.tNer(c);};
  if(typeof tAktuellStatus==='function')tAktuellStatus=function(c){const m=old.tAktuellStatus(c);if(m&&m.t==='runda'){if(T&&T.format&&T.format!=='solo'){const id=c&&c._id,teamId=T.playerTeams&&T.playerTeams[id],team=teamId&&T.teams&&T.teams[teamId];m.format=T.format;m.teamId=teamId||null;m.teamText=team?team.text:'';m.teamApprovals=team?Object.keys(team.approvals).length:0;m.teamMembers=team?team.members.length:0;m.teamApproved=team?!!team.approvals[id]:false;m.teamSubmitted=team?!!team.submitted:false;}m.drafts=liveDraftSnapshot();}return m;};
  if(typeof tSand==='function')tSand=function(m){if(!T)return;if(m&&m.t==='resultat'){T.senasteResultat=m;appendRoundHistory(m);}else if(m&&m.t==='runda'){persistProgressHistory(false);}else if(m&&m.t==='slut'){persistProgressHistory(true);}return tBroadcast(m);};

  if(typeof tRundaVy==='function')tRundaVy=function(nr,tot,fraga){old.tRundaVy(nr,tot,fraga);if(!T)return;const ta=$v('tSvar'),btn=$v('tLas');if(!ta||!btn)return;T.liveDrafts=T.liveDrafts||{};
    if(T.format&&T.format!=='solo'){
      const team=T.teams&&T.teams[T.teamId||T.playerTeams&&T.playerTeams.h];T.teamId=T.teamId||T.playerTeams&&T.playerTeams.h;const my=T.teams&&T.teams[T.teamId];
      const memberCount=my?my.members.length:(T.teamMembers||0),approvedCount=my?Object.keys(my.approvals).length:(T.teamApprovals||0),isSubmitted=my?!!my.submitted:!!T.teamSubmitted,isApproved=my?!!my.approvals.h:!!T.teamApproved;
      T.teamText=my?String(my.text||''):String(T.teamText||'');ta.value=T.teamText;ta.placeholder='Skriv tillsammans med ditt lag…';ta.disabled=isSubmitted;
      btn.textContent=isSubmitted?'Lagets svar är låst':`Godkänn lagets svar (${approvedCount}/${memberCount})`;btn.disabled=isSubmitted||isApproved;
      let info=$v('v41-team-info');if(!info){info=document.createElement('div');info.id='v41-team-info';info.className='v41-teamline';ta.parentNode.insertBefore(info,ta);}info.textContent=`${TEAM_LABEL[T.teamId]||'Ditt lag'} delar en gemensam svarsruta. Alla ${memberCount} lagmedlemmar måste godkänna innan svaret låses.`;
    }
    let timer=null;ta.addEventListener('input',()=>{if(T.format&&T.format!=='solo'){if(timer)clearTimeout(timer);timer=setTimeout(()=>{if(T&&T.roll==='host')updateDraft('h',ta.value);else if(T&&T.conn&&T.conn.open)T.conn.send({t:'team-edit',nr:T.nr,teamId:T.teamId,text:ta.value.slice(0,1200)});},250);}else{if(timer)clearTimeout(timer);timer=setTimeout(()=>{if(T&&T.roll==='host')updateDraft('h',ta.value);else if(T&&T.conn&&T.conn.open)T.conn.send({t:'draft',nr:T.nr,text:ta.value.slice(0,1200)});},300);}});
    if(T.roll==='host'){updateDraft('h',ta.value);}
    broadcastLive();
  };

  if(typeof tKlientData==='function')tKlientData=function(m){
    if(!T||!m)return;
    if(m.t==='observerWelcome'){spectatorView(m);return;}
    if(T.roll==='spectator'){spectatorView(m);return;}
    if(m.t==='valkommen'||m.t==='aterkommen'){T.playerId=String(m.id||T.playerId||'');}
    if(m.t==='runda'&&m.format&&m.format!=='solo'){T.format=m.format;T.teamId=m.teamId;T.teamText=String(m.teamText||'');T.teamApprovals=+m.teamApprovals||0;T.teamMembers=+m.teamMembers||0;T.teamApproved=!!m.teamApproved;T.teamSubmitted=!!m.teamSubmitted;}
    if(m.t==='team-sync'){if(m.teamId!==T.teamId)return;T.teamText=String(m.text||'');T.teamApprovals=(m.approved||[]).length;T.teamMembers=+m.memberCount||0;T.teamApproved=(m.approved||[]).includes(T.playerId);const ta=$v('tSvar');if(ta&&document.activeElement!==ta)ta.value=T.teamText;if(ta)ta.disabled=!!m.submitted;const b=$v('tLas');if(b){b.textContent=m.submitted?'Lagets svar är låst':`Godkänn lagets svar (${T.teamApprovals}/${T.teamMembers})`;b.disabled=!!m.submitted||!!T.teamApproved;}T.skickat=!!T.teamApproved;return;}
    if(m.t==='live'){T.liveBoard=m.drafts||{};return;}
    return old.tKlientData(m);
  };

  if(typeof tSkicka==='function')tSkicka=function(){
    if(!T||T.skickat)return;
    if(T.format&&T.format!=='solo'){
      const txt=($v('tSvar')&&$v('tSvar').value||T.teamText||'').slice(0,1200);
      const team=T.teams&&(T.teams[T.teamId||T.playerTeams&&T.playerTeams.h]);
      const current=team?String(team.text||''):String(T.teamText||'');
      if(current!==txt){if(T.roll==='host')updateDraft('h',txt);else if(T.conn&&T.conn.open)T.conn.send({t:'team-edit',nr:T.nr,teamId:T.teamId,text:txt});}
      if(T.roll==='host')teamApprove('h');else if(T.conn&&T.conn.open)T.conn.send({t:'team-approve',nr:T.nr,teamId:T.teamId});
      T.skickat=true;const b=$v('tLas');if(b)b.textContent='Godkänt – väntar på laget';return;
    }
    const text=($v('tSvar')&&$v('tSvar').value||'').slice(0,1200);if(T.roll==='host')updateDraft('h',text);else if(T.conn&&T.conn.open)T.conn.send({t:'draft',nr:T.nr,text});
    return old.tSkicka();
  };
  if(typeof tKollaKlar==='function')tKollaKlar=function(){if(T&&T.roll==='host'&&T.format&&T.format!=='solo'){if(T.teams&&Object.values(T.teams).every(x=>x.submitted))rattaRunda();return;}return old.tKollaKlar();};

  function syncTeamClient(m){
    if(!T||T.roll==='host'||!m)return;T.teamText=String(m.text||'');T.teamApprovals=(m.approved||[]).length;T.teamMembers=+m.memberCount||0;T.teamApproved=Array.isArray(m.approved)&&m.approved.includes(T.playerId);const ta=$v('tSvar');if(ta&&document.activeElement!==ta)ta.value=T.teamText;const b=$v('tLas');if(b){b.disabled=!!m.submitted||T.teamApproved;b.textContent=m.submitted?'Lagets svar är låst':`Godkänn lagets svar (${T.teamApprovals}/${T.teamMembers})`;}T.skickat=!!T.teamApproved;
  }

  if(typeof rattaRunda==='function'){
    rattaRunda=async function(){
      if(!T||T.roll!=='host'||T.fas!=='runda')return;
      if(!T.format||T.format==='solo'){
        await old.rattaRunda();return;
      }
      T.fas='ratta';if(T.timer)clearInterval(T.timer);tSand({t:'rattar'});tPanel('<p class="q">Rättar lagens svar…</p><p style="font-size:13px;color:#6A6558">AI:n granskar de två gemensamma svaren.</p>');
      const rows=Object.keys(T.teams||{}).map(id=>({id:'team_'+id,namn:TEAM_LABEL[id],text:String(T.teams[id].text||'').trim().slice(0,1200)}));const med=rows.filter(x=>x.text.length>1);let scores={},sok=false;
      if(med.length){try{const r=await tDomare(T.q,med,T.set.sek);scores=r.betyg;sok=r.sok;}catch(e){if(!T)return;T.fas='runda';tPanel(`<p class="q">Rättningen misslyckades</p><p style="font-size:13px">${h(e.message||'AI-fel')}</p><button class="act" id="v41-retry-grade">Försök igen</button>`);$v('v41-retry-grade').onclick=()=>rattaRunda();return;}}
      const answers=rows.map(d=>{const b=scores[d.id];return {namn:d.namn,svar:d.text,poang:b?b.poang:1,kommentar:b?b.kommentar:'Inget svar.',fel:b?b.fel:''};});
      const max=Math.max(1,...answers.map(x=>x.poang));const winners=answers.filter(x=>x.poang===max).map(x=>x.namn);
      const roundTab=answers.map(x=>({namn:x.namn,summa:x.poang,vinster:winners.includes(x.namn)?1:0}));
      const timedOutTeams=Object.keys(T.teams||{}).filter(id=>!T.teams[id].submitted);
      ['A','B'].forEach((id,i)=>{const key='team_'+id,prior=T.tot[key]||{namn:TEAM_LABEL[id],summa:0,vinster:0},r=roundTab[i];T.tot[key]={namn:TEAM_LABEL[id],summa:(prior.summa||0)+(r?r.summa:0),vinster:(prior.vinster||0)+(r?r.vinster:0)};});
      const tab=Object.values(T.tot).sort((a,b)=>b.summa-a.summa);T.fas='visar';
      const m={t:'resultat',nr:T.nr,tot:T.fragor.length,fraga:T.q.q,facit:T.q.a,rader:answers,vinnare:winners,tab,sok,format:T.format,timeoutIncomplete:timedOutTeams.length>0};T.senasteResultat=m;appendRoundHistory(m);tSand(m);tResultat(m,true);
    };
  }
  if(typeof tSlutHost==='function')tSlutHost=function(){old.tSlutHost();publishHistory().then(()=>{const p=$v('modTavla')&&$v('modTavla').querySelector('.panel');if(p&&T&&T.historyPublishStatus){const n=document.createElement('p');n.style.cssText='font-size:11px;color:#6A6558;margin-top:8px';n.textContent=T.historyPublishStatus;p.appendChild(n);}});};
  if(typeof tResultat==='function')tResultat=function(m,host){old.tResultat(m,host);if(m&&m.timeoutIncomplete){const panel=$v('modTavla')&&$v('modTavla').querySelector('.panel');if(panel)panel.insertAdjacentHTML('afterbegin','<p class="v41-card">Tiden tog slut innan alla lagmedlemmar hade godkänt. AI:n rättade lagets senast sparade svar.</p>');}};

  // Connection changes should not corrupt current match state. On reconnect the host re-sends
  // round + team snapshot through tAktuellStatus; the fallback channel remains available.
  window.addEventListener('online',()=>{if(T&&T.roll==='klient'&&T.peer&&!T.peer.destroyed&&!T.signalReady){try{T.peer.reconnect();}catch(_){}}});

  // Load locally generated cards, install version UI, then update progress when stats change.
  loadCustomCards();addStyle();applySettings();
  const badge=document.createElement('div');badge.id='v41-badge';badge.textContent='Flashcards v'+VERSION;document.body.appendChild(badge);
  const dash=document.createElement('div');dash.id='v41-dash';const head=$v('profrad');if(head&&head.parentNode)head.parentNode.insertBefore(dash,head.nextSibling);renderDash();
  const mut=new MutationObserver(()=>{if($v('v-set')&&!$v('v41-generator'))addGenerator();});mut.observe(document.body,{childList:true,subtree:true});addGenerator();
  window.addEventListener('keydown',e=>{if(e.altKey&&e.key.toLowerCase()==='n'&&$v('nx')){$v('nx').click();}});
  // Wrap sound calls to respect the user's setting without touching the learning state.
  if(typeof audio==='function')audio=function(){if(!getSettings().sound)return;return old.audio();};
  if(typeof tone==='function')tone=function(){if(!getSettings().sound)return;return old.tone.apply(this,arguments);};

  async function showHistory(){
    tPanel('<p class="q">Publik matchhistorik</p><p style="font-size:12px;color:#6A6558">Svaren visas anonymt. Matchhistoriken innehåller frågor, svar, poäng, AI-feedback och sakfel.</p><div id="v41-history-list">Laddar…</div><div class="row"><button class="act ghost" id="v41-history-local">Visa lokal historik</button><button class="act" id="v41-history-back">Tillbaka</button></div>');
    $v('v41-history-back').onclick=tMeny;$v('v41-history-local').onclick=()=>renderHistoryLocal();
    try{const c=typeof tSupabaseClient==='function'?tSupabaseClient():null;if(!c)throw new Error('Supabase är inte konfigurerat.');const r=await c.from('public_match_history').select('id,created_at,format,tournament,players,rounds').order('created_at',{ascending:false}).limit(30);if(r.error)throw r.error;renderHistoryRows(r.data||[]);}catch(e){$v('v41-history-list').innerHTML=`<div class="v41-card">Kunde inte hämta offentlig historik. Kontrollera att SQL-filen <b>supabase/v4.1-match-history.sql</b> har körts i Supabase. ${h(e.message||'')}</div>`;}
  }
  function renderHistoryRows(rows){const el=$v('v41-history-list');if(!el)return;if(!rows.length){el.textContent='Inga offentliga matcher ännu.';return;}el.innerHTML=rows.map((r,i)=>`<details class="v41-live"><summary><b>${r.tournament?'Turneringsmatch · ':''}${h(r.format||'Individuellt')}</b> · ${h(new Date(r.created_at).toLocaleString('sv-SE'))} · ${(r.rounds||[]).length} rundor</summary>${(r.rounds||[]).map(q=>`<div style="padding:9px 0;border-top:1px solid #d8d2c0"><b>${h(q.nr)}. ${h(q.question)}</b><p style="font-size:11px;color:#6A6558">Facit: ${h(q.referenceAnswer)}</p>${(q.answers||[]).map(a=>`<div style="margin:6px 0;padding:7px;background:#f7f4ec;border-radius:7px"><b>${h(a.name)} · ${h(a.score)} p</b><p style="white-space:pre-wrap;margin:4px 0">${h(a.answer||'(inget svar)')}</p><small>${h(a.feedback)} ${a.errors?'<br>Sakfel: '+h(a.errors):''}</small></div>`).join('')}</div>`).join('')}</details>`).join('');}
  async function renderHistoryLocal(){
    const el=$v('v41-history-list');if(!el)return;el.textContent='Laddar lokal historik…';let rows=[];
    try{
      const db=await openLocalHistoryDb();
      rows=await new Promise((resolve,reject)=>{const tx=db.transaction('matches','readonly');const req=tx.objectStore('matches').getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error||new Error('Kunde inte läsa historiken'));});
      if(!rows.length){let legacy=[];try{legacy=JSON.parse(localStorage.getItem(LS_HISTORY)||'[]');}catch(_){};if(legacy.length){await new Promise((resolve,reject)=>{const tx=db.transaction('matches','readwrite'),store=tx.objectStore('matches');legacy.forEach((r,i)=>store.put({...r,matchId:r.matchId||('legacy-'+String(r.created_at||i)+'-'+i)}));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});rows=legacy.map((r,i)=>({...r,matchId:r.matchId||('legacy-'+String(r.created_at||i)+'-'+i)}));}
    }}catch(_){try{rows=JSON.parse(localStorage.getItem(LS_HISTORY)||'[]');}catch(__){rows=[];}}
    if(!el.isConnected)return;
    rows.sort((x,y)=>String(y.updated_at||y.created_at||'').localeCompare(String(x.updated_at||x.created_at||'')));
    if(!rows.length){el.textContent='Ingen lokal historik ännu.';return;}
    el.innerHTML=rows.map(r=>`<details class="v41-live"><summary>${h(r.format)} · ${h(new Date(r.created_at).toLocaleString('sv-SE'))}${r.completed===false?' · Pågående/autosparad':' · Sparad'}</summary>${(r.rounds||[]).map(q=>`<p><b>${h(q.question)}</b></p>${(q.answers||[]).map(a=>`<p>${h(a.name)} (${h(a.score)} p): ${h(a.answer)}<br><small>${h(a.feedback)}</small></p>`).join('')}`).join('')}${r.currentRound?`<div style="border-top:1px solid #d8d2c0;margin-top:8px;padding-top:8px"><b>Senast autosparad runda ${h(r.currentRound.nr)}: ${h(r.currentRound.question)}</b>${(r.currentRound.drafts||[]).map(d=>`<p>${h(d.name)}: ${h(d.answer||'(inget utkast)')}</p>`).join('')}</div>`:''}</details>`).join('');
  }

})();
