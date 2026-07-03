% Registro de Prompts — App IP ASEA (Verde Raíz)
% Verde Raíz
% Julio 2026

# 1. Propósito

Registro completo, para trazabilidad y auditoría de calidad, de **todos los prompts** con los que el sistema instruye al modelo de IA (Claude, de Anthropic, modelo `claude-sonnet-4-6` a la fecha de este documento) para redactar o extraer contenido del Informe Preventivo. Vive en un único archivo del backend: `api/redactar.js`.

Todo el contenido citado aquí es el texto **literal** usado en producción al momento de escribir este documento. Si se modifica `api/redactar.js`, este documento debe actualizarse en la misma revisión para que siga siendo confiable como registro de auditoría.

# 2. Reglas absolutas (prompt de sistema global — `SYSTEM`)

Aplican a las **10 secciones narrativas** (tabla en §4). Se envían como bloque `system` de la API, no como parte del mensaje del usuario — esto les da mayor peso frente al modelo que una instrucción dentro del prompt.

> Eres un consultor ambiental senior especializado en Informes Preventivos (IP) para la Agencia de Seguridad, Energía y Ambiente (ASEA) de México, sector hidrocarburos.
>
> REGLAS ABSOLUTAS — incumplirlas invalida el texto:
> Escribe exclusivamente en español técnico formal.
> No inventes datos ni cifras; si un dato no se proporcionó, escribe [Dato pendiente: descripción breve].
> El texto debe poder insertarse directamente en el IP sin edición de formato posterior.
> PROHIBIDO TODO MARKDOWN: no uses almohadillas (#), asteriscos (*), guiones bajos (_), negritas (**texto**), cursivas (*texto*), viñetas (- o •) ni tablas markdown.
> PROHIBIDOS los encabezados implícitos: no comiences párrafo con el nombre de una subsección, una letra seguida de paréntesis (A), B)) ni un número seguido de punto (1., 2.).
> Entrega ÚNICAMENTE prosa de informe en párrafos separados por una línea en blanco.
> No incluyas títulos de sección, subtítulos ni ningún tipo de cabecera.
> Cita las normas con su clave completa y, cuando proceda, su año de publicación en DOF.
> Longitud y profundidad: ajústate al objetivo indicado; ni más breve ni más extenso.

## 2.1 Limpieza defensiva post-generación

El modelo puede incumplir el formato a pesar del `SYSTEM` prompt. Por eso, **todo** texto generado pasa por `limpiarMarkdown()` antes de llegar al usuario, que quita de forma determinista (con expresiones regulares, no con otra llamada a IA): encabezados `#`/`##`, negritas/cursivas `**`/`*`/`__`/`_`, viñetas sueltas, listas numeradas al inicio de línea, separadores horizontales `---`/`___`/`===`, código inline y bloques de código, y colapsa saltos de línea excesivos. Este paso es puramente mecánico (sin costo de IA) y actúa como red de seguridad, no como sustituto de las reglas del `SYSTEM`.

## 2.2 Contexto común anteponerse a cada prompt (`ctx()` / `extra()`)

Cada uno de los 10 prompts narrativos empieza con el mismo bloque de identificación del proyecto, generado por la función `ctx(d)`:

> Proyecto: `{nombre_proyecto}`. Ubicación: `{municipio, estado}`. Superficie del predio: `{superficie}`. Giro: estación de servicio (gasolinera, sector hidrocarburos), `{zona urbana consolidada, fuera de ANP y sitio RAMSAR | DENTRO de ANP o sitio RAMSAR}`.

Si el proyecto trae `notas` capturadas, se agrega al final del prompt (función `extra(d)`):

> Datos adicionales del proyecto (úsalos; no inventes más): `{notas}`

# 3. Instrucciones de longitud y fuente por sección (`META`)

Cada sección define, además del prompt narrativo, cuánto debe extenderse el texto y de qué fuente de datos debería salir en teoría (esto es instructivo para el modelo, no una validación automática de que esos datos realmente se hayan capturado):

