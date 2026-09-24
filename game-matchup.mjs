import { teams, resolveTeamPage } from './game-teams.mjs';
const verifiedOpponentRecords = {
  'UC San Diego': { record: '5–2–2', asOf: 'As of September 23, 2026' },
  'West Georgia': { record: '0–5–2', asOf: 'As of September 13, 2026' }
};
export function matchupSides(params) {
  const profile = teams[resolveTeamPage(params)];
  const cleanRecord = value => /^\d{1,3}\s*[-–]\s*\d{1,3}(?:\s*[-–]\s*\d{1,3})?$/.test(value || '') ? value : '';
  const own = { name: profile?.name || params.get('team') || 'Team', record: cleanRecord(params.get('record')), asOf: params.get('recordAsOf') || 'From shared link' };
  const opponentName = params.get('opponent') || 'Opponent';
  const verified = verifiedOpponentRecords[opponentName];
  const opponent = { name: opponentName, record: cleanRecord(params.get('oppRecord')) || verified?.record || '', asOf: verified?.asOf || 'From shared link' };
  return params.get('ha') === 'Away' ? { away: own, home: opponent } : { away: opponent, home: own };
}
