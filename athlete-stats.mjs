const daneSource='https://www.maxpreps.com/ca/la-verne/bonita-bearcats/athletes/dane-gosserand/football/stats/?careerid=6r9nl301cefo8';
const fallback={
  athlete:'Dane Gosserand',teamGames:8,reportedGames:1,
  stats:[['Games with player stats','1 of 8'],['Receptions','4'],['Receiving yards','44'],['Yards per catch','11.0'],['Total tackles','5'],['Interceptions','1']],
  publishedAt:'October 3, 2026',sourceUrl:daneSource
};
const plain=html=>String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
export function parseDaneStats(html){
  const text=plain(html),receiving=text.match(/Receiving[\s\S]*?Sr\.\s+Var\s+26-27\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)/i);
  if(!receiving)return null;
  const top=text.slice(Math.max(0,text.indexOf('Top Stats')),Math.max(text.indexOf('Receiving'),0));
  const tackles=top.match(/\bTot\s+(\d+)/i)?.[1],interceptions=top.match(/\bInt\s+(\d+)/i)?.[1];
  const published=text.match(/Stats last updated on\s+([A-Z][a-z]+\s+\d{1,2},\s+20\d{2})/i)?.[1]||fallback.publishedAt;
  return {...fallback,reportedGames:Number(receiving[1]),stats:[['Games with player stats',`${receiving[1]} of ${fallback.teamGames}`],['Receptions',receiving[2]],['Receiving yards',receiving[3]],['Yards per catch',receiving[4]],['Total tackles',tackles||fallback.stats[4][1]],['Interceptions',interceptions||fallback.stats[5][1]]],publishedAt:published};
}
export async function athleteStats(request,fetcher=fetch){
  const key=new URL(request.url).searchParams.get('teamPage');
  if(key!=='dane'&&key!=='dane.html')return Response.json({error:'Athlete not found'},{status:404});
  let data=fallback,sourceReached=false;
  try{
    const response=await fetcher(daneSource,{headers:{Accept:'text/html'},signal:AbortSignal.timeout(7000),cf:{cacheTtl:3600,cacheEverything:true}});
    if(response.ok){sourceReached=true;data=parseDaneStats(await response.text())||fallback;}
  }catch{/* Keep the last verified publisher values. */}
  const summary=data.reportedGames<data.teamGames
    ? `MaxPreps currently includes Dane’s individual statistics for ${data.reportedGames} of Bonita’s ${data.teamGames} completed games. These are partial coach-entered totals, not a full-season line.`
    : `MaxPreps currently includes Dane’s individual statistics for all ${data.teamGames} completed games.`;
  return Response.json({...data,summary,sourceReached,checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
