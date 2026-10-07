# Family Sports Automation

The repository now owns the unattended refresh. GitHub Actions runs daily and can commit directly with `contents: write`.

## One-time setup
Add an Actions repository secret named `OPENAI_API_KEY`. The key is used only by the server-side GitHub runner to call the OpenAI Responses API with web search. Never put the key in a tracked file.

## Daily flow
1. Check out `main`.
2. Use the OpenAI Responses API + web search to compare the five family schedules with authoritative sources.
3. Accept only a unified diff affecting the allowlisted family files.
4. Refuse any patch that references Raiders/Broncos/49ers/Chargers calendar artifacts.
5. Apply the patch only if `git apply --check` succeeds.
6. Validate unique ICS UIDs and stream metadata.
7. Run all existing repository tests.
8. Commit and push only when the working tree contains validated changes.

The system fails closed for missing credentials, forbidden paths, invalid family
data, and test failures. Temporary research formatting or patch-context failures
are retried once and then treated as “no verified changes”; validation and the
test suite still run, avoiding a failed workflow merely because an optional
research response could not be applied safely.
