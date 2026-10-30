document.addEventListener('DOMContentLoaded',async()=>{
  const {orderSchedule,schedulePhase}=await import('./platform/schedule-order.mjs?v=20261018');
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  window.scrollTo(0,0);

  const table=document.querySelector('table[data-ics]');
  if(!table)return;
  const athleteProfiles={
    'dane-2026.ics':{name:'Dane Gosserand',summary:'MaxPreps currently includes Dane’s individual statistics for 1 of Bonita’s 8 completed games. These are partial coach-entered totals, not a full-season line.',stats:[['Games with player stats','1 of 8'],['Receptions','4'],['Receiving yards','44'],['Yards per catch','11.0'],['Total tackles','5'],['Interceptions','1']],updated:'publisher updated October 3, 2026',source:'https://www.maxpreps.com/ca/la-verne/bonita-bearcats/athletes/dane-gosserand/football/stats/?careerid=6r9nl301cefo8'},
    'gracie-2026.ics':{name:'Gracie Tyrrell',summary:'Latest complete UNA season (2025); UNA has not published a 2026 individual stat table yet',stats:[['Games / starts','19 / 19'],['Minutes','1,637'],['Shots','16'],['Shots on goal','6'],['Goals','1'],['Assists','1']],updated:'official profile checked October 8, 2026',source:'https://roarlions.com/sports/womens-soccer/roster/gracie-tyrrell/4528'},
    'jack-2026.ics':{name:'Jack Harn',unavailable:'Soquel JV does not publish a verified individual player stat line on its checked public team source.',source:'https://www.maxpreps.com/ca/soquel/soquel-knights/football/jv/'},
    'eli-football-2026.ics':{name:'Elijah (Eli) Landig',unavailable:'Santa Cruz does not publish a verified football stat line for Elijah Landig on its checked public team source.',source:'https://www.maxpreps.com/ca/santa-cruz/santa-cruz-cardinals/football/'},
    'eli-santa-cruz-soccer-2026-27.ics':{name:'Elijah (Eli) Landig',summary:'Latest complete Santa Cruz High season (2025–26); 2026–27 individual statistics are not published yet',stats:[['Games played','17'],['Goals','1'],['Assists','4'],['Points','6'],['Points per game','0.353']],updated:'official team statistics checked October 8, 2026',source:'https://www.maxpreps.com/ca/soccer/winter/25-26/league/santa-cruz-coast/stat-leaders/points/assts/?leagueid=fcc24cf1-d45a-4836-93c0-fa8cff48f606'},
    'eli-2026-27.ics':{name:'Elijah (Eli) Landig',unavailable:'Los Gatos United does not publish a verified individual stat line for Elijah Landig on its checked public schedule source.',source:'https://www.losgatosunited.com/'}
  };
  const athlete=athleteProfiles[table.dataset.ics];
  if(athlete){
    const section=document.createElement('section');section.className='athlete-stats';section.setAttribute('aria-labelledby','athlete-stats-title');
    Object.assign(section.style,{background:'#fff',border:'1px solid #d7dee7',borderRadius:'12px',padding:'16px',margin:'0 0 18px'});
    const heading=document.createElement('h2');heading.id='athlete-stats-title';heading.textContent=athlete.name+' — athlete stats';heading.style.margin='0 0 8px';section.append(heading);
    const summary=document.createElement('p');summary.textContent=athlete.unavailable||athlete.summary;summary.style.margin='0 0 12px';section.append(summary);
    if(athlete.stats){
      const grid=document.createElement('dl');Object.assign(grid.style,{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(125px,1fr))',gap:'10px',margin:'0 0 12px'});
      const fillStats=stats=>{grid.replaceChildren();for(const [label,value] of stats){const item=document.createElement('div');Object.assign(item.style,{background:'#f3f6f9',padding:'10px',borderRadius:'8px'});const dt=document.createElement('dt');dt.textContent=label;dt.style.fontSize='.85rem';const dd=document.createElement('dd');dd.textContent=value;Object.assign(dd.style,{margin:'3px 0 0',fontSize:'1.35rem',fontWeight:'700'});item.append(dt,dd);grid.append(item)}};
      fillStats(athlete.stats);
      section.append(grid);
      if(table.dataset.ics==='dane-2026.ics')fetch('/api/athlete-stats?teamPage=dane',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(data=>{if(!data)return;summary.textContent=data.summary;fillStats(data.stats);source.textContent=`Official player source · Publisher updated ${data.publishedAt} · Checked ${new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(data.checkedAt))} ↗`;}).catch(()=>{});
    }
    const source=document.createElement('a');source.href=athlete.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent=`Official player/team source${athlete.updated?' · '+athlete.updated:''} ↗`;section.append(source);
    table.closest('.table-wrap').before(section);
  }
  const teamStatsStyle=document.createElement('style');teamStatsStyle.textContent='.team-leader-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:8px;margin-top:12px}.team-leader-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;min-height:72px;padding:10px;color:inherit;background:#f3f6f9;border-radius:9px;text-decoration:none}.team-leader-card img{width:48px;height:48px;border-radius:50%;object-fit:cover}.team-leader-card span,.team-leader-card small,.team-leader-card strong{display:block}.team-leader-card>span>small:first-child{color:#526273;font-weight:800}.team-leader-card b{font-size:1.1rem;text-align:right}.team-leader-source{margin:12px 0 0;font-size:.85rem}@media(max-width:520px){.team-leader-grid{grid-template-columns:1fr}}';document.head.append(teamStatsStyle);
  const statsPages={'dane-2026.ics':'dane.html','eli-football-2026.ics':'eli-football.html','jack-2026.ics':'jack.html','eli-santa-cruz-soccer-2026-27.ics':'eli-santa-cruz-soccer.html'};
  const statsPage=statsPages[table.dataset.ics];
  if(statsPage){
    const section=document.createElement('section');section.className='team-leaders';section.setAttribute('aria-labelledby','team-leaders-title');Object.assign(section.style,{background:'#fff',border:'1px solid #d7dee7',borderRadius:'12px',padding:'16px',margin:'0 0 18px'});
    const heading=document.createElement('h2');heading.id='team-leaders-title';heading.textContent='Team leaders';heading.style.margin='0 0 6px';const status=document.createElement('p');status.textContent='Checking current MaxPreps leaders…';status.style.margin='0';status.setAttribute('role','status');const grid=document.createElement('div');grid.className='team-leader-grid';const source=document.createElement('p');source.className='team-leader-source';section.append(heading,status,grid,source);table.closest('.table-wrap').before(section);
    fetch('/api/team-stats?'+new URLSearchParams({teamPage:statsPage}),{cache:'no-store'}).then(response=>response.ok?response.json():null).then(data=>{
      if(!data)return;grid.replaceChildren();const athleteSection=document.querySelector('.athlete-stats'),athleteRows=data.athlete?.rankings||[];if(athleteSection&&athleteRows.length){const primary=athleteRows[0],peers=(data.rankings||[]).filter(row=>row.category===primary.category).slice(0,3),summary=athleteSection.querySelector('p');summary.textContent=`${data.athlete.name} is No. ${primary.rank} on ${data.team} in ${primary.category.toLowerCase()} at ${primary.value} ${primary.unit}.`;let comparison=athleteSection.querySelector('.athlete-comparison');if(!comparison){comparison=document.createElement('div');comparison.className='athlete-comparison';const stats=athleteSection.querySelector('dl');stats?stats.before(comparison):athleteSection.append(comparison)}comparison.replaceChildren();const title=document.createElement('strong');title.textContent=`How ${data.athlete.name} compares`;comparison.append(title);for(const row of peers){const line=document.createElement('p');line.textContent=`${row.rank}. ${row.name} — ${row.value} ${row.unit}`;if(row.name===data.athlete.name)line.style.fontWeight='900';comparison.append(line)}}if(!data.leaders?.length){status.textContent=`MaxPreps does not currently publish team leaders for ${data.team}.`;const anchor=document.createElement('a');anchor.href=data.sourceUrl;anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.textContent='Checked MaxPreps team statistics ↗';source.replaceChildren(anchor);return}status.textContent=data.updated?`Publisher updated ${data.updated}`:'Current coach-entered MaxPreps statistics';
      for(const leader of data.leaders){const card=document.createElement('a');card.href=leader.href||data.sourceUrl;card.target='_blank';card.rel='noopener noreferrer';card.className='team-leader-card';const copy=document.createElement('span'),category=document.createElement('small'),name=document.createElement('strong'),detail=document.createElement('small'),value=document.createElement('b');category.textContent=leader.category;name.textContent=leader.name;detail.textContent=leader.detail;value.textContent=[leader.value,leader.unit].filter(Boolean).join(' ');copy.append(category,name,detail);if(leader.image){const image=document.createElement('img');image.src=leader.image;image.alt='';image.loading='lazy';card.append(image)}card.append(copy,value);grid.append(card)}
      const anchor=document.createElement('a');anchor.href=data.sourceUrl;anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.textContent='MaxPreps team statistics';source.replaceChildren(anchor,` · Checked ${new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(data.checkedAt))}`);
    }).catch(()=>{status.textContent='Team leaders could not be refreshed.'});
  }
  const actions=document.querySelector('.actions');
  const standingsKeys={'gracie-2026.ics':'gracie','dane-2026.ics':'dane','eli-2026-27.ics':'eli','eli-football-2026.ics':'eli-football','jack-2026.ics':'jack'};
  if(actions&&standingsKeys[table.dataset.ics]&&!actions.querySelector('[data-standings]')){
    const standings=document.createElement('a');standings.className='button back';standings.dataset.standings='true';standings.href='standings.html?team='+standingsKeys[table.dataset.ics];standings.textContent='📊 Division Standings';actions.append(standings);
  }
  const profileNames={'eli-2026-27.ics':'Los Gatos United','eli-santa-cruz-soccer-2026-27.ics':'Santa Cruz High','eli-football-2026.ics':'Santa Cruz High','jack-2026.ics':'Soquel High JV','dane-2026.ics':'Bonita High','gracie-2026.ics':'North Alabama'};
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
    'West Georgia':'0–6–2',
    'UC San Diego':'5–2–2',
    'Davis Legacy':'Record TBD',
    'Colony':'1–4–0',
    'Hollister':'5–0–0',
    'Austin Peay':'1–9–1',
    'Eastern Kentucky':'7–4–1',
    'Seaside':'3–2–0',
    'Marina':'2–3–0'
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
      rendered.push({row,ev,completed:/^(?:W|L|T)\s+\d|Final/i.test(values[resultHeader]||'')});
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
          share:'5'
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

  const describe=item=>({...item.ev,completed:item.completed});
  const reorder=()=>{
    for(const item of orderSchedule(rendered,describe))table.tBodies[0].appendChild(item.row);
    // Unmatched entries such as byes follow real games rather than hiding the next game.
    for(const {row} of originalRows)if(!rendered.some(item=>item.row===row))table.tBodies[0].appendChild(row);
    if(wrap)wrap.scrollTop=0;
  };
  reorder();
  setInterval(reorder,60000);
});
