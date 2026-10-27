import {KB} from './kb.js';
import {KB2,GLOSS} from './kb2.js';
export const ALL=[...KB,...KB2];
const STOP=new Set('the a an is are my i me it to of and or on in for with at not no does do dont cant can will what how this that when since after have has be was our we you your please help need want get got why there their they them still just very really now today again its im ive cannot unable keeps keep always every too take takes taking got gets'.split(' '));
const PACK={es:'impresora=printer,imprimir=print,contraseña=password,clave=password,bloqueada=locked,bloqueado=locked,correo=email,lento=slow,lenta=slow,red=network,pantalla=screen,teclado=keyboard,ratón=mouse,raton=mouse,servidor=server,conexión=connection,conexion=connection,apagado=offline,congelado=freeze,ordenador=computer,computadora=computer,portátil=computer,teléfono=phone,telefono=phone,sonido=audio,micrófono=microphone,microfono=microphone,cámara=camera,camara=camera,actualización=update,actualizacion=update,copia=backup,respaldo=backup,archivo=file,carpeta=folder,cuenta=account,acceso=login,sesión=login,sesion=login,reunión=meeting,reunion=meeting,llamada=call,batería=battery,bateria=battery,cargador=charger,falla=error,fallo=error,roto=broken,inalámbrica=wireless,inalambrica=wireless,sincroniza=sync',
fr:'imprimante=printer,imprimer=print,verrouillé=locked,verrouille=locked,courriel=email,messagerie=email,lent=slow,lente=slow,réseau=network,reseau=network,écran=screen,ecran=screen,clavier=keyboard,souris=mouse,serveur=server,connexion=connection,hors=offline,gelé=freeze,figé=freeze,ordinateur=computer,téléphone=phone,telephone=phone,son=audio,micro=microphone,caméra=camera,erreur=error,sauvegarde=backup,fichier=file,dossier=folder,compte=account,connecter=login,réunion=meeting,batterie=battery,chargeur=charger,panne=error,cassé=broken,mot=password',
de:'drucker=printer,drucken=print,passwort=password,kennwort=password,gesperrt=locked,langsam=slow,netzwerk=network,bildschirm=screen,tastatur=keyboard,maus=mouse,verbindung=connection,eingefroren=freeze,rechner=computer,telefon=phone,ton=audio,mikrofon=microphone,kamera=camera,aktualisierung=update,fehler=error,sicherung=backup,datei=file,ordner=folder,konto=account,anmeldung=login,besprechung=meeting,akku=battery,ladegerät=charger,defekt=broken,kaputt=broken,drahtlos=wireless',
pt:'impressora=printer,imprimir=print,senha=password,bloqueada=locked,lento=slow,lenta=slow,rede=network,tela=screen,servidor=server,conexão=connection,conexao=connection,travado=freeze,computador=computer,celular=phone,som=audio,microfone=microphone,câmera=camera,atualização=update,atualizacao=update,erro=error,cópia=backup,arquivo=file,pasta=folder,conta=account,reunião=meeting,bateria=battery,carregador=charger,quebrado=broken',
fil:'mabagal=slow,koneksyon=connection,naka-hang=freeze,nag-hang=freeze,nakalimutan=forgot,naka-lock=locked,baterya=battery,telepono=phone,tunog=audio,pulong=meeting,sira=broken,kompyuter=computer,hindi=not'};
const ALIAS={mail:'email',logon:'login',signin:'login',wlan:'wifi',lan:'network',pc:'computer',notebook:'laptop',turn:'power'};
for(const l of Object.values(PACK))for(const p of l.split(',')){const[k,v]=p.split('=');ALIAS[k]=v}
const ZH=[['打印机','printer'],['打印','print'],['网络','network'],['上网','internet'],['无线','wifi'],['密码','password'],['邮件','email'],['邮箱','email'],['很慢','slow'],['太慢','slow'],['卡顿','slow'],['病毒','virus'],['蓝屏','blue screen'],['启动','boot'],['开机','boot'],['电池','battery'],['屏幕','screen'],['键盘','keyboard'],['鼠标','mouse'],['服务器','server'],['备份','backup'],['会议','meeting'],['麦克风','microphone'],['摄像头','camera'],['声音','audio'],['更新','update'],['脱机','offline'],['离线','offline'],['登录','login'],['账号','account'],['账户','account'],['锁定','locked'],['崩溃','crash'],['错误','error'],['文件','file'],['共享','shared'],['打不开','open']];
const stem=w=>w.length>4?w.replace(/(ing|ed|es)$/,'').replace(/([^s])s$/,'$1').replace(/e$/,''):w;
export const toks=t=>{const raw=String(t).toLowerCase().replace(/wi-fi/g,'wifi').replace(/e-mail/g,'email'),out=raw.replace(/[^\p{L}\p{N} ]/gu,' ').split(/\s+/).filter(w=>w.length>1&&!STOP.has(w)).map(w=>stem(ALIAS[w]||w));for(const[z,e] of ZH)if(raw.includes(z))out.push(...e.split(' ').map(stem));return[...new Set(out)]};
const lev=(a,b)=>{if(Math.abs(a.length-b.length)>1)return 9;const m=a.length,n=b.length,d=[];for(let i=0;i<=m;i++){d[i]=[i]}for(let j=1;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)}return d[m][n]};
const DOC=ALL.map(e=>{const m=new Map(),add=(x,w)=>toks(x).forEach(k=>m.set(k,Math.max(m.get(k)||0,w)));add(e[1],3);add(e[2],2);add(e[3],.6);add(e[5],.3);return m});
const DOCT=ALL.map(e=>new Set(toks(e[2])));
const DF=new Map();DOC.forEach(m=>m.forEach((_,k)=>DF.set(k,(DF.get(k)||0)+1)));
const VOC=[...DF.keys()],idf=k=>Math.log(1+ALL.length/(DF.get(k)||1));
const expand=q=>DF.has(q)?[[q,1]]:(q.length>=5?VOC.filter(v=>lev(q,v)<=1).slice(0,2).map(v=>[v,.7]):[]);
/** Ranks every guide for the query tokens. Returns [[score, entry], ...] best first. Uses learned terms and feedback from S. */
// Category cue words: words that almost always belong to one category (printer, outlook, vpn...). They steer free-text questions to the right category.
const GENERIC=new Set(['laptop','computer','device','window','windows','mac','user','phone','mobile','pc','problem','issue','error','fail','not','work','app','long','time','stuck','freeze','crash','hang','open','start','stop','close','use','wrong','bad','fix','help'].map(x=>stem(x)));
const CUE=new Map();(()=>{const mass=new Map();ALL.forEach((e,i)=>DOC[i].forEach((w,k)=>{if(w<2||e[0]==='other'||GENERIC.has(k))return;const m=mass.get(k)||{};m[e[0]]=(m[e[0]]||0)+w;mass.set(k,m)}));
 mass.forEach((m,k)=>{const tot=Object.values(m).reduce((x,y)=>x+y,0),[c,v]=Object.entries(m).sort((x,y)=>y[1]-x[1])[0];if(DF.get(k)>=2&&v/tot>=.6)CUE.set(k,{cat:c,w:(v/tot)*idf(k)})})})();
