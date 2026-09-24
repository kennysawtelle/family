// Extract the exact saved event; retain its UTC/TZID dates, UID and revisions.
export function singleGameCalendar(feed, uid) {
 const blocks=feed.match(/BEGIN:VEVENT\r?\n[\s\S]*?END:VEVENT/g)||[];
 const event=blocks.find(block=>block.replace(/\r?\n[ \t]/g,'').split(/\r?\n/).includes('UID:'+uid));
 if(!event)return null;
 const zones=feed.match(/BEGIN:VTIMEZONE\r?\n[\s\S]*?END:VTIMEZONE/g)||[];
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sawtelle//Single Game//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',...zones,event,'END:VCALENDAR',''].join('\r\n');
}
