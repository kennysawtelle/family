import { teams } from './game-teams.mjs';
export { teams };

const plain = value => String(value ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
const normalized = value => plain(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const hasName = (text, name) => (` ${normalized(text)} `).includes(` ${normalized(name)} `);
const hasTeamName = (text, profile) => (profile.newsAliases || [profile.alias]).some(name => hasName(text, name));
const safeUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; } };
const pacificDate = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
const verifiedReports=new Map([
  ['gracie.html|2026-10-08|abilene christian',{title:'North Alabama hosts Abilene Christian in UAC crossover match',summary:'North Alabama enters the conference crossover match at 2–1 in UAC play after a 3–2 loss to Eastern Kentucky. Abilene Christian is 4–2–5 overall and 1–0–2 in conference play, led by Addison Briscoe with five goals and three assists. UNA is seeking its first win in the series after losing the teams’ first two meetings.',url:'https://roarlions.com/news/2026/10/7/womens-soccer-soccer-to-welcome-abilene-christian-for-thursday-night-matchup.aspx',source:'University of North Alabama Athletics',published:'2026-10-07T16:00:00.000Z'}]
]);
const verifiedMatchups=new Map([
  ['eli.html|2026-10-24|napa united',{
    source:'Napa United ECNL Boys',sourceUrl:'https://napaunited.org/ecnl-boys',
    kickoff:'2026-10-24T16:00:00Z',venue:'Silverado Middle School Football Field, 1133 Coombsville Rd, Napa, CA 94558',
    teamRecord:{record:'1–2–1',league:'4 verified results through Sep 20'},
    comparison:[['Competition','ECNL Boys','ECNL Boys'],['Conference','Northern California','Northern California'],['Age group','B2008/09','B2008/09']],
    insights:[
      'Kickoff is tomorrow at 9:00 AM PDT at Silverado Middle School Football Field in Napa.',
      'This is ECNL B2008/09 match #1099583 in the 2026–27 season.',
      'Napa United joined the ECNL Boys Northern California Conference for the 2026–27 season.',
      'Los Gatos United’s displayed 1–2–1 record covers the four results that could be verified through September 20; later club results are not publicly posted, so the page does not guess an updated record.'
    ],checkedAt:'2026-10-23T14:00:00-07:00'
  }],
  ['dane.html|2026-10-23|charter oak',{
    source:'MaxPreps official matchup',
    sourceUrl:'https://www.maxpreps.com/ca/football/game/bonita-la-verne-vs-charter-oak-covina/10-23-2026/?c=6425630f-d219-4149-8a00-6e5b1d15b582',
    watch:'https://www.nfhsnetwork.com/events/charter-oak-high-school-covina-ca/gam7173ae9630',
    kickoff:'2026-10-24T02:00:00Z',venue:'Charter Oak High School, 1430 E Covina Blvd, Covina, CA 91724',
    teamRecord:{record:'8–0',league:'3–0 league'},opponentRecord:{record:'8–0',league:'3–0 league'},
    comparison:[['Record','8–0','8–0'],['League','3–0','3–0'],['Points per game','37.6','37.0'],['Total yards per game','357.8','357.7'],['Passing yards per game','203.1','199.0'],['Rushing yards per game','154.6','158.7'],['Sacks per game','2.6','3.7']],
    insights:[
      'Both teams enter undefeated at 8–0 overall and 3–0 in Sierra League play.',
      'The matchup is almost even in total offense: Bonita averages 357.8 yards per game and Charter Oak averages 357.7.',
      'Bonita averages 37.6 points per game; Charter Oak averages 37.0.',
      'Bonita is ranked No. 132 in California and No. 15 in Southern Section Division 3. Charter Oak is No. 154 in California and No. 10 in Division 4.',
      'Players highlighted by the matchup source include Bonita running back Joseph Lara and receiver Dane Gosserand, plus Charter Oak quarterback Dutch Burbidge and receiver Chase Martin.'
    ],checkedAt:'2026-10-23T20:40:00-07:00'
  }]
]);
async function read(url, fetcher) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(6500), headers: { Accept: 'text/html,application/rss+xml' } });
  if (!response.ok) throw new Error('Source unavailable');
  const text = await response.text();
  if (text.length > 2500000) throw new Error('Source too large');
  return text;
}

