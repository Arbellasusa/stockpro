/* ── StockPro × Firebase hk-pro-housekeeping ─────────────── */

/* IMPORTANTE: Reemplaza estos valores con los de tu Firebase Console
   Firebase Console → Project Settings → Your apps → Web app config     */
const FIREBASE_CONFIG = {
  apiKey:            "REEMPLAZA_CON_TU_API_KEY",
  authDomain:        "hk-pro-housekeeping.firebaseapp.com",
  projectId:         "hk-pro-housekeeping",
  storageBucket:     "hk-pro-housekeeping.appspot.com",
  messagingSenderId: "REEMPLAZA_CON_TU_SENDER_ID",
  appId:             "REEMPLAZA_CON_TU_APP_ID",
};

/* ── Colecciones Firestore ───────────────────────────────── */
const COL_INVENTARIO  = "stockpro_inventario";
const COL_MOVIMIENTOS = "stockpro_movimientos";
const COL_USUARIOS    = "stockpro_usuarios";

/* ── Estado global Firebase ─────────────────────────────── */
window.FB = {
  app:  null,
  auth: null,
  db:   null,
  uid:  null,
  role: null,
  unsubItems: null,
  unsubMovs:  null,
  online: false,
};

/* ── Bootstrap ──────────────────────────────────────────── */
async function initFirebase() {
  try {
    if (!firebase.apps.length) {
      FB.app  = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      FB.app  = firebase.app();
    }
    FB.auth = firebase.auth();
    FB.db   = firebase.firestore();
    FB.db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED });
    await FB.db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
    FB.online = true;
    updateSyncBadge("conectando");
    console.log("✅ Firebase inicializado — proyecto: hk-pro-housekeeping");
    return true;
  } catch (err) {
    console.warn("⚠️ Firebase no disponible:", err.message);
    FB.online = false;
    updateSyncBadge("offline");
    return false;
  }
}

/* ── AUTH ────────────────────────────────────────────────── */
async function fbLogin(email, password) {
  if (!FB.auth) throw new Error("Firebase no inicializado");
  const cred = await FB.auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

async function fbLoginGoogle() {
  if (!FB.auth) throw new Error("Firebase no inicializado");
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ hd: "" });
  const cred = await FB.auth.signInWithPopup(provider);
  return cred.user;
}

async function fbLogout() {
  stopRealtimeListeners();
  if (FB.auth) await FB.auth.signOut();
}

function onAuthStateChange(callback) {
  if (!FB.auth) return;
  FB.auth.onAuthStateChanged(async (user) => {
    if (user) {
      FB.uid = user.uid;
      await loadUserProfile(user);
      callback("loggedIn", user);
    } else {
      FB.uid  = null;
      FB.role = null;
      callback("loggedOut", null);
    }
  });
}

async function loadUserProfile(user) {
  try {
    const doc = await FB.db.collection(COL_USUARIOS).doc(user.uid).get();
    if (doc.exists) {
      FB.role = doc.data().role || "almacenero";
    } else {
      const profile = {
        uid:       user.uid,
        email:     user.email,
        name:      user.displayName || user.email.split("@")[0],
        role:      "almacenero",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        hotel:     "Hyde House Hotel",
      };
      await FB.db.collection(COL_USUARIOS).doc(user.uid).set(profile);
      FB.role = "almacenero";
    }
    updateSyncBadge("online");
  } catch (err) {
    console.warn("No se pudo cargar perfil:", err.message);
    FB.role = "almacenero";
  }
}

/* ── REAL-TIME LISTENERS ─────────────────────────────────── */
function startRealtimeListeners(onItemsChange, onMovsChange) {
  if (!FB.db || !FB.uid) return;

  // Items listener
  FB.unsubItems = FB.db
    .collection(COL_INVENTARIO)
    .orderBy("updatedAt", "desc")
    .onSnapshot(
      { includeMetadataChanges: true },
      (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
        const fromCache = snapshot.metadata.fromCache;
        updateSyncBadge(fromCache ? "cache" : "online");
        if (typeof onItemsChange === "function") onItemsChange(items, fromCache);
      },
      (err) => {
        console.error("Items listener error:", err);
        updateSyncBadge("error");
      }
    );

  // Movements listener (últimos 100)
  FB.unsubMovs = FB.db
    .collection(COL_MOVIMIENTOS)
    .orderBy("date", "desc")
    .limit(100)
    .onSnapshot(
      (snapshot) => {
        const movs = [];
        snapshot.forEach((doc) => movs.push({ id: doc.id, ...doc.data() }));
        if (typeof onMovsChange === "function") onMovsChange(movs);
      },
      (err) => console.error("Movs listener error:", err)
    );
}

