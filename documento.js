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
    H(4, "II.1.1 Acuerdos Internacionales");
    I("Tratados que aterricen obligaciones sobre emisiones, residuos peligrosos, sustancias, ozono, mercurio (Acuerdo de París, Montreal para SAO, Minamata para mercurio, Basilea/Estocolmo/Rotterdam para residuos químicos). Indicar cómo se aterriza en leyes/NOM mexicanas exigibles.");
    H(4, "II.1.2 Constitución de los Estados Unidos Mexicanos");
    I("Artículos relevantes: 4º (medio ambiente sano), 25–28, 27 (subsuelo y recursos), 73 (facultades federales), 115 (competencias municipales). Fundamenta competencias y el deber de prevenir daños.");
    H(4, "II.1.3 Leyes");
    I("Ambientales base (LGEEPA; LGPGIR; Ley General de Cambio Climático; Ley de Aguas Nacionales; Ley de Infraestructura de la Calidad). Sector (Ley del Sector de Hidrocarburos; Ley de la ASEA). Uso de suelo/OT (LGAHOTDU y correlativas estatales). Recursos y biodiversidad si aplica. Indicar permisos, estudios, avisos o reportes exigidos.");
    H(4, "II.1.4 Reglamentos");
    I("Reglamentos de la LGEEPA (EIA; Atmósfera; Residuos Peligrosos), Reglamento de la Ley de Aguas Nacionales y Disposiciones Administrativas de Carácter General (DACG) de ASEA aplicables al diseño, construcción, pre-arranque, operación, mantenimiento y cierre.");
    H(4, "II.1.5 NOM");
    I("Solo NOM vigentes que impongan valores límite, métodos, especificaciones o pruebas: riesgos y seguridad del sector hidrocarburos, descargas de aguas, residuos, emisiones a la atmósfera, suelos/remediación, ruido/vibraciones. En cada celda: clave completa + título breve y vinculación (obligación + evidencia + periodicidad + etapa). Verificar vigencia (fecha/versión).");
    H(4, "II.1.6 NMX");
    I("Estándares voluntarios (salvo que una NOM o permiso los haga obligatorios): series NMX-AA para métodos ambientales; NMX-EC-17025 para laboratorios.");
    H(4, "II.1.7 Otros");
    I("Leyes y reglamentos estatales/municipales, normas técnicas complementarias, lineamientos/guías de la autoridad (ASEA/SEMARNAT/CONAGUA) y condicionantes de permisos previos.");

    H(3, "II.2 Planes de desarrollo urbano y de ordenamiento ecológico");
    H(4, "II.2.1 Programa de Ordenamiento Ecológico General del Territorio (POEGT)");
    P(interp(D.BOILER.poegt_intro, v));
    FIGAREA("f03");
    TBL({ title:"Tabla II.2. Unidad Ambiental Biofísica (UAB) de interés por ubicación del proyecto",
          head:["Proyecto","UAB"], k: isAuto("uab")?"auto":"scaffold", rows:[[g("proyecto","[Proyecto]"), val("uab")]] });
    TBL({ title:"Tabla II.3. Políticas, usos y estrategias de regulación ecológica aplicables a la UAB",
          head:["Concepto","Valor"], k:"scaffold",
          rows:[["Rectores de desarrollo",""],["Coadyuvantes del desarrollo",""],["Asociados del desarrollo",""],
                ["Otros sectores de interés",""],["Política Ambiental",""],["Clave del Área de Atención Prioritaria",""],
                ["Nombre del Área de Atención Prioritaria",""],["Estrategias sectoriales",""]] });
    TBL({ title:"Tabla II.4. Vinculación del proyecto con las estrategias del POEGT",
          head:["Estrategia","Disposición","Cumplimiento de estrategia"], k:"auto",
          rows: D.ESTRATEGIAS_POEGT.map((e,i)=>{ const st=state.estrategias[i]||{d:e.d}; return [ e.n+". "+e.t, st.d, e.txt ]; }) });

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
    TBL({ title:"Tabla II.7. Vinculación con los criterios del Plan Municipal de " + g("municipio","______"),
          head:["Criterio","Descripción","Relación directa con el proyecto"], k:"scaffold",
          rows:[["Ordenamiento territorial y uso de suelo","",""],["Movilidad y seguridad vial","",""],
                ["Agua potable, alcantarillado y saneamiento","",""],["Calidad ambiental (aire, suelo, residuos)","",""],
                ["Gestión de riesgos y resiliencia","",""]] });
    I("Vincular con el Programa de Ordenamiento Ecológico Local (POEL) del municipio: clave UGA, política ambiental, uso de suelo predominante, condicionado e incompatible.");
    FIGAREA("f05");
    TBL({ title:"Tabla II.8. POEL — Unidad de Gestión Ambiental del municipio",
          head:["Clave UGA","Nombre UGA","Política territorial","Uso predominante","Uso condicionado","Uso incompatible"],
          k:"scaffold", rows:[["","","","","",""]] });

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

    H(4, "III.1.3 Dimensiones del proyecto");
    I("Para proyectos puntuales: área del predio (+ plano/croquis), mencionando superficies de afectación permanente y temporal. Describir instalaciones estructurales y civiles (urbanización, edificios/oficinas, techos, instalaciones hidráulicas y sanitarias, estación de vigilancia, zonas de protección, anuncio) e instalaciones industriales y mecánicas (tanques de almacenamiento, equipos clave, islotes de llenado/despachadores, tomas de recepción y suministro, sistema de aire comprimido).");
    FIGAREA("f11");

    H(4, "III.1.4 Características del proyecto según su naturaleza");
    I("Mencionar los procesos que se emplearán, las sustancias y el tipo de almacenamiento, condiciones de operación, servicios requeridos (agua, energía, drenaje, residuos: especificar origen y sistemas) y obras provisionales/auxiliares al proyecto.");

    H(4, "III.1.5 Uso de suelo en el sitio seleccionado");
    P("Uso actual del suelo: " + g("usoSuelo","[industrial / urbano / suburbano / agrícola / erial]") + ". Describir brevemente los usos predominantes en la zona del proyecto y en los predios colindantes.");

    H(4, "III.1.6 Programa de trabajo");
    I("Descripción de las actividades por etapa del proyecto (preparación del sitio, proceso constructivo, operación y mantenimiento, abandono) y cronograma esquemático (diagrama de Gantt).");
    TBL({ title:"Tabla III.2. Diagrama de Gantt — Actividades por etapa (duración en meses)",
          head:["Etapa / Actividad"].concat(Array.from({length:24},(_,i)=>String(i+1))), k:"scaffold", rows: gantt(24) });

    H(4, "III.1.7 Detalles técnicos");
    I("A. Condiciones de operación de servicios (agua/energía/drenaje/residuos, procesos, presiones, temperatura, diagrama de flujos). B. Tanques de almacenamiento sujetos a presión (tabla de condiciones operacionales). C. Tuberías y conexiones. D. Maquinaria. E. Controles de medición, seguridad y control; seguridad industrial y atención a emergencias. F. Relación de distancias mínimas. G. Operación y mantenimiento (trasiego, secuencia de maniobra, condiciones de suspensión, mantenimiento y control técnico).");
    TBL({ title:"Tabla III.3. Condiciones operacionales de tanques de almacenamiento sujetos a presión",
          head:["ID Tanque","Capacidad (L)","Producto","Presión diseño","Presión operación","Set PSV","Año/Serie","Fabricante","Dictamen/UV"],
          k:"scaffold", rows: empty(3,9) });
    TBL({ title:"Tabla III.4. Identificación de tuberías y detalle técnico",
          head:["Fluido / Servicio","Ø Nominal","Material","Tipo de instalación","Profundidad","Pendiente","Prueba / Dictamen","Observaciones"],
          k:"scaffold", rows: empty(4,8) });
    TBL({ title:"Tabla III.5. Identificación y ubicación de extintores",
          head:["No.","Ubicación","Tipo","Capacidad","Evidencia"], k:"scaffold", rows: empty(4,5) });
    TBL({ title:"Tabla III.6. Relación de distancias mínimas",
          head:["Elemento","Distancia requerida (m)","Distancia de proyecto (m)","Cumple"], k:"scaffold", rows: empty(4,4) });
    FIGAREA("f12");

    H(3, "III.2 Identificación de sustancias o productos");
    I("Mencionar tipo, cantidades y adjuntar hoja de seguridad. Tipo y características (CRETIB), volumen de uso y almacenamiento, etapa o proceso, destino o uso final y tipo de transportación.");
    H(4, "III.2.1 Sustancias químicas peligrosas en tanque de almacenamiento");
    TBL({ title:"Tabla III.7. Identificación de sustancias químicas peligrosas en tanque de almacenamiento",
          head:["Producto","Estado físico","Categoría","Clave CRETIB","No. CAS","Capacidad (m³)","Proveedor"],
          k:"auto", rows: Object.keys(D.SUSTANCIAS).map(n=>{ const c=D.SUSTANCIAS[n]; const s=state.sustancias[n]||{};
            return [n, c.estado, c.categoria, c.cretib, c.cas, s.cap||"", s.prov||""]; }) });
    FIGAREA("f13");
    H(4, "III.2.2 Sustancias químicas peligrosas de uso en construcción");
    TBL({ title:"Tabla III.8. Sustancias químicas peligrosas en construcción",
          head:["Producto (nombre comercial)","Volúmenes","Estado físico","Clave CRETIB","No. CAS","Área de uso","Proveedor"],
          k:"scaffold", rows: empty(3,7) });
    H(4, "III.2.3 Sustancias químicas peligrosas en operación y mantenimiento");
    TBL({ title:"Tabla III.9. Sustancias químicas peligrosas en operación y mantenimiento",
          head:["Producto (nombre comercial)","Volúmenes","Estado físico","Clave CRETIB","No. CAS","Área de uso","Proveedor"],
          k:"scaffold", rows: empty(3,7) });
    H(4, "III.2.4 Determinación de actividad Altamente Riesgosa");
    I("Si se rebasa la “cantidad de reporte” → es obligatorio un Estudio de Riesgo como anexo (art. 18 REIA). Para ciertas actividades AHR podría requerirse MIA en lugar de IP; revisar viabilidad del IP antes de avanzar.");

    H(3, "III.3 Emisiones, descargas, residuos y medidas de control");
    IAP("iaEmisiones");
    I("Describir procesos con diagrama de flujo; indicar entradas, rutas y balances; señalar sitios/etapas de generación de residuos líquidos, sólidos y ruido, con controles ambientales y evidencia analítica. Lógica N/A justificado cuando no aplique.");
    H(4, "III.3.1 Emisiones atmosféricas");
    I("Señalar sitios/etapas con emisiones al aire, con énfasis en emisiones fijas y mención (no obligatoria) de scope 3.");
    H(4, "III.3.2 Descarga de aguas residuales");
    I("Aguas sanitarias y aguas aceitosas; identificación de baños/sanitarios por etapa (preparación + construcción, operación + mantenimiento, abandono).");
    H(4, "III.3.3 Residuos");
    I("Definir generación estimada, manejo/control/tratamiento y disposición final por categoría: RSU, RME, RP, RCD.");
    TBL({ title:"Tabla III.10. Generación, manejo y disposición de residuos por etapa",
          head:["Etapa","Tipo de residuo (RSU/RME/RP/RCD)","Generación estimada","Manejo / control","Disposición final"],
          k:"scaffold", rows: empty(4,5) });
    H(4, "III.3.4 Fuentes emisoras de ruido");
    I("Señalar sitios/etapas con emisiones de ruido (revisar NOM-081-SEMARNAT-1994).");
    H(4, "III.3.5 Diagrama de entradas y flujos");
    I("Diagrama de flujo que muestre entradas y salidas de insumos por etapa, con rutas y balances de materias primas, almacenamientos, productos y subproductos.");
    FIGAREA("f14");

    H(3, "III.4 Diagnóstico del entorno ambiental en el área de influencia");
    I("Presentar un diagnóstico ambiental objetivo de la calidad de los aspectos bióticos y abióticos del entorno, delimitando el área de influencia (AI) y representando en planos, mapas, esquemas y anexos fotográficos el estado de conservación.");
    H(4, "III.4.1 Justificación del Área de Influencia (AI)");
    I("Definir AI primaria (predio y colindancias) y, si aplica, AI secundaria (aire/agua/ruido/movilidad). Justificar con tipo de proyecto, vientos dominantes y receptores sensibles. Fuentes: INEGI, SMN, planeación urbana municipal/POEL/POET.");
    FIGAREA("f15");
    H(4, "III.4.2 Identificación de aspectos abióticos");
    I("Describir condiciones físicas y de calidad ambiental actuales. Fuentes transversales: INEGI (edafología, geología, hidrología, uso de suelo), CONAGUA (cuencas/subcuencas, REPDA), SIORE (Ordenamientos/UGA), atlas de riesgo municipal/estatal.");
    I("Clima: régimen de vientos (rosas), precipitación y temperatura; clasificación de Köppen modificada por E. García (1981).");
    FIGAREA("f16");
    TBL({ title:"Tabla III.11. Distribución de climas (clasificación de Köppen-García)", head:["Código","Descripción"], k:"scaffold", rows: empty(2,2) });
    I("Geología y geomorfología: unidades geológicas, pendientes y procesos (inundación, subsidencia); estabilidad del sitio y drenajes.");
    FIGAREA("f17");
    FIGAREA("f18");
    I("Edafología: tipos de suelo, textura, drenaje y vulnerabilidad a contaminación; profundidad y compactación.");
    FIGAREA("f19");
    TBL({ title:"Tabla III.12. Tipo de suelo presente en el sitio", head:["Unidad de suelo","Descripción"], k:"scaffold", rows: empty(3,2) });
    I("Hidrología: región hidrológica (con código), cuenca y subcuenca; cauces, zonas de inundación y descargas cercanas.");
    FIGAREA("f20");
    TBL({ title:"Tabla III.13. Regiones, cuencas y subcuencas del AI", head:["Región Hidrológica","Cuenca","Subcuenca"], k:"scaffold", rows: empty(2,3) });
    I("Acuíferos: localización, disponibilidad media anual de agua subterránea, profundidad al nivel freático y vulnerabilidad a infiltración de hidrocarburos (NOM-011-CONAGUA-2000).");
    FIGAREA("f21");
    TBL({ title:"Tabla III.14. Región hidrológico-administrativa (acuífero)",
          head:["Clave","Acuífero","R","DNCOM","VCAS","VEXTET","DAS","Déficit"], k:"scaffold", rows: empty(2,8) });
    H(4, "III.4.3 Identificación de aspectos bióticos");
    if (state && state.iaFloraFauna && String(state.iaFloraFauna).trim()) {
      String(state.iaFloraFauna).trim().split(/\n{2,}/).forEach(par => { if (par.trim()) P(par.trim()); });
    } else {
      I("Caracterización de vegetación (tipo/cobertura/estado, base fisonómica florística de Rzedowski 1978) y fauna asociada (mamíferos, aves, anfibios y reptiles), con listados bibliográficos y estatus NOM-059-SEMARNAT. Fuentes: CONABIO (USV, SNIB, Enciclovida), CONANP.");
    }
    FIGAREA("f22");
    FIGAREA("f23");
    var HBIO=["Familia","Nombre científico","Nombre común","NOM-059-SEMARNAT"];
    TBL({ title:"Tabla III.15. Listado de flora potencialmente presente en el AI", head:HBIO, k:tK("tablaFlora"), rows: tRows("tablaFlora",HBIO,12) });
    TBL({ title:"Tabla III.16. Listado de mamíferos potencialmente presentes en el AI", head:HBIO, k:tK("tablaMamiferos"), rows: tRows("tablaMamiferos",HBIO,8) });
    TBL({ title:"Tabla III.17. Listado de avifauna potencialmente presente en el AI", head:HBIO, k:tK("tablaAvifauna"), rows: tRows("tablaAvifauna",HBIO,10) });
    TBL({ title:"Tabla III.18. Listado de anfibios y reptiles potencialmente presentes en el AI", head:HBIO, k:tK("tablaHerpeto"), rows: tRows("tablaHerpeto",HBIO,8) });
    FIGAREA("f24");
    H(4, "III.4.4 Medio socioeconómico y cultural");
    I("Densidad poblacional, pueblos originarios, desempleo, economía, vivienda, rezago social, zonas de atención prioritaria, valor cultural y patrimonio (INEGI Censo, INAH, CONABIO, CONANP).");
    TBL({ title:"Tabla III.19. Datos de población (últimos 3 años) del municipio de " + g("municipio","______"),
          head:["Año","Mujeres","Hombres","Total de habitantes"], k:"scaffold", rows: empty(3,4) });
    TBL({ title:"Tabla III.20. Pirámide de edades del municipio",
          head:["Franja de edad","Mujeres","Hombres","Total"], k:"scaffold", rows: empty(6,4) });
    TBL({ title:"Tabla III.21. Otros datos demográficos, vivienda y servicios",
          head:["Indicador","Valor"], k:"scaffold",
          rows:[["Índice de fecundidad",""],["Población indígena (%)",""],["Población ocupada >12 años",""],
                ["Viviendas particulares habitadas",""],["Viviendas con electricidad",""],["Viviendas con agua entubada",""],
                ["Viviendas con drenaje/excusado",""],["Viviendas con internet",""]] });
    FIGAREA("f25");
    H(4, "III.4.5 Análisis de cercanía (radio del AI, máx. 2.0 km)");
    I("Funcionalidad y servicios ecosistémicos; consideraciones normativas de distancias y compatibilidad; receptores sensibles dentro del radio; evaluación de riesgo y sensibilidad.");
    FIGAREA("f26");
    H(4, "III.4.6 Diagnóstico ambiental");
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
    H(4, "III.5.4 Identificación de factores y componentes ambientales");
    I("Derivar los factores del diagnóstico (III.4) y del MEC. Señalar receptores sensibles y si existe umbral normativo (LMP/criterio).");
    TBL({ title:"Tabla III.24. Componentes y atributos del entorno",
          head:["Medio","Sistema","Componente","Factor","Regulador (NOM)"], k:"auto", rows: COMPONENTES });
    H(4, "III.5.5 Cruce de interacciones (matriz de Leopold adaptada)");
    I("Construir la matriz de Leopold (acción × factor), marcar solo interacciones con vía de exposición plausible y asignar ±M (0–5).");
    FIGAREA("f31");
    TBL({ title:"Tabla III.25. Resumen de identificación de impactos por etapa",
          head:["Etapa","Positivos (+)","Negativos (−)","Total"], k:"scaffold",
          rows:[["Preparación de sitio y construcción","","",""],["Operación y mantenimiento","","",""],["Abandono de sitio","","",""],["Total","","",""]] });
    H(4, "III.5.6 Evaluación de criterios e índices");
    I("Construir la matriz de resultados con cálculos de índices (intensidad, básico, complementario, significancia), clase, medida, NOM y evidencia.");
    FIGAREA("f32");
    H(4, "III.5.7 Descripción de impactos");
    I("Identificar y describir los impactos más significativos (narrativa técnica de los “altos” y “medios” + medidas) por medio físico, biológico y socioeconómico, incluyendo riesgo tecnológico.");
    H(4, "III.5.8 Balance de impacto");
    I("Balance total del escenario: sumatoria neta por medio y por fase, y número de impactos por clase.");
    TBL({ title:"Tabla III.26. Balance de impactos por medio",
          head:["Medio","Σ ISIG (−)","Σ ISIG (+)","Balance neto","# Altos","# Medios"], k:"scaffold", rows: empty(4,6) });

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
    I("Buenas prácticas voluntarias: señalética, reforestación con especies nativas, reducción de consumo energético, capacitación, etc.");

    // ========================================================================
    // IV, V, VI (resumen — desarrollo completo en la próxima versión)
    // ========================================================================
    H(1, "IV. Abandono del sitio");
    P(interp(D.BOILER.abandono_intro, { ubicacion: v.ubicacion }));
    if (state.incluirAbandono !== false) {
      H(3, "IV.1 Gatillos y tipo de cierre");        P(D.BOILER.abandono_iv1);
      H(3, "IV.3 Procedimientos críticos de seguridad");  P(D.BOILER.abandono_iv3);
      H(3, "IV.8 Avisos y cierres administrativos");  P(D.BOILER.abandono_iv8);
    }
    I("(v1.1) Las secciones IV.2, IV.4–IV.7 con sus tablas se desarrollarán en la siguiente versión.");

    H(1, "V. Conclusión");
    I("Esta sección reafirma que el proyecto se encuentra en el supuesto para IP. No requiere modificación salvo que la ASEA lo indique.");
    if (state.incluirConclusion !== false) P(D.BOILER.conclusion);
    B.push({ t:"firma", promovente: g("repLegal","__________"), tecnico: g("cNombre","__________") });

    H(1, "VI. Planos y cartografía");
    I("Anexar planos y cartografía: localización a 4 niveles, plano arquitectónico, mapas temáticos (clima, geología, edafología, hidrología, NDVI/NDWI, UGA, ANP), área de influencia y matriz de Leopold.");
    FIGAREA("f33");
    // Figuras adicionales que agregue el usuario (anexo fotográfico)
    if (((ctx.figsByArea && ctx.figsByArea["anexo"]) || []).length) {
      H(3, "Anexo fotográfico y de cartografía adicional");
      FIGAREA("anexo");
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
  function gantt(m){
    m=m||24;
    const fila=(a)=>[a].concat(Array.from({length:m},()=> ""));
    const band=(t)=>[t].concat(Array.from({length:m},()=> ""));
    return [
      band("PREPARACIÓN DEL SITIO Y CONSTRUCCIÓN"),
      fila("Limpieza del terreno"), fila("Excavación para cimentaciones del tanque"),
      fila("Construcción estructural de oficinas y caseta de vigilancia"),
      fila("Instalación del tanque de almacenamiento y equipos"),
      fila("Consumo de insumos"), fila("Generación y manejo de residuos sólidos"),
      fila("Generación y manejo de aguas residuales"), fila("Contratación de mano de obra"),
      band("OPERACIÓN Y MANTENIMIENTO"),
      fila("Operación de la estación de servicio"), fila("Operación del motor para bomba de llenado"),
      fila("Transporte de insumos y personal"), fila("Consumo de insumos"),
      fila("Generación y manejo de residuos sólidos"), fila("Generación y manejo de aguas residuales"),
      fila("Generación y manejo de residuos peligrosos"), fila("Contratación de mano de obra"),
      band("ABANDONO DEL SITIO"),
      fila("Desmantelamiento de tanque"), fila("Demolición de estructuras de concreto y block"),
      fila("Transporte de equipos, residuos de demolición y personal"),
      fila("Generación y manejo de residuos sólidos"), fila("Generación y manejo de aguas residuales"),
      fila("Generación y manejo de residuos peligrosos"), fila("Contratación de mano de obra")
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