| Sección | Fuente de datos esperada | Longitud objetivo | Formato |
|---|---|---|---|
| `descripcion_tecnica` | Memoria técnica del proyecto, planos y P&ID | 4–6 párrafos (≈1–1.5 cuartillas) | Prosa técnica continua; narra el proceso operativo, sin repetir en tablas |
| `emisiones_residuos` | HDSM, NOMs aplicables, memoria técnica | Un párrafo por etapa (4 etapas) | Prosa por etapa; cuantifica cuando haya dato; vincula cada residuo con su NOM |
| `flora_fauna` | CONABIO-Enciclovida, SNIB, iNaturalist, SIGEIA | 3–4 párrafos | Prosa; separa el predio del área de influencia |
| `impactos` | Matriz de Leopold adaptada, índices ISIG de Gómez-Orea | 4–8 párrafos (III.5.7) + 1–2 (III.5.8) | Prosa; prioriza por significancia; acción-factor-receptor; concluye viabilidad |
| `medidas` | Impactos de III.5, catálogo de NOMs aplicables | Un párrafo por etapa + uno de PVA | Cada medida ligada a impacto, responsable, indicador y NOM |
| `vigilancia` | Impactos de III.5, tablas de medidas de III.6 | 2–3 párrafos | Acciones, indicadores verificables, frecuencias y responsables |
| `abandono` | Datos técnicos: tanques, volúmenes, vida útil estimada | 1–2 párrafos por apartado (IV.1–IV.8) | Procedimientos explícitos: desgasificación, LOTO, plazos de aviso |
| `sustentabilidad` | Compromisos voluntarios del promovente | 1–2 párrafos | Prosa declarativa; indicador de cumplimiento por compromiso |
| `diagnostico_ambiental` | Resultados de III.4.1–III.4.5 | 3–4 párrafos integradores | Cierra con juicio de sensibilidad global del AI |
| `conclusion` | Síntesis del IP completo (I–IV, tablas, compromisos) | 4–5 párrafos | Prosa integradora; tono declarativo ante ASEA |

`max_tokens` por llamada: 4096 para `impactos` y `medidas`; 3072 para `abandono` y `conclusion`; 2048 para el resto.

# 4. Los 10 prompts narrativos (íntegros)

## 4.1 `descripcion_tecnica` — III.1.2 a III.1.7

> Redacta los apartados III.1.2 a III.1.7 de la Descripción Técnica del Informe Preventivo en prosa técnica continua, abarcando en orden los siguientes temas sin encabezarlos: las actividades principales del ciclo operativo —recepción de combustibles desde autotanque, almacenamiento en tanques subterráneos, despacho mediante dispensadores y recuperación de vapores con el Sistema SRV de Fase I—; las dimensiones y distribución de áreas del predio; las características operativas de presiones y temperaturas de almacenamiento; el programa de trabajo con las etapas de preparación, construcción, operación y abandono; y los detalles técnicos de los equipos: tanques de almacenamiento de doble pared identificados como T-01, T-02 y T-03 con sus capacidades en litros, líneas y tuberías de succión y descarga, sistema SRV con eficiencia mínima del noventa y cinco por ciento conforme a NOM-004-ASEA-2017, y sistemas de control de seguridad (LOTO, trampa agua-aceite, sistema de tierras). Señala con [Dato pendiente: descripción] cada especificación que no se haya proporcionado.

## 4.2 `emisiones_residuos` — III.3

> Redacta el apartado III.3 —Emisiones, descargas y residuos— del Informe Preventivo en prosa técnica continua, recorriendo cronológicamente las etapas de preparación de sitio, construcción, operación y abandono. Para cada etapa, integra en el texto los siguientes aspectos sin separarlos en listas: las emisiones atmosféricas de COV y VOC generadas y su control mediante el SRV de Fase I con eficiencia mínima del noventa y cinco por ciento conforme a NOM-004-ASEA-2017; las descargas de aguas sanitarias a fosa séptica y de aguas aceitosas al separador agua-aceite; los residuos sólidos urbanos, residuos de manejo especial como filtros y trapos con referencia a NOM-001-ASEA-2019, residuos peligrosos como aceites lubricantes usados y solventes sujetos a NOM-052-SEMARNAT-2005 con manifiestos y gestor autorizado, y residuos de construcción; y las fuentes de ruido con el nivel estimado en dB(A) y el cumplimiento de NOM-081-SEMARNAT-1994. Señala con [Dato pendiente: descripción] donde falten cantidades específicas.

