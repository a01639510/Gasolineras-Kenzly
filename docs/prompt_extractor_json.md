# PROMPT EXTRACTOR — IP Terminado → JSON Completo para la App

## Cómo usar en el Zoom (o en cualquier momento)

1. Abre **claude.ai** en el navegador (o cualquier interfaz de Claude)
2. **Adjunta** el PDF del IP terminado (o pega el texto completo)
3. **Copia todo el bloque PROMPT** de abajo y pégalo en el chat
4. Espera la respuesta — Claude genera el JSON completo
5. Copia el JSON, guárdalo como `IP_datos_nombreproyecto.json`
6. En la app: sección **"Importar / Exportar"** → **Cargar JSON**

---

## PROMPT — copiar desde aquí hasta "FIN DEL PROMPT"

```
Eres un extractor de datos especializado en Informes Preventivos ASEA para estaciones de servicio de hidrocarburos en México.

A partir del documento adjunto/pegado, genera un JSON COMPLETO con los campos del formulario.

══════════════════════════════════════════════════════════════
REGLA ÚNICA: SOLO LO QUE ESTÁ ESCRITO EN EL DOCUMENTO
══════════════════════════════════════════════════════════════
Si un dato no aparece TEXTUALMENTE en el documento → usa "" (cadena vacía).
No completes, no inferas, no asumas, no añadas valores "verosímiles".

CAMPOS DE ALTO RIESGO — prohibido inventar:
  • sustancias → NO números CAS, NO marcas comerciales, NO volúmenes
    Solo nombre, capacidad de almacenamiento y proveedor SI el documento los declara.
  • empleosDir / empleosInd → pon "" si el documento no da el número exacto por tipo
  • srvEficiencia → copia literal ("conforme a NOM-004-ASEA-2017", no añadas "≥95%")
  • utmZona / utmDatum → copia exactamente lo que diga el documento; si el documento
    no declara zona UTM, usa "". Nunca inferas la zona de las coordenadas.
  • puntos → copia el sistema que usa el documento: GMS ("99°22'24.86\"O") o UTM
    en metros ("460915.62 E"). No conviertas entre sistemas.
  • estrategias → si el documento no tiene tabla de estrategias POEGT, pon "" en todos.
  • tablas → NO rellenes con datos plausibles; deja filas vacías si la tabla no existe.

Reglas adicionales:
  • Para campos IA (iaDescTecnica, iaImpactos, etc.) → COPIA LITERAL el párrafo del documento.
  • Para arrays de tablas → incluye TODAS las filas del documento; sin datos inventados.
  • Devuelve ÚNICAMENTE el JSON, sin texto antes ni después, sin bloques de código markdown.
══════════════════════════════════════════════════════════════

FORMATO DE SALIDA — JSON con esta estructura exacta:

{
  "proyecto": "Nombre completo del proyecto",
  "empresa": "Razón social completa del promovente",
  "fecha": "YYYY-MM-DD",

  "calle": "Calle y número del predio",
  "colonia": "Colonia o localidad",
  "municipio": "Municipio o delegación",
  "estado": "Nombre del estado",
  "cp": "Código postal",
  "utmZona": "Zona UTM tal como aparece en el documento, ej: 14Q — o '' si no se declara",
  "utmDatum": "Datum tal como aparece, ej: WGS84 — o '' si no se declara",
  "superficie": "Superficie en m² (solo número, sin texto)",
  "inversion": "Inversión en MXN (solo número, sin texto)",
  "empleosDir": "Número de empleos directos — o '' si no aparece",
  "empleosInd": "Número de empleos indirectos — o '' si no aparece",
  "durPrep": "Duración etapa preparación (ej: 2 semanas) — o ''",
  "durConstr": "Duración etapa construcción — o ''",
  "durOper": "Duración etapa operación — o ''",

  "rfcEmpresa": "RFC empresa — o '' si está reservado/no aparece",
  "repLegal": "Nombre representante legal — o ''",
  "rfcRep": "",
  "curpRep": "",
  "dirNotif": "Domicilio para notificaciones — o ''",
  "telProm": "",
  "emailProm": "",

  "cNombre": "Nombre completo del responsable técnico — o ''",
  "cProfesion": "Profesión — o ''",
  "cCedula": "Cédula profesional — o ''",
  "cRfc": "",
  "cCurp": "",
  "cEmpresa": "Nombre de la empresa consultora — o ''",
  "cDir": "",
  "cTel": "",
  "cEmail": "",

  "uab": "Número UAB — o ''",
  "clavePolitica": "Clave política POEGT — o ''",
  "ordRegional": "Número de ordenamiento regional — o ''",
  "regionEco": "Número de región ecológica — o ''",
  "regionEcoNombre": "Nombre de la región ecológica — o ''",
  "ugaEstatal": "Clave UGA estatal — o ''",
  "municipioPlan": "Municipio del plan municipal — o ''",
  "parqueInd": "Sí / No / No aplica — según el documento",

  "claveCatastral": "Clave catastral — o ''",
  "respObra": "Responsable de obra — o ''",
  "permisoCRE": "Número permiso CRE — o ''",
  "regASEA": "Número registro ASEA — o ''",
  "usoSuelo": "Uso de suelo declarado en el documento — o ''",

  "sustancias": {
    "ADVERTENCIA — solo sustancias con almacenamiento (tanques). NO añadir CAS ni marcas.": {
      "cap": "Capacidad declarada en el documento (ej: 80,000 litros — Tanque T-1)",
      "prov": "Proveedor si el documento lo declara — de lo contrario ''"
    }
  },

  "estrategias": [
    { "n": 1,      "d": "'' si el documento no tiene tabla de estrategias POEGT" },
    { "n": 2,      "d": "" },
    { "n": 3,      "d": "" },
    { "n": 4,      "d": "" },
    { "n": 5,      "d": "" },
    { "n": 6,      "d": "" },
    { "n": 7,      "d": "" },
    { "n": 8,      "d": "" },
    { "n": 12,     "d": "" },
    { "n": 13,     "d": "" },
    { "n": 14,     "d": "" },
    { "n": 15,     "d": "" },
    { "n": "15BIS","d": "" },
    { "n": 18,     "d": "" },
    { "n": 24,     "d": "" },
    { "n": 25,     "d": "" },
    { "n": 26,     "d": "" },
    { "n": 27,     "d": "" },
    { "n": 28,     "d": "" },
    { "n": 29,     "d": "" },
    { "n": 31,     "d": "" },
    { "n": 32,     "d": "" },
    { "n": 35,     "d": "" },
    { "n": 36,     "d": "" },
    { "n": 37,     "d": "" },
    { "n": 38,     "d": "" },
    { "n": 39,     "d": "" },
    { "n": 40,     "d": "" },
    { "n": 41,     "d": "" },
    { "n": 42,     "d": "" },
    { "n": 43,     "d": "" },
    { "n": 44,     "d": "" }
  ],

  "instrumentos": [
    { "sel": true },
    { "sel": true },
    { "sel": true },
    { "sel": true },
    { "sel": true },
    { "sel": false },
    { "sel": false },
    { "sel": false }
  ],

  "puntos": [
    { "x": "Longitud/Este vértice 1 tal como aparece en el documento", "y": "Latitud/Norte vértice 1" },
    { "x": "Vértice 2", "y": "" },
    { "x": "Vértice 3", "y": "" },
    { "x": "Vértice 4", "y": "" }
  ],

  "srvMarca": "Marca y modelo del SRV si aparece — o ''",
  "srvEficiencia": "Texto literal del documento sobre eficiencia del SRV (no añadir porcentajes no declarados)",
  "srvDictamen": "Referencia al dictamen UV — o ''",
  "aguasSanitariaVol": "Volumen aguas sanitarias en l/día — o ''",
  "aguasSanitariaDest": "Destino / tratamiento — o ''",
  "aguasAceitosaVol": "Volumen aguas aceitosas — o ''",
  "aguasAceitosaTrat": "Tratamiento y disposición — o ''",
  "gestorRP": "Nombre y registro SEMARNAT de la empresa gestora de RP — o ''",

  "pueblosOriginarios": "Copia literal del párrafo sobre pueblos originarios — o ''",
  "nucleosAgrarios": "Copia literal del párrafo sobre ejidos/comunidades agrarias — o ''",
  "patrimonioINAH": "Copia literal del párrafo sobre patrimonio INAH — o ''",

  "ivVidaUtil": "Vida útil en años — o ''",
  "ivAnioOperacion": "Año estimado de cierre — o ''",
  "ivComponentes": "Lista de componentes a desmantelar — o ''",
  "ivUsoPosterior": "Uso de suelo posterior al cierre — o ''",
  "ivPresupuestoCierre": "Presupuesto estimado de cierre en MXN — o ''",

  "vViabilidad": "Copia literal de la declaración de viabilidad ambiental — o ''",
  "vNotaConclusion": "Nota del responsable técnico — o ''",

  "incluirMEC": true,
  "incluirMetodo": true,
  "incluirAbandono": true,
  "incluirConclusion": true,

  "iaDescTecnica": "COPIA LITERAL de todos los párrafos narrativos de III.1 Descripción técnica (sin tablas)",
  "iaEmisiones": "COPIA LITERAL de todos los párrafos narrativos de III.3 Emisiones y residuos (sin tablas)",
  "iaFloraFauna": "COPIA LITERAL de los párrafos narrativos de III.4.3 Flora y fauna (sin tablas)",
  "iaDiagnosticoAmbiental": "COPIA LITERAL de todos los párrafos de III.4.6 Diagnóstico ambiental integral",
  "iaImpactos": "COPIA LITERAL de los párrafos narrativos de III.5.7-5.8 Descripción e impactos (sin tablas)",
  "iaMedidas": "COPIA LITERAL de los párrafos narrativos de III.6 Medidas de mitigación (sin tablas)",
  "iaVigilancia": "COPIA LITERAL del párrafo introductorio de III.6.1 Programa de vigilancia",
  "iaSustentabilidad": "COPIA LITERAL de todos los párrafos de III.7 Condiciones adicionales / sustentabilidad",
  "iaAbandono": "COPIA LITERAL del párrafo introductorio de IV Abandono del sitio",
  "iaConclusion": "COPIA LITERAL de todos los párrafos de V Conclusión",

  "tablaResiduos": [
    { "tipo": "Nombre exacto del residuo como aparece en el documento", "etapa": "Construcción / Operación / Ambas", "gen": "Cantidad/volumen exacto del documento", "clas": "Clasificación del documento", "gest": "Forma de gestión del documento", "gestor": "Empresa gestora del documento — o ''" }
  ],
  "tablaRuido": [
    { "fuente": "Fuente de ruido", "db": "dB(A) del documento — no inventar si no está", "ubi": "Ubicación", "freq": "Frecuencia/horario", "cumpl": "Sí / No / '' si no declarado" }
  ],
  "tablaClima": [
    { "param": "Parámetro climático exacto del documento", "val": "Valor + fuente tal como aparece" }
  ],
  "tablaGeomorfo": [
    { "geoforma": "Geoforma o unidad geológica", "desc": "Descripción del documento", "ai": "% del documento — o ''" }
  ],
  "tablaSuelo": [
    { "param": "Parámetro de suelo", "val": "Valor del documento" }
  ],
  "tablaHidro": [
    { "param": "Parámetro hidrológico", "val": "Valor del documento" }
  ],
  "tablaAcuifero": [
    { "param": "Parámetro del acuífero", "val": "Valor del documento", "interp": "Interpretación del documento — o ''" }
  ],
  "tablaFloraObservada": [
    { "nombre_comun": "Nombre común exacto", "nombre_cientifico": "Nombre científico exacto", "ubicacion": "Ubicación en el predio", "cobertura": "Cobertura (%) del documento", "nom059": "Estatus NOM-059 del documento" }
  ],
  "tablaFaunaObservada": [
    { "grupo": "Grupo taxonómico", "especie": "Nombre científico exacto", "comun": "Nombre común exacto", "ubicacion": "Zona/ubicación", "nom059": "Estatus NOM-059", "comportamiento": "Comportamiento/evidencia del documento" }
  ],
  "tablaPoblacion": [
    { "anio": "Año del documento", "mujeres": "Valor del documento", "hombres": "Valor del documento", "total": "Valor del documento" }
  ],
  "tablaPiramide": [
    { "franja": "Rango de edad exacto", "mujeres": "Valor", "hombres": "Valor", "total": "Valor" }
  ],
  "tablaOtrosDemog": [
    { "indicador": "Indicador exacto del documento", "valor": "Valor + fuente del documento" }
  ],
  "tablaReceptores": [
    { "no": "1", "tipo": "Tipo", "nombre": "Nombre exacto", "dist": "Distancia exacta", "dir": "Dirección cardinal", "pob": "Población/capacidad", "obs": "Observaciones" }
  ],
  "tablaRiesgoReceptores": [
    { "receptor": "Receptor", "parametro": "Parámetro", "nivel": "Alto/Medio/Bajo", "justif": "Justificación del documento" }
  ],
  "tablaAccionesProyecto": [
    { "codigo": "C01", "etapa": "Construcción/Operación/Abandono", "accion": "Nombre exacto", "desc": "Descripción exacta", "params": "Parámetros/frecuencia exactos" }
  ],
  "tablaImpactosResumen": [
    { "etapa": "Etapa", "positivos": "Número exacto", "negativos": "Número exacto", "total": "Total exacto" }
  ],
  "tablaImpactosSignificativos": [
    { "codigo": "Código", "accion": "Acción", "factor": "Factor", "m": "", "e": "", "d": "", "r": "", "p": "", "a": "", "s": "", "isig": "Valor exacto", "semaforo": "Rojo/Naranja/Amarillo", "desc": "Descripción" }
  ],
  "tablaImpactosBalance": [
    { "medio": "Medio", "sig_neg": "Número exacto", "sig_pos": "Número exacto", "balance": "Balance exacto", "altos": "Número exacto", "medios": "Número exacto" }
  ],
  "tablaCompromisos": [
    { "compromiso": "Texto exacto del compromiso", "responsable": "Responsable", "plazo": "Plazo", "indicador": "Indicador" }
  ],
  "tablaGatillos": [
    { "gatillo": "Texto exacto del gatillo", "tipo": "Tipo", "alcance": "Parcial/Total", "ventana": "Tiempo", "justif": "Justificación del documento" }
  ],
  "tablaAccionesCierre": [
    { "componente": "Componente", "accion": "Acción exacta", "especif": "Especificación exacta", "evidencia": "Evidencia", "uv": "Normativa", "obs": "Observaciones" }
  ],
  "tablaResiduesCierre": [
    { "residuo": "Residuo exacto", "clas": "Clasificación", "vol": "Volumen del documento", "gestion": "Gestión", "gestor": "Gestor del documento — o ''" }
  ],
  "tablaMuestreoSuelo": [
    { "punto": "ID punto", "ubicacion": "Ubicación exacta", "prof": "Profundidad exacta", "analitos": "Analitos exactos del documento" }
  ],
  "tablaRestitucion": [
    { "accion": "Acción exacta", "especif": "Especificación exacta", "cantidad": "Cantidad/extensión", "verif": "Verificación", "resp": "Responsable" }
  ],
  "tablaCriteriosCierre": [
    { "actividad": "Actividad exacta", "criterio": "Criterio exacto del documento", "evidencia": "Evidencia" }
  ],
  "tablaAvisosCierre": [
    { "autoridad": "Autoridad exacta", "que": "Qué se notifica", "plazo": "Plazo exacto", "accion": "Acción exacta", "evidencia": "Evidencia" }
  ],
  "tablaCronogramaCierre": [
    { "semana": "Semana o periodo exacto", "actividad": "Actividad exacta", "resp": "Responsable" }
  ],
  "tablaCompromisosFinales": [
    { "num": "1", "compromiso": "Texto exacto", "etapa": "Etapa", "normativa": "Marco legal exacto del documento" }
  ],

  "tablas": {
    "tablaUabPoliticas": [
      { "Concepto": "Concepto exacto del documento", "Valor": "Valor del documento" }
    ],
    "tablaPlanMunicipal": [
      { "Criterio": "Criterio exacto", "Descripción": "Descripción exacta", "Relación directa con el proyecto": "Texto del documento" }
    ],
    "tablaPOEL": [
      { "Clave UGA": "Clave exacta", "Nombre UGA": "Nombre exacto", "Política territorial": "Política exacta", "Uso predominante": "Uso exacto", "Uso condicionado": "Uso condicionado", "Uso incompatible": "Uso incompatible" }
    ],
    "tablaTanques": [
      { "ID Tanque": "ID exacto", "Capacidad (L)": "Capacidad exacta del documento", "Producto": "Producto exacto", "Presión diseño": "Valor del documento — o ''", "Presión operación": "Valor del documento — o ''", "Set PSV": "Valor del documento — o ''", "Año/Serie": "Año/serie del documento — o ''", "Fabricante": "Fabricante del documento — o ''", "Dictamen/UV": "Dictamen del documento — o ''" }
    ],
    "tablaTuberias": [
      { "Fluido / Servicio": "Fluido exacto", "Ø Nominal": "Diámetro exacto del documento", "Material": "Material exacto", "Tipo de instalación": "Tipo exacto", "Profundidad": "Profundidad del documento — o ''", "Pendiente": "Pendiente del documento — o ''", "Prueba / Dictamen": "Prueba del documento — o ''", "Observaciones": "" }
    ],
    "tablaExtintores": [
      { "No.": "1", "Ubicación": "Ubicación exacta", "Tipo": "Tipo exacto", "Capacidad": "Capacidad exacta", "Evidencia": "Evidencia del documento — o ''" }
    ],
    "tablaDistancias": [
      { "Elemento": "Elemento exacto del documento", "Distancia requerida (m)": "Valor NOM exacto", "Distancia de proyecto (m)": "Valor exacto del documento", "Cumple": "Sí / No según el documento" }
    ],
    "tablaFlora": [
      { "Familia": "Familia exacta", "Nombre científico": "Nombre científico exacto", "Nombre común": "Nombre común exacto", "NOM-059-SEMARNAT": "Estatus exacto o NE" }
    ],
    "tablaMamiferos": [
      { "Familia": "", "Nombre científico": "", "Nombre común": "", "NOM-059-SEMARNAT": "" }
    ],
    "tablaAvifauna": [
      { "Familia": "", "Nombre científico": "", "Nombre común": "", "NOM-059-SEMARNAT": "" }
    ],
    "tablaHerpeto": [
      { "Familia": "", "Nombre científico": "", "Nombre común": "", "NOM-059-SEMARNAT": "" }
    ],
    "tablaMedidasPrep": [
      { "Factor ambiental": "Factor exacto", "Impacto / fuente": "Impacto exacto", "Medida de prevención/mitigación": "Medida exacta del documento", "Programa y responsable": "Programa/responsable del documento", "NOM / marco legal": "NOM exacta del documento", "Resultado / impacto residual": "Resultado del documento" }
    ],
    "tablaMedidasOper": [
      { "Factor ambiental": "", "Impacto / fuente": "", "Medida de prevención/mitigación": "", "Programa y responsable": "", "NOM / marco legal": "", "Resultado / impacto residual": "" }
    ],
    "tablaMedidasAband": [
      { "Factor ambiental": "", "Impacto / fuente": "", "Medida de prevención/mitigación": "", "Programa y responsable": "", "NOM / marco legal": "", "Resultado / impacto residual": "" }
    ],
    "tablaVigilancia": [
      { "Etapa": "Etapa exacta", "Acción de vigilancia": "Acción exacta del documento", "Indicador verificable": "Indicador exacto", "Frecuencia": "Frecuencia exacta", "Responsable": "Responsable exacto" }
    ]
  },

  "figuras": {},
  "checklist": {},
  "anexos": {},
  "__images": {}
}

DOCUMENTO IP A PROCESAR:
[Adjunto o texto pegado a continuación]
```

