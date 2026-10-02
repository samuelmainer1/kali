# BigDrop Kenya — Multi-Vendor Ecommerce

Modern rebuild of [bigdrop.co.ke](https://www.bigdrop.co.ke) — Kenya’s multi-vendor marketplace powered by **Globeflight Kenya**.

Vendors list products (admin-approved). Customers shop freely. Globeflight picks, packs, stores and delivers.

## Features

- **Marketplace storefront** — Jumia/Amazon-style shopping experience
- **7 categories** with 10+ products each: Fashion, Electronics, Health & Beauty, Baby Products, Home Products, Office Products, Supermarket
- **Customer accounts** — instant signup, no approval needed
- **Vendor applications** — admin must approve before selling
- **Product moderation** — every listing approved by admin before going live
- **Admin dashboard** — approve vendors & products, manage orders, view messages
- **Vendor dashboard** — products, stock, order fulfillment status
- **Wishlist, cart, checkout** (M-Pesa / card / COD — simulated)
- **Shipment tracking** (Globeflight `GF…` numbers)
- **About, Blog, FAQ, Contact, Privacy, Fulfillment** pages
- Real BigDrop / Globeflight copy, testimonials, and contact details

## Quick start

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run seed --prefix server
npm run dev
```

- Storefront: http://localhost:5173  
- API: http://localhost:5001/api/health  

## Demo accounts

Password for all: **`password123`**

| Role | Email | Notes |
|------|-------|-------|
| Admin | `info@bigdrop.co.ke` | Approve vendors & products |
| Customer | `customer@bigdrop.co.ke` | Shop immediately |
| Vendor (approved) | `beauty@bigdrop.co.ke` | Can list products |
| Vendor (approved) | `gadgets@` / `fashion@` / `home@bigdrop.co.ke` | |
| Vendor (pending) | `pending@bigdrop.co.ke` | Awaiting admin approval |

## Stack

- **Client:** React 18, Vite, Tailwind CSS, Framer Motion, React Router  
- **API:** Express, JWT, JSON file database locally; MySQL (`bigdrop_store`) on Oracom when `MYSQL_*` is set

## Security hardening (recent changes)

- **Payments are verified server-side.** `POST /api/orders` now requires a `paymentReference`
  the server itself confirmed (M-Pesa STK result / Paystack verify) and rejects orders where the
  paid amount is less than the order total. Each payment reference is single-use — it cannot fund
  two orders. COD is unaffected.
- **Payment state survives restarts.** Every payment attempt is mirrored into `db.payments`, so a
  live M-Pesa callback or order confirmation still matches up after a redeploy.
- **Oversell protection.** Stock is re-validated inside the atomic DB update at order time; a
  conflict aborts the whole write (and releases the reserved payment) instead of silently
  decrementing twice.
- **Atomic DB saves.** `db.json` is written to a temp file and renamed over the live file, with the
  previous generation kept as `db.json.bak`. A crash mid-save can no longer corrupt the store.
- **Brute-force lockout.** 5 failed logins on one account lock it for 10 minutes.
- **Hardened HTTP surface.** Body limits cut from 32MB → 8MB (JSON) / 1MB (form), rate-limiter map
  is periodically evicted, and baseline security headers (nosniff, frame-options, referrer-policy,
  HSTS in production) are set.
- **SSRF guard.** Remote product-image imports (Woo import, product URLs) now refuse localhost,
  private ranges, and internal hostnames — redirects are re-checked hop by hop.
- **Production secrets enforced.** The server refuses to boot in production without a unique
  `JWT_SECRET` of 32+ characters, and warns loudly if the admin account still uses `password123`.
- **Honest marketing.** The fake "Amina in Nairobi bought this 12 min ago" notifications were
  removed (fabricated social proof is a consumer-protection risk).
- **M-Pesa callbacks must be reachable.** Safaricom POSTs every STK result to `MPESA_CALLBACK_URL`
  (falling back to `PUBLIC_API_URL` + `/api/payments/mpesa/callback`, then to the port the API
  actually serves on). An unreachable value still returns a successful STK push, so the customer
  is charged and the order is never created — silently. So when the M-Pesa keys are set, the server
  now **refuses to boot** unless that URL is a public `https://` address: loopback, private-range,
  link-local and plain-`http` hosts are all rejected. Set both variables on deploy day.

## Hosting on a staging subdomain before go-live

Set `PHASE_NOINDEX=true` while the shop is reachable on a throwaway host (e.g. `shop.bigdrop.co.ke`).
It adds an `X-Robots-Tag: noindex, nofollow` header and rewrites every injected `robots` meta tag to
`noindex, nofollow` (`server/src/index.js`, `server/src/seo.js`), so Google only ever learns the final
domain. Gate the deploy with it instead:

```bash
SEO_EXPECT_NOINDEX=true node tools/verify-seo.mjs   # asserts noindex rather than indexable
```

Unset it on go-live day.

## Images are served from this app (no third-party CDN)

Every catalogue picture — product galleries, category tiles, hero banners, blog covers, review
avatars, cart lines, order items and invoice/receipt thumbnails — lives in
`server/uploads/products/` and is referenced as `/uploads/products/<name>.<ext>`. The storefront no
longer hot-links `images.unsplash.com`, which means no visitor IPs leak to a third party and the shop
cannot be broken by someone else deleting a photo.

- **How it was done.** `localize-images.mjs` walks `server/data/db.json` and `server/data/seed.json`,
  downloads every externally-hosted image it finds, and rewrites the reference. It is idempotent
  (already-downloaded pictures are reused), takes a `.pre-localize-<timestamp>` backup, and saves
  atomically like the API does. `scan-external.mjs` lists any remaining external URLs by JSON path.
- **Dead links become the local placeholder.** A URL that answers HTTP 404 (a deleted Unsplash photo)
  is replaced with `/placeholder-product.svg` instead of being left as a guaranteed broken tile.
  Non-4xx failures stay remote and are listed in `localize-report.json` for a retry.
- **No product is left on the placeholder.** `fix-missing-product-images.mjs` gives every product that
  was showing the grey placeholder a real photo already on this server, chosen from the same category
  and preferring the least-used image so grids stay varied. It defaults to a **dry run** (`--apply` to
  save), reports what it changed to `image-fix-report.json`, and backs up before writing.
- **Every product photo is capped at 150KB.** The browser centre-crops to 800×800 JPEG ≤150KB
  (`client/src/lib/imageUpload.js`), the API refuses anything larger and re-encodes each downloaded
  photo to WebP at ≤150KB (`server/src/uploads.js`). `server/scripts/optimize-product-images.mjs` is
  the pass that brought the older catalogue inside that cap — **494 photos, 271 MB of originals, now
  34.8 MB of WebP**. It defaults to a **dry run** (`--write` to apply), keeps the originals beside the
  new files, backs both JSON files up as `.pre-image-150kb-<timestamp>`, and is idempotent.
  `tools/verify-catalogue.mjs` fails if a gallery photo creeps back over 150KB.
- **Current state.** The live store (`server/data/db.json`) holds **2010 products**; the 2861 upload
  paths it references, plus the 3 photos only the demo catalogue uses, are all local — 3360 files,
  ≈397 MB in `server/uploads/products` (494 of them the new WebP derivatives, 34.8 MB).
  `node tools/scan-images.mjs` reports 0 products without an image, 0 local files missing on disk and
  0 external URLs left to probe. Don't mix these with the 226-product demo catalogue in
  `server/data/seed.json` — that is a different, much smaller set.
- **Deploy note.** `server/uploads/**` is git-ignored, so copy the `uploads/products` folder (3360
  files, ≈397 MB — ≈126 MB once `node tools/sweep-orphans.mjs --delete` removes the 499 files nothing
  references any more, the pre-WebP originals included) with the app — or set `UPLOADS_DIR` to a
  persistent folder that already holds them, so a redeploy or the Woo import does not wipe them.
- **Do not re-seed live data.** `npm run seed` rebuilds `server/data/*.json` from the code-level demo
  catalogue, which still points at Unsplash URLs. Re-run `localize-images.mjs` afterwards if you must.

## Catalogue data quality

`server/data/db.json` (~2,000 products) has been corrected in place several times, so
`server/scripts/` holds the audited maintenance passes used on it. Each takes a timestamped backup
first, supports `--dry-run`, and asserts its own result before writing:

```bash
node server/scripts/applyCategoryAndSpecFixes.js --dry-run   # re-file categories + back-fill specs
node server/scripts/repairMojibake.js --dry-run              # report encoding damage only
node server/scripts/repairMojibake.js                        # backup, repair, write
node server/scripts/normalizeSpecs.js --dry-run              # normalise keys, drop redundant rows
node server/scripts/normalizeSpecs.js                        # backup, normalise, write
node server/scripts/productCleanup.js --dry-run              # Celine de-dup + tissue vendor move
node server/scripts/fixBrands.js --dry-run                   # report brand placeholder repairs only
node server/scripts/fixBrands.js --apply                     # backup, repair, write
node server/scripts/fixBrands.js --apply --clear-unresolved  # also blank the no-evidence remainder
node server/scripts/fixWatchAndDrinkMisfiling.js --dry-run   # watch brands + non-alcoholic drinks
node server/scripts/fixWatchAndDrinkMisfiling.js             # backup, repair, write
node server/scripts/auditDuplicateNames.js                   # READ-ONLY duplicate report
```

| Script | What it fixes |
|--------|---------------|
| `applyCategoryAndSpecFixes.js` | Re-files 96 mis-categorised products (camping gear out of Garden & DIY, water into Supermarket) and back-fills Brand/Capacity/Size/Colour specs for products that had none |
| `repairMojibake.js` | Repairs text stored as UTF-8 but read back as Windows-1252 — `NestlÃƒÂ©` → `Nestlé`, `Ã¢â‚¬â€` → `—` — in every collection: products, categories, brands, reviews, FAQs, testimonials, orders, notifications, blog, audit log |
| `normalizeSpecs.js` | Normalises spec keys (`Color` → `Colour`, `Sizes` → `Size`, `OS` → `Operating System`), collapses duplicate rows, drops rows that only restate `product.sku`, `categoryId` or an always-`New` condition, keeps differing marketplace SKUs as `Supplier SKU`, and re-back-fills any product left empty |
| `applyBrandUpdates.js` | Manufacturer brand assignments on products. ⚠️ Its watch rule (`cat_jewelry` + "watch" in the name) also catches watch *accessories* — `Watch Box Organizer` is labelled Casio — so re-running it will re-introduce that error |
| `productCleanup.js` | Collapses the five redundant Celine toilet-tissue rows to one per pack size (explicit id + name allow-list, re-verified at run time; refuses to delete anything referenced by an order, cart, wishlist, Q&A or return), and moves every `Tissue` product onto Chandaria Supermarket. Idempotent: a re-run reports `already removed` / `moved: 0` |
| `fixBrands.js` | Replaces the `brand: "BigDrop"` placeholder — the storefront, not a manufacturer — with the real brand where the catalogue provides evidence: T1 an explicit leading-brand prefix rule, T2 the product's own spec sheet, T3 a single catalogue brand used as the leading word of the title. 345 of 1083 corrected. The remaining 738 are unbranded goods or ingredient-line names ("Manuka Honey", "Aloe Vera") — with `--clear-unresolved` their `brand` is blanked (the UI guards with `product.brand && …`, so the line hides) and the spec row is *relabelled* "Unbranded" rather than deleted, because for 301 of them that row was the only one they had. Also trims `BigDrop` from every category's curated brand list. Re-run until `resolved: 0` — each pass widens the brand vocabulary |
| `fixWatchAndDrinkMisfiling.js` | Two correctness fixes. (1) Restores the watch brands `applyBrandUpdates.js` clobbered — its Casio rule matches any `cat_jewelry` name containing "watch", so it branded all four; the Citizen/Fossil values come from `seed.json`, and `Watch Box Organizer` (not a watch) is cleared rather than given a maker that doesn't exist. (2) Moves the 14 non-alcoholic drinks — Jaguar Energy Drink (4) and Glinter juice (10) — off the Wine & Spirits shelf onto Food & Drinks. Alcohol is left alone: the Bila Shaka craft beers, Robertson sparkling wine and "Fruity Fly-Mango" (a mango-pulp beer) are correctly filed. The Wine & Spirits brand list is rebuilt from what is actually left, so the facet can no longer offer a brand with zero products |
| `auditDuplicateNames.js` | **Read-only — it never deletes.** Classifies the 61 exact-name duplicate groups as SAME-SKU (the same product twice; only the extra copy may ever be removed) or DIFF-SKU (a real product line the import flattened onto one name, where the fault is the *name*, not the count). Verdict on the current data: **0 groups are safe to delete** — all 61 hold different SKUs and 41 have different prices, e.g. 15 rows called "Velvex Aluminium Foil" span 620 to 6340 KES |

After any pass, confirm the result:

```bash
node tools/verify-catalogue.mjs
```

This re-checks encoding, specifications, category integrity, unique ids/slugs, and that all 28
homepage shelves can fill 10 unique tiles (mirroring `Home.jsx`'s id-and-name de-duplication).
It exits non-zero on failure, so it can gate CI.

- **Why the encoding repair is safe.** Only contiguous damaged runs that *begin* at a cp1252 lead
  character (`Â`/`Ã`/`â`) are converted, one UTF-8 sequence at a time, so genuine text — real
  en/em dashes and accented words that survived import — is never rewritten, and anything that is
  not valid UTF-8 is restored byte for byte. It refuses to write unless every repair keeps the
  string's ASCII characters in the same order and is idempotent. One pass cleared all 449 damaged
  strings; re-running it reports `already clean`.
- **Restart the API after editing `db.json`.** The server reads the file into memory once, so a
  script run or hand edit is not served until the process restarts. `node --watch` reloads on
  *source* changes only, not data changes — touch `server/src/index.js` to force a clean reload.
- **`brand` is not a specification.** `ProductDetail.jsx` renders `product.brand` above the spec
  table, so Brand is deliberately kept out of `specifications` rather than duplicated there. Note
  the field mixes manufacturers (`Hisense`) with store vendors (`BigDrop`) — treat it as a label,
  not a manufacturer of record.

## Company

**BigDrop Kenya** · NextGen Mall, Mombasa Road, 3rd Floor Suite 39/40  
Phone: +254 722 359 298 · info@bigdrop.co.ke · orders@bigdrop.co.ke · 24 Hours  
A product of [Globeflight Kenya](https://globeflight.co.ke)
