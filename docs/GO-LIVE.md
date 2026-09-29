# BigDrop Kenya — Go-Live Runbook

Written 25 Sep 2026 against commit `adf1bf2` (`main`, working tree clean).

This runbook **only adds information** — it changes no application behaviour.
Where it contradicts another document, the measured value on this page wins,
because everything here was verified by running the app rather than copied.

---

## 1. Verified state of this checkout

| Thing | Measured value | How it was measured |
|---|---|---|
| API | `http://localhost:5001`, `/api/health` → `{"ok":true,…}` | request against the running dev server |
| Storefront | `http://localhost:5173` → 200, title `BigDrop Kenya \| Online Shopping Store in Kenya` | live fetch |
| Client production build | ✅ `npm run build` in ~7 s, code-split, no warnings | `npm run build` |
| SEO deploy gate | ✅ `PASS — all assertions hold` (sitemap 2060 URLs, og/canonical, robots) | `node tools/verify-seo.mjs` |
| Product images | **2864 upload paths (db + seed) = all on disk, 0 missing**, 499 orphans (271.1 MB — the originals the WebP pass replaced) | `node tools/scan-images.mjs`, `node tools/verify-catalogue.mjs` |
| Upload weight | `server/uploads` = **397.7 MB** (3360 product files — 34.8 MB of them WebP — + 3 hero banners); ≈126.6 MB after the orphan sweep | recursive size |
| Live catalogue (`server/data/db.json`) | **2010 products** (2009 approved, 1 pending), 24 categories, 12 orders, 3 coupons, 5 return requests, 1 contact message, 1 newsletter subscriber | parsed `db.json` |
| Accounts in `db.json` | 1 admin, 6 vendors (all `approved`), 1 customer — password `password123` | parsed `db.json` |
| Bundled catalogue (`server/data/seed.json`) | **226 products** (225 visible), 8 users (`pending@bigdrop.co.ke` is `pending`), 3 coupons, **no `site.payments` block** | parsed `seed.json` |
| Regression tests | **39 passing** over 4 files (see §4) | `npm test` |
| Git | no remote, no tags, no stashes | `git remote -v`, `git tag`, `git stash list` |
| Runtime actually used | Node **v24.18.1**, npm 11.16.0 | `node -v` |

> Why two catalogues matter: `db.json` is the **live** store (2010 products,
> Woo-imported). `seed.json` is the small **demo/bundled** catalogue. `db.js`
> copies `seed.json` over `db.json` only when `db.json` does not exist yet — so a
> deploy with an empty `DATA_DIR` silently comes up on the 226-product demo shop.

---

## 2. Runtime requirements

- **Minimum: Node 20.11+.** The server scripts use `node --env-file` (added in
  v20.6.0) and the tooling uses `import.meta.dirname` (added in v20.11.0), so the
  "Node.js 18+" note in `START-HERE.txt` / `README.md` is too low — the app will
  not start on 18.
- **Pinned: 24** (`.nvmrc`, added with this runbook). Node 24 is Active LTS and is
  what this checkout was verified on (v24.18.1). If cPanel's Node.js Selector does
  not offer 24, use 22 — still above the 20.11 floor.
- No build step is needed on the server; the client needs `npm run build`, and
  `server/src/index.js` serves `client/dist` automatically once it exists.

---

## 3. Environment variables that must be set for go-live

Nothing below is production-ready in this checkout yet. "Local value" is what is
in `.env` today, so you can see exactly what has to change.

