# Assistant XIE

An offline IT-support assistant and friendly work companion, built with **Next.js 14 (App Router) + Tailwind CSS** as an installable **PWA**.

- Works **without internet and without any API key**. No server, no database, no accounts.
- Every user's tickets, fixes, chat and settings stay **on their own device**, so any number of people can use the same deployment at the same time.
- 202 built-in IT guides, a category-aware self-learning matcher, 7 fully built-in languages plus 25 more through on-device translation, voice in and out, colour-coded PDF reports, safe updates with automatic backup.

> User guide for end users: [`USER-MANUAL.md`](USER-MANUAL.md) (also served in the app at `/manual.html`).

## Features

| Area | What it does |
|---|---|
| **Help chat** | Type or speak a problem. Returns likely issue, cause, needs, numbered steps, escalation advice. Understands typos and Spanish / French / German / Portuguese / Filipino / Chinese words offline |
| **Category chips** | Tap a category (for example Printer) to see its guides and pick your exact problem, or describe it in your own words: matching then stays inside that category. If you clearly describe something else, XIE says so and switches |
| **Simple vs Technician** | Simple hides commands and jargon (max 5 steps); Technician shows everything |
| **Self-learning** | Closed tickets, saved fixes and 👍/👎 re-rank guides; similar solved tickets are shown under answers |
| **Companion** | Mood-aware, cheerful replies, daily check-in, breathing break, jokes, pep talks, celebrates closed tickets. Honest that it is an AI. Hard-moment messages point to emergency services and the user's own trusted contact |
| **Tickets** | Open / **In progress** (delay reason + scheduled fix date) / Done, search, filters, overdue banner |
| **Reports** | Daily / weekly / monthly. Colour-coded KPIs, a **Ticket Status** bar chart (Opened, Still open, In progress, Resolved) that shows one bar group per **day, Monday to Sunday**, in the weekly report and one per **week** in the monthly report, tickets by category, tables. **Still open** counts a ticket only after it stayed open 30 minutes. **Save as PDF** keeps all colours |
| **Knowledge** | Add fixes in a table form, share/import fixes, backup/restore, **Load sample tickets** dialog (choose a category and a 7 or 30 day spread; all 202 guides can be loaded) |
| **Languages** | Complete dictionaries: English, Spanish, Filipino, French, German, Portuguese, Chinese. 25 more via on-device Translator, with optional free online fallback. Text, speech output and microphone follow the chosen language. RTL supported |
| **Security** | Activation code (show/hide eye, auto-lock, lockout), email + auto-created recovery key, encrypted emergency backup |
| **Updates** | New version waits for the user; popup saves a backup (download + email/share) before updating; data survives every update |
| **Responsive** | Phone, tablet, laptop, desktop (side menu on large screens) |

## Quick start (VS Code)

Requires Node.js 18.18 or newer (`.nvmrc` says 20).

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # all automated checks
```

### Test on phones, tablets and other computers (tunnel)

```bash
npm run tunnel        # dev server + public HTTPS address + QR code
npm run tunnel:prod   # production build + tunnel (tests install, offline mode, update popup)
```

The script prints a public `https://…loca.lt` address and a **QR code**. Open it on any device (also on mobile data). The first visit shows a localtunnel reminder page: enter the password the script prints. HTTPS is needed for the activation code (Web Crypto), the microphone and installing the app, which is why the tunnel is better than a plain Wi-Fi address (`npm run dev:lan`, printed as "same Wi-Fi only").

VS Code alternative: run `npm run dev`, open the **PORTS** tab, **Forward a Port** `3000`, right-click it and set **Port Visibility: Public** (needs a GitHub sign-in). Tasks for all of this are in `.vscode/tasks.json` (Terminal → Run Task).

Preview the update popup without deploying: open the app with `?fakeupdate` at the end of the address.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `dev:lan` | Development server (local / reachable on your Wi-Fi) |
| `npm run tunnel` / `tunnel:prod` | Public HTTPS tunnel + QR code for testing on other devices |
| `npm run build` | Static export to `out/` (runs `prebuild` first: new build id for the service worker + manual page) |
| `npm start` | Serve `out/` on http://localhost:4173 (offline / PWA test) |
| `npm test` | Engine, languages, companion, lock, backup, update, production checks |
| `npm run manual` | Rebuild `public/manual.html` from `USER-MANUAL.md` |

