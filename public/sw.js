// Service worker for offline use.
// mvp3z79b is replaced on every build, so each deploy is a new version. After the build, scripts/precache.mjs writes the list of EVERY
// file of the app between the PRECACHE markers, so the whole app (page, scripts, styles, icons, manual) is saved on the device when the
// worker installs, not only the files the user happened to open. Everything is then served from that saved copy: it works with no signal,
// with weak signal, and after the server has replaced files with a newer version.
// A new version waits until the user taps Update (the app saves a backup first). It never takes over silently.
const V='xie-mvp3z79b';
const PRECACHE=/*PRECACHE*/['/','/manifest.webmanifest','/icon.svg','/icon-192.png','/icon-512.png','/manual.html']/*END*/;
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(V);
 await Promise.all(PRECACHE.map(async u=>{try{const r=await fetch(u,{cache:'reload'});if(r&&r.ok&&!r.redirected)await c.put(u,r)}catch(x){}}));
 if(!(await c.match('/')))throw new Error('app page was not saved; the install will be retried')})())});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==self.location.origin||u.pathname==='/sw.js'||u.pathname==='/version.json')return;
 e.respondWith((async()=>{const c=await caches.open(V),hit=await c.match(r,{ignoreSearch:true});
  if(hit)return hit;                                                    // saved copy first: instant, and no waiting for a weak network
  if(r.mode==='navigate'&&(u.pathname==='/'||!/\.[a-z0-9]+$/i.test(u.pathname))){const shell=await c.match('/');if(shell)return shell}   // any app address opens the app page
  try{const n=await fetch(r);if(n&&n.ok&&!n.redirected)c.put(r,n.clone());return n}catch(x){return Response.error()}})())});
