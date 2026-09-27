# Live game consistency

## Contract

- Show a live score only when the exact teams and date map to an official
  structured source. Never reuse a nearby fixture or infer a score from posts.
- Poll through the site server with no-store responses. Keep the saved schedule
  page usable when the live provider is offline.
- Display provider status, score, game clock or period, useful sport-specific
  team statistics, scoring plays, source, and freshness when published.
- Stop labeling a scheduled game as final. Preserve the existing game URL,
  calendar UID, add-one-game link, team subscription, branded share preview,
  team links, and schedule navigation.

## September 27, 2026 inventory

| Platform | Live game implementation | Result |
| --- | --- | --- |
| Family Sports | Family game pages for NCAA soccer, high-school football and youth soccer | North Alabama at Austin Peay uses the official Austin Peay SIDEARM feed and refreshes every 30 seconds while the page is visible. Exact official StatBroadcast trackers are registered for the October 4, 8, 11 and 29 North Alabama home games; the page links directly to them because StatBroadcast does not offer the public viewer through an unauthenticated server-readable data endpoint. MaxPreps/NFHS and Los Gatos United do not publish a stable official structured feed for these schedules, so no score is invented. |
| NFL | All NFL game pages | Already use the league-wide live data implementation and are unaffected. |
| Events | Event and gallery pages | No sports games; unaffected. |
| Health Pilot | No sports games | Unaffected. |
| Good Old Ken's Polling | No sports games | Unaffected. |
| Vouch | No sports games | Unaffected. |
| Tiki Console | No owned sports-game implementation | Unaffected. |

## Verification

- The exact North Alabama/Austin Peay/date lookup returns the official live
  score, period and clock, shots, shots on goal, corners, saves, fouls, cards,
  scoring plays, attendance, and referee. A different date does not fetch it.
- The complete shared game URL renders without horizontal overflow at a
  390-by-844 phone viewport and at desktop width.
- Existing add-game and team-subscription links remain present. Tests use a
  synthetic calendar UID and do not create a subscription or send a message.
- Every readable feed response is checked against both scheduled teams and the
  exact date before a score is returned. A provider's next/current game cannot
  leak onto an older shared link.
- The official North Alabama schedule was checked for every remaining game.
  Games without an official live-stat link stay on the normal sourced game page.
