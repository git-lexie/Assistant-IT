// Turns USER-MANUAL.md into public/manual.html (a styled page that also works offline). Runs before every build.
import fs from 'node:fs';
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const inline=s=>esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g,'$1<em>$2</em>').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,'<a href="$2">$1</a>');
export function md(src){const L=src.split('\n'),o=[];let i=0,list=null;const close=()=>{if(list){o.push(`</${list}>`);list=null}};
 while(i<L.length){const l=L[i];
  if(/^\s*$/.test(l)){close();i++;continue}
  let m;
  if(m=/^(#{1,4})\s+(.*)$/.exec(l)){close();const n=m[1].length,id=m[2].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');o.push(`<h${n} id="${id}">${inline(m[2])}</h${n}>`);i++;continue}
  if(/^---+$/.test(l)){close();o.push('<hr>');i++;continue}
  if(/^\|/.test(l)&&/^\|[\s:|-]+\|?$/.test(L[i+1]||'')){close();const row=r=>r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());const h=row(l);i+=2;const b=[];while(i<L.length&&/^\|/.test(L[i])){b.push(row(L[i]));i++}
   o.push('<div class="t"><table><thead><tr>'+h.map(c=>`<th>${inline(c)}</th>`).join('')+'</tr></thead><tbody>'+b.map(r=>'<tr>'+r.map(c=>`<td>${inline(c)}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>');continue}
  if(m=/^>\s?(.*)$/.exec(l)){close();o.push(`<blockquote>${inline(m[1])}</blockquote>`);i++;continue}
  if(m=/^\s*[-*]\s+(.*)$/.exec(l)){if(list!=='ul'){close();o.push('<ul>');list='ul'}o.push(`<li>${inline(m[1])}</li>`);i++;continue}
  if(m=/^\s*\d+\.\s+(.*)$/.exec(l)){if(list!=='ol'){close();o.push('<ol>');list='ol'}o.push(`<li>${inline(m[1])}</li>`);i++;continue}
  close();const p=[l];i++;while(i<L.length&&L[i].trim()&&!/^(#|---|\||>|\s*[-*]\s|\s*\d+\.\s)/.test(L[i])){p.push(L[i]);i++}o.push(`<p>${inline(p.join(' '))}</p>`)}
 close();return o.join('\n')}
export const page=(body,title='Assistant XIE – User manual')=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="icon" href="/icon.svg">
<style>:root{--bg:#f6f8fc;--card:#fff;--ink:#1f2d4d;--mut:#5b6b88;--line:#dbe3ef;--acc:#6366f1}@media(prefers-color-scheme:dark){:root{--bg:#0f1626;--card:#18223a;--ink:#eaf0fb;--mut:#9fb0cf;--line:#2a3856;--acc:#9a8dff}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 system-ui,Segoe UI,Roboto,sans-serif}main{max-width:820px;margin:0 auto;padding:20px 18px 60px}h1{background:linear-gradient(90deg,#6366f1,#8b5cf6,#f472b6);color:#fff;padding:18px 20px;border-radius:18px;font-size:1.7rem}
h2{margin-top:2.2rem;border-bottom:2px solid var(--line);padding-bottom:.3rem}h3{margin-top:1.4rem;color:var(--acc)}a{color:var(--acc)}code{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:1px 6px;font-size:.92em}
blockquote{margin:1rem 0;padding:.6rem 1rem;border-inline-start:5px solid var(--acc);background:var(--card);border-radius:10px}.t{overflow-x:auto}table{border-collapse:collapse;width:100%;background:var(--card)}th,td{border:1px solid var(--line);padding:6px 10px;text-align:start;vertical-align:top}th{background:rgba(99,102,241,.12)}hr{border:0;border-top:1px solid var(--line);margin:2rem 0}
.top{position:sticky;top:0;background:var(--bg);padding:8px 0;font-size:.9rem}@media print{.top{display:none}body{background:#fff;color:#000}}</style></head><body><main><div class="top"><a href="/">← Back to Assistant XIE</a></div>${body}</main></body></html>`;
if(process.argv[1]&&process.argv[1].endsWith('manual.mjs')){fs.writeFileSync('public/manual.html',page(md(fs.readFileSync('USER-MANUAL.md','utf8'))));console.log('Wrote public/manual.html')}
