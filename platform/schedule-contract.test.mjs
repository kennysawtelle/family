// Shared, dependency-free release tests for both sports repositories.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const nfl=existsSync(new URL('app/page.tsx',root));
const modulePath=new URL(nfl?'public/platform/schedule-order.mjs':'platform/schedule-order.mjs',root);
const {orderSchedule,schedulePhase}=await import(modulePath);
const now=Date.parse('2026-10-18T19:00:00Z');
test('release contract: live, next upcoming, later upcoming, then recent completed',()=>{
 const input=[{id:'old',dateKey:'2026-09-13',completed:true},{id:'later',dateKey:'2026-10-25'},{id:'final',dateKey:'2026-10-18',completed:true},{id:'next',dateKey:'2026-10-18',start:'2026-10-18T20:25:00Z'},{id:'live',dateKey:'2026-10-18',state:'in'}];
 assert.deepEqual(orderSchedule(input,undefined,now).map(item=>item.id),['live','next','later','final','old']);
 assert.equal(input[0].id,'old');
});
test('release contract: completed and cancelled games cannot be next',()=>{
 for(const status of ['CANCELLED','Final: 27–14','W 27–14'])assert.equal(schedulePhase({dateKey:'2026-10-18',status},now),'past');
 assert.equal(schedulePhase({dateKey:'2026-10-17'},now),'past');
 assert.equal(schedulePhase({dateKey:'2026-10-18'},now),'upcoming');
});
test('release contract: Pacific midnight and unknown kickoff times',()=>{
 const beforeMidnight=Date.parse('2026-10-19T06:59:00Z');
 assert.equal(schedulePhase({dateKey:'2026-10-18'},beforeMidnight),'upcoming');
 assert.equal(schedulePhase({dateKey:'2026-10-18'},beforeMidnight+60000),'past');
 const items=[{id:'tbd',dateKey:'2026-10-18'},{id:'timed',dateKey:'2026-10-18',start:'2026-10-18T20:25:00Z'}];
 assert.equal(orderSchedule(items,undefined,now)[0].id,'timed');
});
test('release contract: downloaded schedules receive the same ordering after loading',()=>{
 const describe=item=>({dateKey:item.date,kickoff:item.kickoff,start:item.kickoff,completed:item.completed});
 assert.deepEqual(orderSchedule([],describe,now),[]);
 const downloaded=[{date:'2026-09-13',completed:true},{date:'2026-10-25'},{date:'2026-10-18'}];
 assert.equal(orderSchedule(downloaded,describe,now)[0].date,'2026-10-18');
});
test('release contract: production schedule views consume shared ordering',()=>{
 const read=path=>readFileSync(new URL(path,root),'utf8');
 if(nfl){
  const source=read('app/page.tsx');
  assert.match(source,/orderSchedule\(loadedTeamGames/);
  assert.match(source,/Object\.groupBy\(currentTeamGames/);
  assert.doesNotMatch(source,/nextGameIndex|next\.offsetTop/);
 }else{
  assert.match(read('schedule-ui.js'),/orderSchedule\(rendered,describe\)/);
  assert.doesNotMatch(read('schedule-ui.js'),/const next=rendered.find/);
  assert.match(read('family-schedule.html'),/orderSchedule\(view===/);
 }
});
