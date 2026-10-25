// Runs before every build (npm run build / Vercel). Writes public/sw.js and public/version.json with a new build id.
import fs from 'node:fs';
const id=(process.env.VERCEL_GIT_COMMIT_SHA||'').slice(0,8)||Date.now().toString(36);
fs.writeFileSync('public/sw.js',fs.readFileSync('scripts/sw.template.js','utf8').replace(/__BUILD__/g,id));
fs.writeFileSync('public/version.json',JSON.stringify({v:id,t:Date.now()}));
console.log('XIE build id',id);
