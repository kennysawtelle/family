import { teams, resolveTeamPage } from './game-teams.mjs';
import { matchupSides } from './game-matchup.mjs';
import { ncaaSoccerRecords, schoolKey } from './game-records.mjs?v=20260924';
const q = new URLSearchParams(location.search);
const teamPage = resolveTeamPage(q), profile = teams[teamPage];
const opponent = q.get('opponent') || '', date = q.get('date') || '';
const sides = matchupSides(q);
const team = profile?.name || q.get('team') || '', away = sides.away.name, home = sides.home.name;
const matchup = `${away} at ${home}`;
const el = id => document.getElementById(id);
let freshGame = false, busy = false, researchDate = date;
const gameStatus = (q.get('status') || '').trim();
const resultMatch = /^([WLT])\s*(.*)$/i.exec(gameStatus);
const ownResult = resultMatch ? `${resultMatch[1].toUpperCase()}${resultMatch[2] ? ` ${resultMatch[2]}` : ''}` : '';
const scoreMatch = resultMatch?.[2].match(/^(\d+)\s*[-–]\s*(\d+)$/);
const opponentScore = scoreMatch ? `${scoreMatch[2]}–${scoreMatch[1]}` : resultMatch?.[2] || '';
const opponentResult = resultMatch ? `${({W:'L',L:'W',T:'T'})[resultMatch[1].toUpperCase()]}${opponentScore ? ` ${opponentScore}` : ''}` : '';
const ownSide = q.get('ha') === 'Away' ? 'away' : 'home';
document.title = `${matchup} | Sawtelle Family Sports`;
el('sport').textContent = profile?.sport || '';
el('awayLink').textContent = away; el('homeLink').textContent = home;
for (const side of ['away', 'home']) {
  const result = side === ownSide ? ownResult : opponentResult;
  el(side + 'Record').textContent = sides[side].record || (result ? `Game: ${result}` : profile?.sport === "Women's soccer" || /football/i.test(profile?.sport || '') ? 'Checking current record…' : 'Official record unavailable');
  el(side + 'RecordDate').textContent = sides[side].record ? sides[side].asOf : result ? 'Final result' : '';
}
async function refreshRecords() {
  if (profile?.sport !== "Women's soccer") return;
  try {
    const response = await fetch('/api/ncaa-wsoc?category=60', { cache: 'no-store' });
    if (!response.ok) return;
    const current = await response.json(), records = ncaaSoccerRecords(current.rows);
    for (const side of ['away', 'home']) {
      const found = records.get(schoolKey(sides[side].name));
      if (!found) continue;
      el(side + 'Record').textContent = found.record;
      el(side + 'RecordDate').textContent = 'Current NCAA record · Updated ' + new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(current.checkedAt));
    }
  } catch { /* Keep the saved record or final result when NCAA is offline. */ }
}
const primaryLink = profile ? teamPage : 'index.html';
const opponentLink = 'team.html?' + new URLSearchParams({ name: opponent, sport: profile?.sport || '' });
el('backTeam').href = primaryLink;
el('backTeam').textContent = profile ? `← ${profile.name}` : '← Family Sports';
el('backTeam').setAttribute('aria-label', profile ? `Return to ${profile.name} team page` : 'Return to Family Sports');
el('awayLink').href = q.get('ha') === 'Away' ? primaryLink : opponentLink;
el('homeLink').href = q.get('ha') === 'Away' ? opponentLink : primaryLink;
el('snapshot').textContent = [matchup, date, gameStatus && (resultMatch ? `Final: ${gameStatus}` : gameStatus), q.get('venue')].filter(Boolean).join(' · ');
el('research-status').textContent = `Checking ${matchup}…`;

