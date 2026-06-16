# Flujo de Automatización — Informe Preventivo (IP) Sector Hidrocarburos / ASEA

**Proyecto:** Verde Raíz · Automatización de Informes Preventivos (Estaciones de Servicio / Gasolineras)
**Fecha:** 12 junio 2026
**Alcance de esta fase:** Automatizar **todas las respuestas cerradas** y las **respuestas redactadas pero cerradas (boilerplate)** del IP, entregadas como **cuestionario** que conserva la estructura, formato y diseño del documento oficial.

---

## 1. Contexto y problema

Un **Informe Preventivo (IP)** del sector hidrocarburos (ASEA/SEMARNAT) es un documento de **130–150 páginas** que un consultor ambiental elabora repetidamente para cada estación de servicio. El análisis de las plantillas (`Formato IP Sector Hidrocarburos.docx`, `_IP DAMARIS.docx`) y del ejemplo real (`E-09IPA01990121-DGGC` — *Sonia y Hermanos S.A. de C.V.*, 143 páginas) revela que el documento se compone de tres naturalezas de contenido:

| Tipo de respuesta | % aprox. del documento | Esfuerzo manual hoy | Automatizable |
|---|---|---|---|
| **Cerrada** (dato fijo / opción) | ~20 % | Re-tecleo de datos del proyecto | **100 %** |
| **Redactada pero cerrada** (boilerplate reutilizable) | ~45 % | Copia/pega de IP anteriores + retoques | **100 %** |
| **Abierta** (juicio técnico, mapas, matrices) | ~35 % | Redacción y análisis originales | Asistida (fuera de esta fase) |

> **Hallazgo clave:** ~65 % del IP es **cerrado o boilerplate**. Hoy se rehace a mano (copiar de un IP previo, buscar/reemplazar nombre, estado, municipio, UGA…), lo que genera **errores de arrastre** (datos del proyecto anterior que se quedan) y consume días de trabajo. Esto es exactamente lo que el cuestionario elimina.

---

## 2. Clasificación de respuestas (insumo maestro de la automatización)

### 2.1 Respuestas **CERRADAS** (campos de dato puro)

Se capturan una sola vez y se propagan a todo el documento (portada, encabezados, tablas, cuerpo).

- **Portada / metadatos:** nombre del proyecto, razón social, fecha, logo.
- **I.1 Datos del proyecto:** ubicación (calle, colonia, municipio, entidad, C.P.), coordenadas UTM (zona, datum, puntos de inflexión X/Y), superficie (m²), inversión ($MXN), empleos (directos/indirectos), duración por etapa.
- **I.2 Promovente:** razón social, RFC, representante legal, RFC y CURP del representante, domicilio de notificaciones, tel., correo.
- **I.3 Responsable del IP:** datos **fijos de la consultora** (nombre, profesión, cédula, RFC, CURP, contacto) → *valores por defecto pre-cargados*.
- **III.1 Datos generales:** clave catastral, responsable de obra, permiso CRE, número de registro ASEA.
- **III.2 Sustancias peligrosas:** gasolina regular / premium / diésel con **CRETIB, No. CAS, estado físico, categoría** → *catálogo con valores estándar pre-cargados* (sólo se ajusta capacidad/proveedor).
- **Capacidades de tanques, número de dispensarios/posiciones de carga.**

### 2.2 Respuestas **REDACTADAS PERO CERRADAS** (boilerplate)

Texto ya redactado que se reutiliza íntegro o con **interpolación de pocas variables**. Es el mayor ahorro.

| Sección | Naturaleza | Variables que cambian |
|---|---|---|
| **Introducción** | Párrafo fijo | nombre proyecto, municipio, estado |
| **II.2.1 POEGT** | Texto nacional fijo + tabla | UAB #, clave política, ordenamiento regional, región ecológica + nombre |
| **II.2.1 — 44 estrategias POEGT** | Catálogo de respuestas estándar por estrategia | toggle *Aplica directamente / indirectamente / No aplica* → inserta el párrafo estándar correspondiente |
| **II.2.2 Plan Nacional de Desarrollo** | Texto fijo (PND 2025-2030) | — |
| **II.2.3 Plan Estatal** | Boilerplate por estado | estado, nombre del plan, UGA estatal, criterios |
| **II.2.3 / II.2.4 — criterios UGA** | Catálogo de respuestas estándar por criterio (Ag, Ah, Mi, In, If, An, Tu) | toggle *Aplica/No aplica* → párrafo estándar |
| **II.3 Parque industrial** | Frase fija | toggle (predio independiente / sí aplica) |
| **III.4.6 Principios del MEC** | Texto académico fijo (Modelo Ecológico Conceptual) | — |
| **III.5.1 Metodología de evaluación** | Texto fijo (Leopold 1971 + Gómez-Orea 1999 + índices III/IB/IC/ISIG) + tablas de criterios/escalas | nombre del proyecto |
| **III.5 — tablas de criterios y escalas (0-5), semáforo ISIG** | Tablas fijas | — |
| **IV. Abandono del sitio (IV.1–IV.8)** | Párrafos plantilla con `[variables]` | componentes, domicilio, gatillos, plazos |
| **V. Conclusión** | Párrafo fijo | — |
| **Referencias** | Lista fija (USGS, UNEP, POET) | + fuentes estatales |

