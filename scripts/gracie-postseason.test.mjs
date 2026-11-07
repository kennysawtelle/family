import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../gracie.html', import.meta.url), 'utf8');
const calendar = await readFile(new URL('../gracie-2026.ics', import.meta.url), 'utf8');

test('Gracie website calendar shows the complete conditional postseason path', () => {
  assert.match(page, /Nov 11[\s\S]*#1 Abilene Christian — UAC Semifinal[\s\S]*If UNA advances/);
  assert.match(page, /Nov 14[\s\S]*Opponent TBD — UAC Championship[\s\S]*If UNA advances/);
});

test('conditional rounds are not presented as confirmed subscribed-calendar games', () => {
  assert.doesNotMatch(calendar, /20261111|20261114|UAC Semifinal|UAC Championship/);
  assert.match(calendar, /20261108T130000[\s\S]*UAC First Round[\s\S]*STATUS:CONFIRMED/);
});
