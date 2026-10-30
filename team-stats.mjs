const profiles={
  'dane.html':{team:'Bonita High',athlete:'Dane Gosserand',url:'https://www.maxpreps.com/ca/la-verne/bonita-bearcats/football/stats/'},
  'eli-football.html':{team:'Santa Cruz High',athlete:'Elijah Landig',url:'https://www.maxpreps.com/ca/santa-cruz/santa-cruz-cardinals/football/stats/'},
  'jack.html':{team:'Soquel High JV',athlete:'Jack Harn',url:'https://www.maxpreps.com/ca/soquel/soquel-knights/football/jv/stats/'},
  'eli-santa-cruz-soccer.html':{team:'Santa Cruz High',athlete:'Elijah Landig',url:'https://www.maxpreps.com/ca/santa-cruz/santa-cruz-cardinals/soccer/winter/stats/'}
};
const fallback={
  'dane.html':[
    {category:'Receiving yards per game',name:'Dane Gosserand',detail:'Sr. · S, WR',value:'54.0',unit:'Y/G'},
    {category:'Rushing yards per game',name:'Joseph Lara',detail:'Sr. · RB, LB',value:'106.5',unit:'Y/G'},
    {category:'Total touchdowns',name:'Joseph Lara',detail:'Sr. · RB, LB',value:'14',unit:'Total'},
    {category:'Tackles per game',name:'Isaiah Lazarus',detail:'Sr. · DE, LB, TE',value:'6.3',unit:'Tckl/G'},
    {category:'Sacks',name:'Levi Gregorich',detail:'Sr. · DE, TE',value:'6.0',unit:'Sacks'},
    {category:'Interceptions',name:'Trey Harvey',detail:'Jr. · WR, LB',value:'3',unit:'INT'}
  ]
};
const plain=value=>String(value??'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
const absolute=(value,base)=>{if(!value)return null;try{return new URL(value,base).href}catch{return null}};
export function parseTeamLeaders(html,sourceUrl){
  const leaders=[],rankings=[];
  for(const match of String(html).matchAll(/<h3[^>]*class="[^"]*header[^"]*"[^>]*>([\s\S]*?)<\/h3>\s*<ul[^>]*>([\s\S]*?)<\/ul>/gi)){
    const category=plain(match[1]);if(!category)continue;let rank=0;
    for(const itemMatch of match[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)){const item=itemMatch[1];rank++;
      const name=plain(item.match(/<a[^>]*class="[^"]*name[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1]),href=absolute(item.match(/<a[^>]*class="[^"]*name[^"]*"[^>]*href="([^"]+)"/i)?.[1],sourceUrl),detail=plain(item.match(/class="[^"]*sub-title[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1]).replace(/\s*-\s*/,' · '),value=plain(item.match(/class="value\s[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1]),unit=plain(item.match(/class="abbr\s[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1]),image=absolute(item.match(/<img[^>]*src="([^"]+)"/i)?.[1]?.replace(/&amp;/g,'&'),sourceUrl);
      if(name&&value){const row={category,rank,name,detail,value,unit,href,image};rankings.push(row);if(rank===1)leaders.push(row)}
    }
  }
  const updated=plain(String(html).match(/Stats last updated on\s*([^<]{5,80})/i)?.[1]);
  return{leaders:leaders.slice(0,8),rankings,updated};
}
export async function teamStats(request,fetcher=fetch){
  const key=new URL(request.url).searchParams.get('teamPage')||'',profile=profiles[key];if(!profile)return Response.json({error:'Unknown team'},{status:400});
  try{const response=await fetcher(profile.url,{headers:{Accept:'text/html'},signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('source unavailable');const parsed=parseTeamLeaders(await response.text(),profile.url),leaders=parsed.leaders.length?parsed.leaders:(fallback[key]||[]),athleteRankings=parsed.rankings.filter(row=>row.name===profile.athlete);return Response.json({team:profile.team,athlete:{name:profile.athlete,rankings:athleteRankings},leaders,rankings:parsed.rankings.slice(0,48),updated:parsed.updated||null,sourceUrl:profile.url,source:'MaxPreps',checkedAt:new Date().toISOString(),sourceReached:true},{headers:{'Cache-Control':'public, max-age=900, s-maxage=3600','X-Content-Type-Options':'nosniff'}})}catch{return Response.json({team:profile.team,athlete:{name:profile.athlete,rankings:[]},leaders:fallback[key]||[],rankings:[],updated:null,sourceUrl:profile.url,source:'MaxPreps',checkedAt:new Date().toISOString(),sourceReached:false},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
}
