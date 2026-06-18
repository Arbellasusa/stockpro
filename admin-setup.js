/**
 * STOCKPRO v2 — ADMIN SETUP SCRIPT
 * ─────────────────────────────────────────────────────────────
 * Run this ONCE in your browser console after logging in as admin
 * to create user profiles with correct roles in Firestore.
 *
 * HOW TO RUN:
 * 1. Open https://arbellasusa.github.io/stockpro in Chrome
 * 2. Log in with your admin account
 * 3. Open DevTools → Console
 * 4. Paste and run this script
 */

// ── Define your team members here ──────────────────────────────────────────
const TEAM_MEMBERS = [
  {
    email: 'roldanarbella97@gmail.com',
    name:  'Arbella Roldan',
    role:  'administrator',    // Full access
  },
  // Add more team members:
  // { email: 'manager@hotelarbellas.com',  name: 'Warehouse Manager', role: 'warehouse_manager' },
  // { email: 'super@hotelarbellas.com',    name: 'Supervisor Name',   role: 'supervisor' },
  // { email: 'hk1@hotelarbellas.com',      name: 'Housekeeping 1',    role: 'housekeeping' },
];

// ── Roles reference ─────────────────────────────────────────────────────────
// administrator     → Full access: read/write inventory, movements, users, audit
// warehouse_manager → Read/write inventory & movements, no user management
// supervisor        → Read inventory, register movements & deliveries
// housekeeping      → Read-only inventory

// ── Run setup ──────────────────────────────────────────────────────────────
async function setupUserProfiles() {
  if (!window.firebase || !firebase.firestore) {
    console.error('❌ Firebase not loaded. Make sure you are logged in.');
    return;
  }

  const db = firebase.firestore();
  const auth = firebase.auth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error('❌ Not logged in. Log in first.');
    return;
  }

  console.log('🔧 Setting up user profiles...');

  // Find current user in team list and set their profile
  for (const member of TEAM_MEMBERS) {
    if (member.email.toLowerCase() === currentUser.email.toLowerCase()) {
      // Create/update profile for current user (we have their UID)
      await db.collection('stockpro_usuarios').doc(currentUser.uid).set({
        uid:       currentUser.uid,
        email:     member.email,
        name:      member.name,
        role:      member.role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        setupBy:   'admin_setup_script',
      }, { merge: true });
      console.log(`✅ Profile created for ${member.email} → role: ${member.role}`);
    }
  }

  // For other team members, you need their UIDs
  // They must log in first, then you can run this command:
  // db.collection('stockpro_usuarios').doc('THEIR_UID').set({ role: 'warehouse_manager', ... })

  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Have each team member log in to StockPro');
  console.log('2. Go to Firebase Console → Firestore → stockpro_usuarios');
  console.log('3. Find their document (by email) and set the correct role');
  console.log('   Valid roles: administrator, warehouse_manager, supervisor, housekeeping');
  console.log('');
  console.log('🔐 FIRESTORE RULES are live — anonymous access is blocked.');
  console.log('✅ Setup complete!');
}

setupUserProfiles();
