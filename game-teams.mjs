export const teams = {
  'eli-football.html': { name: 'Santa Cruz High', alias: 'Santa Cruz', sport: 'Varsity football', calendar: 'eli-football-2026.ics', source: 'https://www.maxpreps.com/ca/santa-cruz/santa-cruz-cardinals/football/schedule/' },
  'dane.html': { name: 'Bonita High', alias: 'Bonita', sport: 'Varsity football', calendar: 'dane-2026.ics', source: 'https://www.maxpreps.com/ca/la-verne/bonita-bearcats/football/schedule/' },
  'jack.html': { name: 'Soquel High JV', alias: 'Soquel', sport: 'JV football', calendar: 'jack-2026.ics', source: 'https://www.maxpreps.com/ca/soquel/soquel-knights/football/jv/schedule/' },
  'gracie.html': { name: 'North Alabama', alias: 'North Alabama', sport: "Women's soccer", calendar: 'gracie-2026.ics', source: 'https://roarlions.com/sports/womens-soccer/schedule' },
  'eli.html': { name: 'Los Gatos United', alias: 'Los Gatos United', sport: 'Youth soccer', calendar: 'eli-2026-27.ics', source: 'https://www.losgatosunited.com/' },
};

export function resolveTeamPage(params) {
 const raw=params.get('teamPage') || '';
 let name=''; try { name=new URL(raw,'https://family.kensawtelle.com').pathname.split('/').filter(Boolean).pop() || ''; } catch {}
 const key=name.endsWith('.html')?name:name+'.html';
 if(teams[key])return key;
 return Object.keys(teams).find(page=>teams[page].calendar===params.get('calendar')) || '';
}
