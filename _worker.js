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
  const normalized=(teamPage||"").split("/").pop();
  return new URL(map[normalized]||map[normalized+".html"]||"/sawtelle-family-sports-preview.jpg",origin).href;
};
const athleteNameFor=(teamPage,fallback)=>{
  const key=(teamPage||"").split("/").pop().replace(/\.html$/,"");
  return {gracie:"Gracie",dane:"Dane",eli:"Eli","eli-football":"Eli",jack:"Jack Harn"}[key]||fallback;
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

const familyCalendars={
  gracie:{file:"gracie-2026.ics",name:"Gracie"},
  dane:{file:"dane-2026.ics",name:"Dane"},
  "eli-soccer":{file:"eli-2026-27.ics",name:"Eli"},
  "eli-football":{file:"eli-football-2026.ics",name:"Eli"},
  jack:{file:"jack-2026.ics",name:"Jack Harn"}
};
const injuryKey="family-injuries-v1";
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store"}});
const unfold=(text)=>text.replace(/\r?\n[ \t]/g,"");
const cleanCalendarText=(value)=>value.replace(/\\n/g," ").replace(/\\,/g,",").replace(/\\;/g,";").replace(/\\\\/g,"\\");
const eventFacts=(text)=>[...unfold(text).matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)\r?\nEND:VEVENT/g)].map(match=>{
  const body=match[1];
  const get=(name)=>body.split(/\r?\n/).find(line=>line.startsWith(name+":")||line.startsWith(name+";"))||"";
  const start=get("DTSTART");
  const uid=get("UID").slice(4);
  const raw=(start.match(/:(\d{8})/)||[])[1]||"";
  return {uid,date:raw?`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`:"",cancelled:/^STATUS:CANCELLED$/m.test(body),sequence:Number((get("SEQUENCE").match(/:(\d+)/)||[])[1]||0)};
});
const affectedEvents=(facts,injury)=>{
  if(!injury?.injured||!injury.startDate)return [];
  const eligible=facts.filter(event=>event.uid&&event.date>=injury.startDate&&!event.cancelled);
  if(injury.durationType==="games")return eligible.slice(0,Math.max(1,Number(injury.durationValue)||1));
  if(injury.durationType==="weeks"){
    const end=new Date(`${injury.startDate}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate()+Math.max(1,Number(injury.durationValue)||1)*7);
    const endDate=end.toISOString().slice(0,10);
    return eligible.filter(event=>event.date<endDate);
  }
  return eligible;
};
const readState=async(env)=>env.FAMILY_CONFIG?await env.FAMILY_CONFIG.get(injuryKey,"json")||{injuries:{},revisions:{}}:{injuries:{},revisions:{}};
const foldLine=(line)=>{
  const encoder=new TextEncoder();
  const parts=[];
  let current="";
  for(const character of line){
    const candidate=current+character;
    if(encoder.encode(candidate).length>(parts.length?74:75)){parts.push(current);current=character;}else current=candidate;
  }
  if(current||!parts.length)parts.push(current);
  return parts.map((part,index)=>(index?" ":"")+part).join("\r\n");
};
const applyInjuryToCalendar=(text,calendar,state)=>{
  const injury=state.injuries?.[calendar];
  const affected=new Set(injury?.affectedUids||[]);
  const revisions=state.revisions?.[calendar]||{};
  const name=familyCalendars[calendar]?.name||"Player";
  const marker=`(Not playing — ${name} is injured)`;
  const source=unfold(text);
  const updated=source.replace(/BEGIN:VEVENT\r?\n([\s\S]*?)\r?\nEND:VEVENT/g,(whole,body)=>{
    const uid=(body.match(/^UID:(.*)$/m)||[])[1]||"";
    const revision=revisions[uid];
    const isAffected=affected.has(uid);
    let lines=body.split(/\r?\n/).filter(line=>!line.startsWith("X-FAMILY-INJURY:"));
    lines=lines.map(line=>line.replace(/ \(Not playing — [^)]+ is injured\)/g,"").replace(/^DESCRIPTION:\(Not playing — [^)]+ is injured\)\\n/,"DESCRIPTION:"));
    if(isAffected){
      lines=lines.map(line=>line.startsWith("SUMMARY:")?`${line} ${marker}`:line.startsWith("DESCRIPTION:")?`DESCRIPTION:${marker}\\n${line.slice(12)}`:line);
      lines.push("X-FAMILY-INJURY:TRUE");
    }
    if(revision){
      lines=lines.filter(line=>!line.startsWith("SEQUENCE:")&&!line.startsWith("DTSTAMP:")&&!line.startsWith("LAST-MODIFIED:"));
      lines.push(`SEQUENCE:${revision.sequence}`,`DTSTAMP:${revision.updatedAt}`,`LAST-MODIFIED:${revision.updatedAt}`);
    }
    return `BEGIN:VEVENT\n${lines.join("\n")}\nEND:VEVENT`;
  });
  return updated.split(/\r?\n/).map(foldLine).join("\r\n")+"\r\n";
};
const adminAuthorized=(request,env)=>Boolean(env.FAMILY_ADMIN_PASSWORD)&&request.headers.get("X-Admin-Password")===env.FAMILY_ADMIN_PASSWORD;
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/injuries"){
      const state=await readState(env);
      if(request.method==="GET")return json({injuries:state.injuries||{}});
      if(request.method!=="POST")return json({error:"Method not allowed"},405);
      if(!adminAuthorized(request,env))return json({error:"Incorrect administrator password"},401);
      if(!env.FAMILY_CONFIG)return json({error:"Injury storage is not configured"},503);
      let input;
      try{input=await request.json();}catch{return json({error:"Invalid request"},400);}
      const calendar=String(input.calendar||"");
      const definition=familyCalendars[calendar];
      if(!definition)return json({error:"Unknown family calendar"},400);
      const oldInjury=state.injuries?.[calendar];
      const assetResponse=await env.ASSETS.fetch(new Request(new URL("/"+definition.file,url.origin)));
      const source=await assetResponse.text();
      const facts=eventFacts(source);
      const injury=input.injured?{injured:true,startDate:String(input.startDate||""),durationType:["games","weeks","season"].includes(input.durationType)?input.durationType:"season",durationValue:Math.max(1,Number(input.durationValue)||1)}:{injured:false};
      if(injury.injured&&!/^\d{4}-\d{2}-\d{2}$/.test(injury.startDate))return json({error:"Choose the injury start date"},400);
      const affected=affectedEvents(facts,injury);
      injury.affectedUids=affected.map(event=>event.uid);
      injury.throughDate=affected.at(-1)?.date||injury.startDate||null;
      injury.updatedAt=new Date().toISOString();
      const changed=new Set([...(oldInjury?.affectedUids||[]),...injury.affectedUids]);
      state.injuries={...(state.injuries||{}),[calendar]:injury};
      state.revisions={...(state.revisions||{}),[calendar]:{...(state.revisions?.[calendar]||{})}};
      const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
      for(const uid of changed){
        const fact=facts.find(event=>event.uid===uid);
        const previous=state.revisions[calendar][uid]?.sequence||fact?.sequence||0;
        state.revisions[calendar][uid]={sequence:previous+1,updatedAt:stamp};
      }
      await env.FAMILY_CONFIG.put(injuryKey,JSON.stringify(state));
      return json({ok:true,injury});
    }
    if(url.pathname.endsWith(".ics")){
      const feeds=new Set(["/49ers-2026.ics","/broncos-2026.ics","/chargers-2026.ics","/dane-2026.ics","/eli-2026-27.ics","/eli-football-2026.ics","/gracie-2026.ics","/jack-2026.ics","/raiders-2026.ics"]);
      if(!feeds.has(url.pathname))return new Response("Calendar not found",{status:404});
      const response=await env.ASSETS.fetch(request);
      const headers=new Headers(response.headers);
      headers.set("Content-Type","text/calendar; charset=utf-8");
      headers.set("Content-Disposition",'inline; filename="'+url.pathname.slice(1)+'"');
      headers.set("Cache-Control","private, no-store");
      const calendar=Object.entries(familyCalendars).find(([,item])=>"/"+item.file===url.pathname)?.[0];
      if(calendar&&response.ok){
        const state=await readState(env);
        return new Response(applyInjuryToCalendar(await response.text(),calendar,state),{status:response.status,headers});
      }
      return new Response(response.body,{status:response.status,headers});
    }
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
      const teamPage=url.searchParams.get("teamPage")||"";
      const team=athleteNameFor(teamPage,url.searchParams.get("team")||"Family Team");
      const opponent=url.searchParams.get("opponent")||"Opponent";
      const ha=url.searchParams.get("ha")||"Home";
      const date=url.searchParams.get("date")||"";
      const time=url.searchParams.get("time")||"";
      const venue=url.searchParams.get("venue")||"";
      const record=url.searchParams.get("record")||"";
      const oppRecord=url.searchParams.get("oppRecord")||"";
      const sport=url.searchParams.get("sport")||"Sawtelle Family Sports";
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
