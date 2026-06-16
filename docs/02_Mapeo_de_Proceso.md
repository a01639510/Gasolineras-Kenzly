# Mapeo de Proceso — Elaboración Automatizada del Informe Preventivo (IP)

**Notación:** BPMN simplificado (carriles por rol + compuertas de decisión).
**Ámbito:** del encargo del cliente a la entrega del IP listo para ASEA, destacando dónde actúa la automatización (cuestionario) y dónde persiste el trabajo manual.

---

## 1. Roles (carriles)

| Carril | Responsable | Interviene en |
|---|---|---|
| **Cliente / Promovente** | Dueño de la estación de servicio | Entrega documentos, firma |
| **Consultor ambiental** | Verde Raíz (analista) | Captura el cuestionario, redacta abiertas |
| **App / Cuestionario IP** | Sistema (automatización) | Cerradas + boilerplate, ensamblado, exportación |
| **Responsable técnico** | Ing. en Desarrollo Sustentable | Revisa y firma |
| **ASEA** | Autoridad | Evalúa y resuelve |

---

## 2. Diagrama de proceso (flujo principal)

```
CLIENTE/PROMOVENTE        CONSULTOR              APP / CUESTIONARIO IP            RESP. TÉCNICO        ASEA
──────────────────   ──────────────────   ────────────────────────────────   ──────────────   ──────────────
( ● Inicio )
   │
   ▼
[1 Entrega expediente]
  acta constitutiva,
  permiso CRE, planos,
  memoria técnica, RFC/CURP
   │
   └──────────────▶ [2 Revisa expediente
                       y abre la App]
                          │
                          ▼
                     ┌───────────────────────────────────────┐
                     │ 3 FASE 1 · CAPTURA (cuestionario)       │
                     │  Carril APP procesa en paralelo:        │
                     │  ▸ Datos cerrados (I, III.1, III.2)     │
                     │  ▸ Toggles boilerplate (II, III.5, IV)  │
                     └───────────────────────────────────────┘
                          │
                          ▼
                   ◇ 4 ¿Estado/Municipio
                       en catálogo? ──No──▶ [4a Alta de
                          │                   bloque estatal/UGA]
                          Sí                        │
                          ▼◀───────────────────────┘
                                            [5 Autocarga Plan Estatal,
                                             UGA y criterios] (APP)
                                                   │
                                                   ▼
                                            [6 Interpola variables +
                                             resuelve Aplica/No-aplica] (APP)
                                                   │
                                                   ▼
                                            [7 Ensambla documento:
                                             portada, índice, I–V,
                                             tablas y numeración] (APP)
                                                   │
                          ┌────────────────────────┘
                          ▼
                   ◇ 8 ¿Quedan secciones
                       ABIERTAS (✎)?
                       │
            ┌──Sí──────┘
            ▼
   [9 Redacta abiertas:
    III.1.2-7, III.3, III.4,
    Leopold III.5.3-8, III.6]
    (mapas, matrices, fotos)
            │
            └──No / ya hechas──▶ [10 Vista previa fiel] (APP)
                                       │
                                       ▼
                                 [11 Exporta Word/.doc
                                  + PDF + JSON] (APP)
                                       │
                                       └──────────────▶ [12 Revisión
                                                          técnica/QA]
                                                              │
                                                       ◇ 13 ¿Conforme?
                                                          │
                                              ┌───No──────┘
                                              ▼
                                    [13a Ajustes en cuestionario
                                     o en abiertas] ──▶ (vuelve a 10)
                                              │
                                              Sí
                                              ▼
                                        [14 Firma promovente
                                         y responsable técnico]
                          ◀───────────────────┘
   [15 Firma]                                                       
   promovente                                                       
        │                                                           
        └───────────────────────────────────────────────▶ [16 Ingreso a ASEA]
                                                                              │
                                                                              ▼
                                                                       ◇ 17 ¿Requiere
                                                                          info adicional?
                                                                          │
                                                                ┌──Sí─────┘
                                                                ▼
                                                       [17a Atiende
                                                        requerimiento]
                                                        (reusa JSON) ──▶ (10)
                                                                │
                                                                No
                                                                ▼
                                                         ( ◉ Resolución )
```

