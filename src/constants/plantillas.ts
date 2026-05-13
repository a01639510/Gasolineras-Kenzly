import { Plantilla } from '../types';

export const PLANTILLAS_ESTANDAR: Plantilla[] = [
  {
    id: 'coa-semarnat-narrativa',
    nombre: 'Narrativa Técnica COA',
    descripcion: 'Genera la narrativa técnica completa para la Cédula de Operación Anual (SEMARNAT).',
    campos_requeridos: [
      { id: 'rfc', label: 'RFC de la Estación', field: 'rfc', required: true },
      { id: 'nra', label: 'NRA (Número de Registro Ambiental)', field: 'nra', required: true },
      { id: 'permiso_cre', label: 'Permiso CRE', field: 'permiso_cre', required: true },
    ],
    prompt_generator: 'Generar narrativa técnica para COA SEMARNAT'
  },
  {
    id: 'sasisopa-politica',
    nombre: 'Política de Seguridad SASISOPA',
    descripcion: 'Pórtico de la política de seguridad, salud y protección ambiental (ASEA).',
    campos_requeridos: [
      { id: 'razon_social', label: 'Razón Social', field: 'razon_social', required: true },
      { id: 'representante_legal', label: 'Representante Legal', field: 'representante_legal', required: true },
    ],
    prompt_generator: 'Documento de Política SASISOPA conforme a disposiciones de ASEA'
  },
  {
    id: 'dictamen-limpieza-tanques',
    nombre: 'Informe de Limpieza de Tanques',
    descripcion: 'Narrativa del cumplimiento de la NOM-005-ASEA-2016 para limpieza.',
    campos_requeridos: [
      { id: 'tanques', label: 'Listado de Tanques', field: 'tanques', required: true },
    ],
    prompt_generator: 'Informe técnico de mantenimiento y limpieza de tanques bajo NOM-005'
  },
  {
    id: 'cedula-vulnerabilidad',
    nombre: 'Cédula de Análisis de Vulnerabilidad',
    descripcion: 'Evaluación de riesgos y vulnerabilidad de la instalación.',
    campos_requeridos: [
      { id: 'municipio', label: 'Municipio', field: 'municipio', required: true },
      { id: 'estado', label: 'Estado', field: 'estado', required: true },
    ],
    prompt_generator: 'Análisis de vulnerabilidad técnica y ambiental'
  }
];
