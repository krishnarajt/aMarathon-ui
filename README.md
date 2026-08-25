# Amarathon — UI

The front end for [Amarathon](https://git.krishnarajthadesar.in/krishnaraj/amarathon): a step and
distance challenge you play against your friends. The app picks a target every day, everyone chases
it, and one of you wins the day.

Built with React 18, Vite, Tailwind v4, Framer Motion and Recharts. Deploys to Vercel.

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

`npm run dev` proxies `/api` to `http://localhost:8010`, so point it at a local backend:

```bash
# in the amarathon backend repo
export DATABASE_URL="sqlite:///$(pwd)/amarathon_dev.db"
export SECRET_KEY="$(openssl rand -hex 32)"
export PORT=8010
python main.py

# then seed it with demo accounts, challenges and a couple of months of history
python scripts/dev_seed.py --base-url http://localhost:8010
```

That leaves four accounts — `saket`, `nadia`, `rhys`, `mira`, password `amarathon` — with live
challenges, a pending invitation and a pending friend request, which is enough to see every screen
with real data in it.

Set `VITE_DEV_API` to proxy somewhere other than port 8010.

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with the `/api` proxy |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output |
| `npm run lint` | ESLint, warnings included (`--max-warnings 0`) |

## Deploying

`.github/workflows/deploy.yml` deploys with the Vercel CLI — a preview deployment for every pull
request and production on a push to `main`. `.gitea/workflows/deploy.yml` is the same pipeline for
the Gitea mirror. Vercel installs and builds the app during deployment.

Repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Production requests go directly to the Amarathon backend at
`https://amarathon.krishnarajthadesar.in` by default.

## Authentik through API Get Away

Password sign-in remains available. Existing players should sign in normally
and use **Profile → Sign-in methods** to link Authentik. An unlinked Authentik
identity cannot create or replace a player automatically.

`VITE_API_BASE_URL` can override that service base and belongs in the **Vercel project's**
environment variables, not in the workflow: Vite inlines it at build time and Vercel is what runs
the build. Leave it unset locally and the dev proxy handles it.

`vercel.json` rewrites every path to `index.html`, which is what lets the app use real URLs
(`/challenges/<uuid>`) instead of hash routes.

## How it is put together

```
src/
├── api/client.js        every backend call, token refresh, error shape
├── context/             auth, theme, toasts
├── hooks/               useQuery, media queries, count-up
├── lib/                 formatting, enum copy, chart palette, activity padding
├── components/
│   ├── layout/          the shell: rail on desktop, tab bar on mobile
│   ├── ui/              buttons, cards, tabs, sheets, rings, motion vocabulary
│   ├── charts/          Recharts wrappers + the hand-rolled heatmap and sparkline
│   └── challenge/       cards, leaderboard, entry list, the log sheet
└── pages/               one file per route
```

A few decisions worth knowing before changing things:

**One request per screen.** The home screen reads `GET /api/stats/dashboard`, which returns every
active challenge with its current target, my number against it, my streak and the current standings.
The alternative was three requests per challenge on the screen people open most.

**Timestamps are UTC, always.** Postgres returns an offset and SQLite does not, and `new Date()`
reads the offsetless form as *local* time — which silently shifts every chart by the viewer's UTC
offset. Everything from the API goes through `parseUTC` in `lib/format.js`.

**Chart colours are validated, not chosen.** `lib/palette.js` holds six categorical slots per
theme, checked for OKLCH lightness band, chroma floor and adjacent-pair separation under simulated
protanopia and deuteranopia. They are plain hex because Recharts writes `fill`/`stroke` as SVG
presentation attributes, where `var()` does not resolve. Colour follows the *person*, not their
rank, so the standings changing never repaints anybody. Past six people a chart folds the tail away
rather than inventing a seventh hue.

**Two acid tokens.** `--accent` is the bright lime fill that always carries dark ink on top of it;
`--accent-mark` is the version used for progress fills, chart rules and heatmap outlines, because a
mark has to clear 3:1 against its own surface and the bright fill manages 1.3:1 on paper.

**Motion lives in one place.** `components/ui/Motion.jsx` holds the page and list variants so
screens don't each invent their own timing, and everything collapses under
`prefers-reduced-motion`.

## Screens

| Route | What's on it |
|---|---|
| `/login` | Sign in / sign up, same form |
| `/` | Today's target for the challenge most in need of a number, all-time tiles, every live challenge, activity heatmap |
| `/challenges` | Live / Invites / Past |
| `/challenges/new` | Three-step wizard: basics, numbers, crew |
| `/challenges/:uuid` | Today · Board · Trends · History · Crew · Settings |
| `/stats` | Consistency heatmap, per-metric volume, lifetime totals |
| `/friends` | Friends, requests both ways, search |
| `/profile` | Avatar, display name, timezone, units, theme, password |
