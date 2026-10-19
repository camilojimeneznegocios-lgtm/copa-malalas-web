# Copa Malala's 2026 · Página pública

Sitio web estático de la **Copa Malala's 2026 – Supercopa de la No Violencia** (Categoría Libre Femenina, Medellín).
Incluye Fútbol 7, Fútbol 11 y 2013-2014 con tablas de posiciones, Fase 2, eliminación directa, partidos,
goleadoras, valla menos vencida, juego limpio (Copa Sororidad), estadísticas, novedades, reglamento y patrocinadores.

No necesita servidor, base de datos ni instalación: son archivos HTML, CSS y JavaScript.

## Estructura

```
index.html                  Página principal
css/estilos.css             Estilos (colores morado/dorado de la marca)
js/app.js                   Lógica: tablas, desempates, cruces, exportar imágenes, modo organizadora
data/torneo.js              TODOS los datos del torneo (equipos, partidos, goles, JL, novedades…)
assets/logo.png             Logo de la Supercopa
assets/patrocinadores/      Logos de patrocinadores
```

## Verla en tu computador

Abre `index.html` con doble clic. Para que la exportación de imágenes funcione bien, mejor con un servidor local:

```bash
npx serve .        # o:  python3 -m http.server 8000
```

## Publicarla en internet con perfil de administración

La guía completa, con login de administradores y datos en la nube, está en **[PUBLICAR.md](PUBLICAR.md)**.
Sin configurar Firebase (`js/firebase-config.js` en `null`) la página funciona en modo local, como se describe abajo.

## Publicarla solo como archivos (modo local, gratis)

- **GitHub Pages:** sube la carpeta a un repositorio → Settings → Pages → Deploy from branch `main` / raíz.
- **Netlify:** arrastra la carpeta a https://app.netlify.com/drop.
- **Vercel:** `npx vercel` dentro de la carpeta.

## Actualizar resultados

**Opción A · Modo organizadora (sin código)**
1. Abre la página publicada agregando `?admin` al final, por ejemplo `https://tu-sitio.com/?admin`.
2. Toca **Editar resultados**, carga marcadores, goleadoras, juego limpio, novedades, etc.
3. Toca **Descargar datos (torneo.js)** en la barra de abajo.
4. Reemplaza `data/torneo.js` del proyecto por el archivo descargado y vuelve a publicar (git push / Netlify).

`?admin` solo cambia lo que ve quien lo usa en su navegador: nadie puede modificar la página pública sin
subir el archivo nuevo al hosting.

**Opción B · Con Claude Code**
Pídele, por ejemplo: *"Carga el resultado Lille Fútbol 2–1 Felria de la fecha 2 en 2013-2014, goles de …"*.
Claude Code edita `data/torneo.js` siguiendo las reglas de `CLAUDE.md`.

## Ojo con la privacidad

`data/torneo.js` es público. La pestaña interna de W.O. y la reclasificación solo se muestran con `?admin`,
pero sus datos (W.O. pagados, notas de planilla) están dentro del archivo. No guardes ahí información
sensible.
