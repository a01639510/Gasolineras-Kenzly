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
})();
