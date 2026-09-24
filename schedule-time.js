// Calendar feeds are the source of truth for schedule dates and times.
(function (scope) {
  const pacific = 'America/Los_Angeles';
  const zones = { Pacific: pacific, Eastern: 'America/New_York', Central: 'America/Chicago', Mountain: 'America/Denver', 'Time (PT)': pacific };
  function parts(instant, zone) {
    const values = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(instant);
    const get = name => values.find(p => p.type === name).value;
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
  }
  function instant(line) {
    const raw = line.slice(line.indexOf(':') + 1);
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(raw);
    if (!m) return null;
    const local = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
    const target = Date.parse(local + 'Z');
    if (m[7]) return new Date(target);
    const zone = /TZID="?([^;:"]+)/.exec(line)?.[1];
    if (!zone) return null; // Never interpret a floating time as the viewer's zone.
    const offsets = new Set([-86400000, 0, 86400000].map(delta => Date.parse(parts(new Date(target + delta), zone) + 'Z') - (target + delta)));
    const matches = [...offsets].map(offset => target - offset).filter(value => parts(new Date(value), zone) === local).sort((a,b) => a-b);
    return matches.length ? new Date(matches[0]) : null;
  }
  function parse(text) {
    return [...text.replace(/\r?\n[ \t]/g, '').matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)].map(match => {
      const lines = match[1].split(/\r?\n/);
      const line = name => lines.find(value => value.startsWith(name + ':') || value.startsWith(name + ';')) || '';
      const get = name => line(name).slice(line(name).indexOf(':') + 1);
      const start = instant(line('DTSTART'));
      const raw = get('DTSTART');
      const dateKey = start ? parts(start, pacific).slice(0,10) : /^\d{8}$/.test(raw) ? `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}` : '';
      const clean = value => value.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1');
      const times = Object.fromEntries(Object.entries(zones).map(([label, timeZone]) => [label, start ? new Intl.DateTimeFormat('en-US', {timeZone, ...(parts(start,timeZone).slice(0,10)!==dateKey ? {month:'short', day:'numeric'} : {}), hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(start) : 'Time TBD']));
      return {uid:get('UID'), start, dateKey, day:dateKey ? new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'UTC'}).format(new Date(dateKey+'T12:00:00Z')) : 'TBD', times, summary:clean(get('SUMMARY')), location:clean(get('LOCATION')), description:clean(get('DESCRIPTION')), status:get('STATUS').toUpperCase()};
    });
  }
  scope.ScheduleTime = { parse, instant, parts, zones, pacific };
})(globalThis);
