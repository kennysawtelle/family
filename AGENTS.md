# Shared calendar behavior

The owner requires equivalent fixes across platforms. Before releasing changes
to calendars or date/time handling, check the sibling Events, Family Sports and
NFL implementations and apply relevant fixes consistently. Also inventory the
other platforms when changing behavior they share; do not invent features where
none exist.

The shared contract and release gate are documented in
../sawtelle-tiki-events/docs/calendar-platform-consistency.md.
Preserve calendar URLs and UIDs across schedule edits. Run
node scripts/prepare-calendars.mjs after source edits, then run it with --check.
Keep the generated revision ledger in source control. Never reset revisions.
The identical scripts/lib/calendar-revisions.mjs is shared with Family, NFL and
Events; propagate fixes to every copy and run Events' cross-platform calendar
test with CALENDAR_REQUIRE_ALL=1 before deployment.
Do not test by subscribing real users, emailing anyone, or modifying production
records. Calendar apps control refresh timing; do not promise instant push.

## Clear, compact screens

Apply this standing owner preference to every page on every platform, including
admin screens. Put important information and the main action first. Show each
description once; keep card previews on cards rather than repeating them above
full details. Use readable body text, compact spacing, and mobile-friendly tap
targets. Avoid repeated promotions, oversized explanatory sections, and controls
that compete for attention. Keep optional detail behind a clearly labeled control
when helpful, without hiding essential information. Check equivalent screens in
sibling projects when fixing a repeated pattern; preserve each platform's design.

## Specific content only

Do not put implementation explanations, cross-site comparisons (such as "Like the NFL site"), or generic promises about what a page will do on user-facing pages. Show concise information about the actual event, game, team, or organization. Fetch current game information on the page automatically where supported; show sources and freshness, and use a short matchup-specific unavailable state when verification fails. Never substitute a research-launch link for the requested on-page results.
