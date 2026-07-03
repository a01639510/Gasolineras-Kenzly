% Especificación de Fuentes de Datos — App IP ASEA (Verde Raíz)
% Verde Raíz
% Julio 2026

# 1. Alcance de este documento

Aquí se documenta **qué formato espera la aplicación en cada punto donde el usuario entrega datos**, qué campos son obligatorios y **qué pasa si vienen mal estructurados o incompletos**.

Una aclaración importante de entrada: la app **no valida contra una plantilla de Excel fija con celdas predeterminadas**. Las cinco vías de entrada de datos del sistema son **asistidas por IA y tolerantes al formato**: la IA busca los datos por significado (etiqueta/columna reconocible), no por posición de celda. Esto tiene una ventaja (el cliente no tiene que llenar un formato rígido) y una regla dura a cambio: **si un dato no aparece de forma reconocible, el campo se deja vacío — nunca se inventa, nunca se aproxima.**

Las cinco fuentes de datos del sistema son:

1. Recopilación general del proyecto (autollenado del cuestionario).
2. Tablas técnicas estructuradas (15 tablas distintas).
3. Programas de ordenamiento ecológico (II.2).
4. Figuras / imágenes (fotos, planos, mapas).
5. Proyecto completo en JSON (respaldo/traspaso/reutilización).

# 2. Fuente 1 — Recopilación general (`accion:"perfil"`)

## 2.1 Formato de entrada aceptado

Cualquier combinación de:

- **Link de Google Sheets** — debe ser público o compartido "con cualquiera que tenga el link". La app extrae el ID del Sheet con la expresión `\/d\/([a-zA-Z0-9_-]+)` y descarga `export?format=csv` de la **primera pestaña** únicamente. Si el Sheet tiene varias pestañas, solo la primera se envía a la IA.
- **Texto pegado** — cualquier estructura (tabla copiada de Excel/Word, lista de pares etiqueta-valor, párrafos). No hay un delimitador obligatorio.
- **Imagen** — foto o captura del formulario de recopilación (JPG/PNG). Se redimensiona a máx. 1600 px antes de enviarse.

## 2.2 Campos que puede llenar

Todo campo del cuestionario de tipo `text`, `num`, `money`, `date`, `select` o `selectEstado` es candidato a autollenado (función `camposImportables()` en `app.js`, que recorre las 17 secciones del formulario en tiempo real — si se agrega un campo nuevo de esos tipos a cualquier sección, automáticamente queda disponible para autollenado sin tocar el importador). Los grupos principales son:

| Sección | Campos típicos |
|---|---|
| Portada / base | nombre del proyecto, empresa, fecha |
| I.1 Datos del proyecto | calle, colonia, municipio, estado, CP, zona/datum UTM, superficie, inversión, empleos directos/indirectos, duración por etapa |
| I.2 Promovente | RFC empresa, representante legal, RFC/CURP representante, domicilio de notificaciones, teléfono, correo |
| I.3 Responsable del IP | nombre, profesión, cédula, RFC, CURP, empresa consultora, dirección, teléfono, correo |
| III.1 Datos generales | clave catastral, responsable de obra, permiso CRE, registro ASEA, uso de suelo |
| III.3 | volumen/destino de aguas sanitarias y aceitosas, gestor de residuos peligrosos |
| IV. Abandono | vida útil, año de cierre, presupuesto de cierre |

> La lista exhaustiva y actualizada de todos los IDs de campo (más de 60) está en `docs/prompt_extractor_json.md`, que además sirve como la plantilla oficial de re-importación de un IP ya terminado.

Campos **no cubiertos** por este mecanismo (porque no son de tipo texto/número/selección simple): tablas (`tablaIA`), sustancias con estructura fija (`sustancias`, `susDinamica`), coordenadas de los 4 vértices (`puntos`), catálogo de 44 estrategias (`estrategias`), imágenes.

## 2.3 Campos obligatorios

**Ninguno es obligatorio para que el autollenado corra** — la IA llena lo que encuentra y omite el resto sin error. Los campos que sí son indispensables para que el **documento final** no quede con huecos críticos (nombre del proyecto, ubicación, promovente, responsable del IP) deben verificarse manualmente después del autollenado; la app no bloquea la generación del documento si faltan.

## 2.4 Qué pasa si viene mal estructurado

- Si el link de Sheets no es público → la descarga regresa vacío y el campo `fuente` queda solo con lo que se haya pegado como texto/imagen; no se produce error visible, simplemente ese Sheet no aporta nada.
- Si el link no contiene un ID de Sheets reconocible → se ignora silenciosamente (`fetchSheetCSV` regresa cadena vacía).
- Si la IA no encuentra ningún campo reconocible → el mensaje final indica *"No se encontraron campos en la recopilación"* y no se modifica ninguna respuesta existente (nunca sobreescribe con vacío un campo que ya tenía dato).
- Si la respuesta de la IA no es JSON válido → la función lanza el error *"La IA no devolvió JSON válido para el perfil"* y no se aplica ningún cambio.

