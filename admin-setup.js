/**
 * STOCKPRO v2 — ADMIN SETUP SCRIPT
 * ─────────────────────────────────────────────────────────────
 * Run this ONCE in your browser console after logging in as admin
 * to create or repair user profiles with correct roles in Firestore.
 *
 * HOW TO RUN:
 * 1. Open https://arbellasusa.github.io/stockpro in Chrome
 * 2. Log in with your admin account (roldanarbella97@gmail.com)
 * 3. Open DevTools → Console (F12)
 * 4. Paste and run this script
 */

// ── Define your team members here ──────────────────────────────────────────
const TEAM_MEMBERS = [
  {
    email: 'roldanarbella97@gmail.com',
    name:  'Arbella Roldan',
    role:  'administrator',    // Full access
  },
  // ── Add more team members below ─────────────────────────────────────────
  // { email: 'manager@hydehousenhotel.com',  name: 'Warehouse Manager', role: 'warehouse_manager' },
  // { email: 'super@hydehousenhotel.com',    name: 'Supervisor',        role: 'supervisor' },
  // { email: 'hk1@hydehousenhotel.com',      name: 'Housekeeping 1',   role: 'housekeeping' },
];

// ── Roles reference ─────────────────────────────────────────────────────────
// administrator     → Full access: read/write inventory, movements, users, audit
// warehouse_manager → Read/write inventory & movements, no user management
// supervisor        → Read inventory, register movements & deliveries
// housekeeping      → Read-only inventory

// ── Run setup ──────────────────────────────────────────────────────────────
async function setupUserProfiles() {
  console.log('🔧 [SETUP] StockPro Admin Setup Script iniciado...');

  if (!window.firebase || !firebase.firestore) {
    console.error('❌ [SETUP] Firebase no cargado. Verifica que estés en la app de StockPro.');
    return;
  }

  const db = firebase.firestore();
  const auth = firebase.auth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error('❌ [SETUP] No hay sesión activa. Inicia sesión primero.');
    return;
  }

  console.log(`👤 [SETUP] Usuario actual: ${currentUser.email} (uid: ${currentUser.uid})`);

  // ── 1. Repair or create profile for current user ──────────────────────────
  const matchedMember = TEAM_MEMBERS.find(
    m => m.email.toLowerCase() === currentUser.email.toLowerCase()
  );

  if (matchedMember) {
    const ref = db.collection('stockpro_usuarios').doc(currentUser.uid);
    const snap = await ref.get();

    if (snap.exists) {
      const data = snap.data();
      console.log(`📋 [SETUP] Perfil existente → role actual: "${data.role}"`);
      if (data.role !== matchedMember.role) {
        console.log(`🔧 [SETUP] Reparando rol: "${data.role}" → "${matchedMember.role}"`);
        await ref.update({
          role: matchedMember.role,
          _roleRepairedAt: firebase.firestore.FieldValue.serverTimestamp(),
          _roleRepairedBy: 'admin_setup_script',
        });
        console.log(`✅ [SETUP] Rol reparado → ${matchedMember.role}`);
      } else {
        console.log(`✅ [SETUP] Rol ya es correcto → ${data.role}`);
      }
    } else {
      console.log(`🆕 [SETUP] Creando perfil para ${matchedMember.email} → role: ${matchedMember.role}`);
      await ref.set({
        uid:       currentUser.uid,
        email:     matchedMember.email,
        name:      matchedMember.name,
        role:      matchedMember.role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: 'admin_setup_script',
        online:    true,
        lastSeen:  firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ [SETUP] Perfil creado → ${matchedMember.email} | role: ${matchedMember.role}`);
    }
  } else {
    console.warn(`⚠️ [SETUP] Email "${currentUser.email}" no encontrado en TEAM_MEMBERS.`);
    console.warn('   Agrega este email al array TEAM_MEMBERS arriba y vuelve a ejecutar.');
  }

  // ── 2. Instructions for other team members ───────────────────────────────
  console.log('');
  console.log('────────────────────────────────────────────');
  console.log('📋 PRÓXIMOS PASOS PARA OTROS MIEMBROS DEL EQUIPO:');
  console.log('1. Cada miembro debe iniciar sesión en StockPro al menos una vez.');
  console.log('2. Ve a Firebase Console → Firestore → stockpro_usuarios');
  console.log('3. Busca su documento (filtra por email) y asigna el role correcto:');
  console.log('   Roles válidos: administrator, warehouse_manager, supervisor, housekeeping');
  console.log('');
  console.log('💡 O ejecuta este script MIENTRAS ESTÁS logueado como admin');
  console.log('   y agrega sus UIDs manualmente así:');
  console.log('   db.collection("stockpro_usuarios").doc("SU_UID").set({');
  console.log('     uid:"SU_UID", email:"su@email.com", name:"Nombre",');
  console.log('     role:"warehouse_manager",');
  console.log('     createdAt: firebase.firestore.FieldValue.serverTimestamp()');
  console.log('   })');
  console.log('────────────────────────────────────────────');
  console.log('✅ [SETUP] Script completado.');
}

setupUserProfiles();
