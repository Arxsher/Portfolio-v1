# arsher.is-a.dev

Zakaria's portfolio: Next.js (App Router) exported as a static site and
served by GitHub Pages. The old site files at the repository root are left
as they are; everything for this version lives in `site/`.

## Run it

```sh
cd site
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build        # static export into site/out
npm run contributions  # refresh data/contributions.json from GitHub
```

Pushing to `main` (anything under `site/`) runs
`.github/workflows/deploy.yml`, which builds the site and publishes
`site/out` to GitHub Pages. It also rebuilds once a day so the
contribution graph stays current.

### Going live (one time)

GitHub Pages currently serves the old site straight from the `main`
branch. To switch to this version:

1. **Settings → Pages → Build and deployment → Source**: choose
   **GitHub Actions**. Keep the custom domain `arsher.is-a.dev`
   (`public/CNAME` ships with every build).
2. Merge this branch into `main`. The deploy workflow runs and publishes
   `site/out`; you can also start it from **Actions → Deploy site → Run
   workflow**.

To roll back, set the Pages source back to **Deploy from a branch**
(`main`, root): the old site files are still there.

## Content

| What | Where |
| --- | --- |
| Name, title, status, intro, socials, writing, lab shots | `content/site.ts` |
| Projects (home list, `/projects`, detail pages) | `content/projects.json` |
| Contribution graph | `data/contributions.json` (`npm run contributions`) |
| Profile photo | `site.avatar` in `content/site.ts`, file in `public/`. Empty shows the mark instead. |
| Social preview image | `public/og.png` (1200 x 630), set as `site.ogImage` |
| Hero pond | `components/home/hero-pond.tsx` (placeholder slot, see the comment at the top) |

## Optional services

All of these are read at build time from `NEXT_PUBLIC_*` variables. For
the deployed site, add them under the repository's **Settings → Secrets
and variables → Actions → Variables** (they are passed to the build in
`deploy.yml`). Locally, put them in `site/.env.local`. Leave any of them
out and that feature falls back gracefully.

| Variable | Used for | Without it |
| --- | --- | --- |
| `NEXT_PUBLIC_WEB3FORMS_KEY` | "Say hi" sends through [Web3Forms](https://web3forms.com) | Send opens the visitor's mail app, pre-filled |
| `NEXT_PUBLIC_CAL_LINK` | "Book a call" shows your cal.com page, e.g. `arsher/30min` | The panel suggests sending a message instead |
| `NEXT_PUBLIC_SUPABASE_URL` | Guestbook and project view counts | Guestbook shows an empty state, no view counter |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same (anon or publishable key) | Same |

### Supabase (guestbook and view counts)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor → New query**, run `supabase/guestbook.sql`, then
   `supabase/views.sql`. Both are safe to run again.
3. From **Project Settings → API**, copy the project URL and the anon (or
   publishable) key into the two variables above, then rebuild.

The public key can only read entries, add new ones and bump a page's view
count. Remove unwanted guestbook entries from the Supabase dashboard
(Table Editor).
