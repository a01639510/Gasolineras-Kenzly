% Manual de Usuario — App IP ASEA (Verde Raíz)
% Verde Raíz
% Julio 2026

# 1. Qué es esta aplicación

La app **Automatización del Informe Preventivo (IP)** es un cuestionario digital de un solo archivo (`index.html`) que reproduce, capítulo por capítulo, el **Informe Preventivo del sector hidrocarburos** que exige la ASEA para estaciones de servicio (gasolineras). Captura los datos del proyecto una sola vez y arma automáticamente el documento completo: portada, índice, glosario, capítulos I a VI, tablas y anexos.

No requiere instalación ni conexión a internet para llenar el cuestionario y generar el documento. Sí requiere internet en el momento puntual de usar cualquier botón **"✨ Redactar con IA"**, **"Estructurar con IA"** o **"Autollenar / Agregar programa"**, porque esas funciones llaman a un servicio en la nube (ver sección 6).

Se abre con doble clic sobre `index.html` en Chrome, Edge o Safari, o desde la versión publicada en la web.

# 2. Estructura del cuestionario

El cuestionario está organizado en las mismas secciones que el IP final:

| Grupo | Contenido |
|---|---|
| **Inicio** | Importar recopilación, portada y datos base |
| **I. Datos generales** | Datos del proyecto, promovente, responsable del IP |
| **II. Fundamento jurídico** | Instrumentos normativos, POEGT, programas de ordenamiento, plan municipal |
| **III. Aspectos técnicos** | Descripción técnica, sustancias, emisiones/residuos, diagnóstico ambiental, impactos, medidas |
| **IV. Abandono** | Plan de cierre del sitio (8 subsecciones) |
| **V. Conclusión** | Síntesis final en 9 subsecciones |
| **VI. Anexos** | Planos, cartografía y anexo fotográfico |

El menú lateral (tabla de contenido) muestra un punto de color junto a cada sección: **verde** = todos sus campos cerrados tienen dato, **amarillo** = incompleta, **sin punto** = sección sin campos medibles (p. ej. una sección puramente de guía ✎).

## 2.1 Tipos de campo

Cada campo trae una etiqueta que indica qué tipo de trabajo requiere:

- 🔵 **Cerrada** — un dato puro del proyecto (nombre, RFC, superficie, coordenadas…). Se teclea una vez y se propaga a portada, encabezados, tablas y cuerpo del documento.
- 🟢 **Redactada-cerrada (boiler)** — texto ya redactado (boilerplate) que solo requiere elegir una opción (p. ej. si una de las 44 estrategias del POEGT aplica directa, indirectamente o no aplica). El campo trae un enlace **"Ver texto que se generará"** para revisar el párrafo estándar antes de aceptarlo.
- 🟠 **Abierta ✎** — requiere redacción, mapas o matrices que la app no puede inventar. Se conserva la instrucción original del machote como guía, y casi todas estas secciones traen un botón de IA para generar un primer borrador editable (ver sección 4).

# 3. Cómo cargar los datos del proyecto

## 3.1 Autollenado de recopilación ("⬆ Importar RECOPILACIÓN")

Esta es la forma recomendada de arrancar un proyecto nuevo. En la sección **Inicio → Importar RECOPILACIÓN**:

1. Pega el **link de Google Sheets** de la recopilación del cliente (si el formulario vive en Sheets), **o**
2. Pega el **contenido de la recopilación como texto** (copiado de un Excel/Word), **o**
3. Adjunta una **foto o captura** del formulario impreso/escaneado.

Puedes combinar los tres (por ejemplo, link + una foto de un plano adicional). Al dar clic en **"⬆ Autollenar datos del proyecto"**, la IA lee lo que le diste y llena automáticamente todos los campos cerrados que reconozca del cuestionario (ubicación, promovente, sustancias, superficie, etc.). Al terminar te dice cuántos campos autollenó — **siempre revísalos**, porque la IA nunca inventa un dato: si no lo encontró, deja el campo vacío.

