// Disposable authenticated integration test. Sends no email and removes its user/match.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
const svc=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false}});
let userId,matchId;const jar=new Map();
const auth=createServerClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(({name,value})=>jar.set(name,value))}});
async function call(action){const r=await fetch(`http://localhost:3003/api/matches/${matchId}/action`,{method:'POST',headers:{'content-type':'application/json',cookie:[...jar].map(([n,v])=>`${n}=${v}`).join('; ')},body:JSON.stringify({action})});const data=await r.json();assert.equal(r.status,200,data.error);return data.row;}
try{
 const email=`controls-qa-${Date.now()}@example.com`;
 const created=await svc.auth.admin.createUser({email,email_confirm:true});assert.ifError(created.error);userId=created.data.user.id;
 const link=await svc.auth.admin.generateLink({type:'magiclink',email});assert.ifError(link.error);
 const verified=await auth.auth.verifyOtp({email,token:link.data.properties.email_otp,type:'email'});assert.ifError(verified.error);
 assert.ifError((await svc.from('profiles').insert({id:userId,name:'Temporary controls QA',role:'player'})).error);
 const draft=await fetch('http://localhost:3003/api/matches',{method:'POST'}).then(r=>r.json());matchId=draft.id;assert.ok(matchId);
 assert.ifError((await svc.from('matches').update({owner_id:userId,status:'published',draft_token:null}).eq('id',matchId)).error);
 let row=await call({kind:'set_server',team:'b',player:1});assert.equal(row.state.servingPlayer,3);
 await call({kind:'start_clock'});row=await call({kind:'point_for',team:'a'});assert.equal(row.state.currentGame.a,15);

 const beforeEdit=structuredClone(row);
 const edit=await fetch(`http://localhost:3003/api/matches/${matchId}/design`,{method:'PATCH',headers:{'content-type':'application/json',cookie:[...jar].map(([n,v])=>`${n}=${v}`).join('; ')},body:JSON.stringify({template:'tour-fip',accent:'#ff95c7',tournamentName:'Edited integration board',position:'bottom-right',scale:1.1,showTimer:true})});
 assert.equal(edit.status,200);row=(await edit.json()).row;
 assert.deepEqual(row.state,beforeEdit.state);assert.deepEqual(row.overlay.clock,beforeEdit.overlay.clock);assert.deepEqual(row.overlay.scoreHistory,beforeEdit.overlay.scoreHistory);assert.equal(row.overlay.template,'tour-fip');
 console.log('PASS: editing saved design preserves live points, clock and undo history.');
 row=await call({kind:'finish_match'});assert.equal(row.status,'finished');assert.equal(row.overlay.clock.runningSince,null);
 row=await call({kind:'reset'});assert.equal(row.status,'published');assert.equal(row.state.phase,'playing');assert.equal(row.state.currentGame.a,0);assert.equal(row.started_at,null);assert.equal(row.overlay.scoreHistory.length,0);
 assert.ifError((await svc.from('matches').update({status:'finished',state:{...row.state,phase:'finished',winner:'a',endReason:'completed',sets:[{a:6,b:0},{a:6,b:0}]}}).eq('id',matchId)).error);
 row=await call({kind:'reset'});assert.equal(row.state.phase,'playing');assert.equal(row.state.winner,null);assert.deepEqual(row.state.sets,[{a:0,b:0}]);
 await call({kind:'start_clock'});row=await call({kind:'point_for',team:'b'});assert.equal(row.state.currentGame.b,15);
 console.log('PASS: authenticated server selection, scoring, end, manual/natural finish reset and resumed scoring persist in the database.');
}finally{
 if(matchId)assert.ifError((await svc.from('matches').delete().eq('id',matchId)).error);
 if(userId)assert.ifError((await svc.auth.admin.deleteUser(userId)).error);
 console.log('Temporary match and user removed.');
}