### 2.3 Respuestas **ABIERTAS** (fuera de esta fase — se conservan como guía ✎)

Descripciones técnicas (III.1.2–III.1.7), emisiones/descargas (III.3), diagnóstico ambiental con mapas y listados de flora/fauna (III.4), matriz de Leopold y descripción de impactos (III.5.3–III.5.8), medidas de mitigación (III.6). En el cuestionario se muestran las instrucciones ✎ originales + un área de texto libre opcional, para que el consultor las complete manualmente.

---

## 3. Flujo de automatización (extremo a extremo)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ FASE 0 — CARGA DE CATÁLOGOS (una sola vez / mantenimiento)                  │
│  • Datos fijos de la consultora (Responsable del IP)                        │
│  • Catálogo de sustancias (CRETIB/CAS gasolina, premium, diésel)            │
│  • Boilerplate nacional (Intro, POEGT, PND, MEC, Metodología, Conclusión)   │
│  • Catálogo de estrategias POEGT (44) y criterios UGA con texto estándar    │
│  • Catálogos por estado (Plan Estatal, POET/UGA)                            │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ FASE 1 — CUESTIONARIO (captura del proyecto)                                │
│  El consultor responde sólo lo CERRADO y marca toggles del BOILERPLATE.    │
│  Secciones del cuestionario = secciones exactas del IP (I → V).            │
│  ▸ Datos del proyecto (I)                                                   │
│  ▸ Fundamento jurídico: selección de instrumentos + toggles estrategias    │
│  ▸ Estado/Municipio → carga automática de Plan Estatal y UGA               │
│  ▸ Sustancias y datos técnicos cerrados (III.1, III.2)                     │
│  ▸ Variables de Abandono (IV)                                              │
│  Persistencia automática en el navegador (localStorage).                   │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ FASE 2 — MOTOR DE ENSAMBLADO                                                │
│  • Interpola variables {{...}} en cada plantilla de boilerplate            │
│  • Resuelve toggles Aplica/No-aplica → inserta el párrafo estándar         │
│  • Propaga datos cerrados a portada, encabezados y tablas                  │
│  • Conserva jerarquía de numeración (I, I.1, I.1.1, A, B, C…) y tablas     │
│  • Marca con ✎ las secciones ABIERTAS pendientes (vista de avance)         │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ FASE 3 — SALIDA                                                            │
│  • Vista previa fiel (portada + índice + cuerpo con formato del IP)        │
│  • Exportar a Word (.doc) conservando estructura, formato y diseño         │
│  • Exportar / Imprimir a PDF                                               │
│  • Guardar/cargar respuestas del proyecto (JSON) para reutilizar          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Reglas de negocio automatizadas

1. **Propagación única de identidad.** El *nombre del proyecto*, *razón social*, *municipio* y *estado* se capturan una vez y aparecen consistentes en portada, encabezados de página, Introducción, II.2.x, III.5.1 y Conclusión. → Elimina el error de arrastre.
2. **N/A justificado.** Toda estrategia/criterio/NOM marcado como *No aplica* inserta automáticamente la justificación estándar de una oración (regla heredada del propio formato: «si no aplica, pon "N/A" y justifica»).
3. **Sustancias estándar.** Al elegir "gasolina/diésel", se rellenan CRETIB, CAS, estado físico y categoría desde el catálogo; el consultor sólo ajusta capacidad y proveedor.
4. **Carga estatal automática.** Al seleccionar el estado, se precarga el bloque del Plan Estatal de Desarrollo y la estructura de UGA aplicable.
5. **Conservación de tablas y numeración.** El motor reproduce las tablas (localización, Gantt, criterios 0-5, semáforo ISIG, balances) y la numeración jerárquica idéntica a la plantilla.
6. **Secciones abiertas explícitas.** Lo no automatizable se marca visualmente como **PENDIENTE (✎)** con su instrucción original, para que nada se omita en la revisión.

---

## 5. Beneficios esperados

- **Tiempo:** de ~3–5 días de armado boilerplate a **< 1 hora** de captura.
- **Calidad:** cero datos arrastrados del proyecto anterior; numeración y formato consistentes.
- **Trazabilidad:** cada respuesta cerrada/boilerplate proviene de un catálogo versionado.
- **Reutilización:** el JSON del proyecto sirve de base para ampliaciones o proyectos similares.

---

## 6. Stack elegido (y por qué)

**App local de un solo archivo (`index.html`), sin instalación ni internet.**

- **Por qué local:** los datos del promovente (RFC, CURP, domicilios) son sensibles; no deben salir del equipo. Una app local cumple privacidad por diseño.
- **Por qué un solo archivo:** se abre con doble clic en cualquier equipo (consultor en campo, sin Node/Python). Cero dependencias.
- **Salida Word/PDF:** exporta `.doc` compatible con Microsoft Word (conserva encabezados, tablas y diseño) e imprime a PDF. Así se mantiene la **estructura, formato y diseño exactos** que pide el encargo.
- **Persistencia:** `localStorage` + exportar/importar JSON.

> Ver el **Mapeo de Proceso** (`02_Mapeo_de_Proceso.md`) para el detalle del flujo por roles y puntos de decisión, y la app en `app/index.html`.
