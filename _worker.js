const esc=(s="")=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const imageFor=(teamPage,origin)=>{
  const map={
    "gracie.html":"/Gracie.jpg",
    "dane.html":"/dane.WEBP",
    "eli.html":"/eli-card.webp",
    "eli-football.html":"/sawtelle-family-sports-preview.jpg",
    "jack.html":"/jack-card-new.jpg",
    "raiders.html":"/raiders-card.jpg",
    "broncos.html":"/broncos-card.webp",
    "49ers.html":"/sawtelle-family-sports-preview.jpg",
    "chargers.html":"/sawtelle-family-sports-preview.jpg"
  };
  return new URL(map[teamPage]||"/sawtelle-family-sports-preview.jpg",origin).href;
};
const calendarBrand=(key,origin)=>{
  const calendars={
    gracie:{name:"Gracie — UNA Soccer",image:"/Gracie.jpg"},
    dane:{name:"Dane — Bonita Football",image:"/dane.WEBP"},
    "eli-soccer":{name:"Eli — Los Gatos United Soccer",image:"/eli-card.webp"},
    "eli-football":{name:"Eli — Santa Cruz High Football",image:"/sawtelle-family-sports-preview.jpg"},
    jack:{name:"Jack Harn — Soquel JV Football",image:"/jack-card-new.jpg"}
  };
  const item=calendars[key];
  return item&&{...item,image:new URL(item.image,origin).href};
};
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const nflRedirects={
      "/raiders.html":"https://nfl.kensawtelle.com/team/lv",
      "/broncos.html":"https://nfl.kensawtelle.com/team/den",
      "/49ers.html":"https://nfl.kensawtelle.com/team/sf",
      "/chargers.html":"https://nfl.kensawtelle.com/team/lac"
    };
    if(nflRedirects[url.pathname])return Response.redirect(nflRedirects[url.pathname],301);
    if(url.pathname==="/subscribe.html"){
      const cal=url.searchParams.get("cal");
      const map={raiders:"lv",broncos:"den","49ers":"sf",chargers:"lac"};
      if(cal&&map[cal])return Response.redirect("https://nfl.kensawtelle.com/calendar?team="+map[cal],301);
    }
    if(url.pathname==="/subscribe.html"){
      const brand=calendarBrand(url.searchParams.get("cal")||"",url.origin);
      if(brand){
        const assetUrl=new URL("/subscribe.html",url.origin);
        const assetResponse=await env.ASSETS.fetch(new Request(assetUrl,{headers:request.headers}));
        let html=await assetResponse.text();
        const title=`Subscribe — ${brand.name}`;
        const description=`Subscribe to the live ${brand.name} calendar from Sawtelle Family Sports.`;
        const meta=`\n<meta name="description" content="${esc(description)}">\n<link rel="canonical" href="${esc(url.href)}">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="Sawtelle Family Sports">\n<meta property="og:url" content="${esc(url.href)}">\n<meta property="og:title" content="${esc(title)}">\n<meta property="og:description" content="${esc(description)}">\n<meta property="og:image" content="${esc(brand.image)}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(title)}">\n<meta name="twitter:description" content="${esc(description)}">\n<meta name="twitter:image" content="${esc(brand.image)}">`;
        html=html.replace(/<title>[^<]*<\/title>/,`<title>${esc(title)}</title>${meta}`);
        return new Response(html,{status:assetResponse.status,headers:{"Content-Type":"text/html; charset=UTF-8","Cache-Control":"public, max-age=0, s-maxage=300"}});
      }
    }
    if(url.pathname==="/game.html"||url.pathname==="/game"){
      const team=url.searchParams.get("team")||"Family Team";
      const opponent=url.searchParams.get("opponent")||"Opponent";
      const ha=url.searchParams.get("ha")||"Home";
      const date=url.searchParams.get("date")||"";
      const time=url.searchParams.get("time")||"";
      const venue=url.searchParams.get("venue")||"";
      const record=url.searchParams.get("record")||"";
      const oppRecord=url.searchParams.get("oppRecord")||"";
      const sport=url.searchParams.get("sport")||"Sawtelle Family Sports";
      const teamPage=url.searchParams.get("teamPage")||"";
      const home=ha==="Away"?opponent:team;
      const away=ha==="Away"?team:opponent;
      const awayRecord=ha==="Away"?record:oppRecord;
      const homeRecord=ha==="Away"?oppRecord:record;
      const title=`${away} at ${home} | Sawtelle Family Sports`;
      const details=[date,time,venue].filter(Boolean).join(" · ");
      const records=(awayRecord||homeRecord)?`${away} ${awayRecord||"Record TBD"} · ${home} ${homeRecord||"Record TBD"}`:"";
      const description=[sport,records,details,"Game details, streaming and matchup analysis."].filter(Boolean).join(" · ");
      const image=imageFor(teamPage,url.origin);

      const assetUrl=new URL("/game.html",url.origin);
      const assetResponse=await env.ASSETS.fetch(new Request(assetUrl,{headers:request.headers}));
      let html=await assetResponse.text();
      const canonical=url.href;
      const meta=`
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Sawtelle Family Sports">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">`;
      html=html.replace(/<title>[^<]*<\/title>/,`<title>${esc(title)}</title>${meta}`);
      return new Response(html,{status:assetResponse.status,headers:{"Content-Type":"text/html; charset=UTF-8","Cache-Control":"public, max-age=0, s-maxage=300"}});
    }
    return env.ASSETS.fetch(request);
  }
};
