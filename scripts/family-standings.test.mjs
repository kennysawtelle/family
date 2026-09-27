import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcileAustinPeayFinal } from '../family-standings.mjs';

const rows=()=>[
  {team:'North Alabama',conf:'1-0',points:3,overall:'4-1-3',pct:.688,streak:'W1'},
  {team:'Austin Peay',conf:'0-1',points:0,overall:'1-8-1',pct:.15,streak:'L2'},
];
const final={date:'9/27/2026',state:'final',away:{name:'North Alabama',score:2},home:{name:'Austin Peay',score:1}};

test('a verified final updates both conference and overall records',()=>{
  const result=reconcileAustinPeayFinal(rows(),final);
  assert.deepEqual(result[0],{team:'North Alabama',conf:'2-0',points:6,overall:'5-1-3',pct:.722,streak:'W2'});
  assert.deepEqual(result[1],{team:'Austin Peay',conf:'0-2',points:0,overall:'1-9-1',pct:.136,streak:'L3'});
});

test('a live game is not counted and an updated conference table is not counted twice',()=>{
  assert.equal(reconcileAustinPeayFinal(rows(),{...final,state:'live'})[0].conf,'1-0');
  assert.equal(reconcileAustinPeayFinal(rows(),{...final,date:'10/29/2026'})[0].conf,'1-0');
  const current=rows();current[0].conf='2-0';current[1].conf='0-2';
  assert.equal(reconcileAustinPeayFinal(current,final)[0].conf,'2-0');
  assert.equal(current[0].overall,'4-1-3');
});