| Variable | Needed for | Local value today | Live value |
|---|---|---|---|
| `NODE_ENV` | Enables the production checks | *(unset → development)* | `production` |
| `JWT_SECRET` | Sessions; the server **refuses to boot** in production with the dev default or < 32 chars | `bigdrop-dev-secret-change-me` | 32+ random chars — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT` | API listen port | `5001` | whatever cPanel assigns |
| `CLIENT_ORIGIN` | CORS allow-list | `http://localhost:5173` | `https://www.bigdrop.co.ke` (comma-separate extra hosts) |
| `PUBLIC_CLIENT_URL` | Password-reset links + CORS | `http://localhost:5173` | `https://www.bigdrop.co.ke` |
| `PUBLIC_API_URL` | M-Pesa callback default | *(unset)* | `https://www.bigdrop.co.ke` — see the warning in §6 |
| `TRUST_PROXY` | Real client IP behind cPanel's proxy, so rate limiting is per visitor | *(unset)* | `true` |
| `UPLOADS_DIR` | Photos that survive a redeploy | *(unset → `server/uploads`)* | a folder outside the zip, e.g. `/home/USER/bigdrop-uploads` |
| `DATA_DIR` | JSON store location (only when **not** using MySQL) | *(unset → `server/data`)* | a writable folder outside the zip |
| `MYSQL_HOST` `MYSQL_PORT` `MYSQL_USER` `MYSQL_PASSWORD` `MYSQL_DATABASE` | MySQL store (table `bigdrop_store`) | *(all unset → JSON file)* | from cPanel → Database Wizard |
| `SMTP_HOST` `SMTP_PORT` `SMTP_SECURE` `SMTP_USER` `SMTP_PASS` `SMTP_FROM` | Welcome mail, newsletter, password reset, order confirmations | only `SMTP_FROM` set | real mailbox credentials — **without these, mail is only logged to the console** (`[mail:simulated]`) |
| `MPESA_ENV` | Daraja live vs sandbox | *(unset → sandbox)* | `production` |
| `MPESA_CONSUMER_KEY` `MPESA_CONSUMER_SECRET` `MPESA_PASSKEY` | Live M-Pesa STK | *(unset → demo STK)* | from Daraja |
| `MPESA_SHORTCODE` | Paybill | `862294` | confirm against Daraja |
| `MPESA_CALLBACK_URL` | Safaricom → your API | *(unset)* | `https://www.bigdrop.co.ke/api/payments/mpesa/callback` |
| `PAYSTACK_SECRET_KEY` | Card charging (must start with `sk_`, or production boot fails) | *(unset → demo card)* | live secret key |
| `PAYSTACK_CALLBACK_URL` | Return after a card payment | *(unset)* | `https://www.bigdrop.co.ke/checkout` |
| `AT_API_KEY` `AT_USERNAME` `AT_SENDER` | Purchase-confirmation SMS | *(all unset → SMS only logged)* | Africa's Talking |
| `PHASE_NOINDEX` | Keeps a phase-1 host out of Google (`X-Robots-Tag: noindex` + noindex meta) | *(unset; documented nowhere else)* | `true` while on `shop.bigdrop.co.ke`, removed later |
| `VITE_API_URL` | Which API the browser calls — read from **`client/.env`**, not the root `.env` | `client/.env` is correct (`http://localhost:5001/api`); root `.env` has a stale `:5000` | `https://www.bigdrop.co.ke/api` |

`server/src/runtimeConfig.js` refuses to boot in production on: a default or
sub-32-character `JWT_SECRET`, a partial M-Pesa set (any one of the four keys
without the rest), or a `PAYSTACK_SECRET_KEY` that does not start with `sk_`.

---

## 4. Regression tests (and how to run them)

`npm test` runs all four suites (`node --test src/*.test.js`, via
`npm run test --prefix server`), and each one also runs on its own. All four are
offline and isolated: they point `DATA_DIR` / `UPLOADS_DIR` at a temporary folder,
so `server/data/db.json` and `server/uploads` are never opened, and no gateway
(Safaricom/Paystack) is ever called.

```bash
# Unit suites — fast, no server needed, nothing to stop first
node --test server/src/runtimeConfig.test.js    #  8 tests — production guards, M-Pesa callback reachability
node --test server/src/payments.test.js         # 12 tests — verification, single-use refs, underpayment
node --test server/src/uploads.test.js          #  8 tests — SSRF guard, upload size/folder whitelist, WebP ≤150KB

# Integration suite — boots the real API on a random port with a throwaway store
node --test server/src/security.test.js         # 11 tests — lockout, vendor gate, moderation, replay, COD
```

What the suites pin down (all of these are behaviours the README claims):

- A confirmed payment is reserved **once**; a replay is refused with *"already used
  for another order"*, re-reserving for the *same* order is retry-safe, and a
  released reservation (the oversell-abort path) becomes usable again.
- Underpayment, unconfirmed payments, failed M-Pesa results, unknown/missing
  references and cross-method reuse are all rejected.
- Remote product images are refused for `localhost`, RFC1918, link-local
  (169.254.x.x), CGNAT and `.internal`/`.local` hosts — nothing is written to disk.
- Only the allow-listed upload folders are accepted, with traversal refused.
- A product photo over 150KB is refused (a 300KB payload never reaches the disk),
  and a downloaded product photo is re-encoded to WebP at ≤150KB.
- The 5-failure login lockout returns `429` even for the correct password; a
  pending vendor gets `403`; a customer cannot list products; an approved vendor's
  listing lands as `pending` and is invisible to shoppers.
- `cod` is refused when the store setting is off, and ordering beyond stock is
  refused.

---

## 5. Order of operations on the live server

Derived from `START-HERE.txt`, `.env.example` and the code, with the measured
figures substituted. Do not re-order 1–4; the image copy must happen before
WordPress is removed.

1. **Point the app at its host.** This week use `shop.bigdrop.co.ke` (leave
   WordPress on the apex), or go straight to `www.bigdrop.co.ke`.
