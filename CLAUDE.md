# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev      # next dev --turbopack
npm run build    # next build --turbopack
npm run start    # next start (serve production build)
npm run lint     # next lint
```

There is no test suite and no CI configuration in this repo — don't assume either exists.

## Architecture

This is a Next.js 15 (App Router) site for a Karachi coffee shop, converted from a static HTML/CSS/vanilla-JS site in a single commit (see git history). Because of that history, expect some structure to still look like a ported static site rather than an idiomatic Next.js app:

- Almost every component is `'use client'`, including `app/page.js` itself. There is no meaningful server-rendering split — treat this as a client-rendered SPA hosted inside App Router, not an app that leans on Server Components.
- Global state lives in one React Context: `context/AppContext.js`. It holds the cart, fetched menu items, dynamic badge map, user location, and open/closed state for every modal (cart sidebar, addon modal, checkout modal, success modal) in a single provider wrapping the whole app in `app/layout.js`. When adding UI state that other components need, extend this context rather than introducing a new provider.
- Cart, last-used delivery location, last order, and last customer profile are persisted to `localStorage` (`brewBeansCart`, `brewBeansLocation`, `brewBeansLastOrder`, `brewBeansLastCustomer`) via the `safeReadLocalStorage`/`safeWriteLocalStorage` helpers duplicated in `AppContext.js` and `CheckoutModal.jsx`. Cart items are keyed by a derived `cartKey` (id + addons + special instructions), not by menu item id alone, so two customizations of the same item can coexist in the cart.

### Data layer: direct Supabase reads, Edge Functions for writes

`lib/supabase.js` creates a single client-side Supabase client using a hardcoded publishable (`sb_publishable_...`) anon key — this is intentional and safe to be public, not a leaked secret.

- **Reads** go straight from components to Supabase via `supabase.from(...)` / `supabase.rpc(...)` — e.g. `MenuSection.jsx` loads `menu_items` and calls the `get_menu_badges` RPC directly; `OrderTrackingInner.js` polls the `get_order_status` RPC every 10s while an order is active.
- **Writes/mutations** (placing an order, creating a payment, phone-based customer lookup that touches PII) go through Supabase Edge Functions via `supabase.functions.invoke(...)`: `submit-order`, `create-payment`, `payment-callback`. **These functions are not in this repo** — there is no `supabase/functions` directory. Their behavior (validation, pricing, order numbering) must be inferred from how components call them, or checked in the Supabase project directly.
- Checkout (`components/CheckoutModal.jsx`) supports Cash on Delivery, JazzCash, and EasyPaisa. Non-COD payments get a `create-payment` response with a `gatewayUrl` + hidden form `fields`, then auto-submit a POST form to redirect to the gateway; if the gateway isn't configured (`payData.configured === false`), the order silently falls back to COD.
- `addon-seed.sql` at the repo root is a one-off idempotent SQL script for seeding addon groups/options and linking them to menu items in Supabase — not something the app runs, just documentation/tooling for populating the DB directly in the Supabase SQL editor.
- Addon options shown in `AddonModal.jsx` currently come from a hardcoded `LOCAL_ADDON_CATALOG` keyed by category (hot-coffee vs cold-coffee/frappes/summer-coolers), not from the `menu_item_addon_groups` DB tables that `addon-seed.sql` populates — these two addon systems are not yet wired together.

### Admin/staff surfaces are separate static pages, not part of the Next app

`public/admin.html`, `public/admin-dashboard.html`, and `public/staff.html` are standalone HTML files with their own inline `<script>`/`<style>`, loading the Supabase JS client from a CDN — they are not React routes and don't go through `app/`. They're served as static files by Next.js and are excluded from search indexing via the `headers()` rewrite in `next.config.mjs` (`X-Robots-Tag: noindex, nofollow` for each of the three paths).

- `public/staff.html` references `js/supabase-config.js`, which does not exist anywhere in `public/` — this script tag is currently broken/dead, likely left over from before the Next.js migration.
- `public/_headers` (a Netlify/Cloudflare-Pages-style headers file) is stale: it references a different Supabase project ref than `lib/supabase.js` and `next.config.mjs` use, and its CSP directives no longer match the ones actually served (those now come from `next.config.mjs`'s `headers()` function). Don't treat `_headers` as authoritative for current CSP/security headers.

### Windows-specific workarounds

`next.config.mjs` sets `config.resolve.symlinks = false` in its webpack config, and `patch-readlink.cjs` at the repo root monkey-patches `fs.readlinkSync`/`fs.readlink`/`fs.promises.readlink` to swallow `EISDIR` errors. `patch-readlink.cjs` is not currently required by any npm script — if dev/build breaks on Windows with `EISDIR` errors (a known Next.js/Turbopack + Windows symlink issue), that's the tool to reach for (e.g. `node -r ./patch-readlink.cjs node_modules/.bin/next dev`).

## Path aliases

`@/*` maps to the repo root (`jsconfig.json`), e.g. `@/context/AppContext`, `@/components/MenuSection`, `@/lib/supabase`.