# 3. Fuente 2 — Tablas técnicas (`accion:"tabla"`)

Cada una de las 15 tablas siguientes tiene columnas fijas — la IA debe encajar los datos encontrados exactamente en esas columnas; cualquier dato que no encaje en ninguna columna simplemente no se incluye.

| Tabla (`key`) | Sección del IP | Columnas |
|---|---|---|
| `tablaUabPoliticas` | II.2 | Concepto · Valor |
| `tablaPlanMunicipal` | II.3 | Criterio · Descripción · Relación directa con el proyecto |
| `tablaPOEL` | II.3 | Clave UGA · Nombre UGA · Política territorial · Uso predominante · Uso condicionado · Uso incompatible |
| `tablaTanques` | III.1.7 | ID Tanque · Capacidad (L) · Producto · Presión diseño · Presión operación · Set PSV · Año/Serie · Fabricante · Dictamen/UV |
| `tablaTuberias` | III.1.7 | Fluido/Servicio · Ø Nominal · Material · Tipo de instalación · Profundidad · Pendiente · Prueba/Dictamen · Observaciones |
| `tablaExtintores` | III.1.7 | No. · Ubicación · Tipo · Capacidad · Evidencia |
| `tablaDistancias` | III.1.7 | Elemento · Distancia requerida (m) · Distancia de proyecto (m) · Cumple |
| `tablaFlora` | III.4.3 | Familia · Nombre científico · Nombre común · NOM-059-SEMARNAT |
| `tablaMamiferos` | III.4.3 | Familia · Nombre científico · Nombre común · NOM-059-SEMARNAT |
| `tablaAvifauna` | III.4.3 | Familia · Nombre científico · Nombre común · NOM-059-SEMARNAT |
| `tablaHerpeto` | III.4.3 | Familia · Nombre científico · Nombre común · NOM-059-SEMARNAT |
| `tablaMedidasPrep` | III.6 (preparación/construcción) | Factor ambiental · Impacto/fuente · Medida de prevención/mitigación · Programa y responsable · NOM/marco legal · Resultado/impacto residual |
| `tablaMedidasOper` | III.6 (operación) | *(mismas columnas que `tablaMedidasPrep`)* |
| `tablaMedidasAband` | III.6 (abandono) | *(mismas columnas que `tablaMedidasPrep`)* |
| `tablaVigilancia` | III.6.1 | Etapa · Acción de vigilancia · Indicador verificable · Frecuencia · Responsable |

**Entrada aceptada:** texto pegado y/o una imagen por tabla (no acepta link de Sheets en este modo). **Sin límite de filas** — a diferencia del autollenado de campos sueltos, aquí se incluyen *todas* las filas que la IA encuentre.

**Campos obligatorios:** ninguno a nivel del sistema; una tabla vacía simplemente se muestra como "por llenar" (`k:"scaffold"`) en el documento final en vez de aparecer con datos.

**Si viene mal estructurado:** la instrucción explícita a la IA es usar cadena vacía `""` en la celda que no encuentre — nunca inventa un valor para no dejar la celda en blanco. Si la respuesta completa no es JSON válido, la función regresa el error *"La IA no devolvió JSON válido para la tabla"* y no se modifica `state.tablas`.

# 4. Fuente 3 — Programas de ordenamiento ecológico (`accion:"programa"`)

## 4.1 Formato de entrada

Por programa: **nombre** (obligatorio, lo escribe el usuario) + **link de Google Sheets** de intersección SIGEIA (recomendado) y/o texto pegado y/o imagen.

## 4.2 Qué extrae

Dos bloques en la respuesta:

- `campos` — los 5 datos de la Unidad Ambiental Biofísica del POEGT (`uab`, `clave_politica`, `ord_regional`, `region_eco`, `region_eco_nombre`). Solo se llenan si el programa es efectivamente el POEGT y el Sheet los trae; para cualquier otro tipo de programa (Estatal, POEL, PDUM…) este objeto va vacío.
- `incisos` — lista abierta de `{campo, valor}` con **todo lo demás relevante** que la IA encuentre para vincular el proyecto con ese programa específico (clave UGA, política ambiental, uso de suelo predominante, criterios ecológicos aplicables, etc.). Sin límite de incisos.

## 4.3 Qué pasa si viene mal estructurado

