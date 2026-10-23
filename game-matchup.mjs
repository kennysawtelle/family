import { teams, resolveTeamPage } from './game-teams.mjs';
const verifiedOpponentRecords = {
  'UC San Diego': { record: '5–2–2', asOf: 'As of September 23, 2026' },
  'West Georgia': { record: '0–5–2', asOf: 'As of September 13, 2026' }
};
const verifiedMatchupRecords = {
  'dane.html|2026-10-23|charter oak': {
    own: { record: '8–0', asOf: 'Current record · MaxPreps' },
    opponent: { record: '8–0', asOf: 'Current record · MaxPreps' }
  },
  'eli.html|2026-10-24|napa united': {
    own: { record: '1–2–1', asOf: '4 verified results through Sep 20' }
  }
};
export function matchupSides(params) {
  const teamPage = resolveTeamPage(params);
  const profile = teams[teamPage];
  const cleanRecord = value => /^\d{1,3}\s*[-–]\s*\d{1,3}(?:\s*[-–]\s*\d{1,3})?$/.test(value || '') ? value : '';
  const opponentName = params.get('opponent') || 'Opponent';
  const matchupKey = `${teamPage}|${params.get('date') || ''}|${opponentName.trim().toLowerCase()}`;
  const matchup = verifiedMatchupRecords[matchupKey];
  const own = { name: profile?.name || params.get('team') || 'Team', record: matchup?.own.record || cleanRecord(params.get('record')), asOf: matchup?.own.asOf || params.get('recordAsOf') || 'From shared link' };
  const verified = verifiedOpponentRecords[opponentName];
  const opponent = { name: opponentName, record: matchup?.opponent?.record || cleanRecord(params.get('oppRecord')) || verified?.record || '', asOf: matchup?.opponent?.asOf || verified?.asOf || 'From shared link' };
  return params.get('ha') === 'Away' ? { away: own, home: opponent } : { away: opponent, home: own };
}
