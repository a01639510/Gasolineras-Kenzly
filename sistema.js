/* =====================================================================
   sistema.js — Sistema IP 2026: Guía de uso + Checklist ASEA-00-041.
   Se incrusta en la app (no como documento externo). Carga DESPUÉS de
   data.js y agrega contenido a window.IPDATA.
   ===================================================================== */
(function () {
  "use strict";
  var D = window.IPDATA || (window.IPDATA = {});

  // ---- Guía de uso (HTML compacto) ------------------------------------
  D.GUIA_HTML = `
  <h3>📖 Sistema IP 2026 — Guía de uso</h3>
  <p><b>Qué es:</b> 7 prompts de IA + bases de datos que automatizan la elaboración de Informes Preventivos (IP) para gasolineras del sector hidrocarburos ante la ASEA. Reduce el tiempo 40–50% y estandariza la metodología Leopold/Gómez-Orea.</p>

  <h4>Flujo operacional</h4>
  <ol>
    <li><b>Recopilar datos del cliente</b> — captura los datos del proyecto en el cuestionario (Sección I y siguientes). Equivale a la hoja RECOPILACION_DATOS.</li>
    <li><b>Redactar con IA, sección por sección</b> — en cada sección abierta (✎) usa el botón <b>“✨ Redactar con IA”</b>. La IA genera el texto técnico desde los datos capturados; revísalo y edítalo.</li>
    <li><b>Validar</b> — usa el <b>Checklist ASEA-00-041</b> (en esta misma app) para verificar cada sección antes de avanzar.</li>
    <li><b>Compilar y entregar</b> — “Ver documento” arma el IP completo; exporta a Word (borrador/limpio) o PDF.</li>
  </ol>

  <h4>Secciones con redacción IA</h4>
  <ul>
    <li><b>III.1</b> Descripción técnica (tanques T-01…, líneas, SRV ≥95%).</li>
    <li><b>III.3</b> Emisiones, descargas y residuos (VOC, RSU/RME/RP/RCD, ruido).</li>
    <li><b>III.4.3</b> Flora y fauna (vegetación + fauna + estatus NOM-059).</li>
    <li><b>III.5</b> Identificación de impactos (descripción de impactos altos/medios + balance; metodología Leopold/Gómez-Orea).</li>
    <li><b>III.6/III.7</b> Medidas de prevención y mitigación + Programa de Vigilancia.</li>
    <li><b>IV</b> Abandono del sitio (desgasificación, muestreo, avisos).</li>
  </ul>

  <h4>Buenas prácticas</h4>
  <ul>
    <li>Captura todos los datos del proyecto <b>antes</b> de redactar: datos coherentes → salida coherente.</li>
    <li>No confíes 100% en la IA: valida normas, números y referencias (responsable: VerdeRaíz).</li>
    <li>Mantén un <b>número único</b> de empleos/superficies en todo el documento.</li>
    <li>Verifica la vigencia de las NOMs (DOF 2025) antes de cerrar la Sección II.</li>
    <li>Valida cada sección con el checklist antes de pasar a la siguiente.</li>
  </ul>
  <p style="color:var(--muted,#888);font-size:13px">VerdeRaíz Ambiental · Sistema IP 2026 v1.0 — incrustado en la app.</p>`;

  // ---- Checklist ASEA-00-041 ------------------------------------------
  // Cada grupo: { g: título, items: [ "texto" | {t:"texto", sub:true} ] }
  D.CHECKLIST_ASEA = [
    { g: "I. Datos generales", items: [
      "I.1 Nombre del proyecto (claro, oficial)",
      "I.1.1 Ubicación (calle #, colonia, municipio, estado, CP)",
      "I.1.2 Coordenadas UTM (Zona 13N WGS84, X, Y) — mín. 2 puntos de inflexión",
      "I.1.3 Superficies (predio m², ocupada m²) — CONSISTENTE en todo el documento",
      "I.1.4 Inversión ($, en pesos mexicanos)",
      "I.1.5 Empleos (directos/indirectos por fase) — número único en todo el doc",
      "I.1.6 Duración (preparación, construcción, operación, abandono)",
      "I.1.7 Antecedentes del sitio (contaminación previa, cambios de uso)",
      "I.2 Promovente (razón social, RFC 13 caracteres)",
      "I.2.1 Representante legal (nombre, RFC, CURP)",
      "I.2.3 Domicilio para notificaciones",
      "I.3 Responsable IP (nombre, profesión, cédula, RFC, CURP)",
    ]},
    { g: "II. Fundamento jurídico", items: [
      "II.1.1 Acuerdos internacionales (mín. Acuerdo de París)",
      "II.1.2 Constitución Federal (Art. 4, 27, 73, 115)",
      "II.1.3 Leyes (LGEEPA, LGPGIR, LGCC, LAN, Ley HC, Ley ASEA)",
      "II.1.4 Reglamentos (REIA, DACG ASEA)",
      "II.1.5 NOMs VIGENTES 2025 (verificar DOF):",
      {t:"NOM-005-ASEA-2016 (Estación de Servicio)", sub:true},
      {t:"NOM-004-ASEA-2017 (SRV ≥95%)", sub:true},
      {t:"NOM-001-ASEA-2019 (RME)", sub:true},
      {t:"NOM-052-SEMARNAT-2005 (RP)", sub:true},
      {t:"NOM-081-SEMARNAT-1994 (Ruido)", sub:true},
      {t:"NOM-059-SEMARNAT-2010 (Fauna)", sub:true},
      "II.2.1 POEGT — UGA identificada con mapa",
      "II.2.2 PND — vinculación de ejes",
      "II.2.3 Plan estatal — vinculación (si aplica)",
      "II.2.4 Plan municipal — uso de suelo asignado",
      "Tabla de estrategias POEGT/POEL con cumplimiento",
    ]},
    { g: "III.1–III.3. Técnico", items: [
      "III.1.1 Localización (tabla + mapa 4 niveles)",
      "III.1.2 Actividades principales (recepción, almacenamiento, despacho, SRV)",
      "III.1.3 Dimensiones (croquis a escala, m²)",
      "III.1.4 Características operativas (presiones, temperaturas, P&ID)",
      "III.1.6 Cronograma Gantt (construcción, operación, abandono)",
      "III.1.7 Tanques (T-01, T-02, T-03) con capacidades; líneas; SRV; controles; distancias NOM-005",
      "III.2.1 Tanques de almacenamiento (producto, capacidad, CAS, CRETIB)",
      "HDSM adjuntas (gasolina, diésel, insumos)",
      "III.3.1 Emisiones (VOC sin/con SRV; cumplimiento NOM-004; dictamen UV)",
      "III.3.2 Descargas de agua (sanitarias, aceitosas; permiso municipal)",
      "III.3.3 Residuos (RSU, RME, RP con gestor autorizado, RCD)",
      "III.3.4 Ruido (fuentes; cumplimiento NOM-081)",
    ]},
    { g: "III.4. Diagnóstico ambiental", items: [
      "III.4.1 Área de Influencia delimitada y justificada (mapa 100/500/1000/2000 m)",
      "III.4.2 Abióticos (clima, geología, edafología, hidrología) con mapas",
      "III.4.3 Bióticos (flora, fauna, especies NOM-059, NDVI)",
      "III.4.4 Medio socioeconómico (INEGI; población indígena; INAH)",
      "III.4.5 Análisis de cercanía ≤2 km (receptores sensibles, distancias)",
      "III.4.6 Diagnóstico integral + MEC coherente",
    ]},
    { g: "III.5. Identificación de impactos", items: [
      "III.5.1 Metodología (Leopold 29×18; Gómez-Orea; fórmulas ISIG; semáforo 0–100)",
      "III.5.3 Acciones (29: 10 construcción, 10 operación, 7 abandono)",
      "III.5.4 Factores ambientales (18: 5 físicos, 5 bióticos, 8 socioeconómicos)",
      "III.5.5 Matriz Leopold completada (Excel anexo)",
      "III.5.6 Cálculo Gómez-Orea (ISIG; impactos ≥40 descritos; fórmulas validadas)",
      "III.5.7 Descripción de impactos ALTOS/MEDIOS (origen, receptor, cuantificación)",
      "III.5.8 Balance de impacto neto + conclusión de viabilidad",
    ]},
    { g: "III.6–III.7. Medidas de mitigación", items: [
      "III.6 Tablas por etapa (construcción, operación, abandono)",
      "Cada medida: descripción específica, responsable, indicador, NOM, impacto residual ≤30%",
      "III.7 Programa de Vigilancia Ambiental (construcción, operación, post-cierre)",
      "Cronograma de implementación de medidas",
    ]},
    { g: "IV. Abandono del sitio", items: [
      "IV.1 Gatillos de cierre (fin de vida útil, ~25 años)",
      "IV.2 Acciones por componente (tanques, líneas, SRV, estructuras, suelo)",
      "IV.3 Procedimientos de seguridad (desgasificación, LOTO, permisos, EPP, detector 4 gases)",
      "IV.4 Gestión de residuos de cierre (muestreo fondos, manifiestos RP, RCD)",
      "IV.5 Muestreo de suelo confirmatorio (grid, TPH/BTEX/metales, lab NMX-EC-17025)",
      "IV.6 Restitución del sitio (relleno, nivelación, revegetación)",
      "IV.7 Criterios de finalización (tabla checklist verificable)",
      "IV.8 Avisos administrativos (ASEA 30 d, municipio 10 d, CONAGUA 15 d)",
    ]},
    { g: "V–VII. Conclusión, planos, referencias", items: [
      "Sección V: conclusión (viable, cumple normas, impactos controlables)",
      "Sección VI: planos referenciados (mín. 10: ubicación, planta, P&ID, mapas temáticos)",
      "Sección VII: referencias completas (bibliografía, documentos, leyes/NOMs, sitios web)",
    ]},
    { g: "Anexos y formato", items: [
      "HDSM (PDF), fotos georreferenciadas (8+), matrices Leopold e Impactos (Excel)",
      "Especificaciones de equipos, cronograma Gantt, datos INEGI/CONABIO",
      "Dictamen UV eficiencia SRV, poder notarial, cédula profesional vigente",
      "Portada, índice automático, numeración, referencias cruzadas, márgenes 2.5 cm",
      "Tablas con bordes, figuras/mapas numerados, ortografía, alineación justificada",
    ]},
  ];

  // ---- Referencias / Anexos: documentos requeridos por el IP -----------
  // link = enlace por defecto (editable por proyecto desde la app).
  // Catálogo podado a los 9 docs con automatización real por IA — cada uno
  // sincronizado en 2 vías con su input correspondiente en el cuestionario
  // (ver app.js: pegar el link aquí lo refleja en la sección, y viceversa).
  // "programas" trae TODOS los instrumentos de ordenamiento en un solo Sheet
  // multi-pestaña (POEGT/POE Estatal/POEL/PDUM/...) — la IA detecta por sí
  // sola la pestaña POEL y llena la Tabla II.3 de ahí; no hace falta un
  // documento ni un link aparte para "plan municipal".
  D.ANEXOS_DOCS = [
    { id:"recopilacion", nombre:"RECOPILACIÓN DE DATOS (formulario preliminar)", tipo:"Excel/Sheet",
      link:"https://drive.google.com/open?id=1PfFwTI09Vg41ktwA6kQ3nxoDQha7SXjK", usa:"Sección I, datos del proyecto" },
    { id:"programas", nombre:"Programas de Ordenamiento Ecológico (POEGT/POEL/PDUM…)", tipo:"Excel/Sheet",
      link:"", usa:"II.2 ordenamiento ecológico + II.2.4/II.3 (pestaña POEL)" },
    { id:"flora", nombre:"BASE DE DATOS FLORA", tipo:"Excel/Sheet",
      link:"https://docs.google.com/spreadsheets/d/1aXOp1LPtix-SwhPqSn90WC9xuvL7Jupsws3L3xpUI0E/edit?gid=1477371895#gid=1477371895", usa:"III.4.3 flora (NOM-059)" },
    { id:"fauna", nombre:"BASE DE DATOS FAUNA", tipo:"Excel/Sheet",
      link:"https://docs.google.com/spreadsheets/d/1qVNd6aHM0oE5Rn4iaAFNpiayNi-l7cvcQ9p3CRCB1Bk/edit?gid=235775844#gid=235775844", usa:"III.4.3 fauna (NOM-059)" },
    { id:"matrices", nombre:"MATRICES DE IMPACTO (Leopold / Gómez-Orea)", tipo:"Excel/Sheet",
      link:"", usa:"III.5 identificación y evaluación de impactos" },
    { id:"cumplimiento", nombre:"CUMPLIMIENTO REGULATORIO DEL PROYECTO", tipo:"Excel/Sheet",
      link:"https://drive.google.com/open?id=1afzzWG2-idfNBdeFTbT2m_8LT5MDmSc5", usa:"II.1 fundamento jurídico" },
    { id:"noms", nombre:"BASE DE DATOS NOMs 2025 (marco legislativo)", tipo:"Excel/Sheet",
      link:"https://drive.google.com/open?id=1SbkJ3gfeKovMwfs4J69QPpadeUZTaM8n", usa:"II.1.5 NOMs vigentes" },
    { id:"receptores", nombre:"RECEPTORES SENSIBLES / ANÁLISIS DE CERCANÍA", tipo:"Excel/Sheet",
      link:"", usa:"III.4.5 receptores sensibles" },
    { id:"vigencias", nombre:"EXPEDIENTE DOCUMENTAL (vigencias y compromisos)", tipo:"Excel/Sheet",
      link:"", usa:"VI. vigencias y compromisos" },
  ];

  // ---- II.1 Fundamento jurídico — prosa redactada (boilerplate sector HC) ----
  D.JURIDICO = {
    acuerdos:
      "El proyecto se inscribe en el marco de los compromisos internacionales suscritos por México en materia ambiental. " +
      "El Acuerdo de París orienta las políticas de mitigación de gases de efecto invernadero; el Protocolo de Montreal regula las sustancias agotadoras de la capa de ozono; el Convenio de Minamata atiende el manejo del mercurio; y los Convenios de Basilea, Estocolmo y Rotterdam rigen el movimiento y manejo ambientalmente racional de residuos y sustancias químicas peligrosas. " +
      "Estos instrumentos no son de aplicación directa al particular, sino que se aterrizan en la legislación y en las Normas Oficiales Mexicanas exigibles que se citan en los apartados siguientes, conforme a las cuales el proyecto manejará sus residuos, emisiones y sustancias.",
    constitucion:
      "La Constitución Política de los Estados Unidos Mexicanos fundamenta la actuación ambiental del proyecto. El artículo 4º reconoce el derecho de toda persona a un medio ambiente sano y el deber del Estado de garantizarlo; el artículo 27 establece el dominio de la Nación sobre los hidrocarburos del subsuelo; los artículos 25 a 28 ordenan el desarrollo económico sustentable; el artículo 73 distribuye las facultades federales en materia de protección al ambiente; y el artículo 115 reconoce las competencias municipales en materia de uso de suelo y servicios. De este marco deriva el deber del promovente de prevenir y, en su caso, reparar los daños al ambiente.",
    leyes:
      "Resultan aplicables al proyecto, en materia ambiental: la Ley General del Equilibrio Ecológico y la Protección al Ambiente (LGEEPA), que establece la evaluación de impacto ambiental y la modalidad de Informe Preventivo (art. 31); la Ley General para la Prevención y Gestión Integral de los Residuos (LGPGIR); la Ley General de Cambio Climático (LGCC); la Ley de Aguas Nacionales (LAN); y la Ley de Infraestructura de la Calidad. " +
      "En materia sectorial aplican la Ley del Sector Hidrocarburos —que regula el expendio al público de petrolíferos— y la Ley de la Agencia Nacional de Seguridad Industrial y de Protección al Medio Ambiente del Sector Hidrocarburos (Ley de la ASEA), que confiere a la Agencia la competencia para evaluar el presente instrumento. En materia de uso de suelo y ordenamiento territorial aplica la Ley General de Asentamientos Humanos, Ordenamiento Territorial y Desarrollo Urbano (LGAHOTDU) y sus correlativas estatales.",
    reglamentos:
      "Son aplicables el Reglamento de la LGEEPA en materia de Evaluación del Impacto Ambiental (REIA), que define el contenido y procedimiento del Informe Preventivo; el Reglamento de la LGEEPA en materia de Prevención y Control de la Contaminación de la Atmósfera; el Reglamento de la LGPGIR en materia de residuos peligrosos; el Reglamento de la Ley de Aguas Nacionales; y las Disposiciones Administrativas de Carácter General (DACG) emitidas por la ASEA aplicables al diseño, construcción, pre-arranque, operación, mantenimiento y cierre de las estaciones de servicio.",
    noms:
      "El proyecto observa las Normas Oficiales Mexicanas vigentes aplicables al sector: la NOM-005-ASEA-2016 (diseño, construcción, operación y mantenimiento de estaciones de servicio); la NOM-004-ASEA-2017 (sistemas de recuperación de vapores, eficiencia ≥95%); la NOM-001-ASEA-2019 (clasificación de residuos de manejo especial del sector); la NOM-052-SEMARNAT-2005 (características y manejo de residuos peligrosos, CRETIB); la NOM-081-SEMARNAT-1994 (límites de emisión de ruido de fuentes fijas); y la NOM-059-SEMARNAT-2010 (especies en riesgo), cuando por la ubicación resulte aplicable. En cada caso, el cumplimiento se acredita mediante dictámenes, pruebas de hermeticidad, manifiestos de residuos con gestor autorizado y los registros de operación y mantenimiento correspondientes.",
    nmx:
      "Como estándares de carácter voluntario —salvo que una NOM o una condicionante del permiso los haga obligatorios— resultan de referencia las normas mexicanas de la serie NMX-AA para métodos de muestreo y análisis ambiental, y la NMX-EC-17025-IMNC para la competencia de los laboratorios de prueba que, en su caso, realicen las mediciones ambientales del proyecto.",
    otros:
      "Adicionalmente aplican los ordenamientos estatales y municipales en materia ambiental, de uso de suelo y de protección civil, las normas técnicas complementarias, los lineamientos y guías emitidos por la ASEA, la SEMARNAT y la CONAGUA, así como las condicionantes derivadas de permisos, licencias y autorizaciones previas otorgadas al sitio (licencia de uso de suelo, permiso de la CRE/SENER y, en su caso, autorizaciones ambientales previas).",
  };
})();
