// Report maths, kept free of UI code so it can be tested.
/** A ticket counts as "Still open" only after it has stayed open for 30 minutes. */
export const STILL_OPEN_MS=30*60*1000;
export const isStillOpen=(k,now=Date.now())=>k.status==='open'&&now-k.created>=STILL_OPEN_MS;
export const isFresh=(k,now=Date.now())=>k.status==='open'&&now-k.created<STILL_OPEN_MS;
/** Start (inclusive) and end (exclusive) of the day, week (Monday start) or month that contains dateStr (YYYY-MM-DD). */
export function rangeOf(kind,dateStr){const d=new Date(dateStr+'T00:00:00');let a,b;
 if(kind==='day'){a=new Date(d);b=new Date(d);b.setDate(b.getDate()+1)}
 else if(kind==='week'){const k=(d.getDay()+6)%7;a=new Date(d);a.setDate(d.getDate()-k);b=new Date(a);b.setDate(a.getDate()+7)}
 else{a=new Date(d.getFullYear(),d.getMonth(),1);b=new Date(d.getFullYear(),d.getMonth()+1,1)}return[a,b]}
/** Numbers shown in the report.
 *  Opened = tickets created in the period. Resolved = tickets finished in the period.
 *  Still open and In progress = tickets opened in the period that are in that state now, so the chart bars add up to these totals.
 *  older = unresolved tickets from before the period (shown as a note). */
export function summarize(tickets,a,b,now=Date.now()){const ins=v=>v>=a&&v<b,opened=tickets.filter(k=>ins(k.created)),resolved=tickets.filter(k=>k.status==='done'&&ins(k.done)),
 progress=opened.filter(k=>k.status==='progress'),stillOpen=opened.filter(k=>isStillOpen(k,now)),fresh=opened.filter(k=>isFresh(k,now)),
 older=tickets.filter(k=>k.created<a&&(k.status==='progress'||isStillOpen(k,now))).length,
 rate=opened.length?Math.round(100*opened.filter(k=>k.status==='done').length/opened.length):0,byCat={};opened.forEach(k=>{byCat[k.cat]=(byCat[k.cat]||0)+1});
 return{opened,resolved,progress,stillOpen,fresh,older,rate,byCat}}
/** Splits the period for the Ticket Status chart: a week into 7 days (Monday to Sunday), a month into its weeks, a day stays one group.
 *  fmt(date,options) formats dates in the user's language. Each group: {label,sub,from,to,vals:[opened,stillOpen,inProgress,resolved]}. */
export function buckets(kind,a,b,tickets,now=Date.now(),fmt=(d,o)=>d.toLocaleDateString('en-US',o)){const out=[];
 if(kind==='day'){out.push({from:a,to:b,label:fmt(a,{weekday:'short'}),sub:fmt(a,{day:'numeric',month:'short'})})}
 else if(kind==='week'){for(let d=new Date(a);d<b;d.setDate(d.getDate()+1)){const e=new Date(d);e.setDate(e.getDate()+1);out.push({from:new Date(d),to:e,label:fmt(d,{weekday:'short'}),sub:fmt(d,{day:'numeric'})})}}
 else{let s=new Date(a);while(s<b){const e=new Date(s);do{e.setDate(e.getDate()+1)}while(e<b&&e.getDay()!==1);const last=new Date(e);last.setDate(last.getDate()-1);
  out.push({from:new Date(s),to:new Date(e),label:fmt(s,{day:'numeric'})+(last.getDate()!==s.getDate()?'–'+fmt(last,{day:'numeric'}):''),sub:fmt(s,{month:'short'})});s=e}}
 for(const g of out){const ins=v=>v>=g.from&&v<g.to,mine=tickets.filter(k=>ins(k.created));g.vals=[mine.length,mine.filter(k=>isStillOpen(k,now)).length,mine.filter(k=>k.status==='progress').length,tickets.filter(k=>k.status==='done'&&ins(k.done)).length]}
 return out}
