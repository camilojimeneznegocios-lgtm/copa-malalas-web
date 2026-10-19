# CLAUDE.md · Copa Malala's 2026 (sitio estático)

Sitio público del torneo de fútbol femenino Copa Malala's 2026 (Supercopa de la No Violencia, Medellín).
Todo el texto visible está en **español de Colombia**. Responde a la organizadora en español.

## Arquitectura
- Sin build ni dependencias. `index.html` carga `css/estilos.css`, `data/torneo.js` y `js/app.js`.
- `data/torneo.js` define `window.TORNEO = {...}`: es la única fuente de datos. Para actualizar resultados
  edita SOLO este archivo (salvo que te pidan cambiar diseño o lógica).
- `js/app.js` es un IIFE en ES5 (sin módulos, sin frameworks). Renderiza todo con strings HTML en `render()`.
  Al editar el JS, valida con `node --check js/app.js`.
- Librería externa: html2canvas 1.4.1 (CDN) solo para "Exportar imagen".
- `STANDALONE` = no corre dentro de claude.ai. `?admin` activa el modo organizadora: edición local y
  botón "Descargar datos (torneo.js)" (`publishStandalone`). El código para claude.ai (`window.claude`) se
  conserva, no lo borres.

## Nube y perfiles (Firebase + Netlify)
- `index.html` = página pública (solo lectura), sin ningún enlace ni pista hacia la administración. `admin.html` = ingreso de administradores (`window.MODO_ADMIN`), solo se llega escribiendo su dirección.
  Con la nube activa, `?admin` en la pública no hace nada.
- `js/nube.js` arranca la página: si `js/firebase-config.js` tiene configuración, carga el SDK de Firebase desde CDN y
  lee `torneo/datos` en Firestore (campo `json` con todo `window.TORNEO`); si no, usa `data/torneo.js`. Luego carga `js/app.js`.
- Con la nube activa, `admin.html` exige usuario y contraseña (Firebase Auth con correo interno `usuario@copamalalas.local`, sin correos reales) y que exista `admins/{uid}`.
  "Publicar para todos" escribe en Firestore con una transacción que compara `rev` (si no coincide, avisa conflicto).
- Los pagos de W.O. (`woPaid`) se guardan aparte en `torneo/privado` y nunca van en el JSON público.
- La seguridad real son las reglas de `firestore.rules`, no esconder botones. Nunca guardes llaves privadas ni contraseñas en el repo
  (la config web de Firebase sí es pública).
- Sin configuración de Firebase todo sigue como antes: `?admin` edita en local y descarga `torneo.js`.
- Guía de despliegue: `PUBLICAR.md`.

## Modelo de datos (`window.TORNEO`)
```
{ updated:"AAAA-MM-DD", rev:<int>,
  cats:{ f7|f11|sub14:{
    name, short, active, groups:["A","B","C","D"] | ["U"], groupLabels:{U:"Grupo único"},
    qualify:<n que clasifican; 0 en F7 porque pasan todos a la Fase 2>,
    teams:[{id:"LIL", name:"LILLE FÚTBOL", group:"U"}],
    matches:[{ id, phase:"grupos"|"intergrupos"|"eliminatoria", group, interGroup, ko:"Q1|S1|F|T…",
               round, date:"AAAA-MM-DD", time, venue, home:<teamId>, away:<teamId>,
               hs, as, played:true|false, goals:[{team, player:"NOMBRE EN MAYÚSCULAS", n}],
               jl:{h:{manual:8} | {items:{puntual,sinTarjetas,sinFaltas,ayuda,...}, adj}, a:{...}},
               pens:{h,a} (solo eliminatoria), wo:"h"|"a"|"none", woPaid, notes }],
    byes:{ "<fecha>":<teamId que descansa> },
    scorersBase:[{player, team, g}]   // goles cargados de planillas antiguas (antes del sistema)
    fase2 (solo F7: grupos sorteados), interTotal, legs:1|2, legsBase, third:true|false } },
  info:{ news:[], docs:[], social:{instagram,…}, sponsors:[{name, role, url, logo:"assets/patrocinadores/x.png"}] } }
```
- Los equipos se referencian por `id`; cambiar `name` no rompe nada. Nunca cambies un `id` existente.
- Un partido pendiente tiene `played:false, hs:null, as:null`.
- Al cargar un resultado: `played:true`, `hs`/`as` números, `goals` sumando exactamente `hs`/`as` por equipo,
  `jl` de ambos equipos. Sube `rev` en 1 y pon `updated` en la fecha de hoy.

## Reglas del torneo (ya implementadas en app.js)
- Puntos: victoria 3, empate 1, derrota 0.
- Desempate en tablas: **PTS → Juego limpio (JL) → DG → menos GC**.
- JL por partido: máx. 8 (+3 puntual, +3 sin tarjetas, +1 sin faltas antideportivas, +1 tarjeta naranja);
  descuentos según el reglamento (ver `JL_POS`/`JL_NEG` en app.js). W.O. = 0 goles a 3.
- F7: fase de grupos (A–D) → Fase 2 sorteada (8 grupos de 4, todos arrancan de cero; desempate:
  cabeza de grupo → JL histórico → DG → GC) → octavos (2 por grupo) → cuartos → semis → final.
- F11: grupo único; pasan 8 a cuartos: 1–8, 4–5, 2–7, 3–6.
- 2013-2014: grupo único de 6 a una vuelta; pasan 4 a semifinales: 1–4, 2–3.
- Eliminación directa: empate se define por penales (`pens`), sin tiempo extra. Tercer puesto opcional (`third`).

## Convenciones
- Nombres de equipos y jugadoras en MAYÚSCULAS (con tildes).
- No agregues dependencias ni build steps; el sitio debe poder abrirse con doble clic (el SDK de Firebase solo se carga si hay configuración).
- Antes de entregar cambios en la UI, abre la página con `python3 -m http.server` y revisa escritorio y celular.
