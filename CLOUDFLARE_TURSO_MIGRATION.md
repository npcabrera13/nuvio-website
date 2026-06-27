# Nuvio — Cloudflare + Turso Migration Guide

> How to consolidate the entire Nuvio system (website + streaming API + admin panel + database) into **one Cloudflare account**, eliminating the Vercel dependency.

---

## 🎯 Why Migrate?

### Current setup (3 separate services)

| Component | Hosted on | Why |
|-----------|-----------|-----|
| Website (landing + dashboard) | Cloudflare Pages | Free, fast CDN |
| Streaming API (Stremio proxy) | Vercel | Needed Node.js serverless |
| Admin panel | Vercel | Served with the API |
| Database | Firebase Firestore | Free tier, real-time |

### Problems with current setup

1. **Vercel free tier limits** — 100GB bandwidth/month. Streaming API serves lots of JSON → can hit the limit.
2. **Two dashboards to manage** — Cloudflare + Vercel + Firebase Console.
3. **Firebase free tier** — 50K reads/day. The streaming API's 5-min cache helps, but a viral spike could exceed it.
4. **Cold starts** — Vercel serverless functions have cold starts (~1-2s). Cloudflare Workers don't (0ms).
5. **Split-brain debugging** — When something breaks, you check 3 different log dashboards.

### Target setup (1 Cloudflare account, everything unified)

| Component | Hosted on | Why |
|-----------|-----------|-----|
| Website | Cloudflare Pages | (same) |
| Streaming API | **Cloudflare Workers** | 0ms cold starts, generous free tier |
| Admin panel | **Cloudflare Pages** (static) | Served alongside the website |
| Database | **Turso (libSQL/SQLite)** | Edge-replicated SQLite, generous free tier |

**One account, one dashboard, one bill.**

---

## 📊 Cost & Limit Comparison

| Resource | Firebase Free Tier | Turso Free Tier | Cloudflare Workers Free |
|----------|-------------------|-----------------|------------------------|
| Reads | 50K/day | 1 billion/month | 100K requests/day |
| Writes | 20K/day | 25 million/month | 100K requests/day |
| Storage | 1 GB | 9 GB | — |
| Bandwidth | 1 GB/day egress | Unlimited | Unlimited |
| Cold starts | N/A | N/A | **0ms** (Workers) |

**Verdict:** Turso + Cloudflare Workers is dramatically more generous than Firebase + Vercel for this use case.

---

## 🏗️ Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Account                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Cloudflare Pages                                        │   │
│  │  (nuviotv.pages.dev)                                     │   │
│  │                                                          │   │
│  │  - Next.js website (static export)                      │   │
│  │  - Admin panel (static HTML/JS)                         │   │
│  │  - Pages Functions:                                      │   │
│  │    /api/send-email, /api/send-verification,             │   │
│  │    /api/verify-email, /api/paymongo/*                   │   │
│  │    /api/streaming/* (Stremio proxy) ← NEW              │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Turso (libSQL)                                          │   │
│  │  (edge-replicated SQLite)                                │   │
│  │                                                          │   │
│  │  customers table:                                        │   │
│  │    id (text)        ← "nuvio_abc123x"                    │   │
│  │    nuvio_email      ← real Nuvio.tv email                │   │
│  │    nuvio_password   ← real Nuvio.tv password             │   │
│  │    name             ← customer email (NULL = available)  │   │
│  │    status           ← available/active/blocked/expired   │   │
│  │    expires_at       ← timestamp                          │   │
│  │    created_at       ← timestamp                          │   │
│  │    assigned_to      ← Firebase Auth UID (NULL = avail)   │   │
│  │    notes            ← text                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Firebase Auth (still used for auth)                     │   │
│  │  - Email/password + Google sign-in                       │   │
│  │  - displayName stores the Turso token ID                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Firebase Auth stays** — it's free, reliable, and handles email/password + Google sign-in. We only replace Firestore with Turso.

---

## 📋 Migration Steps

### Step 1: Create a Turso Account & Database

1. Go to **https://turso.tech** → Sign up (free, GitHub login)
2. Create a new database: `nuvio`
3. Get your connection string: `libsql://nuvio-<your-handle>.turso.io`
4. Create an auth token: Settings → Tokens → Create
5. Save both — you'll need them for Cloudflare env vars

### Step 2: Create the `customers` Table in Turso

```sql
-- Run this in the Turso SQL editor (or via the CLI)
CREATE TABLE customers (
  id TEXT PRIMARY KEY,                    -- "nuvio_abc123x"
  nuvio_email TEXT NOT NULL,
  nuvio_password TEXT NOT NULL,
  name TEXT DEFAULT '',                   -- customer email (empty = available)
  status TEXT NOT NULL DEFAULT 'available', -- available/active/blocked/expired
  expires_at INTEGER,                     -- Unix timestamp (ms)
  created_at INTEGER NOT NULL,
  assigned_to TEXT,                       -- Firebase Auth UID (NULL = available)
  notes TEXT DEFAULT ''
);

-- Index for fast "find available" queries
CREATE INDEX idx_customers_status_name ON customers(status, name);

-- Index for fast "find by assigned user" queries
CREATE INDEX idx_customers_assigned_to ON customers(assigned_to);
```

### Step 3: Migrate Existing Data from Firestore to Turso

Write a one-time migration script (Node.js, run locally):

```javascript
// migrate-firestore-to-turso.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { createClient } from "@libsql/client";

const firebaseConfig = { /* your config */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const turso = createClient({
  url: "libsql://nuvio-xxx.turso.io",
  authToken: "your-turso-token",
});

