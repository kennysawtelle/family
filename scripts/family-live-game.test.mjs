import assert from 'node:assert/strict';
import test from 'node:test';
import { familyLiveGame, normalizeLiveGame } from '../family-live-game.mjs';

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

test('returns an exact official tracker when its provider has no public data API', async () => {
  const response = await familyLiveGame(new Request('https://family.test/api/family-live-game?teamPage=gracie&date=2026-10-04&opponent=Eastern%20Kentucky'));
  const data = await response.json();
  assert.equal(data.available, false);
  assert.equal(data.configured, true);
  assert.match(data.sourceUrl, /id=665443/);
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
