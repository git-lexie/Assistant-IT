'use client';
import {useEffect,useState} from 'react';
/** Guided 4-4-6 breathing for about one minute. */
export default function Breathe({t,onClose}){
 const [i,setI]=useState(0),[n,setN]=useState(0),PH=[['breatheIn',4],['breatheHold',4],['breatheOut',6]];
 const [ph,sec]=PH[i];
 useEffect(()=>{const id=setTimeout(()=>{if(n>=4*3-1&&i===2){setN(99);return}if(i===2)setN(x=>x+3);setI((i+1)%3)},sec*1000);return()=>clearTimeout(id)},[i,n]);
 useEffect(()=>{const k=e=>e.key==='Escape'&&onClose();addEventListener('keydown',k);return()=>removeEventListener('keydown',k)},[]);
 const done=n>=90;
 return <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600/95 via-violet-600/95 to-pink-500/95 p-6 text-center text-white" role="dialog" aria-modal="true">
  <div className="mb-8 flex h-44 w-44 items-center justify-center rounded-full bg-white/25 shadow-2xl" style={{transform:done?'scale(1)':(i===0||i===1)?'scale(1.35)':'scale(.8)',transition:`transform ${sec}s ease-in-out`}}><span className="text-5xl">{done?'💛':'🫶'}</span></div>
  <h2 className="text-2xl font-extrabold">{done?t('breatheDone'):t(ph)}</h2><p className="mt-2 max-w-xs text-sm opacity-90">{t('breatheT')}</p>
  <button className="mt-8 rounded-full bg-white px-6 py-2 font-bold text-indigo-700" onClick={onClose}>{t('breatheClose')}</button></div>}
