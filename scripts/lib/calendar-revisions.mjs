import { createHash } from 'node:crypto';

export function foldCalendarLine(line) {
  let result = '', width = 0;
  for (const character of line) {
    const size = Buffer.byteLength(character);
    if (width + size > 75) { result += '\r\n '; width = 1; }
    result += character; width += size;
  }
  return result;
}

// Persist this ledger alongside the source. Rebuilding unchanged schedules must
// not change revisions; editing a date must never generate a different UID.
export function reviseCalendar(source, previous = {}, now = new Date().toISOString()) {
  const stamp = new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines = source.replace(/\r?\n[ \t]/g, '').split(/\r?\n/).filter(Boolean);
  const entries = {}, blocks = [], header = [];
  let block = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { block = []; continue; }
    if (line === 'END:VEVENT') { if (!block) throw new Error('Invalid event'); blocks.push(block); block = null; continue; }
    if (block) block.push(line);
    else if (line !== 'END:VCALENDAR' && !/^(REFRESH-INTERVAL|X-PUBLISHED-TTL)[;:]/.test(line)) header.push(line);
  }
  if (block || header[0] !== 'BEGIN:VCALENDAR') throw new Error('Invalid calendar');
  const present = new Set(blocks.map(block => block.find(line => line.startsWith('UID:'))?.slice(4)));
  for (const [uid, entry] of Object.entries(previous)) {
    if (!present.has(uid)) blocks.push([...entry.lines.filter(line => !line.startsWith('STATUS:')), 'STATUS:CANCELLED']);
  }
  const rendered = blocks.flatMap(block => {
    const uid = block.find(line => line.startsWith('UID:'))?.slice(4);
    if (!uid || entries[uid]) throw new Error('Calendar events need unique, stable UIDs');
    const content = block.filter(line => !/^(DTSTAMP|LAST-MODIFIED|SEQUENCE):/.test(line));
    const hash = createHash('sha256').update(content.join('\n')).digest('hex');
    const old = previous[uid];
    const unchanged = old?.hash === hash;
    const priorSequence = Number(block.find(line => line.startsWith('SEQUENCE:'))?.slice(9) || 0);
    const sequence = unchanged ? old.sequence : Math.max(old?.sequence || 0, priorSequence, 1) + 1;
    const modified = unchanged ? old.modified : stamp;
    entries[uid] = { hash, sequence, modified, lines: content };
    return ['BEGIN:VEVENT', ...content, `SEQUENCE:${sequence}`, `DTSTAMP:${modified}`, `LAST-MODIFIED:${modified}`, 'END:VEVENT'];
  });
  const component = header.findIndex((line, index) => index > 0 && line.startsWith('BEGIN:'));
  const split = component < 0 ? header.length : component;
  const calendar = [...header.slice(0, split), 'REFRESH-INTERVAL;VALUE=DURATION:PT15M', 'X-PUBLISHED-TTL:PT15M', ...header.slice(split), ...rendered, 'END:VCALENDAR', ''].map(foldCalendarLine).join('\r\n');
  return { calendar, entries };
}