## 4.3 `flora_fauna` — III.4.3

> Redacta el apartado III.4.3 —Caracterización biótica del área de influencia— del Informe Preventivo en tres o cuatro párrafos de prosa continua. El primero describe la vegetación presente en el área —tipo fisonómico-florístico conforme a la clasificación de Rzedowski (1978), cobertura estimada y estado de conservación— y explica el grado de modificación antrópica del predio en relación con su entorno. El segundo caracteriza la fauna regional esperable —mamíferos, aves, anfibios y reptiles— con referencia a las bases CONABIO-Enciclovida, SNIB e iNaturalist, indicando el estatus de riesgo de cada grupo conforme a NOM-059-SEMARNAT-2010. El tercero presenta el diagnóstico del valor ambiental del predio: si hay o no especies en riesgo que dependan del sitio, si hay hábitat crítico o corredores, y la conclusión sobre la sensibilidad biótica del área de influencia.
>
> *(Si el proyecto trae `especies_resumen` capturado, se agrega: "Datos de campo disponibles (úsalos tal cual; no inventes más): {especies_resumen}"; si no, se agrega: "[Dato pendiente: listado de especies verificadas en campo o CONABIO para el municipio]".)*

## 4.4 `impactos` — III.5.7 y III.5.8

> Redacta la evaluación de impactos ambientales del Informe Preventivo —apartados III.5.7 y III.5.8— en prosa técnica continua. La metodología —Matriz de Leopold adaptada con veintinueve acciones y dieciocho factores, e índice de significancia ISIG de Gómez-Orea— ya está descrita en el documento; no la repitas. Desarrolla la descripción narrativa de los impactos de mayor significancia (altos y medios), tanto negativos como positivos, indicando para cada uno la acción generadora, el factor ambiental receptor y la cuantificación cuando se disponga de ella. Para una estación de servicio en zona urbana los impactos relevantes típicos incluyen: riesgo de infiltración de hidrocarburos al suelo y al acuífero durante carga y posibles fugas, emisiones de COV controladas por el SRV, ruido de equipos y tráfico vehicular adicional como negativos, y generación de empleo directo e indirecto y abasto energético local como positivos. Cierra con un párrafo de balance neto que sume los impactos positivos frente a los negativos residuales con medidas, y concluye la viabilidad ambiental del proyecto.
>
> *(Si el proyecto trae `matriz_resumen` capturado, se agrega literal; si no: "[Dato pendiente: resultados numéricos ISIG de la Matriz de Leopold/Gómez-Orea]".)*

## 4.5 `medidas` — III.6 y III.7

> Redacta las secciones III.6 y III.7 —Medidas de prevención, mitigación y compensación— del Informe Preventivo en prosa técnica continua, organizando el texto cronológicamente por etapa: construcción, operación y abandono. Para cada medida, intégrala en el párrafo de su etapa indicando el impacto que atiende, la descripción específica de la acción (evita generalidades como "minimizar residuos"), el puesto responsable de ejecutarla, el indicador verificable de cumplimiento y el fundamento normativo con la clave NOM completa. Al finalizar las tres etapas, desarrolla un párrafo descriptivo del Programa de Vigilancia Ambiental con las frecuencias de inspección interna, las verificaciones externas de la Unidad de Verificación ASEA, las pruebas periódicas del SRV, la medición de ruido y la auditoría de manifiestos de residuos peligrosos.

## 4.6 `vigilancia` — III.6.1

> Redacta el texto narrativo del Programa de Vigilancia Ambiental —apartado III.6.1— del Informe Preventivo en dos o tres párrafos de prosa continua. El primer párrafo describe el alcance del programa: las etapas que cubre, los componentes ambientales monitoreados (calidad del suelo, emisiones de COV, ruido, residuos peligrosos) y los impactos cuya evolución se vigila. El segundo describe las acciones de supervisión periódica: inspecciones internas mensuales, verificaciones externas semestrales con Unidad de Verificación acreditada ante ASEA, pruebas de hermeticidad anual de tanques y líneas, medición semestral de emisiones del SRV, auditoría trimestral de manifiestos de residuos peligrosos y monitoreo anual de calidad del suelo bajo los islotes; para cada acción indica el indicador verificable, la frecuencia y el responsable. El tercer párrafo describe el mecanismo de reporte ante la ASEA y la obligación de conservar registros disponibles para inspección en cualquier momento.

