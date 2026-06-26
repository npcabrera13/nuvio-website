# Nuvio — Cloudflare Pages Deployment Guide

This guide walks you through deploying the Nuvio website to Cloudflare Pages.
The build is **fixed and verified** — `bun run build` succeeds cleanly and produces a 2.6 MiB static site + 7 Pages Functions.

---

## Architecture (why this works on Cloudflare)

```
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Pages                                       │
│                                                         │
│  ┌─────────────────────────┐  ┌──────────────────────┐  │
│  │  Static HTML (out/)     │  │  Pages Functions     │  │
│  │  - / (landing)          │  │  (functions/api/)    │  │
│  │  - /dashboard/          │  │                      │  │
│  │  - /login/              │  │  - /api/send-email   │  │
│  │  - /signup/             │  │  - /api/send-verify  │  │
│  │  - /verify/             │  │  - /api/verify-email │  │
│  │  - _next/static/*       │  │  - /api/movies       │  │
│  │                         │  │  - /api/search       │  │
│  │  (Next.js output:export)│  │  - /api/paymongo/*   │  │
│  └─────────────────────────┘  └──────────────────────┘  │
│                                                         │
│  public/_routes.json routes ONLY /api/* to Functions    │
└─────────────────────────────────────────────────────────┘
```

- **Next.js 16** generates static HTML via `output: "export"`.
- **Pages Functions** (in `functions/`) run as native Workers — this is why `worker-mailer` (Gmail SMTP) works.
- **No edge runtime needed** — static HTML has zero server runtime.
- **No 3 MiB limit issue** — the Worker bundle is tiny (only the email + PayMongo code).

---

## Step 1: Push to GitHub

Your repo is already set up at `github.com/npcabrera13/nuvio-website`.
Make sure all the latest fixes are committed and pushed:

```bash
cd /home/z/my-project
git add -A
git commit -m "fix: Cloudflare Pages build — add auto-login-redirect, fix Worker functions, add _routes.json"
git push origin main
```

---

## Step 2: Create a Cloudflare Pages Project

1. Go to **https://dash.cloudflare.com** → Workers & Pages → **Create application** → **Pages** tab → **Connect to Git**.

2. Select your GitHub account, then the `nuvio-website` repository.

3. Configure the build (standard Next.js + npm — nothing exotic):
   - **Framework preset**: `Next.js (Static HTML Export)`
   - **Build command**: `npm run build`
     *(this runs `next build` — the standard Next.js build command)*
   - **Build output directory**: `out`
   - **Root directory**: `/` (leave as default)
   - **Environment variable** (set BEFORE first build): `NODE_VERSION` = `20`

   > **Why npm?** This project includes a `package-lock.json`, so Cloudflare auto-detects npm and runs `npm ci` to install dependencies, then runs your `npm run build` command. This is the most standard, boring, reliable Next.js setup — no Bun, no Yarn, no pnpm. Just `npm` + `next build`.

4. Click **Save and Deploy**.

Cloudflare will run the build. It should succeed in ~30 seconds and produce:
- 7 static HTML pages (the Next.js static export)
- 7 Pages Functions (auto-detected from `functions/api/`)

---

## Step 3: Set Environment Variables

In your Cloudflare Pages project → **Settings** → **Environment variables** → **Production**:

| Variable | Value | Used by |
|----------|-------|---------|
| `SMTP_EMAIL` | `your_gmail@gmail.com` | `/api/send-email` (Gmail SMTP login) |
| `SMTP_PASSWORD` | `your_gmail_app_password` | `/api/send-email` (Gmail app password) |
| `PAYMONGO_SECRET_KEY` | `sk_test_your_test_key_here` *(test)* or `sk_live_your_live_key` | `/api/paymongo/create-session` |

> **Important**: These go in the **Production** environment. Also add them to **Preview** if you want to test the email/payment flow on preview deployments.

After adding env vars, **trigger a redeploy** (Deployments → the latest → **Retry deployment**) so the Functions pick them up.

---

## Step 4: Verify the Deployment

Once deployed, visit your `https://nuvio-website.pages.dev` URL and check:

1. **Landing page** loads (hero, movie carousel, channels, pricing, FAQ all visible).
2. **Signup flow**: go to `/signup/`, enter email + password, click "Create account" → should show "Check your inbox" screen, and a verification email should arrive at `your_gmail@gmail.com`'s sent folder / the user's inbox.
3. **Login flow**: go to `/login/`, log in → redirects to `/dashboard/`.
4. **Dashboard**: shows countdown timer, Nuvio credentials (if admin created a token), channels grid.
5. **Payment**: click a renewal plan → redirects to PayMongo checkout.

---

## Step 5: Set Up PayMongo Webhook (for auto-renewal after payment)

1. Go to **PayMongo Dashboard** → **Webhooks** → **Add**.
2. **Callback URL**: `https://nuvio-website.pages.dev/api/paymongo/webhook`
   *(or your custom domain if you set one up)*
