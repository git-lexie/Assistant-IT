// Translation tiers for text that is not in the built-in dictionaries (guide content, companion replies, extra languages):
//  1. cache (saved on this device)  2. on-device Translator (Chrome/Edge, works offline after a one-time pack download)
//  3. free online service (MyMemory, only if allowed in Settings)  4. original English.
// Text the user types or says is "private": it is only sent online when the user turned that on.
const has=n=>typeof self!=='undefined'&&n in self;
export const supported=()=>has('Translator');
const cfg={pub:true,priv:false};export const configure=o=>Object.assign(cfg,o);
const av={},tt={},CK='xie.trcache.v1';let cache=null,blocked=0,timer=0;
const load=()=>{if(cache)return cache;try{cache=new Map(JSON.parse(localStorage.getItem(CK)||'[]'))}catch(e){cache=new Map()}return cache};
const put=(k,v)=>{const c=load();c.set(k,v);if(c.size>900)for(const x of [...c.keys()].slice(0,150))c.delete(x);clearTimeout(timer);timer=setTimeout(()=>{try{localStorage.setItem(CK,JSON.stringify([...c]))}catch(e){}},800)};
const fetchT=(u,ms=4500)=>{const c=new AbortController(),id=setTimeout(()=>c.abort(),ms);return fetch(u,{signal:c.signal}).finally(()=>clearTimeout(id))}; // a dead connection must never stall the screen
const online=()=>typeof navigator==='undefined'||navigator.onLine!==false;
export async function avail(s,t){if(s===t)return'available';if(!supported())return'unavailable';const k=s+'>'+t;if(av[k]==='available')return'available';
 try{av[k]=await self.Translator.availability({sourceLanguage:s,targetLanguage:t})}catch(e){av[k]='unavailable'}return av[k]}
/** Must be called from a click: downloads the pack if needed. */
export async function prepare(s,t,on){if(!supported())return false;const k=s+'>'+t;
 try{tt[k]=await self.Translator.create({sourceLanguage:s,targetLanguage:t,monitor(m){m.addEventListener('downloadprogress',e=>on&&on(Math.round(e.loaded*100)))}});av[k]='available';return true}catch(e){return false}}
export async function prepDetector(){if(has('LanguageDetector'))await self.LanguageDetector.create()}
const hold=s=>s.replace(/\{(\w+)\}/g,'XQ$1QX'),back=s=>s.replace(/XQ(\w+)QX/g,'{$1}');
const MM={tl:'tl-PH',zh:'zh-CN',no:'nb-NO',he:'he-IL',ur:'ur-PK',bn:'bn-BD',ms:'ms-MY',el:'el-GR',cs:'cs-CZ',ro:'ro-RO',hu:'hu-HU',da:'da-DK',fi:'fi-FI',sv:'sv-SE',uk:'uk-UA'};
const ent=s=>s.replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&apos;/g,"'");
function chunks(text){const out=[];for(const line of text.split(/(\n)/)){if(line==='\n'||line.length<=420){out.push(line);continue}let cur='';for(const s of line.match(/[^.!?。]+[.!?。]*\s*/g)||[line]){if((cur+s).length>420&&cur){out.push(cur);cur=''}cur+=s}out.push(cur)}return out}
async function web(text,s,t){const parts=chunks(hold(text)),res=[];
 for(const p of parts){if(p==='\n'||!p.trim()){res.push(p);continue}
  const r=await fetchT('https://api.mymemory.translated.net/get?q='+encodeURIComponent(p)+'&langpair='+(MM[s]||s)+'|'+(MM[t]||t));if(!r.ok)throw 0;const j=await r.json(),x=j&&j.responseData&&j.responseData.translatedText;
  if(!x||/MYMEMORY WARNING|PLEASE SELECT|INVALID/i.test(x)||j.responseStatus!==200){blocked=Date.now()+3600e3;throw 0}res.push(ent(x))}
 const o=back(res.join(''));return /\{(\w+)\}/.test(text)&&!/\{(\w+)\}/.test(o)?text:o}
export async function tr(text,s,t,o={}){if(!text||s===t)return text;const priv=!!o.priv,k=s+'>'+t+'|'+text;
 if(!priv&&load().has(k))return load().get(k);
 if(await avail(s,t)==='available'){try{tt[k.split('|')[0]]=tt[k.split('|')[0]]||await self.Translator.create({sourceLanguage:s,targetLanguage:t});const r=back(await tt[k.split('|')[0]].translate(hold(text)));if(r&&!(/\{(\w+)\}/.test(text)&&!/\{(\w+)\}/.test(r))){if(!priv)put(k,r);return r}}catch(e){}}
 if(online()&&(priv?cfg.priv:cfg.pub)&&Date.now()>blocked){try{const r=await web(text,s,t);if(r&&r!==text){if(!priv)put(k,r);return r}}catch(e){blocked=Math.max(blocked,Date.now()+120000)}}   // after a failed or slow request the online service is skipped for 2 minutes
 return text}
export async function detect(text){try{if(!has('LanguageDetector'))return null;const d=await self.LanguageDetector.create(),r=await d.detect(text);return r[0]&&r[0].confidence>.5&&r[0].detectedLanguage!=='und'?r[0].detectedLanguage:null}catch(e){return null}}
/** Quick script-based guess used when the browser has no language detector. */
export const guess=x=>/[\u4e00-\u9fff]/.test(x)?'zh':/[\u3040-\u30ff]/.test(x)?'ja':/[\uac00-\ud7af]/.test(x)?'ko':/[\u0400-\u04ff]/.test(x)?'ru':/[\u0600-\u06ff]/.test(x)?'ar':/[\u0900-\u097f]/.test(x)?'hi':/[\u0e00-\u0e7f]/.test(x)?'th':null;
const EW=new Set('the a an is are my i me it to of and or on in for with at not no does do dont cant can will what how this that when after have has be was our we you your please help why there still just very now again its im it\'s says but because from'.split(' '));
export const looksEnglish=x=>{const w=String(x).toLowerCase().replace(/[^a-z' ]/g,' ').split(/\s+/).filter(Boolean);if(!w.length)return false;const n=w.filter(a=>EW.has(a)).length;return n>=2||n/w.length>=.4};
