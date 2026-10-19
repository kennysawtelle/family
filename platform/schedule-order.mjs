// Canonical shared schedule policy. Distributed to Family by sync-schedule-order.mjs.
export function schedulePhase(item, now = Date.now()) {
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
  const status = `${item.status || ''} ${item.description || ''}`;
  if (item.completed || item.state === 'post' || /cancel|final|completed|(?:^|\s)[WLT]\s+\d/i.test(status)) return 'past';
  if (item.state === 'in' || /halftime|overtime|\b(?:1st|2nd|3rd|4th)\s+(?:quarter|qtr)|\blive\b/i.test(status)) return 'live';
  if (item.dateKey && item.dateKey < today) return 'past';
  return 'upcoming';
}

export function orderSchedule(items, describe = item => item, now = Date.now()) {
  const rank = {live:0,upcoming:1,past:2};
  const stamp = item => {
    const value = item.start instanceof Date ? item.start.getTime() : Date.parse(item.start || '');
    return Number.isFinite(value) ? value : item.dateKey ? Date.parse(item.dateKey+'T23:59:59Z') : Infinity;
  };
  return items.map((item,index)=>({item,index,info:describe(item)})).sort((a,b)=>{
    const phaseA=schedulePhase(a.info,now),phaseB=schedulePhase(b.info,now);
    return rank[phaseA]-rank[phaseB] || (phaseA==='past'?-1:1)*(stamp(a.info)-stamp(b.info)) || a.index-b.index;
  }).map(entry=>entry.item);
}
