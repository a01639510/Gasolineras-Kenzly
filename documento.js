/* =====================================================================
   documento.js — Machote COMPLETO del Informe Preventivo (IP) ASEA.
   v1.1 — Secciones I, II y III con fidelidad total a la plantilla:
   todos los campos para llenar, todas las tablas e instrucciones, y
   RECUADROS DE IMAGEN (figuras/mapas/fotos) donde la plantilla los pide.
   Bloques etiquetados por "kind":
     - 'auto'   → texto/dato NUEVO generado (se resalta en el Borrador)
     - 'instr'  → instrucción ✎ / figura / área pendiente (se resalta SIEMPRE)
     - 'static' → estructura del machote (encabezados; sin resaltado)
   Expone window.IPDOC.build(ctx) → [ {t, k, ...}, ... ]
   ===================================================================== */
(function () {
  "use strict";

  function build(ctx) {
    const { g, v, interp, money, state, D } = ctx;
    const B = [];
    const H   = (n, x) => B.push({ t:"h", k:"static", n, x });
    const P   = (x)    => B.push({ t:"p", k:"auto",   x });
    const PS  = (x)    => B.push({ t:"p", k:"static", x });
    const I   = (x)    => B.push({ t:"p", k:"instr",  x, instr:true });
    const PEND= (x)    => B.push({ t:"p", k:"instr",  x, pend:true });
    const TBL = (o)    => B.push({ t:"table", k:o.k||"static", title:o.title, head:o.head, rows:o.rows });
    // Emite todas las figuras registradas para un área, con su número auto ("Figura N.")
    const FIGAREA = (areaId) => {
      const arr = (ctx.figsByArea && ctx.figsByArea[areaId]) || [];
      arr.forEach(f => B.push({ t:"fig", k:"instr", id:f.id, areaId,
        caption: (f.num!=null ? ("Figura "+f.num+". ") : "") + (f.titulo||"") }));
    };
    const SP  = ()     => B.push({ t:"sp" });
    // Filas de tabla llenadas por IA (state.tablas[key]); sin límite de filas.
    const tFilled = (key) => !!(state && state.tablas && Array.isArray(state.tablas[key]) && state.tablas[key].length);
    const tRows = (key, head, fbN) => {
      if (tFilled(key)) return state.tablas[key].map(r => head.map(c => (r && r[c] != null ? r[c] : "")));
      return empty(fbN, head.length);
    };
    const tK = (key) => tFilled(key) ? "auto" : "scaffold";
    // Emite la redacción de IA (state[key]) como párrafos resaltados, si existe.
    const IAP = (key) => {
      const txt = state && state[key];
      if (txt && String(txt).trim()) {
        String(txt).trim().split(/\n{2,}/).forEach(par => { if (par.trim()) P(par.trim()); });
        return true;
      }
      return false;
    };

    const val = (id, ph) => { const x=g(id,""); return (x===""||x==null) ? ("["+(ph||"Especificar")+"]") : x; };
    const isAuto = (id) => { const x=g(id,""); return !(x===""||x==null); };
    const empty = (n, c) => Array.from({length:n}, ()=> Array.from({length:c}, ()=> ""));

    // ===================== PORTADA =====================
    B.push({ t:"cover",
      proyecto: g("proyecto","[Nombre del proyecto]"),
      empresa:  g("empresa","[Nombre de empresa]"),
      fecha:    fechaLarga(g("fecha")) });
    FIGAREA("f01");
    FIGAREA("f02");

    // ===================== ÍNDICE =====================
    H(2, "Contenido");
    B.push({ t:"toc", items: TOC });

    // ===================== GLOSARIO / INTRODUCCIÓN =====================
    H(2, "Glosario");
    I("Incluir el glosario de siglas y términos técnicos empleados (ASEA, LGEEPA, REIA, NOM, UGA, POEGT, CRETIB, COV, LEL, UV, RP, RSU, RME, RCD, etc.).");
    H(2, "Introducción");
    P(interp(D.BOILER.introduccion, v));

    // ========================================================================
    // I. DATOS GENERALES
    // ========================================================================
    H(1, "I. Datos generales del proyecto, promovente y del responsable del estudio");
    I("Completar todos los datos con base en los documentos técnicos y legales del proyecto. Puedes guiarte del plano general y memoria descriptiva para las superficies y localización.");

    H(3, "I.1 Nombre del proyecto");
    P(g("proyecto","[Indicar nombre oficial del proyecto tal como aparecerá en el IP]"));

    H(3, "I.1.1 Ubicación del proyecto");
    P("Calle y número: " + val("calle"));
    P("Colonia/Localidad: " + val("colonia"));
    P("Municipio/Entidad federativa: " + val("municipio") + ", " + val("estado"));
    P("C.P.: " + val("cp"));
    P("Coordenadas geográficas: Coordenadas UTM (" + val("utmZona","Zona") + ", Datum " + g("utmDatum","WGS84") + ").");
    const pr = (state.puntos||[]).map((p,i)=>[String(i+1), p.x||"", p.y||""]);
    TBL({ title:"Tabla I.1. Localización del proyecto — Puntos de inflexión (Coordenadas UTM)",
          head:["Punto de inflexión","X (Este)","Y (Norte)"],
          rows: pr.length?pr:[["1","",""],["2","",""],["3","",""],["4","",""]],
          k: pr.some(r=>r[1]||r[2]) ? "auto":"scaffold" });
    var nPun = (state.puntos||[]).length || 4;
    var rowsPun = Array.from({length:nPun}, (_,i)=>[String(i+1),"",""]);
    TBL({ title:"Tabla I.1b. Coordenadas geográficas GMS (grados, minutos y segundos)",
          head:["Punto de inflexión","Latitud Norte (G° M' S\")","Longitud Oeste (G° M' S\")"], k:"scaffold", rows: rowsPun.map(r=>r.slice()) });
    TBL({ title:"Tabla I.1c. Coordenadas geográficas GD (grados decimales, Datum WGS 84)",
          head:["Punto de inflexión","Latitud Norte (°)","Longitud Oeste (°)"], k:"scaffold", rows: rowsPun.map(r=>r.slice()) });

    H(3, "I.1.2 Superficie total del predio y del proyecto");
    P("Superficie ocupada por el proyecto (m²): " + val("superficie","Indicar"));

    H(3, "I.1.3 Inversión estimada del proyecto");
    P("$ " + (isAuto("inversion")? money(g("inversion")) : "[Indicar monto en pesos mexicanos]") + " MXN.");

    H(3, "I.1.4 Número de empleos directos e indirectos generados");
    P("Empleos directos: " + val("empleosDir","Indicar número") + ". Empleos indirectos: " + val("empleosInd","Indicar número") + ".");
    TBL({ title:"Tabla I.2b. Número de empleos por etapa del proyecto",
          head:["Etapa","Empleos directos","Empleos indirectos"], k:"scaffold",
          rows:[["Preparación del sitio y construcción","",""],["Operación y mantenimiento","",""],["Abandono del sitio","",""],["Total", val("empleosDir","—"), val("empleosInd","—")]] });

    H(3, "I.1.5 Duración del proyecto");
    I("Incluye todas las etapas o anualidades, o parcial (desglosada por etapas: preparación del sitio, construcción y operación).");
    P("Preparación del sitio: " + val("durPrep","Meses o semanas") + ". Construcción: " + val("durConstr","Meses o semanas") + ". Operación: " + val("durOper","Años") + ". Abandono (en su caso): indicar si aplica y duración estimada.");

    H(3, "I.2 Promovente");
    I("Tomar los datos del acta constitutiva.");
    P("Nombre o razón social: " + val("empresa","Nombre legal del promovente"));
    H(4, "I.2.1 Registro Federal de Contribuyentes de la empresa promovente");
    P("RFC: " + val("rfcEmpresa"));
    H(4, "I.2.2 Nombre y cargo del representante legal");
    I("Anexar copia certificada del poder respectivo, así como el RFC y la CURP del representante legal.");
    P("Representante legal: " + val("repLegal","Nombre completo") + ". RFC del representante: " + val("rfcRep") + ". CURP: " + val("curpRep") + ".");
    H(4, "I.2.3 Dirección del promovente para notificaciones");
    P("Domicilio: " + val("dirNotif") + ". Tel: " + val("telProm") + ". Email: " + val("emailProm") + ".");

    H(3, "I.3 Responsable del Informe Preventivo");
    I("Datos fijos de la responsable técnica del estudio. Solo personalizar dirección y contacto si se desea cambiar.");
    TBL({ title:"Tabla I.2. Datos del responsable técnico del Informe Preventivo",
          head:["Campo","Dato"], k: isAuto("cNombre")?"auto":"scaffold",
          rows:[["Nombre",val("cNombre")],["Profesión",g("cProfesion","Ingeniería en Desarrollo Sustentable")],
                ["Cédula profesional",val("cCedula")],["RFC",val("cRfc")],["CURP",val("cCurp")],
                ["Empresa responsable",val("cEmpresa")],["Dirección",val("cDir")],["Teléfono",val("cTel")],["Email",val("cEmail")]] });

    // ========================================================================
    // II. FUNDAMENTO JURÍDICO
    // ========================================================================
    H(1, "II. Fundamento jurídico");
    H(3, "II.1 Normas Oficiales Mexicanas u otras disposiciones aplicables");
    I("Llenar la tabla en todas las secciones. Nombra completo el instrumento y, si corresponde, artículo/numeral y fecha de última reforma. En Descripción, sé objetivo: ¿qué regula? (emisiones, descargas, residuos, diseño/operación, riesgos, ordenamiento). En Vinculación, aterriza en acciones verificables: obligación + evidencia + periodicidad + etapa + responsable. Si no aplica, pon “N/A” y justifica en una oración. Mantén la vigencia al día (nota final con “Fecha de consulta: dd/mm/aaaa”).");
    const insSel = D.INSTRUMENTOS.filter((it,i)=> state.instrumentos[i]?state.instrumentos[i].sel:it.sel);
    TBL({ title:"Tabla II.1. Instrumentos jurídicos aplicables al proyecto",
          head:["Instrumento (ley/NOM/regl./artículo)","Descripción (qué regula / alcance)","Vinculación con el proyecto"],
          k:"auto", rows: insSel.map(it=>[it.nombre, it.desc, it.vinc]) });
    var J = D.JURIDICO || {};
    H(4, "II.1.1 Acuerdos Internacionales");
    if (J.acuerdos) P(J.acuerdos); else I("Tratados aplicables (Acuerdo de París, Montreal, Minamata, Basilea/Estocolmo/Rotterdam).");
    H(4, "II.1.2 Constitución de los Estados Unidos Mexicanos");
    if (J.constitucion) P(J.constitucion); else I("Artículos 4º, 25–28, 27, 73 y 115.");
    H(4, "II.1.3 Leyes");
    if (J.leyes) P(J.leyes); else I("LGEEPA, LGPGIR, LGCC, LAN, Ley del Sector Hidrocarburos, Ley de la ASEA, LGAHOTDU.");
    H(4, "II.1.4 Reglamentos");
    if (J.reglamentos) P(J.reglamentos); else I("REIA, Reglamento de Atmósfera, Reglamento de RP, Reglamento de la LAN y DACG de ASEA.");
    H(4, "II.1.5 NOM");
    if (J.noms) P(J.noms); else I("NOM-005/004/001-ASEA, NOM-052/081/059-SEMARNAT vigentes.");
    H(4, "II.1.6 NMX");
    if (J.nmx) P(J.nmx); else I("NMX-AA (métodos) y NMX-EC-17025 (laboratorios).");
    H(4, "II.1.7 Otros");
    if (J.otros) P(J.otros); else I("Ordenamientos estatales/municipales, DACG y condicionantes de permisos previos.");

    // Cumplimiento normativo específico y leyes/NOMs aplicables del proyecto
    // (state.tablas.tablaCumplimiento/tablaNoms, llenado desde "Leer
    // cumplimiento/normativo (IA)") — verificación puntual del proyecto,
    // complementa (no reemplaza) el marco legal general de arriba.
    if (tFilled("tablaCumplimiento")) {
      var HCUMP=["NOM","Descripción","Requisito clave","Cumple"];
      TBL({ title:"Tabla — Cumplimiento normativo específico",
            head:HCUMP, k:"auto", rows: tRows("tablaCumplimiento",HCUMP,1) });
    }
    if (tFilled("tablaNoms")) {
      var HNOMS=["Ley","Descripción","Sector aplicable","Límite/Requisito","Vigente"];
      TBL({ title:"Tabla — Leyes y NOMs aplicables",
            head:HNOMS, k:"auto", rows: tRows("tablaNoms",HNOMS,1) });
    }

    H(3, "II.2 Planes de desarrollo urbano y de ordenamiento ecológico");
    H(4, "II.2.1 Programa de Ordenamiento Ecológico General del Territorio (POEGT)");
    P(interp(D.BOILER.poegt_intro, v));
    FIGAREA("f03");
    TBL({ title:"Tabla II.2. Unidad Ambiental Biofísica (UAB) de interés por ubicación del proyecto",
          head:["Proyecto","UAB"], k: isAuto("uab")?"auto":"scaffold", rows:[[g("proyecto","[Proyecto]"), val("uab")]] });
    var HUAB=["Concepto","Valor"];
    TBL({ title:"Tabla II.3. Políticas, usos y estrategias de regulación ecológica aplicables a la UAB",
          head:HUAB, k:tK("tablaUabPoliticas"),
          rows: tFilled("tablaUabPoliticas") ? tRows("tablaUabPoliticas",HUAB,8) :
            [["Rectores de desarrollo",""],["Coadyuvantes del desarrollo",""],["Asociados del desarrollo",""],
             ["Otros sectores de interés",""],["Política Ambiental",""],["Clave del Área de Atención Prioritaria",""],
             ["Nombre del Área de Atención Prioritaria",""],["Estrategias sectoriales",""]] });
    TBL({ title:"Tabla II.4. Vinculación del proyecto con las estrategias del POEGT",
          head:["Estrategia","Disposición","Cumplimiento de estrategia"], k:"auto",
          rows: D.ESTRATEGIAS_POEGT.map((e,i)=>{ const st=state.estrategias[i]||{d:e.d}; return [ e.n+". "+e.t, st.d, e.txt ]; }) });

    // Programas de ordenamiento adicionales ligados al proyecto (más allá del
    // POEGT nacional de arriba): uno por cada uno agregado en el desplegable
    // de II.2 — no hay número fijo, depende de lo que el proyecto tenga.
    // Numeración II.9.x: II.2–II.8 ya están tomadas por las tablas fijas de
    // arriba (UAB, políticas, estrategias, UGA estatal, criterios, plan
    // municipal, POEL) — este bloque solo agrega lo que sobre.
    (state.programas || []).forEach((p, i) => {
      H(4, "II.2.1." + (i + 1) + " " + (p.nombre || "Programa de ordenamiento"));
      if (p.url) I("Fuente: " + p.url);
      const esCriterios = (p.incisos || []).some(x => x.aplica !== undefined);
      if (esCriterios) {
        const rows = p.incisos.map(x => [x.criterio || "", x.aplica || "", x.justificacion || ""]);
        TBL({ title: "Tabla II.9." + (i + 1) + ". Evaluación de criterios de aplicabilidad — " + (p.nombre || "el programa"),
              head: ["Criterio", "Aplica", "Justificación"], k: rows.length ? "auto" : "scaffold",
              rows: rows.length ? rows : [["", "", ""]] });
      } else {
        const rows = (p.incisos || []).map(x => [x.campo || "", x.valor || ""]);
        TBL({ title: "Tabla II.9." + (i + 1) + ". Vinculación con " + (p.nombre || "el programa"),
              head: ["Campo", "Valor"], k: rows.length ? "auto" : "scaffold",
              rows: rows.length ? rows : [["", ""]] });
      }
      FIGAREA("progimg_" + i);
    });

    H(4, "II.2.2 Plan Nacional de Desarrollo");
    P(D.BOILER.pnd);

    H(4, "II.2.3 Plan Estatal de Desarrollo");
    const blk = D.ESTADOS[g("estado")];
    if (blk) P(blk.planEstatal); else I("Selecciona el estado en I.1 para autocargar el bloque del Plan Estatal, o redáctalo. Estado actual: " + g("estado","[estado]") + ".");
    FIGAREA("f04");
    TBL({ title:"Tabla II.5. Vinculación del proyecto con la UGA estatal",
          head:["Clave UGA","Política ambiental","Uso de suelo predominante","Criterios"],
          k: isAuto("ugaEstatal")?"auto":"scaffold",
          rows:[[ val("ugaEstatal"), g("ugaPolitica","Restauración"), g("ugaUso","Agrícola"), "Ag, Ah, Mi, In, If, An, Tu (ver Tabla II.6)" ]] });
    const catUGA = { "Jalisco": D.CRITERIOS_UGA_JAL, "Hidalgo": D.CRITERIOS_UGA_HID }[g("estado")];
    if (catUGA) {
      TBL({ title:"Tabla II.6. Vinculación de los criterios aplicables a la UGA estatal ("+g("estado")+")",
            head:["Categoría","Criterio OE aplicable","Vinculación del proyecto"], k:"auto", rows: catUGA });
    } else {
      TBL({ title:"Tabla II.6. Vinculación de los criterios aplicables a la UGA estatal",
            head:["Categoría","Criterio OE aplicable","Vinculación del proyecto"], k:"scaffold", rows: empty(6,3) });
    }

    H(4, "II.2.4 Plan Municipal de Desarrollo");
    var HPM=["Criterio","Descripción","Relación directa con el proyecto"];
    TBL({ title:"Tabla II.7. Vinculación con los criterios del Plan Municipal de " + g("municipio","______"),
          head:HPM, k:tK("tablaPlanMunicipal"),
          rows: tFilled("tablaPlanMunicipal") ? tRows("tablaPlanMunicipal",HPM,5) :
            [["Ordenamiento territorial y uso de suelo","",""],["Movilidad y seguridad vial","",""],
             ["Agua potable, alcantarillado y saneamiento","",""],["Calidad ambiental (aire, suelo, residuos)","",""],
             ["Gestión de riesgos y resiliencia","",""]] });
    I("Vincular con el Programa de Ordenamiento Ecológico Local (POEL) del municipio: clave UGA, política ambiental, uso de suelo predominante, condicionado e incompatible.");
    FIGAREA("f05");
    var HPOEL=["Clave UGA","Nombre UGA","Política territorial","Uso predominante","Uso condicionado","Uso incompatible"];
    TBL({ title:"Tabla II.8. POEL — Unidad de Gestión Ambiental del municipio",
          head:HPOEL, k:tK("tablaPOEL"), rows: tRows("tablaPOEL",HPOEL,1) });

    H(3, "II.3 Parque industrial");
    if (g("parqueInd","No (predio independiente)").indexOf("No") === 0) P(D.BOILER.parqueIndustrial_no);
    else P("La obra o actividad está prevista en un parque industrial evaluado por esta Secretaría.");

    // ========================================================================
    // III. ASPECTOS TÉCNICOS Y AMBIENTALES
    // ========================================================================
    H(1, "III. Aspectos técnicos y ambientales");
    H(3, "III.1 Descripción general del proyecto o actividad proyectada");
    IAP("iaDescTecnica");
    I("Basarse en la memoria técnica, plano del proyecto y proceso operativo.");
    TBL({ title:"Tabla III.1. Datos generales del proyecto", head:["Campo","Dato"],
          k: isAuto("claveCatastral")?"auto":"scaffold",
          rows:[["Nombre del proyecto",g("proyecto","[ ]")],["Representante legal",val("repLegal")],
                ["Ubicación",v.ubicacion],["Clave catastral",val("claveCatastral")],
                ["Responsable de la obra",val("respObra")],["Permiso de la CRE",val("permisoCRE")],
                ["No. Registro ASEA",val("regASEA")]] });

    H(4, "III.1.1 Localización del proyecto");
    I("Incluir cuadro de coordenadas geográficas y/o UTM (punto de latitud/longitud para predio; cuatro puntos extremos para zona; puntos de inflexión para proyectos lineales). Incluir mapas de localización a 4 niveles, a escala adecuada con simbología clara. Agregar colindancias directas e infraestructuras de mayor concurrencia con evidencia fotográfica.");
    FIGAREA("f06");
    FIGAREA("f07");
    FIGAREA("f08");
    FIGAREA("f09");
    FIGAREA("f10");

    H(4, "III.1.2 Actividades principales");
    I("Detallar principales actividades y acciones del giro (carga, almacenamiento, distribución), conforme al Art. 28 de la LGEEPA y 5 de su REIA.");
    P(actividades(g("III1abierta")));
    IAP("iaActividades");

    H(4, "III.1.3 Dimensiones del proyecto");
    I("Para proyectos puntuales: área del predio (+ plano/croquis), mencionando superficies de afectación permanente y temporal. Describir instalaciones estructurales y civiles (urbanización, edificios/oficinas, techos, instalaciones hidráulicas y sanitarias, estación de vigilancia, zonas de protección, anuncio) e instalaciones industriales y mecánicas (tanques de almacenamiento, equipos clave, islotes de llenado/despachadores, tomas de recepción y suministro, sistema de aire comprimido).");
    IAP("iaDimensiones");
    FIGAREA("f11");

    H(4, "III.1.4 Características del proyecto según su naturaleza");
    I("Mencionar los procesos que se emplearán, las sustancias y el tipo de almacenamiento, condiciones de operación, servicios requeridos (agua, energía, drenaje, residuos: especificar origen y sistemas) y obras provisionales/auxiliares al proyecto.");
    IAP("iaCaracteristicas");

    H(4, "III.1.5 Uso de suelo en el sitio seleccionado");
    P("Uso actual del suelo: " + g("usoSuelo","[industrial / urbano / suburbano / agrícola / erial]") + ". Describir brevemente los usos predominantes en la zona del proyecto y en los predios colindantes.");

    H(4, "III.1.6 Programa de trabajo");
    I("Descripción de las actividades por etapa del proyecto (preparación del sitio, proceso constructivo, operación y mantenimiento, abandono), con el periodo y la duración estimada de cada una.");
    var HPT=["Etapa","Actividad","Periodo estimado","Duración"];
    TBL({ title:"Tabla III.2. Programa de trabajo — actividades y duración estimada",
          head:HPT, k:tK("tablaPrograma"),
          rows: tFilled("tablaPrograma") ? tRows("tablaPrograma",HPT,10) : programaScaffold() });

    H(4, "III.1.7 Detalles técnicos");
    IAP("iaDetallesTec");

    H(5, "Condiciones de operación de servicios");
    I("Agua, energía, drenaje y residuos; procesos, presiones y temperatura de operación; diagrama de flujos del sistema.");
    FIGAREA("f12");

    H(5, "Tanques de almacenamiento sujetos a presión");
    var HTQ=["ID Tanque","Capacidad (L)","Producto","Presión diseño","Presión operación","Set PSV","Año/Serie","Fabricante","Dictamen/UV"];
    TBL({ title:"Tabla III.3. Condiciones operacionales de tanques de almacenamiento sujetos a presión",
          head:HTQ, k:tK("tablaTanques"), rows: tRows("tablaTanques",HTQ,3) });

    H(5, "Tuberías y conexiones");
    I("Tabla mínima obligatoria por línea: identificación, capacidad, presión de diseño/operación, set de PSV, año/serie, fabricante, dictamen/UV y pruebas de hermeticidad realizadas. Simplifica la lectura técnica del dictaminador.");
    var HTU=["Fluido / Servicio","Ø Nominal","Material","Tipo de instalación","Profundidad","Pendiente","Prueba / Dictamen","Observaciones"];
    TBL({ title:"Tabla III.4. Identificación de tuberías y detalle técnico",
          head:HTU, k:tK("tablaTuberias"), rows: tRows("tablaTuberias",HTU,4) });

    H(5, "Maquinaria");
    I("Maquinaria y equipo por etapa (preparación, construcción, operación y mantenimiento): tipo, cantidad, capacidad y fuente de energía.");

    H(5, "Controles de medición, seguridad y control — Seguridad industrial y atención a emergencias");
    I("Extintores, kit de derrames, pararrayos, señalética, rutas de evacuación, iluminación de emergencia y equipo de atención a emergencias.");
    var HEX=["No.","Ubicación","Tipo","Capacidad","Evidencia"];
    TBL({ title:"Tabla III.5. Identificación y ubicación de extintores",
          head:HEX, k:tK("tablaExtintores"), rows: tRows("tablaExtintores",HEX,4) });

    H(5, "Características de control preventivas");
    I("Pruebas de hermeticidad, válvulas de emergencia (shut-off) y monitoreo manual/automático de inventarios y detección de fugas.");

    H(5, "Relación de distancias mínimas");
    var HDM=["Elemento","Distancia requerida (m)","Distancia de proyecto (m)","Cumple"];
    TBL({ title:"Tabla III.6. Relación de distancias mínimas",
          head:HDM, k:tK("tablaDistancias"), rows: tRows("tablaDistancias",HDM,4) });

    H(5, "Operación y mantenimiento");
    I("Operación de trasiego, insumos indirectos y controles operacionales. Describir: (a) procedimiento durante la descarga; (b) secuencia de maniobra; (c) condiciones en que se suspende la maniobra; y (d) mantenimiento y control técnico.");

    H(3, "III.2 Identificación de sustancias o productos");
    I("Mencionar tipo, cantidades y adjuntar hoja de seguridad. Tipo y características (CRETIB), volumen de uso y almacenamiento, etapa o proceso, destino o uso final y tipo de transportación.");
    H(4, "III.2.1 Sustancias químicas peligrosas en tanque de almacenamiento");
    TBL({ title:"Tabla III.7. Identificación de sustancias químicas peligrosas en tanque de almacenamiento",
          head:["ID Tanque","Producto","Estado físico","Categoría","Clave CRETIB","No. CAS","Capacidad (gal)","Proveedor"],
          k:"auto", rows: Object.keys(D.SUSTANCIAS).map(n=>{
            const c=D.SUSTANCIAS[n]; const s=state.sustancias&&state.sustancias[n]||{};
            return [s.tanqueId||c.tanqueId||"", n, c.estado, c.categoria, c.cretib, c.cas, s.cap||"", s.prov||""]; }) });
    FIGAREA("f13");
    H(4, "III.2.2 Sustancias químicas peligrosas de uso en construcción");
    TBL({ title:"Tabla III.8. Sustancias químicas peligrosas en construcción",
          head:["Producto (nombre comercial)","Volúmenes","Estado físico","Clave CRETIB","No. CAS","Área de uso","Proveedor"],
          k: (state.sus_construccion&&state.sus_construccion.length)?"auto":"scaffold",
          rows: (state.sus_construccion&&state.sus_construccion.length)
            ? state.sus_construccion.map(r=>[r.prod||"",r.vol||"",r.estado||"",r.cretib||"",r.cas||"",r.area||"",r.prov||""])
            : empty(3,7) });
    H(4, "III.2.3 Sustancias químicas peligrosas en operación y mantenimiento");
    TBL({ title:"Tabla III.9. Sustancias químicas peligrosas en operación y mantenimiento",
          head:["Producto (nombre comercial)","Volúmenes","Estado físico","Clave CRETIB","No. CAS","Área de uso","Proveedor"],
          k: (state.sus_operacion&&state.sus_operacion.length)?"auto":"scaffold",
          rows: (state.sus_operacion&&state.sus_operacion.length)
            ? state.sus_operacion.map(r=>[r.prod||"",r.vol||"",r.estado||"",r.cretib||"",r.cas||"",r.area||"",r.prov||""])
            : empty(3,7) });
    H(4, "III.2.4 Determinación de actividad Altamente Riesgosa");
    I("Si se rebasa la “cantidad de reporte” → es obligatorio un Estudio de Riesgo como anexo (art. 18 REIA). Para ciertas actividades AHR podría requerirse MIA en lugar de IP; revisar viabilidad del IP antes de avanzar.");

    H(3, "III.3 Emisiones, descargas, residuos y medidas de control");
    IAP("iaEmisiones");
    I("Describir procesos con diagrama de flujo; indicar entradas, rutas y balances; señalar sitios/etapas de generación de residuos líquidos, sólidos y ruido, con controles ambientales y evidencia analítica. Lógica N/A justificado cuando no aplique.");
    H(4, "III.3.1 Emisiones atmosféricas");
    I("Fuente principal: vapores de combustibles (COV/VOC) controlados mediante Sistema de Recuperación de Vapores (SRV Fase I) conforme NOM-004-ASEA-2017.");
    TBL({ title:"Tabla III.10a. Control de emisiones VOC — SRV",
          head:["Parámetro","Valor"],
          k:"auto",
          rows:[
            ["Sistema de Recuperación de Vapores (SRV)", g("srvMarca","[Marca y modelo — completar en formulario]")],
            ["Eficiencia SRV — NOM-004-ASEA-2017 (Fase I)", g("srvEficiencia","≥ 95 %")],
            ["Evidencia / certificación", g("srvDictamen","Dictamen de Verificación Unitaria vigente")]
          ]
        });
    H(4, "III.3.2 Descarga de aguas residuales");
    I("Se generan aguas sanitarias (uso de baños) y aguas aceitosas (limpieza de islote y SRV). No se realizan descargas a cuerpos de agua nacionales.");
    TBL({ title:"Tabla III.10b. Aguas residuales generadas en operación",
          head:["Tipo","Origen","Volumen estimado","Tratamiento y destino"],
          k:"auto",
          rows:[
            ["Sanitarias","Baños de personal y clientes", g("aguasSanitariaVol","[l/día]")+" l/día", g("aguasSanitariaDest","Fosa séptica in situ")],
            ["Aceitosas","Limpieza islote, SRV y área de descarga", g("aguasAceitosaVol","[l/semana]"), g("aguasAceitosaTrat","Separador agua-aceite → empresa gestora de RP")]
          ]
        });
    H(4, "III.3.3 Residuos");
    I("Los residuos generados se clasifican conforme a la NOM-052-SEMARNAT-2005 (RP), NOM-001-ASEA-2019 (RME) y legislación general (RSU, RCD). Empresa gestora de RP: "+g("gestorRP","[nombre y registro SEMARNAT — completar]")+".");
    { const rd=state.tablaResiduos;
      TBL({ title:"Tabla III.10c. Generación, manejo y disposición de residuos por tipo y etapa",
            head:["Tipo de residuo","Etapa","Generación / año","Clasificación NOM","Gestión / control","Gestor autorizado"],
            k:(rd&&rd.length)?"auto":"scaffold",
            rows:(rd&&rd.length)?rd.map(r=>[r.tipo||"",r.etapa||"",r.gen||"",r.clas||"",r.gest||"",r.gestor||""]):empty(4,6) }); }
    H(4, "III.3.4 Fuentes emisoras de ruido");
    I("Las fuentes de ruido de la estación de servicio se evalúan conforme a NOM-081-SEMARNAT-1994 (65 dB(A) diurno en zona comercial / residencial).");
    { const rr=state.tablaRuido;
      TBL({ title:"Tabla III.10d. Fuentes de ruido — NOM-081-SEMARNAT-1994",
            head:["Fuente de ruido","dB(A) @ 1 m","Ubicación","Frecuencia","Cumplimiento NOM-081"],
            k:(rr&&rr.length)?"auto":"scaffold",
            rows:(rr&&rr.length)?rr.map(r=>[r.fuente||"",r.db||"",r.ubi||"",r.freq||"",r.cumpl||""]):empty(4,5) }); }
    H(4, "III.3.5 Diagrama de entradas y flujos");
    I("Diagrama de flujo que muestre entradas y salidas de insumos por etapa, con rutas y balances de materias primas, almacenamientos, productos y subproductos.");
    FIGAREA("f14");

    H(3, "III.4 Diagnóstico del entorno ambiental en el área de influencia");
    I("Presentar un diagnóstico ambiental objetivo de la calidad de los aspectos bióticos y abióticos del entorno, delimitando el área de influencia (AI) y representando en planos, mapas, esquemas y anexos fotográficos el estado de conservación.");
    H(4, "III.4.1 Justificación del Área de Influencia (AI)");
    I("Definir AI primaria (predio y colindancias) y, si aplica, AI secundaria (aire/agua/ruido/movilidad). Justificar con tipo de proyecto, vientos dominantes y receptores sensibles. Fuentes: INEGI, SMN, planeación urbana municipal/POEL/POET.");
    FIGAREA("f15");
    H(4, "III.4.2 Identificación de aspectos abióticos");
    I("Fuentes transversales: INEGI (edafología, geología, hidrología, uso de suelo), CONAGUA (cuencas/subcuencas, REPDA), SMN (clima), atlas de riesgo municipal/estatal. Los datos de las tablas siguientes provienen de dichas fuentes oficiales.");
    I("Clima: régimen de vientos (rosas), precipitación y temperatura; clasificación de Köppen modificada por E. García (1981).");
    FIGAREA("f16");
    { var tc=state.tablaClima;
      TBL({ title:"Tabla III.11. Clima del sitio (clasificación Köppen-García)", head:["Parámetro","Valor"],
            k:(tc&&tc.some(r=>r.val))?"auto":"scaffold",
            rows:(tc&&tc.some(r=>r.val))?tc.map(r=>[r.param||"",r.val||""]):empty(3,2) }); }
    I("Geología y geomorfología: unidades geológicas, pendientes y procesos (inundación, subsidencia); estabilidad del sitio y drenajes.");
    FIGAREA("f17");
    FIGAREA("f18");
    { var tgm=state.tablaGeomorfo;
      TBL({ title:"Tabla III.11b. Geología y geomorfología del AI (INEGI — cartas geológica y topográfica)",
            head:["Geoforma / unidad geológica","Descripción","Presencia en AI (%)"],
            k:(tgm&&tgm.some(r=>r.geoforma||r.desc))?"auto":"scaffold",
            rows:(tgm&&tgm.some(r=>r.geoforma||r.desc))?tgm.map(r=>[r.geoforma||"",r.desc||"",r.ai||""]):empty(3,3) }); }
    I("Edafología: tipos de suelo, textura, drenaje y vulnerabilidad a contaminación; profundidad y compactación.");
    FIGAREA("f19");
    { var ts=state.tablaSuelo;
      TBL({ title:"Tabla III.12. Tipo de suelo presente en el sitio (INEGI FAO)", head:["Parámetro","Valor"],
            k:(ts&&ts.some(r=>r.val))?"auto":"scaffold",
            rows:(ts&&ts.some(r=>r.val))?ts.map(r=>[r.param||"",r.val||""]):empty(3,2) }); }
    I("Hidrología: región hidrológica (con código), cuenca y subcuenca; cauces, zonas de inundación y descargas cercanas.");
    FIGAREA("f20");
    { var th=state.tablaHidro;
      TBL({ title:"Tabla III.13. Regiones, cuencas y subcuencas del AI (CONAGUA/INEGI)", head:["Parámetro","Valor"],
            k:(th&&th.some(r=>r.val))?"auto":"scaffold",
            rows:(th&&th.some(r=>r.val))?th.map(r=>[r.param||"",r.val||""]):empty(3,2) }); }
    I("Acuíferos: localización, disponibilidad media anual de agua subterránea, profundidad al nivel freático y vulnerabilidad a infiltración de hidrocarburos (NOM-011-CONAGUA-2000). Consultar DOF de disponibilidad de acuíferos (CONAGUA).");
    FIGAREA("f21");
    { var ta=state.tablaAcuifero;
      TBL({ title:"Tabla III.14. Acuífero del área de influencia (CONAGUA — DOF)", head:["Parámetro","Valor"],
            k:(ta&&ta.some(r=>r.val))?"auto":"scaffold",
            rows:(ta&&ta.some(r=>r.val))?ta.map(r=>[r.param||"",r.val||""]):empty(4,2) }); }
    H(4, "III.4.3 Identificación de aspectos bióticos");
    if (state && state.iaFloraFauna && String(state.iaFloraFauna).trim()) {
      String(state.iaFloraFauna).trim().split(/\n{2,}/).forEach(par => { if (par.trim()) P(par.trim()); });
    } else {
      I("Caracterización de vegetación (tipo/cobertura/estado, base fisonómica florística de Rzedowski 1978) y fauna asociada (mamíferos, aves, anfibios y reptiles), con listados bibliográficos y estatus NOM-059-SEMARNAT. Fuentes: CONABIO (USV, SNIB, Enciclovida), CONANP.");
    }
    FIGAREA("f22");
    FIGAREA("f23");
    var HBIO=["Familia","Nombre científico","Nombre común","NOM-059-SEMARNAT"];
    TBL({ title:"Tabla III.15. Listado de flora potencialmente presente en el AI (bibliográfico — CONABIO/Enciclovida)", head:HBIO, k:tK("tablaFlora"), rows: tRows("tablaFlora",HBIO,12) });
    { var tfo=state.tablaFloraObservada;
      TBL({ title:"Tabla III.15b. Flora observada en campo en el predio y colindancias del AI",
            head:["Nombre común","Nombre científico","Ubicación en predio","Cobertura (%)","Estatus NOM-059"],
            k:(tfo&&tfo.some(r=>r.nombre_comun||r.nombre_cientifico))?"auto":"scaffold",
            rows:(tfo&&tfo.some(r=>r.nombre_comun||r.nombre_cientifico))?tfo.map(r=>[r.nombre_comun||"",r.nombre_cientifico||"",r.ubicacion||"",r.cobertura||"",r.nom059||""]):empty(3,5) }); }
    TBL({ title:"Tabla III.16. Listado de mamíferos potencialmente presentes en el AI (bibliográfico — SNIB/Enciclovida)", head:HBIO, k:tK("tablaMamiferos"), rows: tRows("tablaMamiferos",HBIO,8) });
    TBL({ title:"Tabla III.17. Listado de avifauna potencialmente presente en el AI (bibliográfico — SNIB/Enciclovida)", head:HBIO, k:tK("tablaAvifauna"), rows: tRows("tablaAvifauna",HBIO,10) });
    TBL({ title:"Tabla III.18. Listado de anfibios y reptiles potencialmente presentes en el AI (bibliográfico — SNIB/Enciclovida)", head:HBIO, k:tK("tablaHerpeto"), rows: tRows("tablaHerpeto",HBIO,8) });
    { var tva=state.tablaFaunaObservada;
      TBL({ title:"Tabla III.18b. Fauna observada en campo en el predio y colindancias del AI (todos los grupos)",
            head:["Grupo","Nombre científico","Nombre común","Ubicación / zona","Estatus NOM-059","Comportamiento / evidencia"],
            k:(tva&&tva.some(r=>r.especie||r.comun))?"auto":"scaffold",
            rows:(tva&&tva.some(r=>r.especie||r.comun))?tva.map(r=>[r.grupo||"",r.especie||"",r.comun||"",r.ubicacion||"",r.nom059||"",r.comportamiento||""]):empty(4,6) }); }
    FIGAREA("f24");
    H(4, "III.4.4 Medio socioeconómico y cultural");
    I("Fuente: INEGI — Censos de Población y Vivienda 2010, 2015 y 2020; ENOE; CONEVAL (rezago social). Pueblos originarios: CDI/INPI. Patrimonio: INAH, CONABIO, CONANP.");
    { var tp=state.tablaPoblacion;
      TBL({ title:"Tabla III.19. Datos de población municipal — municipio de " + g("municipio","______") + " (INEGI Censos)",
            head:["Año","Mujeres","Hombres","Total de habitantes"],
            k:(tp&&tp.some(r=>r.mujeres||r.hombres||r.total))?"auto":"scaffold",
            rows:(tp&&tp.some(r=>r.mujeres||r.hombres||r.total))?tp.map(r=>[r.anio||"",r.mujeres||"",r.hombres||"",r.total||""]):empty(3,4) }); }
    { var tpi=state.tablaPiramide;
      TBL({ title:"Tabla III.20. Pirámide de edades del municipio de " + g("municipio","______") + " (INEGI Censo 2020)",
            head:["Franja de edad","Mujeres","Hombres","Total"],
            k:(tpi&&tpi.some(r=>r.mujeres||r.hombres||r.total))?"auto":"scaffold",
            rows:(tpi&&tpi.some(r=>r.mujeres||r.hombres||r.total))?tpi.map(r=>[r.franja||"",r.mujeres||"",r.hombres||"",r.total||""]):empty(6,4) }); }
    { var tod=state.tablaOtrosDemog;
      TBL({ title:"Tabla III.21. Indicadores de vivienda y servicios — municipio de " + g("municipio","______") + " (INEGI Censo 2020)",
            head:["Indicador","Valor"],
            k:(tod&&tod.some(r=>r.valor))?"auto":"scaffold",
            rows:(tod&&tod.some(r=>r.valor))?tod.map(r=>[r.indicador||"",r.valor||""]):tod.map(r=>[r.indicador||"",""]) }); }
    H(5, "Pueblos originarios y población indígena");
    P(g("pueblosOriginarios","[Especificar presencia o ausencia de pueblos originarios en el municipio — fuente: INPI]"));
    H(5, "Núcleos agrarios");
    P(g("nucleosAgrarios","[Especificar ejidos o comunidades agrarias dentro del AI — fuente: Registro Agrario Nacional]"));
    H(5, "Patrimonio cultural e histórico");
    P(g("patrimonioINAH","[Especificar presencia o ausencia de zonas arqueológicas federales o monumentos históricos — fuente: INAH]"));
    FIGAREA("f25");
    H(4, "III.4.5 Análisis de cercanía (radio del AI, máx. 2.0 km)");
    I("Funcionalidad y servicios ecosistémicos; consideraciones normativas de distancias y compatibilidad; receptores sensibles dentro del radio; evaluación de riesgo y sensibilidad.");
    FIGAREA("f26");
    { var tr=state.tablaReceptores;
      TBL({ title:"Tabla III.22a. Receptores sensibles identificados en el AI (radio ≤ 2 km)",
            head:["No.","Tipo de receptor","Nombre / descripción","Distancia (m)","Dirección","Capacidad / Pob.","Observaciones / riesgo"],
            k:(tr&&tr.some(r=>r.tipo||r.nombre))?"auto":"scaffold",
            rows:(tr&&tr.some(r=>r.tipo||r.nombre))?tr.map(r=>[r.no||"",r.tipo||"",r.nombre||"",r.dist||"",r.dir||"",r.pob||"",r.obs||""]):empty(3,7) }); }
    { var trr=state.tablaRiesgoReceptores;
      TBL({ title:"Tabla III.22b. Evaluación de riesgo por receptor y parámetro ambiental",
            head:["Receptor sensible","Parámetro","Nivel de riesgo","Justificación"],
            k:(trr&&trr.some(r=>r.receptor||r.nivel))?"auto":"scaffold",
            rows:(trr&&trr.length)?trr.map(r=>[r.receptor||"",r.parametro||"",r.nivel||"",r.justif||""]):empty(3,4) }); }
    H(4, "III.4.6 Diagnóstico ambiental");
    IAP("iaDiagnosticoAmbiental");
    I("Integrar lo anterior para concluir el estado de conservación/deterioro del AI y riesgos preexistentes; interacciones del sistema ambiental, subsistemas y Modelo Ecológico Conceptual (MEC).");
    FIGAREA("f27");
    if (state.incluirMEC !== false) {
      H(4, "Principios básicos del Modelo Ecológico Conceptual (MEC)");
      P(D.BOILER.mec);
      FIGAREA("f28");
      FIGAREA("f29");
    }

    H(3, "III.5 Identificación de impactos ambientales");
    IAP("iaImpactos");
    I("Describir el método y técnicas (matriz de Leopold adaptada, cálculo de índices, matriz de resultados) para identificar, predecir y evaluar los impactos significativos. Usar como mínimo magnitud, duración, intensidad e importancia.");
    if (state.incluirMetodo !== false) {
      H(4, "III.5.1 Metodología de evaluación de impacto");
      P(interp(D.BOILER.metodologia, v));
      TBL({ title:"Tabla III.22. Criterios y escalas de evaluación de impactos (0–5)", k:"auto",
            head:["Criterio","0","1","2","3","4","5"], rows: CRITERIOS });
      TBL({ title:"Tabla III.23. Rangos de clasificación de significancia (ISIG)", k:"auto",
            head:["Rango (0–100)","Clase","Interpretación"], rows: RANGOS_ISIG });
      FIGAREA("f30");
    }
    H(4, "III.5.2 Alcance y fuentes de información");
    I("Definir fases (preparación/construcción/operación/mantenimiento/abandono), medios ambientales y fuentes (memoria técnica, P&ID/planos, diagnóstico III.4 y MEC, NOM y mediciones). Exponer supuestos operativos (horarios, caudales, throughput).");
    H(4, "III.5.3 Identificación de acciones de impacto");
    I("Enlistar todas las acciones por fase por unidad operativa (descarga del autotanque, despacho, lavado de islas, pruebas de hermeticidad, mantenimiento SRV), con frecuencias y supuestos.");
    { var tap=state.tablaAccionesProyecto;
      TBL({ title:"Tabla III.23b. Acciones del proyecto identificadas para la matriz de Leopold (27 acciones)",
            head:["Código","Etapa","Acción","Descripción","Parámetros / frecuencia"],
            k:(tap&&tap.some(r=>r.codigo||r.accion))?"auto":"scaffold",
            rows:(tap&&tap.length)?tap.map(r=>[r.codigo||"",r.etapa||"",r.accion||"",r.desc||"",r.params||""]):empty(10,5) }); }
    H(4, "III.5.4 Identificación de factores y componentes ambientales");
    I("Derivar los factores del diagnóstico (III.4) y del MEC. Señalar receptores sensibles y si existe umbral normativo (LMP/criterio).");
    TBL({ title:"Tabla III.24. Componentes y atributos del entorno",
          head:["Medio","Sistema","Componente","Factor","Regulador (NOM)"], k:"auto", rows: COMPONENTES });
    H(4, "III.5.5 Cruce de interacciones (matriz de Leopold adaptada)");
    I("Construir la matriz de Leopold (acción × factor), marcar solo interacciones con vía de exposición plausible y asignar ±M (0–5).");
    FIGAREA("f31");
    { var tir=state.tablaImpactosResumen;
      TBL({ title:"Tabla III.25. Resumen de identificación de impactos por etapa",
            head:["Etapa","Positivos (+)","Negativos (−)","Total"],
            k:(tir&&tir.some(r=>r.positivos||r.negativos||r.total))?"auto":"scaffold",
            rows:(tir&&tir.length)?tir.map(r=>[r.etapa||"",r.positivos||"",r.negativos||"",r.total||""]):empty(4,4) }); }
    H(4, "III.5.6 Evaluación de criterios e índices");
    I("Construir la matriz de resultados con cálculos de índices (intensidad, básico, complementario, significancia), clase, medida, NOM y evidencia.");
    FIGAREA("f32");
    { var tis=state.tablaImpactosSignificativos;
      TBL({ title:"Tabla III.25b. Impactos significativos (ISIG ≥ 40) — evaluación Gómez-Orea adaptada",
            head:["Código","Acción","Factor ambiental","M","E","D","R","P","A","S","ISIG","Semáforo","Descripción"],
            k:(tis&&tis.some(r=>r.codigo||r.isig))?"auto":"scaffold",
            rows:(tis&&tis.length)?tis.map(r=>[r.codigo||"",r.accion||"",r.factor||"",r.m||"",r.e||"",r.d||"",r.r||"",r.p||"",r.a||"",r.s||"",r.isig||"",r.semaforo||"",r.desc||""]):empty(6,13) }); }
    H(4, "III.5.7 Descripción de impactos");
    // Categorías dinámicas leídas de la matriz (state.impactoCategorias, vía
    // "Leer matriz con IA") — sin lista fija; cada una con su propia figura
    // (catimg_i, fusionada en D.AREAS por areasDinamicas()/todasLasAreas() en
    // app.js). Si no se usó esa función, se conserva la guía ✎ genérica.
    if (Array.isArray(state.impactoCategorias) && state.impactoCategorias.length) {
      state.impactoCategorias.forEach((c, i) => {
        H(5, c.nombre || ("Categoría " + (i + 1)));
        const parrafos = Array.isArray(c.narrativa) ? c.narrativa : (c.narrativa ? [c.narrativa] : []);
        if (parrafos.length) parrafos.forEach((p) => P(p));
        else I("Sin narrativa generada para esta categoría — complétala manualmente.");
        FIGAREA("catimg_" + i);
      });
    } else {
      I("Identificar y describir los impactos más significativos (narrativa técnica de los “altos” y “medios” + medidas) por medio físico, biológico y socioeconómico, incluyendo riesgo tecnológico.");
    }
    H(4, "III.5.8 Balance de impacto");
    I("Balance total del escenario: sumatoria neta por medio y por fase, y número de impactos por clase.");
    { var tib=state.tablaImpactosBalance;
      TBL({ title:"Tabla III.26. Balance de impactos por medio",
            head:["Medio","Σ ISIG (−)","Σ ISIG (+)","Balance neto","# Altos","# Medios"],
            k:(tib&&tib.some(r=>r.sig_neg||r.sig_pos||r.balance))?"auto":"scaffold",
            rows:(tib&&tib.length)?tib.map(r=>[r.medio||"",r.sig_neg||"",r.sig_pos||"",r.balance||"",r.altos||"",r.medios||""]):empty(4,6) }); }

    H(3, "III.6 Determinación de medidas para su prevención y mitigación");
    IAP("iaMedidas");
    I("Identificar impactos principales por etapa y proponer medidas específicas, con programa de ejecución, responsable, NOM/marco legal aplicable y resultado esperado/impacto residual.");
    var HMED=["Factor ambiental","Impacto / fuente","Medida de prevención/mitigación","Programa y responsable","NOM / marco legal","Resultado / impacto residual"];
    TBL({ title:"Tabla III.27. Relación de impactos y medidas (etapa de preparación y construcción)",
          head:HMED, k:tK("tablaMedidasPrep"), rows: tRows("tablaMedidasPrep",HMED,3) });
    TBL({ title:"Tabla III.28. Relación de impactos y medidas (etapa de operación y mantenimiento)",
          head:HMED, k:tK("tablaMedidasOper"), rows: tRows("tablaMedidasOper",HMED,3) });
    TBL({ title:"Tabla III.29. Relación de impactos y medidas (etapa de abandono)",
          head:HMED, k:tK("tablaMedidasAband"), rows: tRows("tablaMedidasAband",HMED,3) });
    H(4, "III.6.1 Programa de Vigilancia Ambiental");
    IAP("iaVigilancia");
    var HVIG=["Etapa","Acción de vigilancia","Indicador verificable","Frecuencia","Responsable"];
    TBL({ title:"Tabla III.30. Programa de Vigilancia Ambiental",
          head:HVIG, k:tK("tablaVigilancia"), rows: tRows("tablaVigilancia",HVIG,5) });
    I("Supervisión y seguimiento: procedimientos para supervisar el cumplimiento de las medidas y el Programa de Vigilancia Ambiental.");

    H(3, "III.7 Condiciones adicionales para la sustentabilidad");
    I("Compromisos ambientales voluntarios que el promovente adopta más allá de las obligaciones normativas mínimas, con el fin de reforzar la viabilidad ambiental del proyecto y contribuir a la sustentabilidad local.");
    if (!IAP("iaSustentabilidad")) {
      I("Desarrollar narrativa: buenas prácticas voluntarias adoptadas (señalética, vegetación nativa, eficiencia energética, capacitación HSE, monitoreo, economía circular).");
    }
    { var tco=state.tablaCompromisos;
      TBL({ title:"Tabla III.31. Compromisos ambientales voluntarios del promovente",
            head:["Compromiso / buena práctica","Responsable","Plazo / etapa","Indicador de cumplimiento"],
            k:(tco&&tco.some(r=>r.compromiso))?"auto":"scaffold",
            rows:(tco&&tco.length)?tco.map(r=>[r.compromiso||"",r.responsable||"",r.plazo||"",r.indicador||""]):empty(5,4) }); }

    // ========================================================================
    // IV. Abandono del sitio — desarrollo completo (8 subsecciones)
    // ========================================================================
    H(1, "IV. Abandono del sitio");
    P(interp(D.BOILER.abandono_intro, { ubicacion: v.ubicacion }));
    if (!IAP("iaAbandono")) {
      P("El presente plan de abandono aplica a los " + g("ivComponentes","tanques, líneas, dispensadores, SRV, trampas, drenajes y edificios") + " ubicados en " + g("ubicacion","[ubicación]") + ". La vida útil estimada de las instalaciones es de " + g("ivVidaUtil","25") + " años contados a partir del inicio de operaciones" + (g("ivAnioOperacion","") ? " (año " + g("ivAnioOperacion","") + ")" : "") + ". El uso de suelo posterior al cierre será: " + g("ivUsoPosterior","comercial / mixto") + ".");
    }
    if (state.incluirAbandono !== false) {

      H(3, "IV.1 Gatillos y tipo de cierre");
      P("El cierre de la estación de servicio podrá activarse ante cualquiera de los escenarios descritos en la tabla siguiente. El tipo de cierre, su alcance y la ventana temporal de ejecución se definirán en función del gatillo específico, dando prioridad a la seguridad de personas, la integridad de la infraestructura colindante y la protección del suelo y agua subterránea.");
      { var tg=state.tablaGatillos;
        TBL({ title:"Tabla IV.1. Gatillos de cierre y tipo de respuesta",
              head:["Gatillo de cierre","Tipo de cierre","Alcance de actividades","Ventana temporal","Justificación"],
              k:(tg&&tg.some(r=>r.gatillo))?"auto":"scaffold",
              rows:(tg&&tg.length)?tg.map(r=>[r.gatillo||"",r.tipo||"",r.alcance||"",r.ventana||"",r.justif||""]):empty(5,5) }); }

      H(3, "IV.2 Acciones de cierre por componente");
      P("Cada componente de la estación requiere acciones específicas de desinstalación, disposición y control de riesgos. La tabla siguiente detalla el procedimiento, la evidencia requerida y la participación de la Unidad de Verificación (UV) acreditada ante ASEA para cada elemento.");
      { var tac=state.tablaAccionesCierre;
        TBL({ title:"Tabla IV.2. Acciones de cierre detalladas por componente",
              head:["Componente","Acción de cierre","Especificaciones","Evidencia de cumplimiento","UV involucrada","Observaciones"],
              k:(tac&&tac.some(r=>r.componente))?"auto":"scaffold",
              rows:(tac&&tac.length)?tac.map(r=>[r.componente||"",r.accion||"",r.especif||"",r.evidencia||"",r.uv||"",r.obs||""]):empty(8,6) }); }

      H(3, "IV.3 Procedimientos críticos de seguridad y control de riesgos");
      P("Las operaciones de cierre involucran trabajos en atmósferas potencialmente explosivas (hidrocarburos), espacios confinados (tanques) y actividades de corte/soldadura. Los protocolos siguientes son obligatorios y deben ejecutarse en el orden indicado.");
      H(4, "A. Desgasificación e inercia de tanques (Prioridad 1)");
      P(D.BOILER.abandono_iv3);
      P("Procedimiento secuencial: (1) Aislamiento — cerrar todas las válvulas de entrada/salida y colocar etiquetas 'NO OPERAR' (LOTO). (2) Ventilación forzada — abrir tapa lateral del tanque y conectar ventilador de aire forzado por mínimo 15 minutos. (3) Inercia con N₂ — bombear nitrógeno a 5 PSI durante 2–3 días hasta alcanzar O₂ <5 % y LEL <10 %. (4) Monitoreo LEL — medir con detector calibrado cada 4 horas y registrar. (5) Certificación — contratista acreditado ASEA emite certificado de desgasificación. Duración estimada: 5–7 días por tanque. Evidencia: Certificado UV + reportes LEL diarios.");
      H(4, "B. Sistema LOTO (Lock Out / Tag Out)");
      P("Antes de cualquier trabajo en tanques o líneas: (1) Cerrar válvulas manuales de todos los flujos. (2) Colocar candado de seguridad en cada válvula (un candado = una persona autorizada). (3) Colocar tarjeta de etiquetado con nombre, fecha y firma. (4) Solo la persona que colocó el candado puede retirarlo. Responsable: Supervisor de sitio + contratista. Evidencia: Fotos de LOTO + firma de aceptación.");
      H(4, "C. Permisos de trabajo (Hot Work / Espacio Confinado)");
      P("Para soldadura, corte o entrada a tanques: emitir Permiso de Trabajo Caliente (HOT WORK) y/o Permiso de Espacio Confinado según corresponda. Cada permiso incluye: duración máxima 8 horas, supervisor presente, equipo de protección, testigo externo, e inspección pre-trabajo con detector 4-gas (O₂, LEL, CO, H₂S). Validez: 1 día máximo.");
      H(4, "D. Equipo de Protección Personal (EPP)");
      P("EPP mínimo durante todo el proceso de cierre: casco clase C (no conductor), lentes de seguridad, mascarilla N-95 (SCBA si LEL >10 % o entrada a tanque), guantes de nitrilo (resiste combustibles), botas de acero antideslizantes, arnés si trabaja en altura >1.5 m. El contratista es responsable de verificar el EPP de todo su personal.");
      H(4, "E. Monitoreo continuo de gases");
      P("Detector 4-gas calibrado diariamente (O₂, LEL, CO, H₂S), operado por personal entrenado, con alarma audible activa durante todas las operaciones de desgasificación y retiro de equipos.");

      H(3, "IV.4 Gestión de residuos y aguas de limpieza durante el cierre");
      P("El cierre genera residuos de cuatro categorías principales: fondos de tanques (RP presuntos), aguas de enjuague, residuos de construcción y demolición (RCD) y residuos de mantenimiento (RME). Su gestión se realizará conforme a la NOM-052-SEMARNAT-2005, NOM-001-ASEA-2019 y la LGPGIR.");
      { var trc=state.tablaResiduesCierre;
        TBL({ title:"Tabla IV.3. Residuos generados durante el cierre — clasificación y gestión",
              head:["Tipo de residuo","Clasificación / NOM","Volumen estimado","Gestión y control","Gestor autorizado"],
              k:(trc&&trc.some(r=>r.residuo))?"auto":"scaffold",
              rows:(trc&&trc.length)?trc.map(r=>[r.residuo||"",r.clas||"",r.vol||"",r.gestion||"",r.gestor||""]):empty(4,5) }); }

      H(3, "IV.5 Muestreo confirmatorio de suelos");
      P("Una vez retirados todos los equipos e infraestructura soterrada, se realizará un muestreo confirmatorio de suelos para verificar la ausencia de contaminación por hidrocarburos. El muestreo será ejecutado por un ingeniero ambiental y analizado por laboratorio acreditado conforme a NMX-EC-17025-IMNC. Los resultados se compararán contra los criterios de remediación de SEMARNAT para uso industrial/comercial. Si algún punto supera los límites, se procederá a excavación y disposición como RP, o a remediación in situ (biorremedación o solidificación).");
      { var tms=state.tablaMuestreoSuelo;
        TBL({ title:"Tabla IV.4. Puntos de muestreo confirmatorio de suelos",
              head:["Punto","Ubicación / zona","Profundidades","Analitos (método EPA)"],
              k:(tms&&tms.some(r=>r.punto))?"auto":"scaffold",
              rows:(tms&&tms.length)?tms.map(r=>[r.punto||"",r.ubicacion||"",r.prof||"",r.analitos||""]):empty(4,4) }); }
      I("Costo estimado del muestreo: $8,000–15,000 MXN (muestreo + análisis). Duración: 2–3 semanas. Si se detecta contaminación: añadir costo de remediación ($50,000+ MXN).");

      H(3, "IV.6 Restitución y post-cierre");
      P("Concluidas las actividades de retiro de equipos y gestión de residuos, se procederá a la restitución física del predio a condiciones apropiadas para el uso de suelo posterior definido. Las actividades de restitución incluyen relleno de zanjas, nivelación topográfica, revegetación (si aplica) y señalización de sitio remediado.");
      { var tre=state.tablaRestitucion;
        TBL({ title:"Tabla IV.5. Actividades de restitución y post-cierre",
              head:["Acción","Especificación técnica","Cantidad / alcance","Verificación","Responsable"],
              k:(tre&&tre.some(r=>r.accion))?"auto":"scaffold",
              rows:(tre&&tre.length)?tre.map(r=>[r.accion||"",r.especif||"",r.cantidad||"",r.verif||"",r.resp||""]):empty(5,5) }); }
      P("El sitio se mantendrá bajo monitoreo post-cierre por un periodo mínimo de 5 años tras la liberación, con muestreos anuales de suelo en los puntos M-01 a M-C para confirmar la estabilidad de las condiciones ambientales.");

      H(3, "IV.7 Criterios de finalización (tabla de aceptación)");
      P("La liberación definitiva del sitio y el cierre administrativo ante ASEA y el municipio estarán condicionados al cumplimiento de los nueve criterios de aceptación siguientes. Todos deben estar cumplidos y con evidencia documental antes de solicitar la resolución de cierre:");
      { var tcc=state.tablaCriteriosCierre;
        TBL({ title:"Tabla IV.6. Criterios de aceptación y liberación del sitio",
              head:["Actividad de cierre","Criterio de aceptación","Evidencia requerida"],
              k:(tcc&&tcc.some(r=>r.actividad))?"auto":"scaffold",
              rows:(tcc&&tcc.length)?tcc.map(r=>[r.actividad||"",r.criterio||"",r.evidencia||""]):empty(9,3) }); }

      H(3, "IV.8 Avisos y cierres administrativos");
      P(D.BOILER.abandono_iv8);
      { var tav=state.tablaAvisosCierre;
        TBL({ title:"Tabla IV.7. Programa de avisos y cierres administrativos",
              head:["Autoridad","Qué se presenta","Plazo","Acción requerida","Evidencia"],
              k:(tav&&tav.some(r=>r.autoridad))?"auto":"scaffold",
              rows:(tav&&tav.length)?tav.map(r=>[r.autoridad||"",r.que||"",r.plazo||"",r.accion||"",r.evidencia||""]):empty(5,5) }); }

      H(4, "Cronograma estimado de cierre");
      P("El cierre ordenado de la estación de servicio requiere un mínimo de 3 meses desde la emisión del primer aviso a autoridades hasta la liberación del sitio. El cronograma siguiente es indicativo; las fechas exactas se determinarán en función del gatillo de cierre activado:");
      { var tcr=state.tablaCronogramaCierre;
        TBL({ title:"Tabla IV.8. Cronograma estimado de actividades de cierre",
              head:["Semana / periodo","Actividad principal","Responsable"],
              k:(tcr&&tcr.some(r=>r.semana))?"auto":"scaffold",
              rows:(tcr&&tcr.length)?tcr.map(r=>[r.semana||"",r.actividad||"",r.resp||""]):empty(8,3) }); }
      I("Presupuesto estimado de cierre: " + g("ivPresupuestoCierre","Por definir") + " MXN. El costo varía significativamente dependiendo de si se detecta contaminación de suelo (agrega $50,000+ por remediación).");

    } // fin if incluirAbandono

    // ========================================================================
    // V. Conclusión — 9 subsecciones
    // ========================================================================
    H(1, "V. Conclusión");
    if (state.incluirConclusion !== false) {

      H(3, "V.1 Carácter del instrumento evaluatorio");
      interp(D.BOILER.conclusion_caracter, v).split(/\n\n+/).forEach(par=>{ if(par.trim()) P(par.trim()); });

      H(3, "V.2 Síntesis del proyecto");
      if (!IAP("iaConclusion")) {
        P(interp(D.BOILER.conclusion_sintesis, {
          ubicacion: v.ubicacion, empresa: g("empresa","[Empresa promovente]"),
          repLegal: g("repLegal","[Representante legal]"),
          superficie: g("superficie","[superficie]"), inversion: g("inversion","[inversión]"),
          empleosDir: g("empleosDir","[empleos directos]"), empleosInd: g("empleosInd","[empleos indirectos]")
        }));
      }
      TBL({ title:"Tabla V.1. Datos identificativos del proyecto", head:["Dato","Valor"], k:"auto",
            rows:[
              ["Nombre del proyecto",           g("proyecto","[Nombre del proyecto]")],
              ["Promovente / empresa",           g("empresa","[Empresa]")],
              ["Representante legal",            g("repLegal","[Nombre]")],
              ["Ubicación",                      v.ubicacion],
              ["Municipio / Estado",             g("municipio","[municipio]") + " / " + g("estado","[estado]")],
              ["Superficie del proyecto",        g("superficie","[m²]") + " m²"],
              ["Inversión estimada",             "$" + g("inversion","[MXN]") + " MXN"],
              ["Empleos directos / indirectos",  g("empleosDir","—") + " directos / " + g("empleosInd","—") + " indirectos"],
              ["Duración de operación",          g("durOper","[años]") + " años"],
              ["Fecha del informe",              g("fecha","[fecha]")]
            ]});

      H(3, "V.3 Vinculación con el ordenamiento jurídico");
      P(interp(D.BOILER.conclusion_juridico, { uab: g("uab","[UAB]"), clavePolitica: g("clavePolitica","[clave]"), estado: g("estado","[estado]") }));

      H(3, "V.4 Síntesis del diagnóstico ambiental");
      P(interp(D.BOILER.conclusion_diagnostico, { municipio: g("municipio","[municipio]"), estado: g("estado","[estado]") }));

      H(3, "V.5 Evaluación de impactos — resumen cuantificado");
      P(D.BOILER.conclusion_impactos);
      { var tib2=state.tablaImpactosBalance;
        var tir2=state.tablaImpactosResumen;
        var hasBalance=tib2&&tib2.some(r=>r.sig_neg||r.sig_pos||r.balance);
        var hasResumen=tir2&&tir2.some(r=>r.positivos||r.negativos||r.total);
        if(hasResumen){
          TBL({ title:"Tabla V.2. Resumen de impactos por etapa (de Sección III.5)",
                head:["Etapa","Positivos (+)","Negativos (−)","Total"],
                k:"auto", rows: tir2.map(r=>[r.etapa||"",r.positivos||"",r.negativos||"",r.total||""]) });
        }
        if(hasBalance){
          TBL({ title:"Tabla V.3. Balance de impactos por medio (de Sección III.5)",
                head:["Medio","Σ ISIG (−)","Σ ISIG (+)","Balance neto","# Altos","# Medios"],
                k:"auto", rows: tib2.map(r=>[r.medio||"",r.sig_neg||"",r.sig_pos||"",r.balance||"",r.altos||"",r.medios||""]) });
        }
        if(!hasBalance&&!hasResumen){
          I("Completar tablas de resumen y balance en Sección III.5 para que se reflejen automáticamente aquí.");
        }
      }

      H(3, "V.6 Eficacia de las medidas de prevención, mitigación y sustentabilidad");
      P(D.BOILER.conclusion_medidas);

      H(3, "V.7 Declaración de viabilidad ambiental");
      P(g("vViabilidad","El proyecto es ambientalmente viable con la implementación de las medidas de prevención y mitigación propuestas en la Sección III.6 y las condiciones adicionales de sustentabilidad de la Sección III.7 del presente Informe Preventivo."));
      { var nota=g("vNotaConclusion",""); if(nota.trim()) P("Nota del responsable técnico: " + nota); }

      H(3, "V.8 Compromisos del promovente ante la ASEA");
      P("El promovente " + g("empresa","[empresa]") + ", a través de su representante legal " + g("repLegal","[nombre]") + ", se compromete a cumplir las obligaciones siguientes como condición de operación del proyecto:");
      { var tcf=state.tablaCompromisosFinales;
        TBL({ title:"Tabla V.4. Compromisos ambientales del promovente ante la ASEA",
              head:["No.","Compromiso del promovente","Etapa","NOM / instrumento de respaldo"],
              k:(tcf&&tcf.some(r=>r.compromiso))?"auto":"scaffold",
              rows:(tcf&&tcf.length)?tcf.map(r=>[r.num||"",r.compromiso||"",r.etapa||"",r.normativa||""]):empty(7,4) }); }

      H(3, "V.9 Declaratoria del responsable técnico");
      interp(D.BOILER.conclusion_declaratoria, v).split(/\n\n+/).forEach(par=>{ if(par.trim()) P(par.trim()); });
    }
    B.push({ t:"firma", promovente: g("repLegal","__________"), tecnico: g("cNombre","__________"), cedula: g("cCedula","__________"), profesion: g("cProfesion","__________") });

    H(1, "VI. Planos y cartografía");
    I("Anexar planos y cartografía: localización a 4 niveles, plano arquitectónico, mapas temáticos (clima, geología, edafología, hidrología, NDVI/NDWI, UGA, ANP), área de influencia y matriz de Leopold.");
    FIGAREA("f33");
    // Figuras adicionales que agregue el usuario (anexo fotográfico)
    if (((ctx.figsByArea && ctx.figsByArea["anexo"]) || []).length) {
      H(3, "Anexo fotográfico y de cartografía adicional");
      FIGAREA("anexo");
    }

    // Vigencias y compromisos documentales (state.tablas.tablaVigencias,
    // llenado desde "Leer vigencias y compromisos (IA)") — evidencia de qué
    // permisos/dictámenes están vigentes, vencidos o pendientes.
    if (tFilled("tablaVigencias")) {
      H(3, "Vigencias y compromisos documentales");
      I("Evidencia de trámites, permisos y dictámenes del proyecto: estatus, folio, autoridad, vigencia y prioridad de atención.");
      var HVIG=["Documento","Estatus","Folio","Autoridad","Emisión","Vencimiento","Prioridad"];
      TBL({ title:"Tabla — Vigencias y compromisos documentales",
            head:HVIG, k:"auto", rows: tRows("tablaVigencias",HVIG,1) });
    }

    H(2, "Referencias");
    B.push({ t:"refs", k:"auto", items: D.REFERENCIAS });

    return B;
  }

  // ---------- datos de apoyo ----------
  const TOC = ["Glosario","Introducción",
    "I. Datos generales del proyecto, promovente y del responsable del estudio",
    "II. Fundamento jurídico","III. Aspectos técnicos y ambientales",
    "IV. Abandono del sitio","V. Conclusión","VI. Planos y cartografía","Referencias"];
  const CRITERIOS = [
    ["Magnitud (M)","Nula","Muy baja","Baja","Media","Alta","Muy alta"],
    ["Extensión (E)","Puntual","Sitio específico","Predio","Local (≤500 m)","Vecinal (≤1 km)","Regional (>1 km)"],
    ["Duración (D)","Instantánea","Muy corta","Corta","Media","Larga","Permanente"],
    ["Reversibilidad (R)","Totalmente reversible","Alta","Media-alta","Media","Baja","Irreversible"],
    ["Probabilidad/frecuencia (P)","Muy improbable","Improbable","Ocasional","Posible","Probable","Casi seguro"],
    ["Acumulación (A)","No acumulativo","Muy baja","Baja","Media","Alta","Muy alta"],
    ["Sinergia (S)","Sin sinergias","Muy baja","Baja","Media","Alta","Muy alta"],
    ["Importancia (Imp)","Muy baja","Baja","Media-baja","Media","Alta","Muy alta (receptor normado/ANP)"]
  ];
  const RANGOS_ISIG = [
    ["0–20","Bajo","Impacto menor; control rutinario"],
    ["21–40","Bajo-Medio","Requiere control y verificación"],
    ["41–60","Medio","Medidas específicas y seguimiento"],
    ["61–80","Alto","Medidas robustas + monitoreo estrecho"],
    ["81–100","Muy Alto","Mitigación prioritaria / rediseño"]
  ];
  const COMPONENTES = [
    ["Medio Físico","Abiótico","Atmósfera","Calidad del aire / partículas / ruido","NOM-081-SEMARNAT-1994"],
    ["Medio Físico","Abiótico","Suelo","Calidad del suelo / uso de suelo / erosión","NOM-138-SEMARNAT/SSA1"],
    ["Medio Físico","Abiótico","Hidrología superficial","Cuerpos de agua / calidad del agua","NOM-001-SEMARNAT-2021"],
    ["Medio Físico","Abiótico","Hidrología subterránea","Recarga del acuífero / calidad","NOM-011-CONAGUA-2000"],
    ["Medio Biótico","Flora","Vegetación terrestre","Abundancia / especies con estatus / riesgo de incendio","NOM-059-SEMARNAT-2010"],
    ["Medio Biótico","Fauna","Terrestre","Abundancia / estatus / hábitat","NOM-059-SEMARNAT-2010"],
    ["Medio Socioeconómico","Económico","Economía","Flujo vehicular / empleo / desarrollo regional","—"],
    ["Medio Socioeconómico","Urbano","Infraestructura","Equipamiento / demanda de servicios / riesgo","—"]
  ];
  function empty(n,c){ return Array.from({length:n}, ()=> Array.from({length:c}, ()=> "")); }
  // Andamiaje de la Tabla III.2 (Programa de trabajo) cuando NO se ha llenado con
  // IA/plano: mismas actividades por etapa que antes, con Periodo/Duración en blanco.
  function programaScaffold(){
    const P="Preparación y construcción", O="Operación", A="Abandono";
    const r=(etapa,act)=>[etapa,act,"",""];
    return [
      r(P,"Limpieza del terreno"), r(P,"Excavación para cimentaciones del tanque"),
      r(P,"Construcción estructural de oficinas y caseta de vigilancia"),
      r(P,"Instalación del tanque de almacenamiento y equipos"),
      r(P,"Consumo de insumos"), r(P,"Generación y manejo de residuos sólidos"),
      r(P,"Generación y manejo de aguas residuales"), r(P,"Contratación de mano de obra"),
      r(O,"Operación de la estación de servicio"), r(O,"Operación del motor para bomba de llenado"),
      r(O,"Transporte de insumos y personal"), r(O,"Consumo de insumos"),
      r(O,"Generación y manejo de residuos sólidos"), r(O,"Generación y manejo de aguas residuales"),
      r(O,"Generación y manejo de residuos peligrosos"), r(O,"Contratación de mano de obra"),
      r(A,"Desmantelamiento de tanque"), r(A,"Demolición de estructuras de concreto y block"),
      r(A,"Transporte de equipos, residuos de demolición y personal"),
      r(A,"Generación y manejo de residuos sólidos"), r(A,"Generación y manejo de aguas residuales"),
      r(A,"Generación y manejo de residuos peligrosos"), r(A,"Contratación de mano de obra")
    ];
  }
  function actividades(extra){
    let b="Las actividades principales del proyecto, propias de una estación de servicio (gasolinera), son: recepción de combustibles, almacenamiento de combustible y expedición al público.";
    if(extra && String(extra).trim()) b += " " + extra;
    return b;
  }
  function fechaLarga(iso){ if(!iso) return "[fecha]"; try{ return new Date(iso+"T00:00").toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric"}); }catch(e){ return iso; } }

  window.IPDOC = { build };
})();
