import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../ncaa-wsoc.js', import.meta.url), 'utf8');
const teamKeySource = source.match(/const teamKey=value=>([^;]+);/)?.[1];
assert.ok(teamKeySource, 'The NCAA standings team identity normalizer must exist.');
const teamKey = Function('value', `return ${teamKeySource}`);

test('every UAC Blue team matches the NCAA spelling used by the national grid', () => {
  const pairs = [
    ['North Alabama', 'North Ala.'],
    ['Eastern Kentucky', 'Eastern Ky.'],
    ['Austin Peay', 'Austin Peay'],
    ['West Georgia', 'West Ga.'],
  ];
  for (const [conferenceName, ncaaName] of pairs) {
    assert.equal(teamKey(conferenceName), teamKey(ncaaName));
  }
});

test('conference standings open with wins descending and missing records last', () => {
  assert.match(source, /let data,sortIndex=2,ascending=false/);
  assert.match(source, /if\(left===null&&right!==null\)return 1/);
  assert.match(source, /if\(left!==null&&right===null\)return -1/);
});
