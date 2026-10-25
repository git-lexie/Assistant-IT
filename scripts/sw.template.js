// Service worker. __BUILD__ is replaced on every build, so each deploy is detected as an update.
// The new version waits until the user taps Update (after the backup is saved). It never takes over silently.
const V='xie-__BUILD__';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(['/','/manifest.webmanifest','/icon.svg','/icon-192.png','/manual.html'])))});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const put=(r,n)=>{if(n&&n.ok){const c=n.clone();caches.open(V).then(x=>x.put(r,c))}return n};
self.addEventListener('fetch',e=>{const r=e.request,p=new URL(r.url).pathname;if(r.method!=='GET'||!r.url.startsWith(self.location.origin)||p==='/sw.js'||p==='/version.json')return;
 if(r.mode==='navigate'){e.respondWith(fetch(r).then(n=>put(r,n)).catch(()=>caches.match(r).then(m=>m||caches.match('/'))));return}
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(n=>put(r,n))))});
