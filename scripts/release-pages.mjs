// Shared guarded release entrypoint for NFL and Family.
import {spawnSync} from 'node:child_process';
import {existsSync,mkdtempSync,mkdirSync,readdirSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const run=(args,options={})=>{
 const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',...options});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error('Release blocked: '+args[0]+' failed.');
};
run(['scripts/verify-schedule-release.mjs']);
run(['scripts/prepare-calendars.mjs','--check']);
if(process.argv.includes('--check'))process.exit(0);
const nfl=existsSync(path.join(root,'app/page.tsx'));
let directory;
if(nfl){
 run(['scripts/run-framework.mjs','build']);
 run(['scripts/prepare-pages.mjs']);
 directory=path.join(root,'dist/client');
}else{
 directory=mkdtempSync(path.join(tmpdir(),'family-release-'));
 for(const entry of readdirSync(root,{withFileTypes:true})){
  if(entry.name.startsWith('.')||['scripts','docs','AGENTS.md','calendar-revisions.json','wrangler.toml'].includes(entry.name))continue;
  if(entry.isDirectory()&&!['platform','images','assets'].includes(entry.name))continue;
  if(entry.isFile()&&!/\.(html|js|mjs|css|ics|png|jpe?g|webp|svg|gif|ico|txt)$/i.test(entry.name))continue;
  if(entry.name==='platform'){
   // Only the browser policy is public; release tests are never shipped.
   mkdirSync(path.join(directory,'platform'),{recursive:true});
   cpSync(path.join(root,'platform/schedule-order.mjs'),path.join(directory,'platform/schedule-order.mjs'),{recursive:true});
  }else cpSync(path.join(root,entry.name),path.join(directory,entry.name),{recursive:true});
 }
}
const cli=[path.join(root,'node_modules/wrangler/bin/wrangler.js'),path.resolve(root,'../nfl/node_modules/wrangler/bin/wrangler.js')].find(existsSync);
if(!cli)throw new Error('Install Wrangler before releasing. Verification passed; nothing deployed.');
run([cli,'pages','deploy',directory,'--project-name',nfl?'sawtelle-tiki-sports':'family','--branch','main','--commit-dirty=true']);
