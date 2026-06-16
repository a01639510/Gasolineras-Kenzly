# Automatización del Informe Preventivo (IP) — Verde Raíz

Automatiza **todas las respuestas cerradas** y las **redactadas pero cerradas (boilerplate)** del Informe Preventivo del sector hidrocarburos (ASEA), entregadas como **cuestionario** que conserva la estructura, formato y diseño del documento oficial.

## Contenido de la carpeta

```
Automatizacion_IP/
├── LEEME.md                         ← este archivo
├── docs/
│   ├── 01_Flujo_de_Automatizacion.md   ← flujo de automatización extenso
│   └── 02_Mapeo_de_Proceso.md          ← mapeo de proceso (BPMN + KPIs)
└── app/                             ← APP LOCAL (el cuestionario)
    ├── index.html                      ← ábrela con doble clic
    ├── data.js                         ← catálogos + boilerplate
    └── app.js                          ← lógica + motor de ensamblado
```

## Cómo usar la app

1. **Abre** `app/index.html` con doble clic (Chrome, Edge o Safari). No necesita internet ni instalación.
2. **Responde el cuestionario.** Está dividido en los mismos capítulos del IP (I → V). Cada campo tiene una etiqueta de color:
   - 🔵 **Cerrada** — dato del proyecto (se teclea una vez y se propaga a todo el documento).
   - 🟢 **Redactada-cerrada** — texto boilerplate; sólo eliges/ajustas (p. ej. la disposición de cada estrategia POEGT). Abre *"Ver texto que se generará"* para revisarlo.
   - 🟠 **Abierta ✎** — requiere redacción/mapas/matrices manuales; se conserva la guía del formato.
3. Al elegir el **Estado**, se autocarga el bloque del **Plan Estatal** y los **criterios UGA** correspondientes. Estados con catálogo completo: **Jalisco** (POET estatal + 25 criterios UGA) y **Hidalgo** (POET estatal/Regional Tula-Tepeji + criterios de Industria y Equipamiento e Infraestructura; precarga la UGA XXVIII_Ag). Los demás estados se redactan o se agregan al catálogo en `data.js`.
4. **Ver documento** (botón 👁): se genera el **machote completo** (~50–60 páginas de estructura: portada, índice, glosario, capítulos I–VI, ~27 tablas, Gantt de 24 meses, firmas y referencias) con dos vistas conmutables arriba:
   - **📝 Borrador** — el **texto nuevo** (boilerplate + datos capturados) va **resaltado en amarillo**, y las **áreas pendientes** (instrucciones ✎ y tablas por llenar) en **ámbar**. Sirve para revisar de un vistazo qué generó la automatización y qué falta.
   - **📄 Documento limpio** — el texto nuevo va **sin resaltar** (como documento final); sólo quedan resaltadas en ámbar las **instrucciones/áreas que faltan por realizar**.
5. **Descargas DOCX** (se abren en Microsoft Word, conservan estructura, tablas y diseño):
   - **⬇ Word borrador** → `IP_<proyecto>_BORRADOR.doc` (texto nuevo resaltado + pendientes).
   - **⬇ Word limpio** → `IP_<proyecto>_LIMPIO.doc` (sólo instrucciones resaltadas).
   - También **🖨 PDF** desde el navegador.
6. **Guardar / Cargar JSON**: respalda las respuestas del proyecto y reúsalas (p. ej. para atender un requerimiento de ASEA o un proyecto similar).

> El documento exportado tiene **sólo texto y tablas**; un IP terminado con imágenes, mapas y matrices ronda las 180 páginas, por lo que este borrador es más corto pero conserva toda la extensión y estructura del machote.
>
> Tus respuestas se guardan automáticamente en el navegador (localStorage). Los datos sensibles (RFC, CURP) **nunca salen del equipo**.

## Qué se automatiza (cobertura)

| Capítulo | Cobertura automática |
|---|---|
| Portada · Introducción · I (datos generales) | **100%** |
| II. Fundamento jurídico (POEGT, 44 estrategias, PND, Plan Estatal, UGA) | **~90%** |
| III.2 Sustancias (CRETIB/CAS estándar) · III.4.6 MEC · III.5.1 Metodología | **100% del boilerplate** |
| IV. Abandono · V. Conclusión | **80–100%** |
| III.1.2–7, III.3, III.4 (mapas/biota), III.5 (Leopold), III.6 | guía ✎ (manual) |

Personaliza los datos fijos de la consultora y el catálogo de estados/instrumentos editando `app/data.js`.
