import assert from 'node:assert/strict';
import test from 'node:test';
import { familyLiveGame, normalizeLiveGame, normalizeNcaaGame, normalizeMaxPrepsGame, maxPrepsAthleteStats, enrichNcaaGame } from '../family-live-game.mjs';

const source = { page: 'https://example.com/live', provider: 'Official live stats' };
const fixture = {
  Game: {
    HasStarted: true, IsComplete: false, Period: 2, ClockSeconds: 3189,
    Date: '9/27/2026',
    Location: 'Morgan Brothers Field', Attendance: 189, Officials: 'Referee: Tim Stewart',
    HomeTeam: { Name: 'Austin Peay', Score: 0 }, VisitingTeam: { Name: 'North Alabama', Score: 2 },
  },
  Stats: {
    HomeTeam: { Totals: { Values: { Shots: '5', OnGoal: '1', Corners: '2', Saves: '3' } } },
    VisitingTeam: { Totals: { Values: { Shots: '8', OnGoal: '5', Corners: '2', Saves: '1' } } },
  },
  Plays: [{ Type: 'GOAL', Period: 1, ClockSeconds: 604, Narrative: 'Goal by North Alabama', Score: { HomeTeam: 0, VisitingTeam: 2 } }],
};

test('normalizes a live soccer score with clock, stats and scoring plays', () => {
  const game = normalizeLiveGame(fixture, { ...source, date: '2026-09-27', teams: ['Austin Peay', 'North Alabama'] }, new Date('2026-09-27T20:20:00Z'));
  assert.equal(game.status, '2nd half · 53:09');
  assert.deepEqual(game.away, { name: 'North Alabama', score: 2, logo: null });
  assert.deepEqual(game.home, { name: 'Austin Peay', score: 0, logo: null });
  assert.equal(game.awayStats.OnGoal, 5);
  assert.equal(game.scoring[0].awayScore, 2);
  assert.equal(game.attendance, 189);
});

test('rejects a provider response for a different game or date', () => {
  const expected = { ...source, date: '2026-09-27', teams: ['Austin Peay', 'North Alabama'] };
  assert.throws(() => normalizeLiveGame({ ...fixture, Game: { ...fixture.Game, Date: '9/28/2026' } }, expected), /different game/);
  assert.throws(() => normalizeLiveGame({ ...fixture, Game: { ...fixture.Game, HomeTeam: { Name: 'Wrong Team', Score: 0 } } }, expected), /different game/);
});

test('promotes a family athlete update from a MaxPreps Scoretracker game',()=>{
  const feed={data:{gameData:[
    {qwixcoreGameDataId:1,alertTypeString:'FootballStartOfGame',gameDataLogHeader:'Start of Game',gamePeriodString:'1st Quarter',gamePeriod:'Q1',gameTime:'12:00',gameDataString:'Glendora kicking off to Bonita.',currentScore:'Glendora 0, Bonita 0',stamp:'2026-10-30T02:00:00'},
    {qwixcoreGameDataId:2,alertTypeString:'FootballTouchdownPassing',gameDataLogHeader:'Passing Touchdown',gamePeriodString:'2nd Quarter',gamePeriod:'Q2',gameTime:'02:00',gameDataString:'Bonita - #17 Isaiah Guerrero 36 Yd pass completed to #21 Dane Gosserand for a TD.',currentScore:'Glendora 7, Bonita 20',homeTeam:{score:20},awayTeam:{score:7},stamp:'2026-10-30T02:57:27'},
    {qwixcoreGameDataId:3,alertTypeString:'FootballEndOfGame',gameDataLogHeader:'End of Game',gamePeriodString:'Game is Over',gamePeriod:'F',gameTime:'00:00',gameDataString:'End of game.',currentScore:'Glendora 14, Bonita 28',homeTeam:{score:28},awayTeam:{score:14},stamp:'2026-10-30T04:25:16'}
  ]}};
  const game=normalizeMaxPrepsGame(feed,{opponent:'Glendora',sourceUrl:'https://www.maxpreps.com/game',venue:'Bonita High'}, {alias:'Bonita',athlete:'Dane Gosserand'},new Date('2026-10-30T04:26:00Z'));
  assert.equal(game.state,'final');assert.equal(game.away.score,14);assert.equal(game.home.score,28);assert.equal(game.athleteHighlight.name,'Dane Gosserand');assert.match(game.athleteHighlight.text,/36 Yd pass.*Dane Gosserand.*TD/);assert.equal(game.source,'MaxPreps Scoretracker');
});

