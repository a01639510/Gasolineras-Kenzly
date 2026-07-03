% Documentación de Arquitectura — App IP ASEA (Verde Raíz)
% Verde Raíz
% Julio 2026

# 1. Propósito de este documento

Describe qué hace cada módulo del sistema, cómo se comunican entre sí y cómo desplegarlo/mantenerlo, para que un desarrollador externo (soporte técnico, freelancer, o el propio equipo en el futuro) pueda dar mantenimiento sin depender del autor original.

# 2. Visión general

Es una aplicación **web estática de un solo archivo HTML** (sin framework, sin build, sin `package.json`) más **una función serverless** que hace de puente seguro hacia el proveedor de IA. No hay base de datos ni backend con estado: todo el estado del proyecto vive en el navegador del usuario.

```
┌─────────────────────────────── NAVEGADOR (cliente) ───────────────────────────────┐
│                                                                                     │
│  index.html  ──carga──▶  data.js  ──▶  sistema.js  ──▶  documento.js  ──▶  app.js  │
│                                                                                     │
│   localStorage (respuestas del proyecto, JSON)                                     │
│   IndexedDB    (imágenes/figuras — verde_raiz_img)                                 │
│                                                                                     │
└───────────────────────────────────────┬───────────────────────────────────────────┘
                                         │ fetch POST (solo al usar botones de IA)
                                         ▼
                              ┌─────────────────────┐
                              │  /api/redactar.js    │  ← función serverless (Vercel)
                              │  usa ANTHROPIC_API_KEY│     (nunca en el navegador)
                              └──────────┬───────────┘
                                         │ HTTPS
                                         ▼
                              api.anthropic.com (Claude)
```

No hay llamadas a ningún otro servicio propio: la única dependencia externa en tiempo de ejecución es la API de Anthropic (y, opcionalmente, la exportación pública de un Google Sheet cuando el usuario pega un link — ver Documento 3).

# 3. Módulos del cliente (carpeta raíz)

## 3.1 `index.html`

El *shell* de la aplicación: layout (header, barra lateral con la tabla de contenido, panel del formulario, panel de vista previa del documento), estilos (`<style>` embebido, sin CSS externo) y las etiquetas `<script>` que cargan, en orden, `data.js` → `sistema.js` → `documento.js` → `app.js`. No tiene lógica propia más allá de la estructura del DOM sobre la que `app.js` escribe.

## 3.2 `data.js` — catálogos y boilerplate

Expone un único objeto global `window.IPDATA` con ~35 catálogos y bloques de texto fijo. Es la fuente de verdad de "todo lo que no cambia entre proyectos, o cambia dentro de un conjunto cerrado de opciones":

| Categoría | Ejemplos de claves |
|---|---|
| Datos fijos de la consultora | `CONSULTORA` |
| Catálogo de sustancias (CRETIB/CAS) | `SUSTANCIAS`, `SUS_CONSTRUCCION_DEFAULT`, `SUS_OPERACION_DEFAULT` |
| Valores por defecto de ~25 tablas técnicas | `RESIDUOS_DEFAULT`, `CLIMA_DEFAULT`, `RECEPTORES_DEFAULT`, `ACCIONES_PROYECTO_DEFAULT`, `GATILLOS_DEFAULT`, etc. |
| Texto boilerplate nacional | `BOILER` (introducción, POEGT, PND, MEC, metodología Leopold/Gómez-Orea, parque industrial) |
| 44 estrategias POEGT con respuesta estándar | `ESTRATEGIAS_POEGT`, `DISPOSICIONES` |
| Catálogos estatales | `ESTADOS`, `LISTA_ESTADOS`, `CRITERIOS_UGA_JAL`, `CRITERIOS_UGA_HID` |
| Instrumentos jurídicos | `INSTRUMENTOS` |
| Catálogo de figuras/mapas esperados por sección | `AREAS` (33 huecos de imagen, ver Documento 3 §4) |
| Referencias bibliográficas fijas | `REFERENCIAS` |

**Para agregar/editar un catálogo** (p. ej. un nuevo estado con su Plan Estatal y criterios UGA): se edita directamente este archivo — no requiere tocar `app.js` salvo que el nuevo catálogo necesite un tipo de campo nuevo (ver §3.4).

## 3.3 `sistema.js` — contenido embebido de guía y checklist

Carga después de `data.js` y **agrega** más claves al mismo `window.IPDATA`:

- `GUIA_HTML` — el texto de la "📖 Guía de uso" que se muestra dentro de la propia app.
- `CHECKLIST_ASEA` — los ítems del checklist ASEA-00-041 que el usuario marca antes de dar por cerrada una sección.
- `ANEXOS_DOCS` — el catálogo de documentos requeridos en el capítulo VI (acta constitutiva, poder notarial, planos, dictámenes…) con su link editable.
- `JURIDICO` — contenido de referencia legal usado en II.1.

Existe como archivo separado por convención editorial (para no mezclar "catálogos técnicos" con "contenido de ayuda/checklist"), pero técnicamente es una extensión de `data.js`.

