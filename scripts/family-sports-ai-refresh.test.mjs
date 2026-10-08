import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source=await readFile(new URL('./family-sports-ai-refresh.mjs',import.meta.url),'utf8');

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
