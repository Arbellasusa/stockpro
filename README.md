# StockPro v2 — Hotel Arbellas

Sistema de gestión de inventario de almacén con escáner de códigos de barras, sincronización Firebase en tiempo real y soporte PWA para iPhone/Android.

---

## 📁 Estructura de archivos

```
stockpro/
├── index.html          ← App completa (CSS + JS inline — un solo archivo)
├── manifest.json       ← PWA manifest (íconos, nombre, colores)
├── sw.js               ← Service Worker (caché offline)
├── icon-192.png        ← Ícono app (192×192)
├── icon-512.png        ← Ícono splash (512×512)
├── icon.svg            ← Ícono vectorial
├── firebase-config.js  ← Configuración Firebase (seguro para GitHub)
├── firestore.rules     ← Reglas de seguridad (deploy en Firebase Console)
├── admin-setup.js      ← Script setup primer administrador (consola del browser)
├── hotel_products_by_supplier.csv  ← Catálogo de productos hoteleros
├── supplier_list.csv               ← Lista de proveedores
├── SECURITY.md         ← Arquitectura de seguridad
├── SETUP.md            ← Guía de activación Firebase
└── README.md           ← Este archivo
```

---

## 🚀 Despliegue en GitHub Pages (Recomendado)

### Paso 1 — Subir a GitHub

```bash
git init
git add .
git commit -m "StockPro v2 — Hotel Arbellas"
git remote add origin https://github.com/arbellasusa/stockpro.git
git push -u origin main
```

### Paso 2 — Activar GitHub Pages

1. Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `main` → `/ (root)`
4. Clic en **Save**

URL: **https://arbellasusa.github.io/stockpro**

---

## 🔥 Configuración Firebase (OBLIGATORIO para login)

### 1. Firebase Console → Authentication
- Sign-in method → **Email/Password: Activar** ✅
- Sign-in method → **Google: Activar** ✅ (opcional)
- Settings → Authorized domains → Agregar: `arbellasusa.github.io`

### 2. Firebase Console → Firestore Database → Rules
Pegar el contenido de `firestore.rules` → **Publish**

### 3. Primer administrador
Abre la app → inicia sesión con `roldanarbella97@gmail.com` → el sistema crea el perfil de administrador automáticamente.

Si hay problemas, abre DevTools (F12) → Console → pega y ejecuta `admin-setup.js`.

---

## 📱 Instalar en iPhone (Safari)

1. Abre **Safari** → ve a la URL de la app
2. Toca **Compartir** (ícono ↑)
3. Selecciona **"Agregar a pantalla de inicio"**
4. Nombre: **StockPro** → **Agregar**

La app aparece como ícono nativo en tu pantalla de inicio.

---

## ✨ Funcionalidades

- ✅ Login Firebase con email/contraseña o Google
- ✅ Roles: Administrator, Warehouse Manager, Supervisor, Housekeeping
- ✅ Inventario en tiempo real (Firestore onSnapshot)
- ✅ Escáner de códigos de barras (EAN-13, UPC, QR, Code 128)
- ✅ 153 productos hoteleros precargados (H2O Therapy, Lysol, Tide, Tork, etc.)
- ✅ Módulo DHS Supplier (Diversified Hospitality Solutions)
- ✅ Entregas con firmas digitales y PDF profesional
- ✅ Movimientos de inventario (entradas, salidas, ajustes)
- ✅ Reportes con PDF descargable
- ✅ Dashboard con métricas en tiempo real
- ✅ Alertas automáticas de stock bajo / sin stock
- ✅ Exportar CSV, JSON, PDF
- ✅ Modo offline con Service Worker
- ✅ Instalable como app nativa (PWA)
- ✅ Compatible: iPhone Safari, Android Chrome, iPad, Desktop

---

## 🔒 Seguridad

- Firebase Authentication: sesiones persistentes
- Firestore Security Rules: acceso por rol, servidor (no cliente)
- Bootstrap admin: `roldanarbella97@gmail.com` y `roldanarbella79@myyahoo.com`
- API Key pública segura (protección por Rules, no por secreto)

Ver `SECURITY.md` para arquitectura completa.

---

## 🛠️ Credenciales de prueba (modo demo)

Si Firebase no está configurado, la app funciona en modo offline:
- Email: cualquier email
- Contraseña: cualquier contraseña (mín. 6 caracteres)
- Datos se guardan en localStorage

---

**Hotel Arbellas · Plantation, Florida · StockPro v2 · © 2026**
