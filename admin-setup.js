// ======================================================
// STOCKPRO v2 — FIRST ADMIN SETUP FIX
// Creates the first administrator automatically after login
// ======================================================

const STOCKPRO_FIRST_ADMIN = {
  email: "roldanarbella97@gmail.com",
  name: "Arbella Roldan",
  role: "administrator"
};

async function initializeStockProAuth() {
  try {
    if (!window.firebase || !firebase.auth || !firebase.firestore) {
      showAuthError("Firebase is not loaded correctly.");
      return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(async function (user) {
      try {
        if (!user) {
          showLoginScreen();
          return;
        }

        const userEmail = (user.email || "").toLowerCase().trim();
        const adminEmail = STOCKPRO_FIRST_ADMIN.email.toLowerCase().trim();

        const userRef = db.collection("stockpro_usuarios").doc(user.uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
          if (userEmail === adminEmail) {
            await createFirstAdminProfile(userRef, user);
            showAuthSuccess("First administrator profile created successfully. Reloading...");
            setTimeout(() => window.location.reload(), 1200);
            return;
          }

          await firebase.auth().signOut();
          showAuthError("Your account is authenticated, but it is not authorized to use StockPro.");
          return;
        }

        const profile = userSnap.data();

        if (!profile || profile.status !== "active") {
          await firebase.auth().signOut();
          showAuthError("Your user profile is inactive or invalid.");
          return;
        }

        if (!profile.role) {
          await firebase.auth().signOut();
          showAuthError("Your user profile does not have an assigned role.");
          return;
        }

        window.stockProCurrentUser = {
          uid: user.uid,
          email: user.email,
          name: profile.name || user.displayName || user.email,
          role: profile.role,
          permissions: profile.permissions || {}
        };

        showMainApp();
        loadStockProData();

      } catch (error) {
        console.error("StockPro login error:", error);
        showAuthError("Login error: " + error.message);
      }
    });

  } catch (error) {
    console.error("StockPro auth initialization error:", error);
    showAuthError("Authentication initialization failed.");
  }
}

async function createFirstAdminProfile(userRef, user) {
  return userRef.set({
    uid: user.uid,
    email: user.email,
    name: STOCKPRO_FIRST_ADMIN.name,
    role: STOCKPRO_FIRST_ADMIN.role,
    status: "active",
    permissions: {
      inventory: true,
      reports: true,
      users: true,
      audit: true,
      admin: true,
      settings: true
    },
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    setupBy: "automatic_first_admin_setup"
  }, { merge: true });
}

// Replace these functions with your real app screen functions if they already exist

function showLoginScreen() {
  const login = document.getElementById("loginScreen");
  const app = document.getElementById("appScreen");

  if (login) login.style.display = "block";
  if (app) app.style.display = "none";
}

function showMainApp() {
  const login = document.getElementById("loginScreen");
  const app = document.getElementById("appScreen");

  if (login) login.style.display = "none";
  if (app) app.style.display = "block";
}

function showAuthError(message) {
  console.error(message);

  let box = document.getElementById("authErrorBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "authErrorBox";
    box.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #b91c1c;
      color: white;
      padding: 14px 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      z-index: 99999;
      max-width: 90%;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,.25);
    `;
    document.body.appendChild(box);
  }

  box.textContent = message;
}

function showAuthSuccess(message) {
  console.log(message);

  let box = document.getElementById("authSuccessBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "authSuccessBox";
    box.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #047857;
      color: white;
      padding: 14px 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      z-index: 99999;
      max-width: 90%;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,.25);
    `;
    document.body.appendChild(box);
  }

  box.textContent = message;
}

function loadStockProData() {
  if (typeof window.loadInventory === "function") {
    window.loadInventory();
  }

  if (typeof window.renderDashboard === "function") {
    window.renderDashboard();
  }

  console.log("StockPro data loaded.");
}

document.addEventListener("DOMContentLoaded", initializeStockProAuth);