function stopRealtimeListeners() {
  if (FB.unsubItems)  { FB.unsubItems();  FB.unsubItems  = null; }
  if (FB.unsubMovs)   { FB.unsubMovs();   FB.unsubMovs   = null; }
}

/* ── CRUD INVENTARIO ─────────────────────────────────────── */
async function fbSaveItem(item) {
  if (!FB.db) throw new Error("Sin conexión Firebase");
  const ts = firebase.firestore.FieldValue.serverTimestamp();
  const data = {
    ...item,
    updatedAt:  ts,
    updatedBy:  FB.uid,
    hotel:      "Hyde House Hotel",
  };
  if (item.id && !item.id.startsWith("itm")) {
    // Existing Firestore doc
    await FB.db.collection(COL_INVENTARIO).doc(item.id).set(data, { merge: true });
    return item.id;
  } else {
    // New item or seeded item → let Firestore generate ID
    delete data.id;
    if (!data.createdAt) data.createdAt = ts;
    const ref = await FB.db.collection(COL_INVENTARIO).add(data);
    return ref.id;
  }
}

async function fbDeleteItem(itemId) {
  if (!FB.db) throw new Error("Sin conexión Firebase");
  await FB.db.collection(COL_INVENTARIO).doc(itemId).delete();
}

async function fbUpdateQty(itemId, newQty, updatedBy) {
  if (!FB.db) throw new Error("Sin conexión Firebase");
  await FB.db.collection(COL_INVENTARIO).doc(itemId).update({
    qty:       newQty,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: updatedBy || FB.uid,
  });
}

/* ── CRUD MOVIMIENTOS ─────────────────────────────────────── */
async function fbSaveMovement(mov) {
  if (!FB.db) throw new Error("Sin conexión Firebase");
  const data = {
    ...mov,
    uid:   FB.uid,
    hotel: "Hyde House Hotel",
    date:  firebase.firestore.FieldValue.serverTimestamp(),
  };
  delete data.id;
  const ref = await FB.db.collection(COL_MOVIMIENTOS).add(data);
  return ref.id;
}

/* ── SEED inicial (solo si colección vacía) ──────────────── */
async function seedIfEmpty(seedItems) {
  if (!FB.db) return;
  try {
    const snap = await FB.db.collection(COL_INVENTARIO).limit(1).get();
    if (!snap.empty) return; // ya tiene datos
    console.log("🌱 Seeding inventario inicial...");
    const batch = FB.db.batch();
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    seedItems.forEach((item) => {
      const ref = FB.db.collection(COL_INVENTARIO).doc();
      const d = { ...item, createdAt: ts, updatedAt: ts, hotel: "Hyde House Hotel" };
      delete d.id;
      batch.set(ref, d);
    });
    await batch.commit();
    console.log("✅ Seed completado:", seedItems.length, "productos");
  } catch (err) {
    console.warn("Seed error:", err.message);
  }
}

/* ── SYNC BADGE ──────────────────────────────────────────── */
function updateSyncBadge(status) {
  const badge = document.getElementById("sync-badge");
  if (!badge) return;
  const map = {
    online:      { txt: "● En línea",     color: "#27AE60" },
    cache:       { txt: "⬡ Cache",        color: "#F39C12" },
    offline:     { txt: "○ Sin conexión", color: "#E74C3C" },
    conectando:  { txt: "◌ Conectando…",  color: "#2E5FA3" },
    error:       { txt: "✕ Error sync",   color: "#E74C3C" },
  };
  const s = map[status] || map.offline;
  badge.textContent  = s.txt;
  badge.style.color  = s.color;
}

/* ── ONLINE / OFFLINE DETECTION ──────────────────────────── */
window.addEventListener("online",  () => updateSyncBadge("online"));
window.addEventListener("offline", () => updateSyncBadge("offline"));
