'use client';
import {useEffect,useRef,useState} from 'react';
/** Table-style form dialog. fields: [{k,label,type:'text'|'area'|'select',req,help,ph,options:[[value,label]],def,rows}] */
export default function FormDialog({title,hint,fields,saveLabel='Save',cancelLabel='Cancel',closeLabel='Close',reqMsg='Please fill in the fields marked with *.',onSave,onClose}){
 const [v,setV]=useState(()=>Object.fromEntries(fields.map(f=>[f.k,f.def??''])));
 const [bad,setBad]=useState([]);const first=useRef(null);
 useEffect(()=>{first.current?.focus();const k=e=>e.key==='Escape'&&onClose();addEventListener('keydown',k);document.body.style.overflow='hidden';return()=>{removeEventListener('keydown',k);document.body.style.overflow=''}},[]);
 const set=(k,x)=>{setV(p=>({...p,[k]:x}));setBad(b=>b.filter(y=>y!==k))};
 const save=e=>{e.preventDefault();const b=fields.filter(f=>f.req&&!String(v[f.k]).trim()).map(f=>f.k);setBad(b);if(b.length)return;
  onSave(Object.fromEntries(Object.entries(v).map(([k,x])=>[k,typeof x==='string'?x.trim():x])));onClose()};
 return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
  <form onSubmit={save} noValidate role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl">
   <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-white"><h2 className="text-lg font-extrabold">{title}</h2>
    <button type="button" aria-label={closeLabel} className="rounded-full bg-white/20 px-2.5 py-1" onClick={onClose}>✕</button></div>
   <div className="overflow-auto p-4">{hint&&<p className="mb-2 text-sm text-mut">{hint}</p>}
    <table className="w-full border-separate border-spacing-y-2"><tbody>{fields.map((f,i)=>{const id='f-'+f.k,c='inp '+(bad.includes(f.k)?'!border-bad':''),p={id,className:c,value:v[f.k],placeholder:f.ph,'aria-invalid':bad.includes(f.k)||undefined,ref:i===0?first:undefined,onChange:e=>set(f.k,e.target.value)};
     return <tr key={f.k} className="align-top"><th scope="row" className="w-[34%] pr-3 pt-2.5 text-left text-sm font-bold"><label htmlFor={id}>{f.label}{f.req&&<span className="text-bad"> *</span>}</label>{f.help&&<span className="mt-0.5 block text-xs font-normal text-mut">{f.help}</span>}</th>
      <td>{f.type==='select'?<select {...p}>{f.options.map(o=><option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>:f.type==='area'?<textarea rows={f.rows||4} {...p}/>:<input type={f.type==='datetime'?'datetime-local':'text'} {...p}/>}</td></tr>})}</tbody></table>
    {bad.length>0&&<p className="text-sm font-bold text-bad" role="alert">{reqMsg}</p>}</div>
   <div className="flex justify-end gap-2 border-t border-line bg-card p-3"><button type="button" className="ghost" onClick={onClose}>{cancelLabel}</button><button className="btn">{saveLabel}</button></div></form></div>}
