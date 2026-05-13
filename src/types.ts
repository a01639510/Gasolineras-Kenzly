export type StatusCOA = 'pendiente' | 'presentada' | 'observaciones';
export type TipoCapital = 'solo_nacional' | 'mayoria_nacional' | 'mayoria_extranjero' | 'solo_extranjero';
export type EstadoTramite = 'pendiente' | 'en_proceso' | 'presentado' | 'aprobado' | 'rechazado';

export interface Gasolinera {
  id: string;
  razon_social: string;
  rfc: string;
  nra?: string;
  permiso_cre?: string;
  representante_legal?: string;
  responsable_tecnico?: string;
  lat: number;
  lng: number;
  calle?: string;
  numero_exterior?: string;
  colonia?: string;
  municipio?: string;
  estado?: string;
  cp?: string;
  telefono?: string;
  correo_electronico?: string;
  num_trabajadores_total?: number;
  tipo_capital?: TipoCapital;
  status_coa?: StatusCOA;
  fecha_dictamen_vigente?: string;
  creador_id: string;
}

export interface Tanque {
  id: string;
  id_gasolinera: string;
  tipo_pared: 'simple_pared' | 'doble_pared';
  material: 'acero' | 'fibra_de_vidrio' | 'FRP';
  capacidad_l: number;
  anio_instalacion: number;
  producto: 'magna' | 'premium' | 'diesel';
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
  tipo: string;
  estado: EstadoTramite;
  fecha_vencimiento?: string;
  folio?: string;
}

export interface RequerimientoDato {
  id: string; // e.g., 'rfc', 'permiso_cre', 'tanques_inspeccion'
  label: string;
  field: keyof Gasolinera | 'tanques' | 'pozos' | 'tramites';
  required: boolean;
}

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion: string;
  campos_requeridos: RequerimientoDato[];
  prompt_generator: string;
}
