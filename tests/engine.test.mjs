import test from 'node:test';import assert from 'node:assert/strict';
import {answer,similar,learn,toks,ALL,match,best} from '../lib/engine.js';
import {EN,DICT} from '../lib/i18n.js';
import fs from 'node:fs';
const S=()=>({ui:{simple:true,company:'Acme',name:'XIE'},tickets:[],fixes:[],chat:[],learn:{},fb:{}});
const cases=[['i dont have internet on my pc how to fix it?','wifi'],['my printer says offline','printer'],['i forgot my password and account is locked','account'],['clicked a phishing link','security'],['outlook is not syncing','email'],['blue screen on boot','hardware'],['teams meeting no audio','meeting'],['backup job failed last night','backup'],['pritner is ofline','printer'],['wifi connected but no internet','wifi']];
for(const [q,c] of cases)test(q,()=>{const r=answer(q,S());assert.equal(r.cat,c,q+' -> '+r.cat);assert.ok(r.guide&&r.guide.steps.length>=2)});
test('kb size',()=>assert.ok(ALL.length>=40));
test('glossary offline',()=>assert.match(answer('what is dns?',S()).gloss.name,/DNS/));
test('asks for detail when unknown',()=>assert.equal(answer('something weird',S()).low,true));
test('similar tickets',()=>{const s=S();s.tickets.push({id:'1',text:'printer offline spooler',status:'done',done:1,resolution:'cleared spooler'});assert.equal(similar('printer offline again',null,s).length,1)});
test('learning changes ranking',()=>{const s=S();const q='zxqv blorp wumpus';assert.equal(answer(q,s).low,true);learn(s,'Printer offline or will not print',q);learn(s,'Printer offline or will not print',q);assert.equal(best(q,s),'Printer offline or will not print')});
test('all entries well formed',()=>ALL.forEach(e=>{assert.equal(e.length,7,e[2]);assert.ok(e[5].split('|').length>=3,e[2])}));

test('simple mode hides commands, technician shows them',()=>{const a=S(),b=S();b.ui.simple=false;const x=answer('wifi connected but no internet',a).guide,y=answer('wifi connected but no internet',b).guide;
 assert.ok(!x.steps.join(' ').includes('ipconfig'));assert.ok(y.steps.join(' ').includes('ipconfig'));assert.ok(x.steps.length<=5);assert.equal(x.tech,false);assert.equal(y.tech,true);assert.ok(x.hard>0)});
test('simple mode replaces jargon',()=>{const g=answer('vpn keeps disconnecting',S()).guide;assert.ok(!/\bVPN\b|\bMTU\b/.test(g.cause+g.title))});
test('i18n: dictionaries only use known keys and the same placeholders',()=>{const ph=s=>(s.match(/\{\w+\}/g)||[]).sort().join();
 for(const [l,d] of Object.entries(DICT)){for(const [k,v] of Object.entries(d)){assert.ok(k in EN,l+':'+k);assert.equal(ph(v),ph(EN[k]),l+':'+k)}}});
test('i18n: every t() key used in the UI exists in English',()=>{const keys=new Set();for(const f of ['components/XieApp.jsx','components/Lock.jsx']){const src=fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');for(const m of src.matchAll(/\bt\('([A-Za-z_0-9]+)'[,)]/g))keys.add(m[1])}
 for(const k of keys)assert.ok(k in EN,'missing EN key '+k)});
test('i18n: all category names are translated for built-in languages',()=>{for(const l of ['es','fil','fr','de','pt','zh'])for(const c of ['wifi','printer','slow','email','account','security','network','software','hardware','meeting','backup','other'])assert.ok(DICT[l]['c_'+c],l+c)});
import {companion,moodOf,isCrisis,checkin,celebrate,boost,moodReply} from '../lib/companion.js';
const C={name:'Mia',hour:15,done:2,lonely:0,rnd:()=>0};
test('companion: moods, negation, intents',()=>{assert.equal(moodOf('i am so tired today'),'tired');assert.equal(moodOf('i am not tired at all'),null);assert.equal(moodOf('so many tickets and a deadline'),'overwhelmed');
 assert.equal(companion('my printer is offline',C),null);assert.equal(companion('tell me a joke',C).solo,true);assert.equal(companion('my name is jose',C).setName,'Jose')});
test('companion: honest about being an AI',()=>assert.match(companion('are you a real person?',C).text,/AI assistant, not a human/));
test('companion: crisis wins over everything and is never treated as a ticket',()=>{for(const q of ['i want to die','I think about suicide','i might hurt myself','my printer is dead and i want to kill myself'])assert.equal(companion(q,C).kind,'crisis');assert.ok(isCrisis('no reason to live'));assert.ok(!isCrisis('kill the process'))});
test('companion: tired+tech message keeps a short preface for the guide',()=>{const c=companion('my printer is offline and i am exhausted',C);assert.equal(c.mood,'tired');assert.ok(c.preface)});
test('companion: loneliness replies encourage real people',()=>{assert.match(companion('i feel lonely',C).text,/friend|family|teammate|colleague|people/i);assert.match(companion('i feel lonely',{...C,lonely:3}).text,/trust|talk to someone/i)});
test('companion: check-in, boost and celebration use the name',()=>{assert.match(checkin(C),/Mia/);assert.match(boost(C),/Mia/);assert.match(celebrate(C),/Mia/);assert.ok(moodReply('tired',C).text.length>20)});
test('companion: answers differ between runs (variety)',()=>{const a=new Set();for(let i=0;i<20;i++)a.add(companion('tell me a joke',{...C,rnd:()=>i/20}).text);assert.ok(a.size>=4)});

test('windows update question finds the Windows Update guide',()=>assert.match(answer('windows update stuck at 30%',S()).guide.title,/Windows Update/i));
test('typo with swapped letters still matches',()=>assert.equal(answer('my pritner is ofline',S()).cat,'printer'));
const ML=[['mi impresora no imprime y aparece sin conexión','printer'],['mon imprimante ne fonctionne pas','printer'],['mein drucker druckt nicht','printer'],['minha impressora não imprime','printer'],['我的打印机脱机了','printer'],['olvidé mi contraseña y la cuenta está bloqueada','account'],['mon ordinateur est très lent','slow'],['mein computer ist sehr langsam','slow'],['忘记密码账号被锁定','account'],['no tengo internet en mi computadora','wifi']];
for(const [q,c] of ML)test('multilingual input: '+q,()=>{const r=answer(q,S());assert.equal(r.cat,c,q+' -> '+(r.cat||r.k))});
test('unrelated text is not forced into a guide',()=>{for(const q of ['what a lovely sunny day','my cat is sleeping on the sofa','blorp wumpus zxqv'])assert.equal(!!answer(q,S()).guide,false,q)});
