// Runs after `next build` (npm "postbuild"). Writes the list of every exported file into out/sw.js so the service worker can save
// the complete app for offline use when it installs.
import fs from 'node:fs';
import path from 'node:path';
const out='out',swPath=path.join(out,'sw.js');
if(!fs.existsSync(swPath)){console.log('precache: no out/sw.js (not a static export build), skipped');process.exit(0)}
const files=[];(function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);f.isDirectory()?walk(p):files.push(path.relative(out,p).split(path.sep).join('/'))}})(out);
const skip=f=>f==='sw.js'||f==='version.json'||f.endsWith('.map')||f.split('/').some(s=>s.startsWith('.'));
let urls=files.filter(f=>!skip(f)).map(f=>'/'+f);
if(urls.includes('/index.html'))urls.unshift('/');
urls=[...new Set(urls)];
if(!urls.includes('/')||!urls.some(u=>u.startsWith('/_next/static/')&&u.endsWith('.js')))throw new Error('precache: the export has no page or no scripts; refusing to write an offline list');
const sw=fs.readFileSync(swPath,'utf8'),next=sw.replace(/\/\*PRECACHE\*\/[\s\S]*?\/\*END\*\//,'/*PRECACHE*/'+JSON.stringify(urls)+'/*END*/');
if(next===sw&&!sw.includes(JSON.stringify(urls)))throw new Error('precache: marker not found in out/sw.js');
fs.writeFileSync(swPath,next);
const kb=Math.round(urls.reduce((n,u)=>n+(u==='/'?0:fs.statSync(path.join(out,u.slice(1))).size),0)/1024);
console.log(`precache: ${urls.length} files (${kb} KB) will be saved on each device for offline use`);
