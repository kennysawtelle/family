import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../gracie.html', import.meta.url), 'utf8');
const calendar = await readFile(new URL('../gracie-2026.ics', import.meta.url), 'utf8');

test('Gracie website calendar promotes the confirmed semifinal and keeps only the final conditional', () => {
  assert.match(page, /Nov 11[\s\S]*#1 Abilene Christian — UAC Semifinal[\s\S]*Confirmed/);
  assert.match(page, /Nov 14[\s\S]*Opponent TBD — UAC Championship[\s\S]*If UNA advances/);
});

test('the confirmed semifinal is in the subscribed calendar and the conditional final is not', () => {
  assert.match(calendar, /UID:2026-11-11-uac-semifinal-abilene-christian@[\s\S]*20261111T160000[\s\S]*UAC Semifinal[\s\S]*STATUS:CONFIRMED/);
  assert.doesNotMatch(calendar, /20261114|UAC Championship Final/);
  assert.match(calendar, /20261108T130000[\s\S]*UAC First Round[\s\S]*STATUS:CONFIRMED/);
});