FIN DEL PROMPT

---

## Campos que el extractor NO puede llenar (requieren acción manual en la app)

| Campo | Por qué |
|-------|---------|
| Figuras / imágenes | Las imágenes no viajan en JSON de texto |
| tablaIA (flora, fauna, tanques, tuberías, etc.) | Si el documento no las incluye como tabla, llenar en la app con el botón "IA" correspondiente |
| RFC / CURP / cédulas | Frecuentemente reservados por Art. 113 LFTAIP en documentos públicos |
| Números CAS | **Nunca** se extraen: vienen de hojas de seguridad, no del IP |
| Marcas comerciales de sustancias | **Nunca** se infieren: vienen del contrato de suministro o dictamen UV |

## Verificaciones post-carga (checklist rápido para el Zoom)

- [ ] `sustancias` — solo gasolina/diésel con capacidades reales, sin CAS ni marcas inventadas
- [ ] `empleosDir` / `empleosInd` — desglose correcto del documento
- [ ] `puntos` — coordenadas en el sistema que usa el documento (UTM en metros O GMS)
- [ ] `utmZona` — banda correcta (ej: 14Q, no 14N) o vacío si no declarada
- [ ] `srvEficiencia` — texto literal del documento, sin porcentajes añadidos
- [ ] Tablas con datos reales vs. filas con "" — verificar que no haya invenciones
- [ ] Campos IA — párrafos copiados del documento original, no generados nuevos
