# PROMPT EXTRACTOR v2 — IP ASEA Terminado → JSON Completo para la App

## Cómo usar

1. Abre **claude.ai** en el navegador
2. **Adjunta el PDF** del IP terminado (o pega el texto completo)
3. **Copia todo el bloque PROMPT** (entre las líneas ` ``` `) y pégalo en el chat
4. Claude genera el JSON — cópialo y guárdalo como `IP_datos_nombre.json`
5. En la app: **Importar / Exportar → Cargar JSON**

---

## PROMPT — copiar desde el primer ``` hasta FIN DEL PROMPT

```
Eres un extractor de datos especializado en Informes Preventivos ASEA (sector hidrocarburos, México).

Tu tarea: leer el documento IP adjunto y producir un JSON con TODOS los campos del formulario digital.
Devuelve ÚNICAMENTE el objeto JSON. Sin texto antes ni después. Sin bloques markdown.

══════════════════════════════════════════════════════════════════
REGLA ABSOLUTA: SOLO LO QUE ESTÁ ESCRITO EN EL DOCUMENTO
══════════════════════════════════════════════════════════════════
• Si un campo no aparece textualmente → usa "" (cadena vacía).
• No completes, no inferas, no asumas, no añadas valores "razonables".
• CAMPOS PROHIBIDOS de inventar (Tipo B — dato específico del proyecto):
    vol y prov en sus_construccion / sus_operacion → NO marcas, NO volúmenes
    empleosDir / empleosInd → "" si no aparece el número exacto
    srvEficiencia → texto literal del doc, NUNCA "≥95%" si no está escrito
    utmZona / utmDatum → copia exacta o "" — nunca inferir de coordenadas
    puntos x/y → copia el sistema que usa el doc (GMS o UTM metros), no conviertas
    estrategias[*].d → "" si el doc no tiene tabla de estrategias POEGT
• Para campos IA (iaDescTecnica, iaImpactos, etc.) → COPIA LITERAL el texto del doc.
• Para arrays de tablas → incluye TODAS las filas encontradas.
• Para "" (cadena vacía): úsala cuando el dato no está, NO pongas el texto de guía.
══════════════════════════════════════════════════════════════════

════════════════════════════════════════════════════════════════════════════
GUÍA DE EXTRACCIÓN — dónde encontrar cada dato en el documento IP
Formato de anotación: [TIPO | UBICACIÓN EN EL DOC | FORMATO DE SALIDA]
════════════════════════════════════════════════════════════════════════════

▶ PORTADA (primera página)
  proyecto        STR  | Título principal / nombre de la estación
  empresa         STR  | Razón social del promovente (también en Sección I)
  fecha           STR  | Fecha de elaboración → formato: YYYY-MM-DD

▶ SECCIÓN I.1 — DATOS GENERALES DEL PROYECTO
  (típicamente "Tabla I" o "Datos Generales" en las primeras páginas)
  calle           STR  | Domicilio del predio → calle y número exterior
  colonia         STR  | Colonia o localidad
  municipio       STR  | Municipio o delegación
  estado          STR  | Entidad federativa → nombre completo (ej: "Jalisco")
  cp              STR  | Código postal → 5 dígitos
  utmZona         STR  | Zona UTM declarada en el doc (ej: "14Q") → "" si no aparece
  utmDatum        STR  | Datum geodésico (ej: "WGS84") → "" si no aparece
  superficie      NUM  | Superficie del predio en m² → SOLO número (ej: 13591)
  inversion       NUM  | Inversión estimada en MXN → SOLO número (ej: 47900000)
  empleosDir      NUM  | Empleos directos totales → "" si no aparece separado
  empleosInd      NUM  | Empleos indirectos → "" si no aparece
  durPrep         STR  | Duración etapa preparación (ej: "2 semanas")
  durConstr       STR  | Duración etapa construcción (ej: "6 meses")
  durOper         STR  | Duración etapa operación (ej: "30 años")
  puntos          ARR  | Coordenadas de los 4 vértices del predio
                       | Copia el sistema del doc: GMS ("99°22'24.86\"O") o UTM metros ("460915 E")
                       | NO conviertas entre sistemas. Si hay más de 4, usa los primeros 4.

▶ SECCIÓN I.2 — DATOS DEL PROMOVENTE
  rfcEmpresa      STR  | RFC de la empresa (ej: "CDA850312AB3") → "" si reservado
  repLegal        STR  | Nombre completo del representante legal
  rfcRep          STR  | RFC del representante → "" si reservado/no aparece
  curpRep         STR  | CURP del representante → "" si reservado/no aparece
  dirNotif        STR  | Domicilio para notificaciones (calle, col, municipio, CP)
  telProm         STR  | Teléfono con lada (ej: "33 1234 5678")
  emailProm       STR  | Correo electrónico del promovente

▶ SECCIÓN I.3 — DATOS DEL RESPONSABLE TÉCNICO / CONSULTOR
  cNombre         STR  | Nombre completo del responsable técnico
  cProfesion      STR  | Profesión (ej: "Ingeniero Ambiental", "Biólogo")
  cCedula         STR  | Número de cédula profesional
  cRfc            STR  | RFC del consultor → "" si no aparece
  cCurp           STR  | CURP del consultor → "" si no aparece
  cEmpresa        STR  | Nombre de la empresa consultora
  cDir            STR  | Dirección de la empresa consultora
  cTel            STR  | Teléfono de la empresa consultora
  cEmail          STR  | Correo electrónico de la empresa consultora

▶ SECCIÓN II.1 — INSTRUMENTOS NORMATIVOS
  instrumentos    ARR  | 8 elementos {sel: bool}
                       | Busca en II.1 una tabla de instrumentos o lista de leyes
                       | sel:true si el instrumento se menciona como aplicable
                       | Mantén los 8 elementos en orden; si no hay tabla usa los valores por defecto

▶ SECCIÓN II.2 — ORDENAMIENTO ECOLÓGICO / POEGT
  uab             STR  | Número de Unidad Ambiental Biofísica del POEGT (ej: "98")
  clavePolitica   STR  | Clave de política del POEGT (ej: "C-01", "A-02")
  ordRegional     STR  | Número de ordenamiento regional POEGT (ej: "16")
  regionEco       STR  | Número de región ecológica (ej: "9")
  regionEcoNombre STR  | Nombre de la región ecológica (ej: "Sierra Madre Occidental")
  ugaEstatal      STR  | Clave UGA del ordenamiento estatal (ej: "XXVIII_Ag", "PC-8")
  municipioPlan   STR  | Municipio del Plan de Desarrollo Urbano (ej: "Tlajomulco de Zúñiga")
  parqueInd       STR  | "Sí" / "No" / "No aplica" — si está en parque industrial evaluado
  estrategias     ARR  | 32 elementos {n, d} — tabla de estrategias POEGT
                       | n: número de estrategia (no cambiar); d: texto de aplicabilidad del doc
                       | Si el doc no tiene esta tabla → todos los d: ""

▶ SECCIÓN III.1 — DESCRIPCIÓN TÉCNICA DEL PROYECTO
  claveCatastral  STR  | Clave catastral del predio (ej: "0402-012-003-001")
  respObra        STR  | Nombre del responsable de la obra / director de obra
  permisoCRE      STR  | Número de permiso CRE (ej: "E/4857/EXP/2019") → "" si no aparece
  regASEA         STR  | Número de registro ASEA → "" si no aparece
  usoSuelo        STR  | Uso de suelo actual/propuesto (ej: "Comercial", "Industrial mixto")
  iaDescTecnica   STR  | COPIA LITERAL de todos los párrafos narrativos de III.1
                       | (descripción del proyecto, antecedentes, justificación, proceso)
                       | No incluyas tablas; separa párrafos con \n\n

▶ SECCIÓN III.2 — SUSTANCIAS PELIGROSAS
  sustancias      OBJ  | Tanques de almacenamiento permanente (gasolinas, diésel)
                       | Solo las sustancias con tanque fijo declaradas en el IP
                       | Formato: { "Nombre producto": { "cap": "volumen + tanque", "prov": "proveedor" } }
                       | cap: capacidad tal como aparece (ej: "80,000 litros — Tanque T1-MAGNA")
                       | prov: proveedor declarado en el IP (ej: "PEMEX") → "" si no aparece
  sus_construccion ARR | Sustancias peligrosas usadas en construcción (no almacenadas en tanque)
                       | Columnas: prod, vol, estado, cretib, cas, area, prov
                       | ⚠️ vol y prov: deja "" si no están en el IP — NO inventes marca ni cantidad
  sus_operacion   ARR  | Sustancias usadas en operación/mantenimiento (aceites, solventes, etc.)
                       | Columnas: prod, vol, estado, cretib, cas, area, prov
                       | ⚠️ vol y prov: deja "" si no están en el IP — NO inventes marca ni cantidad

▶ SECCIÓN III.3 — EMISIONES, DESCARGAS Y RESIDUOS
  iaEmisiones     STR  | COPIA LITERAL de los párrafos narrativos de III.3
  srvMarca        STR  | Marca y modelo del Sistema de Recuperación de Vapores
                       | ⚠️ Si solo dice "conforme a NOM-004-ASEA-2017", escribe eso literalmente
  srvEficiencia   STR  | Eficiencia del SRV declarada en el IP
                       | ⚠️ PROHIBIDO añadir "≥95%" si no aparece textualmente
  srvDictamen     STR  | Referencia al dictamen UV o número de certificado
  aguasSanitariaVol STR| Volumen de aguas residuales sanitarias (l/día)
  aguasSanitariaDest STR| Destino o tratamiento (ej: "Red municipal de drenaje")
  aguasAceitosaVol STR | Volumen de aguas aceitosas estimado
  aguasAceitosaTrat STR| Tratamiento y disposición de aguas aceitosas
  gestorRP        STR  | Nombre de la empresa gestora de RP y número de registro SEMARNAT
  tablaResiduos   ARR  | Tabla de residuos sólidos y peligrosos (III.3.3)
                       | Columnas: tipo, etapa, gen, clas, gest, gestor
                       | tipo=nombre residuo, etapa=Construcción/Operación/Ambas
                       | gen=cantidad generada, clas=clasificación, gest=gestión, gestor=empresa gestora
  tablaRuido      ARR  | Fuentes de ruido (III.3.4)
                       | Columnas: fuente, db, ubi, freq, cumpl
                       | fuente=fuente de ruido, db=nivel dB(A) (solo número), ubi=ubicación
                       | freq=frecuencia/horario, cumpl="Sí"/"No" según NOM-081

▶ SECCIÓN III.4 — DIAGNÓSTICO AMBIENTAL
  tablaClima      ARR  | III.4.2a Clima — parámetros climáticos
                       | Columnas: param, val
                       | param=parámetro (Tipo climático, T° media, etc.), val=valor + fuente
  tablaGeomorfo   ARR  | III.4.2b Geología y geomorfología
                       | Columnas: geoforma, desc, ai
                       | geoforma=unidad geológica, desc=descripción, ai=% en AI
  tablaSuelo      ARR  | III.4.2c Edafología
                       | Columnas: param, val
  tablaHidro      ARR  | III.4.2d Hidrología superficial
                       | Columnas: param, val
  tablaAcuifero   ARR  | III.4.2e Acuíferos
                       | Columnas: param, val, interp (interpretación ambiental)
  tablaFloraObservada ARR | III.4.3 Flora observada en campo
                       | Columnas: nombre_comun, nombre_cientifico, ubicacion, cobertura, nom059
  tablaFaunaObservada ARR | III.4.3 Fauna observada en campo
                       | Columnas: grupo, especie, comun, ubicacion, nom059, comportamiento
  tablaPoblacion  ARR  | III.4.4 Demografía por año
                       | Columnas: anio, mujeres, hombres, total
  tablaPiramide   ARR  | III.4.4 Pirámide poblacional por rango de edad
                       | Columnas: franja, mujeres, hombres, total
  tablaOtrosDemog ARR  | III.4.4 Otros indicadores socioeconómicos
                       | Columnas: indicador, valor (incluye fuente en el valor)
  tablaReceptores ARR  | III.4.5 Receptores sensibles dentro del AI
                       | Columnas: no, tipo, nombre, dist, dir, pob, obs
                       | no=número, tipo=tipo receptor, nombre=nombre, dist=distancia
                       | dir=dirección cardinal, pob=población/capacidad, obs=observaciones
  tablaRiesgoReceptores ARR | III.4.5 Evaluación de riesgo por receptor
                       | Columnas: receptor, parametro, nivel, justif
                       | nivel=Alto/Medio/Bajo
  pueblosOriginarios STR | III.4.4 Párrafo sobre pueblos originarios en el municipio → "" si no hay
  nucleosAgrarios STR  | III.4.4 Párrafo sobre ejidos/comunidades agrarias en el AI → "" si no hay
  patrimonioINAH  STR  | III.4.4 Párrafo sobre zonas arqueológicas o monumentos históricos → "" si no hay
  iaFloraFauna    STR  | COPIA LITERAL de los párrafos narrativos de III.4.3 (sin tablas)
  iaDiagnosticoAmbiental STR | COPIA LITERAL de todos los párrafos de III.4.6 Diagnóstico integral

▶ SECCIÓN III.5 — IDENTIFICACIÓN Y EVALUACIÓN DE IMPACTOS
  tablaAccionesProyecto ARR | III.5.3 Catálogo de acciones para la matriz de Leopold
                       | Columnas: codigo, etapa, accion, desc, params
                       | codigo=C01/O01/A01, etapa=Construcción/Operación/Abandono
                       | accion=nombre, desc=descripción, params=parámetros/frecuencia
  tablaImpactosResumen ARR | III.5 Resumen por etapa
                       | Columnas: etapa, positivos, negativos, total
  tablaImpactosSignificativos ARR | III.5.6 Impactos significativos (ISIG≥40)
                       | Columnas: codigo, accion, factor, m, e, d, r, p, a, s, isig, semaforo, desc
                       | m/e/d/r/p/a/s = criterios de valoración (números 1-4)
                       | isig = índice de significancia, semaforo = Rojo/Naranja/Amarillo
  tablaImpactosBalance ARR | III.5.8 Balance de impactos por medio
                       | Columnas: medio, sig_neg, sig_pos, balance, altos, medios
  iaImpactos      STR  | COPIA LITERAL de los párrafos narrativos de III.5.7-5.8 (sin tablas)
  incluirMetodo   BOOL | true si el documento incluye sección de metodología de evaluación

▶ SECCIÓN III.6 — MEDIDAS DE MITIGACIÓN Y VIGILANCIA
  tablaCompromisos ARR | III.6 / III.7 Compromisos ambientales
                       | Columnas: compromiso, responsable, plazo, indicador
  iaMedidas       STR  | COPIA LITERAL de los párrafos narrativos de III.6 (sin tablas)
  iaVigilancia    STR  | COPIA LITERAL del párrafo introductorio de III.6.1 Programa de vigilancia
  iaSustentabilidad STR| COPIA LITERAL de todos los párrafos de III.7 Condiciones adicionales
  incluirMEC      BOOL | true si el documento incluye el Modelo Ecológico Conceptual

▶ SECCIÓN IV — ABANDONO DEL SITIO
  ivVidaUtil      STR  | Vida útil estimada de la estación en años (ej: "30")
  ivAnioOperacion STR  | Año estimado de cierre o inicio de abandono (ej: "2051")
  ivComponentes   STR  | Lista de componentes a desmantelar (texto del doc)
  ivUsoPosterior  STR  | Uso de suelo propuesto para el predio después del cierre
  ivPresupuestoCierre STR | Presupuesto estimado de cierre en MXN (texto del doc)
  incluirAbandono BOOL | true si el documento incluye sección IV completa
  iaAbandono      STR  | COPIA LITERAL del párrafo introductorio/narrativo de IV
  tablaGatillos   ARR  | IV.1 Gatillos y tipos de cierre
                       | Columnas: gatillo, tipo, alcance, ventana, justif
                       | tipo=Regulatorio/Técnico/Económico/Voluntario, alcance=Parcial/Total
  tablaAccionesCierre ARR | IV.2 Acciones de cierre por componente
                       | Columnas: componente, accion, especif, evidencia, uv, obs
  tablaResiduesCierre ARR | IV.4 Residuos generados en el cierre
                       | Columnas: residuo, clas, vol, gestion, gestor
  tablaMuestreoSuelo ARR | IV.5 Puntos de muestreo confirmatorio de suelos
                       | Columnas: punto, ubicacion, prof, analitos
  tablaRestitucion ARR | IV.6 Acciones de restitución post-cierre
                       | Columnas: accion, especif, cantidad, verif, resp
  tablaCriteriosCierre ARR | IV.7 Criterios de finalización de actividades
                       | Columnas: actividad, criterio, evidencia
  tablaAvisosCierre ARR | IV.8 Avisos y cierres administrativos
                       | Columnas: autoridad, que, plazo, accion, evidencia
  tablaCronogramaCierre ARR | IV Cronograma de cierre
                       | Columnas: semana, actividad, resp

▶ SECCIÓN V — CONCLUSIÓN
  tablaCompromisosFinales ARR | V.8 Compromisos del promovente ante ASEA
                       | Columnas: num, compromiso, etapa, normativa
  vViabilidad     STR  | Declaración explícita de viabilidad ambiental (párrafo o frase)
  vNotaConclusion STR  | Nota o condición especial del responsable técnico → "" si no hay
  iaConclusion    STR  | COPIA LITERAL de todos los párrafos de V Conclusión
  incluirConclusion BOOL | true si el documento incluye sección V completa

▶ TABLAS IA (objeto "tablas" — datos bibliográficos detallados)
  Las filas se almacenan como objetos {columna: valor}
  Si la tabla no está en el documento → deja el array vacío []

  tablas.tablaUabPoliticas  | II.2 Políticas y usos de la UAB (POEGT)
    Columnas: "Concepto", "Valor"
  tablas.tablaPlanMunicipal | II.3 Tabla del plan municipal de desarrollo
    Columnas: "Criterio", "Descripción", "Relación directa con el proyecto"
  tablas.tablaPOEL          | II.3 Tabla del POEL / ordenamiento local
    Columnas: "Clave UGA", "Nombre UGA", "Política territorial",
              "Uso predominante", "Uso condicionado", "Uso incompatible"
  tablas.tablaTanques       | III.1 Especificaciones de tanques de almacenamiento
    Columnas: "ID Tanque", "Capacidad (L)", "Producto", "Presión diseño",
              "Presión operación", "Set PSV", "Año/Serie", "Fabricante", "Dictamen/UV"
  tablas.tablaTuberias      | III.1 Especificaciones de red de tuberías
    Columnas: "Fluido / Servicio", "Ø Nominal", "Material", "Tipo de instalación",
              "Profundidad", "Pendiente", "Prueba / Dictamen", "Observaciones"
  tablas.tablaExtintores    | III.1 Inventario de extintores
    Columnas: "No.", "Ubicación", "Tipo", "Capacidad", "Evidencia"
  tablas.tablaDistancias    | III.1 Tabla de distancias de seguridad (NOM)
    Columnas: "Elemento", "Distancia requerida (m)", "Distancia de proyecto (m)", "Cumple"
  tablas.tablaFlora         | III.4.3 Flora potencial — fuente CONABIO/Enciclovida
    Columnas: "Familia", "Nombre científico", "Nombre común", "NOM-059-SEMARNAT"
  tablas.tablaMamiferos     | III.4.3 Mamíferos potenciales — SNIB/Enciclovida
    Columnas: "Familia", "Nombre científico", "Nombre común", "NOM-059-SEMARNAT"
  tablas.tablaAvifauna      | III.4.3 Avifauna potencial — SNIB/Enciclovida
    Columnas: "Familia", "Nombre científico", "Nombre común", "NOM-059-SEMARNAT"
  tablas.tablaHerpeto       | III.4.3 Anfibios y reptiles — SNIB/Enciclovida
    Columnas: "Familia", "Nombre científico", "Nombre común", "NOM-059-SEMARNAT"
  tablas.tablaMedidasPrep   | III.6 Medidas de prevención etapa Preparación
    Columnas: "Factor ambiental", "Impacto / fuente", "Medida de prevención/mitigación",
              "Programa y responsable", "NOM / marco legal", "Resultado / impacto residual"
  tablas.tablaMedidasOper   | III.6 Medidas de prevención etapa Operación
    Columnas: (mismas que tablaMedidasPrep)
  tablas.tablaMedidasAband  | III.6 Medidas de prevención etapa Abandono
    Columnas: (mismas que tablaMedidasPrep)
  tablas.tablaVigilancia    | III.6.1 Programa de vigilancia ambiental
    Columnas: "Etapa", "Acción de vigilancia", "Indicador verificable",
              "Frecuencia", "Responsable"

════════════════════════════════════════════════════════════════════════════
PLANTILLA JSON — rellena cada campo con los datos del documento
Usa "" para campos no encontrados. Nunca dejes el texto de guía como valor.
════════════════════════════════════════════════════════════════════════════

{
  "proyecto": "",
  "empresa": "",
  "fecha": "",

  "calle": "",
  "colonia": "",
  "municipio": "",
  "estado": "",
  "cp": "",
  "utmZona": "",
  "utmDatum": "",
  "superficie": "",
  "inversion": "",
  "empleosDir": "",
  "empleosInd": "",
  "durPrep": "",
  "durConstr": "",
  "durOper": "",

  "puntos": [
    { "x": "", "y": "" },
    { "x": "", "y": "" },
    { "x": "", "y": "" },
    { "x": "", "y": "" }
  ],

  "rfcEmpresa": "",
  "repLegal": "",
  "rfcRep": "",
  "curpRep": "",
  "dirNotif": "",
  "telProm": "",
  "emailProm": "",

  "cNombre": "",
  "cProfesion": "",
  "cCedula": "",
  "cRfc": "",
  "cCurp": "",
  "cEmpresa": "",
  "cDir": "",
  "cTel": "",
  "cEmail": "",

  "uab": "",
  "clavePolitica": "",
  "ordRegional": "",
  "regionEco": "",
  "regionEcoNombre": "",
  "ugaEstatal": "",
  "municipioPlan": "",
  "parqueInd": "",

  "estrategias": [
    { "n": 1,       "d": "" },
    { "n": 2,       "d": "" },
    { "n": 3,       "d": "" },
    { "n": 4,       "d": "" },
    { "n": 5,       "d": "" },
    { "n": 6,       "d": "" },
    { "n": 7,       "d": "" },
    { "n": 8,       "d": "" },
    { "n": 12,      "d": "" },
    { "n": 13,      "d": "" },
    { "n": 14,      "d": "" },
    { "n": 15,      "d": "" },
    { "n": "15BIS", "d": "" },
    { "n": 18,      "d": "" },
    { "n": 24,      "d": "" },
    { "n": 25,      "d": "" },
    { "n": 26,      "d": "" },
    { "n": 27,      "d": "" },
    { "n": 28,      "d": "" },
    { "n": 29,      "d": "" },
    { "n": 31,      "d": "" },
    { "n": 32,      "d": "" },
    { "n": 35,      "d": "" },
    { "n": 36,      "d": "" },
    { "n": 37,      "d": "" },
    { "n": 38,      "d": "" },
    { "n": 39,      "d": "" },
    { "n": 40,      "d": "" },
    { "n": 41,      "d": "" },
    { "n": 42,      "d": "" },
    { "n": 43,      "d": "" },
    { "n": 44,      "d": "" }
  ],

  "instrumentos": [
    { "sel": true },
    { "sel": true },
    { "sel": true },
    { "sel": true },
    { "sel": true },
    { "sel": false },
    { "sel": false },
    { "sel": false }
  ],

  "claveCatastral": "",
  "respObra": "",
  "permisoCRE": "",
  "regASEA": "",
  "usoSuelo": "",

  "sustancias": {},

  "sus_construccion": [
    { "prod": "Pintura anticorrosiva",     "vol": "", "estado": "Líquido", "cretib": "I, T", "cas": "7732-18-5",  "area": "Tanques, líneas",    "prov": "" },
    { "prod": "Soldadura Flux-Core",       "vol": "", "estado": "Sólido",  "cretib": "I",    "cas": "1338-85-2",  "area": "Conexiones, bridas", "prov": "" },
    { "prod": "Diésel (equipos de obra)",  "vol": "", "estado": "Líquido", "cretib": "I",    "cas": "68476-34-6", "area": "Maquinaria pesada",  "prov": "" }
  ],

  "sus_operacion": [
    { "prod": "Aceite lubricante SAE 20W-50", "vol": "", "estado": "Líquido", "cretib": "T, H", "cas": "64742-88-7", "area": "Bombas de trasiego",    "prov": "" },
    { "prod": "Solvente limpieza SRV",        "vol": "", "estado": "Líquido", "cretib": "I, T", "cas": "71-36-3",    "area": "Sistema de vapores",   "prov": "" },
    { "prod": "Diésel para generador backup", "vol": "", "estado": "Líquido", "cretib": "I",    "cas": "68476-34-6", "area": "Generador de respaldo", "prov": "" }
  ],

  "srvMarca": "",
  "srvEficiencia": "",
  "srvDictamen": "",
  "aguasSanitariaVol": "",
  "aguasSanitariaDest": "",
  "aguasAceitosaVol": "",
  "aguasAceitosaTrat": "",
  "gestorRP": "",

  "tablaResiduos": [],
  "tablaRuido": [],

  "tablaClima": [],
  "tablaGeomorfo": [],
  "tablaSuelo": [],
  "tablaHidro": [],
  "tablaAcuifero": [],
  "tablaFloraObservada": [],
  "tablaFaunaObservada": [],
  "tablaPoblacion": [],
  "tablaPiramide": [],
  "tablaOtrosDemog": [],
  "tablaReceptores": [],
  "tablaRiesgoReceptores": [],

  "pueblosOriginarios": "",
  "nucleosAgrarios": "",
  "patrimonioINAH": "",

  "tablaAccionesProyecto": [],
  "tablaImpactosResumen": [],
  "tablaImpactosSignificativos": [],
  "tablaImpactosBalance": [],

  "tablaCompromisos": [],

  "ivVidaUtil": "",
  "ivAnioOperacion": "",
  "ivComponentes": "",
  "ivUsoPosterior": "",
  "ivPresupuestoCierre": "",

  "tablaGatillos": [],
  "tablaAccionesCierre": [],
  "tablaResiduesCierre": [],
  "tablaMuestreoSuelo": [],
  "tablaRestitucion": [],
  "tablaCriteriosCierre": [],
  "tablaAvisosCierre": [],
  "tablaCronogramaCierre": [],

  "tablaCompromisosFinales": [],

  "vViabilidad": "",
  "vNotaConclusion": "",

  "incluirMEC": true,
  "incluirMetodo": true,
  "incluirAbandono": true,
  "incluirConclusion": true,

  "iaDescTecnica": "",
  "iaEmisiones": "",
  "iaFloraFauna": "",
  "iaDiagnosticoAmbiental": "",
  "iaImpactos": "",
  "iaMedidas": "",
  "iaVigilancia": "",
  "iaSustentabilidad": "",
  "iaAbandono": "",
  "iaConclusion": "",

  "tablas": {
    "tablaUabPoliticas": [],
    "tablaPlanMunicipal": [],
    "tablaPOEL": [],
    "tablaTanques": [],
    "tablaTuberias": [],
    "tablaExtintores": [],
    "tablaDistancias": [],
    "tablaFlora": [],
    "tablaMamiferos": [],
    "tablaAvifauna": [],
    "tablaHerpeto": [],
    "tablaMedidasPrep": [],
    "tablaMedidasOper": [],
    "tablaMedidasAband": [],
    "tablaVigilancia": []
  },

  "figuras": {},
  "checklist": {},
  "anexos": {},
  "__images": {}
}

DOCUMENTO IP A PROCESAR:
[Adjunto arriba o texto pegado a continuación]
```

FIN DEL PROMPT

---

## Campos que NUNCA pueden llenarse desde el documento

| Campo | Por qué |
|-------|---------|
| `vol` y `prov` en sus_construccion / sus_operacion | Son datos del proyecto (proveedor real, cantidad real) — no vienen en el IP |
| RFC / CURP / cédulas | Reservados por Art. 113 LFTAIP en documentos públicos |
| Números CAS específicos de mezclas propietarias | Vienen de la SDS del proveedor, no del IP |
| Imágenes / figuras | No viajan en JSON de texto — subir manualmente en la app |

## Checklist post-carga

- [ ] `sustancias` — solo gasolinas/diésel con capacidades reales del IP
- [ ] `sus_construccion` / `sus_operacion` — vol y prov en blanco (no inventados)
- [ ] `puntos` — mismo sistema de coordenadas que el IP (GMS o UTM metros)
- [ ] `utmZona` / `utmDatum` — vacíos si el IP no los declara explícitamente
- [ ] `srvEficiencia` — texto literal, sin "≥95%" añadido
- [ ] Campos IA — texto copiado del IP, no generado nuevo
- [ ] Arrays de tablas — con filas reales, no placeholders de ejemplo
