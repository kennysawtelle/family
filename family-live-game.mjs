import { teams } from './game-teams.mjs';
import { scheduleGame } from './game-research.mjs';

const sources = new Map([
  ['eli|2026-10-24|napa united', {
    type: 'link', date: '2026-10-24', teams: ['Los Gatos United', 'Napa United'],
    page: 'https://napaunited.org/ecnl-boys',
    provider: 'Napa United ECNL Boys',
    heading: 'Tomorrow’s match', badge: 'ECNL Boys', linkLabel: 'About Napa United ECNL Boys ↗',
    status: 'Los Gatos United visits Napa United tomorrow at 9:00 AM PDT at Silverado Middle School Football Field. ECNL B2008/09 match #1099583.',
  }],
  ['dane|2026-10-23|charter oak', {
    type: 'link', date: '2026-10-23', teams: ['Bonita', 'Charter Oak'],
    page: 'https://www.nfhsnetwork.com/events/charter-oak-high-school-covina-ca/gam7173ae9630',
    provider: 'NFHS Network official broadcast',
    status: 'The official Bonita at Charter Oak broadcast is scheduled for 7:00 PM PDT. Live video, score, and game updates appear when the event scorekeeper publishes them.',
  }],
  ['eli football|2026-10-08|rancho san juan', {
    type: 'link', date: '2026-10-08', teams: ['Santa Cruz', 'Rancho San Juan'],
    page: 'https://www.nfhsnetwork.com/events/rancho-san-juan-high-school-salinas-ca/gamcbb5b26d8d',
    provider: 'NFHS Network official live broadcast',
    status: 'Watch the official live broadcast. Live scores and statistics appear only when the event scorekeeper publishes them.',
  }],
  ['gracie|2026-09-27|austin peay', {
    type: 'sidearm', date: '2026-09-27', teams: ['Austin Peay', 'North Alabama'],
    feed: 'https://sidearmstats.com/apsu/wsoc/game.json?detail=full',
    page: 'https://letsgopeay.com/sidearmstats/wsoc/summary',
    provider: 'Austin Peay SIDEARM Live Stats',
    previewUrl: 'https://letsgopeay.com/news/2026/9/26/womens-soccer-soccer-hosts-lions-in-uac-home-opener.aspx',
    previewTitle: 'Austin Peay match preview',
    notes: [
      'North Alabama entered tied for first in the UAC Blue Division after its 1–0 conference win at West Georgia.',
      'This is the eighth meeting between North Alabama and Austin Peay.',
      'Austin Peay entered 1–6–3 in its previous 10 home matches.',
      'The match is being broadcast on ESPN+.',
    ],
  }],
  ['gracie|2026-10-04|eastern kentucky', {
    type: 'ncaa', date: '2026-10-04', teams: ['North Alabama', 'Eastern Kentucky'],
    feed: 'https://ncaa-api.henrygd.me/scoreboard/soccer-women/d1/2026/10/04',
    page: 'https://stats.statbroadcast.com/broadcast/?id=665443', provider: 'North Alabama StatBroadcast Live Stats',
  }],
  ['gracie|2026-10-08|abilene christian', {
    type: 'ncaa', date: '2026-10-08', teams: ['North Alabama', 'Abilene Christian'],
    feed: 'https://ncaa-api.henrygd.me/scoreboard/soccer-women/d1/2026/10/08',
    page: 'https://stats.statbroadcast.com/broadcast/?id=665442', provider: 'North Alabama StatBroadcast Live Stats',
  }],
  ['gracie|2026-10-11|tarleton state', {
    type: 'ncaa', date: '2026-10-11', teams: ['North Alabama', 'Tarleton State'],
    feed: 'https://ncaa-api.henrygd.me/scoreboard/soccer-women/d1/2026/10/11',
    page: 'https://stats.statbroadcast.com/broadcast/?id=665447', provider: 'North Alabama StatBroadcast Live Stats',
  }],
  ['gracie|2026-10-15|little rock', {
    type: 'link', date: '2026-10-15', teams: ['North Alabama', 'Little Rock'],
    page: 'https://stats.statbroadcast.com/broadcast/?id=663837',
    provider: 'Little Rock StatBroadcast Live Stats',
    status: 'Open the official live stats for North Alabama at Little Rock.',
  }],
  ['gracie|2026-10-29|austin peay', {
    type: 'ncaa', date: '2026-10-29', teams: ['North Alabama', 'Austin Peay'],
    feed: 'https://ncaa-api.henrygd.me/scoreboard/soccer-women/d1/2026/10/29',
    page: 'https://stats.statbroadcast.com/broadcast/?id=665448', provider: 'North Alabama StatBroadcast Live Stats',
    watchUrl: 'https://www.espn.com/watch/player/_/eventCalendarId/401901499?gameId=401901499',
    watchLabel: 'Watch on ESPN+',
  }],
]);