test('extracts only the family athlete’s published MaxPreps game totals',()=>{
  const category={name:'Receiving',stats:{columns:[{displayName:'#'},{displayName:'Name'},{displayName:'Receptions'},{displayName:'Receiving Yards'},{displayName:'Receiving TDs'}],rows:[{columns:[{value:'21'},{value:'D. Gosserand',href:'https://www.maxpreps.com/ca/la-verne/bonita-bearcats/athletes/dane-gosserand/'},{value:'1'},{value:'36'},{value:'1'}]},{columns:[{value:'2'},{value:'J. Lara',href:'https://www.maxpreps.com/athletes/joseph-lara/'},{value:'3'},{value:'40'},{value:'0'}]}]}};
  const html=`<script>self.__next_f.push(${JSON.stringify([1,`5:${JSON.stringify(category)}\n`])})</script>`;
  const result=maxPrepsAthleteStats(html,'Dane Gosserand');assert.deepEqual(result.stats.map(item=>[item.label,item.value]),[['Receptions','1'],['Receiving Yards','36'],['Receiving TDs','1']]);assert.match(result.athleteUrl,/dane-gosserand/);
});

test('discovers the exact MaxPreps contest and serves its score feed on the Family page',async()=>{
  const event={'@type':'SportsEvent',name:'Glendora at Bonita',description:'Varsity football',sport:'Football',startDate:'2026-10-30T02:00:00Z',url:'https://www.maxpreps.com/ca/football/game/bonita-vs-glendora/10-29-2026/?c=contest',homeTeam:{name:'Bonita'},awayTeam:{name:'Glendora'}};
  const score={data:{gameData:[{qwixcoreGameDataId:9,alertTypeString:'FootballEndOfGame',gameDataLogHeader:'End of Game',gamePeriodString:'Game is Over',gamePeriod:'F',gameTime:'00:00',gameDataString:'End of game.',currentScore:'Glendora 14, Bonita 28',homeTeam:{score:28},awayTeam:{score:14},stamp:'2026-10-30T04:25:16'}]}};
  const fetcher=async url=>{url=String(url);if(url.includes('/schedule/'))return new Response(`<script type="application/ld+json">${JSON.stringify(event)}</script>`);if(url.includes('tab=Scoretracker'))return new Response('<script>{\\"qwixcoreGameId\\":\\"f3e02b91-3420-4ea8-a1bb-232e8572b167\\"}</script>');if(url.includes('live-game-data'))return Response.json(score);throw new Error(url)};
  const response=await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=dane&date=2026-10-29&opponent=Glendora'),fetcher);const data=await response.json();
  assert.equal(data.available,true);assert.equal(data.state,'final');assert.equal(data.home.score,28);assert.match(data.sourceUrl,/maxpreps\.com/);
});

