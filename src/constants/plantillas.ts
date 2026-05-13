import { Plantilla } from '../types';

export const PLANTILLAS_ESTANDAR: Plantilla[] = [
  {
    id: 'MISSE_FormatoA',
    nombre: 'MISSE — Formato A',
    nombre_corto: 'MISSE A',
    descripcion: 'Manifestación de Impacto Social del Sector Energético — Formato A. Aplica a estaciones de Gas LP y gasolineras con almacenamiento ≤ 300,000 L.',
    autoridad: 'SENER — Dirección General de Impacto Social, Consulta Previa y Ocupación Superficial',
    fundamento_legal: 'Art. 10 Fracción I DACG MISSE (DOF 16-feb-2026)',
    aplica_a: 'Gas LP (todas) + gasolineras ≤ 300,000 L fuera de ANP/RAMSAR/zona forestal',
    tiempo_resolucion: '90 días hábiles',
    campos_requeridos: [
      { id: 'razon_social',                    label: 'Razón Social',                       field: 'razon_social',                    required: true },
      { id: 'rfc',                             label: 'RFC',                                field: 'rfc',                             required: true },
      { id: 'representante_legal',             label: 'Representante Legal',                field: 'representante_legal',             required: true },
      { id: 'domicilio_notificaciones',        label: 'Domicilio para notificaciones',      field: 'domicilio_notificaciones',        required: true },
      { id: 'correo_electronico',              label: 'Correo electrónico',                 field: 'correo_electronico',              required: true },
      { id: 'tipo_proyecto',                   label: 'Tipo de proyecto',                   field: 'tipo_proyecto',                   required: true },
      { id: 'capacidad_almacenamiento_litros', label: 'Capacidad de almacenamiento (L)',    field: 'capacidad_almacenamiento_litros', required: true },
      { id: 'municipio',                       label: 'Municipio',                          field: 'municipio',                       required: true },
      { id: 'estado',                          label: 'Estado',                             field: 'estado',                          required: true },
      { id: 'cp',                              label: 'Código Postal',                      field: 'cp',                              required: true },
      { id: 'superficie_total_m2',             label: 'Superficie total del predio (m²)',   field: 'superficie_total_m2',             required: true },
    ],
    prompt_generator: `Eres un consultor ambiental senior especializado en el sector hidrocarburos en México.
Genera el contenido de la SECCIÓN III.3 — Caracterización Socioeconómica para la MISSE Formato A
(DOF 16-feb-2026) de la estación {{razon_social}}.
Redacta 4 párrafos técnico-formales:
1. Referencia a las tablas de indicadores de marginación, rezago social y carencia en viviendas del INEGI/CONEVAL.
2. Perfil socioeconómico de la localidad de {{municipio}}, {{estado}}.
3. Análisis de cómo el proyecto beneficia a la población que utiliza gas LP/petrolíferos vs. los que usan leña.
4. Compromiso con protección de grupos vulnerables y referencia al Plan de Gestión Social.
NO inventes cifras. Usa lenguaje técnico-administrativo formal. Cita normas con fecha exacta DOF.`
  },

  {
    id: 'Informe_Preventivo',
    nombre: 'Informe Preventivo',
    nombre_corto: 'IP',
    descripcion: 'Informe Preventivo de Impacto Ambiental para estaciones de diésel/gasolina en zonas urbanas, suburbanas, industriales o carreteras. Tramitado ante ASEA.',
    autoridad: 'ASEA — Dirección de Expendio al Público de Petrolíferos',
    fundamento_legal: 'Art. 31 LGEEPA + Art. 29 RLGEEPA-MEIA + Acuerdo DOF 17-oct-2017 + NOM-005-ASEA-2016',
    aplica_a: 'Gasolineras de diésel/gasolina en zona urbana, suburbana, industrial o carretera federal/estatal',
    tiempo_resolucion: '20 días naturales',
    campos_requeridos: [
      { id: 'razon_social',                    label: 'Razón Social',                       field: 'razon_social',                    required: true },
      { id: 'rfc',                             label: 'RFC',                                field: 'rfc',                             required: true },
      { id: 'representante_legal',             label: 'Representante Legal',                field: 'representante_legal',             required: true },
      { id: 'tipo_proyecto',                   label: 'Tipo de proyecto',                   field: 'tipo_proyecto',                   required: true },
      { id: 'capacidad_almacenamiento_litros', label: 'Capacidad de almacenamiento (L)',    field: 'capacidad_almacenamiento_litros', required: true },
      { id: 'municipio',                       label: 'Municipio',                          field: 'municipio',                       required: true },
      { id: 'estado',                          label: 'Estado',                             field: 'estado',                          required: true },
      { id: 'calle',                           label: 'Calle y número',                     field: 'calle',                           required: true },
      { id: 'superficie_total_m2',             label: 'Superficie total del predio (m²)',   field: 'superficie_total_m2',             required: true },
    ],
    prompt_generator: `Eres un consultor ambiental senior especializado en el sector hidrocarburos en México.
Genera la SECCIÓN V — Conclusiones del Informe Preventivo de Impacto Ambiental para
la estación {{razon_social}} (RFC: {{rfc}}), ubicada en {{calle}}, {{municipio}}, {{estado}}.
Tipo de proyecto: {{tipo_proyecto}}. Capacidad: {{capacidad_almacenamiento_litros}} L.
Redacta una declaración formal (3-4 párrafos) que establezca:
1. Que el proyecto se inscribe en el supuesto del Art. 31 Fracción I LGEEPA y Art. 29 RLGEEPA-MEIA.
2. Que la NOM-005-ASEA-2016 regula integralmente todos los impactos ambientales relevantes.
3. Que no se requiere Manifestación de Impacto Ambiental.
4. Compromiso de cumplimiento normativo y cierre formal.
Cita los artículos y fechas DOF exactas. Estilo técnico-administrativo formal.`
  },

  {
    id: 'MIA_Particular',
    nombre: 'MIA — Modalidad Particular',
    nombre_corto: 'MIA-P',
    descripcion: 'Manifestación de Impacto Ambiental Modalidad Particular para Gas LP (actividad altamente riesgosa) y gasolineras en ANP, RAMSAR o zonas forestales.',
    autoridad: 'ASEA — Unidad de Gestión Industrial',
    fundamento_legal: 'Art. 28 LGEEPA + Art. 12 RLGEEPA-MEIA + Guía MIA-P Sector Hidrocarburos',
    aplica_a: 'Estaciones de Gas LP (siempre) + gasolineras en ANP, RAMSAR o que requieren remoción forestal',
    tiempo_resolucion: '82 días naturales',
    campos_requeridos: [
      { id: 'razon_social',                    label: 'Razón Social',                       field: 'razon_social',                    required: true },
      { id: 'rfc',                             label: 'RFC',                                field: 'rfc',                             required: true },
      { id: 'representante_legal',             label: 'Representante Legal',                field: 'representante_legal',             required: true },
      { id: 'domicilio_notificaciones',        label: 'Domicilio para notificaciones',      field: 'domicilio_notificaciones',        required: true },
      { id: 'tipo_proyecto',                   label: 'Tipo de proyecto',                   field: 'tipo_proyecto',                   required: true },
      { id: 'capacidad_almacenamiento_litros', label: 'Capacidad de almacenamiento (L)',    field: 'capacidad_almacenamiento_litros', required: true },
      { id: 'municipio',                       label: 'Municipio',                          field: 'municipio',                       required: true },
      { id: 'estado',                          label: 'Estado',                             field: 'estado',                          required: true },
      { id: 'calle',                           label: 'Calle y número',                     field: 'calle',                           required: true },
      { id: 'superficie_total_m2',             label: 'Superficie total del predio (m²)',   field: 'superficie_total_m2',             required: true },
      { id: 'superficie_utilizada_m2',         label: 'Superficie utilizada (m²)',          field: 'superficie_utilizada_m2',         required: true },
      { id: 'num_trabajadores_total',          label: 'Número de trabajadores',             field: 'num_trabajadores_total',          required: true },
    ],
    prompt_generator: `Eres un consultor ambiental senior especializado en el sector hidrocarburos en México.
Genera la SECCIÓN VII — Pronósticos Ambientales y Evaluación de Alternativas para la MIA Particular
de la estación {{razon_social}} (RFC: {{rfc}}), tipo {{tipo_proyecto}}, ubicada en {{municipio}}, {{estado}}.
Capacidad: {{capacidad_almacenamiento_litros}} L. Superficie: {{superficie_total_m2}} m².
Redacta 3 escenarios (6-8 párrafos en total):
1. Escenario sin proyecto — descripción del estado actual y tendencias sin la instalación.
2. Escenario con proyecto sin medidas de mitigación — impactos potenciales.
3. Escenario con proyecto + medidas de prevención/mitigación — impactos residuales aceptables y viabilidad ambiental.
Concluye con el dictamen de viabilidad ambiental. Cita NOM-005-ASEA-2016, NOM-003-SEDG-2004 y Ley del Sector Hidrocarburos (DOF 18-mar-2025) donde aplique.`
  },

  {
    id: 'RGRP',
    nombre: 'Registro como Generador de Residuos Peligrosos',
    nombre_corto: 'RGRP',
    descripcion: 'Trámite SEMARNAT-07-017 (FF-SEMARNAT-090) para registro como generador de residuos peligrosos. Aplica a estaciones en operación y actividades industriales.',
    autoridad: 'ASEA — DGGIMAR (sector hidrocarburos) / SEMARNAT — DGGIMAR (otros sectores)',
    fundamento_legal: 'LGPGIR + Reglamento LGPGIR + NOM-052-SEMARNAT-2005',
    aplica_a: 'Toda gasolinera en operación + plantas industriales que generen residuos peligrosos',
    tiempo_resolucion: '30 días hábiles',
    campos_requeridos: [
      { id: 'razon_social',            label: 'Razón Social',                 field: 'razon_social',            required: true },
      { id: 'rfc',                     label: 'RFC',                          field: 'rfc',                     required: true },
      { id: 'representante_legal',     label: 'Representante Legal',          field: 'representante_legal',     required: true },
      { id: 'domicilio_notificaciones',label: 'Domicilio fiscal',             field: 'domicilio_notificaciones',required: true },
      { id: 'correo_electronico',      label: 'Correo electrónico',           field: 'correo_electronico',      required: true },
      { id: 'municipio',               label: 'Municipio de la instalación',  field: 'municipio',               required: true },
      { id: 'estado',                  label: 'Estado',                       field: 'estado',                  required: true },
      { id: 'num_trabajadores_total',  label: 'Número de trabajadores',       field: 'num_trabajadores_total',  required: true },
      { id: 'superficie_total_m2',     label: 'Superficie de instalaciones (m²)', field: 'superficie_total_m2', required: true },
    ],
    prompt_generator: `Eres un consultor ambiental senior especializado en residuos peligrosos conforme a la LGPGIR y NOM-052-SEMARNAT-2005.
Genera la descripción de residuos peligrosos para el formato SEMARNAT-07-017 de la empresa {{razon_social}}
(RFC: {{rfc}}), ubicada en {{municipio}}, {{estado}}, con {{num_trabajadores_total}} trabajadores.
Redacta la SECCIÓN IV — Clasificación de Residuos Peligrosos con los residuos típicos de una estación de servicio:
Para cada residuo incluye: descripción, identificador NOM-052, estado físico, característica CRIT, cantidad estimada kg/mes,
proceso de origen y destino final adecuado. Considera: aceites lubricantes usados, trapos impregnados con hidrocarburo,
filtros de aceite, solventes, envases contaminados y baterías. Usa tablas Markdown. Estilo técnico-formal.`
  },
];

export const ETIQUETAS_REPORTE: Record<string, string> = {
  MISSE_FormatoA: 'MISSE A',
  Informe_Preventivo: 'Inf. Preventivo',
  MIA_Particular: 'MIA-P',
  RGRP: 'RGRP',
};

export const COLORES_REPORTE: Record<string, { bg: string; text: string; border: string }> = {
  MISSE_FormatoA:    { bg: 'var(--primary-dim)',  text: 'var(--primary)',  border: 'rgba(26,109,255,0.3)' },
  Informe_Preventivo:{ bg: 'var(--success-dim)', text: 'var(--success)', border: 'rgba(34,197,94,0.3)' },
  MIA_Particular:    { bg: 'var(--warning-dim)', text: 'var(--warning)', border: 'rgba(245,158,11,0.3)' },
  RGRP:              { bg: 'var(--accent-dim)',  text: 'var(--accent)',  border: 'rgba(143,170,200,0.3)' },
};