## Publish: GitHub → Vercel

```bash
git init
git add .
git commit -m "Assistant XIE 1.0.0"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then on [vercel.com](https://vercel.com): **Add New → Project → import the repository → Deploy**. No settings or environment variables are needed (framework: Next.js). The GitHub Action in `.github/workflows/ci.yml` runs the tests and a production build on every push.

Run `npm install` once before committing so `package-lock.json` is created, and commit it.

Optional: copy `.env.example` to `.env.local` (and add it in Vercel → Settings → Environment Variables) to require a company activation code on first open.

### Why it scales to many users

The deployment is a **static site served by Vercel's CDN**. There is no application server and no shared database to overload, so each additional user costs nothing and cannot slow anyone else. Per-user data lives in that user's browser (`localStorage`, about 5 MB, enough for many thousands of tickets; Settings shows usage and warns when nearly full). Because users never share data, there is nothing to sync or lock.

If you later need team-wide shared tickets, add a backend (for example Vercel Postgres) behind an API route. That is intentionally out of scope for this offline-first version.

## How updates keep user data safe

- All user data is stored under one stable key (`xie.next.v1`). Updates never touch it. **Never rename that key.**
- `SCHEMA` in `components/XieApp.jsx` marks the data format. If you raise it, the app first copies the old data to `xie.snapshot.v<old>` and then converts it.
- Each build gets a new id (`scripts/stamp.mjs` → `public/sw.js`, `public/version.json`). The new service worker waits; the user sees **Update available**. **Update now** saves a backup (file download, then phone share sheet or an email draft to the user's own address), then switches versions. A web app cannot send email silently, so the user presses Send.

## Project structure

```
app/                 Next.js app router (layout, page, error boundary, global CSS incl. print rules)
components/          XieApp (main UI), Lock (activation code, recovery), FormDialog, UpdateDialog, Breathe, Reg (service worker)
lib/engine.js        Matching, typo tolerance, learning, Simple/Technician answers
lib/kb.js, kb2.js    202 IT guides + glossary (edit these to add guides)
lib/companion.js     Mood-aware companion replies
lib/i18n*.js         Dictionaries (7 complete languages) and language list (32)
lib/translate.js     Translation tiers: cache → on-device Translator → optional free online → English
lib/backup.js        Plain/encrypted backups, email/share delivery
lib/visual.js        Avatar and colour-coded SVG charts
public/              manifest, icons, sw.js and version.json (generated), manual.html (generated)
scripts/             stamp (build id), manual, tunnel
tests/               Automated checks
```

## Adding or changing content

- **Guides:** add a row to `lib/kb2.js`: `['category','keywords','Title','Cause','Things needed','Step 1|Step 2|Step 3','Escalate if']`, then `npm test`.
- **A language with full built-in text:** add its words in `lib/i18n-full.js` and the language in `LANGS` (`lib/i18n.js`). The tests check placeholders and unknown keys.
- **Guide text in other languages** is translated on demand (on-device or online) and cached; built-in dictionaries cover the app interface.

## Translation and privacy

Order used for text that is not in a built-in dictionary: saved cache → on-device translator (Chrome/Edge, works offline after a one-time pack download) → optional free online service (MyMemory) → English.

- Only fixed app texts (menus, guides, companion templates) may go online, and never the user's name.
- What the user types or says is sent online **only if** they switch on *Also translate what I type or say*. Off by default.
- Free-tier online translation has daily limits; results are cached on the device, so repeated text works offline afterwards.

## Security notes

- The activation code is stored as a salted PBKDF2 hash. It blocks others from opening the app but does **not** encrypt browser storage. Users should keep the device screen lock on.
- Emergency backups made by "Forgot code" are AES-GCM encrypted with a recovery key created automatically when a code and an email exist.
- `vercel.json` sets security headers; the service worker is never cached.
- Companion hard-moment messages are static, translated, and never create tickets.

## Browser support and limits

- Best in current Chrome / Edge. Safari and Firefox work for everything except on-device translation (built-in languages and optional online translation still work) and, on Firefox, voice input.
- Offline voice input needs an offline speech pack on the device; typing always works.
- The companion and answer engine are rule-based, not a large language model, so unusual conversations get simpler replies.
- Email cannot be sent silently by a web app; XIE opens the share sheet or an email draft.

## Offline mode (how it works and how to verify it)

- When the service worker installs, it saves a **complete copy of the app** on the device: the page, every script and style file, icons and the manual. `scripts/precache.mjs` (npm `postbuild`) writes the list of all exported files into `out/sw.js` on every build. The Vercel build log shows `precache: N files (X KB) will be saved on each device`.
- The app is then always served from that saved copy, so it opens instantly with no signal or a weak signal ("connected, no internet"), and a new deploy can never leave a phone with old pages and missing new files. Each version has its own copy; the old copy is deleted only after the user updates.
- **Settings → Install** shows **✅ Offline mode is ready on this device** once the copy is complete. Tell users to open the app once while online, wait for that tick, then they can switch off Wi-Fi and mobile data.
- Data lives in the browser's storage (`localStorage`), so it works offline too. Optional online features (web search, Wikipedia hints, free translation) have a 4.5 second limit and are skipped for 2 minutes after a failure, so a dead connection never freezes the screen.
- Test it: DevTools → **Application → Cache Storage** (a cache named `xie-<build id>` with all files), then **Network → Offline** and reload; or use `npm run tunnel:prod` on a phone and switch on airplane mode.
- If a phone still has an older build that was not complete offline, opening the app online shows **Update available**; **Update now** (backup first) installs the complete copy.

## Troubleshooting

- Page shows but buttons do nothing offline: the offline copy was incomplete (older builds). Open the app online, accept **Update available** (or Settings → Check for updates), wait for **✅ Offline mode is ready**, then try again. As a last resort download a backup, clear the site's data in the browser, reopen online, and restore the backup.
- Old version showing: DevTools → Application → Storage → **Clear site data**.
- Ports 3000 (dev) and 4173 (production test) differ so the offline cache never affects development.
- Tunnel will not start: use the VS Code **PORTS** tab (see above).

## Matching accuracy

The matcher ranks guides by weighted words (rare words count more), forgives typos and swapped letters, understands common words in 7 languages, adds a bonus when your words appear in a guide's title, and uses **category cue words** (printer, Outlook, VPN, backup, Zoom...) so a device name outranks a symptom word. For example "printer no internet" stays with printer guides, and "the printer is not working" no longer drifts to an MFA guide.

Measured on the bundled 202 guides (see `tests/accuracy.test.mjs`): typing a guide title finds it 195 of 202 times (the 7 misses are near-duplicate titles in the knowledge base); typing a guide's three most distinctive keywords finds its category 200 of 202 times; 60 of 60 everyday phrases land in the right category; with a category chip selected, 100% of answers stay inside that category. These tests run on every build.

## PDF reports

Each report prints with its colours (status bars, legend swatches, coloured section lines, status pills). Printing rules live at the end of `app/globals.css`. Do not add `height`, `width` or `overflow` rules for `*` or SVG shapes in that block: they make chart bars and legend swatches disappear in PDFs. `tests/report.test.mjs` guards this.

### How report numbers are counted

- **Opened**: tickets created in the period. **Resolved**: tickets finished in the period.
- **Still open**: tickets opened in the period that are still open after **30 minutes** (a new ticket is not counted until then). **In progress**: tickets opened in the period that are marked In progress.
- The weekly chart splits the week into 7 days (Monday to Sunday); the monthly chart splits the month into weeks that start on Monday (the first and last may be shorter). Every ticket falls in exactly one group, and the bars add up to the report totals. Logic: `lib/report.js` (tested in `tests/report.test.mjs`, including leap years and months that start mid-week).