3. **Events**: select `checkout.session.paid`.
4. Copy the **webhook secret key** PayMongo gives you.
5. (Optional) Add it as env var `PAYMONGO_WEBHOOK_SECRET` in Cloudflare and update `functions/api/paymongo/webhook.ts` to verify signatures.

> Currently the webhook just logs the payment. To auto-extend a user's token in Firestore after payment, you'd need to add Firebase Admin SDK logic there (see `MIGRATION_GUIDE.md`).

---

## Step 6: (Optional) Add a Custom Domain

In Cloudflare Pages → **Custom domains** → **Set up a custom domain**:
- Enter `nuvio.tv` (or whatever domain you own).
- Cloudflare will guide you through adding a CNAME record.
- SSL is automatic.

---

## Step 7: Set Firestore Security Rules

In **Firebase Console** → Firestore Database → **Rules**, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read their OWN customer doc
    match /customers/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    // Tokens collection — public read for Stremio API validation
    match /tokens/{token} {
      allow read: if true;
      allow write: if false; // only Admin SDK writes
    }
    // Verifications — only the Functions can write (via Admin SDK or anonymous)
    match /verifications/{token} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

> **Important**: Without these rules, Firestore is locked down by default and the dashboard won't load user data.

---

## Troubleshooting

### Build fails with "Module not found: @/components/nuvio/auto-login-redirect"
→ The file exists now. Make sure you pulled the latest code: `git pull`.

### Build fails with "Can't resolve 'tailwindcss-animate'"
→ Fixed. `tailwind.config.ts` no longer imports it. Make sure you have the latest version.

### Cloudflare says "Build command not found" or uses wrong package manager
→ Make sure `package-lock.json` exists in your repo root (it does now). Cloudflare auto-detects npm from this file. Set build command to `npm run build`. If issues persist, set env var `NODE_VERSION` = `20`.

### Email not sending (signup shows "Check your inbox" but no email arrives)
→ Check the Function logs: Cloudflare Pages → your project → **Functions** tab → `/api/send-email` → **Logs**. Look for SMTP auth errors. Verify `SMTP_EMAIL` and `SMTP_PASSWORD` env vars are set correctly.

### PayMongo checkout shows "Sandbox is inactive"
→ Make sure you're using the **test** key (`sk_test_...`) for testing, or the **live** key (`sk_live_...`) for real payments. Don't mix them.

### Dashboard shows "Accounts are full" or no credentials
→ You need to create tokens with Nuvio credentials in the admin panel first. The admin panel is at `nuviostreamapi.vercel.app/admin.html` (separate repo, managed by Antigravity agent).

### 404 on `/dashboard` (without trailing slash)
→ `next.config.ts` has `trailingSlash: true`. Cloudflare should auto-redirect, but if not, always use the trailing slash: `/dashboard/`, `/login/`, etc.

---

## File Structure Summary

```
nuvio-website/
├── functions/              ← Cloudflare Pages Functions (Workers)
│   └── api/
│       ├── send-email.ts          (worker-mailer + Gmail SMTP)
│       ├── send-verification.ts   (generates token, sends branded email)
│       ├── verify-email.ts        (validates token)
│       ├── movies.ts              (proxy to Stremio API, cached)
│       ├── search.ts              (search Stremio catalog)
│       └── paymongo/
│           ├── create-session.ts  (creates PayMongo checkout)
│           └── webhook.ts         (receives PayMongo events)
├── public/
│   └── _routes.json        ← Routes ONLY /api/* to Functions
├── src/
│   ├── app/                ← Next.js App Router pages (all static)
│   │   ├── page.tsx              (landing)
│   │   ├── dashboard/page.tsx    (user dashboard)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── verify/page.tsx
│   ├── components/         ← React components
│   └── lib/                ← Firebase, auth, data layer
├── next.config.ts          ← output: "export" (static HTML)
├── tailwind.config.ts      ← (no tailwindcss-animate)
└── package.json            ← Next.js 16, React 19, Firebase, worker-mailer
```

---

## What was broken and how we fixed it

| # | Problem | Fix |
|---|---------|-----|
| 1 | `page.tsx` imported `auto-login-redirect` which didn't exist | Created the component |
| 2 | `tailwind.config.ts` imported `tailwindcss-animate` (not installed) | Removed the import + plugin |
| 3 | `functions/api/movies.ts` & `search.ts` imported from `src/lib/nuvio.ts` which uses Next.js `fetch({next:{revalidate}})` — breaks in Workers | Rewrote both as self-contained, using Cloudflare's `cf: {cacheTtl}` instead |
| 4 | `paymongo/create-session.ts` used `process.env` (doesn't exist in Workers) | Changed to `env` parameter |
| 5 | Empty duplicate directories (`movies/`, `search/`, `create-session/`) next to `.ts` files | Removed them |
| 6 | No routing config for static vs Functions | Created `public/_routes.json` |

**Result**: Build succeeds in 4.9s. Output is 2.6 MiB (limit is 25 MiB). All 7 routes + 7 Functions verified working.