> **No hay un botón para "subir un archivo .xlsx" directamente.** Si el cliente te manda un Excel, la forma de usarlo aquí es: (a) subirlo a Google Sheets y pegar el link, o (b) abrirlo, copiar las celdas y pegarlas como texto en el cuadro de texto, o (c) tomarle una foto/captura de pantalla y adjuntarla como imagen. Las tres vías las procesa el mismo motor de IA.

## 3.2 Tablas técnicas ("Estructurar con IA")

Varias secciones (II.2/II.3 UAB y plan municipal, III.1 tanques/tuberías/extintores/distancias, III.4 catálogos de flora y fauna, III.6 medidas y vigilancia) tienen un botón **"✨ Estructurar con IA"**. Funciona igual que el autollenado: pegas los datos (texto y/o imagen) y la IA los acomoda en la tabla correspondiente, fila por fila, **sin límite de filas**. Ver la Sección 3 del documento de *Especificación de Fuentes de Datos* para la lista completa de columnas que espera cada tabla.

## 3.3 Programas de ordenamiento ecológico (II.2)

A partir de esta versión, la sección **II.2** ya no asume que el proyecto solo tiene un POEGT nacional fijo: puedes ligar **tantos programas de ordenamiento como aplique** al predio (POEGT, POE Estatal, POE Regional, POEL municipal, PDUM, programa de manejo de un ANP, etc.).

Por cada programa:

1. Escribe su **nombre** (ej. "POEGT", "POEL Puerto Vallarta").
2. Pega el **link de Google Sheets** de intersección de ese programa (o pega texto / adjunta imagen si no tienes Sheet).
3. Da clic en **"+ Agregar programa"**. La IA lo lee y te muestra una tarjeta **colapsable**: cerrada solo ves el nombre y el link; ábrela para ver todos los incisos/campos que encontró.
4. Repite para cada programa adicional. Puedes eliminar un programa con el botón **×** de su tarjeta.

El primer programa que traiga los datos de la Unidad Ambiental Biofísica (UAB número, clave de política, ordenamiento regional, región ecológica) alimenta automáticamente el texto nacional del POEGT y la Tabla II.2; los programas siguientes (Estatal, POEL, etc.) generan su propia subsección con una tabla de sus incisos.

## 3.4 Fotos, planos y mapas (Figuras)

Casi todas las secciones técnicas (portada, POEGT, UGA estatal, POEL, localización, sustancias, diagnóstico ambiental, matriz de Leopold, anexos) tienen su propia **caja de imagen** — busca el texto **"+ Agregar imagen"** dentro de cada sección. Ahí puedes subir cuantas fotos/planos/mapas necesites para esa figura específica; la app las guarda localmente en tu equipo (nunca se suben a internet) y las numera automáticamente como *"Figura N. …"* en el orden en que aparecen dentro del documento final.

Algunas figuras (Modelo Ecológico Conceptual, metodología de evaluación de impacto) solo aparecen si activaste el interruptor correspondiente en esa sección (`incluirMEC`, `incluirMetodo`).

## 3.5 Guardar / Cargar proyecto (JSON)

Tus respuestas se guardan automáticamente en el navegador mientras trabajas (no necesitas "Guardar" a cada rato). Además puedes:

- **Guardar JSON** — exporta un archivo con todas las respuestas del proyecto (incluidas las imágenes) para respaldarlo o reutilizarlo como base de un proyecto similar.
- **Cargar JSON** — importa un archivo previamente guardado, o uno generado con el *Extractor de IP terminados* (ver `docs/prompt_extractor_json.md`): pega un IP ya terminado en Claude, obtén el JSON, y cárgalo aquí para no volver a capturar todo a mano.

La app soporta **varios proyectos** guardados a la vez (pantalla de inicio → "Nuevo proyecto" / lista de proyectos existentes) — cada uno con sus propias respuestas e imágenes, aislado de los demás.

# 4. Redacción de secciones abiertas con IA

