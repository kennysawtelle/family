const clean=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const teams=['Eastern Kentucky','North Alabama','Austin Peay','West Georgia'];
export async function familyStandings(request,fetcher=fetch){
  const team=new URL(request.url).searchParams.get('team');
  if(team!=='gracie')return Response.json({error:'No automatically published division table is available for this team.'},{status:404});
  const source='https://uacsports.com/standings.aspx?path=wsoc';
  const response=await fetcher(source,{headers:{'User-Agent':'Sawtelle Family Sports/1.0'}});
  if(!response.ok)return Response.json({error:'The official division standings are temporarily unavailable.'},{status:502});
  const html=await response.text(),table=(html.match(/<table[\s\S]*?<\/table>/i)||[''])[0];
  const rows=[...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(match=>[...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell=>clean(cell[1])));
  const parsed=rows.map(cells=>{const name=teams.find(value=>cells.includes(value));if(!name)return null;const values=cells.filter(value=>value!==name&&/^(?:\d+-\d+(?:-\d+)?|\d+|\.\d+|[WLT]\d+)$/.test(value));return values.length>=6?{team:name,conf:values[0],points:Number(values[1]),overall:values[2],pct:Number(values.at(-2)),streak:values.at(-1)}:null}).filter(Boolean);
  const blue=teams.map(name=>parsed.find(row=>row.team===name)).filter(Boolean).sort((a,b)=>b.points-a.points||b.pct-a.pct||a.team.localeCompare(b.team)).map((row,index)=>({...row,rank:index+1,mine:row.team==='North Alabama'?1:0}));
  if(blue.length!==teams.length)return Response.json({error:'The official division table format changed.'},{status:502});
  return Response.json({rows:blue,source,checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=300, s-maxage=21600'}});
}
