# StudentHub security checklist

Each item from the "Why vibe coded apps fail" list, with what was done and what is still yours to do.
Status: **Done** = built and in the code. **Partly** = built, but a step is still yours or the item is ongoing. **Not done** = needs you.
Nothing here has been run against your live Supabase project yet. Run `supabase/migration-v2.sql` and `supabase/rls-tests.sql`, then test with two accounts.

| # | Item | Status | What was done | What is still needed |
|---|------|--------|---------------|----------------------|
| 01 | API keys in frontend | **Done** | Only the Supabase publishable (anon) key is in the app. It is public by design, so access control comes from row-level security (RLS). The service_role key is never used. | Never paste the service_role key anywhere in the site or repository. |
| 02 | No auth / role checks | **Done** | RLS on every table. Only approved lecturers can add course material (`is_lecturer()`). Students cannot change their own role or approval (column permissions). | Approve lecturers yourself in the SQL Editor (see migration-v2.sql, section 5). |
| 03 | SQL injection | **Done** | The app never builds SQL from user input. Chat filters use validated UUIDs. Database functions take parameters only. | None. |
| 04 | XSS | **Done** | Every user value is escaped before it is shown. Links must start with https. Inline scripts moved to files so a strict Content Security Policy (CSP) can block injected scripts. | The static pages (privacy, terms, about, contact, learn, guides) still have inline scripts. Move them to files too, then add the CSP to them. |
| 05 | Passwords not hashed | **Done** | Supabase Auth stores passwords with a one-way hash. The app never sees or stores a password. | In Supabase Authentication settings: keep email confirmation on and require at least 8 characters. |
| 06 | CORS open to all origins | **Partly** | Browsers must reach the Supabase API, so its CORS is open by design. Access is limited by RLS, and auth redirects are limited to your site. | In Supabase URL settings, set the Site URL to https://mystudenthubapp.com and list only your own redirect URLs. |
| 07 | .env pushed to GitHub | **Done** | No .env file is used. `.gitignore` blocks .env, key and secret files. | Check the repository history for any secret added earlier. |
| 08 | No rate limit | **Done** (database) | Limits are enforced in the database for discovery searches, connection requests, messages, reports and uploads. | In Supabase Authentication, turn on the sign-in and sign-up rate limits. |
| 09 | IDOR (someone reads another user's data by changing an id) | **Done** | Every read is filtered by the signed-in user's id inside RLS. No endpoint returns another student's private data. The tests check this. | Run rls-tests.sql with two accounts after every change. |
| 10 | Outdated packages | **Partly** | The app uses no npm packages. The one library is supabase-js, loaded from a pinned version on jsDelivr. | Check the latest version, update the pin, and add a subresource integrity hash to the script tag. The hash could not be computed here. |
| 11 | No database schema planning | **Done** | `schema.sql` and `migration-v2.sql` define every table, constraint, index and policy in order. | Keep both files in Git. |
| 12 | N+1 queries | **Done** | Each list loads in one query: connections in one call, the chat thread in one query, materials in one query, discovery in one call. | None. |
| 13 | No caching layer | **Partly** | Static files are cached by the host and the service worker caches the app shell. Database traffic is small. | Add a cache only when traffic grows. |
| 14 | Zero error handling | **Done** | Every action catches errors and shows a clear message. Unexpected errors are logged to the console and shown as a notice. | None. |
| 15 | No logs or monitoring | **Partly** | Supabase keeps API and auth logs. Errors reach the browser console. | Check the Supabase logs and the reports list each week. Client errors are not sent anywhere, so no personal data leaves the device. |
| 16 | No backups or rollback | **Not done** | Nothing in the app can back up or roll back the database. The free Supabase plan has no daily backups. | Upgrade to Supabase Pro for daily backups, or run `pg_dump` regularly and store the file safely. |
| 17 | No tests | **Partly** | `supabase/rls-tests.sql` checks data isolation, role limits, chat rules and course-material rules. | Add browser tests for the screens before a major release. |
| 18 | Copy-paste, no structure | **Partly** | The app is split into `index.html`, `app.js` and `head.js`. | Split `app.js` into smaller modules as it grows. |
| 19 | A fix creates new bugs | **Partly** | Tests and a checklist before each release. | Run both tests and try each changed screen before you publish. |
| 20 | Cannot debug own code | **Partly** | Errors reach the console and the test output names the failing check. | Learn to read the console and the test output. The screenshot's advice to learn system design first is worth following. |

## Data visibility rules (no one sees what is not theirs)
- Profile: only you, plus other students only if you switch on "Show my profile".
- Classes, exams, expenses, notes, tasks and GPA: only you.
- Messages: only the two students in the conversation, and only after both accept the connection.
- Connection requests: only the two students involved.
- Course materials: any signed-in student can read them, by design. Only approved lecturers can add them.
- Reports: only admins can read them.
- Lecturer approval and admin rights: set only by you, in the SQL Editor.
