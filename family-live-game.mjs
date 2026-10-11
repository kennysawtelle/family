const sources = new Map([
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
  ['gracie|2026-10-29|austin peay', {
    type: 'ncaa', date: '2026-10-29', teams: ['North Alabama', 'Austin Peay'],
    feed: 'https://ncaa-api.henrygd.me/scoreboard/soccer-women/d1/2026/10/29',
    page: 'https://stats.statbroadcast.com/broadcast/?id=665448', provider: 'North Alabama StatBroadcast Live Stats',
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
  ['eli', {
    type: 'unavailable', provider: 'Los Gatos United / ECNL',
    status: 'No verified live broadcast or live-stat feed has been published for this club match.',
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
    sourceUrl:`https://www.ncaa.com${game.url||''}`,source:'NCAA live scoreboard',checkedAt:now.toISOString()};
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
  const teamKey = key(params.get('teamPage'));
  const id = `${teamKey}|${params.get('date') || ''}|${key(params.get('opponent'))}`;
  const source = sources.get(id) || teamFallbacks.get(teamKey);
  if (!source) return Response.json({ available: false, checkedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  if (source.type === 'link' || source.type === 'unavailable') return Response.json({
    available: false, configured: true, source: source.provider, sourceUrl: source.page || null,
    status: source.status || 'Open the official live event.',
    checkedAt: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  try {
    const response = await fetcher(source.feed, { signal: AbortSignal.timeout(7000), headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Source unavailable');
    const raw=await response.json();
    const game=source.type==='ncaa'?await enrichNcaaGame(normalizeNcaaGame(raw,source),fetcher):normalizeLiveGame(raw, source);
    return Response.json({ available: true, ...game }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return Response.json({ available: false, sourceUrl: source.page, checkedAt: new Date().toISOString() }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
