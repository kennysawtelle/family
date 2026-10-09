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
- Keep each result as a direct sourced link with its publication date. Do not
  synthesize or truncate article text.

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
