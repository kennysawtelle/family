export const teams = {
  'eli-football.html': { name: 'Santa Cruz High', alias: 'Santa Cruz', newsAliases: ['Santa Cruz', 'Cardinals'], sport: 'Varsity football', calendar: 'eli-football-2026.ics', source: 'https://www.maxpreps.com/ca/santa-cruz/santa-cruz-cardinals/football/schedule/' },
  'dane.html': { name: 'Bonita High', alias: 'Bonita', newsAliases: ['Bonita', 'Bearcats'], sport: 'Varsity football', calendar: 'dane-2026.ics', source: 'https://www.maxpreps.com/ca/la-verne/bonita-bearcats/football/schedule/' },
  'jack.html': { name: 'Soquel High JV', alias: 'Soquel', newsAliases: ['Soquel', 'Knights'], sport: 'JV football', calendar: 'jack-2026.ics', source: 'https://www.maxpreps.com/ca/soquel/soquel-knights/football/jv/schedule/' },
  'gracie.html': { name: 'North Alabama', alias: 'North Alabama', newsAliases: ['North Alabama', 'UNA', 'Lions'], sport: "Women's soccer", calendar: 'gracie-2026.ics', source: 'https://roarlions.com/sports/womens-soccer/schedule' },
  'eli.html': { name: 'Los Gatos United', alias: 'Los Gatos United', newsAliases: ['Los Gatos United'], sport: 'Youth soccer', calendar: 'eli-2026-27.ics', source: 'https://www.losgatosunited.com/' },
  'eli-santa-cruz-soccer.html': { name: 'Santa Cruz High', alias: 'Santa Cruz', newsAliases: ['Santa Cruz', 'Cardinals'], sport: 'Varsity boys soccer', calendar: 'eli-santa-cruz-soccer-2026-27.ics', source: 'https://www.maxpreps.com/ca/santa-cruz/santa-cruz-cardinals/soccer/winter/schedule/' },
};

export function resolveTeamPage(params) {
 const raw=params.get('teamPage') || '';
 let name=''; try { name=new URL(raw,'https://family.kensawtelle.com').pathname.split('/').filter(Boolean).pop() || ''; } catch {}
 const key=name.endsWith('.html')?name:name+'.html';
 if(teams[key])return key;
 return Object.keys(teams).find(page=>teams[page].calendar===params.get('calendar')) || '';
}