---

## 3. Subproceso de la App (detalle de la "caja negra" de automatización)

```
        ENTRADA: respuestas del cuestionario (cerradas + toggles)
                              │
        ┌─────────────────────┼─────────────────────────┐
        ▼                     ▼                          ▼
  [A. Validación]      [B. Resolución boilerplate]  [C. Catálogos]
  campos obligatorios   • interpola {{proyecto}},     • sustancias CRETIB/CAS
  formato RFC/CURP,       {{municipio}}, {{estado}},  • Responsable IP (fijo)
  coordenadas, montos     {{UAB}}, {{UGA}}…           • boilerplate nacional
        │                • Aplica→párrafo estándar    • bloques por estado
        │                • No aplica→N/A justificado          │
        └─────────────────────┼──────────────────────────────┘
                              ▼
                    [D. Motor de ensamblado]
            portada → índice → I → II → III → IV → V → Referencias
            conserva: numeración jerárquica, tablas, estilos
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        [E. Vista previa] [F. Word .doc] [G. JSON + PDF]
```

---

## 4. Puntos de decisión (compuertas) y reglas

| # | Decisión | Sí | No |
|---|---|---|---|
| 4 | ¿Estado/Municipio en catálogo? | autocarga bloque estatal | alta manual del bloque (queda guardado) |
| 8 | ¿Quedan secciones abiertas? | el consultor las redacta | salta a vista previa |
| 13 | ¿Revisión conforme? | firma | regresa a ajuste (cuestionario o abiertas) |
| 17 | ¿ASEA pide info adicional? | se atiende reusando el JSON | resolución |

---

## 5. Métricas del proceso (KPIs)

| Indicador | Antes (manual) | Con automatización |
|---|---|---|
| Tiempo de armado cerrado + boilerplate | 3–5 días | < 1 hora |
| Errores de arrastre (datos del proyecto previo) | frecuentes | 0 (propagación única) |
| Consistencia de numeración/formato | variable | garantizada por el motor |
| Reuso para requerimientos ASEA | rehacer | recargar JSON |
| % del documento cubierto sin redactar | ~0 % | ~65 % (cerrado + boilerplate) |

---

## 6. Mapa de cobertura por capítulo del IP

| Capítulo IP | Cerrada | Boilerplate | Abierta | Cobertura app |
|---|:--:|:--:|:--:|:--:|
| Portada / Introducción | ✓ | ✓ | — | **100%** |
| I. Datos generales | ✓ | ✓ (resp. técnico) | — | **100%** |
| II. Fundamento jurídico | ✓ | ✓ (POEGT, PND, estatal, UGA) | parcial (selección NOM) | **~90%** |
| III.1 Descripción técnica | ✓ (datos grales) | — | ✓ (memorias) | ~30% |
| III.2 Sustancias | ✓ (CRETIB/CAS) | — | — | **100%** |
| III.3 Emisiones/residuos | — | — | ✓ | guía ✎ |
| III.4 Diagnóstico ambiental | — | ✓ (MEC) | ✓ (mapas, biota) | ~25% |
| III.5 Impactos | — | ✓ (metodología, escalas) | ✓ (Leopold, matriz) | ~40% |
| III.6 Medidas | — | parcial | ✓ | guía ✎ |
| IV. Abandono | ✓ (variables) | ✓ (párrafos) | parcial (tablas) | **~80%** |
| V. Conclusión | — | ✓ | — | **100%** |

> **Lectura del mapa:** la app se concentra donde el retorno es máximo (capítulos I, II, III.2, IV, V + boilerplate de III.4/III.5). Lo abierto se conserva con su instrucción ✎ para que el consultor lo complete sin perder el hilo del documento.
