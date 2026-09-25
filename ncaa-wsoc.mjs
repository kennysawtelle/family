const categories={
  '94':'Assists per game','1176':'Corner kicks per game','547':'Fouls per game','1263':'Goal differential','58':'Goals-against average','1208':'Penalty kicks','95':'Points per game','551':'Red cards','424':'Save percentage','93':'Saves per game','56':'Scoring offense','1203':'Shot accuracy','984':'Shots per game','986':'Shots on goal per game','59':'Shutout percentage','910':'Total assists','914':'Total goals','915':'Total points','60':'Won-lost-tied percentage','549':'Yellow cards'
};
const decode=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#0*39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const tableFrom=html=>{
  const table=(html.match(/<table[\s\S]*?<\/table>/i)||[''])[0];
  const headers=[...(table.match(/<thead[\s\S]*?<\/thead>/i)||[''])[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(m=>decode(m[1]));
  const rows=[...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c=>decode(c[1]))).filter(r=>r.length);
  return {headers,rows};
};
export async function ncaaWomenStats(request,fetcher=fetch){
  const url=new URL(request.url),category=url.searchParams.get('category')||'60';
  if(!categories[category])return Response.json({error:'Unknown statistics category.'},{status:400});
  const base=`https://www.ncaa.com/stats/soccer-women/d1/current/team/${category}`;
  const first=await fetcher(base,{headers:{'User-Agent':'Sawtelle Family Sports/1.0'}});
  if(!first.ok)return Response.json({error:'The NCAA statistics source is temporarily unavailable.'},{status:502});
  const firstHtml=await first.text();
  const pageNumbers=[...firstHtml.matchAll(/\/p(\d+)/g)].map(m=>Number(m[1]));
  const last=Math.max(1,...pageNumbers);
  const more=await Promise.all(Array.from({length:last-1},(_,i)=>fetcher(`${base}/p${i+2}`,{headers:{'User-Agent':'Sawtelle Family Sports/1.0'}}).then(r=>r.ok?r.text():'')));
  const parsed=[firstHtml,...more].map(tableFrom),headers=parsed.find(p=>p.headers.length)?.headers||[];
  const rows=[...new Map(parsed.flatMap(p=>p.rows).map(row=>[row[1],row])).values()];
  if(!headers.length||!rows.length)return Response.json({error:'The NCAA source did not return a statistics table.'},{status:502});
  return Response.json({category,name:categories[category],headers,rows,source:base,checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=300, s-maxage=3600'}});
}