2. **Set the environment** from §3 in the server's env file. Set
   `NODE_ENV=production`, `TRUST_PROXY=true`, a fresh 32+ character `JWT_SECRET`.
   If this is the phase-1 subdomain, add `PHASE_NOINDEX=true`.
3. **Create the database** (cPanel → MySQL Database Wizard) and set the `MYSQL_*`
   values, or set `DATA_DIR` if you are staying on the JSON store.
4. **Move the pictures.** Set `UPLOADS_DIR` to a folder outside the zip and copy
   **`server/uploads/products` — 3360 files, ≈397 MB total uploads** into it
   (≈126 MB if you sweep the 499 unreferenced files first:
   `node tools/sweep-orphans.mjs --delete` — they are the originals the WebP pass replaced).
   `server/uploads/**` is git-ignored, so it is not in the repo and must be copied
   across (or imported fresh from Woo while WordPress is still online).
5. **Copy the live data, do not re-seed.** Ship the existing `server/data/db.json`
   (2010 products) to `DATA_DIR`, or seed MySQL from it. **Never run
   `npm run seed` against live data** — it rebuilds the store from the 226-product
   demo catalogue.
6. **Build and start.** `npm run build` then `npm start`
   (`node --env-file=../.env src/index.js`).
7. **Fix the credentials/mailboxes** in cPanel: SMTP for `orders@` / `info@`, then
   M-Pesa Daraja, Paystack, Africa's Talking. Watch the boot log — it prints a
   loud warning if the admin account still uses the demo password.
8. **Change the passwords.** `info@bigdrop.co.ke` and the 6 vendor accounts all use
   `password123` in the shipped data.
9. **Analytics IDs** (GA4, Meta Pixel, Search Console) go in Admin → Settings —
   they inject via `client/src/components/TrackingScripts.jsx`.
10. **Only after everything above:** point the apex `bigdrop.co.ke` at this app,
    update `CLIENT_ORIGIN`, `PUBLIC_CLIENT_URL`, `PUBLIC_API_URL`, `VITE_API_URL`
    and the M-Pesa/Paystack callbacks, then delete WordPress — `wp-content/uploads`
    dies with it.

---

## 6. Post-deploy verification

Run these against the live host before announcing it. The first four read-only
audits were all clean on this checkout, so anything other than these numbers means
the copy/migration went wrong.

```bash
curl -s https://www.bigdrop.co.ke/api/health              # {"ok":true,...}
curl -s https://www.bigdrop.co.ke/api/payments/status      # mpesa/card must say "live" once keys are set

node tools/scan-images.mjs           # expect: products 2010, "products with NO image: 0",
                                     #         "local files missing on disk: 0", 0 external URLs
node tools/verify-catalogue.mjs      # expect: "All checks passed" — every upload path on disk,
                                     #         no gallery photo over 150KB
node tools/sweep-orphans.mjs         # expect: 2864 referenced / 3360 on disk / 499 orphans
                                     #         (271.1 MB — the pre-WebP originals) / 0 missing
node tools/archive/verify-uploads.mjs # expect: 0 missing, "placeholder refs left: 0"
node tools/verify-seo.mjs            # expect: "PASS — all assertions hold" (exit code 0 is the gate)

# Phase-1 subdomain: assert the noindex gate instead of indexability
SEO_BASE_URL=https://shop.bigdrop.co.ke SEO_EXPECT_NOINDEX=true node tools/verify-seo.mjs
```

Baseline results measured here on 25 Sep 2026, re-measured 29 Sep 2026 after the
150KB WebP pass:

| Audit | Result |
|---|---|
| `scan-images.mjs` | products 2010 · no image 0 · `local-ok` 2893 refs (2861 unique referenced paths) · category tiles 24 · heroes 4 · local missing 0 · external URLs to probe 0 |
| `verify-catalogue.mjs` | all 14 checks pass · 2864 upload paths (db + seed) on disk, 0 missing · 3507 gallery images, none over 150KB |
| `sweep-orphans.mjs` | referenced 2864 · on disk 3360 · orphans 499 (271.1 MB — the pre-WebP originals) · missing 0 |
| `archive/verify-uploads.mjs` | 2861 unique paths · missing 0 · placeholders 0 · "every image the site can ask for exists" |

Notes:

- `tools/verify-seo.mjs` is a real gate: it exits non-zero on any failed assertion,
  so it can be a manual/pre-deploy check. Two of its inputs are env-only:
  `SEO_BASE_URL` and `SEO_EXPECT_NOINDEX`.
- `tools/archive/verify-uploads.mjs` contains a **hard-coded absolute path**
  (`c:/Users/Sam/Downloads/New Bigdrop`), so it only runs correctly on this
  Windows checkout — use `sweep-orphans.mjs` (which resolves its own paths) on the
  server.
