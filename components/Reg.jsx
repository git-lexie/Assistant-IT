'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
const Ctx=createContext({waiting:false,activate(){},check:async()=>{}});
export const useUpdate=()=>useContext(Ctx);
/** Registers the service worker and tells the app when a new version is waiting. Add ?fakeupdate to the URL to preview the update popup. */
export default function UpdateProvider({children}){
 const [waiting,setWaiting]=useState(false),reg=useRef(null),fake=useRef(false);
 useEffect(()=>{if(/[?&]fakeupdate/.test(location.search)){fake.current=true;setWaiting(true);return}
  if(process.env.NODE_ENV!=='production'||!('serviceWorker'in navigator))return;
  const had=!!navigator.serviceWorker.controller;let timer,reloading=false;
  const cc=()=>{if(!had||reloading)return;reloading=true;location.reload()};navigator.serviceWorker.addEventListener('controllerchange',cc);
  const vis=()=>{if(document.visibilityState==='visible')reg.current?.update().catch(()=>{})};document.addEventListener('visibilitychange',vis);
  navigator.serviceWorker.register('/sw.js').then(r=>{reg.current=r;if(r.waiting&&navigator.serviceWorker.controller)setWaiting(true);
   r.addEventListener('updatefound',()=>{const w=r.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)setWaiting(true)})});
   timer=setInterval(()=>r.update().catch(()=>{}),20*60*1000)}).catch(()=>{});
  return()=>{clearInterval(timer);navigator.serviceWorker.removeEventListener('controllerchange',cc);document.removeEventListener('visibilitychange',vis)}},[]);
 const activate=()=>{if(fake.current){location.href=location.pathname;return}const w=reg.current&&reg.current.waiting;if(w)w.postMessage({type:'SKIP_WAITING'});else location.reload()};
 const check=async()=>{try{await reg.current?.update()}catch(e){}};
 return <Ctx.Provider value={{waiting,activate,check}}>{children}</Ctx.Provider>}