test('uses the NCAA scoreboard when StatBroadcast has no server-readable API', async () => {
  const scoreboard={games:[{game:{away:{score:'3',names:{short:'Eastern Ky.'}},home:{score:'2',names:{short:'North Ala.'}},gameState:'final',startDate:'10/04/2026',currentPeriod:'FINAL',contestClock:'0:00',url:'/game/6607574'}}]};
  const response = await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=gracie&date=2026-10-04&opponent=Eastern%20Kentucky'),async()=>Response.json(scoreboard));
  const data = await response.json();
  assert.equal(data.available, true);
  assert.equal(data.state, 'final');
  assert.equal(data.away.score,3);
  assert.match(data.sourceUrl, /6607574/);
});
test('normalizes the exact NCAA live scoreboard game and rejects a different matchup',()=>{
 const source={date:'2026-10-08',teams:['North Alabama','Abilene Christian']};
 const raw={games:[{game:{gameID:'6607309',away:{score:'1',names:{short:'Abilene Christian'}},home:{score:'0',names:{short:'North Ala.'}},gameState:'live',startDate:'10/08/2026',currentPeriod:'1ST HALF',contestClock:'25:19',url:'/game/6607309'}}]};
 const game=normalizeNcaaGame(raw,source);assert.equal(game.away.score,1);assert.equal(game.home.score,0);assert.equal(game.state,'live');assert.match(game.sourceUrl,/6607309/);
 assert.throws(()=>normalizeNcaaGame(raw,{...source,teams:['North Alabama','Tarleton State']}));
});
test('adds NCAA goal details and major team statistics',async()=>{
 const game={gameId:'6607309',home:{name:'North Ala.',score:0},away:{name:'Abilene Christian',score:1},homeStats:{},awayStats:{},scoring:[]};
 const scoring={teams:[{teamId:'1',nameShort:'North Ala.'},{teamId:'2',nameShort:'Abilene Christian'}],periods:[{title:'1st Half',summary:[{teamId:'2',time:'19:54',scoreType:'GOAL',scoreText:'Addison Briscoe (unassisted)',visitScore:'1',homeScore:'0'}]}]};
 const box={teams:[{teamId:'1',isHome:true},{teamId:'2',isHome:false}],teamBoxscore:[{teamId:'1',teamStats:{shots:'6',shotsOnGoal:'3',corners:'2',goalie:{saves:'1'},penalties:{fouls:'4',yellowCards:'0',redCards:'0'}}},{teamId:'2',teamStats:{shots:'2',shotsOnGoal:'2',corners:'2',goalie:{saves:'3'},penalties:{fouls:'1',yellowCards:'0',redCards:'0'}}}]};
 const fetcher=async url=>Response.json(url.endsWith('scoring-summary')?scoring:box);
 await enrichNcaaGame(game,fetcher);assert.match(game.scoring[0].narrative,/Addison Briscoe/);assert.equal(game.homeStats.Shots,6);assert.equal(game.awayStats.Saves,3);
});

test('a completed 90-minute box score overrides a lagging live scoreboard',async()=>{
 const game={gameId:'6607309',state:'live',status:'2ND HALF · 90:00',home:{},away:{},homeStats:{},awayStats:{},scoring:[]};
 const box={status:'I',minutes:90,teams:[],teamBoxscore:[{playerStats:[{goalie:{wins:'1',losses:'0',ties:'0'}}]}]};
 const updated=await enrichNcaaGame(game,async url=>Response.json(url.endsWith('/boxscore')?box:{periods:[],teams:[]}));
 assert.equal(updated.state,'final');assert.equal(updated.status,'Final');
});

test('only the exact scheduled game can use its configured official feed', async () => {
  let requests = 0;
  const fetcher = async () => { requests += 1; return Response.json(fixture); };
  const available = await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=gracie&date=2026-09-27&opponent=Austin%20Peay'), fetcher);
  assert.equal((await available.json()).available, true);
  const unavailable = await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=gracie&date=2026-09-28&opponent=Austin%20Peay'), fetcher);
  assert.equal((await unavailable.json()).available, false);
  assert.equal(requests, 1);
});

test('tomorrow’s tournament game keeps ESPN and official live stats available before the feed switches',async()=>{
 const response=await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=gracie&date=2026-11-08&opponent=Central%20Arkansas'),async()=>Response.json(fixture));
 const data=await response.json();assert.equal(response.status,200);assert.equal(data.configured,true);assert.match(data.sourceUrl,/espn\.com\/watch/);assert.match(data.status,/Live statistics will appear/);
});

