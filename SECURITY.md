# StockPro v2 — Security Architecture
## Hotel Arbellas · Plantation, FL

---

## 🔐 Overview

StockPro uses **Firebase as the security boundary**. The frontend code
(HTML/JS) is public and safe to commit to GitHub. All data protection
is enforced server-side by Firestore Security Rules.

```
┌─────────────────────────────────────────────────────────────┐
│  PUBLIC (GitHub)           │  PRIVATE (Firebase)            │
│  ─────────────────         │  ──────────────────────────    │
│  index.html                │  Firestore Database            │
│  firebase-config.js        │  Authentication                │
│  firestore.rules           │  User data                     │
│  (Web API key — safe)      │  Inventory records             │
│                            │  Movements / Deliveries        │
│                            │  Audit logs                    │
│                            │  Backups                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 Role-Based Access Control (RBAC)

| Action                   | Administrator | Warehouse Mgr | Supervisor | Housekeeping |
|--------------------------|:---:|:---:|:---:|:---:|
| Read inventory           | ✅  | ✅  | ✅  | ✅  |
| Create/edit products     | ✅  | ✅  | ❌  | ❌  |
| Delete products          | ✅  | ❌  | ❌  | ❌  |
| Register movements       | ✅  | ✅  | ✅  | ❌  |
| Register deliveries      | ✅  | ✅  | ✅  | ❌  |
| Create users             | ✅  | ❌  | ❌  | ❌  |
| Read audit logs          | ✅  | ❌  | ❌  | ❌  |
| Create backups           | ✅  | ✅  | ❌  | ❌  |

Roles are stored in Firestore (`stockpro_usuarios/{uid}.role`) and
validated server-side on every write. Clients **cannot** self-assign roles.

---

## 🛡️ Firestore Security Rules (firestore.rules)

### Key protections:

1. **Anonymous = zero access**
   ```
   match /{document=**} { allow read, write: if false; }
   ```

2. **Role fetched from Firestore, not client**
   ```javascript
   function userRole() {
     return get(/databases/$(database)/documents/stockpro_usuarios/$(request.auth.uid)).data.role;
   }
   ```

3. **Server timestamps enforced** — clients cannot fake timestamps:
   ```javascript
   function hasServerTimestamp(field) {
     return request.resource.data[field] == request.time;
   }
   ```

4. **Movements are append-only** — once written, cannot be modified or deleted:
   ```javascript
   allow update: if false;
   allow delete: if false;
   ```

5. **Audit logs are write-once** — immutable audit trail.

6. **Soft-delete** — items are marked `_deleted: true` instead of hard-deleted,
   preserving history.

---

## ✅ Input Validation (client-side, defense-in-depth)

The `SEC` module in `index.html` provides:

- `SEC.sanitize(str)` — strips HTML tags, dangerous chars, max 500 chars
- `SEC.safeNum(val, min, max)` — validates and clamps numbers
- `SEC.validEmail(email)` — regex validation
- `SEC.validBarcode(code)` — alphanumeric only
- `SEC.can(action)` — checks user role permissions
- `SEC.enforce(action)` — blocks action + logs attempt if unauthorized
- `SEC.rateLimit(key, max, window)` — prevents spam/flood attacks

---

## 📋 Audit Trail

Every significant action is logged to:
1. **Firestore** `stockpro_audit` collection (admin-read-only)
2. **localStorage** `sp_audit_local` (last 100 entries, for offline)

Actions logged: `LOGIN`, `LOGOUT`, `ITEM_CREATED`, `ITEM_UPDATED`,
`ITEM_DELETED`, `MOVEMENT_REGISTERED`, `BACKUP_CREATED`,
`PERMISSION_DENIED`, `ITEM_SAVE_ERROR`, `MOVEMENT_ERROR`

Each entry includes: `action`, `uid`, `userName`, `role`,
`timestamp` (server), `userAgent`, `data`.

---

## 💾 Backup Strategy

**Automatic daily backup** — runs 5 seconds after first login of the day:
- Saves to Firestore `stockpro_backups` collection
- Only admin/manager can trigger or read
- Immutable (no update/delete allowed)
- Includes full inventory snapshot + item count + total value

**Manual backup** — available in Export → Security panel (admin only).

---

## 🔑 Why the Firebase API Key is Safe in GitHub

Firebase Web API keys are **public identifiers**, not secrets.
They identify which Firebase project to connect to.
Security is enforced entirely by **Firestore Security Rules**,
not by the API key.

Reference: https://firebase.google.com/docs/projects/api-keys

**What you should NEVER commit:**
- Firebase Admin SDK service account JSON (`serviceAccountKey.json`)
- Private encryption keys
- Server-side secrets

---

## 🚀 Deployment Checklist

- [ ] Deploy `firestore.rules` via Firebase Console or CLI
- [ ] Run `admin-setup.js` in browser console to create first admin profile
- [ ] Verify rules are active: Firebase Console → Firestore → Rules
- [ ] Add team members' UIDs with correct roles in `stockpro_usuarios`
- [ ] Enable Authentication: Email/Password + Google
- [ ] Add `arbellasusa.github.io` to authorized domains
- [ ] Test with a read-only role to verify restrictions work
- [ ] Verify audit logs appear in `stockpro_audit` after actions

---

## 📁 File Structure

```
stockpro/
├── index.html          ← App (CSS + JS inline, safe to be public)
├── firebase-config.js  ← Firebase credentials (safe to commit)
├── firestore.rules     ← Security rules (deploy to Firebase)
├── admin-setup.js      ← Run once to create user profiles
├── SECURITY.md         ← This file
└── manifest.json       ← PWA manifest
```

---

*StockPro v2 · Hotel Arbellas · Plantation, FL · © 2026*
