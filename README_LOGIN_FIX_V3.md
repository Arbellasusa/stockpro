# StockPro Login Fix v3

Corrección profesional para login de administrador:

1. Si el email admin autorizado no existe en Firebase Authentication, la app lo crea automáticamente al presionar Sign in.
2. Si el email ya existe pero la contraseña no coincide, muestra un error claro para restablecerla en Firebase Console.
3. Firestore Rules permiten crear perfil propio solo como housekeeping, excepto emails bootstrap autorizados que pueden crear perfil administrator.
4. Se mantiene la actualización de productos hoteleros y proveedores.

## Archivos a subir
- index.html → GitHub Pages
- firebase-config.js → GitHub Pages
- admin-setup.js → GitHub Pages opcional
- firestore.rules → Firebase Console > Firestore Database > Rules > Publish

## Firebase Console obligatorio
- Authentication > Sign-in method: Email/Password activado.
- Authentication > Settings > Authorized domains: arbellasusa.github.io agregado.
