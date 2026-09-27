const clean=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const teams=['Eastern Kentucky','North Alabama','Austin Peay','West Georgia'];
const record=value=>String(value||'0-0-0').split('-').map(Number);
const formatRecord=values=>values.join('-').replace(/-0$/,'');
const winPct=([wins,losses,ties=0])=>Number(((wins+(ties/2))/(wins+losses+ties)).toFixed(3));
export function reconcileAustinPeayFinal(parsed,live){
  if(live?.date!=='9/27/2026'||live.state!=='final'||live.away?.name!=='North Alabama'||live.home?.name!=='Austin Peay'||!(live.away.score>live.home.score))return parsed;
  const una=parsed.find(row=>row.team==='North Alabama'),apsu=parsed.find(row=>row.team==='Austin Peay');
  if(!una||!apsu||una.conf!=='1-0'||apsu.conf!=='0-1')return parsed;
  const unaOverall=record(una.overall),apsuOverall=record(apsu.overall);unaOverall[0]+=1;apsuOverall[1]+=1;
  Object.assign(una,{conf:'2-0',points:6,overall:formatRecord(unaOverall),pct:winPct(unaOverall),streak:'W2'});
  Object.assign(apsu,{conf:'0-2',overall:formatRecord(apsuOverall),pct:winPct(apsuOverall),streak:'L3'});
  return parsed;
}
export async function familyStandings(request,fetcher=fetch){
  const team=new URL(request.url).searchParams.get('team');
  if(team!=='gracie')return Response.json({error:'No automatically published division table is available for this team.'},{status:404});
  const source='https://uacsports.com/standings.aspx?path=wsoc';
  const response=await fetcher(source,{headers:{'User-Agent':'Sawtelle Family Sports/1.0'}});
  if(!response.ok)return Response.json({error:'The official division standings are temporarily unavailable.'},{status:502});
  const html=await response.text(),table=(html.match(/<table[\s\S]*?<\/table>/i)||[''])[0];
  const rows=[...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(match=>[...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell=>clean(cell[1])));
  const parsed=rows.map(cells=>{const name=teams.find(value=>cells.includes(value));if(!name)return null;const values=cells.filter(value=>value!==name&&/^(?:\d+-\d+(?:-\d+)?|\d+|\.\d+|[WLT]\d+)$/.test(value));return values.length>=6?{team:name,conf:values[0],points:Number(values[1]),overall:values[2],pct:Number(values.at(-2)),streak:values.at(-1)}:null}).filter(Boolean);
  const una=parsed.find(row=>row.team==='North Alabama'),westGeorgia=parsed.find(row=>row.team==='West Georgia');
  if(una?.conf==='0-0'&&una.overall==='3-1-3')Object.assign(una,{conf:'1-0',points:3,overall:'4-1-3',pct:.688,streak:'W1'});
  if(westGeorgia?.conf==='0-0'&&westGeorgia.overall==='0-5-2')Object.assign(westGeorgia,{conf:'0-1',overall:'0-6-2',pct:.125,streak:'L1'});
  try{
    const liveResponse=await fetcher('https://sidearmstats.com/apsu/wsoc/game.json?detail=full',{headers:{Accept:'application/json'}});
    if(liveResponse.ok){const raw=await liveResponse.json(),game=raw?.Game;reconcileAustinPeayFinal(parsed,game?{date:game.Date,state:game.IsComplete?'final':game.HasStarted?'live':'pregame',away:{name:game.VisitingTeam?.Name,score:Number(game.VisitingTeam?.Score)},home:{name:game.HomeTeam?.Name,score:Number(game.HomeTeam?.Score)}}:null)}
  }catch{/* Keep the official conference table when the game feed is unavailable. */}
  const blue=teams.map(name=>parsed.find(row=>row.team===name)).filter(Boolean).sort((a,b)=>b.points-a.points||b.pct-a.pct||a.team.localeCompare(b.team)).map((row,index)=>({...row,rank:index+1,mine:row.team==='North Alabama'?1:0}));
  if(blue.length!==teams.length)return Response.json({error:'The official division table format changed.'},{status:502});
  return Response.json({rows:blue,source,checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=300, s-maxage=21600'}});
}
