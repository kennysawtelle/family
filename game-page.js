import { teams, resolveTeamPage } from './game-teams.mjs';
import { matchupSides } from './game-matchup.mjs';
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
  el(side + 'Record').textContent = sides[side].record || (result ? `Game: ${result}` : 'Record not published');
  el(side + 'RecordDate').textContent = sides[side].record ? sides[side].asOf : result ? 'Final result' : '';
}
const primaryLink = profile ? teamPage : 'index.html';
const opponentLink = 'team.html?' + new URLSearchParams({ name: opponent, sport: profile?.sport || '' });
el('awayLink').href = q.get('ha') === 'Away' ? primaryLink : opponentLink;
el('homeLink').href = q.get('ha') === 'Away' ? opponentLink : primaryLink;
el('snapshot').textContent = [matchup, date, gameStatus && `Final: ${gameStatus}`, q.get('venue')].filter(Boolean).join(' · ');
el('research-status').textContent = `Checking ${matchup}…`;

function link(label, url) {
  const a = document.createElement('a'); a.textContent = label; a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
}
function timeText(instant) {
  return ['America/Los_Angeles', 'America/New_York'].map(timeZone => new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(instant))).join(' / ');
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
    const response = await fetch('/api/game-research?' + new URLSearchParams({ teamPage, opponent, date: researchDate }), { signal: AbortSignal.timeout(10000), cache: 'no-store' });
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
    for (const item of data.articles) {
      const section = document.createElement('section');
      section.append(link(item.title, item.url));
      const meta = document.createElement('p'); meta.className = 'muted';
      meta.textContent = `${item.source} · ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(item.published))}`;
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
window.addEventListener('focus', refresh);
setInterval(() => { if (!document.hidden) refresh(); }, 300000);

if(profile){
 const keys={'eli.html':'eli-soccer','eli-football.html':'eli-football','jack.html':'jack','dane.html':'dane','gracie.html':'gracie'};
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
