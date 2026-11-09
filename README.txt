StudentHub: project files

WHAT IS WHERE
  site/              Everything the public website needs. Upload the CONTENTS of this folder to the root of your
                     GitHub repository (or your Netlify / Cloudflare Pages project). Do not upload the folder itself.
  supabase/          Database files. Run them in the Supabase SQL Editor, in this order:
                       1. schema.sql           (tables and basic policies)
                       2. migration-v2.sql     (security, chat, lecturer materials, rate limits)
                       3. rls-tests.sql        (checks that no one can see data that is not theirs)
  tools/seo_check.py Checks the site for SEO problems:  python3 tools/seo_check.py --site-dir site
  SECURITY-CHECKLIST.md  The 20-point security checklist with what is done and what is still yours to do.
  .gitignore         Keeps .env files and keys out of Git. Copy it to the root of your repository.

BEFORE GOING LIVE
  - site/app.js: paste your Supabase URL and anon (public) key into SH_CONFIG.
    Never paste the service_role key anywhere in these files.
  - site/head.js: replace G-XXXXXXXXXX with your Google Analytics ID.
  - In Supabase Authentication settings: email confirmation on, minimum password length 8,
    sign-in rate limits on, Site URL https://mystudenthubapp.com.
  - Lecturers are approved by you in the SQL Editor (see migration-v2.sql, section 5).
