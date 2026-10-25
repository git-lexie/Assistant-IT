'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {avatar} from '@/lib/visual';
import {hash,newSalt,failDelay,MIN_LEN} from '@/lib/lockcrypto';
import {makeT} from '@/lib/i18n';
import {encrypt,deliver,rawData,stamp,newKey,EMAIL,DK,planForgot} from '@/lib/backup';
const LK='xie.lock.v1',FK='xie.lock.fail',DYN='xie.i18n.v1',ENV=process.env.NEXT_PUBLIC_XIE_ACTIVATION_CODE||'';
const Ctx=createContext({has:false,auto:0,rk:'',lockNow(){},setCode:async()=>{},removeCode(){},verify:async()=>false,setAuto(){},newRecovery:()=>'',showRecovery(){}});
export const useLock=()=>useContext(Ctx);
const jget=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const SVG=({h,cls})=><span className={cls} dangerouslySetInnerHTML={{__html:h}}/>;

export function PasswordInput({className='',showLabel='Show code',hideLabel='Hide code',...p}){const [show,setShow]=useState(false);
 const I={width:22,height:22,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true};
 return <div className="relative"><input {...p} type={show?'text':'password'} className={'inp pe-11 '+className}/>
  <button type="button" aria-label={show?hideLabel:showLabel} aria-pressed={show} title={show?hideLabel:showLabel} onMouseDown={e=>e.preventDefault()} onClick={()=>setShow(s=>!s)} className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-mut hover:text-ink">
   {show?<svg {...I}><path d="M17.94 17.94A10.9 10.9 0 0112 20C5 20 1 12 1 12a18.5 18.5 0 015.06-5.94M9.9 4.24A9.1 9.1 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/></svg>:<svg {...I}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div>}

function useT(){const [lang,setLang]=useState('en'),[dyn,setDyn]=useState({});
 useEffect(()=>{setLang((jget(DK,{}).ui||{}).uiLang||'en');setDyn(jget(DYN,{}))},[]);return makeT(lang,dyn)}

export function LockGate({children}){
 const [st,setSt]=useState('loading'),[cfg,setCfg]=useState(null),[code,setCode]=useState(''),[msg,setMsg]=useState(''),[wait,setWait]=useState(0),[fg,setFg]=useState(false),[working,setWorking]=useState(false),[showKey,setShowKey]=useState(''),[fgMail,setFgMail]=useState(''),[ui,setUi]=useState({col:'#2fbf9f',ch:'robot',acc:'glasses',name:'XIE'});
 const last=useRef(Date.now()),t=useT(),ok=typeof crypto!=='undefined'&&!!crypto.subtle;
 useEffect(()=>{const c=jget(LK,null),u=jget(DK,{}).ui||{};setUi(p=>({...p,...u}));
  const th=u.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',th==='dark');
  document.documentElement.dir=['ar','he','ur'].includes(u.uiLang)?'rtl':'ltr';
  setCfg(c);setSt(c&&c.hash?'locked':ENV?'activate':'open')},[]);
 useEffect(()=>{if(st!=='locked'&&st!=='activate')return;const i=setInterval(()=>setWait(Math.max(0,Math.ceil(((jget(FK,{}).until||0)-Date.now())/1000))),500);return()=>clearInterval(i)},[st]);
 useEffect(()=>{if(st!=='open'||!cfg?.hash||!cfg.auto)return;const ev=['pointerdown','keydown','touchstart'],bump=()=>{last.current=Date.now()};ev.forEach(e=>addEventListener(e,bump));
  const i=setInterval(()=>{if(Date.now()-last.current>cfg.auto*60000)setSt('locked')},5000);return()=>{ev.forEach(e=>removeEventListener(e,bump));clearInterval(i)}},[st,cfg]);
 const fail=()=>{const f=jget(FK,{n:0}),n=(f.n||0)+1,d=failDelay(n);localStorage.setItem(FK,JSON.stringify({n,until:d?Date.now()+d*1000:0}));return{n,d}};
 const save=c=>{localStorage.setItem(LK,JSON.stringify(c));setCfg(c)};
 const verify=async c=>{if((jget(FK,{}).until||0)>Date.now()||!cfg?.hash)return false;const good=(await hash(c,cfg.salt))===cfg.hash;if(good)localStorage.removeItem(FK);else fail();return good};
 const setCodeFn=async(c,auto=cfg?.auto||0)=>{const salt=newSalt();save({...(cfg||{}),salt,hash:await hash(c,salt),auto});localStorage.removeItem(FK)};
 const submit=async e=>{e?.preventDefault();setMsg('');if(!ok)return setMsg(t('lkHttps'));if((jget(FK,{}).until||0)>Date.now())return;
  if(st==='activate'){if(code===ENV){await setCodeFn(code,5);last.current=Date.now();setSt('open');setCode('')}else{const r=fail();setMsg(r.d?t('tooMany'):t('wrongAct'))}return}
  if(await verify(code)){last.current=Date.now();setCode('');setSt('open')}else setMsg(jget(FK,{n:0}).n>=5?t('tooMany'):t('wrongCode'))};
 const wipe=()=>{setTimeout(()=>{[LK,FK,DK,DYN].forEach(k=>localStorage.removeItem(k));location.reload()},1800)};
 const regMail=(jget(DK,{}).ui||{}).email||'',plan=planForgot(regMail,cfg?.rk);
 const doForgot=async()=>{setMsg('');if(plan.mode==='send'&&fgMail.trim().toLowerCase()!==regMail.toLowerCase())return setMsg(t('fgBad'));
  if(plan.mode==='erase'){if(!confirm(t('fgNoMail')))return;return wipe()}
  setWorking(true);
  try{let rk=cfg?.rk,body=t('backupMail');if(!rk){rk=newKey();body+='\n\n'+t('recKey')+': '+rk}
   await deliver(await encrypt(rawData(),rk),'xie-emergency-backup-'+stamp()+'.json',plan.mode==='send'?regMail:'',t('subjEmergency'),body)}
  catch(e){if(!confirm(t('backupFail'))){setWorking(false);return}}
  wipe()};
 const api={has:!!cfg?.hash,auto:cfg?.auto||0,rk:cfg?.rk||'',lockNow:()=>{setCode('');setFg(false);setSt('locked')},setCode:setCodeFn,verify,
  removeCode:()=>{localStorage.removeItem(LK);localStorage.removeItem(FK);setCfg(null)},setAuto:m=>cfg&&save({...cfg,auto:m}),newRecovery:()=>{const k=newKey();save({...cfg,rk:k});setShowKey(k);return k},showRecovery:()=>{if(cfg?.rk)setShowKey(cfg.rk)}};
 if(st==='loading')return null;
 if(st==='open')return <Ctx.Provider value={api}>{children}{showKey&&<RecoveryDialog k={showKey} t={t} onClose={()=>setShowKey('')}/>}</Ctx.Provider>;
 return <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-400 p-4">
  <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl">
   <SVG h={avatar(110,ui)} cls="inline-block float"/><h1 className="text-xl font-extrabold">{t('assistant',{n:ui.name})}</h1>
   <p className="mb-4 text-sm text-mut">{st==='activate'?t('lkAct'):t('lkTitle')}</p>
   <PasswordInput className="text-center text-lg tracking-widest" showLabel={t('showC')} hideLabel={t('hideC')} autoFocus autoComplete="off" placeholder={t('lkPh')} value={code} onChange={e=>setCode(e.target.value)} disabled={wait>0}/>
   {(msg||wait>0)&&<p className="mt-2 text-sm text-bad" role="alert">{wait>0?t('lockedFor',{n:wait}):msg}</p>}
   <button className="btn mt-4 w-full" disabled={!code||wait>0}>{st==='activate'?t('activate'):t('unlock')}</button>
   {st==='locked'&&!fg&&<button type="button" className="mt-3 text-xs text-mut underline" onClick={()=>setFg(true)}>{t('forgot')}</button>}
   {fg&&<div className="mt-4 rounded-2xl border border-line p-3 text-start text-sm"><p className="text-mut">{plan.mode==='send'?t('fgMail')+(plan.newKey?' '+t('fgNewKey'):''):plan.mode==='download'?t('fgDlOnly'):t('fgNoMail')}</p>
    {plan.mode==='send'&&<input className="inp mt-2" type="email" autoComplete="off" placeholder="name@example.com" value={fgMail} onChange={e=>setFgMail(e.target.value)}/>}
    {working&&<p className="mt-2 font-bold text-ok" role="status">⏳ {t('fgWork')}</p>}
    <div className="mt-2 flex gap-2"><button type="button" className="btn !bg-bad" disabled={working} onClick={doForgot}>{plan.mode==='erase'?t('fgErase'):t('fgGo')}</button><button type="button" className="ghost" disabled={working} onClick={()=>{setFg(false);setMsg('')}}>{t('cancel')}</button></div></div>}
   <p className="mt-4 text-xs text-mut">{t('lkNote')}</p></form></div>}

function RecoveryDialog({k,t,onClose}){const email=(jget(DK,{}).ui||{}).email||'';
 return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t('recDlgTitle')}>
  <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl"><div className="bg-gradient-to-r from-indigo-500 to-pink-400 px-5 py-3 text-white"><h2 className="text-lg font-extrabold">🔑 {t('recDlgTitle')}</h2></div>
   <div className="p-5 text-sm"><p>{t('recDlgBody')}</p><code className="my-3 block select-all break-all rounded-xl bg-bg p-3 text-center text-lg tracking-widest">{k}</code>
    <div className="flex flex-wrap gap-2"><button className="ghost" onClick={()=>navigator.clipboard?.writeText(k)}>{t('recCopy')}</button>{EMAIL.test(email)&&<a className="ghost" href={'mailto:'+email+'?subject='+encodeURIComponent(t('subjKey'))+'&body='+encodeURIComponent(k)}>{t('recMail')}</a>}<button className="btn ms-auto" onClick={onClose}>{t('recSaved')}</button></div></div></div></div>}

export function SecurityCard({email}){
 const L=useLock(),t=useT(),[cur,setCur]=useState(''),[nw,setNw]=useState(''),[cf,setCf]=useState(''),[msg,setMsg]=useState(null),[busy,setBusy]=useState(false);
 const note=(x,good)=>setMsg({x,good}),pw={showLabel:t('showC'),hideLabel:t('hideC')},mailOk=EMAIL.test(email||'');
 const doSet=async()=>{setMsg(null);if(nw.length<MIN_LEN)return note(t('minLen',{n:MIN_LEN}));if(nw!==cf)return note(t('noMatch'));
  setBusy(true);try{if(L.has&&!(await L.verify(cur)))return note(t('badCur'));const was=L.has;await L.setCode(nw);setCur('');setNw('');setCf('');note(was?t('codeChg'):t('codeOn'),true)}finally{setBusy(false)}};
 const doRemove=async()=>{if(!(await L.verify(cur)))return note(t('badCur'));L.removeCode();setCur('');note(t('codeOff'),true)};
 const makeKey=()=>{if(!mailOk)return note(t('recNeedMail'));L.newRecovery()};
 return <div className="card"><h3 className="font-bold">🔒 {t('secTitle')}</h3>
  <p className="text-sm text-mut">{L.has?t('secOn'):t('secOff')}</p>
  {L.has&&<><label className="lbl">{t('curCode')}</label><PasswordInput {...pw} autoComplete="off" value={cur} onChange={e=>setCur(e.target.value)}/></>}
  <label className="lbl">{L.has?t('newCode'):t('actCode')}</label><PasswordInput {...pw} autoComplete="new-password" value={nw} onChange={e=>setNw(e.target.value)}/>
  <label className="lbl">{t('confCode')}</label><PasswordInput {...pw} autoComplete="new-password" value={cf} onChange={e=>setCf(e.target.value)}/>
  {msg&&<p className={'mt-2 text-sm '+(msg.good?'text-ok':'text-bad')} role="status">{msg.x}</p>}
  <div className="mt-3 flex flex-wrap gap-2"><button className="btn" disabled={busy||!nw} onClick={doSet}>{L.has?t('changeC'):t('turnOn')}</button>
   {L.has&&<><button className="ghost" onClick={L.lockNow}>{t('lockNow')}</button><button className="ghost text-bad" onClick={doRemove}>{t('removeC')}</button></>}</div>
  {L.has&&<><label className="lbl">{t('autoLock')}</label><select className="inp" value={L.auto} onChange={e=>L.setAuto(+e.target.value)}>{[[0,t('never')],[1,t('min',{n:1})],[5,t('min',{n:5})],[15,t('min',{n:15})],[60,t('hour')]].map(o=><option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
   <div className="mt-4 rounded-2xl border border-line p-3"><h4 className="font-bold">{t('recTitle')}</h4><p className="text-sm text-mut">{t('recT')}</p>
    <div className="mt-2 flex flex-wrap items-center gap-2">{L.rk?<><span className="text-sm text-ok">✅ {t('recSet')}</span><button className="ghost" onClick={L.showRecovery}>{t('recShowBtn')}</button><button className="ghost" onClick={makeKey}>{t('recNew')}</button></>:<><button className="ghost" onClick={makeKey}>{t('recMake')}</button><span className="text-xs text-mut">{mailOk?t('recAuto'):t('recNeedMail')}</span></>}</div></div></>}
  <p className="mt-3 text-xs text-mut">{t('secNote')}</p></div>}
