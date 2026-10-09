import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const key=process.env.OPENAI_API_KEY;
if(!key) throw new Error('OPENAI_API_KEY repository secret is required.');

const managed=[
 'gracie.html','gracie-2026.ics','dane.html','dane-2026.ics',
 'eli.html','eli-2026-27.ics','eli-santa-cruz-soccer.html','eli-santa-cruz-soccer-2026-27.ics',
 'eli-football.html','eli-football-2026.ics',
 'jack.html','jack-2026.ics','index.html','family-schedule.html','schedule-ui.js','_worker.js'
];
const sources={
 gracie:['https://roarlions.com/sports/womens-soccer/schedule/2026'],
 dane:['https://www.maxpreps.com/ca/la-verne/bonita-bearcats/football/'],
 eliSoccer:['https://losgatosunited.com/'],
 eliSchoolSoccer:['https://www.maxpreps.com/ca/santa-cruz/santa-cruz-cardinals/soccer/winter/schedule/'],
 eliFootball:['https://www.maxpreps.com/ca/santa-cruz/santa-cruz-cardinals/football/','https://www.nfhsnetwork.com/schools/santa-cruz-high-school-santa-cruz-ca/football'],
 jack:['https://www.maxpreps.com/ca/soquel/soquel-knights/football/jv/','https://www.nfhsnetwork.com/schools/soquel-high-school-soquel-ca/football']
};
const files=[];
for(const path of managed) files.push({path,content:await fs.readFile(path,'utf8')});

const prompt=`You maintain Sawtelle Family Sports. Today is ${new Date().toISOString().slice(0,10)}.
Research the current authoritative/public sources on the web and update ONLY verified non-NFL family sports facts.

Athlete identities: Gracie Tyrrell; Dane Gosserand; Elijah Landig (also listed as Eli Landig); Jack Harn. Use full names when checking individual statistics so similarly named athletes are never matched.

Schedules: Gracie Tyrrell/North Alabama women's soccer; Dane Gosserand/Bonita varsity football; Elijah (Eli) Landig/Los Gatos United club soccer; Elijah (Eli) Landig/Santa Cruz High varsity boys soccer; Elijah (Eli) Landig/Santa Cruz varsity football; Jack Harn/Soquel JV football.

Authoritative starting URLs:
${JSON.stringify(sources,null,2)}

Rules:
- Prefer official athletics/team/league sources. For high-school football also verify NFHS event pages. For Los Gatos/ECNL do not promote third-party results when no authoritative public source exists.
- Never guess dates, times, venues, addresses, results, records, or streams. Leave TBD when not verified.
- Preserve every existing ICS UID and subscription filename. For a changed event increment SEQUENCE and update DTSTAMP/LAST-MODIFIED.
- For verified streams put provider + clickable URL in DESCRIPTION, URL, X-STREAM-PROVIDER and X-STREAM-URL. For unverified streams use TBD and no invented URL.
- Visible schedule Location must be venue name only; ICS LOCATION must retain the full map-friendly verified address.
- Preserve family game links, branded green/gold interaction, internal schedule scrolling, home-row tinting, team hero share images, and Cloudflare game-specific metadata.
- Keep NFL schedules off the family homepage; preserve redirects to https://nfl.kensawtelle.com/.
- Do not edit any Raiders/Broncos/49ers/Chargers ICS file.
- If a source conflicts, do not choose a side unless one source is clearly more authoritative/current; otherwise preserve current data and note nothing by changing files.
- Make the smallest safe edits.\n- You MUST modify only the existing repository files included below. Do not create, reference, rename, or propose any new file, helper, component, script, stylesheet, or architecture. In particular, solve record display changes inside the existing HTML/JS files supplied below.
- Return ONLY a standard unified git diff beginning with "diff --git". If no verified file change is needed, return exactly NO_CHANGES.

Current repository files:
${files.map(f=>`\n===== ${f.path} =====\n${f.content}`).join('')}`;

const research=async()=>{
 const response=await fetch('https://api.openai.com/v1/responses',{
  method:'POST',
  headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
  body:JSON.stringify({
    model:'gpt-5.6-terra',
    reasoning:{effort:'medium'},
    tools:[{type:'web_search',search_context_size:'high'}],
    input:prompt,
    max_output_tokens:30000
  })
 });
 if(!response.ok)throw new Error(`OpenAI API ${response.status}: ${await response.text()}`);
 const data=await response.json();
 return (data.output||[]).flatMap(i=>i.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n').trim();
};
let text='';
for(let attempt=1;attempt<=2;attempt+=1){
 try{text=await research()}catch(error){
  if(attempt===2)throw error;
  console.warn(`Research attempt ${attempt} failed; retrying once: ${error.message}`);
  continue;
 }
 if(text==='NO_CHANGES'||text.includes('diff --git'))break;
 console.warn(`Research attempt ${attempt} returned neither NO_CHANGES nor a unified diff${attempt===1?'; retrying once.':'.'}`);
}
if(text==='NO_CHANGES'){console.log('No verified changes found.');process.exit(0)}
const diffStart=text.indexOf('diff --git');
if(diffStart<0){
 console.warn('::warning::Research returned no applicable unified diff after two attempts. Continuing with validation and making no changes.');
 process.exit(0);
}
text=text.slice(diffStart).replace(/\n```[\s\S]*$/,'').trimEnd()+'\n';

await fs.writeFile('/tmp/family-sports.patch',text);
const names=[...text.matchAll(/^diff --git a\/(.+?) b\/(.+)$/gm)].flatMap(m=>[m[1],m[2]]);
const allowed=new Set(managed);
for(const name of names) if(!allowed.has(name)) throw new Error('Patch attempted forbidden path: '+name);
for(const forbidden of ['raiders-2026.ics','broncos-2026.ics','49ers-2026.ics','chargers-2026.ics'])
 if(text.includes(forbidden)) throw new Error('Patch referenced forbidden NFL artifact: '+forbidden);

const check=spawnSync('git',['apply','--check','/tmp/family-sports.patch'],{stdio:'inherit'});
if(check.status!==0){
 console.warn('::warning::Verified-research patch did not apply cleanly. Continuing with validation and making no changes.');
 process.exit(0);
}
const apply=spawnSync('git',['apply','/tmp/family-sports.patch'],{stdio:'inherit'});
if(apply.status!==0) throw new Error('Generated patch failed to apply.');
console.log('Applied verified research patch. Validation runs next.');
