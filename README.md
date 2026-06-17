# StockPro PWA — Instrucciones de Despliegue

## 🚀 Opción 1: GitHub Pages (Gratis, Recomendado)

### Paso 1 — Subir a GitHub
1. Ve a https://github.com/new
2. Crea un repositorio llamado `stockpro` (público)
3. Sube todos los archivos de esta carpeta

```bash
git init
git add .
git commit -m "StockPro PWA v1.0"
git remote add origin https://github.com/TU_USUARIO/stockpro.git
git push -u origin main
```

### Paso 2 — Activar GitHub Pages
1. Ve a Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `main` → `/ (root)`
4. Clic en **Save**

Tu app estará en: `https://TU_USUARIO.github.io/stockpro`

---

## 📱 Instalar en iPhone 13 Pro Max

1. Abre Safari (debe ser Safari, no Chrome)
2. Ve a la URL de tu app
3. Toca el botón **Compartir** (rectángulo con flecha ↑)
4. Selecciona **"Agregar a pantalla de inicio"**
5. Escribe "StockPro" y toca **Agregar**

✅ La app aparece como ícono en tu pantalla de inicio, igual que una app nativa.

---

## 🔥 Opción 2: Firebase Hosting (Con base de datos en tiempo real)

### Prerrequisitos
- Node.js instalado
- Firebase CLI: `npm install -g firebase-tools`

### Crear proyecto Firebase
1. Ve a https://console.firebase.google.com
2. Crea nuevo proyecto: `stockpro-hydehouuse`
3. Activa **Firestore Database** (modo de prueba)
4. Activa **Authentication** → Email/Password + Google

### Desplegar
```bash
firebase login
firebase init hosting
# Selecciona tu proyecto
# Public directory: . (punto)
# Single page app: No
firebase deploy
```

Tu app estará en: `https://stockpro-hydehouuse.web.app`

### Configurar Firebase en la app
1. Abre la app → Exportar → Configurar Firebase
2. Ingresa los datos de tu proyecto (los encuentras en Firebase Console → Project Settings)
3. Clic en "Conectar"

---

## 🔒 Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /inventario/{itemId} {
      allow read, write: if request.auth != null;
    }
    match /movimientos/{movId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📁 Estructura de archivos

```
stockpro/
├── index.html          # App principal
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker (modo offline)
├── css/
│   └── app.css        # Estilos
├── js/
│   └── app.js         # Lógica de la app
└── icons/
    ├── icon-192.png   # Ícono para iPhone
    └── icon-512.png   # Ícono splash
```

---

## ✨ Funcionalidades

- ✅ Escáner de códigos de barras con cámara del iPhone (EAN-13, UPC, QR, Code 128)
- ✅ Inventario completo con 12 productos pre-cargados de Hotel Arbellas
- ✅ Registro de movimientos (entradas, salidas, ajustes)
- ✅ Reportes con gráficas de stock por categoría
- ✅ Alertas automáticas de stock bajo y sin stock
- ✅ Exportar a CSV, JSON, PDF
- ✅ Búsqueda global en tiempo real
- ✅ Modo offline (Service Worker)
- ✅ Instalable en iPhone como app nativa (PWA)
- ✅ Login con email/contraseña o Google
- ✅ Datos guardados localmente (localStorage)
- ✅ Compatible con Firebase para sincronización en tiempo real

---

## 🛠️ Credenciales de demo

Email: cualquiera  
Contraseña: cualquiera

O usa el botón **"Continuar con Google"** para acceso rápido.

---

**Hotel Arbellas — Hollywood, Florida**  
Desarrollado con StockPro PWA