const teamFallbacks = new Map([
  ['eli football', {
    type: 'link', page: 'https://www.nfhsnetwork.com/schools/santa-cruz-high-school-santa-cruz-ca/football/boys/varsity',
    provider: 'Santa Cruz High on NFHS Network',
    status: 'Check the official Santa Cruz High event page for a live broadcast. Live scores and statistics appear only when the event scorekeeper publishes them.',
  }],
  ['dane', {
    type: 'link', page: 'https://www.nfhsnetwork.com/schools/bonita-high-school-la-verne-ca',
    provider: 'Bonita High on NFHS Network',
    status: 'Check the official Bonita High event page for a live broadcast. Live scores and statistics appear only when the event scorekeeper publishes them.',
  }],
  ['jack', {
    type: 'link', page: 'https://www.nfhsnetwork.com/schools/soquel-high-school-soquel-ca/football',
    provider: 'Soquel High on NFHS Network',
    status: 'Check the official Soquel High event page for a live broadcast. Live scores and statistics appear only when the event scorekeeper publishes them.',
  }],
  ['eli santa cruz soccer', {
    type: 'link', page: 'https://www.nfhsnetwork.com/schools/santa-cruz-high-school-santa-cruz-ca',
    provider: 'Santa Cruz High on NFHS Network',
    status: 'Check the official Santa Cruz High event page for a live broadcast. Live scores and statistics appear only when the event scorekeeper publishes them.',
  }],
  ['gracie', {
    type: 'unavailable', provider: 'North Alabama Athletics',
    status: 'No verified live broadcast or live-stat feed has been published for this match yet.',
  }],
]);

