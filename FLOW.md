# Nuvio — Customer & Admin Flow

> Non-technical documentation of how the whole system works.

---

## 🧩 The Three Parts of Nuvio

Nuvio is made of three separate pieces that work together:

| Part | What it is | Where it lives |
|------|-----------|----------------|
| **1. The Website** | The landing page + signup + dashboard (what customers see) | Cloudflare Pages (`nuviotv.pages.dev`) |
| **2. The Streaming API** | The Stremio addon that serves movies/series/channels | Vercel (`nuviostreamapi.vercel.app`) |
| **3. The Admin Panel** | Where you (the owner) create and manage Nuvio accounts | Vercel (`nuviostreamapi.vercel.app/admin.html`) |
| **Database** | Firestore — stores the customer/account data | Firebase (`multiaddon.firebaseio.com`) |

All three talk to the **same Firestore database**. The website reads from it, the streaming API reads from it, and the admin panel writes to it.

---

## 👤 The Customer's Journey

### Step 1: Discover
```
Customer visits nuviotv.pages.dev
  → Sees the landing page (movies, channels, pricing, FAQ)
  → Clicks "Get 7 Days Free"
```

### Step 2: Sign up
```
Customer enters their email + password on /signup/
  → The website creates their account (Firebase Auth)
  → The website sends a verification email
  → NO Nuvio account is assigned yet (this is important!)
  → Customer sees "Check your inbox" screen
```

### Step 3: Verify email
```
Customer opens their email
  → Clicks the "Verify My Email" button
  → Lands on the /verify page
  → The website confirms the email is real
  → ONLY NOW does the website assign a Nuvio account to them
  → Sets the 7-day countdown
  → Redirects to the dashboard
```

**Why wait until verification to assign the account?**
If we gave out Nuvio accounts at signup, someone could sign up with a fake email and walk away with a real Nuvio.tv account + password. By waiting until they click the email link, we prove they own the email — zero accounts wasted on fake signups.

### Step 4: Use the dashboard
```
Customer lands on /dashboard/
  → Sees their Nuvio account email + password (with copy buttons)
  → Sees a 7-day countdown timer
  → Sees the live TV channels grid
  → Sees renewal options (30/60/90 days)
  → Copies the credentials → goes to nuvio.tv → logs in → watches
```

### Step 5: After 7 days
```
The countdown hits zero
  → Dashboard shows "Reactivate your account"
  → Customer picks a plan (30/60/90 days)
  → Pays via GCash, Maya, or credit card (PayMongo)
  → Account gets extended
  → Customer keeps watching
```

### Edge cases

**What if all accounts are taken when they try to sign up?**
```
Customer clicks verify → no Nuvio accounts available
  → "All accounts are taken, check back soon"
  → Their email is still verified (they can log in later when accounts are available)
```

**What if they sign up but never click the email link?**
```
Customer signs up → email sent → never clicked
  → No Nuvio account was ever assigned (0 wasted)
  → If they try to log in → dashboard shows "Verify your email" with a Resend button
  → They can resend the email and complete verification later
```

**What if they open the email on a different device?**
```
Customer signs up on laptop, opens email on phone
  → Clicks the link on their phone
  → /verify page says "Log in to continue" (they're not logged in on the phone)
  → They log in on the phone → verification completes → dashboard loads
```

---

## 🛠️ The Admin's Journey (You)

### Step 1: Create Nuvio accounts

```
You log into the admin panel at nuviostreamapi.vercel.app/admin.html
  → Enter the admin password
  → Click "Create Token" (or "Bulk Create" for multiple)
  → For each account, enter:
      - Nuvio.tv email (the real account you created on nuvio.tv)
      - Nuvio.tv password
      - (Optional) customer name
      - Number of days (placeholder — gets overwritten to 7 on signup)
  → Click Save
  → The account is added to the pool as "available"
```

### Step 2: Monitor assignments

```
You check the admin panel dashboard
  → See stats: Total / Available / Assigned / Expired
  → See the table of all accounts
  → When a customer signs up + verifies, their account shows as "assigned"
  → The "Assigned To" column shows the customer's email
```

### Step 3: Manage accounts

