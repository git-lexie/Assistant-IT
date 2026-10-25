// Activation-code helpers. The code itself is never stored, only a salted PBKDF2 hash.
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
export const newSalt=()=>hex(crypto.getRandomValues(new Uint8Array(16)));
export async function hash(code,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(code),'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:150000},k,256))}
/** Seconds to wait after n wrong attempts: none for 4, then 30 s doubling, max 15 min. */
export const failDelay=n=>n<5?0:Math.min(900,30*2**(n-5));
export const MIN_LEN=4;