- Si no se puede leer el Sheet ni hay texto/imagen → error explícito *"Pega el link de Google Sheets, datos o una imagen del programa"*, no se agrega el programa.
- Si el Sheet no aporta nada relevante → `incisos: []`; el programa igual se agrega a la lista (para que quede registrado que se intentó vincular), pero su tarjeta se ve vacía al expandirla.
- El primer programa cuyo `campos` traiga los 5 datos de UAB "gana" — si agregas dos programas que ambos parecieran ser el POEGT nacional, solo el primero alimenta el texto/tabla fijos; esto replica la regla de "no pisar un dato ya bueno con uno vacío" usada en el resto del sistema.

# 5. Fuente 4 — Figuras / imágenes

## 5.1 Formato aceptado

Cualquier archivo de imagen (`image/*` — típicamente JPG o PNG). Se redimensiona en el navegador a máximo 1600 px de lado mayor antes de guardarse, para no saturar el almacenamiento local.

## 5.2 Dónde van

El catálogo `AREAS` en `data.js` define **33 huecos de imagen** predefinidos, cada uno ligado a una sección específica del documento (portada, POEGT, UGA estatal, POEL, 4 niveles de localización, colindancias, plano arquitectónico, diagrama de proceso, SDS de sustancias, diagrama de flujos, y 12 huecos dentro del diagnóstico ambiental: AI, clima, topografía, geología, edafología, hidrología, acuíferos, vegetación, NDVI, evidencia de flora/fauna, zonas de atención prioritaria, receptores sensibles), más 2 huecos condicionados a interruptores (MEC, metodología de evaluación) y un slot abierto (`"anexo"`) para figuras adicionales sin límite, usado en el anexo fotográfico.

Cada figura sube de forma independiente en su propia sección del cuestionario — no hay una "carga masiva" de imágenes.

## 5.3 Qué pasa si viene mal estructurado

Si el archivo no es una imagen válida, la app rechaza la carga con el mensaje *"Selecciona un archivo de imagen"* y no la guarda. No hay validación de contenido (la app no verifica que la foto corresponda realmente al mapa/plano que pide esa sección) — eso queda a criterio del consultor.

# 6. Fuente 5 — Proyecto completo en JSON

## 6.1 Formato

Un único archivo `.json` con **todas** las claves de `state` (ver el esquema completo y comentado en `docs/prompt_extractor_json.md`, que documenta más de 90 campos, 30 arreglos de tabla y el objeto `tablas`). Incluye, si se generó desde **Guardar JSON**, el volcado de imágenes en base64; si se generó con el *Extractor de IP terminados* (prompt en el mismo documento), el bloque `__images` queda vacío porque las imágenes no viajan en un PDF de texto.

## 6.2 Campos obligatorios

Ninguno a nivel de parseo — **Cargar JSON** hace `merge` sobre el `state` actual y pasa el resultado por `normalize()` (la misma función que corre al arrancar la app), que rellena cualquier arreglo/objeto faltante con sus valores por defecto. Un JSON parcial (por ejemplo, exportado a mano con solo 5 campos) se carga sin error; simplemente el resto del cuestionario queda como estaba.

## 6.3 Qué pasa si viene mal estructurado

- JSON inválido (sintaxis rota) → falla el `JSON.parse` y no se aplica ningún cambio; se notifica el error al usuario.
- Claves desconocidas (de una versión futura o de otro sistema) → se conservan en `state` sin causar error, pero no se usan en ningún lugar del cuestionario ni del documento — quedan "muertas" hasta que alguna versión futura las reconozca.
- Tipos incorrectos (p. ej. `estrategias` como objeto en vez de arreglo) → `normalize()` los detecta y los reemplaza por el valor por defecto correspondiente en vez de dejar la app en un estado roto.

# 7. Resumen — matriz de tolerancia a errores

| Fuente | ¿Requiere formato exacto? | ¿Qué hace ante dato faltante? | ¿Qué hace ante dato irreconocible? |
|---|---|---|---|
| Recopilación (perfil) | No | Deja el campo vacío | Lo ignora, no lo asigna a ningún campo |
| Tablas técnicas | No (columnas fijas, filas libres) | Celda en blanco `""` | Fila/columna no incluida |
| Programas de ordenamiento | No | `incisos: []` | Igual, se omite |
| Figuras | Sí (debe ser imagen) | No sube nada | Rechaza el archivo con aviso |
| JSON de proyecto | Parcialmente (debe ser JSON válido) | `normalize()` rellena con default | Clave desconocida se ignora; tipo incorrecto se corrige a default |

**Principio de diseño común a las cuatro fuentes asistidas por IA:** nunca inventar, nunca aproximar — un campo vacío es siempre preferible a un dato incorrecto en un documento regulatorio. Esta regla está codificada explícitamente en el `SYSTEM` prompt de cada modo (ver Documento 4).
