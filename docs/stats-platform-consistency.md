# Athlete and matchup statistics consistency

Checked October 29, 2026.

## Family Sports

- MaxPreps-backed high-school team pages now load the publisher's current team
  leaders on page view. The same leaders appear on every game page for that
  family team. Categories, players, values, source link, and freshness are
  preserved; missing publisher data is never shown as zero.
- Bonita currently includes receiving, rushing, touchdowns, tackles, sacks,
  interceptions, and other categories published by MaxPreps. Santa Cruz
  football, Soquel JV football, and Santa Cruz boys soccer use the same importer
  when their MaxPreps pages publish leader data.
- The family athlete remains the first statistics story on the team page and
  every game page. When MaxPreps publishes a team ranking, the athlete card
  states the athlete's rank and value and shows the nearest teammates for
  context before the broader team-leader list.

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
- Every sports game page uses a compact Game context summary when verified data
  is available. It prioritizes overall and conference/division records,
  home/road and recent form, postseason stakes, streaks, and meaningful
  milestones. Missing fields are omitted instead of producing unavailable
  filler; detailed comparisons and head-to-head history remain below.

## Equivalent platforms checked

| Platform | Equivalent behavior | Result |
| --- | --- | --- |
| NFL | League game pages provide team records, matchup data, and live/game statistics from the NFL data pipeline. | Updated with the same compact Game context hierarchy using live ESPN overall, conference, division, home, road, streak, and playoff-position fields when published. |
| Tiki Events | Event pages and galleries do not represent sports teams or athletes. | Checked; no equivalent feature to add. |

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
