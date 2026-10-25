'use client';
import {useState} from 'react';
import {EMAIL} from '@/lib/backup';
/** Update popup: saves a backup (download + email/share) first, then lets the new version take over. */
export default function UpdateDialog({t,name,email,onBackup,onApply,onLater}){
 const [st,setSt]=useState('ask'),[mail,setMail]=useState(email||'');
 const go=async()=>{setSt('work');try{const r=await onBackup(EMAIL.test(mail)?mail:'');if(r==='mailto'){setSt('sent');return}setTimeout(onApply,900)}catch(e){setSt('fail')}};
 return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t('updTitle')}>
  <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl">
   <div className="bg-gradient-to-r from-indigo-500 to-pink-400 px-5 py-3 text-white"><h2 className="text-lg font-extrabold">🚀 {t('updTitle')}</h2></div>
   <div className="p-5 text-sm">
    {st==='ask'&&<><p>{t('updBody',{n:name})}</p><label className="lbl" htmlFor="upd-mail">{t('updMail')}</label><input id="upd-mail" className="inp" type="email" autoComplete="email" value={mail} onChange={e=>setMail(e.target.value.trim())} placeholder="name@example.com"/></>}
    {st==='work'&&<p className="text-center text-base font-bold" role="status">⏳ {t('updWork')}</p>}
    {st==='sent'&&<p className="text-ok font-bold" role="status">✅ {t('updSent')}</p>}
    {st==='fail'&&<p className="font-bold text-bad" role="alert">⚠️ {t('updFail')}</p>}
    <div className="mt-4 flex flex-wrap justify-end gap-2">
     {st==='ask'&&<><button className="ghost" onClick={onLater}>{t('updLater')}</button><button className="btn" onClick={go}>{t('updNow')}</button></>}
     {st==='sent'&&<button className="btn" onClick={onApply}>{t('updFinish')}</button>}
     {st==='fail'&&<><button className="ghost" onClick={onLater}>{t('updLater')}</button><button className="ghost text-bad" onClick={onApply}>{t('updAnyway')}</button><button className="btn" onClick={go}>{t('updRetry')}</button></>}</div></div></div></div>}