// Match structured event data by both teams, sport/level and local game date.
// Never use a nearby fixture or a varsity score as a JV result.
export function scheduleGame(html, profile, opponent, date) {
  const candidates = [];
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (value['@type'] === 'SportsEvent') candidates.push(value);
    for (const child of Object.values(value)) if (typeof child === 'object') Array.isArray(child) ? child.forEach(visit) : visit(child);
  }
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(match[1])); } catch { /* Malformed provider data is not evidence. */ }
  }
  return candidates.flatMap(event => {
    const names = [event.name, event.homeTeam?.name, event.awayTeam?.name].join(' ');
    const text = [names, event.description, event.sport].join(' ');
    if (!hasName(names, profile.alias) || !hasName(names, opponent) || !Number.isFinite(Date.parse(event.startDate)) || pacificDate(event.startDate) !== date) return [];
    if (/JV/.test(profile.sport) && !/\b(jv|junior varsity)\b/i.test(text)) return [];
    if (/soccer/i.test(profile.sport) && !/soccer/i.test(text)) return [];
    if (/football/i.test(profile.sport) && !/football/i.test(text)) return [];
    const sourceUrl = safeUrl(event.url) || profile.source;
    const watch = (Array.isArray(event.offers) ? event.offers : [event.offers]).map(offer => safeUrl(offer?.url)).find(url => url && new URL(url).hostname === 'www.nfhsnetwork.com');
    const address = event.location?.address;
    const opponentTeam=hasName(event.homeTeam?.name,profile.alias)?event.awayTeam:event.homeTeam;
    return [{ title: plain(event.name), detail: plain(event.description), kickoff: event.startDate,
      venue: [event.location?.name, address?.streetAddress, address?.addressLocality, address?.addressRegion].filter(Boolean).join(', '),
      sourceUrl, source: new URL(sourceUrl).hostname.replace(/^www\./, ''), watch: watch || null,
      cancelled: /EventCancelled$/.test(event.eventStatus || ''), opponentUrl:safeUrl(opponentTeam?.url) }];
  })[0] || null;
}

export function teamRecord(html) {
  const block=String(html).match(/TeamRecord__StyledTeamRecord[^>]*>[\s\S]{0,2500}?<div class="stat-label">Overall<\/div>\s*<div class="data">\s*([0-9]+\s*[-–]\s*[0-9]+(?:\s*[-–]\s*[0-9]+)?)/i);
  return block?block[1].replace(/\s/g,'').replace(/-/g,'–'):null;
}

