import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=file=>readFile(new URL(file,root),'utf8');

test('all athlete calendars have a sourced athlete-stat state',async()=>{
  const ui=await read('schedule-ui.js');
  for(const calendar of ['gracie-2026.ics','dane-2026.ics','eli-2026-27.ics','eli-santa-cruz-soccer-2026-27.ics','eli-football-2026.ics','jack-2026.ics']){
    assert.match(ui,new RegExp(calendar.replace(/[.]/g,'\\.')));
  }
  assert.match(ui,/athlete stats/);
  assert.match(ui,/Official player\/team source/);
  for(const name of ['Gracie Tyrrell','Dane Gosserand','Elijah \\(Eli\\) Landig','Jack Harn'])assert.match(ui,new RegExp(name));
});
test('MaxPreps team leaders appear on applicable team and shared game pages',async()=>{
 const [ui,game,worker]=await Promise.all([read('schedule-ui.js'),read('game-page.js'),read('_worker.js')]);
 for(const page of ['dane.html','eli-football.html','jack.html','eli-santa-cruz-soccer.html'])assert.match(ui,new RegExp(page.replace('.','\\.')));
 assert.match(ui,/\/api\/team-stats/);assert.match(game,/refreshTeamLeaders/);assert.match(game,/MaxPreps team statistics/);assert.match(worker,/teamStats\(request\)/);
});

test('game pages include sourced sport-specific team comparison',async()=>{
  const [html,page]=await Promise.all([read('game.html'),read('game-page.js')]);
  assert.match(html,/id="team-comparison"/);
  for(const label of ['Record','Goals per game','Goals allowed per game','Shots per game','Shots on goal per game'])assert.match(page,new RegExp(label));
  assert.match(page,/NCAA Division I team statistics/);
  assert.match(page,/not published by the checked team sources/);
});