For each account in the admin panel, you can:
- **Edit** — change the Nuvio email/password
- **Renew** — add/remove days, or quick-set to 7/30/60/90 days
- **Block** — toggle status between "active" and "blocked" (blocked = customer can't stream)
- **Unassign** — remove the customer from the account (makes it available again)
- **Delete** — permanently remove the account
- **Copy credentials** — copy the Nuvio email + password
- **Copy link** — copy the Stremio addon URL for that customer

### Step 4: Handle renewals

When a customer pays for a renewal via PayMongo:
```
PayMongo sends a webhook → /api/paymongo/webhook
  → (Currently just logs the payment)
  → You manually extend the account in the admin panel:
      - Find the customer's account
      - Click "Renew"
      - Add 30/60/90 days
```

> **Note:** The webhook currently just logs payments. Auto-renewal (where the payment automatically extends the account) is a future enhancement — see the Technical doc.

### Step 5: Handle expired accounts

```
A customer's 7-day trial ends → they don't renew
  → Their account shows "expired" in the admin panel
  → The dashboard shows them the "Reactivate" screen
  → If they never renew, you can:
      - Unassign the account (makes it available for a new customer)
      - Or keep it assigned in case they come back
```

---

## 🔄 The Complete Picture

```
┌──────────────────────────────────────────────────────────────┐
│                        YOU (Admin)                            │
│                                                               │
│  1. Create Nuvio.tv accounts (manually on nuvio.tv)          │
│  2. Add them to the admin panel with credentials             │
│  3. Monitor assignments + handle renewals                    │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Firestore Database                         │
│                                                               │
│  customers/{tokenId} = {                                      │
│    nuvioEmail, nuvioPassword,                                 │
│    name (customer email),                                     │
│    status: available/active/expired/blocked,                  │
│    expiresAt, assignedTo                                      │
│  }                                                            │
└──────────────────────────┬───────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  Website    │ │ Streaming   │ │ Admin Panel │
    │  (Cloudflare)│ │ API (Vercel)│ │ (Vercel)    │
    │             │ │             │ │             │
    │ - Landing   │ │ - Stremio   │ │ - Create    │
    │ - Signup    │ │   manifest  │ │   accounts  │
    │ - Verify    │ │ - Catalogs  │ │ - Assign    │
    │ - Dashboard │ │ - Streams   │ │ - Renew     │
    │ - PayMongo  │ │ - Channels  │ │ - Block     │
    └──────┬──────┘ └──────┬──────┘ └─────────────┘
           │               │
           ▼               ▼
    ┌─────────────┐ ┌─────────────┐
    │  Customer   │ │  Customer's │
    │  browser    │ │  Stremio app│
    │             │ │             │
    │ - Signs up  │ │ - Adds the  │
    │ - Sees dash │ │   addon URL │
    │ - Pays      │ │ - Watches   │
    │ - Copies    │ │   movies    │
    │   creds     │ │   + channels│
    └─────────────┘ └─────────────┘
```

---

## 💰 Money Flow

```
Customer signs up → 7 days free (no payment)
  → After 7 days, dashboard shows renewal options:
      - 30 days → ₱49 (₱1.63/day)
      - 60 days → ₱89 (₱1.48/day)
      - 90 days → ₱129 (₱1.43/day) ← BEST VALUE
  → Customer picks a plan
  → Redirected to PayMongo checkout
  → Pays via GCash / Maya / credit card
  → PayMongo redirects back to /dashboard?payment=success
  → PayMongo sends webhook to /api/paymongo/webhook
  → You manually extend the account in the admin panel
```

**PayMongo fees (Philippines):**
- GCash: 1.5% per transaction
- Cards: 3.5% + ₱15 per transaction
- Maya: 1.5% per transaction

---

## 📧 Email Flow

```
Signup → /api/send-verification (Cloudflare Function)
  → Signs a JWT token with HMAC-SHA256
  → Builds a branded HTML email
  → Sends to /api/send-email (Cloudflare Function)
  → send-email uses worker-mailer + Gmail SMTP
  → Email arrives in customer's inbox

Customer clicks link → /verify?token=abc123
  → /api/verify-email verifies the JWT signature (no database)
  → If valid → assigns Nuvio account → redirects to dashboard
  → If invalid/expired → "Verification failed"
```

**Why use a signed JWT instead of storing verification tokens in the database?**
- A verification token is a one-time thing — no need to store it permanently
- The JWT contains the user's email + expiry, signed with a secret
- Verifying it requires zero database reads (just a signature check)
- This keeps Firestore costs minimal

---

## 🔒 Security Notes (for the admin)

1. **Admin password** — stored as a SHA-256 hash in the admin panel code. Change it if compromised.
2. **Nuvio account passwords** — stored in plaintext in Firestore. Anyone with database access can read them.
3. **Firestore rules** — currently set to public (test mode). For production, restrict to authenticated users.
4. **PayMongo keys** — stored as environment variables in Cloudflare, never in the code.
5. **Email verification** — prevents fake signups from wasting Nuvio accounts.
6. **Token IDs** — random 7-character strings (`nuvio_` + 7 chars), not easily guessable.

---

## ❓ Common Questions

**Q: What happens if a customer shares their Nuvio credentials with friends?**
A: The Nuvio.tv account has its own login limits (set by nuvio.tv). Multiple simultaneous logins may get blocked by nuvio.tv itself, not by us.

**Q: Can a customer use the Stremio addon without the website?**
A: Yes — if they have the addon URL (`nuviostreamapi.vercel.app/{tokenId}/manifest.json`), they can add it to Stremio directly. But they need an active token to stream (blocked tokens get empty streams).

**Q: What if the customer's 7-day trial expires but they already added the addon to Stremio?**
A: The streaming API checks `expiresAt` on every stream request. Expired tokens get empty streams — the customer sees "no streams available" in Stremio until they renew.

**Q: Can I move a customer from one Nuvio account to another?**
A: Yes — in the admin panel, "Unassign" the old account (makes it available), then the customer would need to contact you to manually assign them a new one. Or you can edit their current account's credentials.

**Q: What happens if nuvio.tv bans an account?**
A: The customer's streams stop working. You'd need to create a new Nuvio.tv account, update the credentials in the admin panel, and the customer's streams would resume (same token, new credentials).
