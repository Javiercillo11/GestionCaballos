# Gestión de Caballos

Aplicación web para gestionar caballos, sus clientes, los servicios contratados, sus precios y su ubicación.

- **Frontend:** React 18 + TypeScript + Vite (SPA estática).
- **Backend:** Firebase Authentication (email/contraseña) + Cloud Firestore. No hay servidor propio.
- **Alojamiento:** GitHub Pages, desplegado con GitHub Actions.

## Funcionalidades

- Login con email y contraseña, mensajes de error en español, recuperación de contraseña, sesión persistente y cierre de sesión.
- Acceso restringido a una **lista de usuarios autorizados** (`allowedUsers`): una cuenta de Firebase cualquiera no puede ver ni modificar datos.
- **Resumen (pantalla inicial):** total de caballos (en curso / terminados), **dinero por ganar** (suma de los caballos *en curso*), **dinero ganado** (suma de los *terminados*), barra de proporción y desglose por cliente.
- **Caballos:** tabla con búsqueda (caballo o cliente, sin distinguir tildes/mayúsculas), filtro En curso/Terminado, ordenación por columnas, paginación (15 por página), ficha completa, alta/edición, marcar como terminado / reabrir y eliminación con confirmación.
- **Servicios:** catálogo con alta/edición/consulta, activar/desactivar y eliminación segura (bloqueada si algún caballo lo tiene asignado; se ofrece desactivarlo).
- Precio total calculado automáticamente en céntimos, actualizado al instante, formato `1.234,56 €`.
- Diseño responsive: en móvil las tablas pasan a tarjetas y los formularios a hoja inferior.
- Estados de carga, pantallas vacías, avisos de éxito/error, aviso de falta de conexión y protección contra doble envío.

## Estructura de Firestore

```
allowedUsers/{uid}           ← se crea a mano desde la consola (solo lectura para la app)
  email: string

services/{serviceId}
  name: string               (1–100)
  description: string        (0–500)
  price: int                 céntimos (0 – 10.000.000)
  status: "active" | "inactive"
  createdAt, updatedAt: timestamp (del servidor)

horses/{horseId}
  name: string               (1–100)
  clientName: string         (1–100)
  services: [ { serviceId, name, price } ]   ← copia en el momento de la asignación
  serviceIds: [ serviceId ]                  ← índice para buscar caballos por servicio
  totalPrice: int            céntimos = suma de services[].price
  location: string           (0–200)
  registrationDate: "YYYY-MM-DD"
  status: "in_progress" | "finished"        ← en curso (por cobrar) / terminado (ganado)
  createdAt, updatedAt: timestamp (del servidor)
```

Los servicios siguen usando `active` / `inactive` (disponibles o no para asignar).

