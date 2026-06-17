/**
 * StockPro — Firebase Configuration
 * Proyecto: hk-pro-housekeeping
 *
 * INSTRUCCIONES:
 * 1. Ve a https://console.firebase.google.com
 * 2. Abre el proyecto: hk-pro-housekeeping
 * 3. Settings (⚙️) → General → Tu app web → SDK snippet → Config
 * 4. Pega los valores abajo
 */

const FIREBASE_CONFIG = {
  apiKey:            "PEGA_TU_API_KEY_AQUI",
  authDomain:        "hk-pro-housekeeping.firebaseapp.com",
  projectId:         "hk-pro-housekeeping",
  storageBucket:     "hk-pro-housekeeping.appspot.com",
  messagingSenderId: "PEGA_TU_SENDER_ID",
  appId:             "PEGA_TU_APP_ID",
  // databaseURL solo si usas Realtime Database (opcional)
  // databaseURL: "https://hk-pro-housekeeping-default-rtdb.firebaseio.com"
};

// Colecciones Firestore — comparte estructura con HK Pro Enterprise v3
const COLLECTIONS = {
  INVENTARIO:   "stockpro_inventario",    // productos del almacén
  MOVIMIENTOS:  "stockpro_movimientos",   // entradas / salidas / ajustes
  USUARIOS:     "stockpro_usuarios",      // presencia y perfiles
  // Colecciones compartidas con HK Pro Enterprise:
  SOLICITUDES:  "solicitudes",            // conecta con el módulo de solicitudes
  PRODUCTOS_HH: "productosHydeHouse",     // catálogo global de productos
};

// ── Inicializar Firebase ────────────────────────────────────
let _app, _db, _auth;

function initFirebase(config) {
  try {
    if (firebase.apps.length) {
      _app = firebase.apps[0];
    } else {
      _app = firebase.initializeApp(config || FIREBASE_CONFIG);
    }
    _db   = firebase.firestore();
    _auth = firebase.auth();

    // Persistencia offline
    _db.enablePersistence({ synchronizeTabs: true })
      .catch(err => console.warn("Persistencia offline:", err.code));

    console.log("✅ Firebase inicializado — hk-pro-housekeeping");
    return { db: _db, auth: _auth, ok: true };
  } catch (err) {
    console.error("❌ Firebase init error:", err);
    return { ok: false, error: err.message };
  }
}

function getDB()   { return _db; }
function getAuth() { return _auth; }

// Exponer globalmente
window.FIREBASE_CONFIG  = FIREBASE_CONFIG;
window.COLLECTIONS      = COLLECTIONS;
window.initFirebase     = initFirebase;
window.getDB            = getDB;
window.getAuth          = getAuth;
