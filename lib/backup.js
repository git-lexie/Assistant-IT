// Backup helpers: plain or AES-GCM encrypted backups, and delivery by download + email/share.
export const DK='xie.next.v1';
export const rawData=()=>localStorage.getItem(DK)||'{}';
export const stamp=()=>new Date().toISOString().slice(0,10);
export const EMAIL=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const newKey=()=>{const a=crypto.getRandomValues(new Uint8Array(16)),c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return[...a].map(x=>c[x%32]).join('').match(/.{4}/g).join('-')};
const norm=k=>k.replace(/[^A-Za-z0-9]/g,'').toUpperCase();
const b64=b=>{let s='';const u=new Uint8Array(b);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode(...u.subarray(i,i+0x8000));return btoa(s)},unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const key=async(rk,salt)=>{const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(norm(rk)),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])};
export async function encrypt(json,rk){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),k=await key(rk,salt);
 return JSON.stringify({xieEnc:1,salt:b64(salt),iv:b64(iv),data:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(json)))})}
export async function decrypt(txt,rk){const o=JSON.parse(txt),k=await key(rk,unb64(o.salt));return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(o.iv)},k,unb64(o.data)))}
/** Always downloads the file. With an email: shares the file to the mail app (phones) or opens a mail draft addressed to the user. A web app cannot send email silently. */
export async function deliver(text,name,email,subject,body){const blob=new Blob([text],{type:'application/json'}),f=new File([blob],name,{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();
 if(!email)return'downloaded';
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:subject,text:body});return'shared'}}catch(e){}
 location.href='mailto:'+email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);return'mailto'}

/** Decides what "Forgot code" does. send = download + email; download = file only; erase = no backup possible. */
export function planForgot(email,rk){const ok=EMAIL.test(email||'');return ok?{mode:'send',newKey:!rk}:rk?{mode:'download',newKey:false}:{mode:'erase',newKey:false}}
