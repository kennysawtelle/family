import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const calendar = (await readFile(new URL('../gracie-2026.ics', import.meta.url), 'utf8'))
  .replace(/\r?\n[ \t]/g, '');

function event(uid) {
  const match = calendar.match(new RegExp(`BEGIN:VEVENT\\r?\\n(?:(?!END:VEVENT)[\\s\\S])*UID:${uid}(?:(?!END:VEVENT)[\\s\\S])*END:VEVENT`));
  assert.ok(match, `missing calendar event ${uid}`);
  return match[0];
}

test('Grace’s October 29 Austin Peay event includes exact watch and live-stat links', () => {
  const game = event('2026-10-29-544355e8589d@family.kensawtelle.com');
  assert.match(game, /URL:https:\/\/www\.espn\.com\/watch\/player\/_\/eventCalendarId\/401901499\?gameId=401901499/);
  assert.match(game, /X-STREAM-PROVIDER:ESPN\+/);
  assert.match(game, /Live stats: https:\/\/stats\.statbroadcast\.com\/broadcast\/\?id=665448/);
  assert.match(game, /SEQUENCE:5/);
});

test('the Austin Peay stream was not added to the earlier Abilene Christian event', () => {
  const game = event('2026-10-08-11965a63e114@family.kensawtelle.com');
  assert.doesNotMatch(game, /401901499|665448/);
});