## 3.4 `app.js` — cuestionario, estado y motor de ensamblado del lado cliente

El archivo más grande y el corazón de la interacción. Responsabilidades:

- **`SECTIONS`** — arreglo que define las 17 secciones del cuestionario (grupo, título, descripción, lista de campos). Cada campo tiene `id`, etiqueta (`l`), `tipo` y una insignia (`b`: `cerrada` / `boiler` / `abierta`). Es la definición declarativa de todo el formulario.
- **`state`** — objeto único con todas las respuestas del proyecto. Se persiste en `localStorage` (clave `verde_raiz_ip_v1`) en cada cambio (`save()`), y se normaliza al cargar (`normalize()`) para garantizar que arrays/objetos esperados siempre existan aunque el JSON cargado sea antiguo o esté incompleto.
- **`renderForm()` / `renderField()`** — motor de renderizado: recorre `SECTIONS` y, según el `tipo` de cada campo, genera el HTML correspondiente (`text`, `select`, `check`, `puntos`, `sustancias`, `susDinamica`, `estrategias`, `instrumentos`, `open`, `ia`, `tablaIA`, `importar`, `programas`, `checklist`, `anexos`, `guia`…). Cada tipo tiene su propia función `render*()` y, si necesita interacción, una función `bind*()` que conecta los elementos del DOM con `state`.
- **Bucket de imágenes (IndexedDB)** — `idbOpen/idbPut/idbDel/idbAll`, más `fileToDataURL()` que redimensiona la imagen (máx. 1600 px) antes de guardarla. Permite cientos de MB de fotos/planos sin saturar `localStorage` (que tiene límite de ~5–10 MB).
- **Multi-proyecto** — `newProject/openProject/deleteProject/saveCurrentProject/loadIdx`: la app mantiene un índice de proyectos y permite tener varios en paralelo, cada uno con su propio `state` e imágenes.
- **Integraciones de IA (clientes del backend)** — tres flujos que llaman a `/api/redactar` (ver §4):
  - `bindImportar()` → `accion:"perfil"` (autollenado de la recopilación).
  - `bindTablaIA()` → `accion:"tabla"` (estructurar tablas técnicas).
  - `bindProgramas()` → `accion:"programa"` (N programas de ordenamiento, §3.4 de este documento aplica también aquí).
  - `bindIA()` → sin `accion` explícita, usa el `seccion` correspondiente (ver Documento 4) para redactar prosa técnica en las secciones abiertas.
- **Motor de ensamblado del documento** — `buildBlocks()` llama a `documento.js` (§3.5) con el contexto actual (`state`, catálogos, helpers), y `renderBlocks()`/`renderLiveDoc()` pintan el resultado en el panel de vista previa (modo Borrador/Limpio).
- **Exportación** — `exportWord(modo)` arma un documento **HTML con estilos de impresión** (`wordStyles()`) y lo descarga con `Content-Type: application/msword`; Word lo abre nativamente (no es un `.docx`/OOXML real, es HTML que Word interpreta). La exportación a PDF usa el diálogo de impresión nativo del navegador sobre esa misma vista.

## 3.5 `documento.js` — machote del IP (motor de ensamblado, puro)

Expone `window.IPDOC.build(ctx)`, una función pura que recibe el contexto (`state`, catálogos, helpers de formato) y devuelve un arreglo de **bloques** (`{t:"h"|"p"|"table"|"fig"|"cover"|"toc", k:"static"|"auto"|"instr", ...}`). No toca el DOM directamente — separa "qué dice el documento" (`documento.js`) de "cómo se pinta en pantalla o se exporta" (`app.js`).

Helpers internos relevantes para quien vaya a extender una sección:

| Helper | Uso |
|---|---|
| `H(nivel, texto)` | Encabezado (nivel 1 = "I.", nivel 3 = "I.1", etc.) |
| `P(texto)` | Párrafo de contenido **nuevo** (se resalta en modo Borrador) |
| `I(texto)` | Instrucción/nota pendiente (se resalta siempre, en ámbar) |
| `TBL({title, head, rows, k})` | Tabla; `k` determina si se pinta como "auto" (llena) o "scaffold" (vacía, por llenar) |
| `FIGAREA(id)` | Inserta el(los) hueco(s) de imagen registrados para esa área en `data.js AREAS` |
| `tFilled/tRows/tK` | Helpers para las tablas alimentadas por `state.tablas[key]` (las "tablaIA") |
| `IAP(key)` | Inserta como párrafos el texto generado por IA guardado en `state[key]` |

El documento sigue el orden exacto: Portada → Índice → Glosario → Introducción → I → II (incluye el bucle de **N programas de ordenamiento**, uno por cada entrada en `state.programas`) → III → IV (Abandono) → V (Conclusión) → VI (Anexos) → Referencias.

**Para agregar una subsección nueva:** se agrega la llamada `H()`/`P()`/`TBL()` correspondiente en el punto exacto de `build()` donde debe aparecer; si necesita datos nuevos del usuario, esos campos se agregan primero en `SECTIONS` (`app.js`) y, si tienen que renderizarse en el Word/PDF, se leen aquí vía `g("id_del_campo")`.

