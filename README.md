# Gasolineras Kenzly — Automatización del Informe Preventivo (IP) ASEA

Aplicación local que **automatiza las respuestas cerradas y redactadas-pero-cerradas (boilerplate)** del **Informe Preventivo (IP) de Impacto Ambiental para el Sector Hidrocarburos (ASEA/SEMARNAT)** — el documento que un consultor ambiental elabora repetidamente para cada estación de servicio (gasolinera).

Funciona con **doble clic** (un archivo HTML + JS), **sin instalación ni internet**, y genera el documento en **dos vistas** descargables a **Word (.doc)**:

- **📝 Borrador** — el texto nuevo (boilerplate + datos capturados) va **resaltado**, y las áreas pendientes (instrucciones ✎, tablas por llenar y recuadros de imagen) en ámbar.
- **📄 Documento limpio** — solo quedan resaltadas las áreas pendientes por realizar.

## Cómo usar

1. Abre `index.html` con doble clic (Chrome, Edge o Safari) **o entra a la versión web** (ver abajo).
2. Responde el cuestionario (mismos capítulos del IP: I → V). Cada campo está etiquetado:
   - 🔵 **Cerrada** — dato del proyecto (se teclea una vez y se propaga a todo el documento).
   - 🟢 **Redactada-cerrada** — boilerplate; sólo eliges/ajustas (p. ej. la disposición de cada estrategia POEGT).
   - 🟠 **Abierta ✎** — requiere redacción/mapas/matrices manuales; se conserva la guía del formato.
3. Al elegir el **Estado** se autocargan el **Plan Estatal** y los **criterios UGA** (incluidos **Jalisco** e **Hidalgo**).
4. **Ver documento** → conmuta entre Borrador y Documento limpio.
5. **Descarga Word** (borrador/limpio), imprime a **PDF**, o **Guarda/Carga JSON** para reutilizar las respuestas.

> Los datos sensibles (RFC, CURP) **nunca salen del equipo**: todo es local (localStorage + archivos).

## Estructura

```
.
├── index.html                       ← la app (ábrela con doble clic o en la web)
├── data.js                          ← catálogos + boilerplate (estrategias POEGT, criterios UGA, instrumentos)
├── documento.js                     ← machote completo del IP en bloques etiquetados
├── app.js                           ← cuestionario, render de 2 vistas y exportación Word/PDF
├── README.md
├── LEEME.md                         ← guía detallada de uso
├── docs/
│   ├── 01_Flujo_de_Automatizacion.md   ← flujo de automatización
│   └── 02_Mapeo_de_Proceso.md          ← mapeo de proceso (BPMN + KPIs)
└── ejemplo_salida/                  ← documentos .doc de ejemplo (Jalisco e Hidalgo)
```

## Cobertura actual (v1.1)

- Secciones **I, II y III** con fidelidad total a la plantilla: todos los campos, ~39 tablas y **recuadros de imagen** (figuras/mapas/fotos) en cada hueco.
- Boilerplate nacional: Introducción, POEGT + 44 estrategias, PND, MEC, metodología de impacto (Leopold + Gómez-Orea + índices), conclusión.
- Catálogos estatales completos: **Jalisco** e **Hidalgo**.
- Capítulos **IV y V** en versión resumida (desarrollo completo previsto para la siguiente versión).

---

Hecho con 🌿 por Verde Raíz.
