const schoolAliases = new Map([
  ['north alabama', 'north ala'],
  ['university of north alabama', 'north ala'],
  ['central arkansas', 'central ark'],
  ['southeast missouri', 'southeast mo st'],
  ['tarleton state', 'tarleton st']
]);

export function schoolKey(name) {
  const key = String(name || '').toLowerCase().replace(/[.’']/g, '').replace(/\s+/g, ' ').trim();
  return schoolAliases.get(key) || key;
}

export function ncaaSoccerRecords(rows) {
  return new Map((rows || []).map(row => [schoolKey(row[1]), {
    record: `${row[2]}–${row[3]}–${row[4]}`,
    rank: row[0]
  }]));
}
