'use client';
import {useState,useEffect,useRef} from 'react';
import {CATS} from '@/lib/kb';
import {answer,similar,match,toks,ALL,learn,best,wiki,THRESH,guidesOf} from '@/lib/engine';
import {companion,moodReply,checkin,celebrate,boost,MOODS} from '@/lib/companion';
import {avatar,bars,columns,groupedColumns} from '@/lib/visual';
import {rangeOf,summarize,buckets,isStillOpen} from '@/lib/report';
import {pickSamples,sampleTicket,resolutionOf} from '@/lib/samples';
import {SecurityCard,useLock} from '@/components/Lock';
import FormDialog from '@/components/FormDialog';
import Breathe from '@/components/Breathe';
import UpdateDialog from '@/components/UpdateDialog';
import {useUpdate} from '@/components/Reg';
import {EN,DICT,LANGS,makeT,langInfo} from '@/lib/i18n';
import * as TR from '@/lib/translate';
import {encrypt,decrypt,deliver,stamp,EMAIL} from '@/lib/backup';

const KEY='xie.next.v1',DYN='xie.i18n.v1',SCHEMA=2; // never rename KEY: it holds every user's data across updates
const D={ui:{theme:'',name:'XIE',userName:'',helpline:'',ch:'robot',col:'#2fbf9f',shell:'#2b2626',accc:'',acc:'glasses',talk:true,auto:false,gender:'female',rate:1,pitch:1,voice:'',uiLang:'en',onlinePub:true,onlinePriv:false,simple:true,company:'My Company',setup:'',email:''},tickets:[],fixes:[],chat:[],learn:{},fb:{},moods:[],day:'',lastBackup:0,v:SCHEMA};
const TABS=[['help','💬'],['tickets','🎫'],['reports','📊'],['know','📚'],['set','⚙️']];
const COLS=['#2fbf9f','#7c6cf0','#ffb199','#ff8fb1','#6cb6ff','#f6c344','#9ad45f','#b7c0d4'],SHELLS=['#2b2626','#1f2d4d','#4a3b6b','#6b3b3b','#2f6b57','#8a5a2b','#3b3b3b','#e8e2d6'];
const MOODE={happy:'😄',tired:'😩',overwhelmed:'😰',sad:'😢',angry:'😤'},MOODT={happy:'mHappy',tired:'mTired',overwhelmed:'mStress',sad:'mSad',angry:'mAngry'};
const stCls={open:'text-bad',progress:'text-amber-500',done:'text-ok'},stKey={open:'fOpen',progress:'fProg',done:'fDone'};
const ymd=d=>{d=new Date(d);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const lt=d=>{d=new Date(d);return ymd(d)+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const tomorrow9=()=>{const d=new Date();d.setDate(d.getDate()+1);d.setHours(9,0,0,0);return lt(d)};
const arr=a=>Array.isArray(a)?a.filter(Boolean):[],obj=o=>o&&typeof o==='object'&&!Array.isArray(o)?o:{};
const clean=d=>({...D,...d,ui:{...D.ui,...obj(d.ui)},tickets:arr(d.tickets),fixes:arr(d.fixes),chat:arr(d.chat),moods:arr(d.moods),learn:obj(d.learn),fb:obj(d.fb),lastBackup:Number(d.lastBackup)||0,v:SCHEMA});
const Svg=({h,cls})=><span className={cls} dangerouslySetInnerHTML={{__html:h}}/>;
const dl=(text,name)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;a.click()};

export default function XieApp(){
 const [S,setS]=useState(D),[ready,setReady]=useState(false),[tab,setTab]=useState('help'),[dyn,setDyn]=useState({});
 const [tf,setTf]=useState('all'),[tq,setTq]=useState(''),[kq,setKq]=useState(''),[rp,setRp]=useState('week'),[rd,setRd]=useState(ymd(new Date()));
 const [form,setForm]=useState(null),[online,setOnline]=useState(true),[inp,setInp]=useState(''),[listening,setListening]=useState(false),[busy,setBusy]=useState(false),[voices,setVoices]=useState([]),[inst,setInst]=useState(null),[pack,setPack]=useState({st:'unknown',pct:0}),[breathe,setBreathe]=useState(false),[store,setStore]=useState(0),[build,setBuild]=useState(''),[later,setLater]=useState(false),[chk,setChk]=useState(''),[trProg,setTrProg]=useState(0),[selCat,setSelCat]=useState(''),[catTitles,setCatTitles]=useState({});
 const lock=useLock(),up=useUpdate(),rec=useRef(null),end=useRef(null),inpRef=useRef(''),u=S.ui,L=langInfo(u.uiLang),t=makeT(u.uiLang,dyn),bcp=L.b;
 inpRef.current=inp;
 const upd=fn=>setS(p=>{const n=structuredClone(p);fn(n);return n});
 const T=s=>u.uiLang==='en'?s:TR.tr(s,'en',L.tc);
 const Tn=async s=>{if(u.uiLang==='en')return s;const nm=(u.userName||'').trim();if(nm.length<2)return T(s);const o=await T(s.split(nm).join('XQNAMEQX'));return o.split('XQNAMEQX').join(nm)}; // the user's name is never sent to a translation service
 const dstr=d=>new Date(d).toLocaleString(bcp,{dateStyle:'medium',timeStyle:'short'});
 const ctx=()=>{const td=ymd(new Date());return{name:u.userName,hour:new Date().getHours(),done:S.tickets.filter(k=>k.status==='done'&&!k.sample&&k.done&&ymd(k.done)===td).length,open:S.tickets.filter(k=>k.status!=='done').length,lonely:S.moods.filter(m=>m.m==='lonely'&&Date.now()-m.d<3*864e5).length,rnd:Math.random}};
 /* ---- load / save / environment ---- */
 useEffect(()=>{try{const raw=localStorage.getItem(KEY),d=JSON.parse(raw);if(d){if((d.v||1)<SCHEMA)try{localStorage.setItem('xie.snapshot.v'+(d.v||1),raw)}catch(e){}setS(clean(d))}}catch(e){}try{setDyn(JSON.parse(localStorage.getItem(DYN))||{})}catch(e){}setReady(true);
  navigator.storage?.persist?.();const lv=()=>setVoices(speechSynthesis.getVoices());if('speechSynthesis'in window){lv();speechSynthesis.onvoiceschanged=lv}
  setOnline(navigator.onLine);const on=()=>setOnline(true),off=()=>setOnline(false),bi=e=>{e.preventDefault();setInst(e)};addEventListener('online',on);addEventListener('offline',off);addEventListener('beforeinstallprompt',bi);
  return()=>{removeEventListener('online',on);removeEventListener('offline',off);removeEventListener('beforeinstallprompt',bi)}},[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){alert(t('storeFull'))}
  const th=u.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',th==='dark');
  navigator.storage?.estimate?.().then(e=>setStore(Math.round((e.usage||0)/1024))).catch(()=>{})},[S,ready]);
 useEffect(()=>{if(ready&&lock.has&&!lock.rk&&EMAIL.test(u.email||''))lock.newRecovery()},[ready,lock.has,lock.rk,u.email]);
 useEffect(()=>{if(!ready)return;fetch('/version.json',{cache:'no-store'}).then(r=>r.json()).then(j=>{setBuild(j.v);const old=localStorage.getItem('xie.build');if(old&&old!==j.v)upd(n=>{n.chat.push({t:'✅ '+t('updDone')})});localStorage.setItem('xie.build',j.v)}).catch(()=>{})},[ready]);
 useEffect(()=>{if(ready)try{localStorage.setItem(DYN,JSON.stringify(dyn))}catch(e){}},[dyn,ready]);
 useEffect(()=>{document.documentElement.lang=L.c;document.documentElement.dir=L.rtl?'rtl':'ltr'},[u.uiLang]);
 useEffect(()=>{end.current?.scrollIntoView({block:'end'})},[S.chat.length,tab]);
 /* daily check-in from XIE */
 useEffect(()=>{if(!ready)return;const td=ymd(new Date());if(S.day===td)return;let off=false;(async()=>{const c=ctx(),x=await Tn(checkin(c));if(!off)upd(n=>{n.day=td;n.chat.push({t:x})})})();return()=>{off=true}},[ready]);
 /* on-device translation pack status, and translating missing UI words */
 useEffect(()=>{let c=false;(async()=>{if(u.uiLang==='en')return setPack({st:'native',pct:0});if(!TR.supported())return setPack({st:'unsupported',pct:0});
  const a=await TR.avail('en',L.tc),b=await TR.avail(L.tc,'en');if(!c)setPack({st:a==='available'&&b==='available'?'available':(a==='unavailable'||b==='unavailable')?'unavailable':'downloadable',pct:0})})();return()=>{c=true}},[u.uiLang]);
 useEffect(()=>{setCatTitles({})},[u.uiLang]);
 useEffect(()=>{if(!selCat||u.uiLang==='en')return;let c=false;(async()=>{for(const g of guidesOf(selCat)){if(c)return;const x=await T(g);if(x&&x!==g)setCatTitles(m=>({...m,[g]:x}))}})();return()=>{c=true}},[selCat,u.uiLang]);
 useEffect(()=>{TR.configure({pub:u.onlinePub!==false,priv:!!u.onlinePriv})},[u.onlinePub,u.onlinePriv]);
 useEffect(()=>{if(!ready||u.uiLang==='en')return;const canWeb=online&&u.onlinePub!==false;if(pack.st!=='available'&&!canWeb)return;const have=obj(dyn[u.uiLang]),miss=Object.keys(EN).filter(k=>!(DICT[u.uiLang]||{})[k]&&!have[k]);if(!miss.length)return;let c=false;
  (async()=>{let done=0;for(let i=0;i<miss.length&&!c;i+=4){const part=miss.slice(i,i+4),r=await Promise.all(part.map(k=>TR.tr(EN[k],'en',L.tc))),out={};part.forEach((k,j)=>{if(r[j]&&r[j]!==EN[k])out[k]=r[j]});done+=part.length;setTrProg(Math.round(100*done/miss.length));if(Object.keys(out).length)setDyn(d=>({...d,[u.uiLang]:{...obj(d[u.uiLang]),...out}}))}setTrProg(0)})();return()=>{c=true;setTrProg(0)}},[ready,pack.st,u.uiLang,online,u.onlinePub]);
 /* ---- speech ---- */
 const pick=()=>{if(u.voice){const f=voices.find(x=>x.name===u.voice);if(f)return f}const lc=bcp.slice(0,2).toLowerCase(),p=voices.filter(x=>x.lang.toLowerCase().startsWith(lc));if(!p.length)return null;
  const fem=/female|zira|samantha|susan|aria|jenny|karen|moira|tessa|victoria|hazel|woman|google .* female/i,mal=/\bmale\b|david|mark|alex|daniel|george|james|guy|fred|ryan|man\b/i;return p.find(x=>(u.gender==='female'?fem:mal).test(x.name))||p[0]};
 const say=tx=>{if(!u.talk||!('speechSynthesis'in window)||!tx)return;speechSynthesis.cancel();const m=new SpeechSynthesisUtterance(tx.replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F•]/gu,'').slice(0,900)),v=pick();if(v){m.voice=v;m.lang=v.lang}else m.lang=bcp;m.rate=u.rate;m.pitch=u.pitch*(u.gender==='male'&&!u.voice?.9:1);speechSynthesis.speak(m)};
 const hasVoice=voices.length===0||voices.some(x=>x.lang.toLowerCase().startsWith(bcp.slice(0,2).toLowerCase()));
 const listen=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return alert(t('noMic'));if(listening){rec.current?.stop();return}
  const r=new SR();rec.current=r;r.lang=bcp;r.interimResults=true;r.onstart=()=>setListening(true);r.onresult=e=>{const v=[...e.results].map(x=>x[0].transcript).join(' ');inpRef.current=v;setInp(v)};
  r.onend=()=>{setListening(false);if(u.auto&&inpRef.current.trim())send(inpRef.current)};r.onerror=e=>{setListening(false);alert(e.error==='not-allowed'?t('micDenied'):t('micOffline'))};try{r.start()}catch(e){}};
 /* ---- translate in/out ---- */
 const toEn=async tx=>{if(TR.looksEnglish(tx))return tx;const d=(await TR.detect(tx))||TR.guess(tx)||u.uiLang,sc=d.split('-')[0];if(sc==='en')return tx;return TR.tr(tx,sc==='fil'?'tl':sc,'en',{priv:true})};
 const compose=async r=>{const nm=u.name,a=ALL.length;
  if(r.k){const x=t(r.k,{n:nm,a});return{t:x,say:x.split('\n')[0]}}
  if(r.gloss){const[a1,b1]=await Promise.all([T(r.gloss.name),T(r.gloss.def)]);return{t:`📘 ${a1}\n\n${b1}`,say:b1}}
  const g=r.guide,all=await Promise.all([g.title,g.cause,g.needs,g.escalate,...g.steps,...g.alts].map(T)),[ti,ca,ne,es,...rest]=all,st=rest.slice(0,g.steps.length),al=rest.slice(g.steps.length);
  let s=(g.strong?`⭐ ${t('strong')}\n\n`:'')+`🔎 ${t('lIssue')}: ${ti}\n\n💡 ${t('lCause')}: ${ca}\n\n🧰 ${t('lNeed')}: ${ne}\n\n✅ ${t('lSteps')}:\n`+st.map((x,i)=>`${i+1}. ${x}`).join('\n');
  if(g.hard)s+='\n➕ '+t('lHard',{n:g.hard});s+=`\n\n⚠️ ${t('lEsc')}: ${es}`;if(al.length)s+=`\n\n🔁 ${t('lAlso')}: ${al.join('; ')}`;s+='\n\n'+(g.tech?t('doc'):t('easy'));
  if(u.setup)s+=`\n\n🏢 ${u.company}: ${u.setup.slice(0,140)}`;return{t:s,say:`${ti}. ${st.join('. ')}`}};
 /* ---- chat ---- */
 const send=async(raw=inp)=>{const tx=raw.trim();if(!tx||busy)return;setBusy(true);setInp('');
  try{const en=await toEn(tx),c=ctx(),cp=companion(en,c);
   if(cp&&cp.kind==='crisis'){const out=t('crisis',{c:u.helpline?'\n\n📞 '+u.helpline:''});upd(n=>{n.chat.push({me:1,t:tx},{t:out,crisis:1});n.moods.push({d:Date.now(),m:'low'})});say(out);return}
   const r=answer(en,S,{cat:selCat||undefined});let out,sy,ticket=false,meta={};
   if(cp&&(cp.solo||!r.guide)){out=await Tn(cp.text);sy=out}
   else{const x=await compose(r);out=x.t;sy=x.say;ticket=!!r.ticket;meta={sim:r.sim,entry:r.entry,low:r.low};if(cp?.preface)out=(await T(cp.preface))+'\n\n'+out}
   if(r.outside&&r.guide)out=t('offCat',{c:t('c_'+r.cat)})+'\n\n'+out;
   if(ticket)out+='\n\n🎫 '+t('tkSaved');
   upd(n=>{n.chat.push({me:1,t:tx},{t:out,q:en,...meta});if(ticket)n.tickets.unshift({id:Date.now().toString(36),text:tx,en,cat:r.cat,entry:r.entry,status:'open',created:Date.now()});
    if(cp?.mood)n.moods.push({d:Date.now(),m:cp.mood});if(cp?.setName)n.ui.userName=cp.setName;n.moods=n.moods.slice(-120)});
   say(sy);if(cp?.action==='breathe')setBreathe(true);
   if(!cp&&r.low&&navigator.onLine)wiki(en).then(l=>l.length&&upd(n=>{n.chat.push({t:'🌐 '+t('wikiHead')+':\n'+l.map(i=>'• '+i.title+': '+i.snip.slice(0,160)+'\n  '+i.url).join('\n')})})).catch(()=>{})
  }finally{setBusy(false)}};
 const pickGuide=async title=>{if(busy)return;setBusy(true);try{const r=answer('',S,{entry:title}),c=await compose(r),shown=catTitles[title]||title;upd(n=>{n.chat.push({me:1,t:shown},{t:c.t+'\n\n🎫 '+t('tkSaved'),sim:r.sim,entry:r.entry,q:title});n.tickets.unshift({id:Date.now().toString(36),text:shown,en:title,cat:r.cat,entry:r.entry,status:'open',created:Date.now()})});say(c.say);setSelCat('')}finally{setBusy(false)}};
 const moodTap=async m=>{const c=ctx(),x=await Tn(moodReply(m,c).text);upd(n=>{n.chat.push({me:1,t:MOODE[m]+' '+t(MOODT[m])},{t:x});n.moods.push({d:Date.now(),m});n.moods=n.moods.slice(-120)});say(x)};
 const boostTap=async()=>{const x=await Tn(boost(ctx()));upd(n=>{n.chat.push({t:x})});say(x)};
 const rate=(i,v)=>upd(n=>{const m=n.chat[i];if(!m||m.rated)return;m.rated=v;if(!m.entry)return;n.fb[m.entry]=(n.fb[m.entry]||0)+v;if(v>0)learn(n,m.entry,m.q)});
 /* ---- tickets ---- */
 const catOpts=()=>CATS.map(c=>[c[0],c[1]+' '+t('c_'+c[0])]);
 const newT=()=>setForm({title:t('fNewTitle'),saveLabel:t('fNewBtn'),hint:t('fNewHint'),fields:[{k:'text',label:t('issue'),type:'area',req:1,rows:4,ph:t('ph')},{k:'cat',label:t('cat'),type:'select',def:'',options:[['','✨ '+t('auto')],...catOpts()]}],
  onSave:async d=>{const en=await toEn(d.text),m=match(toks(en),S)[0],ok=m[0]>=THRESH;upd(n=>{n.tickets.unshift({id:Date.now().toString(36),text:d.text,en,cat:d.cat||(ok?m[1][0]:'other'),entry:ok?m[1][2]:undefined,status:'open',created:Date.now()})})}});
 const fin=id=>setForm({title:t('fDoneTitle'),saveLabel:t('fDoneBtn'),hint:t('fDoneHint'),fields:[{k:'resolution',label:t('whatFixed'),type:'area',rows:4,help:t('oneStep')}],
  onSave:async d=>{const c=ctx();c.done+=1;const x=await Tn(celebrate(c));upd(n=>{const k=n.tickets.find(y=>y.id===id);if(!k)return;k.status='done';k.done=Date.now();k.resolution=d.resolution||t('rResolved');const e=k.entry||best(k.en||k.text,n);if(e)learn(n,e,k.en||k.text);n.chat.push({t:x})});say(x)}});
 const prog=id=>{const k=S.tickets.find(y=>y.id===id);setForm({title:t('fProgTitle'),saveLabel:t('save'),hint:t('fProgHint'),fields:[{k:'reason',label:t('reason'),type:'area',req:1,rows:3,def:k.reason||''},{k:'sched',label:t('sched'),type:'datetime',req:1,def:k.sched||tomorrow9()}],
  onSave:d=>upd(n=>{const x=n.tickets.find(y=>y.id===id);x.status='progress';x.reason=d.reason;x.sched=d.sched;x.progAt=Date.now()})})};
 const reo=id=>upd(n=>{const k=n.tickets.find(x=>x.id===id);k.status='open';delete k.done});
 const del=id=>confirm(t('confirmDel'))&&upd(n=>{n.tickets=n.tickets.filter(x=>x.id!==id)});
 const ask=async k=>{const en=k.en||k.text,r=answer(en,S);if(!r.guide&&!r.k)return;const x=await compose(r);upd(n=>{n.chat.push({me:1,t:k.text},{t:x.t,sim:similar(en,k.id,S),entry:r.entry,q:en})});setTab('help')};
 /* ---- knowledge / backup ---- */
 const addFix=()=>setForm({title:t('fFixTitle'),saveLabel:t('fFixBtn'),hint:t('fFixHint'),fields:[{k:'cat',label:t('cat'),type:'select',def:'other',options:catOpts()},{k:'problem',label:t('problem'),req:1,ph:t('phProblem')},{k:'cause',label:t('cause'),help:t('optional'),ph:t('phCause')},{k:'needs',label:t('needs'),help:t('optional'),ph:t('phNeeds')},{k:'fix',label:t('fixSteps'),type:'area',req:1,rows:5,help:t('oneStep'),ph:t('phFix')}],
  onSave:d=>upd(n=>{n.fixes.unshift({problem:d.problem,cause:d.cause,needs:d.needs,fix:d.fix,cat:d.cat,date:Date.now()});const e=best(d.problem+' '+d.fix,n);if(e)learn(n,e,d.problem)})});
 const sampleCats=()=>CATS.map(c=>[c[0],c[1]+' '+t('c_'+c[0])+' ('+ALL.filter(e=>e[0]===c[0]).length+')']).filter(c=>ALL.some(e=>e[0]===c[0]));
 const addSamples=async(cat,days)=>{const pk=pickSamples(ALL,new Set(S.tickets.map(k=>k.id)),cat);
  if(!pk.length){upd(n=>{n.chat.push({t:'ℹ️ '+t('smpNone')})});setTf('done');setTab('tickets');return}
  const tr=u.uiLang!=='en'&&pack.st==='available',rows=[];
  for(let i=0;i<pk.length;i+=8)rows.push(...await Promise.all(pk.slice(i,i+8).map(async([e,idx])=>({e,idx,title:tr?await T(e[2]):e[2],res:tr?await T(resolutionOf(e)):resolutionOf(e)}))));
  upd(n=>{const now=Date.now();rows.forEach(({e,idx,title,res},j)=>n.tickets.push(sampleTicket(e,idx,j,now,days,title,res)));n.chat.push({t:'✅ '+t('smpDone',{n:rows.length})})});
  setTf('done');setTab('tickets')};
 const openSamples=()=>setForm({title:t('kLoad'),saveLabel:t('smpBtn'),hint:t('smpHint')+' '+t('smpNote'),fields:[{k:'cat',label:t('cat'),type:'select',def:'*',options:[['*',t('smpAll',{n:ALL.length})],...sampleCats()]},{k:'days',label:t('smpSpread'),type:'select',def:'30',options:[['7',t('smp7')],['30',t('smp30')]]}],onSave:d=>addSamples(d.cat,+d.days)});
 const exportFixes=()=>dl(JSON.stringify({xieFixes:S.fixes.concat(S.tickets.filter(k=>k.status==='done'&&!k.sample).map(k=>({problem:k.text,fix:k.resolution,date:k.done})))}),'xie-knowledge-'+ymd(new Date())+'.json');
 const importFixes=f=>f&&f.text().then(s=>{try{const d=JSON.parse(s).xieFixes;if(!Array.isArray(d))throw 0;upd(n=>{d.forEach(i=>{if(i.problem&&i.fix&&!n.fixes.some(y=>y.problem===i.problem&&y.fix===i.fix))n.fixes.push({problem:String(i.problem),cause:i.cause||'',fix:String(i.fix),date:i.date||Date.now()})})})}catch(e){alert(t('badBackup'))}});
 const backup=()=>{dl(JSON.stringify(S),'xie-backup-'+ymd(new Date())+'.json');upd(n=>{n.lastBackup=Date.now()})};
 const makeBackup=async mail=>{if(mail&&mail!==u.email)setUi({email:mail});const json=JSON.stringify(S),enc=!!lock.rk,r=await deliver(enc?await encrypt(json,lock.rk):json,(enc?'xie-pre-update-encrypted-':'xie-pre-update-backup-')+stamp()+'.json',mail,t('subjUpdate'),t('backupMail'));upd(n=>{n.lastBackup=Date.now()});return r};
 const checkUpd=async()=>{setChk('…');await up.check();setTimeout(()=>setChk(up.waiting?'':t('upLatest')),2500)};
 const restore=f=>f&&f.text().then(s=>{try{const d=JSON.parse(s);
  if(d.xieEnc){setForm({title:t('kRestore'),saveLabel:t('save'),hint:t('recKeyAsk'),fields:[{k:'rk',label:t('recKey'),req:1}],onSave:async x=>{try{const j=JSON.parse(await decrypt(s,x.rk));if(!j.tickets||!j.ui)throw 0;setS(clean(j))}catch(e){alert(t('badKey'))}}});return}
  if(!d.tickets||!d.ui)throw 0;setS(clean(d))}catch(e){alert(t('badBackup'))}});
 const eraseAll=async()=>{if(!confirm(t('eraseC')))return;
  try{const json=JSON.stringify(S),enc=!!lock.rk;await deliver(enc?await encrypt(json,lock.rk):json,(enc?'xie-emergency-backup-':'xie-backup-')+stamp()+'.json',EMAIL.test(u.email||'')?u.email:'',t('subjBackup'),t('backupMail'))}catch(e){if(!confirm(t('backupFail')))return}
  setTimeout(()=>{setS(D);setTab('help')},1800)};
 const getPack=async()=>{setPack({st:'busy',pct:0});const a=await TR.prepare('en',L.tc,p=>setPack({st:'busy',pct:Math.round(p/2)})),b=a&&await TR.prepare(L.tc,'en',p=>setPack({st:'busy',pct:50+Math.round(p/2)}));try{await TR.prepDetector()}catch(e){}setPack({st:a&&b?'available':'unavailable',pct:100})};
 const setUi=o=>upd(n=>{Object.assign(n.ui,o)});
 const seg=(v,o,f)=><div className="flex flex-wrap gap-2">{o.map(x=><button key={String(x[0])} className={'ghost '+(v===x[0]?'on':'')} onClick={()=>f(x[0])}>{x[1]}</button>)}</div>;
 const sw=(k,label,def,list)=><><label className="lbl">{label}</label><div className="flex flex-wrap items-center gap-2">{list.map(c=><button key={c} aria-label={c} onClick={()=>setUi({[k]:c})} className="h-9 w-9 rounded-full border border-line" style={{background:c,outline:(u[k]||def)===c?'3px solid var(--ink)':'none'}}/>)}<input type="color" aria-label={label} value={u[k]||def} onChange={e=>setUi({[k]:e.target.value})}/></div></>;
 const sel=(v,f,o)=><select className="inp" value={v} onChange={e=>f(e.target.value)}>{o.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select>;
 const due=S.tickets.filter(k=>k.status==='progress'&&k.sched&&new Date(k.sched)<=new Date()).length;
 /* ---- views ---- */
 const vHelp=<>
  <div className="text-center"><Svg h={avatar(S.chat.length>2?64:120,u)} cls={'inline-block '+(S.chat.length>2?'':'float')}/><h2 className="text-xl font-extrabold">{t('hi',{n:u.name})}</h2><p className="text-sm text-mut">{t('sub')}</p><p className="mt-1 text-xs text-mut">{t('stats',{a:ALL.length,b:S.tickets.filter(k=>k.status==='done').length})}</p>
   <div className="my-2 flex flex-wrap justify-center gap-1.5">{CATS.map(c=><button key={c[0]} aria-pressed={selCat===c[0]} className={'ghost '+(selCat===c[0]?'on':'')} onClick={()=>setSelCat(selCat===c[0]?'':c[0])}>{c[1]} {t('c_'+c[0])}</button>)}</div>
   {selCat&&<div className="mx-auto my-2 max-w-2xl rounded-3xl border border-line bg-card p-3 text-start shadow-sm"><div className="flex items-center gap-2"><b className="text-sm">{CATS.find(c=>c[0]===selCat)[1]} {t('catPick',{c:t('c_'+selCat)})}</b><button className="ghost ms-auto whitespace-nowrap" onClick={()=>setSelCat('')}>✕ {t('catClear')}</button></div>
    <div className="mt-2 max-h-56 overflow-auto">{guidesOf(selCat).map(g=><button key={g} className="mb-1 block w-full rounded-xl border border-line px-3 py-2 text-start text-sm hover:bg-indigo-500/10" onClick={()=>pickGuide(g)}>{catTitles[g]||g}</button>)}</div></div>}
   <div className="mx-auto my-3 max-w-xl rounded-3xl border border-line bg-card p-3 shadow-sm"><p className="mb-2 text-sm font-bold">{t('feel')}</p>
    <div className="flex flex-wrap justify-center gap-2">{MOODS.map(m=><button key={m} className="ghost" onClick={()=>moodTap(m)}>{MOODE[m]} {t(MOODT[m])}</button>)}<button className="ghost" onClick={()=>setBreathe(true)}>🫶 {t('breakBtn')}</button><button className="ghost" onClick={boostTap}>✨ {t('boostBtn')}</button></div>
    {S.moods.length>0&&<p className="mt-2 text-lg" aria-label={t('moodWeek')}>{S.moods.filter(m=>Date.now()-m.d<7*864e5&&MOODE[m.m]).slice(-12).map(m=>MOODE[m.m]).join(' ')}</p>}</div></div>
  {S.chat.map((m,i)=>[m,i]).slice(-40).map(([m,i])=>m.me?<div key={i} className="msg ms-auto rounded-ee-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow">{m.t}</div>:
   <div key={i} className="flex items-end gap-2"><Svg h={avatar(34,u)} cls="shrink-0"/><div className={'msg rounded-es-md border bg-card shadow-sm '+(m.crisis?'border-bad':'border-line')}>{m.t}
   {m.sim?.length>0&&<div className="mt-2 border-t border-line pt-2"><b>📎 {t('lSolved')}:</b>{m.sim.map((s,j)=><p key={j} className="mt-1 rounded-lg bg-bg p-2 text-sm"><i>{s.h||s.t.slice(0,60)}</i><br/>{(s.r||'').slice(0,220)}</p>)}</div>}
   {(m.entry||m.low)&&<div className="mt-2 flex flex-wrap items-center gap-2 text-sm">{m.entry&&(m.rated?<span className="text-mut">{m.rated>0?t('thUp'):t('thDown')}</span>:<><span className="text-mut">{t('didHelp')}</span><button className="ghost" onClick={()=>rate(i,1)}>👍</button><button className="ghost" onClick={()=>rate(i,-1)}>👎</button></>)}
    {m.low&&online&&m.q&&<a className="ghost" target="_blank" rel="noreferrer" href={'https://www.google.com/search?q='+encodeURIComponent(m.q+' fix')}>🌐 {t('web')}</a>}</div>}</div></div>)}
  {busy&&<div className="flex items-end gap-2"><Svg h={avatar(34,u)} cls="shrink-0"/><div className="msg border border-line bg-card text-mut">…</div></div>}
  <div ref={end}/>
  <div className="sticky bottom-0 -mx-1 flex gap-2 bg-bg px-1 py-2 backdrop-blur"><textarea className="inp h-12 resize-none" maxLength={1500} value={inp} placeholder={t('ph')} aria-label={t('ph')} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}/>
   <button className="ghost" onClick={listen} aria-label={t('speak')}>{listening?'⏹ '+t('listening'):'🎤'}</button><button className="btn" disabled={busy} onClick={()=>send()}>{t('send')}</button></div>
  <button className="ghost" onClick={()=>upd(n=>{n.chat=[]})}>{t('clear')}</button></>;
 const TL=S.tickets.filter(k=>(tf==='all'||k.status===tf)&&(!tq||((k.text||'')+(k.resolution||'')+(k.reason||'')+k.cat).toLowerCase().includes(tq.toLowerCase())));
 const vTickets=<><h2 className="text-xl font-extrabold">{t('tickets')}</h2><p className="text-sm text-mut">{t('tSub')}</p>
  {due>0&&<p className="my-2 rounded-2xl border border-amber-400 bg-amber-400/10 p-2 text-sm font-bold" role="status">⏰ {t('due',{n:due})}</p>}
  <div className="flex flex-wrap gap-2">{[['all','fAll'],['open','fOpen'],['progress','fProg'],['done','fDone']].map(f=><button key={f[0]} className={'ghost '+(tf===f[0]?'on':'')} onClick={()=>setTf(f[0])}>{t(f[1])}</button>)}<button className="ghost" onClick={newT}>{t('newT')}</button></div>
  <input className="inp mt-2" placeholder={t('searchT')} aria-label={t('searchT')} value={tq} onChange={e=>setTq(e.target.value)}/>
  <div className="md:grid md:grid-cols-2 md:gap-x-3">{TL.map(k=>{const late=k.status==='progress'&&k.sched&&new Date(k.sched)<=new Date();return <div key={k.id} className="card"><div className="flex flex-wrap items-center gap-2"><b className={stCls[k.status]}>{k.status==='done'?'✔':k.status==='progress'?'⏳':'●'} {k.status==='open'&&isStillOpen(k)?t('rOpenS'):t(stKey[k.status])}</b><span className="rounded-full border border-line px-2 text-xs">{t('c_'+k.cat)}</span>{k.sample&&<span className="text-xs text-mut">{t('sample')}</span>}<span className="ms-auto text-xs text-mut">{dstr(k.created)}</span></div>
   <p className="my-1">{k.text}</p>
   {k.status==='progress'&&<p className="text-sm"><b>{t('reason')}:</b> {k.reason}<br/><b>{t('sched')}:</b> <span className={late?'font-bold text-bad':''}>{dstr(k.sched)}{late?' • '+t('overdue'):''}</span></p>}
   {k.resolution&&<p className="text-sm text-mut"><b>{t('resol')}:</b> {k.resolution}<br/>{t('finished')} {dstr(k.done)}</p>}
   <div className="mt-2 flex flex-wrap gap-2">{k.status!=='done'&&<button className="btn" onClick={()=>fin(k.id)}>{t('bDone')}</button>}{k.status==='open'&&<button className="ghost" onClick={()=>prog(k.id)}>⏳ {t('bProg')}</button>}{k.status==='progress'&&<><button className="ghost" onClick={()=>prog(k.id)}>📅 {t('bUpd')}</button><button className="ghost" onClick={()=>reo(k.id)}>{t('bReopen')}</button></>}{k.status==='done'&&<button className="ghost" onClick={()=>reo(k.id)}>{t('bReopen')}</button>}<button className="ghost" onClick={()=>ask(k)}>{t('bAsk')}</button><button className="ghost text-bad" onClick={()=>del(k.id)}>{t('bDel')}</button></div></div>})}</div>
  {!TL.length&&<p className="text-mut">{t('noT')}</p>}</>;
 const PILL={open:['#fee2e2','#991b1b','#ef4444'],progress:['#fef3c7','#92400e','#f59e0b'],done:['#d1fae5','#065f46','#10b981']};
 const pill=(k,label)=><span className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold" style={{background:PILL[k][0],color:PILL[k][1],border:'1px solid '+PILL[k][2]}}>{label||t(stKey[k])}</span>;
 const vReports=()=>{const[a,b]=rangeOf(rp,rd),R=summarize(S.tickets,a,b),op=R.opened,cl=R.resolved,pg=R.progress,pend=R.stillOpen,fresh=R.fresh,rate=R.rate;
  const cd=Object.entries(R.byCat).map(([k,v])=>[t('c_'+k),v]).sort((m,n)=>n[1]-m[1]);
  const P={day:t('rDaily'),week:t('rWeekly'),month:t('rMonthly')}[rp],last=new Date(b-864e5),CO={opened:'#6366f1',still:'#ef4444',progress:'#f59e0b',done:'#10b981'};
  const KP=[[op.length,t('rOpened'),CO.opened],[pend.length,t('rOpenS'),CO.still],[pg.length,t('rProg'),CO.progress],[cl.length,t('rResolved'),CO.done],[rate+'%',t('rRate'),'#8b5cf6']];
  const SER=[{name:t('rOpened'),color:CO.opened},{name:t('rOpenS'),color:CO.still},{name:t('rProg'),color:CO.progress},{name:t('rResolved'),color:CO.done}],BK=buckets(rp,a,b,S.tickets,Date.now(),(d,o)=>d.toLocaleDateString(bcp,o));
  const statusData=[[t('rOpened'),op.length,CO.opened],[t('rOpenS'),pend.length,CO.still],[t('rProg'),pg.length,CO.progress],[t('rResolved'),cl.length,CO.done]];
  const sec=(c,title,body)=><div className="card" style={{borderInlineStart:'6px solid '+c}}><h3 className="font-bold">{title}</h3>{body}</div>;
  const tbl=(h,rows)=><div className="overflow-x-auto"><table className="w-full min-w-[460px] text-xs"><thead><tr style={{borderBottom:'2px solid #6b7280'}}>{h.map(v=><th key={v} className="py-1 pe-2 text-start">{v}</th>)}</tr></thead><tbody>{rows}</tbody></table></div>;
  const row=(k,cells,label)=><tr key={k.id} className="align-top" style={{borderTop:'1px solid #d1d5db'}}><td className="py-1 ps-2 pe-2" style={{borderInlineStart:'4px solid '+PILL[k.status][2]}}>{pill(k.status,label)}</td>{cells.map((v,i)=><td key={i} className="py-1 pe-2">{v}</td>)}</tr>;
  return <><div className="no-print"><h2 className="text-xl font-extrabold">{t('reports')}</h2><div className="flex flex-wrap items-center gap-2">{seg(rp,[['day',t('rDaily')],['week',t('rWeekly')],['month',t('rMonthly')]],setRp)}<input type="date" className="inp !w-auto" value={rd} onChange={e=>setRd(e.target.value||rd)}/><button className="btn" onClick={()=>window.print()}>📄 {t('rSave')}</button></div><p className="text-sm text-mut">{t('rHint')}</p></div>
  <div className="card" style={{borderTop:'6px solid #6366f1'}}><div className="flex items-center gap-3"><Svg h={avatar(48,u)} cls="shrink-0"/><div><h2 className="text-xl font-extrabold">{t('rTitleF',{p:P})}</h2><p className="text-sm text-mut">{u.company} • {rp==='day'?a.toLocaleDateString(bcp,{dateStyle:'long'}):a.toLocaleDateString(bcp,{dateStyle:'medium'})+' – '+last.toLocaleDateString(bcp,{dateStyle:'medium'})}<br/>{t('rPrep',{n:u.name})} • {t('rGen')} {dstr(Date.now())}</p></div></div>
   <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-5">{KP.map(v=><div key={v[1]} className="rounded-xl border border-line p-2" style={{borderTop:'5px solid '+v[2]}}><b className="block text-2xl" style={{color:v[2]}}>{v[0]}</b>{v[1]}</div>)}</div>
   <div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><b>{t('rKey')}:</b>{statusData.map(v=><span key={v[0]} className="inline-flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-sm" style={{background:v[2]}}/>{v[0]}</span>)}</div></div>
  <div className={'grid gap-x-3 '+(rp==='day'?'lg:grid-cols-2':'')}>{sec('#6366f1',t('rStatus'),<>{rp!=='day'&&<p className="mb-1 text-xs font-bold text-mut">{rp==='week'?t('rByDay'):t('rByWeek')}</p>}<Svg h={rp==='day'?columns(statusData):groupedColumns(BK,SER)}/><p className="mt-1 text-xs text-mut">{t('stNote')} {t('rCohort')}{fresh.length>0&&' '+t('rFresh',{n:fresh.length})}{R.older>0&&' '+t('rOlder',{n:R.older})}</p></>)}
  {sec('#06b6d4',t('rByCat'),cd.length?<Svg h={bars(cd)}/>:<p className="text-mut">{t('rNone')}</p>)}</div>
  {sec('#10b981',t('rWork'),cl.length?tbl([t('thStatus'),t('thDone'),t('issue'),t('resol')],cl.map(k=>row(k,[dstr(k.done),k.text,k.resolution]))):<p className="text-mut">{t('rNone')}</p>)}
  {sec('#f59e0b','⏳ '+t('rProgT'),pg.length?tbl([t('thStatus'),t('thCreated'),t('issue'),t('reason'),t('sched')],pg.map(k=>row(k,[dstr(k.created),k.text,k.reason,k.sched?dstr(k.sched):'']))):<p className="text-mut">{t('rNone')}</p>)}
  {sec('#ef4444',t('rOpenS'),pend.length?tbl([t('thStatus'),t('thCreated'),t('issue')],pend.map(k=>row(k,[dstr(k.created),k.text],t('rOpenS')))):<p className="text-mut">{t('rNone')}</p>)}
  <div className="card mt-8 flex gap-4 text-sm"><span className="flex-1">{t('rSign1')}: ____________________</span><span className="flex-1">{t('rSign2')}: ____________________</span></div></>};
 const FL=S.fixes.filter(f=>!kq||(f.problem+f.fix+(f.cause||'')).toLowerCase().includes(kq.toLowerCase()));
 const vKnow=<><h2 className="text-xl font-extrabold">{t('know')}</h2><p className="text-sm text-mut">{t('kSub',{c:u.company})}</p>
  <div className="card bg-gradient-to-r from-indigo-500/10 to-pink-400/10"><h3 className="font-bold">🌱 {t('kLearned')}</h3><div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm"><div><b className="block text-2xl">{S.tickets.filter(k=>k.status==='done'&&!k.sample).length}</b>{t('kT')}</div><div><b className="block text-2xl">{S.fixes.length}</b>{t('kF')}</div><div><b className="block text-2xl">{Object.values(S.learn).reduce((a,o)=>a+Object.keys(o).length,0)}</b>{t('kW')}</div></div><p className="mt-2 text-xs text-mut">{t('kNote')}</p></div>
  <div className="flex gap-2"><input className="inp" placeholder={t('kSearch')} aria-label={t('kSearch')} value={kq} onChange={e=>setKq(e.target.value)}/><button className="btn whitespace-nowrap" onClick={addFix}>{t('kAdd')}</button></div>
  <div className="md:grid md:grid-cols-2 md:gap-x-3">{FL.map((f,i)=><div key={i} className="card"><div className="flex flex-wrap items-center gap-2"><b>{f.problem}</b>{f.cat&&<span className="rounded-full border border-line px-2 text-xs">{t('c_'+f.cat)}</span>}</div>{f.needs&&<p className="text-sm text-mut"><b>{t('needs')}:</b> {f.needs}</p>}{f.cause&&<p className="text-sm text-mut"><b>{t('cause')}:</b> {f.cause}</p>}<p className="whitespace-pre-wrap"><b>{t('fixSteps')}:</b> {f.fix}</p><div className="flex text-xs text-mut"><span>{new Date(f.date).toLocaleDateString(bcp)}</span><button className="ms-auto text-bad" onClick={()=>confirm(t('confirmDelF'))&&upd(n=>{n.fixes=n.fixes.filter(x=>!(x.date===f.date&&x.problem===f.problem))})}>{t('del')}</button></div></div>)}</div>
  {!FL.length&&<p className="text-mut">{t('kNone')}</p>}
  <div className="card"><h3 className="font-bold">{t('kSamples')}</h3><p className="text-sm text-mut">{t('kSamplesTxt',{n:ALL.length})}</p><button className="ghost mt-2" onClick={openSamples}>{t('kLoad')}</button></div>
  <div className="flex flex-wrap gap-2 border-t border-line pt-3"><button className="ghost" onClick={exportFixes}>{t('kShare')}</button><label className="ghost cursor-pointer">{t('kImport')}<input type="file" accept=".json" hidden onChange={e=>importFixes(e.target.files[0])}/></label><button className="ghost" onClick={backup}>{t('kBackup')}</button><label className="ghost cursor-pointer">{t('kRestore')}<input type="file" accept=".json" hidden onChange={e=>restore(e.target.files[0])}/></label></div>
  <p className="mt-2 text-xs text-mut">{t('kMove')}<br/>{t('lastBackup')}: {S.lastBackup?dstr(S.lastBackup):t('noBackup')}</p></>;
 const vv=voices.filter(x=>x.lang.toLowerCase().startsWith(bcp.slice(0,2).toLowerCase()));
 const packMsg={available:t('packOk'),unsupported:t('packNo'),unavailable:t('packNo'),busy:t('packWork',{n:pack.pct})}[pack.st];
 const vSet=<><h2 className="text-xl font-extrabold">{t('set')}</h2><div className="lg:grid lg:grid-cols-2 lg:gap-x-3">
  <div className="card"><h3 className="font-bold">{t('sMake')}</h3><div className="text-center"><Svg h={avatar(110,u)}/></div>
   <label className="lbl">{t('name')}</label><input className="inp" maxLength={20} value={u.name} onChange={e=>setUi({name:e.target.value})}/>
   <label className="lbl">{t('character')}</label>{seg(u.ch,[['robot',t('chRobot')],['cat',t('chCat')],['bear',t('chBear')],['owl',t('chOwl')]],v=>setUi({ch:v}))}
   {sw('col',t('faceC'),'#2fbf9f',COLS)}{sw('shell',t('bodyC'),'#2b2626',SHELLS)}
   <label className="lbl">{t('accessory')}</label>{seg(u.acc,[['headset',t('headset')],['glasses',t('glasses')],['bow',t('bow')],['none',t('none')]],v=>setUi({acc:v}))}
   {u.acc!=='none'&&sw('accc',t('accC'),{headset:'#7c6cf0',bow:'#e8567a',glasses:'#1f2d4d'}[u.acc],COLS)}
   <div className="mt-3 flex gap-2"><button className="ghost" onClick={()=>{const r=a=>a[Math.floor(Math.random()*a.length)];setUi({col:r(COLS),shell:r(SHELLS),accc:r(COLS)})}}>🎲 {t('surprise')}</button><button className="ghost" onClick={()=>setUi({col:'#2fbf9f',shell:'#2b2626',accc:''})}>{t('resetC')}</button></div></div>
  <div><div className="card"><h3 className="font-bold">{t('language')}</h3><p className="text-sm text-mut">{t('langHelp')}</p>
   <select className="inp mt-2" value={u.uiLang} onChange={e=>setUi({uiLang:e.target.value,voice:''})}><optgroup label={t('builtIn')}>{LANGS.filter(l=>l.built).map(l=><option key={l.c} value={l.c}>{l.n}</option>)}</optgroup><optgroup label={t('onDevice')}>{LANGS.filter(l=>!l.built).map(l=><option key={l.c} value={l.c}>{l.n}</option>)}</optgroup></select>
   {u.uiLang!=='en'&&<div className="mt-3 rounded-2xl border border-line p-3"><b>{t('pack')}</b><p className="text-sm text-mut">{pack.st==='downloadable'?t('packT'):packMsg}</p>{pack.st==='downloadable'&&<button className="btn mt-2" onClick={getPack}>{t('packBtn')}</button>}{pack.st==='busy'&&<div className="mt-2 h-2 rounded-full bg-bg"><div className="h-2 rounded-full bg-acc" style={{width:pack.pct+'%'}}/></div>}</div>}<label className="lbl"><input type="checkbox" checked={u.onlinePub!==false} onChange={e=>setUi({onlinePub:e.target.checked})}/> {t('onlinePub')}</label><p className="text-xs text-mut">{t('onlinePubT')}</p>
   <label className="lbl"><input type="checkbox" checked={!!u.onlinePriv} onChange={e=>setUi({onlinePriv:e.target.checked})}/> {t('onlinePriv')}</label><p className="text-xs text-mut">{t('onlinePrivT')}</p>
  </div>
  <div className="card"><h3 className="font-bold">{t('sound')}</h3>{seg(u.simple,[[true,t('simple')],[false,t('tech')]],v=>setUi({simple:v}))}<p className="mt-2 text-sm text-mut">{u.simple?t('simpleD'):t('techD')}</p></div></div></div>
  <div className="lg:grid lg:grid-cols-2 lg:gap-x-3"><div className="card"><h3 className="font-bold">{t('voice')}</h3><p className="text-sm text-mut">{t('voiceT')}</p>{!hasVoice&&<p className="mt-1 text-sm font-bold text-amber-500">{t('noVoice')}</p>}
   <label className="lbl"><input type="checkbox" checked={u.talk} onChange={e=>setUi({talk:e.target.checked})}/> {t('talk',{n:u.name})}</label>
   <label className="lbl"><input type="checkbox" checked={u.auto} onChange={e=>setUi({auto:e.target.checked})}/> {t('autoSend')}</label>
   <label className="lbl">{t('vStyle')}</label>{seg(u.gender,[['female',t('female')],['male',t('male')]],v=>setUi({gender:v,voice:''}))}
   <label className="lbl">{t('specific')}</label><select className="inp" value={u.voice} onChange={e=>setUi({voice:e.target.value})}><option value="">{t('automatic')}</option>{vv.map(x=><option key={x.name}>{x.name}</option>)}</select>
   <label className="lbl">{t('speed')}: {u.rate}x</label><input type="range" className="w-full" min=".6" max="1.6" step=".1" value={u.rate} onChange={e=>setUi({rate:+e.target.value})}/>
   <label className="lbl">{t('pitch')}: {u.pitch}</label><input type="range" className="w-full" min=".6" max="1.6" step=".1" value={u.pitch} onChange={e=>setUi({pitch:+e.target.value})}/>
   <button className="btn mt-3" onClick={()=>say(t('hello',{n:u.name}))}>🔊 {t('test')}</button></div>
  <div><div className="card"><h3 className="font-bold">💛 {t('yourName')}</h3><input className="inp mt-1" maxLength={24} value={u.userName} onChange={e=>setUi({userName:e.target.value})}/>
   <label className="lbl">{t('helpline')}</label><input className="inp" maxLength={120} value={u.helpline} onChange={e=>setUi({helpline:e.target.value})}/><p className="mt-1 text-xs text-mut">{t('helplineHelp')}</p></div>
  <div className="card"><h3 className="font-bold">{t('company')}</h3><label className="lbl">{t('cname')}</label><input className="inp" value={u.company} onChange={e=>setUi({company:e.target.value})}/>
   <label className="lbl">{t('setup')}</label><textarea className="inp" rows={3} placeholder={t('setupPh')} value={u.setup} onChange={e=>setUi({setup:e.target.value})}/>
   <label className="lbl">{t('email')}</label><input className="inp" type="email" autoComplete="email" value={u.email} onChange={e=>setUi({email:e.target.value.trim()})}/><p className={'mt-1 text-xs '+(u.email&&!EMAIL.test(u.email)?'text-bad':'text-mut')}>{u.email&&!EMAIL.test(u.email)?t('emailBad'):t('emailHelp')}</p></div></div></div>
  <div className="lg:grid lg:grid-cols-2 lg:gap-x-3"><SecurityCard email={u.email}/>
  <div><div className="card"><h3 className="font-bold">{t('appearance')}</h3>{seg(u.theme,[['',t('themeAuto')],['light','☀️ '+t('light')],['dark','🌙 '+t('dark')]],v=>setUi({theme:v}))}</div>
  <div className="card"><h3 className="font-bold">{t('install')}</h3><p className="text-sm text-mut">{t('installT')}</p>{inst&&<button className="btn mt-2" onClick={()=>inst.prompt()}>{t('installBtn')}</button>}<p className="mt-3 text-xs text-mut">{t('store',{n:store})}<br/>{t('storeHelp')}{build&&<><br/>{t('ver')}: {build}</>}{store>3500&&<><br/><b className="text-bad">{t('storeWarn')}</b></>}</p><a className="ghost mt-2 inline-block" href="/manual.html" target="_blank" rel="noreferrer">📖 {t('manual')}</a> <button className="ghost mt-2" onClick={checkUpd}>🔄 {t('upCheck')}</button> {chk&&<span className="text-sm text-ok" role="status">{chk}</span>}</div>
  <div className="card border-bad"><h3 className="font-bold text-bad">{t('erase')}</h3><p className="text-sm text-mut">{t('eraseT')}</p><button className="ghost mt-2 text-bad" onClick={eraseAll}>{t('erase')}</button></div></div></div></>;
 const V={help:vHelp,tickets:vTickets,know:vKnow,set:vSet};
 return <div className="app-root flex h-dvh flex-col">
  <header className="no-print flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-400 px-3 py-2 text-white shadow-md sm:gap-3 sm:px-4"><Svg h={avatar(40,u)} cls="shrink-0 rounded-full bg-white/90 p-0.5"/><div className="min-w-0 leading-tight"><b className="block truncate">{t('assistant',{n:u.name})}</b><small className="block truncate text-xs opacity-90">{u.company}</small></div>
   <span className="ms-auto whitespace-nowrap rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">{online?'🟢 '+t('online'):'🔴 '+t('offline')}</span>
   <button className="rounded-full bg-white/20 px-3 py-1.5" title={t('theme')} aria-label={t('theme')} onClick={()=>setUi({theme:document.documentElement.classList.contains('dark')?'light':'dark'})}>🌓</button>
   {lock.has&&<button className="rounded-full bg-white/20 px-3 py-1.5" title={t('lockNow')} aria-label={t('lockNow')} onClick={lock.lockNow}>🔒</button>}</header>
  {trProg>0&&<div className="no-print bg-indigo-500/10 px-4 py-1 text-center text-xs" role="status">{t('trBusy',{n:trProg})}</div>}
  <div className="flex min-h-0 flex-1 flex-col md:flex-row-reverse rtl:md:flex-row">
   <main className="min-h-0 flex-1 overflow-auto p-3 sm:p-4"><div className="mx-auto w-full max-w-3xl lg:max-w-6xl">{tab==='reports'?vReports():V[tab]}</div></main>
   <nav className="no-print flex gap-1 border-t border-line bg-card p-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)] md:w-24 md:flex-col md:justify-start md:border-e md:border-t-0 md:p-2">{TABS.map(x=><button key={x[0]} onClick={()=>setTab(x[0])} aria-current={tab===x[0]?'page':undefined} className={'relative flex-1 rounded-2xl py-1.5 text-xs font-bold transition md:flex-none md:py-3 '+(tab===x[0]?'bg-indigo-500/15 text-acc':'text-mut')}><span className="block text-xl">{x[1]}</span>{t(x[0])}{x[0]==='tickets'&&due>0&&<span className="absolute end-3 top-1 h-2.5 w-2.5 rounded-full bg-bad"/>}</button>)}</nav></div>
  {form&&<FormDialog {...form} cancelLabel={t('cancel')} closeLabel={t('closeX')} reqMsg={t('req')} onClose={()=>setForm(null)}/>}
  {up.waiting&&!later&&<UpdateDialog t={t} name={u.name} email={u.email} onBackup={makeBackup} onApply={up.activate} onLater={()=>setLater(true)}/>}
  {breathe&&<Breathe t={t} onClose={()=>setBreathe(false)}/>}</div>}