export function newsItems(xml, profile, opponent, date, now = Date.now()) {
  const rawTag = (xml, name) => xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`))?.[1] || '';
  const tag = (xml, name) => plain(rawTag(xml, name));
  const target = Date.parse(date + 'T12:00:00Z');
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap(match => {
    const title = tag(match[1], 'title'), published = tag(match[1], 'pubDate'), at = Date.parse(published);
    const publisher = tag(match[1], 'source');
    const headline = publisher && title.endsWith(' - ' + publisher) ? title.slice(0, -publisher.length - 3) : title;
    const headlineDate = headline.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,\s*(20\d{2}))?/i);
    if (headlineDate) {
      const parsed = Date.parse(`${headlineDate[1]} ${headlineDate[2]}, ${headlineDate[3] || date.slice(0, 4)} 12:00:00 UTC`);
      if (Number.isFinite(parsed) && Math.abs(parsed - target) > 86400000) return [];
    }
    const officialPublisher=/\b(athletics|university|college|high school|conference)\b/i.test(publisher);
    const teamMentioned=hasTeamName(headline,profile)||(officialPublisher&&hasTeamName(publisher,profile));
    const opponentMentioned=hasName(headline,opponent)||(officialPublisher&&hasName(publisher,opponent));
    if (!teamMentioned || !opponentMentioned || !Number.isFinite(at) || at > now + 3600000 || at < target - 30 * 86400000 || at > target + 7 * 86400000) return [];
    if (/JV/.test(profile.sport) && !/\b(jv|junior varsity)\b/i.test(title)) return [];
    if (/Youth/.test(profile.sport) && !/\b(youth|u\d\d|boys|girls)\b/i.test(title)) return [];
    if (/soccer/i.test(profile.sport) && !/\b(soccer|wsoc)\b/i.test(title)) return [];
    if (/football/i.test(profile.sport) && !/\bfootball\b/i.test(title)) return [];
    const url = safeUrl(tag(match[1], 'link'));
    const rawDescription=rawTag(match[1],'description');
    const description=plain(rawDescription);
    const summary=!/<a\b|href\s*=|\.\.\.|…/i.test(rawDescription)&&description.length>=80&&description.length<=900&&normalized(description)!==normalized(title)?description:null;
    return url ? [{ title, ...(summary?{summary}:{}), url, source: tag(match[1], 'source') || new URL(url).hostname, published: new Date(at).toISOString() }] : [];
  }).filter((item, index, all) => all.findIndex(other => other.title === item.title) === index).slice(0, 4);
}

export async function gameResearch(request, fetcher = fetch) {
  const params = new URL(request.url).searchParams;
  const profile = teams[params.get('teamPage')];
  const opponent = (params.get('opponent') || '').trim(), date = params.get('date') || '';
  if (!profile || opponent.length < 2 || opponent.length > 100 || !/^[\p{L}\p{N} .&'’()/-]+$/u.test(opponent) || !/^20\d\d-\d\d-\d\d$/.test(date) || !Number.isFinite(Date.parse(date))) return Response.json({ error: 'Choose a game from a family schedule.' }, { status: 400 });
  const gameDate=new Date(date+'T12:00:00Z');
  const monthDay=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',timeZone:'UTC'}).format(gameDate);
  const aliases=profile.newsAliases||[profile.alias];
  const aliasQuery=aliases.length>1?'('+aliases.map(name=>`"${name}"`).join(' OR ')+')':`"${aliases[0]}"`;
  const queries=[
    `${aliasQuery} "${opponent}" ${profile.sport}`,
    `${aliasQuery} "${opponent}" (preview OR recap OR roundup OR score)`,
    `${aliasQuery} "${opponent}" "${monthDay}" ${date.slice(0,4)}`
  ];
  const feeds=queries.flatMap(query=>[`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`,`https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`]);
  const results = await Promise.allSettled([read(profile.source, fetcher), ...feeds.map(url => read(url, fetcher))]);
  const verified=verifiedMatchups.get(`${params.get('teamPage')}|${date}|${normalized(opponent)}`);
  const sourcedGame = results[0].status === 'fulfilled' ? scheduleGame(results[0].value, profile, opponent, date) : null;
  const game = verified ? {...(sourcedGame||{}),title:`${profile.name} at ${opponent}`,detail:verified.detail || `${profile.name} at ${opponent} · ${profile.sport}`,kickoff:verified.kickoff,venue:verified.venue,sourceUrl:verified.sourceUrl,source:verified.source,watch:verified.watch,cancelled:false} : sourcedGame;
  const pinned=verifiedReports.get(`${params.get('teamPage')}|${date}|${normalized(opponent)}`);
  const articles = [pinned,...results.slice(1).flatMap(result => result.status === 'fulfilled' ? newsItems(result.value, profile, opponent, date) : [])].filter(Boolean).filter((item, i, all) => all.findIndex(other => other.url === item.url || other.title === item.title) === i).slice(0, 4);
  let opponentRecord=verified?.opponentRecord?{...verified.opponentRecord,sourceUrl:verified.sourceUrl}:null;
  if(!opponentRecord&&game?.opponentUrl&&new URL(game.opponentUrl).hostname.endsWith('maxpreps.com'))try{const page=await read(game.opponentUrl,fetcher),record=teamRecord(page);if(record)opponentRecord={record,sourceUrl:game.opponentUrl}}catch{/* The game details remain useful if the opponent profile is offline. */}
  return Response.json({ team: profile.name, opponent, sport: profile.sport, date, game, opponentRecord,
    teamRecord:verified?.teamRecord?{...verified.teamRecord,sourceUrl:verified.sourceUrl}:null,
    comparison:verified?.comparison||null,insights:verified?.insights||[],comparisonSource:verified?{label:verified.source,url:verified.sourceUrl,checkedAt:verified.checkedAt}:null,articles,
    sourceUrl: profile.source, checkedAt: new Date().toISOString(), unavailable: results.every(result => result.status === 'rejected') },
    { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
