/**
 * STOCKPRO v2 — FIRST ADMIN SETUP FIX
 * Run once in DevTools Console after Firebase loads.
 */

const FIRST_ADMIN = {
  email: "roldanarbella97@gmail.com",
  name: "Arbella Roldan",
  role: "administrator"
};

async function setupFirstAdmin() {
  try {
    if (!window.firebase) {
      console.error("❌ Firebase SDK no está cargado.");
      return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    await new Promise(resolve => {
      const unsub = auth.onAuthStateChanged(user => {
        unsub();
        resolve(user);
      });
    });

    const user = auth.currentUser;

    if (!user) {
      console.error("❌ No hay usuario logueado. Primero inicia sesión.");
      return;
    }

    if (user.email.toLowerCase() !== FIRST_ADMIN.email.toLowerCase()) {
      console.error("❌ Este email no está autorizado como primer admin:", user.email);
      return;
    }

    const adminRef = db.collection("stockpro_usuarios").doc(user.uid);

    await adminRef.set({
      uid: user.uid,
      email: user.email,
      name: FIRST_ADMIN.name,
      role: FIRST_ADMIN.role,
      status: "active",
      permissions: {
        inventory: true,
        reports: true,
        users: true,
        audit: true,
        admin: true
      },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      setupBy: "first_admin_setup"
    }, { merge: true });

    console.log("✅ ADMIN CREADO CORRECTAMENTE");
    console.log("Email:", user.email);
    console.log("Role:", FIRST_ADMIN.role);
    console.log("🔄 Recarga la página ahora.");

  } catch (error) {
    console.error("❌ Error creando admin:", error);
  }
}

setupFirstAdmin();
