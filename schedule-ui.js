document.addEventListener('DOMContentLoaded',async()=>{
  const table=document.querySelector('table[data-ics]');
  if(!table)return;

  const style=document.createElement('style');
  style.textContent='.record-big{font-size:clamp(2.6rem,9vw,5rem);font-weight:900;line-height:1;margin:12px 0 6px}.record-asof{margin:0;font-size:.92rem;opacity:.9}';
  document.head.appendChild(style);

  const originalHeaders=[...table.tHead.rows[0].cells].map(c=>c.textContent.trim());
  const originalRows=[...table.tBodies[0].rows].map(row=>({
    row,
    values:Object.fromEntries(originalHeaders.map((h,i)=>[h,row.cells[i]?row.cells[i].textContent:'']))
  }));

  let text='';
  try{
    text=await fetch(table.dataset.ics,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.text()});
  }catch(e){
    console.warn('Schedule feed unavailable',e);
    return;
  }

  text=text.replace(/\r?\n[ \t]/g,'');
  const events=[...text.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)].map(m=>{
    const lines=m[1].split(/\r?\n/);
    const get=n=>{const l=lines.find(x=>x.startsWith(n+':')||x.startsWith(n+';'));return l?l.slice(l.indexOf(':')+1):''};
    const raw=get('DTSTART');
    const d=(raw.match(/(\d{8})/)||[])[1]||'';
    let day='TBD';
    if(d){
      const dt=new Date(Date.UTC(+d.slice(0,4),+d.slice(4,6)-1,+d.slice(6,8)));
      day=dt.toLocaleDateString('en-US',{weekday:'long',timeZone:'UTC'});
    }
    const clean=s=>s.replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\n/g,' ').replace(/\\\\/g,'\\');
    const loc=clean(get('LOCATION'));
    return{day,location:loc?loc.split(',')[0].trim():'TBD'};
  });

  let headers=[...originalHeaders];
  const dateIdx=headers.indexOf('Date');
  if(!headers.includes('Day')&&dateIdx>=0)headers.splice(dateIdx+1,0,'Day');
  if(!headers.includes('Location')){
    let insert=headers.findIndex(h=>/Result|Status|Pacific|Mountain|Central/.test(h));
    if(insert<0)insert=headers.length;
    headers.splice(insert,0,'Location');
  }

  const headRow=table.tHead.rows[0];
  headRow.innerHTML='';
  headers.forEach(h=>{const th=document.createElement('th');th.textContent=h;headRow.appendChild(th)});

  let ei=0;
  for(const item of originalRows){
    const {row,values}=item;
    const isBye=/\bBYE\b/i.test(row.textContent);
    const ev=isBye?null:events[ei++];
    const newValues={...values};
    newValues.Day=isBye?'—':(ev?ev.day:'TBD');
    newValues.Location=isBye?'—':(ev?ev.location:(values.Location||'TBD'));
    row.innerHTML='';
    headers.forEach(h=>{const td=document.createElement('td');td.textContent=newValues[h]??'';row.appendChild(td)});
  }
});