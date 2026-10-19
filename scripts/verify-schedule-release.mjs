import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const env={...process.env};
// A parent node:test process must not make this separate release check skip tests.
delete env.NODE_TEST_CONTEXT;
const result=spawnSync(process.execPath,['--test',fileURLToPath(new URL('platform/schedule-contract.test.mjs',root))],{cwd:fileURLToPath(root),stdio:'inherit',env});
if(result.error)throw result.error;
if(result.status!==0)throw new Error('Release blocked: shared schedule ordering contract failed.');