const key = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const scoreboardKey=value=>({
  'north alabama':'north ala','eastern kentucky':'eastern ky','tarleton state':'tarleton st'
})[key(value)]||key(value);
const integer = value => Number.isFinite(Number(value)) ? Number(value) : null;
const text = value => typeof value === 'string' ? value.trim() : '';
const clock = seconds => {
  const total = integer(seconds);
  if (total === null) return '';
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
const totals = team => {
  const values = team?.Totals?.Values || {};
  return Object.fromEntries(['Goals', 'Shots', 'OnGoal', 'Corners', 'Saves', 'Fouls', 'YellowCard', 'RedCard']
    .map(name => [name, integer(values[name])]).filter(([, value]) => value !== null));
};

const maxPrepsApi='https://production.api.maxpreps.com/gatewayweb/react/live-game-data/v2';
const cleanUpdate=value=>text(value).replace(/\s+/g,' ').replace(/\s+([,.])/g,'$1');
const scoreParts=value=>[...String(value||'').matchAll(/(?:^|,\s*)(.+?)\s+(\d+)(?=,|$)/g)].map(match=>({name:match[1].trim(),score:Number(match[2])}));
const updatePriority=row=>/Touchdown|FieldGoal|Safety|Interception|FumbleRecovery|LongRun|LongPass|Sack|TackleForLoss|EndOfGame|StartOfGame/i.test(row.alertTypeString||'')?2:/Commentary|Possession|Update|Punt|Kickoff|TwoMinute/i.test(row.alertTypeString||'')?1:0;

const flightText=html=>{
  let output='';
  for(const match of String(html).matchAll(/self\.__next_f\.push\((\[1,"(?:\\.|[^"\\])*"\])\)/g))try{output+=JSON.parse(match[1])[1]}catch{}
  return output;
};
const jsonObjects=value=>{
  const objects=[];
  for(let index=0;(index=value.indexOf('{"name":"',index))>=0;index++){
    let depth=0,inString=false,escaped=false,end=index;
    for(;end<value.length;end++){
      const char=value[end];
      if(inString){if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char==='"')inString=false;continue}
      if(char==='"'){inString=true;continue}if(char==='{')depth++;else if(char==='}'&&!--depth){end++;break}
    }
    try{objects.push(JSON.parse(value.slice(index,end)))}catch{}
  }
  return objects;
};
export function maxPrepsAthleteStats(html,athlete){
  const slug=athlete.toLowerCase().replace(/[^a-z0-9]+/g,'-'),last=athlete.split(/\s+/).at(-1)||'';
  const wanted=['Receptions','Receiving Yards','Receiving TDs','Total Tackles','QB Hurries','Interceptions','Sacks','Yards Per Catch','Receiving Long','Rushing TDs','Carries','Rushing Yards','Solo Tackle'];
  const found=[];let athleteUrl='';
  for(const category of jsonObjects(flightText(html)).filter(value=>value?.stats?.columns&&value?.stats?.rows)){
    const row=category.stats.rows.find(item=>item.columns?.some(cell=>String(cell.href||'').toLowerCase().includes(`/${slug}/`)||new RegExp(`\\b${last}\\b`,'i').test(cell.value||'')));
    if(!row)continue;athleteUrl||=row.columns.find(cell=>String(cell.href||'').includes('/athletes/'))?.href||'';
    category.stats.columns.forEach((column,index)=>{const label=column.displayName,value=text(row.columns[index]?.value);if(wanted.includes(label)&&value!=='')found.push({label,value,category:category.name})});
  }
  const stats=[];for(const label of wanted){const item=found.find(value=>value.label===label);if(item&&!stats.some(value=>value.label===label))stats.push(item)}
  return {stats:stats.slice(0,8),athleteUrl:athleteUrl||null};
}

export function normalizeMaxPrepsGame(raw,source,profile,now=new Date()){
  const rows=(raw?.data?.gameData||raw?.gameData||[]).filter(row=>row&&!row.isDeleted&&cleanUpdate(row.gameDataString||row.scorerCommentary));
  if(!rows.length)throw new Error('The official Scoretracker has not published updates.');
  rows.sort((a,b)=>String(a.stamp||a.updateOn||'').localeCompare(String(b.stamp||b.updateOn||'')));
  const latest=rows.at(-1),scores=scoreParts(latest.currentScore),ended=rows.some(row=>/EndOfGame/i.test(row.alertTypeString||'')||row.gamePeriod==='F');
  const started=rows.some(row=>/StartOfGame/i.test(row.alertTypeString||''));
  const side=(item,fallback)=>({name:item?.name||fallback,score:Number.isFinite(item?.score)?item.score:null,logo:null});
  const away=side(scores[0],source.opponent),home=side(scores[1],profile.alias);
  const period=text(latest.gamePeriodString)||text(latest.gamePeriod),gameClock=text(latest.gameTime);
  const status=ended?'Final':[period&&period!=='Game is Over'?period:'',gameClock&&gameClock!=='00:00'&&gameClock!=='99:59'?gameClock:''].filter(Boolean).join(' · ')||(started?'Live':'Updates available');
  const athlete=profile.athlete||'',lastName=athlete.split(/\s+/).at(-1)||'';
  const athleteRows=lastName?rows.filter(row=>new RegExp(`\\b${lastName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(`${row.gameDataString||''} ${row.scorerCommentary||''}`)):[];
  const mapUpdate=row=>({id:row.qwixcoreGameDataId,type:text(row.gameDataLogHeader)||text(row.alertTypeString),period:text(row.gamePeriodString),clock:text(row.gameTime),text:cleanUpdate(row.gameDataString||row.scorerCommentary),score:text(row.currentScore),at:row.stamp||row.updateOn||null});
  const significant=rows.filter(row=>updatePriority(row)>0).sort((a,b)=>updatePriority(b)-updatePriority(a)||String(b.stamp||'').localeCompare(String(a.stamp||'')));
  const recent=[...rows].reverse().filter(row=>updatePriority(row)>0).slice(0,12).map(mapUpdate);
  const scoring=rows.filter(row=>/Touchdown|FieldGoal|Safety/i.test(row.alertTypeString||'')).map(row=>({period:text(row.gamePeriodString),clock:text(row.gameTime),narrative:cleanUpdate(row.gameDataString),homeScore:row.homeTeam?.score??null,awayScore:row.awayTeam?.score??null}));
  return {state:ended?'final':started?'live':'pregame',status,home,away,homeStats:{},awayStats:{},scoring,updates:recent,
    athleteHighlight:athleteRows.length?{name:athlete,...mapUpdate(athleteRows.at(-1)),updates:[...athleteRows].reverse().slice(0,6).map(mapUpdate)}:null,
    venue:source.venue||'',attendance:null,officials:'',notes:[],previewUrl:null,previewTitle:null,sourceUrl:source.sourceUrl,source:'MaxPreps Scoretracker',watchUrl:source.watch||null,watchLabel:source.watch?'Watch the official broadcast':null,checkedAt:now.toISOString()};
}

async function maxPrepsLiveGame(params,fetcher){
  const rawPage=params.get('teamPage')||'',pageKey=rawPage.endsWith('.html')?rawPage:`${rawPage}.html`,profile=teams[pageKey];
  if(!profile||!profile.source.includes('maxpreps.com'))return null;
  const opponent=text(params.get('opponent')),date=text(params.get('date'));
  if(!opponent||!/^20\d\d-\d\d-\d\d$/.test(date))return null;
  const scheduleResponse=await fetcher(profile.source,{signal:AbortSignal.timeout(6500),headers:{Accept:'text/html'}});
  if(!scheduleResponse.ok)throw new Error('Team schedule unavailable');
  const contest=scheduleGame(await scheduleResponse.text(),profile,opponent,date);
  if(!contest?.sourceUrl||!new URL(contest.sourceUrl).hostname.endsWith('maxpreps.com'))return null;
  const contestUrl=new URL(contest.sourceUrl);contestUrl.searchParams.set('tab','Scoretracker');
  const contestResponse=await fetcher(contestUrl,{signal:AbortSignal.timeout(6500),headers:{Accept:'text/html'}});
  if(!contestResponse.ok)throw new Error('Scoretracker unavailable');
  const html=await contestResponse.text();
  const ids=[...new Set([...html.matchAll(/\\?"qwixcoreGameId\\?":\\?"([0-9a-f-]{36})/gi)].map(match=>match[1]))];
  if(!ids.length)return null;
  const statsUrl=new URL(contest.sourceUrl);statsUrl.searchParams.set('tab','Stats');
  const [results,statsResult]=await Promise.all([
    Promise.allSettled(ids.map(id=>fetcher(`${maxPrepsApi}?qwixCoreGameId=${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(6500),headers:{Accept:'application/json'}}).then(async response=>response.ok?response.json():Promise.reject(new Error('Live feed unavailable'))))),
    fetcher(statsUrl,{signal:AbortSignal.timeout(6500),headers:{Accept:'text/html'}}).then(response=>response.ok?response.text():'').catch(()=>''),
  ]);
  const payloads=results.flatMap(result=>result.status==='fulfilled'?[result.value]:[]);
  if(!payloads.length)throw new Error('Live feed unavailable');
  const athlete=profile.athlete?.split(/\s+/).at(-1)||'';
  const richness=payload=>{const rows=payload?.data?.gameData||[];return rows.filter(row=>athlete&&new RegExp(`\\b${athlete}\\b`,'i').test(row.gameDataString||'')).length*1000+rows.filter(row=>/#\d+\s+[A-Z]/.test(row.gameDataString||'')).length*10+rows.length};
  payloads.sort((a,b)=>richness(b)-richness(a));
  const game=normalizeMaxPrepsGame(payloads[0],{...contest,opponent,sourceUrl:contest.sourceUrl},profile);
  const published=maxPrepsAthleteStats(statsResult,profile.athlete||'');
  if(published.stats.length){game.athleteHighlight=game.athleteHighlight||{name:profile.athlete,type:'Game statistics',period:'',clock:'',text:'Verified game statistics',score:'',updates:[]};game.athleteHighlight.stats=published.stats;game.athleteHighlight.athleteUrl=published.athleteUrl}
  return game;
}

export function normalizeLiveGame(raw, source, now = new Date()) {
  const game = raw?.Game;
  if (!game?.HomeTeam || !game?.VisitingTeam) throw new Error('The official live score is unavailable.');
  const parsedDate = text(game.Date) && new Date(`${text(game.Date)} 12:00:00`);
  const isoDate = parsedDate && !Number.isNaN(parsedDate.valueOf())
    ? `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}` : '';
  const actualTeams = [game.HomeTeam.Name, game.VisitingTeam.Name].map(key).sort();
  const expectedTeams = (source.teams || []).map(key).sort();
  if (isoDate !== source.date || actualTeams.length !== expectedTeams.length || actualTeams.some((team, index) => team !== expectedTeams[index])) {
    throw new Error('The official feed is currently showing a different game.');
  }
  const state = game.IsComplete ? 'final' : game.HasStarted ? 'live' : 'pregame';
  const period = integer(game.Period);
  const status = state === 'final' ? 'Final' : state === 'live'
    ? `${period === 1 ? '1st half' : period === 2 ? '2nd half' : period ? `Period ${period}` : 'Live'}${clock(game.ClockSeconds) ? ` · ${clock(game.ClockSeconds)}` : ''}`
    : `Scheduled · ${text(game.StartTime)}`;
  const side = team => ({ name: text(team.Name), score: integer(team.Score), logo: text(team.Logo) || null });
  const scoring = (raw.Plays || []).filter(play => play?.Type === 'GOAL').map(play => ({
    period: integer(play.Period), clock: clock(play.ClockSeconds), narrative: text(play.Narrative),
    homeScore: integer(play.Score?.HomeTeam), awayScore: integer(play.Score?.VisitingTeam),
  }));
  return {
    state, status, home: side(game.HomeTeam), away: side(game.VisitingTeam),
    homeStats: totals(raw.Stats?.HomeTeam), awayStats: totals(raw.Stats?.VisitingTeam), scoring,
    venue: text(game.Location), attendance: integer(game.Attendance), officials: text(game.Officials),
    notes: source.notes || [], previewUrl: source.previewUrl || null, previewTitle: source.previewTitle || null,
    sourceUrl: source.page, source: source.provider, checkedAt: now.toISOString(),
  };
}

export function normalizeNcaaGame(raw, source, now = new Date()) {
  const expected=(source.teams||[]).map(scoreboardKey).sort();
  const games=(raw?.games||[]).map(item=>item?.game).filter(Boolean);
  const game=games.find(item=>{
    const actual=[item.away?.names?.short,item.home?.names?.short].map(scoreboardKey).sort();
    return actual.length===expected.length&&actual.every((name,index)=>name===expected[index]);
  });
  if(!game)throw new Error('The NCAA scoreboard does not list this exact game.');
  const isoDate=String(game.startDate||'').replace(/^(\d\d)\/(\d\d)\/(\d{4})$/,'$3-$1-$2');
  if(isoDate!==source.date)throw new Error('The NCAA scoreboard returned a different date.');
  const state=game.gameState==='live'?'live':game.gameState==='final'?'final':'pregame';
  const side=team=>({name:text(team?.names?.short),score:integer(team?.score),logo:null});
  return {gameId:text(game.gameID),state,status:state==='final'?'Final':[text(game.currentPeriod),text(game.contestClock)].filter(Boolean).join(' · ')||'Live',
    home:side(game.home),away:side(game.away),homeStats:{},awayStats:{},scoring:[],venue:'Bobby Wallace Field at Bank Independent Stadium',
    attendance:null,officials:'',notes:[],previewUrl:null,previewTitle:null,
    sourceUrl:`https://www.ncaa.com${game.url||''}`,source:'NCAA live scoreboard',watchUrl:source.watchUrl||null,watchLabel:source.watchLabel||null,checkedAt:now.toISOString()};
}

const ncaaTeamStats=stats=>{
  const team=stats?.teamStats||{},goalie=team.goalie||{},cards=team.penalties||{};
  return {Shots:integer(team.shots),OnGoal:integer(team.shotsOnGoal),Corners:integer(team.corners),Saves:integer(goalie.saves),
    Fouls:integer(cards.fouls),YellowCard:integer(cards.yellowCards),RedCard:integer(cards.redCards)};
};
export async function enrichNcaaGame(game,fetcher=fetch){
  if(!game?.gameId)return game;
  const base=`https://ncaa-api.henrygd.me/game/${game.gameId}`;
  const [scoringResult,boxResult]=await Promise.allSettled([
    fetcher(base+'/scoring-summary',{signal:AbortSignal.timeout(5000),headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null),
    fetcher(base+'/boxscore',{signal:AbortSignal.timeout(5000),headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null)
  ]);
  const scoring=scoringResult.status==='fulfilled'?scoringResult.value:null;
  const teamNames=new Map((scoring?.teams||[]).map(team=>[String(team.teamId),text(team.nameShort)]));
  game.scoring=(scoring?.periods||[]).flatMap(period=>(period.summary||[]).filter(item=>item.scoreType==='GOAL').map(item=>({
    period:integer(String(period.title||'').match(/\d+/)?.[0])||1,clock:text(item.time),
    narrative:`${teamNames.get(String(item.teamId))||'Team'} — ${text(item.scoreText)}`,
    homeScore:integer(item.homeScore),awayScore:integer(item.visitScore)
  })));
  const box=boxResult.status==='fulfilled'?boxResult.value:null;
  const finalGoalieResult=(box?.teamBoxscore||[]).some(item=>(item.playerStats||[]).some(player=>{
    const goalie=player.goalie;return goalie&&[goalie.wins,goalie.losses,goalie.ties].some(value=>Number(value)>0);
  }));
  if(game.state==='live'&&(String(box?.status||'').toUpperCase()==='F'||(Number(box?.minutes)>=90&&finalGoalieResult))){game.state='final';game.status='Final';}
  const teamBox=new Map((box?.teamBoxscore||[]).map(item=>[String(item.teamId),item]));
  const homeId=(box?.teams||[]).find(team=>team.isHome)?.teamId,awayId=(box?.teams||[]).find(team=>!team.isHome)?.teamId;
  if(homeId!=null)game.homeStats=ncaaTeamStats(teamBox.get(String(homeId)));
  if(awayId!=null)game.awayStats=ncaaTeamStats(teamBox.get(String(awayId)));
  return game;
}

export async function familyLiveGame(request, fetcher = fetch) {
  const params = new URL(request.url).searchParams;
  try{const maxPreps=await maxPrepsLiveGame(params,fetcher);if(maxPreps)return Response.json({available:true,...maxPreps},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}catch{/* Keep the configured source fallback when Scoretracker is unavailable. */}
  const teamKey = key(params.get('teamPage'));
  const id = `${teamKey}|${params.get('date') || ''}|${key(params.get('opponent'))}`;
  const source = sources.get(id) || teamFallbacks.get(teamKey);
  if (!source) return Response.json({ available: false, checkedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  if (source.type === 'link' || source.type === 'unavailable') return Response.json({
    available: false, configured: true, source: source.provider, sourceUrl: source.page || null,
    status: source.status || 'Open the official live event.', heading: source.heading || null,
    badge: source.badge || null, linkLabel: source.linkLabel || null,
    checkedAt: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  try {
    const response = await fetcher(source.feed, { signal: AbortSignal.timeout(7000), headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Source unavailable');
    const raw=await response.json();
    const game=source.type==='ncaa'?await enrichNcaaGame(normalizeNcaaGame(raw,source),fetcher):normalizeLiveGame(raw, source);
    return Response.json({ available: true, ...game }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return Response.json({
      available: false, configured: Boolean(source.watchUrl || source.page),
      source: source.provider, sourceUrl: source.watchUrl || source.page || null,
      linkLabel: source.watchLabel || null,
      status: source.watchUrl ? 'The official stream is available. Live statistics will appear when the score service responds.' : 'The official live source is temporarily unavailable.',
      checkedAt: new Date().toISOString(),
    }, { status: source.watchUrl ? 200 : 502, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  }
}
