# Matchup report consistency

Checked October 8, 2026.

## Family Sports

- Search Google News and Bing News with sport-specific matchup, preview/recap,
  and exact game-date query variants.
- Recognize verified team names and nicknames: North Alabama/UNA/Lions,
  Santa Cruz/Cardinals, Bonita/Bearcats, and Soquel/Knights.
- Require the family team in the headline. Require the opponent either in the
  headline or as the named athletics publisher. This supports official opponent
  recaps without allowing a publisher name to impersonate the family team.
- Keep sport and level guards: soccer cannot inherit football coverage, youth
  reports require a youth marker, and JV reports must explicitly identify JV or
  junior varsity.
- Show a concise on-page report summary when a verified entry or publisher feed
  supplies complete text, followed by the direct source and publication date.
  Reject clipped excerpts and link-filled feed descriptions instead of implying
  that incomplete text is the full report.
- The shared game page applies this behavior to North Alabama college soccer,
  Santa Cruz and Bonita varsity teams, Soquel JV, and Los Gatos United youth
  soccer. Sport and level guards remain mandatory.

## Equivalent platforms checked

| Platform | Result |
| --- | --- |
| NFL | Uses its own league-wide game data and editorial feeds. Checked and unaffected. |
| Tiki Events | Does not provide sports matchup reports. No equivalent feature to add. |

## Live verification

The expanded search returned official or established-publisher coverage for
North Alabama–Austin Peay, North Alabama–Eastern Kentucky, and Santa
Cruz–Seaside. No exact JV report was found for Soquel–Hollister; the UI correctly
keeps the matchup-specific unavailable state rather than showing varsity or an
unrelated game.
