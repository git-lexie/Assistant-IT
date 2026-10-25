// Sample tickets built from the knowledge base. Kept separate from the UI so the counts and dates can be tested.
/** Guides not yet loaded as sample tickets, optionally limited to one category ('*' = all). Returns [[guide,index],...]. */
export function pickSamples(all,existingIds,cat){const out=[];all.forEach((e,i)=>{if((cat==='*'||e[0]===cat)&&!existingIds.has('s'+i))out.push([e,i])});return out}
/** One finished sample ticket, spread over the last `days` days (never in the future). */
export function sampleTicket(e,idx,j,now,days,title,resolution){const span=days*864e5,done=now-((j*7919)%span)-72e5,created=done-((j%5)+1)*36e5;
 return{id:'s'+idx,sample:1,text:title,en:e[2],cat:e[0],status:'done',created,done,resolution}}
export const resolutionOf=e=>e[5].split('|').slice(0,3).join(' → ');
