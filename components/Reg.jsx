'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
const Ctx=createContext({waiting:false,offline:'prep',activate(){},check:async()=>{}});
export const useUpdate=()=>useContext(Ctx);
/** Registers the service worker, tells the app when a new version is waiting, and reports whether the whole app is saved for offline use.
 *  offline: 'prep' (saving), 'ready' (complete copy saved on this device), 'dev' (no service worker in development).
 *  Add ?fakeupdate to the URL to preview the update popup. */
export default function UpdateProvider({children}){
 const [waiting,setWaiting]=useState(false),[offline,setOffline]=useState('prep'),reg=useRef(null),fake=useRef(false);
 useEffect(()=>{if(/[?&]fakeupdate/.test(location.search)){fake.current=true;setWaiting(true);setOffline('dev');return}
  if(process.env.NODE_ENV!=='production'||!('serviceWorker'in navigator)){setOffline('dev');return}
  const had=!!navigator.serviceWorker.controller;let timer,poll,stop=false,reloading=false;
  const cc=()=>{if(!had||reloading)return;reloading=true;location.reload()};navigator.serviceWorker.addEventListener('controllerchange',cc);
  const vis=()=>{if(document.visibilityState==='visible')reg.current?.update().catch(()=>{})};document.addEventListener('visibilitychange',vis);
  const ready=async()=>{try{for(const k of (await caches.keys()).filter(x=>x.startsWith('xie-'))){const c=await caches.open(k);if(await c.match('/')&&(await c.keys()).some(q=>/\/_next\/static\/.*\.js/.test(q.url))){setOffline('ready');return true}}}catch(e){}return false};
  navigator.serviceWorker.register('/sw.js').then(r=>{reg.current=r;if(r.waiting&&navigator.serviceWorker.controller)setWaiting(true);
   r.addEventListener('updatefound',()=>{const w=r.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)setWaiting(true)})});
   timer=setInterval(()=>r.update().catch(()=>{}),20*60*1000)}).catch(()=>{});
  navigator.serviceWorker.ready.then(async()=>{let n=0;poll=setInterval(async()=>{if(stop||await ready()||++n>40)clearInterval(poll)},1500);await ready()}).catch(()=>{});
  return()=>{stop=true;clearInterval(timer);clearInterval(poll);navigator.serviceWorker.removeEventListener('controllerchange',cc);document.removeEventListener('visibilitychange',vis)}},[]);
 const activate=()=>{if(fake.current){location.href=location.pathname;return}const w=reg.current&&reg.current.waiting;if(w)w.postMessage({type:'SKIP_WAITING'});else location.reload()};
 const check=async()=>{try{await reg.current?.update()}catch(e){}};
 return <Ctx.Provider value={{waiting,offline,activate,check}}>{children}</Ctx.Provider>}
