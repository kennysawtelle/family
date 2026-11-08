import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {displayTeamName,schoolKey} from '../game-records.mjs';
import {teams} from '../game-teams.mjs';

test('every Family athlete uses the same complete game-page journey',()=>{
  assert.ok(Object.keys(teams).length>=6);
  for(const page of Object.keys(teams)){
    const schedule=readFileSync(new URL('../'+page,import.meta.url),'utf8');
    assert.match(schedule,/schedule-ui\.js/,`${page} must use shared game navigation`);
  }
  const page=readFileSync(new URL('../game.html',import.meta.url),'utf8');
  for(const id of ['awayRecord','homeRecord','team-comparison','matchup-report','series-content'])assert.match(page,new RegExp(`id="${id}"`));
});

test('postseason rankings and round labels never change team identity',()=>{
  for(const name of ['Central Arkansas','Austin Peay','Abilene Christian','North Alabama']){
    assert.equal(displayTeamName(`#3 ${name} — Conference Quarterfinal`),name);
    assert.equal(schoolKey(`#3 ${name} — Conference Quarterfinal`),schoolKey(name));
  }
});

test('one verified Family matchup response feeds records, context, report and history',()=>{
  const research=readFileSync(new URL('../game-research.mjs',import.meta.url),'utf8');
  for(const field of ['teamRecord','opponentRecord','context','headToHead','articles'])assert.match(research,new RegExp(field));
  assert.match(research,/displayTeamName\(params\.get\('opponent'\)\)/);
  const client=readFileSync(new URL('../game-page.js',import.meta.url),'utf8');
  assert.match(client,/function setTopRecord/);
  assert.match(client,/value\.removeAttribute\('hidden'\)/);
  assert.doesNotMatch(client,/Record'\)\.hidden/);
  assert.match(client,/renderHeadToHead\(data\.headToHead\)/);
  assert.match(client,/renderGameContext\(gameContextFromResearch\(data\)/);
  assert.match(client,/data\.opponentRecord/);
});