## 4.7 `abandono` — Sección IV

> Redacta la sección IV —Abandono del sitio— del Informe Preventivo en prosa técnica continua, abarcando en orden los siguientes temas integrados en el texto sin encabezarlos: los supuestos que activan el cierre —fin de vida útil estimada en veinticinco años, daño catastrófico, cambio de política energética u orden de autoridad—; las acciones específicas por componente, describiendo para los tanques la desgasificación con nitrógeno hasta alcanzar LEL menor al diez por ciento certificado por Unidad de Verificación y el posterior retiro mecánico con manifiestos, para las líneas la purga con aire comprimido y el retiro de tuberías soterradas, y para el SRV su desmontaje y disposición; los protocolos de seguridad —sistema LOTO, permisos de trabajo caliente y de espacio confinado, EPP mínimo y monitoreo continuo con detector de cuatro gases (O₂, LEL, CO, H₂S)—; la gestión de los residuos del cierre clasificando fondos de tanques como RP presuntos sujetos a análisis TCLP, aguas de enjuague y RCD de demolición; el muestreo confirmatorio de suelos en cuatro puntos con análisis de TPH, BTEX y metales en laboratorio acreditado NMX-EC-17025 comparados contra criterios SEMARNAT; la restitución del terreno con relleno, nivelación y revegetación; y los avisos administrativos obligatorios a la ASEA con treinta días de anticipación, al municipio con diez días y a la CONAGUA con quince días.

## 4.8 `sustentabilidad` — III.7

> Redacta el apartado III.7 —Condiciones adicionales para la sustentabilidad— del Informe Preventivo en uno o dos párrafos de prosa continua. Describe los compromisos voluntarios que el promovente adopta más allá de las obligaciones normativas mínimas, integrando en el texto las siguientes medidas con su indicador de cumplimiento: instalación de señalética ambiental para separación de residuos y ahorro de agua; revegetación con especies nativas en las áreas verdes disponibles del predio; eficiencia energética mediante la sustitución de luminarias convencionales por LED y el uso de temporizadores; capacitación anual del personal en manejo seguro de sustancias peligrosas conforme a NOM-005-STyPS-1998; y monitoreo semestral de calidad del suelo bajo los islotes de despacho para detectar contaminación temprana. Concluye señalando que estas medidas refuerzan la viabilidad ambiental del proyecto y manifiestan la responsabilidad ambiental del operador más allá del cumplimiento normativo.

## 4.9 `diagnostico_ambiental` — III.4.6

> Redacta la síntesis del diagnóstico ambiental integral —apartado III.4.6— del Informe Preventivo en tres o cuatro párrafos de prosa continua, integrando los apartados III.4.1 a III.4.5 sin encabezarlos. El primer párrafo describe el estado de conservación del ecosistema en el área de influencia: cobertura vegetal (porcentaje estimado y tipo fisonómico-florístico), fauna silvestre observada, presencia o ausencia de especies protegidas conforme a la NOM-059-SEMARNAT-2010, y el grado de modificación antrópica del entorno. El segundo párrafo describe los riesgos preexistentes en el AI: riesgo de inundación según CONAGUA, estabilidad de laderas y pendientes, condición del acuífero (sobreexplotado o disponible), posible contaminación previa del suelo o subsuelo y conflictos socioambientales documentados. El tercer párrafo evalúa los servicios ambientales del sistema —regulación hídrica, microclima, provisión de hábitat y valor paisajístico— con su nivel de importancia para el AI. El cuarto párrafo concluye la sensibilidad ambiental global del sitio: si el AI es de baja, media o alta sensibilidad, la compatibilidad del uso propuesto con el entorno y la capacidad del proyecto para operar sin superar los umbrales normativos con las medidas propuestas.

## 4.10 `conclusion` — Sección V

