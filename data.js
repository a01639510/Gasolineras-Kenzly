/* =====================================================================
   data.js — Modelo de contenido del Informe Preventivo (IP) ASEA
   Catálogos + boilerplate (respuestas "redactadas pero cerradas")
   + definición del cuestionario (respuestas cerradas + toggles).
   Todo en español. Sin dependencias. Expone window.IPDATA.
   ===================================================================== */
(function () {
  "use strict";

  // -------------------------------------------------------------------
  // 1) DATOS FIJOS DE LA CONSULTORA (Responsable del IP) — editables
  // -------------------------------------------------------------------
  const CONSULTORA = {
    nombre: "",
    profesion: "Ingeniería en Desarrollo Sustentable",
    cedula: "",
    rfc: "",
    curp: "",
    direccion: "",
    tel: "",
    email: "",
    empresaResponsable: ""
  };

  // -------------------------------------------------------------------
  // 2) CATÁLOGO DE SUSTANCIAS (valores estándar CRETIB / CAS)
  //    Sólo se ajustan capacidad y proveedor por proyecto.
  // -------------------------------------------------------------------
  const SUSTANCIAS = {
    "Gasolina regular":  { tanqueId:"T-01", estado:"Líquido", categoria:"Inflamable", cretib:"I (Inflamable)", cas:"86290-81-5" },
    "Gasolina Premium":  { tanqueId:"T-02", estado:"Líquido", categoria:"Inflamable", cretib:"I (Inflamable)", cas:"86290-81-5" },
    "Diésel Automotriz": { tanqueId:"T-03", estado:"Líquido", categoria:"Combustible", cretib:"I (Inflamable)", cas:"68334-30-5" }
  };

  // Valores default para III.2.2 y III.2.3 (el usuario puede editar/agregar filas)
  const SUS_CONSTRUCCION_DEFAULT = [
    { prod:"Pintura anticorrosiva", vol:"", estado:"Líquido", cretib:"I, T", cas:"7732-18-5",   area:"Tanques, líneas",    prov:"" },
    { prod:"Soldadura Flux-Core",   vol:"", estado:"Sólido",  cretib:"I",    cas:"1338-85-2",   area:"Conexiones, bridas", prov:"" },
    { prod:"Diésel (equipos obra)", vol:"", estado:"Líquido", cretib:"I",    cas:"68476-34-6",  area:"Maquinaria pesada",  prov:"" }
  ];
  const SUS_OPERACION_DEFAULT = [
    { prod:"Aceite lubricante SAE 20W-50", vol:"", estado:"Líquido", cretib:"T, H", cas:"64742-88-7", area:"Bombas de trasiego",    prov:"" },
    { prod:"Solvente limpieza SRV",        vol:"", estado:"Líquido", cretib:"I, T", cas:"71-36-3",    area:"Sistema de vapores",   prov:"" },
    { prod:"Diésel para generador backup", vol:"", estado:"Líquido", cretib:"I",    cas:"68476-34-6", area:"Generador de respaldo", prov:"" }
  ];

  // -------------------------------------------------------------------
  // 3a) DEFAULTS III.3 — Residuos y Ruido
  // -------------------------------------------------------------------
  const RESIDUOS_DEFAULT = [
    { tipo:"RSU (cartón, vidrio, plástico)",              etapa:"Operación",    gen:"500 kg/año",  clas:"Reciclable",                        gest:"Acopio + reciclador municipal",                gestor:"Por definir" },
    { tipo:"RME (filtros, trapos, aserrín contaminados)", etapa:"Operación",    gen:"150 kg/año",  clas:"NOM-001-ASEA-2019",                 gest:"Almacén temporal ≤72 h + empresa autorizada",  gestor:"Por definir" },
    { tipo:"RP (aceites lubricantes usados)",             etapa:"Operación",    gen:"100 l/año",   clas:"CRETIB – NOM-052-SEMARNAT-2005",    gest:"Manifiestos + empresa recicladora de RP",      gestor:"Por definir" },
    { tipo:"RCD (escombro, concreto, acero)",             etapa:"Construcción", gen:"50 m³ (est)", clas:"Concreto, acero, tierra",           gest:"Acopio en sitio + gestor RCD municipal",       gestor:"Por definir" }
  ];

  const RUIDO_DEFAULT = [
    { fuente:"Bomba de trasiego",           db:"75",    ubi:"Cuarto de máquinas",  freq:"Diaria, 1–2 h",    cumpl:"Recinto cerrado — dentro de límite NOM-081 (65 dB día)" },
    { fuente:"Compresor de aire",           db:"78",    ubi:"Cuarto de máquinas",  freq:"Diaria, 0.5–1 h",  cumpl:"Aislamiento acústico — dentro de límite NOM-081" },
    { fuente:"Tráfico vehicular clientes",  db:"70–75", ubi:"Acceso vehicular",    freq:"Continua",          cumpl:"Fuente móvil exterior — aceptable en zona comercial" },
    { fuente:"Dispensadores (bombas)",      db:"60–65", ubi:"Islote central",      freq:"Diaria",            cumpl:"Bajo límite NOM-081 (65 dB día)" }
  ];

  // -------------------------------------------------------------------
  // 3b) DEFAULTS III.4 — Abióticos (columnas: parámetro / valor)
  //     El usuario llena los valores desde INEGI/CONAGUA/SMN
  // -------------------------------------------------------------------
  const CLIMA_DEFAULT = [
    { param:"Código Köppen-García",      val:"" },
    { param:"Descripción",               val:"" },
    { param:"Temperatura media anual",   val:"" },
    { param:"Precipitación media anual", val:"" },
    { param:"Temporada de lluvias",      val:"" }
  ];
  const SUELO_DEFAULT = [
    { param:"Unidad de suelo (FAO-INEGI)",                   val:"" },
    { param:"Descripción / características",                  val:"" },
    { param:"Vulnerabilidad a contaminación por HC",          val:"" }
  ];
  const GEOMORFO_DEFAULT = [
    { geoforma:"Llanura aluvial / planicie", desc:"Superficie plana; baja pendiente; compactación variable; riesgo de inundación", ai:"" },
    { geoforma:"Lomerío suave",              desc:"Elevaciones onduladas con pendiente < 15 %; sin riesgo de deslizamiento significativo", ai:"" },
    { geoforma:"Procesos / riesgos activos", desc:"Inundación / erosión / subsidencia (especificar si aplica o indicar N/A)", ai:"" }
  ];
  const HIDRO_DEFAULT = [
    { param:"Región Hidrológica",             val:"" },
    { param:"Cuenca hidrológica",             val:"" },
    { param:"Subcuenca",                      val:"" }
  ];
  const ACUIFERO_DEFAULT = [
    { param:"Nombre y clave CONAGUA",                         val:"" },
    { param:"Disponibilidad media anual (DAS, Mm³/año)",      val:"" },
    { param:"Profundidad al nivel freático (m)",              val:"" },
    { param:"Vulnerabilidad a infiltración de hidrocarburos", val:"" }
  ];
  const RECEPTORES_DEFAULT = [
    { no:"1", tipo:"", nombre:"", dist:"", dir:"", pob:"", obs:"" },
    { no:"2", tipo:"", nombre:"", dist:"", dir:"", pob:"", obs:"" }
  ];
  const RIESGO_RECEPTORES_DEFAULT = [
    { receptor:"", parametro:"COV / vapores de combustibles (SRV)", nivel:"Bajo-Medio", justif:"" },
    { receptor:"", parametro:"Ruido operacional (NOM-081)",         nivel:"Bajo",       justif:"" },
    { receptor:"", parametro:"Derrame accidental de HC",            nivel:"Bajo",       justif:"" }
  ];

  // III.4.3 Observadas en campo (distintas de las bibliográficas CONABIO)
  const FLORA_OBSERVADA_DEFAULT = [
    { nombre_comun:"", nombre_cientifico:"", ubicacion:"", cobertura:"", nom059:"" },
    { nombre_comun:"", nombre_cientifico:"", ubicacion:"", cobertura:"", nom059:"" }
  ];
  const FAUNA_OBSERVADA_DEFAULT = [
    { grupo:"Ave",      especie:"", comun:"", ubicacion:"", nom059:"Sin estatus", comportamiento:"" },
    { grupo:"Mamífero", especie:"", comun:"", ubicacion:"", nom059:"Sin estatus", comportamiento:"" }
  ];

  // III.4.4 Socioeconómico — fuente INEGI Censo 2020
  const POBLACION_DEFAULT = [
    { anio:"2010", mujeres:"", hombres:"", total:"" },
    { anio:"2015", mujeres:"", hombres:"", total:"" },
    { anio:"2020", mujeres:"", hombres:"", total:"" }
  ];
  const PIRAMIDE_DEFAULT = [
    { franja:"0–14 años",   mujeres:"", hombres:"", total:"" },
    { franja:"15–29 años",  mujeres:"", hombres:"", total:"" },
    { franja:"30–44 años",  mujeres:"", hombres:"", total:"" },
    { franja:"45–59 años",  mujeres:"", hombres:"", total:"" },
    { franja:"60–74 años",  mujeres:"", hombres:"", total:"" },
    { franja:"75 años y más", mujeres:"", hombres:"", total:"" }
  ];
  const OTROS_DEMOG_DEFAULT = [
    { indicador:"Índice de fecundidad (hijos por mujer)",      valor:"" },
    { indicador:"Población indígena (%)",                       valor:"" },
    { indicador:"Población ocupada >12 años (%)",               valor:"" },
    { indicador:"Viviendas particulares habitadas",             valor:"" },
    { indicador:"Viviendas con energía eléctrica (%)",          valor:"" },
    { indicador:"Viviendas con agua entubada en la red (%)",    valor:"" },
    { indicador:"Viviendas con drenaje o excusado (%)",         valor:"" },
    { indicador:"Viviendas con internet (%)",                   valor:"" }
  ];

  // III.5 Identificación de impactos — resumen y balance
  const IMPACTOS_RESUMEN_DEFAULT = [
    { etapa:"Preparación de sitio y construcción", positivos:"", negativos:"", total:"" },
    { etapa:"Operación y mantenimiento",            positivos:"", negativos:"", total:"" },
    { etapa:"Abandono de sitio",                   positivos:"", negativos:"", total:"" },
    { etapa:"Total",                               positivos:"", negativos:"", total:"" }
  ];
  const IMPACTOS_BALANCE_DEFAULT = [
    { medio:"Físico (suelo, agua, aire, ruido)", sig_neg:"", sig_pos:"", balance:"", altos:"", medios:"" },
    { medio:"Biótico (flora, fauna)",            sig_neg:"", sig_pos:"", balance:"", altos:"", medios:"" },
    { medio:"Socioeconómico y perceptual",        sig_neg:"", sig_pos:"", balance:"", altos:"", medios:"" },
    { medio:"Total",                              sig_neg:"", sig_pos:"", balance:"", altos:"", medios:"" }
  ];

  // III.5.3 Acciones del proyecto (catálogo para la matriz de Leopold)
  const ACCIONES_PROYECTO_DEFAULT = [
    { codigo:"C01", etapa:"Construcción", accion:"Limpieza y desmonte del terreno",          desc:"Retiro de vegetación superficial y nivelación preliminar",                              params:"1–2 semanas; maquinaria pesada; área del predio" },
    { codigo:"C02", etapa:"Construcción", accion:"Excavación",                               desc:"Remoción de suelo para cimentación y registro de tanques (~50 m³; Prof. 1.5–3 m)",     params:"2 semanas; 50 m³ material" },
    { codigo:"C03", etapa:"Construcción", accion:"Cimentación",                              desc:"Construcción de zapatas, losa y pilotes de concreto (f'c 200 kg/cm²)",                 params:"2 semanas; concreto y acero de refuerzo" },
    { codigo:"C04", etapa:"Construcción", accion:"Obra civil (edificios y cubierta)",        desc:"Construcción de oficinas, baños y cubierta de islas de despacho",                      params:"4–6 semanas; albañilería y estructura metálica" },
    { codigo:"C05", etapa:"Construcción", accion:"Instalación de tanques",                   desc:"Posicionamiento y conexión de 3 tanques de acero de doble pared (T-01, T-02, T-03)",  params:"1 semana; grúa de carga" },
    { codigo:"C06", etapa:"Construcción", accion:"Tendido de tuberías",                      desc:"Instalación de líneas de succión y descarga soterradas y aéreas (doble pared)",        params:"2 semanas; longitud según P&ID" },
    { codigo:"C07", etapa:"Construcción", accion:"Instalación del sistema SRV",              desc:"Montaje del sistema de recuperación de vapores Fase I",                                params:"1 semana; eficiencia ≥95 % (NOM-004-ASEA-2017)" },
    { codigo:"C08", etapa:"Construcción", accion:"Instalación de dispensadores",             desc:"Montaje de dispensadores y conexiones eléctricas/mecánicas",                           params:"1–2 semanas; conexión a líneas de combustible" },
    { codigo:"C09", etapa:"Construcción", accion:"Pruebas de hermeticidad",                  desc:"Prueba de presión en tanques y líneas previo al llenado inicial",                      params:"1–2 días; conforme NOM-016-ASEA-2017" },
    { codigo:"C10", etapa:"Construcción", accion:"Limpieza final y retiro de obra",          desc:"Retiro de escombros, materiales sobrantes y señalización de obra",                    params:"1 semana; disposición en sitios autorizados" },
    { codigo:"O01", etapa:"Operación",    accion:"Descarga del autotanque",                  desc:"Recepción de combustible en tanques de almacenamiento desde autotanque",               params:"1–2 veces/semana; 5,000–8,000 gal/evento; 30 min" },
    { codigo:"O02", etapa:"Operación",    accion:"Almacenamiento de combustibles",           desc:"Resguardo de gasolina y diésel en tanques T-01, T-02 y T-03",                         params:"Continuo; presión 0 PSI; temperatura 15–35 °C" },
    { codigo:"O03", etapa:"Operación",    accion:"Despacho de gasolina regular",             desc:"Venta de gasolina regular mediante dispensadores en islas",                            params:"Continuo; ~200 veh/día; 5 L/min" },
    { codigo:"O04", etapa:"Operación",    accion:"Despacho de gasolina premium / diésel",   desc:"Venta de combustible de mayor octanaje y diésel según demanda",                       params:"Continuo; flujo variable" },
    { codigo:"O05", etapa:"Operación",    accion:"Operación del SRV (Fase I)",               desc:"Funcionamiento continuo del sistema de recuperación de vapores de combustible",        params:"Continuo; eficiencia ≥95 %; control automático" },
    { codigo:"O06", etapa:"Operación",    accion:"Consumo de agua / aguas residuales",       desc:"Agua potable para baños e islas; drenaje a alcantarillado con trampa de grasas",      params:"~1–2 m³/día; NOM-002-CONAGUA" },
    { codigo:"O07", etapa:"Operación",    accion:"Generación de residuos peligrosos",        desc:"Aceites usados, trapos contaminados, filtros y envases vacíos de HC",                  params:"~100 L aceite/año; manifiestos SEMARNAT (NOM-052)" },
    { codigo:"O08", etapa:"Operación",    accion:"Generación de residuos sólidos urbanos",   desc:"RSU de operación administrativa y limpieza de islas y baños",                         params:"~2 kg/día; servicio municipal de recolección" },
    { codigo:"O09", etapa:"Operación",    accion:"Mantenimiento preventivo de equipos",      desc:"Cambio de aceite, filtros, calibración de dispensadores y verificación del SRV",      params:"Trimestral/semestral; genera RP temporales" },
    { codigo:"O10", etapa:"Operación",    accion:"Tráfico vehicular de clientes",            desc:"Flujo de vehículos al predio, circulación en islas y salida a vía pública",           params:"~200 veh/día; 1–2 autotanques/semana" },
    { codigo:"A01", etapa:"Abandono",     accion:"Desgasificación e inertización de tanques",desc:"Purga de vapores con N₂ previo al retiro mecánico de los tanques",                    params:"2–3 días/tanque; LEL <10 %; certificado UV (ASEA)" },
    { codigo:"A02", etapa:"Abandono",     accion:"Retiro de tanques",                        desc:"Extracción mecánica de los 3 tanques con grúa y disposición como RP o chatarra",      params:"3 días; levante controlado; grúa >10 ton" },
    { codigo:"A03", etapa:"Abandono",     accion:"Retiro de tuberías y líneas",              desc:"Extracción de tuberías soterradas y aéreas mediante excavación puntual",              params:"1–2 semanas; disposición en reciclaje de metal" },
    { codigo:"A04", etapa:"Abandono",     accion:"Desinstalación de dispensadores y SRV",   desc:"Desmontaje eléctrico y mecánico de dispensadores y sistema SRV",                      params:"1 semana; desconexión segura bajo LOTO" },
    { codigo:"A05", etapa:"Abandono",     accion:"Demolición de estructuras civiles",        desc:"Demolición de edificios, cubierta de islas y losa de concreto",                       params:"2–4 semanas; escombro clasificado como RCD" },
    { codigo:"A06", etapa:"Abandono",     accion:"Gestión de fondos de tanque (RP)",         desc:"Muestreo TCLP de fondos y disposición final como residuo peligroso",                  params:"1–2 días; gestor autorizado SEMARNAT" },
    { codigo:"A07", etapa:"Abandono",     accion:"Muestreo confirmatorio de suelo y restitución", desc:"Muestreo post-retiro de equipos + nivelación y revegetación del predio",         params:"3–4 semanas; lab acreditado NMX-EC-17025; EPA 8015" }
  ];

  // III.5.6 Impactos significativos (ISIG ≥ 40) — tabla resumen Gómez-Orea
  const IMPACTOS_SIGNIFICATIVOS_DEFAULT = [
    { codigo:"", accion:"", factor:"", m:"", e:"", d:"", r:"", p:"", a:"", s:"", isig:"", semaforo:"", desc:"" },
    { codigo:"", accion:"", factor:"", m:"", e:"", d:"", r:"", p:"", a:"", s:"", isig:"", semaforo:"", desc:"" },
    { codigo:"", accion:"", factor:"", m:"", e:"", d:"", r:"", p:"", a:"", s:"", isig:"", semaforo:"", desc:"" },
    { codigo:"", accion:"", factor:"", m:"", e:"", d:"", r:"", p:"", a:"", s:"", isig:"", semaforo:"", desc:"" },
    { codigo:"", accion:"", factor:"", m:"", e:"", d:"", r:"", p:"", a:"", s:"", isig:"", semaforo:"", desc:"" },
    { codigo:"", accion:"", factor:"", m:"", e:"", d:"", r:"", p:"", a:"", s:"", isig:"", semaforo:"", desc:"" }
  ];

  // ─── IV. Abandono del sitio ────────────────────────────────────────────────

  // IV.1 Gatillos de cierre
  const GATILLOS_DEFAULT = [
    { gatillo:"Fin de vida útil operativa (25 años)", tipo:"Cierre completo permanente", alcance:"Retiro equipos, demolición estructuras, remediación suelo", ventana:"Meses 1–3 post-operación", justif:"Desgaste infraestructura, obsolescencia tecnológica" },
    { gatillo:"Pérdida de rentabilidad (caída demanda >50 %)", tipo:"Cierre temporal o permanente", alcance:"Retiro tanques, retención estructuras provisional", ventana:"En cualquier momento", justif:"Cambio de mercado energético" },
    { gatillo:"Daño catastrófico (incendio, explosión)", tipo:"Cierre de emergencia", alcance:"Evacuación, contención inmediata, remediación urgente", ventana:"0–2 semanas post-evento", justif:"Evento mayor de seguridad" },
    { gatillo:"Orden de autoridad (incumplimiento ASEA/SEMARNAT)", tipo:"Cierre forzoso", alcance:"Cierre completo bajo supervisión regulatoria", ventana:"30 días (típico)", justif:"Sanciones por incumplimiento crónico" },
    { gatillo:"Cambio de política energética (ej. prohibición combustibles fósiles)", tipo:"Cierre planificado adelantado", alcance:"Retiro gradual de operación, reconversión o cierre ordenado", ventana:"2–3 años previo a fecha legal", justif:"Política pública transición energética" }
  ];

  // IV.2 Acciones de cierre por componente
  const ACCIONES_CIERRE_DEFAULT = [
    { componente:"Tanque T-01 (Gasolina Regular, acero)", accion:"Desgasificación N₂ → Inercia → Retiro mecánico", especif:"Purga vapores 2–3 días. LEL <10 % antes de retiro. Corte líneas. Levante con grúa.", evidencia:"Certificado desgasificación + reportes LEL diarios + fotos + manifiesto", uv:"Sí (UV verifica LEL)", obs:"Fondos: muestreo TCLP si sospecha de contaminación" },
    { componente:"Tanque T-02 (Gasolina Premium, acero)", accion:"Ídem T-01", especif:"Ídem T-01", evidencia:"Ídem T-01", uv:"Sí", obs:"Ídem" },
    { componente:"Tanque T-03 (Diésel Automotriz, acero)", accion:"Ídem T-01", especif:"Menos volátil que gasolina — igual procedimiento desgasificación", evidencia:"Ídem T-01", uv:"Sí", obs:"Menor riesgo VOC; mayor riesgo sedimentos RP" },
    { componente:"Líneas subterráneas (succión, descarga, retorno vapor)", accion:"Purga con aire comprimido → Retiro mecánico", especif:"Purga de gases. Corte en puntos clave. Extracción tubería soterrada (~50–75 m). Disposición acero.", evidencia:"Fotos retiro. Certificado disposición. Plano zanjas rellenas.", uv:"No", obs:"Profundidad 1–1.5 m; relleno con material inerte" },
    { componente:"Sistema SRV completo (cúpulas, líneas de vapor, absorber)", accion:"Desmontaje → Retiro a sitio autorizado", especif:"Desinstalación SRV, mangueras, cúpulas dispensadores. Disposición si fuera de uso.", evidencia:"Fotos desmontaje. Certificado disposición.", uv:"No", obs:"Reutilización posible si estado lo permite" },
    { componente:"Dispensadores (surtidores)", accion:"Desmontaje completo", especif:"Corte eléctrico previo. Desmontaje mecánico. Disposición RAEE o reventa.", evidencia:"Fotos. Certificado disposición o carta de venta.", uv:"No", obs:"Verificar residuo hidrocarburo en mangueras antes de retiro" },
    { componente:"Edificios (oficina, servicios, caseta)", accion:"Demolición completa", especif:"Abatimiento estructuras. Segregación RCD (concreto, acero, mixtos). Acopio ≤2 semanas.", evidencia:"Fotos demolición. Manifiestos RCD. Certificado gestor.", uv:"Ocasional (inspección final)", obs:"RCD ~20–30 m³ estimado" },
    { componente:"Piso / pavimento (islotes, aceras)", accion:"Demolición total", especif:"Si antecedentes de derrame: excavación selectiva + muestreo suelo. Si limpio: demolición mecánica.", evidencia:"Fotos excavación. Certificado muestreo suelo.", uv:"Sí (si muestreo requerido)", obs:"Criterio: historial de derrames en zona" },
    { componente:"Drenaje sanitario (fosa séptica)", accion:"Vaciado y disposición → Retiro físico", especif:"Bombeo lodos. Transporte autorizado. Desinstalación PVC. Relleno con material inerte.", evidencia:"Manifiestos lodos. Certificado planta tratamiento. Fotos.", uv:"No (salvo RP detectado)", obs:"Bajo riesgo si fosa fue mantenida regularmente" },
    { componente:"Área general (suelo bajo tanques y líneas)", accion:"Muestreo confirmatorio → Remediación si aplica", especif:"Grid 4–5 puntos (IV.5). Análisis TPH, BTEX, metales. Si >límites SEMARNAT: excavación RP o remediación in situ.", evidencia:"Reporte laboratorio acreditado NMX-EC-17025. Planos antes-después.", uv:"Sí (si remediación requerida)", obs:"Costo: $0 si limpio / $50 k+ si contaminado" },
    { componente:"Servicios (energía eléctrica, agua)", accion:"Desconexión formal ante CFE y municipio", especif:"Aviso CFE: corte energía (30 días previo). Aviso municipio: corte agua (10 días previo).", evidencia:"Acuses CFE. Acuses municipio.", uv:"No", obs:"Trámite administrativo previo al inicio de demoliciones" }
  ];

  // IV.4 Residuos generados durante cierre
  const RESIDUOS_CIERRE_DEFAULT = [
    { residuo:"Fondos de tanques (agua emulsionada, sedimentos HC)", clas:"RP presunto — verificar TCLP (NOM-052-SEMARNAT-2005)", vol:"50–200 l/tanque", gestion:"Manifiestos SEMARNAT. Empresa gestora RP autorizada. Disposición en celda confinada.", gestor:"Por definir (empresa RP autorizada)" },
    { residuo:"Aguas de enjuague y limpieza de tanques/líneas", clas:"Agua residual con HC (RP si contaminada)", vol:"500–1,000 l total", gestion:"Si contaminada: manifiestos + gestor. Si limpia: descarga autorizada drenaje municipal.", gestor:"Por definir" },
    { residuo:"Residuos de Construcción y Demolición (RCD — concreto, acero, mezcla)", clas:"RCD (no peligroso)", vol:"20–50 m³ estimado", gestion:"Segregación en sitio. Acopio ≤2 semanas. Contrato con gestor RCD municipal.", gestor:"Por definir (gestor RCD autorizado)" },
    { residuo:"Residuos peligrosos de mantenimiento (filtros, mangueras contaminadas, trapos)", clas:"RME/RP — NOM-001-ASEA-2019 / NOM-052-SEMARNAT-2005", vol:"100–200 kg estimado", gestion:"Almacén temporal <72 h. Manifiestos SEMARNAT. Empresa gestora autorizada.", gestor:"Por definir" }
  ];

  // IV.5 Puntos de muestreo confirmatorio de suelos
  const MUESTREO_SUELO_DEFAULT = [
    { punto:"M-01", ubicacion:"Bajo tanque T-01 (gasolina regular) — zona máximo riesgo", prof:"0–0.5 m + 1–2 m", analitos:"TPH, BTEX (benceno, tolueno, xilenos), Pb, Zn, Ni" },
    { punto:"M-02", ubicacion:"Bajo tanque T-03 (diésel automotriz)", prof:"0–0.5 m + 1–2 m", analitos:"TPH, BTEX, metales (Pb, Ni, Zn)" },
    { punto:"M-03", ubicacion:"Bajo área de dispensadores (donde ocurren derrames menores)", prof:"0–0.5 m + 1–2 m", analitos:"TPH, BTEX, VOC (EPA 8015B / 8260C)" },
    { punto:"M-C", ubicacion:"Punto control (≥50 m fuera del predio — línea base)", prof:"0–0.5 m", analitos:"TPH, BTEX, metales (referencia)" }
  ];

  // IV.6 Restitución y post-cierre
  const RESTITUCION_DEFAULT = [
    { accion:"Relleno de zanjas (tuberías retiradas)", especif:"Material inerte (grava, arena, suelo limpio). Compactación en capas de 20 cm. Prueba Proctor estándar.", cantidad:"~50 m lineal de zanjas, 1.5 m profundidad", verif:"Fotos antes-después. Reporte compactación (densidad ≥90 %)", resp:"Contratista civil" },
    { accion:"Relleno de excavaciones (tanques)", especif:"Mismo criterio que zanjas. Nivelación hasta cota original.", cantidad:"~100 m³ estimado (3 tanques)", verif:"Plano topográfico antes-después. Fotos.", resp:"Contratista civil" },
    { accion:"Nivelación general del terreno", especif:"Topografía final conforme al nivel del terreno circundante. Sin depresiones. Drenaje superficial hacia zona baja.", cantidad:"Toda la superficie del predio (~2,500 m²)", verif:"Plano topográfico firmado. Mediciones de cota.", resp:"Topógrafo + contratista" },
    { accion:"Revegetación con especies nativas (si aplica)", especif:"Plantación de especies nativas conforme al paisaje local. Mínimo 30 árboles + cobertura herbácea. Riego de establecimiento 6 meses.", cantidad:"Área verde ~500 m² (según uso posterior)", verif:"Fotos plantación. Conteo de árboles. Registro de riego.", resp:"Contratista forestal / promovente" },
    { accion:"Señalización post-cierre", especif:"Placa informativa: 'Sitio remediado. Ex-estación de servicio. Monitoreo post-cierre hasta [año+5].' Con coordenadas para muestreos futuros.", cantidad:"1 placa permanente", verif:"Foto de placa. Croquis de ubicación.", resp:"Gerencia / promovente" },
    { accion:"Cierre del perímetro y liberación al propietario", especif:"Retiro de barda perimetral, señalización de obra y cualquier restricción de acceso temporal. Transferencia formal del sitio al propietario con acta de entrega.", cantidad:"Todo el perímetro del predio", verif:"Acta de entrega-recepción firmada por propietario y responsable técnico. Fotos de sitio liberado.", resp:"Promovente / gerencia" }
  ];

  // IV.7 Criterios de finalización / aceptación
  const CRITERIOS_CIERRE_DEFAULT = [
    { actividad:"Desgasificación de tanques", criterio:"Certificado de desgasificación firmado por UV acreditada. LEL <10 % documentado en todos los puntos.", evidencia:"Certificado UV + reportes LEL diarios por tanque" },
    { actividad:"Retiro de equipos e infraestructura", criterio:"100 % de equipos removidos del sitio. Sitio vacío verificado.", evidencia:"Fotos sitio vacío. Manifiestos de disposición de equipos." },
    { actividad:"Gestión de RP fondos de tanques", criterio:"Muestreo TCLP completado. Residuos dispuestos conforme a resultado (RP o RME).", evidencia:"Reporte laboratorio acreditado + manifiestos SEMARNAT (si RP)." },
    { actividad:"Muestreo confirmatorio de suelos", criterio:"Análisis de laboratorio completado. Suelo cumple criterios SEMARNAT para uso industrial/comercial, o sitio remediado.", evidencia:"Reporte laboratorio NMX-EC-17025 + plano de ubicación de muestras." },
    { actividad:"Gestión de RCD", criterio:"100 % de escombro en disposición final. Contratos y manifiestos emitidos.", evidencia:"Certificado de gestor RCD." },
    { actividad:"Desconexión de servicios", criterio:"Energía eléctrica, agua y drenaje desconectados formalmente.", evidencia:"Acuses CFE, municipio y CONAGUA (si aplica)." },
    { actividad:"Restitución del terreno", criterio:"Terreno nivelado, drenaje superficial funcional. Revegetación establecida (si aplica).", evidencia:"Plano topográfico + fotos post-cierre." },
    { actividad:"Cierre administrativo", criterio:"ASEA notificada conforme Art. 34 REIA. Licencia municipal cancelada.", evidencia:"Acuses ASEA + municipio." },
    { actividad:"Documentación del expediente de cierre", criterio:"Carpeta de cierre ordenada (digital + físico), disponible para futuras auditorías por 10 años.", evidencia:"Índice de expediente con todos los documentos." }
  ];

  // IV.8 Avisos y cierres administrativos
  const AVISOS_CIERRE_DEFAULT = [
    { autoridad:"ASEA (Dirección de Evaluación Ambiental)", que:"Aviso de cierre conforme Art. 34 REIA. Incluir: expediente, cronograma, plan de muestreo de suelo.", plazo:"30 días antes del inicio de demoliciones", accion:"Envío por mensajería certificada a ASEA. Solicitar acuse / no objeción.", evidencia:"Acuse ASEA (resolución de no objeción o condicionante)" },
    { autoridad:"Municipio (Desarrollo Urbano + Protección Civil)", que:"Comunicado de cierre. Solicitud de cancelación de licencia de funcionamiento. Permiso de demolición.", plazo:"10 días antes del inicio de demoliciones", accion:"Dirigido a Secretaría de Desarrollo Urbano y Protección Civil municipal.", evidencia:"Acuse de recepción municipal." },
    { autoridad:"CONAGUA (Dirección Local)", que:"Aviso de cierre si había permiso de descarga o extracción de agua. Notificación de abandono de fuente subterránea (si existía).", plazo:"15 días antes de cierre", accion:"Dirigido a CONAGUA delegación estatal.", evidencia:"Acuse CONAGUA." },
    { autoridad:"CFE / Comisión de Agua Municipal", que:"Solicitud de corte definitivo de suministro de energía eléctrica y agua potable.", plazo:"30 días previo al inicio de obras", accion:"Trámite ante ventanilla de CFE y comisión de agua. Coordinar fecha de apagado.", evidencia:"Certificados de corte de CFE y municipio." },
    { autoridad:"Vecindario (opcional pero recomendado)", que:"Comunicado informativo: aviso de cierre, cronograma, contacto de emergencia.", plazo:"15 días previo al inicio de obras de demolición", accion:"Distribución de volante. Reunión comunitaria si hay alta sensibilidad social.", evidencia:"Registro de entrega. Actas de reunión." },
    { autoridad:"Autoridades sanitarias (IMSS / Secretaría de Salud) — condicional", que:"Reportes de accidentes ocupacionales ocurridos durante la operación del sitio, si los hubiere.", plazo:"Según ocurrencia del incidente", accion:"Aplica solo si existió accidente de trabajo o incidente con lesionados durante la operación. Documentar y reportar conforme a la Ley Federal del Trabajo y normativa del IMSS.", evidencia:"Reportes de incidentes IMSS. Actas de investigación de accidente. N/A si no hubo incidentes." }
  ];

  // V. Conclusión — compromisos clave del promovente (síntesis para Conclusión)
  const COMPROMISOS_FINALES_DEFAULT = [
    { num:"1", compromiso:"Implementar todas las medidas de prevención y mitigación de la Sección III.6 del IP, por etapa y componente ambiental.", etapa:"Todas las etapas", normativa:"LGEEPA Art. 30; NOMs del sector" },
    { num:"2", compromiso:"Ejecutar y dar seguimiento al Programa de Vigilancia Ambiental (PVA) de III.6.1, con registros disponibles para inspección de ASEA en todo momento.", etapa:"Construcción y operación", normativa:"LGEEPA Art. 30 bis; REIA" },
    { num:"3", compromiso:"Gestionar todos los residuos peligrosos generados con empresa autorizada por SEMARNAT, mediante manifiestos y certificados de disposición final.", etapa:"Todas las etapas", normativa:"NOM-052-SEMARNAT-2005; LGPGIR" },
    { num:"4", compromiso:"Mantener el SRV Fase I operativo con eficiencia ≥ 95 %, con dictamen de Unidad de Verificación vigente y registro ante ASEA.", etapa:"Operación", normativa:"NOM-004-ASEA-2017; NOM-016-CRE-2016" },
    { num:"5", compromiso:"Reportar a ASEA cualquier incidente ambiental (derrame, fuga, incendio) en un plazo máximo de 24 horas de ocurrido, con protocolo de atención inmediata documentado.", etapa:"Operación", normativa:"REIA ASEA; LGEEPA Art. 147 bis" },
    { num:"6", compromiso:"Ejecutar el Plan de Abandono del Sitio (Sección IV) al activarse cualquiera de los gatillos de cierre, previo aviso formal a ASEA con mínimo 30 días de anticipación.", etapa:"Cierre / abandono", normativa:"REIA ASEA Art. 34; NOM aplicables" },
    { num:"7", compromiso:"Conservar el expediente del presente IP y todas sus actualizaciones por un mínimo de 10 años, disponible para auditoría o inspección en cualquier momento.", etapa:"Todas las etapas", normativa:"Resolutivo ASEA; LGEEPA Art. 30" }
  ];

  // IV — Cronograma estimado de cierre (3 meses)
  const CRONOGRAMA_CIERRE_DEFAULT = [
    { semana:"Mes 1 — Sem. 1", actividad:"Avisos a autoridades (ASEA, municipio, CONAGUA). Contratación de especialista en desgasificación.", resp:"Promovente / gerencia" },
    { semana:"Mes 1 — Sem. 2", actividad:"Preparación de permisos de trabajo (HOT WORK, Espacio Confinado). LOTO en todos los equipos.", resp:"Supervisor HSE + contratista" },
    { semana:"Mes 1 — Sems. 3–4", actividad:"Desgasificación N₂ de 3 tanques + SRV. Monitoreo LEL diario. Certificado UV.", resp:"Contratista acreditado ASEA" },
    { semana:"Mes 2 — Sems. 1–2", actividad:"Retiro de tanques, líneas y dispensadores. Manifiestos de disposición.", resp:"Contratista + empresa RP (si aplica)" },
    { semana:"Mes 2 — Sems. 3–4", actividad:"Demolición de edificios. Segregación y retiro de RCD. Corte de servicios (CFE, agua).", resp:"Contratista civil" },
    { semana:"Mes 3 — Sems. 1–2", actividad:"Muestreo confirmatorio de suelos (M-01 a M-C). Envío a laboratorio acreditado NMX-EC-17025.", resp:"Ingeniero ambiental + laboratorio" },
    { semana:"Mes 3 — Sem. 3", actividad:"Nivelación topográfica, relleno de zanjas, compactación. Revegetación (si aplica).", resp:"Contratista civil + forestal" },
    { semana:"Mes 3 — Sem. 4", actividad:"Cierre administrativo: cancelación de licencias, presentación de expediente ante ASEA. Liberación del sitio.", resp:"Promovente / gestor técnico" }
  ];

  // III.7 Compromisos ambientales voluntarios
  const COMPROMISOS_DEFAULT = [
    { compromiso:"Señalética ambiental (separación de residuos, ahorro de agua)", responsable:"Gerencia de la estación", plazo:"Construcción", indicador:"Señaléticas instaladas" },
    { compromiso:"Reforestación con especies nativas en área de amortiguamiento",  responsable:"Promovente",              plazo:"Operación",    indicador:"Número de árboles plantados" },
    { compromiso:"Eficiencia energética: luminarias LED y temporizadores",          responsable:"Promovente",              plazo:"Operación",    indicador:"Reducción % consumo kWh/año" },
    { compromiso:"Capacitación en manejo de sustancias peligrosas (NOM-005-STyPS)", responsable:"RRHH / HSE",             plazo:"Anual",        indicador:"Constancias de capacitación" },
    { compromiso:"Monitoreo semestral de calidad de suelo bajo islotes",            responsable:"Responsable técnico",     plazo:"Operación",    indicador:"Informe de laboratorio" }
  ];

  // -------------------------------------------------------------------
  // 4) BOILERPLATE NACIONAL (texto fijo con variables {{...}})
  // -------------------------------------------------------------------
  const BOILER = {
    introduccion:
"El presente Informe Preventivo documenta las características del proyecto “{{proyecto}}”, del sector hidrocarburos, ubicado en {{municipio}}, {{estado}}, así como su vinculación con el marco legal y normativo aplicable, la identificación de sustancias y emisiones relevantes, el diagnóstico del ambiente en su área de influencia, la evaluación de impactos ambientales y las medidas propuestas para su prevención, mitigación y, en su caso, compensación.\n\nLa información se organiza siguiendo la estructura y criterios recomendados por la Guía para la presentación del Informe Preventivo de SEMARNAT y se complementa con metodologías actualizadas de evaluación de impactos y con la normatividad específica emitida para el sector hidrocarburos.",

    poegt_intro:
"El Programa de Ordenamiento Ecológico General del Territorio (POEGT) es el instrumento nacional que formula la Secretaría de Medio Ambiente y Recursos Naturales (SEMARNAT) conforme a la LGEEPA (art. 20 y 20 Bis) para definir la regionalización ecológica del país y establecer lineamientos y estrategias ecológicas para la preservación, protección, restauración y aprovechamiento sustentable de los recursos naturales, así como para orientar la localización de actividades productivas y asentamientos humanos.\n\nEl POEGT fue expedido mediante un acuerdo publicado en el Diario Oficial de la Federación el 07 de septiembre de 2012. El Acuerdo precisa i) la expedición del Programa; ii) su obligatoriedad en todo el territorio nacional y su carácter vinculante para las acciones y programas de la Administración Pública Federal; iii) la obligación de que las dependencias lo observen en sus programas operativos, presupuestos y obra pública; y iv) que SEMARNAT estará a cargo de su ejecución y evaluación.\n\nLa regionalización ecológica se construyó a partir de unidades territoriales sintéticas definidas por factores del medio biofísico (clima, relieve, vegetación y suelo), diferenciando el territorio nacional en 145 Unidades Ambientales Biofísicas (UAB) a escala 1:2,000,000.\n\nEl predio del proyecto de este Informe Preventivo se localiza en la UAB número {{uab}} del POEGT, con clave política número {{clavePolitica}}, en el marco del Ordenamiento Regional número {{ordRegional}}, la Región Ecológica número {{regionEco}}, que corresponde a {{regionEcoNombre}}. El proyecto respeta los supuestos y cumplirá las estrategias correspondientes.",

    pnd:
"El Plan Nacional de Desarrollo (PND) 2025-2030, publicado en el Diario Oficial de la Federación el 15 de abril de 2025, es la guía de los objetivos y acciones del Gobierno de México en los próximos años. Los objetivos descritos en el plan consisten en la transformación del país bajo un modelo de desarrollo con bienestar, justicia social y sustentabilidad. El PND se articula sobre cuatro ejes generales y tres ejes transversales que estructuran la política pública en su conjunto.\n\nEn ese marco, la estación de servicio se relaciona con el PND por la vía de: asegurar el abasto energético en condiciones de confiabilidad y eficiencia (eje de seguridad/eficiencia energética); insertarse en el ordenamiento territorial urbano y la planeación de uso de suelo (eje de ordenamiento territorial); sujetarse a una gestión integral de riesgos acorde con la política nacional de protección civil y cambio climático (eje de riesgos y resiliencia); y observar criterios de sustentabilidad y economía circular en la operación y en el manejo de recursos y residuos (eje de sustentabilidad).\n\nEn consecuencia, para efectos del IP, la evaluación de congruencia del proyecto se realiza respecto a los ejes del PND vigente (2025-2030), dejando asentado que la contribución del proyecto se aprecia en términos de alineación programática: energía/seguridad, ordenamiento del territorio, prevención de riesgos y sustentabilidad; conforme al marco nacional de planeación.",

    parqueIndustrial_no:
"N/A — La obra no fue prevista en un parque industrial; se trata de un predio independiente.",

    mec:
"Los Modelos Ecológicos Conceptuales (MEC) constituyen el principio rector de la planificación e implementación de programas de conservación y restauración. Un MEC sistematiza la evidencia disponible en un esquema conceptual que explicita relaciones causales y rutas de exposición entre componentes físicos, biológicos y antrópicos; jerarquiza procesos, delimita lagunas críticas de información y formula hipótesis causales contrastables sobre la génesis y la direccionalidad de los cambios (presentes y potenciales) inducidos por la actividad humana.\n\nEl MEC se estructura en cuatro componentes principales: (1) Factores controladores — forzamientos exógenos al sistema (naturales o antrópicos); (2) Agentes estresantes — perturbaciones físicas o químicas que modifican estructura y funcionamiento; (3) Efectos ecológicos — respuestas del sistema observables como variaciones de estado o función; y (4) Atributos (indicadores) — variables representativas de la condición ecológica seleccionadas por su sensibilidad, especificidad, trazabilidad y viabilidad de monitoreo.\n\nEl MEC formaliza la arquitectura causal —de factores controladores → estresores → efectos → atributos— y se acompaña de un diagrama de flujo que delimita nodos, vínculos y escalas de acción, proporcionando trazabilidad para la priorización de medidas, el diseño del monitoreo y la sustentación de la evaluación ambiental.",

    metodologia:
"La evaluación de los impactos ambientales depende de una adecuada identificación de los cambios potenciales al ambiente, por lo que es necesario conocer los objetivos, así como las obras y actividades que se realizarán en las diferentes etapas del proyecto “{{proyecto}}”. Esta identificación representa una actividad crítica en el Proceso de Evaluación del Impacto Ambiental (PEIA).\n\nCon la finalidad de realizar una identificación y evaluación eficaz de los impactos ambientales, se emplea una metodología matricial compuesta de un análisis cuantitativo y cualitativo. La identificación y cuantificación de impactos por cada interacción entre las actividades del proyecto y los aspectos ambientales se realiza con (i) la Matriz de Leopold (1971) adaptada, cuadro de doble entrada en el que se disponen las acciones del proyecto y los factores ambientales receptores, asignando un criterio (0-5) de Magnitud con signo (−/+).\n\nLa valoración por atributos emplea (ii) la técnica de Gómez-Orea (1999) adaptada: Magnitud (M), Extensión (E), Duración (D), Reversibilidad (R), Probabilidad/Frecuencia (P), Acumulación (A), Sinergia (S) e Importancia del receptor (Imp). Los valores se normalizan a 0-1 y se calculan (iii) índices de síntesis: Intensidad (III), Índice Básico (IB), Condicionantes (C), Índice Complementario (IC), su normalización (ICn 0-100) y la Significancia (ISIG = ICn × Imp/5). La significancia se clasifica en una escala tipo semáforo (Bajo, Bajo-Medio, Medio, Alto, Muy Alto) y se concentra en (iv) la matriz de resultados.\n\nEn general, Leopold aporta la identificación y trazabilidad; los índices aportan consistencia y comparabilidad entre interacciones. Este enfoque es trazable, auditable y compatible con lo que la Guía de IP pide al promovente que documente.",

    conclusion:
"Este Informe Preventivo se presenta para evaluación de la ASEA, considerando que el proyecto cumple con los criterios establecidos para ser evaluado mediante este instrumento, y no requiere Manifestación de Impacto Ambiental, salvo indicación en contrario por parte de la autoridad.",

    // --- V. CONCLUSIÓN (bloques por subsección) ---
    conclusion_caracter:
"El proyecto \"{{proyecto}}\" se encuadra en el supuesto del Artículo 28, fracción X (Sector Energía / Hidrocarburos) de la Ley General del Equilibrio Ecológico y la Protección al Ambiente (LGEEPA), al tratarse de una estación de servicio para la distribución y despacho de combustibles líquidos. Conforme al Artículo 31 del Reglamento en Materia de Evaluación del Impacto Ambiental (REIA) y a las disposiciones sectoriales emitidas por la Agencia de Seguridad, Energía y Ambiente (ASEA), el proyecto se encuentra en supuesto de presentación de Informe Preventivo (IP), y no de Manifestación de Impacto Ambiental (MIA) en modalidad particular o regional, toda vez que se trata de obras y actividades de bajo a moderado impacto ambiental que observan la normatividad sectorial aplicable.\n\nLa presentación del presente Informe Preventivo ante la ASEA tiene por objeto acreditar que el proyecto fue concebido, evaluado y mitigado conforme a los principios de prevención, precaución y sustentabilidad establecidos en la LGEEPA, la Ley de Hidrocarburos y los instrumentos específicos del sector.",

    conclusion_sintesis:
"El proyecto consiste en la construcción, instalación y operación de una estación de servicio para la distribución de gasolinas y diésel, ubicada en {{ubicacion}}. El promovente es {{empresa}}, con representante legal {{repLegal}}. Las instalaciones principales comprenden tanques de almacenamiento subterráneos, sistema de descarga, líneas y dispensadores, Sistema de Recuperación de Vapores (SRV Fase I), trampa de aceite-agua y servicios al público. La superficie del proyecto es de {{superficie}} m², con una inversión estimada de ${{inversion}} MXN, generando {{empleosDir}} empleos directos y {{empleosInd}} empleos indirectos durante la etapa de operación.",

    conclusion_juridico:
"El análisis de vinculación de la Sección II acredita que el proyecto se ajusta al marco jurídico ambiental en los niveles federal, estatal y municipal: (i) A nivel del ordenamiento ecológico federal, el predio se ubica en la UAB {{uab}} del Programa de Ordenamiento Ecológico General del Territorio (POEGT), con clave política {{clavePolitica}}, y las 44 estrategias ecológicas se observan mediante las medidas de la Sección III.6. (ii) Las Normas Oficiales Mexicanas del sector (NOM-004-ASEA-2017 para SRV, NOM-016-CRE-2016 para calidad de combustibles, NOM-081-SEMARNAT-1994 para ruido, NOM-052-SEMARNAT-2005 para residuos peligrosos, entre otras) serán aplicadas en las etapas de construcción, operación y cierre. (iii) El Plan Nacional de Desarrollo 2025–2030 y el plan estatal de {{estado}} respaldan el abasto energético eficiente y la sustentabilidad como ejes de política pública congruentes con el proyecto.",

    conclusion_diagnostico:
"El diagnóstico ambiental del área de influencia (Sección III.4) describe un sistema ambiental ubicado en zona urbana/periurbana del municipio de {{municipio}}, {{estado}}, con predominio de usos de suelo comercial y habitacional, cobertura vegetal escasa o altamente perturbada y ausencia de ecosistemas naturales en el predio y su entorno inmediato. No se identificaron Áreas Naturales Protegidas federales, estatales o municipales, ni sitios RAMSAR, corredores biológicos prioritarios ni hábitat crítico de especies dentro del radio de influencia del proyecto. Las especies de flora y fauna potencialmente presentes en el área corresponden a grupos urbanos adaptados, sin registros de especies en categoría de riesgo conforme a la NOM-059-SEMARNAT-2010 que dependan del predio. El diagnóstico concluye que la situación ambiental preexistente del sitio es compatible con el tipo de proyecto evaluado.",

    conclusion_impactos:
"La evaluación de impactos (Sección III.5) se realizó mediante la Matriz de Leopold adaptada (acciones × factores ambientales) y la metodología de Gómez-Orea mejorada (criterios M, E, D, R, P, A, S, Imp), con cálculo de índices normalizados de significancia (ISIG 0–100). Los impactos de mayor relevancia se concentran en la etapa de preparación de sitio y construcción —emisiones de ruido, partículas y generación de residuos de construcción—, con naturaleza temporal, extensión local y reversibilidad media-alta. En la etapa de operación, el principal impacto negativo es la generación de COV (vapores de combustibles), controlado por el SRV de Fase I con eficiencia ≥ 95 % (NOM-004-ASEA-2017). Los impactos positivos derivados del proyecto —generación de empleo, abasto energético, activación económica local— superan en magnitud acumulada a los negativos residuales. Ningún impacto califica como \"Muy Alto\" (ISIG >80) con las medidas de mitigación implementadas.",

    conclusion_medidas:
"Las medidas de prevención, mitigación y compensación propuestas en la Sección III.6, organizadas por etapa y factor ambiental, son técnicamente factibles, normadas y monitoreables. El Programa de Vigilancia Ambiental (PVA) de la Sección III.6.1 establece indicadores verificables, frecuencias e instancias responsables para garantizar su cumplimiento. Los impactos residuales —una vez aplicadas las medidas— se ubican en los rangos \"Bajo\" a \"Medio\" de la escala ISIG, congruentes con la categoría de instrumento evaluatorio presentado (Informe Preventivo). Las condiciones adicionales para la sustentabilidad de la Sección III.7 refuerzan la viabilidad ambiental del proyecto mediante compromisos voluntarios de buenas prácticas.",

    conclusion_declaratoria:
"El suscrito Responsable Técnico del presente Informe Preventivo, en cumplimiento de lo dispuesto en el Artículo 31 del Reglamento de la LGEEPA en Materia de Evaluación del Impacto Ambiental, declara bajo protesta de decir verdad que: (i) la información contenida en el presente instrumento es verídica y completa; (ii) el proyecto fue diseñado, evaluado y mitigado conforme a la normatividad ambiental sectorial aplicable; (iii) las medidas de prevención, mitigación y las condiciones adicionales propuestas son suficientes para que el proyecto no cause deterioro ambiental severo, irreversible o que supere los umbrales normativos en el área de influencia; y (iv) los compromisos declarados en la Sección V.8 serán cumplidos en los plazos y condiciones señalados.\n\nEl presente Informe Preventivo se somete a la consideración de la Agencia de Seguridad, Energía y Ambiente (ASEA) para su revisión y resolución definitiva, en los términos de los artículos 28 a 35 de la LGEEPA, el REIA y la normatividad específica del sector de hidrocarburos.",

    // --- IV. ABANDONO (párrafos plantilla con variables) ---
    abandono_intro:
"El cierre, desmantelamiento y/o abandono del sitio se realizará de forma segura y ambientalmente responsable, garantizando la prevención de riesgos y la gestión adecuada de residuos, conforme a la legislación aplicable y a las disposiciones técnicas del sector hidrocarburos. Este apartado aplica a las instalaciones (tanques, líneas, dispensarios, trampas, drenajes, área de descarga) ubicadas en {{ubicacion}}, y establece qué se hará, cuándo y con qué evidencia se acreditará el cierre.",
    abandono_iv1:
"El cierre podrá activarse ante los siguientes supuestos: cese definitivo de actividades comerciales u operativas de la estación; reposición total del sistema de almacenamiento (tanques, líneas y sumps); riesgo estructural o falla mayor que requiera retiro de infraestructura; o reubicación/cambio de uso de suelo que imposibilite la operación. Dependiendo del gatillo, el cierre podrá ejecutarse como desmantelamiento total, cierre parcial o abandono controlado, dentro de un periodo estimado de 4 a 12 semanas, conforme al programa operativo.",
    abandono_iv3:
"Previo a cualquier corte o remoción se realizará desgasificado e inertizado, verificación continua de LEL/O₂, aplicación de bloqueo y etiquetado (LOTO) y permisos de trabajo (caliente/frío); se controlarán VOC y electricidad estática mediante puesta a tierra y herramientas adecuadas. Se limpiarán trampas y drenajes, y se procederá a la clausura/cancelación de descargas conforme a los procedimientos del proyecto.",
    abandono_iv8:
"El promovente realizará los avisos y trámites de cierre ante ASEA, Unidad de Verificación, Protección Civil, Municipio y CONAGUA (según corresponda), presentando actas, dictámenes y oficios dentro de los plazos aplicables, y conservará acuses/folios en el expediente."
  };

  // Referencias fijas
  const REFERENCIAS = [
    "USGS (1971). A Procedure for Evaluating Environmental Impact. Geological Survey Circular 645.",
    "UNEP (2002). Environmental Impact Assessment Training Resource Manual, Second edition.",
    "SEMARNAT (2012). Programa de Ordenamiento Ecológico General del Territorio. DOF 07/09/2012.",
    "Gómez Orea, D. (1999). Evaluación de Impacto Ambiental. Ed. Mundi-Prensa.",
    "Leopold, L. et al. (1971). A Procedure for Evaluating Environmental Impact. U.S. Geological Survey."
  ];

  // -------------------------------------------------------------------
  // 4) 44 ESTRATEGIAS POEGT con respuesta estándar (redactada-cerrada)
  //    disposición por defecto + texto estándar para gasolinera.
  // -------------------------------------------------------------------
  const ESTRATEGIAS_POEGT = [
    {n:1,  t:"Conservación in situ de los ecosistemas y su biodiversidad.", d:"No aplica", txt:"La estación de servicio se ubicará en una zona urbana por lo que no presenta impacto sobre las especies y su diversidad."},
    {n:2,  t:"Recuperación de especies en riesgo.", d:"No aplica", txt:"No aplica; no habrá mayor modificación en el ambiente, por lo cual no se encuentran especies en riesgo."},
    {n:3,  t:"Conocimiento, análisis y monitoreo de los ecosistemas y su biodiversidad.", d:"No aplica", txt:"La estación no afecta áreas verdes y fauna silvestre."},
    {n:4,  t:"Aprovechamiento sustentable de ecosistemas, especies y recursos naturales.", d:"Aplica indirectamente", txt:"Los componentes ambientales de la flora y suelo no tendrán mayores modificaciones; se llevarán a cabo actividades de manejo de residuos y, en su caso, mantenimiento de áreas verdes, sin afectación de la fauna silvestre."},
    {n:5,  t:"Aprovechamiento sustentable de los suelos agrícolas y pecuarios.", d:"No aplica", txt:"No aplica; no se contempla el aprovechamiento de suelos agrícolas y pecuarios."},
    {n:6,  t:"Modernizar la infraestructura hidroagrícola y tecnificar las superficies agrícolas.", d:"No aplica", txt:"No aplica; no se pretende el aprovechamiento de recursos agrícolas."},
    {n:7,  t:"Aprovechamiento sustentable de los recursos forestales.", d:"No aplica", txt:"No se pretende el aprovechamiento de recursos forestales."},
    {n:8,  t:"Valoración de los servicios ambientales.", d:"No aplica", txt:"No se verán afectados los servicios ambientales."},
    {n:12, t:"Protección de los ecosistemas.", d:"No aplica", txt:"No se presenta impacto sobre el atributo de ecosistema y su biodiversidad."},
    {n:13, t:"Racionalizar el uso de agroquímicos y promover biofertilizantes.", d:"No aplica", txt:"No aplica; la estación no pretende ocupar agroquímicos o biofertilizantes."},
    {n:14, t:"Restauración de ecosistemas forestales y suelos agropecuarios.", d:"No aplica", txt:"No aplica; no se pretende la restauración de ecosistemas."},
    {n:15, t:"Aplicación de la investigación del sector minero al desarrollo sustentable.", d:"No aplica", txt:"No aplica; no se realizan actividades del sector minero."},
    {n:"15BIS", t:"Coordinación entre los sectores minero y ambiental.", d:"No aplica", txt:"No aplica; no se pretende realizar actividades de aprovechamiento minero."},
    {n:18, t:"Mecanismos de supervisión e inspección y niveles de seguridad en hidrocarburos.", d:"Aplica directamente", txt:"Aplica directamente. La estación de servicio forma parte del sector hidrocarburos, por lo que su operación se encuentra sujeta a inspecciones, supervisión y cumplimiento de la normatividad en materia de seguridad industrial, operativa y protección ambiental, incluyendo programas de mantenimiento, monitoreo y atención a emergencias."},
    {n:24, t:"Mejorar las condiciones de vivienda y entorno de hogares en pobreza.", d:"No aplica", txt:"No aplica de manera directa; el proyecto no corresponde a un programa de vivienda."},
    {n:25, t:"Prevenir, mitigar y atender riesgos naturales y antrópicos.", d:"Aplica indirectamente", txt:"Aplica indirectamente. La estación implementa medidas de prevención y atención de emergencias, así como procedimientos de respuesta ante derrames, fugas, incendios u otros riesgos antrópicos."},
    {n:26, t:"Fortalecer capacidades de adaptación al cambio climático.", d:"Aplica indirectamente", txt:"Aplica indirectamente. El proyecto incorpora medidas de prevención de contaminación y gestión ambiental que contribuyen a disminuir vulnerabilidades y fortalecer la resiliencia frente al cambio climático."},
    {n:27, t:"Incrementar acceso y calidad de agua potable, alcantarillado y saneamiento.", d:"Aplica indirectamente", txt:"Aplica de forma limitada. El proyecto se conecta a la infraestructura existente de agua potable y drenaje, con uso responsable del recurso y manejo adecuado de aguas residuales conforme a la normatividad."},
    {n:28, t:"Consolidar la calidad del agua en la gestión integral del recurso hídrico.", d:"Aplica indirectamente", txt:"Aplica indirectamente. La estación cuenta con medidas de control y prevención para evitar derrames o infiltraciones de hidrocarburos."},
    {n:29, t:"Posicionar el agua como recurso estratégico y de seguridad nacional.", d:"Aplica indirectamente", txt:"Aplica de forma indirecta; el proyecto contribuye a la conservación y protección de este recurso estratégico."},
    {n:31, t:"Condiciones para ciudades y zonas metropolitanas seguras y sustentables.", d:"Aplica indirectamente", txt:"La estación contribuirá con el crecimiento de las ciudades y zonas metropolitanas mediante el abastecimiento de combustible."},
    {n:32, t:"Frenar la expansión desordenada de las ciudades.", d:"Aplica indirectamente", txt:"Aplica indirectamente. El proyecto se desarrolla en un predio con compatibilidad de uso de suelo y dentro de un entorno urbano."},
    {n:35, t:"Mejora de la seguridad social en población rural.", d:"No aplica", txt:"No aplica; el proyecto no se relaciona con programas de seguridad social ni producción rural."},
    {n:36, t:"Diversificación de actividades del sector agroalimentario.", d:"No aplica", txt:"No aplica; el proyecto no pertenece al sector agroalimentario."},
    {n:37, t:"Integrar a mujeres, indígenas y grupos vulnerables al sector productivo.", d:"No aplica", txt:"El proyecto no pretende fomentar este tipo de desarrollo social."},
    {n:38, t:"Fomentar capacidades básicas de personas en pobreza.", d:"No aplica", txt:"No aplica; el proyecto no cuenta con actividades de desarrollo social."},
    {n:39, t:"Incentivar el uso de servicios de salud.", d:"No aplica", txt:"No aplica; el proyecto no se relaciona con la prestación de servicios de salud."},
    {n:40, t:"Atender necesidades de adultos mayores.", d:"No aplica", txt:"No aplica; el proyecto no contempla estos programas o acciones específicas."},
    {n:41, t:"Acceso a protección social de personas vulnerables.", d:"No aplica", txt:"No aplica; el proyecto no se relaciona con servicios de protección social."},
    {n:42, t:"Definición y respeto a los derechos de propiedad rural.", d:"Aplica indirectamente", txt:"La estación se localiza en propiedad privada."},
    {n:43, t:"Modernizar el Catastro Rural y la Información Agraria.", d:"No aplica", txt:"No aplica."},
    {n:44, t:"Impulsar el desarrollo regional coordinado entre órdenes de gobierno.", d:"No aplica", txt:"No aplica; el proyecto no está sujeto a impulsar el ordenamiento territorial estatal y municipal."}
  ];

  const DISPOSICIONES = ["Aplica directamente", "Aplica indirectamente", "No aplica"];

  // -------------------------------------------------------------------
  // 5) CATÁLOGO POR ESTADO (bloque Plan Estatal / UGA) — ejemplo Jalisco
  //    Editable y ampliable desde la app.
  // -------------------------------------------------------------------
  const ESTADOS = {
    "Jalisco": {
      planEstatal:
"El Plan Estatal de Desarrollo y Gobernanza 2024-2030 de Jalisco (PEDG) es el marco legal de planeación del estado; conduce el desarrollo con participación ciudadana y enfoque territorial a lo largo de cinco ejes. Para una estación de servicio, la congruencia se acredita principalmente con los ejes “Jalisco cuida su tierra” (ordenamiento, agua, movilidad, ambiente) y “Jalisco, economía que avanza” (transición y seguridad energética). Adicionalmente, el Programa de Ordenamiento Ecológico del Territorio del Estado de Jalisco delimita Unidades de Gestión Ambiental (UGA) con políticas, lineamientos y criterios de regulación ecológica; el proyecto se ubica en la UGA correspondiente y resulta congruente con sus criterios de aprovechamiento siempre que opere bajo medidas de prevención, control y mitigación ambiental.",
      ugaDefault: ""
    },
    "Hidalgo": {
      planEstatal:
"El Plan Estatal de Desarrollo del Estado de Hidalgo 2022-2028 es el instrumento rector de la planeación estatal; orienta el desarrollo con bienestar, sustentabilidad y ordenamiento territorial. Para una estación de servicio, la congruencia se acredita con los ejes de desarrollo sustentable, ordenamiento territorial y seguridad/eficiencia energética.\n\nAdicionalmente, el estado cuenta con el Programa de Ordenamiento Ecológico Territorial del Estado de Hidalgo (expedido el 02 de abril de 2001, con Decreto que modifica sus Criterios Ecológicos del 16 de febrero de 2009) y, en la región, con el Programa de Ordenamiento Ecológico Territorial Regional Tula-Tepeji (expedido el 10 de junio de 2002 y actualizado el 27 de enero de 2014). Utilizando el Sistema de Información Geográfica para la Evaluación del Impacto Ambiental (SIGEIA), el proyecto se ubica en la Unidad de Gestión Ambiental correspondiente, con política de Restauración y uso predominante agrícola; sus actividades resultan congruentes con los criterios ecológicos aplicables (uso condicionado para el sector), siempre que opere bajo medidas de prevención, control y mitigación ambiental.",
      ugaDefault: "XXVIII_Ag"
    }
  };
  const LISTA_ESTADOS = [
    "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua",
    "Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero",
    "Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro",
    "Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala",
    "Veracruz","Yucatán","Zacatecas"
  ];

  // -------------------------------------------------------------------
  // 6) INSTRUMENTOS JURÍDICOS (II.1) con descripción/vinculación estándar
  // -------------------------------------------------------------------
  const INSTRUMENTOS = [
    {sel:true,  cat:"Leyes", nombre:"LGEEPA — Ley General del Equilibrio Ecológico y la Protección al Ambiente (art. 31)", desc:"Establece la base de la evaluación de impacto ambiental y la modalidad de Informe Preventivo.", vinc:"El proyecto se evalúa mediante IP conforme al art. 31 y al REIA."},
    {sel:true,  cat:"Reglamentos", nombre:"REIA — Reglamento de la LGEEPA en materia de Evaluación de Impacto Ambiental (arts. 29, 30)", desc:"Define contenido y procedimiento del Informe Preventivo.", vinc:"Determina la estructura y los requisitos del presente IP."},
    {sel:true,  cat:"Leyes", nombre:"Ley de Hidrocarburos (art. 95)", desc:"Regula actividades del sector, incluyendo expendio al público.", vinc:"La estación de servicio es una actividad del sector regulada por esta ley."},
    {sel:true,  cat:"Leyes", nombre:"Ley de la ASEA", desc:"Crea la Agencia y le otorga competencia en seguridad industrial y protección ambiental del sector hidrocarburos.", vinc:"La ASEA es la autoridad evaluadora del presente IP."},
    {sel:true,  cat:"NOM", nombre:"NOM-005-ASEA-2016", desc:"Diseño, construcción, operación y mantenimiento de estaciones de servicio.", vinc:"Aplica al diseño e integridad de tanques, líneas y dispensarios; evidencia mediante dictámenes y pruebas de hermeticidad."},
    {sel:false, cat:"NOM", nombre:"NOM-052-SEMARNAT-2005", desc:"Características y listados de residuos peligrosos (CRETIB).", vinc:"Clasificación y manejo de residuos peligrosos generados; evidencia mediante manifiestos y gestor autorizado."},
    {sel:false, cat:"NOM", nombre:"NOM-081-SEMARNAT-1994", desc:"Límites máximos permisibles de emisión de ruido de fuentes fijas.", vinc:"Aplica si por colindancias se generan emisiones de ruido relevantes."},
    {sel:false, cat:"Acuerdos Internacionales", nombre:"Convenio de Estocolmo / Basilea (residuos químicos)", desc:"Orientan el manejo de residuos y sustancias.", vinc:"Su cumplimiento se operacionaliza en las leyes y NOM mexicanas referidas."}
  ];

  // -------------------------------------------------------------------
  // 7) CRITERIOS UGA (Jalisco) con vinculación estándar (redactada-cerrada)
  //    categoría / criterio / vinculación estándar para estación de servicio.
  // -------------------------------------------------------------------
  const CRITERIOS_UGA_JAL = [
    ["Agricultura (Ag)","1. Áreas agrícolas intensivas como recursos estratégicos compatibles con desarrollos urbanos.","No aplica."],
    ["Agricultura (Ag)","5. Promover diversificación de cultivos acorde a las condiciones ecológicas del sitio.","No aplica."],
    ["Agricultura (Ag)","6. Estimular la rotación de cultivos con leguminosas e incorporación de esquilmos.","No aplica."],
    ["Agricultura (Ag)","11. Incorporar abonos orgánicos en áreas de monocultivo.","No aplica."],
    ["Agricultura (Ag)","14. Notificar al Ayuntamiento el uso del fuego (NOM-015-SEMARNAP-SAGAR-1997).","No aplica. La estación tiene un programa para la prevención de riesgos."],
    ["Agricultura (Ag)","18. Aplicación localizada de pesticidas evitando dispersión.","No aplica."],
    ["Agricultura (Ag)","23. Tratar aguas residuales urbanas usadas para riego agrícola.","No aplica."],
    ["Asentamientos humanos (Ah)","9. Eficientar recolección y disposición de RSU evitando la quema.","Aplica. Los RSU generados se almacenan temporalmente y se entregan al sistema municipal de recolección, evitando la quema a cielo abierto."],
    ["Asentamientos humanos (Ah)","10. Promover el saneamiento de aguas freáticas para su reutilización.","Aplica indirectamente. El proyecto incorpora medidas de prevención de fugas y derrames de hidrocarburos, protegiendo las aguas subterráneas."],
    ["Asentamientos humanos (Ah)","11. Tratar las aguas residuales de poblaciones mayores de 2,500 habitantes.","Aplica indirectamente. Las aguas residuales se descargan a la infraestructura municipal para su tratamiento conforme a la normatividad."],
    ["Asentamientos humanos (Ah)","13. Sistema integrado de manejo de RSU desde el origen hasta disposición final.","Aplica. La estación separa, almacena temporalmente y dispone adecuadamente los residuos, minimizando riesgos de contaminación."],
    ["Asentamientos humanos (Ah)","18. Reorientar el mercado del suelo para limitar el crecimiento urbano.","Aplica indirectamente. El proyecto se desarrolla en un predio con uso de suelo compatible, sin promover expansión urbana desordenada."],
    ["Asentamientos humanos (Ah)","24. Plantación de especies nativas en áreas verdes.","Aplica. El proyecto contempla la conservación de áreas verdes, recomendándose especies nativas adaptadas a la región."],
    ["Minería (Mi)","9. Prevenir y controlar la contaminación atmosférica de bancos de material.","No aplica."],
    ["Minería (Mi)","11. Aprovechamiento de materiales geológicos sin alterar la hidrología superficial.","No aplica."],
    ["Industria (In)","2. Auditorías ambientales y certificación de seguridad ambiental.","Aplica. La estación opera bajo esquemas de cumplimiento normativo y puede ser objeto de auditorías y programas de mejora continua."],
    ["Industria (In)","4. Establecer monitoreo ambiental en zonas industriales.","Aplica indirectamente. El proyecto contempla inspección, mantenimiento y monitoreo de equipos y sistemas de almacenamiento."],
    ["Industria (In)","6. Inducir el cambio de base económica con diversificación congruente.","Aplica indirectamente. La estación forma parte de la infraestructura económica y de servicios de la región."],
    ["Infraestructura (If)","4. Considerar la generación de posibles riesgos en la infraestructura.","Aplica. La estación cuenta con estudio de riesgo, detección de fugas, válvulas de emergencia y plan de respuesta conforme a la NOM-005-ASEA-2016."],
    ["Infraestructura (If)","10. Disposición de RSU sin contaminación ni afectación paisajística.","Aplica. Los RSU se canalizan al servicio municipal; los RP se disponen con gestores autorizados."],
    ["Infraestructura (If)","15. Transporte de residuos peligrosos por vías de alta seguridad.","Aplica. La estación administra sus RP con gestor autorizado."],
    ["Infraestructura (If)","21. Adecuaciones para atención de emergencias químico-tecnológicas e hidrometeorológicas.","Aplica. La estación cuenta con sistemas de contención, equipo contra incendios, protocolos y capacitación ante contingencias."],
    ["Área Natural (An)","6. Participación comunitaria en la conservación de recursos.","Aplica. El PAI contempla acciones voluntarias de vinculación comunitaria (reforestación con especies nativas, mantenimiento de áreas verdes)."],
    ["Área Natural (An)","18. Articular espacios de valor ambiental como corredores de vida silvestre.","Aplica indirectamente. Se recomienda vegetación nativa dentro del predio, contribuyendo a la conectividad del paisaje."],
    ["Turismo (Tu)","15. Instalaciones turísticas con medidas de seguridad ante fenómenos naturales.","No aplica. El proyecto no corresponde a una instalación turística."]
  ];

  // -------------------------------------------------------------------
  // 8) CRITERIOS UGA (Hidalgo) — POET Estatal / Regional Tula-Tepeji
  // -------------------------------------------------------------------
  const CRITERIOS_UGA_HID = [
    ["Industria (In)","1. Todo proyecto de obra deberá ingresar al procedimiento de evaluación de impacto ambiental.","El proyecto presenta la Evaluación de Impacto Ambiental modalidad Informe Preventivo ante la ASEA, ajustándose a la normatividad aplicable a sus actividades."],
    ["Industria (In)","2. Las industrias deberán apegarse a las NOM de descargas de aguas residuales.","El proyecto contempla el manejo de aguas residuales sanitarias y grasosas (planta de tratamiento y trampas de grasas), cumpliendo la NOM-002-SEMARNAT-1996; no existirá descarga en bienes nacionales."],
    ["Industria (In)","3. Incluir previsiones para minimizar efectos adversos en planeación, diseño y construcción.","El IP detalla las medidas de mitigación y prevención para las etapas de planeación, diseño y construcción, que el regulado deberá cumplir cabalmente."],
    ["Industria (In)","4. Servicios relacionados con hidrocarburos con sistema de colección, manejo y disposición de desechos.","El proyecto contempla el manejo y disposición adecuada de sus residuos y aguas residuales, evitando el vertimiento de residuos peligrosos a cuerpos de agua."],
    ["Industria (In)","9. Barreras de vegetación nativa como áreas de amortiguamiento.","El radio de 500 m del proyecto se limita a predios sin infraestructura y a la vialidad colindante; se considera vegetación nativa en áreas verdes."],
    ["Industria (In)","11. Se promoverá el desarrollo de la actividad agroindustrial.","No aplica; el proyecto no contempla actividades relacionadas con el sector agroindustrial."],
    ["Industria (In)","13. Rescate de especies vegetales nativas previo al establecimiento.","El IP identifica las especies que deberán ser reubicadas o, en su caso, respetadas."],
    ["Industria (In)","16. No instalar industrias fuera de los corredores del plan de desarrollo urbano.","El área del proyecto se encuentra dentro del corredor urbano correspondiente; sus actividades están normadas y permitidas con uso condicionado."],
    ["Industria (In)","17. Residuos peligrosos conforme a las NOM aplicables (NOM-052/NOM-087).","Los residuos peligrosos se identifican y caracterizan conforme a la normatividad; se almacenan temporalmente y se transfieren a empresa autorizada para su disposición final."],
    ["Industria (In)","18. Instalación de hornos para piezas de arcilla sujeta a norma técnica estatal.","No aplica; el proyecto no contempla la instalación de hornos para la elaboración de arcillas."],
    ["Equipamiento e Infraestructura (EI)","1. Considerar transporte eficiente, áreas verdes nativas y zonas de amortiguamiento ante riesgos.","El área del proyecto se encuentra dentro del corredor urbano; sus actividades están normadas y permitidas con uso condicionado."],
    ["Equipamiento e Infraestructura (EI)","5. La instalación de infraestructura estará sujeta a evaluación de impacto ambiental.","El proyecto presenta la Evaluación de Impacto Ambiental modalidad Informe Preventivo ante la ASEA."],
    ["Equipamiento e Infraestructura (EI)","10. Programa de reducción, recolección y reciclaje de desechos sólidos.","El proyecto contempla el manejo y disposición de sus residuos conforme a la Ley General para la Prevención y Gestión Integral de los Residuos."]
  ];

  // -------------------------------------------------------------------
  // 9) ÁREAS DE FIGURAS — cada lugar del documento donde van imágenes.
  //    id, sec (sección del cuestionario), título por defecto, y flags:
  //    numbered:false (portada, sin "Figura N."), gatedBy (depende de un toggle).
  //    La numeración "Figura N." se calcula sola en orden de documento.
  // -------------------------------------------------------------------
  const A = (id, sec, def, opts) => Object.assign({ id, sec, defaults: def!=null?[def]:[] }, opts||{});
  const AREAS = [
    A("f01","portada","Logo de empresa",{numbered:false}),
    A("f02","portada","Foto / diseño relacionado al proyecto (portada)",{numbered:false}),
    A("f03","II2","Mapa de Unidad Ambiental Biofísica (UAB)"),
    A("f04","II3","Mapa de UGA del Ordenamiento Ecológico Territorial estatal (SIGEIA)"),
    A("f05","II3","Mapa del Programa de Ordenamiento Ecológico Local (POEL) del municipio"),
    A("f06","III1","Mapa de macrolocalización (nivel nacional)"),
    A("f07","III1","Mapa de localización (nivel estatal)"),
    A("f08","III1","Mapa de localización (nivel municipal)"),
    A("f09","III1","Mapa de microlocalización (predio del proyecto)"),
    A("f10","III1","Evidencia fotográfica de colindancias"),
    A("f11","III1","Plano arquitectónico / croquis del proyecto"),
    A("f12","III1","Diagrama de flujo del proceso operativo"),
    A("f13","III2","Hoja de seguridad de las sustancias (anexo)"),
    A("f14","III3","Diagrama de entradas y flujos por etapa"),
    A("f15","III4","Delimitación del Área de Influencia (AI)"),
    A("f16","III4","Carta de climas"),
    A("f17","III4","Curvas de nivel y altitud (topografía)"),
    A("f18","III4","Carta geológica"),
    A("f19","III4","Carta edafológica (tipos de suelo)"),
    A("f20","III4","Mapa de hidrología superficial"),
    A("f21","III4","Mapa de acuíferos / NDWI"),
    A("f22","III4","Plano de cobertura vegetal del AI"),
    A("f23","III4","Mapa de NDVI del AI"),
    A("f24","III4","Evidencia fotográfica de flora/fauna identificada en el predio"),
    A("f25","III4","Mapa de zonas de atención prioritaria"),
    A("f26","III4","Análisis de cercanía a 2.0 km y receptores sensibles"),
    A("f27","III4","Subsistemas e interacciones del Sistema Ambiental (diagrama de flujo)"),
    A("f28","III4","Componentes básicos de un MEC (Ogden et al., 2005)",{gatedBy:"incluirMEC"}),
    A("f29","III4","Ejemplo de MEC parcial para el proyecto",{gatedBy:"incluirMEC"}),
    A("f30","III5","Diagrama de flujo de la metodología de evaluación de impacto",{gatedBy:"incluirMetodo"}),
    A("f31","III5","Matriz de Leopold adaptada (anexo)"),
    A("f32","III5","Matriz de resultados con cálculo de índices (anexo)"),
    A("f33","anexos","Plano general / cartografía del proyecto (anexo)"),
    A("anexo","anexos",null)   // figuras adicionales que agregue el usuario
  ];

  window.IPDATA = {
    CONSULTORA, SUSTANCIAS, SUS_CONSTRUCCION_DEFAULT, SUS_OPERACION_DEFAULT,
    RESIDUOS_DEFAULT, RUIDO_DEFAULT,
    CLIMA_DEFAULT, SUELO_DEFAULT, GEOMORFO_DEFAULT, HIDRO_DEFAULT, ACUIFERO_DEFAULT,
    RECEPTORES_DEFAULT, RIESGO_RECEPTORES_DEFAULT,
    FLORA_OBSERVADA_DEFAULT, FAUNA_OBSERVADA_DEFAULT,
    POBLACION_DEFAULT, PIRAMIDE_DEFAULT, OTROS_DEMOG_DEFAULT,
    IMPACTOS_RESUMEN_DEFAULT, IMPACTOS_BALANCE_DEFAULT,
    ACCIONES_PROYECTO_DEFAULT, IMPACTOS_SIGNIFICATIVOS_DEFAULT,
    COMPROMISOS_DEFAULT,
    // V. Conclusión
    COMPROMISOS_FINALES_DEFAULT,
    // IV. Abandono
    GATILLOS_DEFAULT, ACCIONES_CIERRE_DEFAULT, RESIDUOS_CIERRE_DEFAULT,
    MUESTREO_SUELO_DEFAULT, RESTITUCION_DEFAULT, CRITERIOS_CIERRE_DEFAULT,
    AVISOS_CIERRE_DEFAULT, CRONOGRAMA_CIERRE_DEFAULT,
    BOILER, REFERENCIAS,
    ESTRATEGIAS_POEGT, DISPOSICIONES, ESTADOS, LISTA_ESTADOS, INSTRUMENTOS,
    CRITERIOS_UGA_JAL, CRITERIOS_UGA_HID, AREAS
  };
})();
