# Standings consistency

## Shared rules

- Match teams by stable IDs when a source provides them. When two official
  sources publish different names, normalize every team in the affected
  division, not only the highlighted family team.
- Put published records ahead of missing records in either sort direction.
- Open standings in the sport's meaningful order. Conference standings use
  conference wins, fewer conference losses, then overall winning percentage.
- Keep every displayed column sortable and keep the family athlete's team
  highlighted without changing its true position.
- Show a dash when an official source does not publish a value; do not invent it.

## Platform inventory

| Platform | Standings implementation | Result |
| --- | --- | --- |
| Family Sports | UAC division table and NCAA Division I women's soccer grid | UAC aliases and conference-first ordering checked for North Alabama, Eastern Kentucky, Austin Peay, and West Georgia. |
| NFL | Eight division tables and the sortable 32-team table | Uses ESPN team abbreviations as stable IDs; all records are complete and the existing wins-first NFL ordering is unaffected. |
| Events | No sports standings | Unaffected. |
| Health Pilot | No sports standings | Unaffected. |
| Good Old Ken's Polling | No sports standings | Unaffected. |
| Vouch | No sports standings | Unaffected. |
| Tiki Console | No owned sports standings | Unaffected. |
