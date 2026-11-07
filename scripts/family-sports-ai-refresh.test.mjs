import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source=await readFile(new URL('./family-sports-ai-refresh.mjs',import.meta.url),'utf8');
const workflow=await readFile(new URL('../.github/workflows/family-sports-refresh.yml',import.meta.url),'utf8');

test('research retries and a malformed optional response does not fail the workflow',()=>{
 assert.match(source,/for\(let attempt=1;attempt<=2/);
 assert.match(source,/Research returned no applicable unified diff/);
 assert.match(source,/process\.exit\(0\)/);
});

test('patch extraction accepts a fenced response while retaining path guards',()=>{
 assert.match(source,/text\.indexOf\('diff --git'\)/);
 assert.match(source,/Patch attempted forbidden path/);
 assert.match(source,/Generated patch failed to apply/);
});

test('daily research includes Eli Santa Cruz High soccer as its own schedule',()=>{
 assert.match(source,/eli-santa-cruz-soccer\.html/);
 assert.match(source,/eli-santa-cruz-soccer-2026-27\.ics/);
 assert.ok(source.includes('santa-cruz-cardinals/soccer/winter/schedule/')); 
});

test('daily research checks postseason advancement and confirmed calendar games',()=>{
 assert.match(source,/postseason brackets, championship pages/);
 assert.match(source,/When a team advances/);
 assert.match(source,/Add only confirmed matchups to the subscribed calendar/);
 assert.ok(source.includes('uacsports.com/tournaments/?id=185'));
});

test('daily workflow prepares and commits the calendar revision ledger',()=>{
 assert.match(workflow,/Prepare subscribed calendar revisions/);
 assert.match(workflow,/node scripts\/prepare-calendars\.mjs/);
 assert.match(workflow,/git add --[^\n]*calendar-revisions\.json/);
});
