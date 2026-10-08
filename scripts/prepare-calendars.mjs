import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { reviseCalendar } from './lib/calendar-revisions.mjs';
const root = new URL('../', import.meta.url);
const ledgerFile = new URL('calendar-revisions.json', root);
let previous = {};
try { previous = JSON.parse(readFileSync(ledgerFile, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const ledger = {};
let changed = false;
for (const file of readdirSync(root).filter(name => name.endsWith('.ics'))) {
  const path = new URL(file, root), source = readFileSync(path, 'utf8');
  const result = reviseCalendar(source, previous[file]);
  ledger[file] = result.entries;
  if (result.calendar !== source) { changed = true; if (!process.argv.includes('--check')) writeFileSync(path, result.calendar); }
}
const json = JSON.stringify(ledger, null, 2) + '\n';
if (JSON.stringify(previous) !== JSON.stringify(ledger)) changed = true;
if (process.argv.includes('--check') && changed) throw new Error('Calendar revisions need updating. Run node scripts/prepare-calendars.mjs before publishing.');
if (!process.argv.includes('--check')) writeFileSync(ledgerFile, json);
console.log(`Verified ${Object.keys(ledger).length} calendars in ${fileURLToPath(root)}.`);