/** Ranks guides for the query tokens, best first. cat limits the search to one category. Uses learned terms and feedback from S. */
export const match=(q,S={},cat)=>{const vote={};if(!cat)q.forEach(w=>{const c=CUE.get(w);if(c)vote[c.cat]=(vote[c.cat]||0)+c.w});
 const PRI={printer:2,email:2,meeting:1.6,backup:1.3,hardware:1,security:1.1,software:1,account:.8,network:.8,wifi:.8,slow:.6};Object.keys(vote).forEach(c=>{vote[c]*=PRI[c]||1});
 const top=Object.entries(vote).sort((x,y)=>y[1]-x[1]),lead=top[0]&&(!top[1]||top[0][1]>=top[1][1]*1.4)?top[0][0]:null;
 return ALL.map((e,i)=>{if(cat&&e[0]!==cat)return null;let s=0,hit=0,th=0,thit=0;const L=(S.learn||{})[e[2]]||{};
  q.forEach(w=>{let h=0;expand(w).forEach(([k,f])=>{const d=DOC[i].get(k)||0;if(d)h=1;if(DOCT[i].has(k))th=Math.max(th,f);s+=d*idf(k)*f});hit+=h;thit+=th;th=0;if(L[w])s+=Math.min(L[w],5)*1.2*idf(w)});
  const cov=q.length?hit/q.length:0;s*=(.4+.6*cov)*(1+.6*Math.min(1,thit/Math.max(1,DOCT[i].size)));if(lead)s*=e[0]===lead?2:.5;
  const fb=Math.max(-.5,Math.min(.5,((S.fb||{})[e[2]]||0)*.1));return[s*(1+fb),e]}).filter(Boolean).sort((x,y)=>y[0]-x[0])};