test('falls back to Eli’s exact NFHS event when MaxPreps Scoretracker is unavailable', async () => {
  let requests = 0;
  const response = await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=eli-football&date=2026-10-08&opponent=Rancho%20San%20Juan'), async () => {
    requests += 1;
    throw new Error('Scoretracker unavailable.');
  });
  const data = await response.json();
  assert.equal(data.available, false);
  assert.equal(data.configured, true);
  assert.match(data.sourceUrl, /nfhsnetwork\.com\/events\/rancho-san-juan-high-school-salinas-ca\/gamcbb5b26d8d/);
  assert.match(data.status, /scorekeeper publishes them/);
  assert.equal(requests, 1);
});

test('links tonight’s Bonita at Charter Oak game to its exact official broadcast when Scoretracker is unavailable', async () => {
  const response = await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=dane&date=2026-10-23&opponent=Charter%20Oak'),async()=>{throw new Error('offline')});
  const data = await response.json();
  assert.equal(data.available, false);
  assert.equal(data.configured, true);
  assert.equal(data.source, 'NFHS Network official broadcast');
  assert.match(data.sourceUrl, /charter-oak-high-school-covina-ca\/gam7173ae9630/);
  assert.match(data.status, /7:00 PM PDT/);
});
test('links the October 29 Austin Peay match to its exact ESPN+ stream',async()=>{
 const response=await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=gracie&date=2026-10-29&opponent=Austin%20Peay'),async()=>Response.json({games:[{game:{gameID:'x',startDate:'10/29/2026',gameState:'pre',away:{names:{short:'Austin Peay'},score:0},home:{names:{short:'North Ala.'},score:0},url:'/game/x'}}]}));
 const data=await response.json();assert.match(data.watchUrl,/eventCalendarId\/401901499/);assert.equal(data.watchLabel,'Watch on ESPN+');
});
test('keeps the exact ESPN+ stream available when the NCAA score service is down',async()=>{
 const response=await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=gracie&date=2026-10-29&opponent=Austin%20Peay'),async()=>{throw new Error('offline')});
 const data=await response.json();assert.equal(response.status,200);assert.equal(data.configured,true);assert.match(data.sourceUrl,/eventCalendarId\/401901499/);assert.equal(data.linkLabel,'Watch on ESPN+');
});

test('links the exact North Alabama at Little Rock match to its official live stats', async () => {
  let requests = 0;
  const response = await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=gracie&date=2026-10-15&opponent=Little%20Rock'), async () => {
    requests += 1;
    throw new Error('A link-only StatBroadcast source must not be fetched by the API.');
  });
  const data = await response.json();
  assert.equal(data.available, false);
  assert.equal(data.configured, true);
  assert.equal(data.source, 'Little Rock StatBroadcast Live Stats');
  assert.equal(data.sourceUrl, 'https://stats.statbroadcast.com/broadcast/?id=663837');
  assert.match(data.status, /North Alabama at Little Rock/);
  assert.equal(requests, 0);
});

test('applies official school live-event hubs to every high-school and JV game', async () => {
  const cases = [
    ['dane', 'Northview', /bonita-high-school/],
    ['jack', 'Carmel', /soquel-high-school/],
    ['eli-santa-cruz-soccer', 'Sequoia', /santa-cruz-high-school/],
    ['eli-football', 'Harbor', /santa-cruz-high-school/],
  ];
  for (const [teamPage, opponent, expected] of cases) {
    const response = await familyLiveGame(new Request(`https://family.test/api/family-live-game?teamPage=${teamPage}&date=2026-10-16&opponent=${opponent}`),async()=>{throw new Error('offline')});
    const data = await response.json();
    assert.equal(data.configured, true);
    assert.match(data.sourceUrl, expected);
    assert.match(data.status, /scorekeeper publishes them/);
  }
});

test('shows useful pregame details for the exact Napa club match', async () => {
  const response = await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=eli&date=2026-10-24&opponent=Napa%20United'));
  const data = await response.json();
  assert.equal(data.configured, true);
  assert.match(data.sourceUrl, /napaunited\.org\/ecnl-boys/);
  assert.equal(data.heading, 'Tomorrow’s match');
  assert.match(data.status, /9:00 AM PDT/);
  assert.match(data.status, /1099583/);
});
