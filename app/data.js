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
    "Gasolina regular":  { estado: "Líquido", categoria: "Inflamable", cretib: "I (Inflamable)", cas: "86290-81-5" },
    "Gasolina Premium":  { estado: "Líquido", categoria: "Inflamable", cretib: "I (Inflamable)", cas: "86290-81-5" },
    "Diésel Automotriz": { estado: "Líquido", categoria: "Combustible", cretib: "I (Inflamable)", cas: "68334-30-5" }
  };

  // -------------------------------------------------------------------
  // 3) BOILERPLATE NACIONAL (texto fijo con variables {{...}})
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

  window.IPDATA = {
    CONSULTORA, SUSTANCIAS, BOILER, REFERENCIAS,
    ESTRATEGIAS_POEGT, DISPOSICIONES, ESTADOS, LISTA_ESTADOS, INSTRUMENTOS,
    CRITERIOS_UGA_JAL, CRITERIOS_UGA_HID
  };
})();
