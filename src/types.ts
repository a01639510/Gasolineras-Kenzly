export type StatusCOA = 'pendiente' | 'presentada' | 'observaciones';
export type TipoCapital = 'solo_nacional' | 'mayoria_nacional' | 'mayoria_extranjero' | 'solo_extranjero';
export type EstadoTramite = 'pendiente' | 'en_proceso' | 'presentado' | 'aprobado' | 'rechazado';
export type TipoProyecto = 'gas_lp_carburacion' | 'gas_lp_publico' | 'gasolinera_petroliferos' | 'autoconsumo';
export type SubtipoClasificacion = 'A' | 'B1' | 'B2' | 'C1' | 'C2';
export type TipoReporte = 'MISSE_FormatoA' | 'Informe_Preventivo' | 'MIA_Particular' | 'RGRP';
export type GradoMarginacion = 'Muy bajo' | 'Bajo' | 'Medio' | 'Alto' | 'Muy alto';

export interface CoordenadaUTM {
  vertice: number;
  x: number;
  y: number;
  lat: string;
  lon: string;
}

export interface Gasolinera {
  id: string;
  creador_id: string;

  // Datos del promovente
  razon_social: string;
  rfc: string;
  representante_legal?: string;
  domicilio_notificaciones?: string;
  telefono?: string;
  correo_electronico?: string;

  // Identificadores regulatorios
  nra?: string;
  permiso_cre?: string;
  responsable_tecnico?: string;

  // Tipo de proyecto
  tipo_proyecto?: TipoProyecto;
  subtipo_clasificacion?: SubtipoClasificacion;
  capacidad_almacenamiento_litros?: number;
  numero_tanques_total?: number;
  tipo_tanque?: string;
  vigencia_operacion_anos?: number;

  // Ubicación
  calle?: string;
  numero_exterior?: string;
  colonia?: string;
  municipio?: string;
  estado?: string;
  cp?: string;
  lat: number;
  lng: number;
  superficie_total_m2?: number;
  superficie_utilizada_m2?: number;
  radio_amortiguamiento_m?: number;
  coordenadas_utm?: CoordenadaUTM[];
  clave_entidad_inegi?: string;
  clave_municipio_inegi?: string;
  clave_localidad_inegi?: string;

  // Flags ambientales (determinan qué reporte aplica)
  esta_en_anp?: boolean;
  esta_en_ramsar?: boolean;
  requiere_remocion_vegetacion?: boolean;

  // Indicadores socioeconómicos (autopoblados desde INEGI/CONEVAL)
  grado_marginacion?: GradoMarginacion;
  indice_marginacion?: number;
  grado_rezago_social?: string;
  indice_rezago_social?: number;

  // Datos de trabajadores y operación
  num_trabajadores_total?: number;
  num_trabajadores_hombres?: number;
  num_trabajadores_mujeres?: number;
  tipo_capital?: TipoCapital;

  // Estado regulatorio
  status_coa?: StatusCOA;
  fecha_dictamen_vigente?: string;
  reportes_aplicables?: TipoReporte[];
}

export interface Tanque {
  id: string;
  id_gasolinera: string;
  tipo_pared: 'simple_pared' | 'doble_pared';
  material: 'acero' | 'fibra_de_vidrio' | 'FRP';
  capacidad_l: number;
  anio_instalacion: number;
  producto: 'magna' | 'premium' | 'diesel' | 'gas_lp';
  sistema_deteccion_fugas: boolean;
  tipo_sistema_deteccion?: string;
  ultimo_mantenimiento?: string;
  estado_operativo: 'activo' | 'fuera_de_servicio' | 'en_mantenimiento';
}

export interface PozoMonitoreo {
  id: string;
  id_gasolinera: string;
  profundidad_m: number;
  lat: number;
  lng: number;
  nivel_estatico_m?: number;
  presencia_hidrocarburos: boolean;
  espesor_mancha_cm?: number;
  fecha_ultima_lectura?: string;
}

export interface EmisionAnual {
  id: string;
  id_gasolinera: string;
  anio: number;
  fuente: string;
  contaminante: string;
  cantidad_kg: number;
  metodo: string;
}

export interface ResiduoPeligroso {
  id: string;
  id_gasolinera: string;
  tipo: string;
  cantidad_kg: number;
  manejo: string;
  empresa_receptora?: string;
  fecha_manifiesto?: string;
}

export interface Tramite {
  id: string;
  id_gasolinera: string;
  tipo: TipoReporte | string;
  estado: EstadoTramite;
  fecha_vencimiento?: string;
  folio?: string;
  fecha_generacion?: string;
  contenido?: string;
}

export interface RequerimientoDato {
  id: string;
  label: string;
  field: keyof Gasolinera | 'tanques' | 'pozos' | 'tramites';
  required: boolean;
}

export interface Plantilla {
  id: TipoReporte;
  nombre: string;
  nombre_corto: string;
  descripcion: string;
  autoridad: string;
  fundamento_legal: string;
  aplica_a: string;
  tiempo_resolucion: string;
  campos_requeridos: RequerimientoDato[];
  prompt_generator: string;
}
