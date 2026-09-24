document.addEventListener('DOMContentLoaded',async()=>{
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  window.scrollTo(0,0);

  const table=document.querySelector('table[data-ics]');
  if(!table)return;
  const profileNames={'eli-2026-27.ics':'Los Gatos United','eli-football-2026.ics':'Santa Cruz High','jack-2026.ics':'Soquel High JV','dane-2026.ics':'Bonita High','gracie-2026.ics':'North Alabama'};
  const profileName=profileNames[table.dataset.ics];
  const scheduleFile=(location.pathname.split('/').filter(Boolean).pop()||'').replace(/\.html$/,'')+'.html';
  // Build useful navigation from saved rows before any network dependency.
  const initialHeaders=[...table.tHead.rows[0].cells].map(cell=>cell.textContent.trim());
  const opponentColumn=initialHeaders.findIndex(name=>/Opponent/i.test(name));
  for(const row of table.tBodies[0].rows){
    const values=Object.fromEntries(initialHeaders.map((name,i)=>[name,row.cells[i]?.textContent.trim()||'']));
    const opponent=row.cells[opponentColumn]?.textContent.trim();
    if(!opponent||/\bBYE\b/i.test(opponent)||/Cancel[le]*d/i.test(row.textContent))continue;
    const query=new URLSearchParams({team:profileName||document.title,opponent:opponent.replace(/^(?:vs\.?|@)\s*/i,''),ha:values['Home/Away']==='Away'||/^@/.test(opponent)?'Away':'Home',teamPage:scheduleFile,calendar:table.dataset.ics,uid:row.dataset.eventUid||'',date:values.Date||'',venue:values.Location||'',record:document.querySelector('.record-big')?.textContent.trim()||'',recordAsOf:document.querySelector('.record-asof')?.textContent.trim()||''});
    row.dataset.gameHref='game.html?'+query;row.classList.add('game-link');
    const anchor=document.createElement('a');anchor.className='game-text-link';anchor.href=row.dataset.gameHref;anchor.textContent=opponent;anchor.setAttribute('aria-label','Open game details for '+opponent);row.cells[opponentColumn].replaceChildren(anchor);
  }
  table.addEventListener('click',event=>{if(event.target.closest('a,button,input,select'))return;const row=event.target.closest('tr[data-game-href]');if(row)location.href=row.dataset.gameHref;});
  if(!window.ScheduleTime){try{await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='schedule-time.js?v=20260924';script.onload=resolve;script.onerror=reject;document.head.appendChild(script)});}catch{return;}}
  const wrap=table.closest('.table-wrap');

  const scheduleNotice=document.querySelector('.notice:not(.injury-page)');
  if(scheduleNotice){
    const dialog=document.createElement('dialog');
    dialog.className='schedule-info-dialog';
    dialog.setAttribute('aria-labelledby','schedule-info-title');
    const title=document.createElement('h2');
    title.id='schedule-info-title';
    title.textContent='Time & schedule info';
    const content=document.createElement('div');
    content.className='schedule-info-content';
    while(scheduleNotice.firstChild)content.appendChild(scheduleNotice.firstChild);
    const close=document.createElement('button');
    close.className='schedule-info-close';
    close.type='button';
    close.textContent='Close';
    close.addEventListener('click',()=>dialog.close());
    dialog.append(title,content,close);
    scheduleNotice.replaceWith(dialog);
    document.body.appendChild(dialog);

    const trigger=document.createElement('button');
    trigger.className='schedule-info-link';
    trigger.type='button';
    trigger.textContent='Time & schedule info';
    trigger.addEventListener('click',()=>dialog.showModal());
    const actions=document.querySelector('.actions');
    if(actions)actions.insertAdjacentElement('afterend',trigger);
    else document.querySelector('main')?.prepend(trigger);
    dialog.addEventListener('click',event=>{
      if(event.target===dialog)dialog.close();
    });
  }

  const style=document.createElement('style');
  style.textContent='.record-big{font-size:clamp(2.6rem,9vw,5rem);font-weight:900;line-height:1;margin:12px 0 6px}.record-asof{margin:0;font-size:.92rem;opacity:.9}.schedule-info-link{display:block;margin:-6px 0 14px;padding:5px 2px;border:0;background:transparent;color:#315c8a;font:inherit;font-size:.9rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.schedule-info-link:focus-visible{outline:2px solid currentColor;outline-offset:3px}.schedule-info-dialog{width:min(92vw,560px);max-height:80vh;padding:22px;border:0;border-radius:14px;color:#14233b;box-shadow:0 18px 60px rgba(0,0,0,.3)}.schedule-info-dialog::backdrop{background:rgba(12,24,40,.58)}.schedule-info-dialog h2{margin:0 0 12px;font-size:1.35rem}.schedule-info-content{font-size:1rem;line-height:1.5}.schedule-info-close{width:100%;margin-top:20px;padding:12px 16px;border:0;border-radius:9px;background:#174d31;color:#fff;font:inherit;font-weight:800;cursor:pointer}.table-wrap{max-height:62vh;overflow:auto}.table-wrap thead th{position:sticky;top:0;z-index:3}.stream-link{font-weight:700;color:inherit;text-decoration:underline;text-underline-offset:2px;white-space:nowrap}.team-text-link,.game-text-link{position:relative;z-index:2;display:inline-block;padding:4px 7px;color:#fff3ce;background:#174d31;border:1px solid #c69339;border-radius:4px;font-weight:900;line-height:1.15;text-decoration:none}.team-text-link:hover,.team-text-link:focus-visible,.game-text-link:hover,.game-text-link:focus-visible{color:#fff;background:#0a2f1d;outline:2px solid #c12622;outline-offset:1px}.game-text-link:after{content:"  ›";color:#f0bd50}tbody tr.game-link{cursor:pointer}tbody tr.game-link:hover td{filter:brightness(.97)}';
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

  const events=ScheduleTime.parse(text).map(ev=>({...ev,home:/\bvs\.?\s/i.test(ev.summary)||/\bHome(?:\.|\s|$)/i.test(ev.description)}));
  const byUid=new Map(events.map(ev=>[ev.uid,ev]));

  const explicitStreams=(table.dataset.streams||'').split('|').map(s=>s.trim());
  const streamDefault=(table.dataset.streamDefault||'').trim();
  const streamMode=(table.dataset.streamMode||'').trim();
  const streamUrl=(table.dataset.streamUrl||'').trim();
  const destinations={
    'NFL+':'https://www.nfl.com/plus/',
    'Paramount+':'https://www.paramountplus.com/live-tv/',
    'Peacock':'https://www.peacocktv.com/sports/nfl',
    'ESPN':'https://www.espn.com/watch/',
    'ESPN+':'https://www.espn.com/watch/',
    'ESPN Watch':'https://www.espn.com/watch/',
    'Prime Video':'https://www.amazon.com/gp/video/storefront?contentType=merch&contentId=TNF',
    'Netflix':'https://www.netflix.com/',
    'NFHS Network':'https://www.nfhsnetwork.com/',
    'Hudl':'https://fan.hudl.com/'
  };
  const inferNflStream=(values,isBye)=>{
    if(isBye)return '—';
    const s=Object.values(values).join(' ');
    if(/\bTBD\b/i.test(s))return 'TBD';
    if(/Prime Video/i.test(s))return 'Prime Video · NFL+';
    if(/Netflix/i.test(s))return 'Netflix · NFL+';
    if(/NBC/i.test(s))return 'Peacock · NFL+';
    if(/ESPN|ABC/i.test(s))return 'ESPN · NFL+';
    if(/CBS/i.test(s))return 'Paramount+ · NFL+';
    if(/FOX/i.test(s))return 'NFL+';
    return 'NFL+';
  };

  let headers=[...originalHeaders];
  if(!headers.includes('Pacific')&&!headers.includes('Time (PT)'))headers.push('Pacific');
  if(!headers.includes('Eastern'))headers.splice(headers.indexOf('Pacific')>=0?headers.indexOf('Pacific')+1:headers.indexOf('Time (PT)')+1,0,'Eastern');
  const dateIdx=headers.indexOf('Date');
  if(!headers.includes('Day')&&dateIdx>=0)headers.splice(dateIdx+1,0,'Day');
  if(!headers.includes('Location')){
    let insert=headers.findIndex(h=>/Result|Status|Pacific|Mountain|Central/.test(h));
    if(insert<0)insert=headers.length;
    headers.splice(insert,0,'Location');
  }
  if(!headers.includes('Stream')){
    let insert=headers.findIndex(h=>/Result|Status/.test(h));
    if(insert<0)insert=headers.length;
    headers.splice(insert,0,'Stream');
  }

  const headRow=table.tHead.rows[0];
  headRow.innerHTML='';
  headers.forEach(h=>{const th=document.createElement('th');th.textContent=h;headRow.appendChild(th)});

  const teamColor=getComputedStyle(headRow.cells[0]).backgroundColor;
  const match=teamColor.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)/i);
  let homeTint='rgb(224,233,244)';
  if(match){
    const mix=.26;
    const r=Math.round(255-(255-Number(match[1]))*mix);
    const g=Math.round(255-(255-Number(match[2]))*mix);
    const b=Math.round(255-(255-Number(match[3]))*mix);
    homeTint=`rgb(${r}, ${g}, ${b})`;
  }

  const pageTitle=(document.querySelector('header h1')?.textContent||document.title).replace(/^\\W+/,'').trim();
  const record=(document.querySelector('.record-big')?.textContent||'').trim();
  const sport=(document.querySelector('header p:not(.record-big):not(.record-asof)')?.textContent||pageTitle).trim();
  const teamName=pageTitle.replace(/\\s+[—-]\\s+2026.*$/,'').replace(/\\s+[—-]\\s+.*Football.*$/,'').replace(/\\s+[—-]\\s+Los Gatos United.*$/,'').trim();
  const resultHeader=originalHeaders.find(h=>/Result|Status/.test(h))||'';
  const opponentHeader=originalHeaders.find(h=>/Opponent/.test(h))||'Opponent';
  const haHeader=originalHeaders.includes('Home/Away')?'Home/Away':'';
  const timeHeader=originalHeaders.find(h=>/Pacific|Mountain|Central|Time/.test(h))||'';
  const teamRecord=record||'Record TBD';
  const currentSchedule=location.pathname.split('/').pop()||'';
  const opponentRecords={
    'Pajaro Valley':'2–1–0',
    'West Georgia':'0–5–2',
    'Davis Legacy':'Record TBD',
    'Colony':'Record TBD',
    'Hollister':'Record TBD'
  };

  let ei=0;
  let sourceRowIndex=0;
  const rendered=[];
  for(const item of originalRows){
    const {row,values}=item;
    const isBye=/\bBYE\b/i.test(row.textContent);
    const ev=isBye?null:row.dataset.eventUid?byUid.get(row.dataset.eventUid):events[ei++];
    if(row.dataset.eventUid&&!ev){row.hidden=true;continue;}
    const newValues={...values};
    if(ev){
      newValues.Date=ev.dateKey||'TBD';
      Object.assign(newValues,ev.times);
      if(ev.status==='CANCELLED') { newValues[resultHeader]='Canceled'; row.classList.add('canceled'); }
    }
    newValues.Day=isBye?'—':(ev?ev.day:'TBD');
    newValues.Location=isBye?'—':(ev?ev.location:(values.Location||'TBD'));

    let stream='';
    if(explicitStreams[sourceRowIndex]) stream=explicitStreams[sourceRowIndex];
    else if(streamMode==='nfl') stream=inferNflStream(values,isBye);
    else if(streamDefault) stream=(isBye||/Canceled/i.test(Object.values(values).join(' ')))?'—':streamDefault;
    else stream=isBye?'—':'TBD';
    newValues.Stream=stream;
    sourceRowIndex++;

    row.innerHTML='';
    headers.forEach(h=>{
      const td=document.createElement('td');
      const value=newValues[h]??'';
      if(h==='Stream'&&value&&!['—','TBD'].includes(value)){
        const labels=value.split('·').map(x=>x.trim()).filter(Boolean);
        labels.forEach((label,i)=>{
          if(i)td.appendChild(document.createTextNode(' · '));
          const a=document.createElement('a');
          a.className='stream-link';
          a.textContent=label;
          a.href=(streamUrl&&labels.length===1)?streamUrl:(destinations[label]||'#');
          a.target='_blank';
          a.rel='noopener noreferrer';
          td.appendChild(a);
        });
      }else{
        td.textContent=value;
      }
      row.appendChild(td);
    });
    if(ev&&ev.home){
      row.dataset.home='true';
      [...row.cells].forEach(td=>td.style.backgroundColor=homeTint);
    }
    if(ev){
      rendered.push({row,ev});
      const opponent=(values[opponentHeader]||'').replace(/^vs\\.?\\s+|^@\\s*/i,'').trim();
      const ha=haHeader?(values[haHeader]||''):(/^@/.test(values[opponentHeader]||'')?'Away':'Home');
      const status=resultHeader?(values[resultHeader]||''):'';
      const completed=/^[WLT]\\s|Final/i.test(status);
      const canceled=/Canceled/i.test(status);
      if(opponent&&!/BYE/i.test(opponent)&&!canceled){
        const params=new URLSearchParams({
          team:profileName||teamName||pageTitle,
          opponent,
          ha:ha==='Away'?'Away':'Home',
          date:newValues.Date||ev.dateKey||'',
          uid:ev.uid,calendar:table.dataset.ics,
          time:ev.times?`${ev.times.Pacific} / ${ev.times.Eastern}`:(timeHeader?(values[timeHeader]||''):''),
          venue:newValues.Location||'',
          stream:newValues.Stream||'TBD',
          record:teamRecord,
          oppRecord:opponentRecords[opponent]||'Record TBD',
          sport,
          status,
          completed:completed?'1':'0',
          teamPage:scheduleFile,
          share:'2'
        });
        const gameHref='game.html?'+params.toString();
        row.classList.add('game-link');
        row.title='Open game details and analysis';

        const oppIndex=headers.indexOf(opponentHeader);
        if(oppIndex>=0&&row.cells[oppIndex]){
          const cell=row.cells[oppIndex];
          cell.textContent='';
          const a=document.createElement('a');
          a.className='game-text-link';
          a.href=gameHref;
          a.textContent=values[opponentHeader]||opponent;
          a.setAttribute('aria-label','Open game details and analysis for '+opponent);
          cell.appendChild(a);
        }

        row.dataset.gameHref=gameHref;
      }
    }
  }

  if(!location.hash&&wrap){
    const now=new Date();
    const today=ScheduleTime.parts(now,ScheduleTime.pacific).slice(0,10);
    const next=rendered.find(({ev})=>ev.dateKey&&ev.dateKey>=today&&ev.status!=='CANCELLED');
    if(next){
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const rowTop=next.row.getBoundingClientRect().top-table.getBoundingClientRect().top+wrap.scrollTop;
        const headerH=table.tHead.getBoundingClientRect().height;
        wrap.scrollTop=Math.max(0,rowTop-headerH);
        window.scrollTo(0,0);
      }));
    }
  }
});
