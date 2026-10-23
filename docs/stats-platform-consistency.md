# Athlete and matchup statistics consistency

Checked October 8, 2026.

## Family Sports

- Every family athlete schedule has an athlete-stat section. It displays only
  statistics tied to a verified public athlete profile. When a source does not
  publish an identifiable player line, the section says so and links to the
  checked team source.
- Every family game page has a side-by-side team comparison. NCAA Division I
  women's soccer uses current NCAA tables for record, scoring, goals allowed,
  shots, and shots on goal. Other sports show the comparable records available
  from their checked team sources and explicitly identify unavailable detail.
- Current live-game statistics remain in the separate live/final card so season
  averages are not confused with one game's box score.

## Equivalent platforms checked

| Platform | Equivalent behavior | Result |
| --- | --- | --- |
| NFL | League game pages already provide team records, matchup data, and live/game statistics from the NFL data pipeline. | Checked; unaffected because its league-wide sources and UI are separate. |

## October 23, 2026 Bonita–Charter Oak check

- Family Sports now shows both current 8–0 overall and 3–0 Sierra League
  records, seven side-by-side matchup measures, rankings, key players, and the
  exact official NFHS broadcast for Bonita at Charter Oak.
- The existing shared game URL, schedule navigation, calendar UID, add-game
  action, and team subscription remain unchanged.
- The exact game identity overrides stale or missing record parameters before
  background refresh, so older shared links open with both verified 8–0 records
  and never show a "Checking current" record placeholder.
- NFL was checked and already provides its league-wide comparison and live-game
  pipeline. Events, Health Pilot, Good Old Ken's Polling, Vouch, and Tiki
  Console do not implement sports matchup statistics and are unaffected.
| Tiki Events | Event pages and galleries do not represent sports teams or athletes. | Checked; no equivalent feature to add. |

## Source limitations

- North Alabama's official 2026 roster currently says that no individual season
  statistics are available, so Gracie's card labels and shows the latest complete
  official season instead of presenting it as 2026 data.
- MaxPreps currently publishes a partial 2026 line for Dane. The card identifies
  that the player line covers 1 of Bonita’s 8 completed games so the partial
  total is not mistaken for a full-season total. Dane’s official player source
  is rechecked when the page loads, with an hourly server cache and the last
  verified values retained when the publisher is unreachable.
- Santa Cruz High publishes Elijah Landig's completed 2025–26 soccer line: 17
  games, one goal, four assists, and six points. The 2026–27 line is not published
  yet, so the card labels the season instead of presenting it as current data.
- No verified individual public line was found for Jack, Eli's club soccer team,
  or Eli's football team. Their cards retain the direct checked source and do not
  infer statistics from team results.