# 4. Backend: `api/redactar.js` (función serverless)

Única pieza de backend del sistema. Se despliega como función serverless de Vercel (`module.exports = async (req, res) => {...}`), invocada por el cliente vía `POST /api/redactar`. Su razón de ser es que la `ANTHROPIC_API_KEY` **nunca puede vivir en el navegador** (se filtraría a cualquier visitante); esta función la lee de una variable de entorno del servidor y hace la llamada a Claude en nombre del cliente.

Cuatro modos, seleccionados por el campo `accion` del body (o su ausencia):

| `accion` | Función interna | Qué hace |
|---|---|---|
| *(vacío)* — trae `seccion` | `redactarSeccion()` | Redacta la prosa técnica de una de las 10 secciones abiertas del IP (ver Documento 4) |
| `"perfil"` | `extraerPerfil()` | Lee la recopilación (texto/Sheet/imagen) y devuelve `{ campos: {...} }` para autollenar el cuestionario |
| `"tabla"` | `estructurarTabla()` | Convierte datos pegados/imagen en filas para una o más `tablaIA` |
| `"programa"` | `extraerPrograma()` | Lee el Sheet de UN programa de ordenamiento y devuelve `{ campos, incisos }` |

Detalles de gobierno del contenido generado (reglas del `SYSTEM` prompt, límites de tokens, limpieza defensiva de markdown) están documentados en el **Documento 4 — Registro de Prompts**, ya que son la pieza más sensible a auditoría de calidad.

`fetchSheetCSV(url)` es el único punto donde el sistema sale a buscar datos de terceros: toma un link de Google Sheets, extrae el ID con una expresión regular y descarga `.../export?format=csv` — funciona porque el Sheet debe ser público o compartido con "cualquiera con el link"; no hay autenticación OAuth ni cuenta de servicio.

# 5. Despliegue

- **Plataforma:** Vercel. `vercel.json` declara un sitio 100% estático (`"framework": null`, sin `buildCommand` real) más la función `api/redactar.js` que Vercel detecta automáticamente por convención de carpeta (`api/`).
- **Variable de entorno requerida en producción:** `ANTHROPIC_API_KEY` (Vercel → Settings → Environment Variables). Sin ella, todo el cuestionario y la exportación Word/PDF funcionan igual; solo fallan los botones de IA.
- **Sin base de datos, sin autenticación de usuarios.** El "proyecto" vive enteramente en el navegador de quien lo llena; para compartir un proyecto entre dos personas se usa **Guardar JSON** → enviar el archivo → **Cargar JSON** en el otro equipo.
- **Sin proceso de build.** Cualquier cambio a `app.js`/`data.js`/`documento.js`/`index.html` se refleja con solo recargar la página; no hay paso de compilación ni dependencias de Node que instalar para desarrollar.

# 6. Cómo diagnosticar problemas comunes

| Síntoma | Causa probable | Dónde mirar |
|---|---|---|
| Los botones de IA no responden / error 500 | `ANTHROPIC_API_KEY` no configurada o inválida en Vercel | Logs de la función en el dashboard de Vercel; `api/redactar.js` línea `apiKey = process.env.ANTHROPIC_API_KEY` |
| "Autollenar" no encuentra nada de un Sheet | El Sheet no es público, o el link no contiene un ID de Sheets reconocible | `fetchSheetCSV()` en `api/redactar.js` (regex de extracción de ID) |
| Un campo nuevo no aparece en el Word exportado | Falta agregar el `H()/P()`/`TBL()` correspondiente en `documento.js` — el campo puede existir en `state` pero el machote no lo está leyendo | `documento.js`, buscar la sección por su número (p. ej. "I.1.4") |
| Las imágenes desaparecen al cambiar de equipo | Las imágenes viven en `IndexedDB`, que es local al navegador/equipo — no viajan solas con el JSON exportado salvo que el JSON incluya el volcado de imágenes | `idbAll()`/`Guardar JSON` en `app.js` |
| El progreso (punto de color) no refleja lo capturado | El tipo de campo nuevo no está contemplado en `seccionStatus()` | `app.js`, función `seccionStatus()` |

# 7. Herramienta de soporte: mapa de conocimiento del código

Este repositorio tiene instalado **graphify**, una herramienta que construye un grafo navegable de todas las funciones, módulos y sus relaciones (`graphify-out/graph.json` y `graphify-out/graph.html`, abrible en cualquier navegador). Un desarrollador externo puede usarlo para orientarse rápido sin depender de que alguien del equipo le explique la arquitectura de viva voz:

```
graphify query "cómo se genera el Word"
graphify explain "documento.js"
graphify path "app.js" "api/redactar.js"
```

`graphify-out/GRAPH_REPORT.md` trae además la lista de "nodos más conectados" (las funciones de las que depende todo lo demás) — un buen punto de partida para quien llegue nuevo al proyecto.