export const cueTable=()=>CUE;
export const guidesOf=cat=>ALL.filter(e=>e[0]===cat).map(e=>e[2]);
export const guideByTitle=t=>ALL.find(e=>e[2]===t);
export const THRESH=4;
export const best=(text,S)=>{const m=match(toks(text),S)[0];return m&&m[0]>=THRESH?m[1][2]:null};
/** Teach XIE: remember the words of a problem as belonging to a guide. */
export const learn=(S,title,text)=>{S.learn=S.learn||{};const o=S.learn[title]=S.learn[title]||{};toks(text).forEach(w=>{o[w]=(o[w]||0)+1})};
/** Finds solved tickets and saved fixes similar to the text. */
export function similar(text,skipId,S,cat){const w=toks(text);if(!w.length)return[];
 const pool=[...(S.fixes||[]).map(f=>({t:f.problem+' '+(f.fix||''),r:f.fix,d:f.date,src:'Saved fix',cat:f.cat})),...(S.tickets||[]).filter(t=>t.status==='done'&&t.id!==skipId).map(t=>({t:(t.en||t.text)+' '+(t.resolution||''),r:t.resolution,d:t.done,src:'Past ticket',h:t.text,cat:t.cat}))];
 return pool.filter(p=>!cat||!p.cat||p.cat===cat||p.cat==='other').map(p=>{const x=toks(p.t),i=x.filter(a=>w.includes(a)).length;return{...p,sc:i/Math.sqrt(w.length*x.length||1)}}).filter(o=>o.sc>.3).sort((a,b)=>b.sc-a.sc).slice(0,3)}
export async function wiki(q){const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),4500),r=await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=3&format=json&origin=*&srsearch='+encodeURIComponent(q),{signal:ac.signal});clearTimeout(tm);const j=await r.json();
 return j.query.search.map(x=>({title:x.title,snip:x.snippet.replace(/<[^>]+>/g,'').replace(/&quot;/g,'"').replace(/&amp;/g,'&'),url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(x.title.replace(/ /g,'_'))}))}
