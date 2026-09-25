import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchupSides } from '../game-matchup.mjs';
import { ncaaSoccerRecords, schoolKey } from '../game-records.mjs';
test('legacy Eli link resolves to the team and keeps records with the right side', () => {
 const q = new URLSearchParams({ teamPage:'eli-football.html', team:'Eli', opponent:'Pajaro Valley', record:'3–1–0', oppRecord:'2–2–0' });
 const home=matchupSides(q); assert.equal(home.home.name,'Santa Cruz High'); assert.equal(home.home.record,'3–1–0'); assert.equal(home.away.record,'2–2–0');
 q.set('ha','Away'); const away=matchupSides(q); assert.equal(away.away.name,'Santa Cruz High'); assert.equal(away.home.record,'2–2–0');
});
test('missing records are not invented and saved records have provenance', () => {
 const q=new URLSearchParams({teamPage:'jack.html',record:'TBD'}); assert.equal(matchupSides(q).home.record,'');
 q.set('record','2-1'); q.set('recordAsOf','As of September 12, 2026'); assert.equal(matchupSides(q).home.asOf,'As of September 12, 2026');
});

test('verified opponent records replace stale unavailable link values', () => {
 const q=new URLSearchParams({teamPage:'gracie.html',opponent:'UC San Diego',oppRecord:'Record unavailable'});
 const sides=matchupSides(q);
 assert.equal(sides.away.record,'5–2–2');
 assert.equal(sides.away.asOf,'As of September 23, 2026');
});

test('extensionless, absolute and calendar-only shared links resolve real teams',()=>{
 for(const teamPage of ['jack','/jack','/jack/','jack.html','https://family.kensawtelle.com/jack']) {
  const q=new URLSearchParams({teamPage,team:'Jack Harn',ha:'Away'});assert.equal(matchupSides(q).away.name,'Soquel High JV');
 }
 const q=new URLSearchParams({calendar:'jack-2026.ics',team:'Jack Harn'});assert.equal(matchupSides(q).home.name,'Soquel High JV');
});

test('all NCAA soccer rows become current opponent records with school aliases',()=>{
 const records=ncaaSoccerRecords([['98','North Ala.','4','1','3','.688'],['200','Austin Peay','3','4','2','.444']]);
 assert.equal(records.get(schoolKey('North Alabama')).record,'4–1–3');
 assert.equal(records.get(schoolKey('Austin Peay')).record,'3–4–2');
 assert.equal(schoolKey('Central Arkansas'),schoolKey('Central Ark.'));
 assert.equal(schoolKey('Tarleton State'),schoolKey('Tarleton St.'));
});