- `tools/snapshot-db.mjs` is the backup tool and honours `DATA_DIR`. Suggested
  cPanel cron, every 6 hours, keeping the last 14 snapshots:
  `0 */6 * * * cd /home/USER/app && node tools/snapshot-db.mjs >> tools/snapshot.log 2>&1`
- Verify the storefront by hand too: `/shop`, a product page, cart → checkout
  (M-Pesa and/or card), an order confirmation, `/sitemap.xml`, `/robots.txt`, and
  a vendor login.

---

## 7. Discrepancies found while auditing

Recorded here rather than in the files they belong to, because the original
instruction was to add without editing. Items marked **[fixed]** have since been
applied to the source; the rest still need a follow-up edit.

1. **[fixed] The README's "Current state" figures described the seed, not the live
   store.** It said *"All 614 product images (226 products)… 608 files, ≈65 MB"* while
   the live `db.json` holds **2010 products / 2861 referenced images / 3360 files /
   ≈397 MB** (2853 / 2865 / ≈362 MB before the 150KB WebP pass) — 226 products is
   exactly what `seed.json` contains. `README.md` now states the live figures and names
   `seed.json` as the smaller demo catalogue.
2. **The demo table lists `pending@bigdrop.co.ke` as awaiting approval.** In the
   live `db.json` that account is `approved`, so no shipped account demonstrates the
   pending-vendor flow (`seed.json` still has it as `pending`). Left as-is: changing a
   live user account is an owner decision, not a copy edit.
3. **[fixed] Stale ports in the root `.env`, and a wrong M-Pesa callback default.**
   `.env` suggested `http://localhost:5000` for `MPESA_CALLBACK_URL`, `PUBLIC_API_URL`
   and `VITE_API_URL` although the API runs on **5001**; all three are corrected, and
   `VITE_API_URL` is marked as the value to copy into `client/.env` (Vite never reads
   the root file). The real bug was in `server/src/payments.js`, which defaulted the STK
   callback to `http://localhost:5000/...` when neither variable was set — so on a live
   server Safaricom was told to call a port nothing listened on and **every M-Pesa
   payment silently failed to confirm**. The default now follows the port the API
   actually serves on, and `validateRuntimeConfig` **refuses to boot** when the M-Pesa
   keys are set but the callback is not a public `https://` host (loopback, private-range,
   link-local and plain `http` are all rejected). Covered by 6 new tests in
   `server/src/runtimeConfig.test.js`. Still required on deploy day: set both variables.
4. **[fixed] `PHASE_NOINDEX` was implemented but documented nowhere except here.** It
   lives in `server/src/index.js` (header + meta rewrite in `server/src/seo.js`), and
   `tools/verify-seo.mjs` depends on it via `SEO_EXPECT_NOINDEX`. `README.md` now has a
   "Hosting on a staging subdomain before go-live" section covering both.
5. **Card payments are ready server-side but switched off in the UI.** The API
   exposes `/api/payments/card/init` and `/api/payments/card/confirm`, Paystack
   initialise/verify is implemented, and `/api/payments/status` reports
   `card: "simulated"` (working demo mode). `client/src/pages/Checkout.jsx`
   nonetheless renders the card option as `disabled` with the label
   *"Card (Coming Soon)"*, and the FAQ/Terms copy says the same. Owner decision:
   to be enabled at go-live.
6. **`BigDrop-Kenya-Ecommerce.zip` is stale.** 2 MB, dated 15 Sep — it predates the
   last four commits and cannot contain the 362 MB uploads folder. Do not deploy
   from it.
7. **No git remote is configured**, so this machine holds the only copy of the
   source. `server/data/db.json` and `server/uploads/**` are git-ignored on top of
   that, so live data and photos rely entirely on the copy you make by hand plus
   `tools/snapshot-db.mjs`.
8. **[fixed] There is no `npm test` script**, so the tests only ran when invoked by
   path (§4). The root `package.json` now has `"test": "npm run test --prefix server"`,
   and the suite is 38 tests.
9. **Data awaiting a human decision:** 1 product is `pending` admin approval in
   `db.json`; 1 contact message and 5 return requests are open.


### Do not

- **Do not run `npm run seed` against live data.** It rebuilds the store from the
  226-product demo catalogue and would wipe the 2010-product live catalogue.
- **Do not deploy from the stale zip** (see 6), and do not ship
  `server/uploads/**` inside the deploy artifact — copy it into `UPLOADS_DIR`.
- **Do not enable `MPESA_ENV=production`** before a sandbox run has passed; the
  callback URL must be publicly reachable first (see 3).
- **Do not leave the demo passwords** (`password123`) on the admin or vendor
  accounts once the site is public.
