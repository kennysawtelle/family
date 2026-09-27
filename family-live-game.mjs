const sources = new Map([
  ['gracie|2026-09-27|austin peay', {
    feed: 'https://sidearmstats.com/apsu/wsoc/game.json?detail=full',
    page: 'https://letsgopeay.com/sidearmstats/wsoc/summary',
    provider: 'Austin Peay SIDEARM Live Stats',
    previewUrl: 'https://letsgopeay.com/news/2026/9/26/womens-soccer-soccer-hosts-lions-in-uac-home-opener.aspx',
    previewTitle: 'Austin Peay match preview',
    notes: [
      'North Alabama entered tied for first in the UAC Blue Division after its 1–0 conference win at West Georgia.',
      'This is the eighth meeting between North Alabama and Austin Peay.',
      'Austin Peay entered 1–6–3 in its previous 10 home matches.',
      'The match is being broadcast on ESPN+.',
    ],
  }],
]);

const key = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const integer = value => Number.isFinite(Number(value)) ? Number(value) : null;
const text = value => typeof value === 'string' ? value.trim() : '';
const clock = seconds => {
  const total = integer(seconds);
  if (total === null) return '';
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
const totals = team => {
  const values = team?.Totals?.Values || {};
  return Object.fromEntries(['Goals', 'Shots', 'OnGoal', 'Corners', 'Saves', 'Fouls', 'YellowCard', 'RedCard']
    .map(name => [name, integer(values[name])]).filter(([, value]) => value !== null));
};

export function normalizeLiveGame(raw, source, now = new Date()) {
  const game = raw?.Game;
  if (!game?.HomeTeam || !game?.VisitingTeam) throw new Error('The official live score is unavailable.');
  const state = game.IsComplete ? 'final' : game.HasStarted ? 'live' : 'pregame';
  const period = integer(game.Period);
  const status = state === 'final' ? 'Final' : state === 'live'
    ? `${period === 1 ? '1st half' : period === 2 ? '2nd half' : period ? `Period ${period}` : 'Live'}${clock(game.ClockSeconds) ? ` · ${clock(game.ClockSeconds)}` : ''}`
    : `Scheduled · ${text(game.StartTime)}`;
  const side = team => ({ name: text(team.Name), score: integer(team.Score), logo: text(team.Logo) || null });
  const scoring = (raw.Plays || []).filter(play => play?.Type === 'GOAL').map(play => ({
    period: integer(play.Period), clock: clock(play.ClockSeconds), narrative: text(play.Narrative),
    homeScore: integer(play.Score?.HomeTeam), awayScore: integer(play.Score?.VisitingTeam),
  }));
  return {
    state, status, home: side(game.HomeTeam), away: side(game.VisitingTeam),
    homeStats: totals(raw.Stats?.HomeTeam), awayStats: totals(raw.Stats?.VisitingTeam), scoring,
    venue: text(game.Location), attendance: integer(game.Attendance), officials: text(game.Officials),
    notes: source.notes || [], previewUrl: source.previewUrl || null, previewTitle: source.previewTitle || null,
    sourceUrl: source.page, source: source.provider, checkedAt: now.toISOString(),
  };
}

export async function familyLiveGame(request, fetcher = fetch) {
  const params = new URL(request.url).searchParams;
  const id = `${key(params.get('teamPage'))}|${params.get('date') || ''}|${key(params.get('opponent'))}`;
  const source = sources.get(id);
  if (!source) return Response.json({ available: false, checkedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const response = await fetcher(source.feed, { signal: AbortSignal.timeout(7000), headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Source unavailable');
    return Response.json({ available: true, ...normalizeLiveGame(await response.json(), source) }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return Response.json({ available: false, sourceUrl: source.page, checkedAt: new Date().toISOString() }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