> **Migración:** antes los caballos usaban `active`/`inactive`. La app lee los valores antiguos como *en curso*/*terminado*, y `node --env-file=.env.e2e scripts/migrate-horse-status.mjs` los reescribe en Firestore (ya ejecutado el 30/10/2026).

### Política de precios y relaciones

- Cada caballo referencia los servicios por su **id estable** de Firestore, y guarda además una **copia del nombre y del precio** aplicados al asignarlo.
- Cambiar el precio o el nombre de un servicio del catálogo **no modifica** los importes de los caballos que ya lo tenían. Al editar un caballo, los servicios que ya tenía conservan su precio; solo los servicios añadidos toman el precio actual del catálogo.
- Un servicio **inactivo** no se ofrece en nuevas asignaciones, pero se mantiene en los caballos que ya lo tienen.
- Un servicio asignado a algún caballo **no se puede eliminar** (la app lo comprueba con una consulta `serviceIds array-contains`); se ofrece desactivarlo.

## Reglas de seguridad

Están en [`firestore.rules`](firestore.rules). Resumen:

- Todo requiere `request.auth != null` **y** que exista `allowedUsers/{uid}`.
- `allowedUsers`: cada usuario solo puede leer su propio documento; nadie puede escribir desde el cliente.
- `services` / `horses`: validación estricta de esquema (campos permitidos y obligatorios, tipos, longitudes, importes enteros no negativos, estado válido, fecha `YYYY-MM-DD`, `createdAt`/`updatedAt` = hora del servidor, `createdAt` inmutable).
- Coherencia del total: las reglas comprueban que `serviceIds` tiene el mismo tamaño que `services`, que sin servicios el total es 0 y que con un servicio coincide con su precio. *Limitación:* las reglas de Firestore no pueden sumar listas de tamaño variable, por lo que para 2+ servicios la suma se garantiza en el cliente (`src/services/horses.ts`) y se cubre con tests.
- *Limitación:* las reglas no pueden consultar otras colecciones, así que la comprobación de "servicio en uso" antes de eliminar la hace la app. Por eso se recomienda **desactivar** en vez de eliminar.
- Cualquier otra ruta está denegada.

## Configuración de Firebase (una sola vez)

1. **Authentication → Sign-in method:** habilita *Correo electrónico/contraseña*.
2. **Authentication → Settings → Authorized domains:** añade `javiercillo11.github.io` (y `localhost`, que suele venir por defecto).
3. **Recomendado:** *Authentication → Settings → User actions*: desmarca **Enable create (sign-up)** para que nadie pueda registrarse con la API pública. (Aunque alguien se registre, no tendrá acceso a datos sin estar en `allowedUsers`.)
4. **Firestore Database:** créala en modo producción.
5. **Usuarios:** en *Authentication → Users* crea cada usuario. Copia su **UID** y en *Firestore* crea el documento `allowedUsers/<UID>` con un campo `email` (string).
6. **Reglas:** despliégalas con la CLI:
   ```bash
   npx firebase-tools login
   npm run deploy:rules
   ```
   (o copia el contenido de `firestore.rules` en *Firestore → Reglas* y pulsa *Publicar*).

### Variables de configuración

La configuración web de Firebase (`apiKey`, `projectId`, …) es **pública por diseño**: va en el JavaScript que descarga el navegador y no da acceso a nada por sí misma; la seguridad la aportan Authentication, la lista `allowedUsers` y las reglas. Por eso está como valor por defecto en [`src/lib/firebaseConfig.ts`](src/lib/firebaseConfig.ts).

Para apuntar a otro proyecto, define estas variables (en `.env.local` para desarrollo, o como *Variables* del repositorio en GitHub → Settings → Secrets and variables → Actions → Variables):

| Variable | Valor actual |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyAf66NE1Jhf7VUyE6XP8IEEykepMZkdCYE` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `gestioncaballos.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `gestioncaballos` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `gestioncaballos.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `326296813927` |
| `VITE_FIREBASE_APP_ID` | `1:326296813927:web:9dd86c234fa39523926fc2` |
| `BASE_PATH` (solo build) | `/GestionCaballos/` por defecto |

Nunca subas al repositorio archivos `.env` con secretos ni cuentas de servicio (`.gitignore` ya excluye `.env*`).

## Ejecutar en local

Requisitos: Node 20+ (probado con Node 22/24).

```bash
npm install
npm run dev        # http://localhost:5173/GestionCaballos/
npm test           # tests unitarios (importes en céntimos, política de precios, fechas)
npm run build      # build de producción en dist/
npm run preview    # sirve dist/ en http://localhost:4173/GestionCaballos/
```

## Desplegar en GitHub Pages

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions** (requiere permisos de administrador del repositorio).
2. Haz push a `main`. El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) instala dependencias, pasa los tests, compila y publica `dist/`.
3. La app queda en `https://javiercillo11.github.io/GestionCaballos/`.

**Rutas:** se usa `HashRouter` (`/#/resumen`, `/#/caballos`, `/#/servicios`), así que recargar cualquier página funciona en GitHub Pages sin configuración de servidor. Además se publica `404.html` como copia de `index.html` por si se accede a una ruta inexistente.

## Pruebas contra Firebase real

Con un usuario de prueba incluido en `allowedUsers` (las credenciales pueden ir en `.env.e2e`, excluido de git, con `E2E_EMAIL=` y `E2E_PASSWORD=`):

```bash
# Reglas de seguridad desplegadas (sin autenticar, cuenta no autorizada, validación de esquema)
E2E_EMAIL=... E2E_PASSWORD=... npm run rules:check

# Interfaz completa con Playwright (necesita Chromium de Playwright: npx playwright install chromium)
npm run build && npm run preview &
E2E_EMAIL=... E2E_PASSWORD=... npm run e2e
# Contra la versión publicada:
E2E_URL=https://javiercillo11.github.io/GestionCaballos/ E2E_EMAIL=... E2E_PASSWORD=... npm run e2e
```

Los scripts crean datos con prefijo `E2E-<timestamp>`/`ZZ rules` y los eliminan al terminar.

## Estructura del código

```
src/
  lib/          firebase (init y config), tipos, importes (money.ts), resumen (stats.ts), estados, fechas, errores, hooks de tabla
  services/     acceso a Firestore/Auth: auth.ts, horses.ts, catalog.ts
  context/      AuthContext (sesión + autorización), DataContext (suscripciones en tiempo real)
  components/   Layout, Modal, ConfirmDialog, Toast, componentes de UI
  pages/        Login, Resumen, Caballos (tabla, formulario, ficha), Servicios (tabla, formulario)
  styles/       tokens.css (paleta y medidas), base.css
tests/          tests unitarios (Vitest)
e2e/            pruebas contra Firebase real (reglas + Playwright)
```