// Simple mode hides commands and jargon-heavy steps; Technician mode shows everything.
const ADV=/\b(netsh|ipconfig|sfc|dism|gpupdate|gpresult|w32tm|slmgr|nslookup|tracert|chkdsk|mdsched|Test-NetConnection|vlan|dhcp|dns|gpo|poe|smtp|mtu|kms|nla|tpm|spf|dkim|dmarc|edr|mdm|intune|sccm|windirstat|event viewer|pbx|sip|jitter|qos|smb|ntp|bios|ssid|firmware|cmos|ntfs|sql)\b/i;
const PLAIN=[[/\bDHCP\b/g,'automatic address setup'],[/\bDNS\b/g,'internet address lookup'],[/\bVPN\b/g,'secure remote connection'],[/\bMFA\b/g,'extra sign-in code'],[/\bBIOS\b/g,'startup settings'],[/\bMTU\b/g,'data packet size'],[/\bSSID\b/g,'Wi-Fi name'],[/\bAP\b/g,'Wi-Fi box'],[/\bISP\b/g,'internet provider'],[/\bfirewall\b/gi,'network protection'],[/\bdrivers?\b/gi,'device software'],[/\bspooler\b/gi,'print queue'],[/\bcache\b/gi,'temporary saved data'],[/\badmin rights\b/gi,'administrator permission'],[/\bRAM\b/g,'memory'],[/\bCPU\b/g,'processor'],[/\bSSD\b/g,'fast storage drive'],[/\bMDM\b/g,'device management'],[/\bEDR\b/g,'security software']];
export const plain=x=>PLAIN.reduce((a,[r,w])=>a.replace(r,w),x);
export function adapt(e,simple){const steps=e[5].split('|');
 if(!simple)return{steps,cause:e[3],needs:e[4],escalate:e[6],title:e[2],tech:true,hard:0};
 const easy=steps.filter(x=>!ADV.test(x)),pick=(easy.length>=2?easy:steps.slice(0,2)).slice(0,5);
 return{steps:pick.map(plain),cause:plain(e[3]),needs:plain(e[4]),escalate:plain(e[6]),title:plain(e[2]),tech:false,hard:Math.max(0,steps.length-pick.length)}}
/** Returns a structured reply: {k} fixed message key, {gloss}, or {guide}. The UI translates and formats it. */
function build(e,u,M,sim,strong){const g=adapt(e,u.simple!==false);g.alts=(M||[]).filter(x=>x[1]!==e).slice(0,2).filter(x=>x[0]>=THRESH&&x[0]>=(M[0]?M[0][0]:0)*.6).map(x=>u.simple===false?x[1][2]:plain(x[1][2]));g.strong=strong;return g}
/** Structured reply: {k} fixed message key, {gloss}, or {guide}. o.cat limits matching to one category; o.entry opens one exact guide by title. */
export function answer(text,S,o={}){
 const low=text.toLowerCase().trim(),q=toks(text),u=S.ui||{};
 if(o.entry){const e=guideByTitle(o.entry);if(e)return{guide:build(e,u,[],similar(e[2],undefined,S,e[0]),false),cat:e[0],entry:e[2],ticket:true,sim:similar(e[2],undefined,S,e[0]),conf:99}}
 if(!o.cat){
  if(/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(low)&&q.length<3)return{k:'greet'};
  if(/^(thanks|thank you|ok thanks|great)/.test(low))return{k:'thanks'};
  if(/(who are you|what can you do|what are you)/.test(low))return{k:'about'};
  if(/\b(what is|what are|whats|define|explain|meaning of|what does)\b/.test(low)){const g=GLOSS.find(x=>new RegExp('\\b('+x[0]+')\\b','i').test(text));if(g)return{gloss:{name:g[1],def:g[2]}}}}
 let M=match(q,S,o.cat),outside=false,need=o.cat?THRESH*.5:THRESH;
 if(o.cat){const G=match(q,S),inCat=M[0]?M[0][0]:0;if(G[0]&&G[0][1][0]!==o.cat&&G[0][0]>=THRESH&&(inCat<need||G[0][0]>=1.8*inCat)){M=G;outside=true;need=THRESH}} // another category is clearly a better fit than the chosen one
 const[s1,e]=M[0]||[0],sim=similar(text,undefined,S,e&&s1>=need?e[0]:o.cat),strong=!!(sim[0]&&sim[0].sc>=.55);
 if(!e||s1<need){if(sim[0]&&sim[0].sc>=.4)return{k:'simOnly',cat:o.cat||'other',ticket:true,sim,low:true};return{k:'more',cat:o.cat||'other',ticket:text.length>25,sim,low:true}}
 const g=build(e,u,M,sim,strong);
 return{guide:g,cat:e[0],entry:e[2],ticket:true,sim,conf:s1,outside}}