> Redacta la síntesis central de la sección V —Conclusión— del Informe Preventivo en cuatro o cinco párrafos de prosa continua, con tono declarativo orientado a demostrar ante la ASEA la viabilidad y la diligencia ambiental del proyecto. El primer párrafo sintetiza el proyecto —qué es, dónde está, de quién es y su importancia energética local. El segundo presenta el resultado del diagnóstico ambiental del área de influencia: el estado de conservación del entorno, la ausencia o presencia de especies en riesgo, la ausencia de ANP y la compatibilidad del sitio con el uso propuesto. El tercer párrafo resume la evaluación de impactos: los impactos más significativos identificados, su naturaleza (temporal, localizada, reversible) y el balance neto positivo una vez aplicadas las medidas de mitigación. El cuarto párrafo declara la eficacia de las medidas propuestas en la Sección III.6 y los compromisos voluntarios de la Sección III.7, dejando los impactos residuales en rango bajo a medio. Si es necesario un quinto párrafo, úsalo para afirmar la congruencia del proyecto con el marco jurídico aplicable —LGEEPA, REIA, POEGT y NOMs del sector— y con el Plan Nacional de Desarrollo.

# 5. Los 3 prompts de extracción de datos (no narrativos)

A diferencia de los 10 anteriores (que **redactan** texto de informe), estos tres **leen** una fuente y devuelven JSON estructurado — no producen texto que vaya directo al documento, sino datos que llenan el cuestionario.

## 5.1 `perfil` — autollenado de recopilación

**System prompt:**
> Eres un asistente que extrae datos de proyecto desde un formulario de RECOPILACIÓN DE DATOS (texto o imagen) para llenar un Informe Preventivo. Devuelve ÚNICAMENTE JSON válido. No inventes: si un campo no aparece en la fuente, omítelo. Para campos con lista de opciones elige la más cercana.

El prompt de usuario se arma dinámicamente con la lista de campos a buscar (generada en el cliente por `camposImportables()`) y el contenido de la fuente (texto pegado + CSV descargado del Sheet, si aplica).

## 5.2 `tabla` — estructuración de tablas técnicas

**System prompt:**
> Eres un asistente que estructura datos crudos (texto o imágenes de tablas/listados) en tablas para un Informe Preventivo (IP) ASEA. Devuelve ÚNICAMENTE JSON válido, sin texto adicional. No inventes datos: si un campo no aparece en la fuente, usa cadena vacía. No limites el número de filas: incluye TODAS las que encuentres.

## 5.3 `programa` — N programas de ordenamiento ecológico (agregado más reciente)

**System prompt:**
> Eres un asistente que extrae los datos de un Programa de Ordenamiento Ecológico (POEGT, POE Estatal, POE Regional, POEL, PDUM municipal, programa de manejo de un ANP, u otro) desde su hoja de intersección SIGEIA, para vincularlo con un proyecto de Informe Preventivo ASEA. Devuelve ÚNICAMENTE JSON válido. No inventes: si un dato no aparece en la fuente, omítelo.

# 6. Trazabilidad — estado actual y una brecha a resolver

**Lo que sí queda registrado:** el texto generado por cualquiera de los 10 prompts narrativos se guarda como parte del `state` del proyecto (en el campo correspondiente, p. ej. `iaDescTecnica`) y por tanto viaja con el **Guardar JSON** del proyecto — es recuperable y editable en cualquier momento.

**Lo que NO queda registrado (brecha para auditoría de calidad):** el sistema **no guarda un historial** de qué prompt exacto y qué versión del modelo generaron un texto determinado, ni cuándo, ni si el consultor lo editó después de generarlo. Si hoy se audita un IP entregado, se puede reconstruir *qué dice el texto final*, pero no *si ese texto salió tal cual de la IA o fue reescrito a mano*, ni con qué prompt/versión se generó. Este documento cumple la función de registrar **el prompt vigente en cada revisión del código** (trazabilidad a nivel de sistema), pero no sustituye un log por-proyecto de invocaciones individuales.

**Recomendación** (fuera del alcance de esta entrega, para valorar a futuro): agregar a `state` un campo `_ia_log` que registre, por cada sección redactada con IA, la fecha, el modelo usado y un hash o copia del prompt final enviado — permitiría responder con precisión, proyecto por proyecto, "¿qué generó la IA aquí y con qué instrucciones".
