/**
 * STOCKPRO v2 — Firebase Configuration
 * ─────────────────────────────────────────────────────────────
 * ⚠️  THIS FILE IS SAFE TO COMMIT TO GITHUB
 *
 * Firebase Web API keys are NOT secret — they are public
 * identifiers. Security is enforced by Firestore Rules,
 * not by keeping this key private.
 *
 * Reference: https://firebase.google.com/docs/projects/api-keys
 *
 * WHAT IS SECRET (never commit):
 *   - Firebase Admin SDK service account JSON
 *   - Private keys, server secrets
 *   - Database passwords
 *
 * WHAT IS PUBLIC (safe to commit):
 *   - Firebase Web config below (protected by Firestore Rules)
 */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAm-XD0cJJR6JjHwd093ijnoh3qcq4UkDg",
  authDomain:        "hk-pro-housekeeping.firebaseapp.com",
  databaseURL:       "https://hk-pro-housekeeping-default-rtdb.firebaseio.com",
  projectId:         "hk-pro-housekeeping",
  storageBucket:     "hk-pro-housekeeping.firebasestorage.app",
  messagingSenderId: "890258208844",
  appId:             "1:890258208844:web:fa13c82c89062c5054dce9",
  measurementId:     "G-LE47VEBJNY"
};

// Firestore collection names
const COLS = {
  INV:       'stockpro_inventario',
  MOV:       'stockpro_movimientos',
  DEL:       'stockpro_deliveries',
  USR:       'stockpro_usuarios',
  AUDIT:     'stockpro_audit',
  SNAPSHOTS: 'stockpro_snapshots',
  BACKUPS:   'stockpro_backups',
  // DHS Supplier module
  DHS_PROD:  'stockpro_dhs_products',
  DHS_PUR:   'stockpro_dhs_purchases',
};

// Role definitions and permissions matrix
const ROLE_PERMS = {
  administrator:     { read:true,  writeInv:true,  writeMov:true,  writeUsers:true,  readAudit:true  },
  warehouse_manager: { read:true,  writeInv:true,  writeMov:true,  writeUsers:false, readAudit:false },
  supervisor:        { read:true,  writeInv:false, writeMov:true,  writeUsers:false, readAudit:false },
  housekeeping:      { read:true,  writeInv:false, writeMov:false, writeUsers:false, readAudit:false },
};

// Bootstrap admin emails — these are allowed to self-assign administrator role
// on first profile creation AND to self-repair role if incorrectly set to housekeeping.
const BOOTSTRAP_ADMIN_EMAILS_CONFIG = [
  'roldanarbella97@gmail.com',
  'roldanarbella79@myyahoo.com',
];