function link(label, url) {
  const a = document.createElement('a'); a.textContent = label; a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
}
function timeText(instant) {
  return ['America/Los_Angeles', 'America/New_York'].map(timeZone => new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(instant))).join(' / ');
}
const liveStatLabels = [['Shots', 'Shots'], ['OnGoal', 'Shots on goal'], ['Corners', 'Corners'], ['Saves', 'Saves'], ['Fouls', 'Fouls'], ['YellowCard', 'Yellow cards'], ['RedCard', 'Red cards']];
const comparisonCategories = [['60', 'Record'], ['56', 'Goals per game'], ['58', 'Goals allowed per game'], ['984', 'Shots per game'], ['986', 'Shots on goal per game']];
function comparisonTable(rows) {
  const table=document.createElement('table');table.className='stats-table';
  const header=document.createElement('tr');
  for(const value of ['Season stats',away,home]){const th=document.createElement('th');th.textContent=value;header.append(th)}
  const thead=document.createElement('thead');thead.append(header);table.append(thead);
  const body=document.createElement('tbody');
  for(const row of rows){const tr=document.createElement('tr');for(const value of row){const td=document.createElement('td');td.textContent=value;tr.append(td)}body.append(tr)}
  table.append(body);return table;
}
async function refreshTeamComparison(){
  const status=el('comparison-status'),content=el('team-comparison'),source=el('comparison-source');
  const recordRow=['Record',el('awayRecord').textContent||'Checking…',el('homeRecord').textContent||'Checking…'];
  if(profile?.sport!=="Women's soccer"){
    status.textContent='';content.replaceChildren(comparisonTable([recordRow]));
    source.textContent='Additional comparable team statistics are not published by the checked team sources.';return;
  }
  try{
    const sets=await Promise.all(comparisonCategories.map(([category])=>fetch('/api/ncaa-wsoc?category='+category,{cache:'no-store',signal:AbortSignal.timeout(12000)}).then(r=>r.ok?r.json():null)));
    const rows=[];
    for(let i=0;i<sets.length;i++){
      const data=sets[i];if(!data)continue;
      const find=name=>data.rows.find(row=>schoolKey(row[1])===schoolKey(name));
      const a=find(away),h=find(home);if(!a&&!h)continue;
      const value=row=>!row?'Not published':comparisonCategories[i][0]==='60'?`${row[2]}–${row[3]}–${row[4]}`:row[row.length-1];
      rows.push([comparisonCategories[i][1],value(a),value(h)]);
    }
    content.replaceChildren(comparisonTable(rows.length?rows:[recordRow]));status.textContent='';
    const checked=sets.find(Boolean)?.checkedAt;source.replaceChildren(link(`NCAA Division I team statistics${checked?' · Updated '+new Intl.DateTimeFormat('en-US',{dateStyle:'medium'}).format(new Date(checked)):''} ↗`,'https://www.ncaa.com/stats/soccer-women/d1'));
  }catch{status.textContent='Current comparable team statistics could not be verified.';content.replaceChildren(comparisonTable([recordRow]));source.textContent='';}
}
function renderLiveGame(game) {
  const card = el('live-card'); card.hidden = false; card.dataset.state = game.state;
  el('live-badge').textContent = game.state === 'final' ? 'Final' : game.state === 'live' ? 'Live' : 'Upcoming';
  el('live-away-name').textContent = game.away.name; el('live-home-name').textContent = game.home.name;
  el('live-away-score').textContent = game.away.score ?? '—'; el('live-home-score').textContent = game.home.score ?? '—';
  el('live-status').textContent = game.status;
  const stats = el('live-stats'); stats.replaceChildren();
  const availableStats = liveStatLabels.filter(([key]) => game.awayStats[key] != null || game.homeStats[key] != null);
  if (availableStats.length) {
    const table = document.createElement('table'); table.className = 'stats-table';
    const headRow = document.createElement('tr');
    for (const value of ['Team stats', game.away.name, game.home.name]) { const th = document.createElement('th'); th.textContent = value; headRow.append(th); }
    const thead = document.createElement('thead'); thead.append(headRow); table.append(thead);
    const tbody = document.createElement('tbody');
    for (const [key, label] of availableStats) {
      const row = document.createElement('tr');
      for (const value of [label, game.awayStats[key] ?? '—', game.homeStats[key] ?? '—']) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }
      tbody.append(row);
    }
    table.append(tbody); stats.append(table);
  }
  const scoring = el('live-scoring'); scoring.replaceChildren();
  if (game.scoring.length) {
    const heading = document.createElement('h3'); heading.textContent = 'Scoring';
    const list = document.createElement('ol'); list.className = 'scoring-list';
    for (const play of game.scoring) { const item = document.createElement('li'); item.textContent = `${play.period === 1 ? '1st' : play.period === 2 ? '2nd' : `Period ${play.period}`} ${play.clock} — ${play.narrative}`; list.append(item); }
    scoring.append(heading, list);
  }
  if (game.notes?.length) {
    const heading = document.createElement('h3'); heading.textContent = 'What to know';
    const list = document.createElement('ul'); list.className = 'detail-list';
    for (const note of game.notes) { const item = document.createElement('li'); item.textContent = note; list.append(item); }
    scoring.append(heading, list);
    if (game.previewUrl) { const source = document.createElement('p'); source.append(link(`${game.previewTitle || 'Official match preview'} ↗`, game.previewUrl)); scoring.append(source); }
  }
  const details = el('verified-details'); details.replaceChildren();
  for (const value of [game.attendance != null ? `Attendance: ${game.attendance.toLocaleString()}` : '', game.officials]) if (value) { const item = document.createElement('li'); item.textContent = value; details.append(item); }
  el('live-source').replaceChildren(link(`${game.source} · Updated ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(game.checkedAt))} ↗`, game.sourceUrl));
  if (game.state === 'final') el('snapshot').textContent = `${game.away.name} ${game.away.score} at ${game.home.name} ${game.home.score} · Final · ${game.venue}`;
}
async function refreshLiveGame() {
  try {
    const response = await fetch('/api/family-live-game?' + new URLSearchParams({ teamPage: teamPage.replace(/\.html$/, ''), opponent, date }), { cache: 'no-store', signal: AbortSignal.timeout(9000) });
    if (!response.ok) return;
    const game = await response.json();
    if (game.available) renderLiveGame(game);
    else if (game.configured && game.sourceUrl) renderOfficialLiveLink(game);
  } catch { /* The saved game page remains available when live stats are offline. */ }
}
function renderOfficialLiveLink(game) {
  const card = el('live-card');
  if (!card || !card.hidden) return;
  card.hidden = false; card.dataset.state = 'upcoming';
  el('live-badge').textContent = 'Official tracker';
  el('live-away-name').textContent = away; el('live-home-name').textContent = home;
  el('live-away-score').textContent = '—'; el('live-home-score').textContent = '—';
  el('live-status').textContent = 'Live stats open on the official game tracker';
  el('live-stats').replaceChildren(); el('live-scoring').replaceChildren(); el('verified-details').replaceChildren();
  el('live-source').replaceChildren(link(`${game.source} ↗`, game.sourceUrl));
}
async function refreshSchedule() {
  if (!profile || !q.get('uid')) return;
  try {
    const r = await fetch(profile.calendar, { cache: 'no-store' }); if (!r.ok) return;
    const event = ScheduleTime.parse(await r.text()).find(item => item.uid === q.get('uid'));
    if (event?.dateKey && event.dateKey !== researchDate) { researchDate = event.dateKey; freshGame = false; }
    if (event && !freshGame) el('meta').textContent = [event.dateKey, event.times.Pacific + ' / ' + event.times.Eastern, event.location, event.status === 'CANCELLED' ? 'Canceled' : ''].filter(Boolean).join(' · ');
  } catch { /* Saved schedule stays available when a source is offline. */ }
}
async function refresh() {
  if (busy) return;
  busy = true; el('refresh').disabled = true;
  try {
    await refreshSchedule();
    const response = await fetch('/api/game-research?' + new URLSearchParams({ teamPage, opponent, date: researchDate, fresh: Date.now() }), { signal: AbortSignal.timeout(10000), cache: 'no-store' });
    if (!response.ok) throw new Error();
    const data = await response.json();
    const content = el('research-results'); content.replaceChildren();
    if (data.game) {
      freshGame = true;
      const game = data.game;
      setGameDetail(game.cancelled ? `${matchup} — Canceled` : game.detail || game.title, game.sourceUrl);
      el('meta').textContent = [timeText(game.kickoff), game.venue].filter(Boolean).join(' · ');
      el('snapshot-source').replaceChildren(link(`Source: ${game.source}`, game.sourceUrl));
      if (game.watch) { el('watch-card').hidden = false; el('watch').replaceChildren(link('Watch this game on NFHS Network ↗', game.watch)); }
    }
    const opponentSide=ownSide==='away'?'home':'away';
    if(data.opponentRecord){el(opponentSide+'Record').textContent=data.opponentRecord.record;el(opponentSide+'RecordDate').textContent='Current record · MaxPreps';}
    else if(!sides[opponentSide].record&&!opponentResult&&/football/i.test(profile?.sport || '')){el(opponentSide+'Record').textContent='Official record unavailable';el(opponentSide+'RecordDate').textContent='Checked team source';}
    if(/football/i.test(profile?.sport||''))refreshTeamComparison();
    for (const item of data.articles) {
      const section = document.createElement('section');
      const heading = document.createElement('h3'); heading.textContent = item.title; section.append(heading);
      if (item.summary) { const summary = document.createElement('p'); summary.className = 'report-summary'; summary.textContent = item.summary; section.append(summary); }
      const meta = document.createElement('p'); meta.className = 'muted';
      meta.append('Source: ', link(item.source, item.url), ` · ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(item.published))}`);
      section.append(meta); content.append(section);
    }
    el('research-status').textContent = data.articles.length ? '' : data.unavailable
      ? `Couldn’t check ${matchup}. Try again.` : `No additional verified reports for ${matchup} on ${researchDate}.`;
    if (!data.game) el('snapshot-source').replaceChildren(link(`${team} schedule ↗`, data.sourceUrl));
    el('checked').textContent = 'Checked ' + new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(data.checkedAt));
  } catch {
    el('research-status').textContent = `Couldn’t refresh ${matchup}. Try again.`;
  } finally { busy = false; el('refresh').disabled = false; }
}
el('refresh').addEventListener('click', refresh);
refresh();
refreshRecords();
refreshLiveGame();
refreshTeamComparison();
window.addEventListener('focus', refresh);
window.addEventListener('focus', refreshRecords);
window.addEventListener('focus', refreshLiveGame);
setInterval(() => { if (!document.hidden) refresh(); }, 300000);
setInterval(() => { if (!document.hidden) refreshLiveGame(); }, 30000);