Las secciones marcadas 🟠 **Abierta** (descripción técnica, emisiones y residuos, flora y fauna, identificación de impactos, medidas de mitigación, programa de vigilancia, sustentabilidad, diagnóstico ambiental integral, abandono, conclusión) traen un botón **"✨ Redactar con IA"**. Genera un primer borrador técnico a partir de los datos que ya capturaste en el resto del cuestionario — el texto aparece en un cuadro editable: **corrígelo y complétalo tú antes de dar por cerrada la sección.** La IA nunca inventa cifras: si falta un dato, escribe `[Dato pendiente: descripción]` para que no se te pase por alto.

# 5. Generar y revisar el documento

1. Da clic en el botón **👁 Ver documento**. Se genera el machote completo (portada, índice, glosario, capítulos I–VI, ~27 tablas, cronograma de cierre, firmas y referencias).
2. Alterna entre las dos vistas con el conmutador de arriba:
   - **📝 Borrador** — el texto nuevo (boilerplate + lo que capturaste) aparece **resaltado en amarillo**; las áreas pendientes (instrucciones ✎ y tablas por llenar) en **ámbar**. Úsala para revisar de un vistazo qué generó la automatización y qué falta.
   - **📄 Documento limpio** — el texto nuevo va sin resaltar, como quedaría el documento final; solo las áreas realmente pendientes siguen en ámbar.
3. **Descargas:**
   - **⬇ Word borrador** → `IP_<proyecto>_BORRADOR.doc`
   - **⬇ Word limpio** → `IP_<proyecto>_LIMPIO.doc`
   - **🖨 PDF** — desde el diálogo de impresión del navegador.

Los archivos `.doc` se abren directamente en Microsoft Word conservando encabezados, tablas, numeración y diseño del machote oficial.

> El documento exportado trae solo texto y tablas; un IP terminado con imágenes, mapas y matrices insertados ronda las 180 páginas al imprimirse — el borrador de la app es más corto pero conserva toda la estructura y numeración.

# 6. Privacidad y qué sale de tu equipo

- Tus respuestas se guardan en el navegador (`localStorage`) y las imágenes en una base local (`IndexedDB`). **Nada de esto se sube a internet** salvo que tú expresamente uses una función de IA.
- Cuando usas **Autollenar**, **Estructurar con IA**, **Redactar con IA** o **Agregar programa**, el texto que capturaste (o el link de Sheets, o la imagen adjunta) se envía a la función `/api/redactar` del servidor, que a su vez llama al modelo de IA (Claude, de Anthropic) para procesarlo. Ningún archivo se guarda en ese servidor; se usa una sola vez para responder tu solicitud.
- Datos especialmente sensibles como RFC y CURP **nunca se piden a la IA como dato a inventar** — si no aparecen en lo que pegaste, el campo queda vacío para que lo captures tú.

# 7. Checklist y anexos integrados

La app incluye, sin necesidad de documentos externos:

- **Guía de uso** (📖) y **Checklist ASEA-00-041** — accesibles desde el propio cuestionario, para validar cada sección antes de avanzar.
- **Registro de anexos requeridos** (sección VI) — lista los documentos que ASEA exige adjuntar (acta constitutiva, poder notarial, planos, dictámenes, etc.) con un campo para pegar el link de cada uno en tu Drive.

# 8. Preguntas frecuentes

**¿Qué pasa si pego un Excel/Sheet con columnas distintas a las que espera la app?**
La IA solo llena los campos que reconoce por su etiqueta o contenido; todo lo demás simplemente no se autollena y lo capturas a mano. Nunca se "inventa" una columna que no existe en tu fuente.

**¿Puedo tener más de un proyecto abierto?**
Sí — usa la pantalla de inicio para crear o abrir proyectos; cada uno guarda sus propias respuestas e imágenes por separado.

**¿Qué pasa si se me va el internet a la mitad de un "Redactar con IA"?**
El botón muestra el error y no se pierde nada de lo ya capturado; solo reintentas esa sección cuando recuperes conexión.

**¿Necesito instalar algo?**
No para el cuestionario ni para exportar Word/PDF. Solo se necesita internet en el momento de usar un botón de IA.