async function migrate() {
  const snapshot = await getDocs(collection(db, "customers"));
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    await turso.execute({
      sql: `INSERT INTO customers (id, nuvio_email, nuvio_password, name, status, expires_at, created_at, assigned_to, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        doc.id,
        data.nuvioEmail || "",
        data.nuvioPassword || "",
        data.name || "",
        data.status || "available",
        data.expiresAt?.toMillis() || null,
        data.createdAt?.toMillis() || Date.now(),
        data.assignedTo || null,
        data.notes || "",
      ],
    });
    count++;
    console.log(`Migrated ${count}: ${doc.id}`);
  }

  console.log(`\nDone! Migrated ${count} customers.`);
}

migrate().catch(console.error);
```

Run it:
```bash
node migrate-firestore-to-turso.js
```

### Step 4: Add Turso to the Website

Install the Turso client (works in Cloudflare Workers/Pages Functions):

```bash
npm install @libsql/client
```

Create a database helper:

```typescript
// src/lib/turso.ts
import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

export function getTurso(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return _client;
}

export interface Customer {
  id: string;
  nuvio_email: string;
  nuvio_password: string;
  name: string;
  status: "available" | "active" | "blocked" | "expired";
  expires_at: number | null;
  created_at: number;
  assigned_to: string | null;
  notes: string;
}

// Find an available token (1 read)
export async function findAvailableToken(): Promise<Customer | null> {
  const turso = getTurso();
  const result = await turso.execute({
    sql: `SELECT * FROM customers WHERE status = 'available' AND (name = '' OR name IS NULL) LIMIT 1`,
    args: [],
  });
  return result.rows[0] as Customer | null;
}

// Assign a token to a user (1 write)
export async function assignToken(tokenId: string, userEmail: string): Promise<void> {
  const turso = getTurso();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  await turso.execute({
    sql: `UPDATE customers SET name = ?, status = 'active', expires_at = ? WHERE id = ?`,
    args: [userEmail, expiresAt, tokenId],
  });
}

// Get a customer by token ID (1 read)
export async function getCustomer(tokenId: string): Promise<Customer | null> {
  const turso = getTurso();
  const result = await turso.execute({
    sql: `SELECT * FROM customers WHERE id = ?`,
    args: [tokenId],
  });
  return result.rows[0] as Customer | null;
}

// Update status (1 write)
export async function updateStatus(tokenId: string, status: string): Promise<void> {
  const turso = getTurso();
  await turso.execute({
    sql: `UPDATE customers SET status = ? WHERE id = ?`,
    args: [status, tokenId],
  });
}
```

### Step 5: Update the Auth Context to Use Turso

Replace Firestore calls with Turso calls. The key changes in `auth-context.tsx`:

```typescript
// OLD (Firestore):
import { collection, query, where, limit, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";

// NEW (Turso via API routes — client SDK can't reach Turso directly):
// The auth context calls Cloudflare Functions which use Turso.

// assignTokenToUser now calls an API route:
async function assignTokenToUser(firebaseUser: User, userEmail: string | null) {
  const res = await fetch("/api/assign-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: firebaseUser.uid, email: userEmail }),
  });
  const data = await res.json();
  if (data.error === "ACCOUNTS_FULL") throw new Error(ACCOUNTS_FULL_ERROR);
  if (data.error) throw new Error(data.error);

  // Store tokenId in user.displayName (Firebase Auth, 0 Turso)
  await updateProfile(firebaseUser, { displayName: data.tokenId });
  return data.tokenId;
}

// fetchProfile now calls an API route:
async function fetchProfile(firebaseUser: User) {
  const tokenId = firebaseUser.displayName;
  if (!tokenId) { setProfile(null); return; }

  const res = await fetch(`/api/customer/${tokenId}`);
  if (!res.ok) { setProfile(null); return; }
  const data = await res.json();
  setProfile(data);
}
```

### Step 6: Create New API Routes for Turso

Create these new Pages Functions:

```typescript
// functions/api/assign-token.ts
import { findAvailableToken, assignToken } from "../../src/lib/turso";

export const onRequestPost = async ({ request }: { request: Request }) => {
  const { uid, email } = await request.json();
  if (!uid || !email) {
    return new Response(JSON.stringify({ error: "uid and email required" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const token = await findAvailableToken();
  if (!token) {
    return new Response(JSON.stringify({ error: "ACCOUNTS_FULL" }), {
      status: 503, headers: { "Content-Type": "application/json" }
    });
  }

  await assignToken(token.id, email);
  return new Response(JSON.stringify({ tokenId: token.id }), {
    headers: { "Content-Type": "application/json" }
  });
};
```

```typescript
// functions/api/customer/[tokenId].ts
import { getCustomer } from "../../../src/lib/turso";

export const onRequestGet = async ({ params }: { params: { tokenId: string } }) => {
  const customer = await getCustomer(params.tokenId);
  if (!customer) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify(customer), {
    headers: { "Content-Type": "application/json" }
  });
};
```

### Step 7: Migrate the Streaming API to Cloudflare Workers

This is the biggest change. The current `api/proxy.js` is a Node.js serverless function. You need to convert it to a Cloudflare Worker.

**Create a new Worker:**

```bash
# Install Wrangler CLI
npm install -g wrangler

# Create the worker
wrangler generate nuvio-streaming-api https://github.com/cloudflare/templates/worker
cd nuvio-streaming-api
```

**Convert `api/proxy.js` to Worker format:**

The main changes:
1. Replace `module.exports = handler` with `export default { fetch }`
2. Replace `req.query` with `new URL(request.url).searchParams`
3. Replace Firebase Web SDK with Turso client
4. Replace `fetch()` calls — Workers have native `fetch`
5. Move hardcoded config to `wrangler.toml` env vars

```typescript
// src/worker.ts (the streaming API as a Cloudflare Worker)
import { createClient } from "@libsql/client";

const CUSTOMER_TTL = 5 * 60 * 1000; // 5-min cache
const _customerCache = new Map();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const token = url.searchParams.get("token");
    const prefix = url.searchParams.get("prefix");
    const p = url.searchParams.get("p");

    // ... route dispatch logic (same as proxy.js) ...

    // Token validation using Turso instead of Firestore:
    async function getCustomerData(token: string) {
      const hit = _customerCache.get(token);
      if (hit && Date.now() - hit.time < CUSTOMER_TTL) return hit.data;

      const turso = createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
      });
      const result = await turso.execute({
        sql: `SELECT * FROM customers WHERE id = ?`,
        args: [token],
      });

      const data = result.rows[0] || null;
      _customerCache.set(token, { data, time: Date.now() });
      return data;
    }

    // ... rest of the proxy logic (manifest, catalog, stream, meta, subtitles) ...
  },
};
```

**`wrangler.toml`:**

```toml
name = "nuvio-streaming-api"
main = "src/worker.ts"
compatibility_date = "2024-09-01"
compatibility_flags = ["nodejs_compat"]

[vars]
TURSO_DATABASE_URL = "libsql://nuvio-xxx.turso.io"
# TURSO_AUTH_TOKEN is a secret — set via: wrangler secret put TURSO_AUTH_TOKEN
```

**Deploy:**
```bash
wrangler deploy
# Your streaming API is now at: nuvio-streaming-api.<your-subdomain>.workers.dev
```

### Step 8: Migrate the Admin Panel to Cloudflare Pages

The admin panel is currently `admin.html` + `admin.js` + `style.css`. Move these to the website repo:

```
public/admin/
  ├── index.html    ← (was admin.html)
  ├── admin.js
  └── style.css
```

Update `admin.js` to use Turso via API routes instead of Firebase Web SDK:

```javascript
// OLD (Firebase Web SDK):
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
const db = getFirestore(app);
const snapshot = await getDocs(collection(db, "customers"));

// NEW (Turso via API routes):
const API_BASE = "/api/admin";
const response = await fetch(`${API_BASE}/customers`, {
  headers: { "X-Admin-Key": localStorage.getItem("nuvio_auth") }
});
const customers = await response.json();
```

Create admin API routes:

```typescript
// functions/api/admin/customers.ts — list all
// functions/api/admin/create.ts — create single/bulk
// functions/api/admin/update.ts — edit
// functions/api/admin/delete.ts — delete
// functions/api/admin/renew.ts — add days
// functions/api/admin/toggle.ts — block/unblock
// functions/api/admin/unassign.ts — clear assigned user
```

All protected by the admin key (SHA-256 hash check).

### Step 9: Update Environment Variables

**Remove from Cloudflare Pages:**
- (Nothing — Firebase config was in the code)

**Add to Cloudflare Pages:**
```
TURSO_DATABASE_URL = libsql://nuvio-xxx.turso.io
TURSO_AUTH_TOKEN = eyJ... (your Turso token)
ADMIN_PASSWORD_HASH = 7f5741... (same hash as before)
```

**Add to Cloudflare Worker (streaming API):**
```bash
wrangler secret put TURSO_AUTH_TOKEN
# Paste your Turso token
```

### Step 10: Update DNS / Custom Domain

In Cloudflare:
1. Add a custom domain to your Pages project: `nuvio.tv` → `nuviotv.pages.dev`
2. Add a route to your Worker: `streaming.nuvio.tv/*` → `nuvio-streaming-api.workers.dev`
3. Or use a single domain with path-based routing via Cloudflare Rules:
   - `nuvio.tv/*` → Pages (website + admin)
   - `nuvio.tv/stream/*` → Worker (streaming API)

### Step 11: Test Everything

1. **Website** — signup, verify email, dashboard loads
2. **Streaming API** — add addon to Stremio, streams work
3. **Admin panel** — create tokens, they appear in the pool
4. **Turso** — check the Turso dashboard for query counts

### Step 12: Decommission Vercel & Firebase Firestore

Once everything works:
1. Delete the Vercel project (`nuviostreamapi.vercel.app` goes offline)
2. Update your DNS to point `nuviostreamapi.vercel.app` → your new Cloudflare Worker (or ask customers to update their Stremio addon URL)
3. Export Firestore data as backup (just in case)
4. Disable Firestore (keep Firebase Auth running)

---

## 🔄 Migration Checklist

- [ ] Create Turso account + database
- [ ] Run `CREATE TABLE customers` in Turso
- [ ] Run the Firestore → Turso migration script
- [ ] Verify all data migrated correctly
- [ ] Install `@libsql/client` in the website repo
- [ ] Create `src/lib/turso.ts` helper
- [ ] Create `/api/assign-token`, `/api/customer/[tokenId]` routes
- [ ] Update `auth-context.tsx` to call Turso API routes
- [ ] Convert `api/proxy.js` to a Cloudflare Worker
- [ ] Deploy the Worker
- [ ] Move `admin.html` / `admin.js` to `public/admin/`
- [ ] Create `/api/admin/*` routes (protected by admin key)
- [ ] Update `admin.js` to call Turso API routes
- [ ] Set environment variables in Cloudflare
- [ ] Test: signup → verify → dashboard → stream
- [ ] Test: admin → create token → it appears in pool
- [ ] Set up custom domain routing
- [ ] Decommission Vercel project
- [ ] Backup + disable Firestore

---

## 💡 Benefits After Migration

| Before | After |
|--------|-------|
| 3 dashboards (Cloudflare + Vercel + Firebase) | 1 dashboard (Cloudflare) + 1 (Turso) |
| 50K Firestore reads/day limit | 1 billion Turso reads/month |
| 100GB Vercel bandwidth/month | Unlimited Cloudflare bandwidth |
| 1-2s Vercel cold starts | 0ms Cloudflare Worker cold starts |
| Firebase Web SDK (public key) | Turso (server-side, no public key) |
| 2 Git repos (website + gatekeeper) | 1 Git repo (everything) |

---

## ⚠️ Gotchas & Edge Cases

### 1. Turso doesn't have `serverTimestamp()`
Firestore has `serverTimestamp()` which uses the server's clock. Turso uses Unix timestamps — set them client-side:
```typescript
const now = Date.now(); // client-side timestamp
// Or use SQL: `strftime('%s', 'now') * 1000`
```

### 2. Turso replication lag
Turso replicates to edge locations. Writes are immediately consistent in the primary, but reads from edge replicas may lag by a few seconds. For the admin panel, this is fine. For the streaming API, the 5-min cache hides any lag.

### 3. Firebase Auth stays
We only replace Firestore, not Firebase Auth. Firebase Auth is free (50K MAU) and handles email/password + Google sign-in well. The `displayName` field still stores the token ID.

### 4. Streaming API URL changes
Customers who added the Stremio addon with `nuviostreamapi.vercel.app/{token}/manifest.json` will need to update to the new URL. You can:
- Set up a redirect on Vercel (before deleting it) → new Cloudflare Worker URL
- Or email customers with the new URL

### 5. PayMongo webhook URL
Update the PayMongo webhook URL in the PayMongo dashboard:
- Old: `https://nuviostreamapi.vercel.app/api/paymongo/webhook`
- New: `https://nuviotv.pages.dev/api/paymongo/webhook` (or your custom domain)

### 6. Admin password hash
The SHA-256 hash in `admin.js` is now exposed in client-side code. Consider moving auth to a server-side check (API route that verifies the password against a hashed env var).

---

## 📊 Estimated Migration Time

| Step | Time |
|------|------|
| Turso setup + table creation | 15 min |
| Firestore → Turso migration script | 30 min |
| Website: Turso helper + API routes | 1 hour |
| Website: auth-context update | 30 min |
| Streaming API: Worker conversion | 3-4 hours |
| Admin panel: move + update | 2 hours |
| Testing + debugging | 2 hours |
| DNS + custom domain | 30 min |
| **Total** | **~10-12 hours** |

This can be done over a weekend. The migration is low-risk because you can run both systems in parallel until you're confident, then switch DNS.

---

## 🆘 Rollback Plan

If something breaks after migration:

1. **Website down** → Roll back the Git commit, Cloudflare auto-deploys the previous version
2. **Streaming API down** → Point DNS back to Vercel (keep the Vercel project alive for 1 week as backup)
3. **Turso issues** → Re-enable Firestore reads (keep the Firebase config in the code as a fallback)
4. **Admin panel down** → Use the old Vercel admin URL temporarily

Keep both systems running in parallel for at least 1 week before fully decommissioning Vercel.
