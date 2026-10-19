# Poner la Copa Malala's en línea (paso a paso)

Resultado final:
- **Página pública** (`https://TU-SITIO.netlify.app/`): cualquiera la ve, solo lectura.
- **Administración** (`https://TU-SITIO.netlify.app/admin.html`): se entra con usuario y contraseña. Lo que se publica ahí lo ve todo el mundo al instante, sin descargar ni subir archivos.

Las partes 1 a 3 se hacen en el navegador, en las consolas de Firebase, GitHub y Netlify. No hay contraseñas ni llaves secretas dentro del código.

## 1. Firebase (login y datos)  ·  https://console.firebase.google.com

1. **Agregar proyecto** → nombre: `copa-malalas` → puedes desactivar Google Analytics.
2. En la pantalla del proyecto toca el icono **`</>` (Web)** → apodo `copa-malalas-web` → **Registrar app** (sin Hosting).
   Te muestra un bloque `firebaseConfig = { apiKey, authDomain, projectId, appId… }`. **Cópialo.**
3. Abre `js/firebase-config.js` y reemplaza `null` por ese bloque:
   ```js
   window.FIREBASE_CONFIG={apiKey:"...",authDomain:"...",projectId:"...",appId:"..."};
   ```
   (Esos datos no son secretos. Lo que protege la plataforma son las reglas del paso 5.)
4. **Authentication** → *Comenzar* → *Método de acceso* → activar **Correo electrónico/contraseña**.
   Luego pestaña **Users** → **Agregar usuario**. No hace falta un correo real: en *Correo* escribe `USUARIO@copamalalas.local` (por ejemplo `camilo@copamalalas.local`) y una contraseña.
   En la página se entra escribiendo solo el usuario (`camilo`) y la contraseña. Como ese correo no existe, no hay "olvidé mi contraseña" por correo:
   si alguien la olvida, se elimina ese usuario en Firebase, se crea de nuevo y se actualiza el documento `admins` con el UID nuevo (paso 6).
   Si en *Settings → User actions* aparece **Enable create (sign-up)**, desactívalo para que nadie más pueda crear cuentas.
5. **Firestore Database** → *Crear base de datos* → modo **producción** → ubicación `southamerica-east1` (São Paulo) o la más cercana.
   Pestaña **Reglas** → pega todo el contenido del archivo `firestore.rules` → **Publicar**.
6. Da permiso de administración a cada persona del paso 4:
   Firestore → **Iniciar colección** → ID `admins` → como **ID del documento** pega el **UID** de esa persona
   (lo ves en Authentication → Users, columna *UID de usuario*) → un campo `activo` (booleano) = `true`.
   Una persona sin ese documento puede tener cuenta, pero no puede publicar nada.

## 2. GitHub  ·  https://github.com

1. Crea un repositorio nuevo, por ejemplo `copa-malalas-web` (puede ser privado).
2. Sube el contenido de la carpeta `copa-malalas-web/` (el `index.html` debe quedar en la raíz del repositorio).

## 3. Netlify  ·  https://app.netlify.com

1. **Add new site → Import an existing project → GitHub** → elige el repositorio.
2. **Build command:** vacío · **Publish directory:** `.` (o vacío) → **Deploy**.
3. Anota la dirección que te da (`algo.netlify.app`).
4. Vuelve a Firebase → Authentication → **Settings → Authorized domains** → **Agregar dominio** con esa dirección.
   Es una precaución: el ingreso con usuario y contraseña normalmente funciona igual, pero así se evitan sorpresas.

## Notas de Netlify (aprendidas al publicar)

- **Privado por defecto:** Netlify crea el proyecto como *Private* y el público ve un login de Netlify. Para abrirlo:
  Project configuration → General → **Visitor access** → **Public** → Save.
- **Repositorio privado:** si el repositorio no aparece al importar, toca *Configure the Netlify app on GitHub*, agrega el repositorio
  en *Repository access* y **no quites los que ya estaban** (otros sitios dejarían de actualizarse).
- El archivo `_redirects` oculta al público la documentación interna (`CLAUDE.md`, `README.md`, `PUBLICAR.md`, `firestore.rules`).
- Dirección actual: `https://copa-malalas.netlify.app/` · administración: `https://copa-malalas.netlify.app/admin.html`.

## 3b. Subdominio propio (ejemplo: `copamalalas.totalsportcolombia.com`)

Se puede hacer antes o después del paso 4. Solo se AGREGA un registro nuevo; no se toca ninguno de los que ya existen en el dominio.

1. Netlify → tu sitio → **Domain management → Add a domain** → escribe `copamalalas.totalsportcolombia.com` (o el nombre que elijan) → confirmar.
2. Netlify muestra qué registro crear. Casi siempre es un **CNAME**: nombre `copamalalas`, valor `TU-SITIO.netlify.app`.
3. Ese registro se crea donde se administra el DNS de `totalsportcolombia.com` (el registrador, Cloudflare, Netlify DNS u otro).
4. Esperar unos minutos hasta que Netlify marque el dominio como correcto. El certificado HTTPS (candadito) lo genera Netlify solo, en **HTTPS → Verify DNS configuration → Provision certificate** si no sale automático.
5. Firebase → Authentication → Settings → **Authorized domains** → agregar también `copamalalas.totalsportcolombia.com`. Es una precaución, igual que arriba.

Direcciones finales:
- Público: `https://copamalalas.totalsportcolombia.com/`
- Administración: `https://copamalalas.totalsportcolombia.com/admin.html`

## 4. Primera publicación (sube los datos actuales a la nube)

1. Entra a `https://TU-SITIO.netlify.app/admin.html` con tu usuario y contraseña.
2. Toca **Editar resultados**, carga un resultado real (o corrige algo) y toca **Publicar para todos**.
   Esa primera publicación copia todos los datos de `data/torneo.js` a la nube. Desde ahí la página pública lee de la nube.

## 5. Día a día

- Cargar resultados: `/admin.html` → Editar resultados → **Publicar para todos**. Queda en línea al instante.
- Si dos administradores publican a la vez, al segundo le avisa que recargue y vuelva a cargar su cambio.
- `data/torneo.js` queda como copia inicial y respaldo. Si la nube no responde, la página pública usa esa copia.
- Cambios de diseño o de código: se suben a GitHub y Netlify actualiza solo. Agrupa los cambios en un solo envío para cuidar los créditos.

## Qué ve cada perfil

| | Público | Administradora |
|---|---|---|
| Tablas, partidos, goleadoras, estadísticas, reglamento | Sí | Sí |
| Exportar imágenes | Sí | Sí |
| Editar resultados, sorteo, novedades, patrocinadores | No | Sí |
| Pestañas internas (W.O. y reclasificación) y pagos de W.O. | No | Sí |

Los pagos de W.O. se guardan aparte (`torneo/privado`), con reglas que solo permiten leerlos a los administradores.
