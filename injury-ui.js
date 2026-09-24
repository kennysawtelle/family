(()=>{
  const calendars={
    gracie:{card:"gracie",page:"gracie.html",file:"gracie-2026.ics",name:"Gracie"},
    dane:{card:"dane",page:"dane.html",file:"dane-2026.ics",name:"Dane"},
    "eli-soccer":{card:"eli-soccer",page:"eli.html",file:"eli-2026-27.ics",name:"Eli"},
    "eli-football":{card:"eli-football",page:"eli-football.html",file:"eli-football-2026.ics",name:"Eli"},
    jack:{card:"jack",page:"jack.html",file:"jack-2026.ics",name:"Jack Harn"}
  };
  const label=injury=>injury.durationType==="season"?"for the season":injury.durationType==="games"?`for ${injury.durationValue} game${Number(injury.durationValue)===1?"":"s"}`:`for ${injury.durationValue} week${Number(injury.durationValue)===1?"":"s"}`;
  const active=injury=>injury?.injured&&injury.affectedUids?.length&&new Date().toISOString().slice(0,10)<=injury.throughDate;
  const addBanner=(target,text,className)=>{
    if(!target||target.querySelector(`.${className}`))return;
    const notice=document.createElement("div");
    notice.className=className;
    notice.setAttribute("role","status");
    notice.textContent=text;
    target.prepend(notice);
  };
  const style=document.createElement("style");
  style.textContent='.injury-card{position:absolute;z-index:4;top:12px;left:12px;right:12px;background:#8b1e2d;color:#fff;padding:10px 12px;border-radius:8px;font-weight:900;box-shadow:0 3px 10px #0006}.injury-page{margin:0 0 16px;background:#fff0f1;color:#691421;border-left:6px solid #a82336;padding:14px 16px;border-radius:8px;font-weight:800}.injury-row td{background:#fff0f1!important}.injury-row td:first-child{border-left:7px solid #b42336}.injury-status{display:block;width:max-content;max-width:100%;margin-top:8px;padding:5px 7px;border-radius:5px;background:#b42336;color:#fff;font-weight:900;font-size:.78rem;line-height:1.2;text-transform:uppercase;letter-spacing:.02em}.injury-row .game-text-link{margin-bottom:2px}';
  document.head.appendChild(style);
  document.addEventListener("DOMContentLoaded",async()=>{
    let injuries={};
    try{const response=await fetch("/api/injuries",{cache:"no-store"});if(response.ok)injuries=(await response.json()).injuries||{};}catch{}
    for(const [key,definition] of Object.entries(calendars)){
      const injury=injuries[key];
      if(!active(injury))continue;
      const card=document.getElementById(definition.card);
      addBanner(card?.querySelector(".media"),`Injured — not playing ${label(injury)}`,"injury-card");
      const cleanPage="/"+definition.page.replace(/\.html$/,"");
      if(location.pathname.endsWith("/"+definition.page)||location.pathname.replace(/\/$/,"")===cleanPage){
        addBanner(document.querySelector("main"),`${definition.name} is injured and not playing ${label(injury)}. Games with a red “NOT PLAYING — INJURED” label are games ${definition.name} will miss.`,"injury-page");
        let focused=false;
        const markRows=()=>{
          const opponentIndex=[...document.querySelectorAll("thead th")].findIndex(cell=>/opponent/i.test(cell.textContent));
          document.querySelectorAll("tr[data-event-uid]").forEach(row=>{
            if(!injury.affectedUids.includes(row.dataset.eventUid))return;
            row.classList.add("injury-row");
            row.setAttribute("aria-label",`${definition.name} is not playing in this game because of injury`);
            if(row.querySelector(".injury-status"))return;
            const opponent=row.cells[opponentIndex>=0?opponentIndex:Math.min(2,row.cells.length-1)];
            const note=document.createElement("span");
            note.className="injury-status";
            note.textContent="Not playing — injured";
            opponent?.appendChild(note);
          });
          if(!focused){
            const first=document.querySelector("tr.injury-row");
            const wrap=first?.closest(".table-wrap");
            if(first&&wrap){
              const head=first.closest("table")?.tHead?.getBoundingClientRect().height||0;
              wrap.scrollTop=Math.max(0,first.offsetTop-head-8);
              focused=true;
            }
          }
        };
        markRows();
        new MutationObserver(markRows).observe(document.querySelector("tbody")||document.body,{subtree:true,childList:true});
      }
    }
    if(location.pathname.endsWith("/game.html")||location.pathname.endsWith("/game")){
      const params=new URLSearchParams(location.search);
      const definition=Object.entries(calendars).find(([,item])=>item.file===params.get("calendar"));
      const injury=definition&&injuries[definition[0]];
      if(injury?.affectedUids?.includes(params.get("uid")))addBanner(document.querySelector("main")||document.body,`Not playing — ${definition[1].name} is injured.`,"injury-page");
    }
  });
})();
