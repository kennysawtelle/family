# Family Sports Automation

The daily GitHub Actions workflow validates and publishes verified non-NFL family sports schedule changes.

## Managed schedules
- Gracie — North Alabama women's soccer
- Dane — Bonita varsity football
- Eli — Los Gatos United soccer
- Eli — Santa Cruz varsity football
- Jack — Soquel JV football

NFL schedules are not managed here. Legacy NFL routes remain redirects to https://nfl.kensawtelle.com/.

## Safety rules
The workflow has repository contents write permission, preserves existing ICS subscription files, validates unique event UIDs, requires a URL when a verified stream provider is present, runs the repository test suite, and refuses to commit any change to Raiders/Broncos/49ers/Chargers ICS files.

The workflow is intentionally fail-closed: if validation or tests fail, nothing is committed.
