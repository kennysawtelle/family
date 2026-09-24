import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gameResearch, scheduleGame, newsItems, teams } from '../game-research.mjs';
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
test('publisher name does not count as a matching team; old and unsafe stories are excluded',()=>{
 const xml=item('Santa Cruz holds off Pajaro Valley - Santa Cruz Sentinel')+item('Pajaro Valley vs Independence - Santa Cruz Sentinel')+item('Santa Cruz vs Pajaro Valley','Fri, 19 Sep 2025 08:00:00 GMT')+item('Santa Cruz vs Pajaro Valley',undefined,'javascript:alert(1)');
 const found=newsItems(xml,profile,'Pajaro Valley','2026-09-19',Date.parse('2026-09-24'));
 assert.equal(found.length,1);assert.match(found[0].title,/holds off/);
});
test('on-page endpoint returns a sourced game without an AI key, prompt handoff, or writes',async()=>{
 const calls=[];
 const fetcher=async(url,options)=>{calls.push(url);assert.equal(options.method,undefined);return new Response(url.includes('maxpreps')?html(game):item('Santa Cruz holds off Pajaro Valley - Santa Cruz Sentinel'));};
 const r=await gameResearch(new Request('https://example.test/api/game-research?teamPage=eli-football.html&opponent=Pajaro%20Valley&date=2026-09-19'),fetcher);
 const data=await r.json();assert.equal(data.team,'Santa Cruz High');assert.equal(data.game.detail,game.description);assert.equal(data.articles.length,1);assert.equal(calls.length,3);assert.equal(data.game.watch,'https://www.nfhsnetwork.com/events/test');
});
test('failed providers return an explicit unavailable state; invalid requests never reach providers',async()=>{
 const request=q=>new Request('https://example.test/api/game-research?'+q);
 const failed=await gameResearch(request('teamPage=eli-football.html&opponent=Pajaro%20Valley&date=2026-09-19'),async()=>{throw new Error('offline')});
 assert.equal((await failed.json()).unavailable,true);
 assert.equal((await gameResearch(request('teamPage=https://evil.test&opponent=XX&date=2026-09-19'),()=>assert.fail('must not fetch'))).status,400);
});
test('game page uses automatic results and specific team profiles without old promotional filler',()=>{
 const page=readFileSync(new URL('../game.html',import.meta.url),'utf8');
 assert.doesNotMatch(page,/Like the NFL|research launch|What the analysis checks|Ask ChatGPT/);
 assert.match(page,/game-page.js/);assert.equal(teams['jack.html'].sport,'JV football');assert.equal(teams['gracie.html'].sport,"Women's soccer");
});
