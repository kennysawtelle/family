import fs from 'node:fs/promises';

const FAMILY_FILES=[
  'gracie.html','gracie-2026.ics',
  'dane.html','dane-2026.ics',
  'eli.html','eli-2026-27.ics',
  'eli-santa-cruz-soccer.html','eli-santa-cruz-soccer-2026-27.ics',
  'eli-football.html','eli-football-2026.ics',
  'jack.html','jack-2026.ics',
  'index.html','family-schedule.html','schedule-ui.js','_worker.js'
];
const NFL_FILES=['raiders-2026.ics','broncos-2026.ics','49ers-2026.ics','chargers-2026.ics'];
const REQUIRED_ICS=['gracie-2026.ics','dane-2026.ics','eli-2026-27.ics','eli-santa-cruz-soccer-2026-27.ics','eli-football-2026.ics','jack-2026.ics'];

const read=p=>fs.readFile(p,'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

function events(ics){
  return [...ics.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)\r?\nEND:VEVENT/g)].map(m=>m[1]);
}
function field(block,name){
  const m=block.match(new RegExp('^'+name+'(?:;[^:]*)?:(.*)$','m'));
  return m?.[1]?.trim()||'';
}
async function validate(){
  const index=await read('index.html');
  for(const href of ['gracie.html','dane.html','eli.html','eli-santa-cruz-soccer.html','eli-football.html','jack.html']) assert(index.includes(href),'Homepage missing '+href);
  assert(index.includes('https://nfl.kensawtelle.com/'),'Homepage missing dedicated NFL link');

  const worker=await read('_worker.js');
  for(const p of ['/raiders.html','/broncos.html','/49ers.html','/chargers.html']) assert(worker.includes(p),'Missing legacy NFL redirect '+p);

  for(const file of REQUIRED_ICS){
    const ics=await read(file);
    const ev=events(ics);
    assert(ev.length>0,file+' has no VEVENTs');
    const seen=new Set();
    for(const block of ev){
      const uid=field(block,'UID');
      assert(uid,file+' event missing UID');
      assert(!seen.has(uid),file+' duplicate UID '+uid);
      seen.add(uid);
      assert(field(block,'SUMMARY'),file+' '+uid+' missing SUMMARY');
      const provider=field(block,'X-STREAM-PROVIDER');
      const url=field(block,'URL');
      if(provider && provider!=='TBD') assert(url,file+' '+uid+' has verified provider without URL');
    }
  }

  for(const file of NFL_FILES){
    const stat=await fs.stat(file);
    assert(stat.size>0,'Legacy NFL file unexpectedly missing: '+file);
  }
}

async function main(){
  await validate();
  console.log('Family Sports validation passed.');
  console.log('Managed family files:',FAMILY_FILES.join(', '));
  console.log('NFL schedule files are validation-only and are never edited by this updater.');
}
main().catch(err=>{console.error(err.stack||err);process.exit(1)});