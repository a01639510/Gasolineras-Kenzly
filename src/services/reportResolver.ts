import { Gasolinera, TipoReporte } from '../types';
import { PLANTILLAS_ESTANDAR } from '../constants/plantillas';

export function resolverReportesAplicables(gas: Gasolinera): TipoReporte[] {
  const reportes: TipoReporte[] = [];
  const tipo = gas.tipo_proyecto;
  const cap = gas.capacidad_almacenamiento_litros ?? 0;
  const enAnp = gas.esta_en_anp ?? false;
  const enRamsar = gas.esta_en_ramsar ?? false;
  const forestal = gas.requiere_remocion_vegetacion ?? false;

  // MISSE Formato A aplica si capacidad ≤ 300,000 L
  if (cap <= 300000 && cap > 0) {
    reportes.push('MISSE_FormatoA');
  }

  if (tipo === 'gas_lp_carburacion' || tipo === 'gas_lp_publico') {
    // Gas LP siempre requiere MIA Particular (actividad altamente riesgosa)
    reportes.push('MIA_Particular');
  } else if (tipo === 'gasolinera_petroliferos') {
    if (enAnp || enRamsar || forestal) {
      reportes.push('MIA_Particular');
    } else {
      reportes.push('Informe_Preventivo');
    }
  }

  return reportes;
}

export function plantillaParaReporte(id: TipoReporte) {
  return PLANTILLAS_ESTANDAR.find(p => p.id === id)!;
}

export function etiquetaReporte(tipo: TipoReporte): string {
  const map: Record<TipoReporte, string> = {
    MISSE_FormatoA: 'MISSE Formato A',
    Informe_Preventivo: 'Informe Preventivo',
    MIA_Particular: 'MIA Particular',
    RGRP: 'RGRP',
  };
  return map[tipo];
}

export function autoridadReporte(tipo: TipoReporte): string {
  return plantillaParaReporte(tipo)?.autoridad ?? '';
}

export function tiempoResolucion(tipo: TipoReporte): string {
  return plantillaParaReporte(tipo)?.tiempo_resolucion ?? '';
}

// Interpola los campos {{campo}} del prompt con los datos de la gasolinera
export function interpolarPrompt(prompt: string, gas: Gasolinera): string {
  let result = prompt;
  const campos: (keyof Gasolinera)[] = [
    'razon_social', 'rfc', 'representante_legal', 'tipo_proyecto',
    'capacidad_almacenamiento_litros', 'municipio', 'estado', 'calle',
    'superficie_total_m2', 'superficie_utilizada_m2', 'num_trabajadores_total',
  ];
  for (const campo of campos) {
    const valor = gas[campo];
    if (valor !== undefined && valor !== null) {
      result = result.replaceAll(`{{${campo}}}`, String(valor));
    }
  }
  return result;
}
