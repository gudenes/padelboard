// Manual integration check: creates exactly one temporary match and deletes it in finally.
// Run against the configured database only when that test write is authorized.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l && !l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
const svc=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false}});
const anon=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const base='http://localhost:3003';
let id,channel;
async function api(path,body,method='POST') {const r=await fetch(base+path,{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
try {
 const created=await api('/api/matches',{});assert.equal(created.status,200,'create draft');id=created.data.id;const token=created.data.draftToken;const code=created.data.shortCode;
 const config={format:'bo3',goldenPoint:false,deuceRule:'star-point',superTiebreak:true,setTiebreakAt:6};
 const teams={a:{name:'DB check / Player A',players:['DB check','Player A']},b:{name:'Player B / Player C',players:['Player B','Player C']}};
 const design={background:'#173f37',rowBackground:'#205346',textColor:'#ffffff',borderColor:'#445064',scoreBackground:'#e6eaf0',scoreTextColor:'#111827',pointTextColor:'#111827',font:'sans',rowHeight:42,fontSize:17,radius:8,width:460,showHeader:true};
 const overlay={template:'custom',customDesign:design,customColors:{accent:{color:'#ff95c7'}},scale:1,position:'top-left',showTimer:false,showTournament:true,tournamentName:'Temporary database integration check'};
 assert.equal((await api(`/api/matches/${id}`,{draftToken:'wrong',teams},'PATCH')).status,403,'wrong token denied');
 assert.equal((await api(`/api/matches/${id}`,{draftToken:token,teams,config,overlay},'PATCH')).status,200,'save draft');
 const stored=await svc.from('matches').select('*').eq('id',id).single();assert.ifError(stored.error);assert.deepEqual(stored.data.teams,teams);assert.deepEqual(stored.data.config,config);assert.deepEqual(stored.data.overlay,overlay);
 const privateRead=await anon.from('matches').select('id,draft_token').eq('id',id);assert.ifError(privateRead.error);assert.equal(privateRead.data.length,0,'anonymous cannot read draft tokens');
 const page=await fetch(`${base}/m/${code}`);assert.equal(page.status,200);assert.equal((await page.text()).includes(token),false,'server-rendered page must not contain draft token');
 assert.equal((await fetch(`${base}/overlay/${code}`)).status,404,'draft overlay is not public');
 const point=await api(`/api/matches/${id}/action`,{draftToken:token,action:{kind:'point_for',team:'a'}});assert.equal(point.status,200);assert.equal(point.data.state.currentGame.a,15);
 const log=await svc.from('match_events').select('kind').eq('match_id',id);assert.ifError(log.error);assert.equal(log.data.length,1);
 console.log('PASS: create, save/reload doubles + custom design + Star Point, reject bad token, hide draft/token, score and record event.');
 const paused=await api(`/api/matches/${id}/action`,{draftToken:token,action:{kind:'pause_clock'}});assert.equal(paused.status,200);assert.equal(paused.data.row.overlay.clock.runningSince,null);
 const resumed=await api(`/api/matches/${id}/action`,{draftToken:token,action:{kind:'start_clock'}});assert.equal(resumed.status,200);assert.ok(resumed.data.row.overlay.clock.runningSince);
 const undone=await api(`/api/matches/${id}/action`,{draftToken:token,action:{kind:'undo'}});assert.equal(undone.status,200);assert.equal(undone.data.state.currentGame.a,0);
 const finished=await api(`/api/matches/${id}/action`,{draftToken:token,action:{kind:'finish_match'}});assert.equal(finished.status,200);assert.equal(finished.data.row.status,'finished');assert.equal(finished.data.row.overlay.clock.runningSince,null);
 console.log('PASS: persisted pause/resume, undo and finish lifecycle.');
 // Publish only this synthetic test row to check public overlay/realtime without sending emails.
 const pub=await svc.from('matches').update({status:'published',draft_token:null,published_at:new Date().toISOString()}).eq('id',id);assert.ifError(pub.error);
 const publicRead=await anon.from('matches').select('id,draft_token').eq('id',id);assert.ifError(publicRead.error);assert.equal(publicRead.data.length,1);assert.equal(publicRead.data[0].draft_token,null);
 assert.equal((await fetch(`${base}/overlay/${code}`)).status,200);
 let gotEvent; const event=new Promise(resolve=>{gotEvent=resolve});
 await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('Realtime subscription timeout')),15000);
   channel=anon.channel(`db-check-${id}`).on('system', {}, info => { if(info.extension === 'postgres_changes' && info.status === 'ok') { clearTimeout(timeout); resolve(); } }).on('postgres_changes',{event:'UPDATE',schema:'public',table:'matches',filter:`id=eq.${id}`},payload=>gotEvent(payload.new)).subscribe(status=>{if(status==='CHANNEL_ERROR'){clearTimeout(timeout);reject(new Error('Realtime channel error'));}});
 });
 const next={...point.data.state,currentGame:{a:30,b:0}};
 const update=await svc.from('matches').update({state:next}).eq('id',id);assert.ifError(update.error);
 let timeout;const received=await Promise.race([event,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Realtime event timeout')),15000);})]).finally(()=>clearTimeout(timeout));
 assert.equal(received.state.currentGame.a,30);assert.equal(received.draft_token,null);
 console.log('PASS: public overlay loads and anonymous Realtime receives the updated score.');
} finally {
 if(channel) await anon.removeChannel(channel);
 anon.realtime.disconnect();
 svc.realtime.disconnect();
 if(id) {const clean=await svc.from('matches').delete().eq('id',id);assert.ifError(clean.error);console.log('Temporary test match and its events removed.');}
}
