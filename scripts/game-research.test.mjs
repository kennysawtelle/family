import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gameResearch, scheduleGame, teamRecord, newsItems, teams } from '../game-research.mjs';
const profile=teams['eli-football.html'];
const game={ '@type':'SportsEvent', name:'Pajaro Valley at Santa Cruz',description:'Santa Cruz varsity football won 35-27.',sport:'Football',startDate:'2026-09-20T00:30:00Z',url:'https://www.maxpreps.com/game/test/',homeTeam:{name:'Santa Cruz High School'},awayTeam:{name:'Pajaro Valley High School'},offers:[{url:'https://www.nfhsnetwork.com/events/test'}] };
const html=event=>`<script type="application/ld+json">${JSON.stringify({mainEntity:{event:[event]}})}</script>`;
const item=(title,date='Sun, 20 Sep 2026 08:13:44 GMT',url='https://example.test/report')=>`<item><title>${title}</title><source>Santa Cruz Sentinel</source><link>${url}</link><pubDate>${date}</pubDate></item>`;
test('the exact local date and both teams are required',()=>{
 assert.equal(scheduleGame(html(game),profile,'Pajaro Valley','2026-09-19').kickoff,game.startDate);
 assert.equal(scheduleGame(html(game),profile,'Pajaro Valley','2026-09-20'),null);
 assert.equal(scheduleGame(html(game),profile,'Seaside','2026-09-19'),null);
 assert.equal(scheduleGame(html({...game,name:'Seaside at Santa Cruz',awayTeam:{name:'Seaside'},description:game.description+' Pajaro Valley.'}),profile,'Pajaro Valley','2026-09-19'),null);
});
test('JV never inherits varsity results and invalid source data is ignored',()=>{
 assert.equal(scheduleGame(html(game),{...profile,sport:'JV football'},'Pajaro Valley','2026-09-19'),null);
 assert.equal(scheduleGame(html({...game,startDate:'invalid'}),profile,'Pajaro Valley','2026-09-19'),null);
 assert.equal(scheduleGame('<script type="application/ld+json">broken</script>',profile,'Pajaro Valley','2026-09-19'),null);
});
test('published MaxPreps overall records are parsed without inventing a value',()=>{
 const page='<div class="TeamRecord__StyledTeamRecord-sc-x"><div class="record"><div class="block"><div class="stat-label">Overall</div><div class="data">1-4</div></div></div></div>';
 assert.equal(teamRecord(page),'1–4');assert.equal(teamRecord('<p>No standings</p>'),null);
});
test('publisher name does not count as a matching team; old and unsafe stories are excluded',()=>{
 const xml=item('Football: Santa Cruz holds off Pajaro Valley - Santa Cruz Sentinel')+item('Pajaro Valley vs Independence - Santa Cruz Sentinel')+item('Santa Cruz vs Pajaro Valley — October 24, 2026')+item('Santa Cruz vs Pajaro Valley','Fri, 19 Sep 2025 08:00:00 GMT')+item('Santa Cruz vs Pajaro Valley',undefined,'javascript:alert(1)');
 const found=newsItems(xml,profile,'Pajaro Valley','2026-09-19',Date.parse('2026-09-24'));
 assert.equal(found.length,1);assert.match(found[0].title,/holds off/);
});
test('team nicknames and an opponent athletics publisher can identify a matchup report',()=>{
 const xml=item('Soccer: Lions earn a conference road victory','Sun, 27 Sep 2026 22:00:00 GMT','https://roarlions.com/news/recap').replace('Santa Cruz Sentinel','Austin Peay Athletics');
 const found=newsItems(xml,teams['gracie.html'],'Austin Peay','2026-09-27',Date.parse('2026-09-29'));
 assert.equal(found.length,1);assert.match(found[0].title,/Lions/);
});
test('an official team athletics publisher can supply the team name missing from a preview headline',()=>{
 const xml=item('Soccer to welcome Abilene Christian for Thursday night matchup','Wed, 07 Oct 2026 14:00:00 GMT','https://roarlions.com/news/preview').replace('Santa Cruz Sentinel','University of North Alabama Athletics');
 const found=newsItems(xml,teams['gracie.html'],'Abilene Christian','2026-10-08',Date.parse('2026-10-08T23:00:00Z'));
 assert.equal(found.length,1);assert.match(found[0].title,/Abilene Christian/);
});
test('complete publisher summaries are shown, while clipped or link-filled excerpts stay at the source',()=>{
 const complete=item('Football: Santa Cruz holds off Pajaro Valley').replace('</item>','<description>Santa Cruz built an early lead before Pajaro Valley rallied in the second half. The Cardinals stopped the final drive to preserve the conference victory.</description></item>');
 const clipped=item('Football: Santa Cruz holds off Pajaro Valley').replace('</item>','<description>Santa Cruz built an early lead before Pajaro Valley rallied...</description></item>');
 const linked=item('Football: Santa Cruz holds off Pajaro Valley').replace('</item>','<description><![CDATA[<a href="https://example.com">Santa Cruz recap</a> and more coverage from the game between the Cardinals and Pajaro Valley.]]></description></item>');
 const options=[profile,'Pajaro Valley','2026-09-19',Date.parse('2026-09-24')];
 assert.match(newsItems(complete,...options)[0].summary,/final drive/);
 assert.equal(newsItems(clipped,...options)[0].summary,undefined);
 assert.equal(newsItems(linked,...options)[0].summary,undefined);
});
test('on-page endpoint returns a sourced game without an AI key, prompt handoff, or writes',async()=>{
 const calls=[];
 const fetcher=async(url,options)=>{calls.push(url);assert.equal(options.method,undefined);return new Response(url.includes('/pajaro-valley-grizzlies/')?'<div class="TeamRecord__StyledTeamRecord-x"><div class="stat-label">Overall</div><div class="data">2-3</div>':url.includes('maxpreps')?html({...game,awayTeam:{...game.awayTeam,url:'https://www.maxpreps.com/ca/watsonville/pajaro-valley-grizzlies/football/'}}):item('Football: Santa Cruz holds off Pajaro Valley - Santa Cruz Sentinel'));};
 const r=await gameResearch(new Request('https://example.test/api/game-research?teamPage=eli-football.html&opponent=Pajaro%20Valley&date=2026-09-19'),fetcher);
 const data=await r.json();assert.equal(data.team,'Santa Cruz High');assert.equal(data.game.detail,game.description);assert.equal(data.articles.length,1);assert.equal(calls.length,8);assert.equal(data.game.watch,'https://www.nfhsnetwork.com/events/test');assert.equal(data.opponentRecord.record,'2–3');
});
test('failed providers return an explicit unavailable state; invalid requests never reach providers',async()=>{
 const request=q=>new Request('https://example.test/api/game-research?'+q);
 const failed=await gameResearch(request('teamPage=eli-football.html&opponent=Pajaro%20Valley&date=2026-09-19'),async()=>{throw new Error('offline')});
 assert.equal((await failed.json()).unavailable,true);
 assert.equal((await gameResearch(request('teamPage=https://evil.test&opponent=XX&date=2026-09-19'),()=>assert.fail('must not fetch'))).status,400);
});
test('a verified official report remains available when news feeds fail',async()=>{
 const response=await gameResearch(new Request('https://family.test/api/game-research?teamPage=gracie.html&opponent=Abilene%20Christian&date=2026-10-08'),async()=>{throw new Error('offline')});
 const data=await response.json();assert.equal(data.articles.length,1);assert.equal(data.articles[0].source,'University of North Alabama Athletics');assert.match(data.articles[0].summary,/2–1 in UAC play/);assert.match(data.articles[0].url,/roarlions\.com/);
});
test('game page uses automatic results and specific team profiles without old promotional filler',()=>{
 const page=readFileSync(new URL('../game.html',import.meta.url),'utf8');
 assert.doesNotMatch(page,/Like the NFL|research launch|What the analysis checks|Ask ChatGPT/);
 assert.match(page,/game-page.js/);assert.match(page,/id="backTeam"/);assert.equal(teams['jack.html'].sport,'JV football');assert.equal(teams['gracie.html'].sport,"Women's soccer");
 const script=readFileSync(new URL('../game-page.js',import.meta.url),'utf8');assert.match(script,/fresh:\s*Date\.now\(\)/);assert.match(script,/Return to \$\{profile\.name\} team page/);
});
test('every configured college, high-school and club team uses the shared sourced game page',()=>{
 for(const [page,team] of Object.entries(teams)){
  const schedule=readFileSync(new URL('../'+page,import.meta.url),'utf8');
  assert.match(schedule,/schedule-ui\.js/,`${page} must use shared game navigation`);
  assert.ok(team.source.startsWith('https://'),`${page} must have a verified source`);
 }
});
