# StockPro Firebase — Guía de Activación
# Proyecto: hk-pro-housekeeping

## PASO 1 — Obtener credenciales Firebase

1. Ve a https://console.firebase.google.com
2. Selecciona el proyecto: **hk-pro-housekeeping**
3. Haz clic en ⚙️ (Configuración del proyecto)
4. En la sección "Tus apps", selecciona tu app web (o crea una nueva con el botón </> )
5. Copia el objeto `firebaseConfig` que aparece:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "hk-pro-housekeeping.firebaseapp.com",
  projectId: "hk-pro-housekeeping",
  storageBucket: "hk-pro-housekeeping.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

6. Abre el archivo **js/firebase-config.js** y pega los valores en `FIREBASE_CONFIG`

---

## PASO 2 — Activar Authentication en Firebase Console

1. En Firebase Console → Authentication → Sign-in method
2. Activa **Email/Password** ✅
3. Activa **Google** ✅ (requerido para "Continuar con Google")
4. En "Authorized domains", agrega:
   - `arbellasusa.github.io`
   - `localhost` (para pruebas)

---

## PASO 3 — Configurar Firestore

1. Firebase Console → Firestore Database
2. Si aún no existe, crea la base de datos en modo **producción**
3. Selecciona región: **us-east1** (ya configurado en HK Pro Enterprise)
4. Ve a la pestaña **Reglas** y pega el contenido de `firestore.rules`

---

## PASO 4 — Publicar en GitHub Pages

```bash
# Desde la carpeta stockpro-firebase/
git init
git add .
git commit -m "StockPro Firebase v1.0 — hk-pro-housekeeping"
git remote add origin https://github.com/arbellasusa/stockpro.git
git push -u origin main
```

Luego en GitHub: Settings → Pages → Branch: main → Save

URL final: **https://arbellasusa.github.io/stockpro**

---

## PASO 5 — Instalar en iPhone 13 Pro Max

1. Abre **Safari** y ve a la URL
2. Toca el ícono Compartir ↑
3. "Agregar a pantalla de inicio"
4. Nombre: **StockPro**
5. Listo — ícono en tu pantalla como app nativa

---

## Estructura de colecciones en Firestore

| Colección | Uso |
|-----------|-----|
| `stockpro_inventario` | Productos del almacén (tiempo real) |
| `stockpro_movimientos` | Entradas/salidas/ajustes (solo append) |
| `stockpro_usuarios` | Presencia del equipo en línea |
| `solicitudes` | **Compartida** con HK Pro Enterprise |
| `productosHydeHouse` | **Compartida** con HK Pro Enterprise |

---

## Credenciales de prueba (modo demo sin Firebase)

Si aún no tienes las credenciales, la app funciona en modo offline:
- Email: cualquier email
- Contraseña: cualquier contraseña
- Los datos se guardan en localStorage del dispositivo

---

## Soporte

Email: roldanarbella97@gmail.com
Proyecto HK Pro: https://arbellasusa.github.io/Housekeeping-Pro