if(profile){
 const keys={'eli.html':'eli-soccer','eli-santa-cruz-soccer.html':'eli-school-soccer','eli-football.html':'eli-football','jack.html':'jack','dane.html':'dane','gracie.html':'gracie'};
 el('game-calendar').hidden=false;
 el('subscribe-team').href='subscribe.html?cal='+keys[teamPage];
 el('subscribe-team').textContent='Subscribe to '+profile.name;
 const uid=q.get('uid');
 el('add-game').hidden=!uid;
 if(uid)el('add-game').href='/api/game-calendar?'+new URLSearchParams({teamPage,uid});
}

function setGameDetail(text, sourceUrl){
 el('snapshot').textContent=text;
 el('game-detail-more')?.remove(); el('game-detail-dialog')?.remove();
 if(text.length<=350&&!/\.\.\.|…/.test(text))return;
 const clipped=/\.\.\.|…/.test(text);
 const first=text.split(/\.\.\.|…/)[0].match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
 el('snapshot').textContent=first&&first.length<=350?first:'';
 const button=document.createElement('button');button.id='game-detail-more';button.textContent='See more';
 const dialog=document.createElement('dialog');dialog.id='game-detail-dialog';dialog.setAttribute('aria-label','Game details');
 Object.assign(dialog.style,{width:'min(92vw,680px)',maxHeight:'85vh',overflowY:'auto',padding:'24px',borderRadius:'12px'});
 const close=document.createElement('button');close.textContent='Close';close.onclick=()=>dialog.close();
 const body=document.createElement('p');body.textContent=clipped?'The source provided an excerpt. Open the report for the full text.':text;
 dialog.append(close,body,link('Read full report ↗',sourceUrl));document.body.append(dialog);
 button.onclick=()=>dialog.showModal();dialog.onclick=e=>{if(e.target===dialog)dialog.close()};el('snapshot').after(button);
}
