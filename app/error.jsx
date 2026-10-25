'use client';
export default function Error({error,reset}){
 return <div className="mx-auto max-w-md p-6 text-center"><h2 className="text-xl font-extrabold">Something went wrong</h2>
 <p className="my-2 text-sm text-mut">Your data is safe on this device. Try again, and if it keeps happening, erase local data and reload.</p>
 <p className="mb-3 break-words text-xs text-mut">{String(error?.message||'')}</p>
 <button className="btn mr-2" onClick={()=>reset()}>Try again</button>
 <button className="ghost" onClick={()=>{if(confirm('Erase local app data? Download a backup first if you can.')){localStorage.removeItem('xie.next.v1');location.reload()}}}>Erase local data</button></div>}
