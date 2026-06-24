/* =====================================================================
   app.js — Cuestionario IP: render, motor de ensamblado y exportación.
   Depende de window.IPDATA (data.js). Sin librerías externas.
   ===================================================================== */
(function () {
  "use strict";
  const D = window.IPDATA;
  const $ = (s, r=document) => r.querySelector(s);
  const esc = (s) => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const STORE = "verde_raiz_ip_v1";

  // ============== BUCKET DE IMÁGENES (IndexedDB) ==============
  // Almacén local capaz de guardar muchas imágenes (cientos de MB), offline.
  const IMG_DB="verde_raiz_img", IMG_STORE="img";
  let imgCache = {};   // { figId: dataURL }  (en memoria, espejo del IDB)
  function idbOpen(){
    return new Promise((res,rej)=>{
      const r=indexedDB.open(IMG_DB,1);
      r.onupgradeneeded=()=>{ r.result.createObjectStore(IMG_STORE); };
      r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);
    });
  }
  async function idbAll(){
    try{ const db=await idbOpen();
      return await new Promise((res,rej)=>{
        const out={}, cur=db.transaction(IMG_STORE,"readonly").objectStore(IMG_STORE).openCursor();
        cur.onsuccess=e=>{ const c=e.target.result; if(c){ out[c.key]=c.value; c.continue(); } else res(out); };
        cur.onerror=()=>rej(cur.error);
      });
    }catch(e){ return {}; }
  }
  async function idbPut(id,v){ const db=await idbOpen(); return new Promise((res,rej)=>{ const tx=db.transaction(IMG_STORE,"readwrite"); tx.objectStore(IMG_STORE).put(v,id); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); }
  async function idbDel(id){ const db=await idbOpen(); return new Promise((res,rej)=>{ const tx=db.transaction(IMG_STORE,"readwrite"); tx.objectStore(IMG_STORE).delete(id); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); }

  // Redimensiona la imagen (máx 1600 px) y devuelve dataURL para guardar.
  function fileToDataURL(file, maxDim=1600, q=0.85){
    return new Promise((res,rej)=>{
      const fr=new FileReader();
      fr.onload=()=>{ const img=new Image();
        img.onload=()=>{ let w=img.width,h=img.height;
          if(Math.max(w,h)>maxDim){ const s=maxDim/Math.max(w,h); w=Math.round(w*s); h=Math.round(h*s); }
          const c=document.createElement("canvas"); c.width=w; c.height=h;
          c.getContext("2d").drawImage(img,0,0,w,h);
          const png=/png/i.test(file.type);
          res(c.toDataURL(png?"image/png":"image/jpeg", png?undefined:q));
        };
        img.onerror=()=>rej(new Error("img")); img.src=fr.result; };
      fr.onerror=()=>rej(fr.error); fr.readAsDataURL(file);
    });
  }
  async function setImagen(id,file){
    if(!file || !file.type.startsWith("image/")){ toast("Selecciona un archivo de imagen"); return; }
    try{ const url=await fileToDataURL(file); imgCache[id]=url; await idbPut(id,url); renderForm(); toast("Imagen cargada ✓"); }
    catch(e){ toast("No se pudo procesar la imagen"); }
  }
  async function delImagen(id){ delete imgCache[id]; try{ await idbDel(id); }catch(e){} renderForm(); }

  // ---- Estado ----
  let state = load() || {
    sustancias: { "Gasolina regular":{cap:"",prov:""}, "Gasolina Premium":{cap:"",prov:""}, "Diésel Automotriz":{cap:"",prov:""} },
    estrategias: D.ESTRATEGIAS_POEGT.map(e => ({ n:e.n, d:e.d })),
    instrumentos: D.INSTRUMENTOS.map(i => ({ sel:i.sel }))
  };
  function load(){ try{ return JSON.parse(localStorage.getItem(STORE)); }catch(e){ return null; } }
  function normalize(){
    if(!state || typeof state!=="object") state={};
    if(!state.sustancias) state.sustancias={ "Gasolina regular":{cap:"",prov:""}, "Gasolina Premium":{cap:"",prov:""}, "Diésel Automotriz":{cap:"",prov:""} };
    if(!Array.isArray(state.estrategias) || state.estrategias.length!==D.ESTRATEGIAS_POEGT.length)
      state.estrategias=D.ESTRATEGIAS_POEGT.map(e=>({n:e.n,d:e.d}));
    if(!Array.isArray(state.instrumentos) || state.instrumentos.length!==D.INSTRUMENTOS.length)
      state.instrumentos=D.INSTRUMENTOS.map(i=>({sel:i.sel}));
    if(!Array.isArray(state.puntos)) state.puntos=[{x:"",y:""},{x:"",y:""},{x:"",y:""},{x:"",y:""}];
    if(!state.figuras || typeof state.figuras!=="object") state.figuras={};
    if(!state.checklist || typeof state.checklist!=="object") state.checklist={};
    if(!state.anexos || typeof state.anexos!=="object") state.anexos={};
    if(!state.tablas || typeof state.tablas!=="object") state.tablas={};
    if(!Array.isArray(state.sus_construccion)) state.sus_construccion=D.SUS_CONSTRUCCION_DEFAULT.map(r=>({...r}));
    if(!Array.isArray(state.sus_operacion))    state.sus_operacion=D.SUS_OPERACION_DEFAULT.map(r=>({...r}));
    D.AREAS.forEach(a=>{ if(!Array.isArray(state.figuras[a.id])) state.figuras[a.id]=(a.defaults||[]).map((t,i)=>({id:a.id+"_"+i, titulo:t})); });
  }
  let _liveT=null;
  function programarLive(){ clearTimeout(_liveT); _liveT=setTimeout(()=>{ try{ renderLiveDoc(); }catch(e){} }, 280); }

  // Actualiza semáforos del TOC sin re-renderizar el formulario
  function updateTocDots(){
    document.querySelectorAll("nav.toc a[data-sec]").forEach(a=>{
      const sec=SECTIONS.find(s=>s.id===a.dataset.sec); if(!sec) return;
      const st=seccionStatus(sec);
      let dot=a.querySelector(".toc-dot");
      if(st==="neutral"){ if(dot) dot.remove(); return; }
      if(!dot){ dot=document.createElement("span"); dot.className="toc-dot"; a.prepend(dot); }
      dot.className="toc-dot "+st;
    });
  }

  // Actualiza el indicador de campo vacío sin re-renderizar el formulario
  function updateFieldFalta(){
    document.querySelectorAll(".field[data-fid]").forEach(div=>{
      const f=findField(div.dataset.fid); if(!f||f.b!=="cerrada") return;
      const empty=!(state[f.id]!=null&&String(state[f.id]).trim()!=="");
      div.classList.toggle("falta",empty);
    });
  }

  function save(){ localStorage.setItem(STORE, JSON.stringify(state)); saveCurrentProject(); updateProgress(); updateTocDots(); updateFieldFalta(); programarLive(); }
  function g(id, def=""){ return state[id]!=null && state[id]!=="" ? state[id] : def; }

  // ---- Definición del cuestionario (secciones = capítulos del IP) ----
  // tipos: text, num, money, date, select, textarea, open(boiler/abierta info)
  const SECTIONS = [
    { id:"importar", grp:"Inicio", titulo:"⬆ Importar RECOPILACIÓN (autollenado)", desc:"Fuente primaria de datos: el formulario de recopilación que ya capturó el ingeniero. Autollena los campos del proyecto; tú sólo verificas.", fields:[
      {id:"_importar", tipo:"importar"}
    ]},
    { id:"portada", grp:"Inicio", titulo:"Portada y datos base", desc:"Se propagan a todo el documento (portada, encabezados, Introducción, II, III.5.1, Conclusión).", fields:[
      {id:"proyecto", l:"Nombre del proyecto", tipo:"text", b:"cerrada", hint:"Tal como aparecerá en el IP"},
      {id:"empresa", l:"Nombre de empresa / razón social (promovente)", tipo:"text", b:"cerrada"},
      {id:"fecha", l:"Fecha del informe", tipo:"date", b:"cerrada"}
    ]},

    { id:"I1", grp:"I. Datos generales", titulo:"I.1 Datos del proyecto", desc:"Ubicación, superficie, inversión, empleos y duración.", fields:[
      {id:"calle", l:"Calle y número", tipo:"text", b:"cerrada"},
      {id:"colonia", l:"Colonia / Localidad", tipo:"text", b:"cerrada"},
      {id:"municipio", l:"Municipio", tipo:"text", b:"cerrada"},
      {id:"estado", l:"Entidad federativa (Estado)", tipo:"selectEstado", b:"cerrada", hint:"Al elegir, se autocarga el bloque del Plan Estatal"},
      {id:"cp", l:"C.P.", tipo:"text", b:"cerrada"},
      {id:"utmZona", l:"Zona UTM", tipo:"text", b:"cerrada", hint:"p. ej. 13Q / 14Q"},
      {id:"utmDatum", l:"Datum", tipo:"text", b:"cerrada", def:"WGS84"},
      {id:"superficie", l:"Superficie ocupada por el proyecto (m²)", tipo:"num", b:"cerrada"},
      {id:"inversion", l:"Inversión estimada (MXN)", tipo:"money", b:"cerrada"},
      {id:"empleosDir", l:"Empleos directos", tipo:"num", b:"cerrada"},
      {id:"empleosInd", l:"Empleos indirectos", tipo:"num", b:"cerrada"},
      {id:"durPrep", l:"Duración — Preparación del sitio", tipo:"text", b:"cerrada", hint:"meses/semanas"},
      {id:"durConstr", l:"Duración — Construcción", tipo:"text", b:"cerrada"},
      {id:"durOper", l:"Duración — Operación", tipo:"text", b:"cerrada", hint:"años"},
      {id:"puntos", l:"Puntos de inflexión (coordenadas UTM)", tipo:"puntos", b:"cerrada"}
    ]},

    { id:"I2", grp:"I. Datos generales", titulo:"I.2 Promovente", desc:"Datos del acta constitutiva.", fields:[
      {id:"rfcEmpresa", l:"RFC de la empresa promovente", tipo:"text", b:"cerrada"},
      {id:"repLegal", l:"Representante legal (nombre completo)", tipo:"text", b:"cerrada"},
      {id:"rfcRep", l:"RFC del representante", tipo:"text", b:"cerrada"},
      {id:"curpRep", l:"CURP del representante", tipo:"text", b:"cerrada"},
      {id:"dirNotif", l:"Domicilio para notificaciones", tipo:"text", b:"cerrada"},
      {id:"telProm", l:"Teléfono", tipo:"text", b:"cerrada"},
      {id:"emailProm", l:"Correo electrónico", tipo:"text", b:"cerrada"}
    ]},

    { id:"I3", grp:"I. Datos generales", titulo:"I.3 Responsable del IP", desc:"Datos fijos de la consultora (pre-cargados). Sólo ajustar si cambian.", fields:[
      {id:"cNombre", l:"Nombre del responsable técnico", tipo:"text", b:"boiler", def:D.CONSULTORA.nombre},
      {id:"cProfesion", l:"Profesión", tipo:"text", b:"boiler", def:D.CONSULTORA.profesion},
      {id:"cCedula", l:"Cédula profesional", tipo:"text", b:"boiler", def:D.CONSULTORA.cedula},
      {id:"cRfc", l:"RFC", tipo:"text", b:"boiler", def:D.CONSULTORA.rfc},
      {id:"cCurp", l:"CURP", tipo:"text", b:"boiler", def:D.CONSULTORA.curp},
      {id:"cEmpresa", l:"Empresa responsable del estudio", tipo:"text", b:"boiler", def:D.CONSULTORA.empresaResponsable},
      {id:"cDir", l:"Dirección", tipo:"text", b:"boiler", def:D.CONSULTORA.direccion},
      {id:"cTel", l:"Teléfono", tipo:"text", b:"boiler", def:D.CONSULTORA.tel},
      {id:"cEmail", l:"Correo electrónico", tipo:"text", b:"boiler", def:D.CONSULTORA.email}
    ]},

    { id:"II1", grp:"II. Fundamento jurídico", titulo:"II.1 Instrumentos jurídicos aplicables", desc:"Selecciona los instrumentos; cada uno trae su descripción y vinculación estándar.", fields:[
      {id:"instrumentos", l:"Marco normativo", tipo:"instrumentos", b:"boiler"}
    ]},

    { id:"II2", grp:"II. Fundamento jurídico", titulo:"II.2 Ordenamiento ecológico (POEGT)", desc:"Texto nacional fijo + variables de la UAB; y las 44 estrategias con respuesta estándar.", fields:[
      {id:"uab", l:"UAB número", tipo:"text", b:"cerrada"},
      {id:"clavePolitica", l:"Clave política", tipo:"text", b:"cerrada"},
      {id:"ordRegional", l:"Ordenamiento Regional número", tipo:"text", b:"cerrada"},
      {id:"regionEco", l:"Región Ecológica número", tipo:"text", b:"cerrada"},
      {id:"regionEcoNombre", l:"Nombre de la Región Ecológica", tipo:"text", b:"cerrada"},
      {id:"estrategias", l:"Vinculación con las 44 estrategias del POEGT", tipo:"estrategias", b:"boiler"},
      {id:"tablaUab", l:"Tabla II.3 — Políticas y usos de la UAB (llenar con IA)", tipo:"tablaIA", b:"abierta",
        nota:"Pega los datos de la UAB del POEGT (rectores, coadyuvantes, asociados, política ambiental, área de atención prioritaria, estrategias sectoriales) o adjunta una imagen; la IA llena la Tabla II.3.",
        tablas:[{key:"tablaUabPoliticas", titulo:"Políticas y usos de la UAB (conceptos: Rectores de desarrollo, Coadyuvantes del desarrollo, Asociados del desarrollo, Otros sectores de interés, Política Ambiental, Clave del Área de Atención Prioritaria, Nombre del Área de Atención Prioritaria, Estrategias sectoriales)", columnas:["Concepto","Valor"]}]}
    ]},

    { id:"II3", grp:"II. Fundamento jurídico", titulo:"II.2.4 / II.3 Plan municipal y parque industrial", desc:"", fields:[
      {id:"ugaEstatal", l:"Clave UGA estatal", tipo:"text", b:"cerrada"},
      {id:"municipioPlan", l:"Municipio del Plan Municipal", tipo:"text", b:"cerrada", hint:"si difiere"},
      {id:"parqueInd", l:"¿El proyecto está en un parque industrial evaluado por la Secretaría?", tipo:"select", opts:["No (predio independiente)","Sí"], b:"boiler"},
      {id:"tablaMunicipal", l:"Tablas II.7 y II.8 — Plan municipal y POEL (llenar con IA)", tipo:"tablaIA", b:"abierta",
        nota:"Pega los criterios del Plan Municipal de Desarrollo y del POEL del municipio (o adjunta una imagen); la IA llena las Tablas II.7 y II.8, sin límite de filas.",
        tablas:[
          {key:"tablaPlanMunicipal", titulo:"Vinculación con criterios del Plan Municipal", columnas:["Criterio","Descripción","Relación directa con el proyecto"]},
          {key:"tablaPOEL", titulo:"POEL — UGA del municipio", columnas:["Clave UGA","Nombre UGA","Política territorial","Uso predominante","Uso condicionado","Uso incompatible"]}
        ]}
    ]},

    { id:"III1", grp:"III. Aspectos técnicos", titulo:"III.1 Datos generales del proyecto", desc:"Datos administrativos cerrados.", fields:[
      {id:"claveCatastral", l:"Clave catastral", tipo:"text", b:"cerrada"},
      {id:"respObra", l:"Responsable de la obra", tipo:"text", b:"cerrada"},
      {id:"permisoCRE", l:"Permiso de la CRE", tipo:"text", b:"cerrada"},
      {id:"regASEA", l:"No. de Registro ASEA", tipo:"text", b:"cerrada"},
      {id:"usoSuelo", l:"Uso de suelo del sitio", tipo:"select", opts:["Urbano","Suburbano","Industrial","Agrícola","Erial"], b:"cerrada"},
      {id:"III1abierta", l:"III.1.2–III.1.7 Descripción técnica, dimensiones, programa de trabajo", tipo:"open",
        nota:"Sección ABIERTA: requiere memoria técnica, planos, diagrama de Gantt y detalles de tanques/tuberías/maquinaria. Se conserva la guía ✎ del formato.", b:"abierta"},
      {id:"iaDescTecnica", l:"Descripción técnica (III.1.2–7) — redacción con IA", tipo:"ia", seccion:"descripcion_tecnica", b:"abierta",
        nota:"Genera la descripción técnica (actividades, dimensiones, programa, tanques/SRV) con IA. Editable; se inserta en III.1."},
      {id:"tablaDetallesTec", l:"Tablas III.1.7 — tanques, tuberías, extintores, distancias (llenar con IA)", tipo:"tablaIA", b:"abierta",
        nota:"Pega la memoria técnica / ficha de equipos (o adjunta una imagen) y la IA llena las tablas de tanques, tuberías, extintores y distancias mínimas, SIN límite de filas.",
        tablas:[
          {key:"tablaTanques",    titulo:"Tanques sujetos a presión", columnas:["ID Tanque","Capacidad (L)","Producto","Presión diseño","Presión operación","Set PSV","Año/Serie","Fabricante","Dictamen/UV"]},
          {key:"tablaTuberias",   titulo:"Tuberías y conexiones",     columnas:["Fluido / Servicio","Ø Nominal","Material","Tipo de instalación","Profundidad","Pendiente","Prueba / Dictamen","Observaciones"]},
          {key:"tablaExtintores", titulo:"Extintores",                columnas:["No.","Ubicación","Tipo","Capacidad","Evidencia"]},
          {key:"tablaDistancias", titulo:"Distancias mínimas",        columnas:["Elemento","Distancia requerida (m)","Distancia de proyecto (m)","Cumple"]}
        ]}
    ]},

    { id:"III2", grp:"III. Aspectos técnicos", titulo:"III.2 Sustancias peligrosas", desc:"CRETIB y CAS pre-cargados. Ajusta ID tanque, capacidad (gal) y proveedor. Agrega filas en III.2.2 y III.2.3 según el proyecto.", fields:[
      {id:"sustancias",       l:"III.2.1 Sustancias en tanques de almacenamiento",       tipo:"sustancias",  b:"cerrada"},
      {id:"sus_construccion", l:"III.2.2 Sustancias peligrosas en construcción",          tipo:"susDinamica", b:"cerrada"},
      {id:"sus_operacion",    l:"III.2.3 Sustancias peligrosas en operación y mantenimiento", tipo:"susDinamica", b:"cerrada"}
    ]},

    { id:"III3", grp:"III. Aspectos técnicos", titulo:"III.3 Emisiones, descargas y residuos", desc:"", fields:[
      {id:"III3abierta", l:"Emisiones atmosféricas, descargas, residuos (RSU/RME/RP/RCD), ruido y diagrama de flujos", tipo:"open",
        nota:"Sección ABIERTA: especificar por etapa (preparación, construcción, operación, abandono) con medidas de control. Guía ✎ conservada.", b:"abierta"},
      {id:"iaEmisiones", l:"Emisiones y residuos (III.3) — redacción con IA", tipo:"ia", seccion:"emisiones_residuos", b:"abierta",
        nota:"Genera III.3 (VOC con/sin SRV, descargas, RSU/RME/RP/RCD, ruido) con IA. Editable; se inserta en III.3."}
    ]},

    { id:"III4", grp:"III. Aspectos técnicos", titulo:"III.4 Diagnóstico ambiental", desc:"El Modelo Ecológico Conceptual (MEC) se incluye automáticamente.", fields:[
      {id:"incluirMEC", l:"Incluir texto de principios del MEC (boilerplate)", tipo:"check", b:"boiler", def:true},
      {id:"III4abierta", l:"Clima, geología, edafología, hidrología, flora/fauna, medio socioeconómico, diagnóstico", tipo:"open",
        nota:"Sección ABIERTA: requiere mapas, cartas, listados de flora/fauna (NOM-059) y datos INEGI/CONAGUA. Guía ✎ conservada.", b:"abierta"},
      {id:"iaFloraFauna", l:"Flora y fauna (III.4.3) — redacción con IA", tipo:"ia", seccion:"flora_fauna", b:"abierta",
        nota:"Genera el diagnóstico biótico (vegetación + fauna + estatus NOM-059) con IA a partir de los datos del proyecto. Editable; se inserta en III.4.3 del documento."},
      {id:"tablaBiota", l:"Listados de flora y fauna (Tablas III.15–III.18) — llenar con IA", tipo:"tablaIA", b:"abierta",
        nota:"Pega el listado de especies (o adjunta una imagen de la tabla/listado) y la IA llena las 4 tablas (flora, mamíferos, aves, anfibios/reptiles) SIN límite de filas. Se vuelcan al documento.",
        tablas:[
          {key:"tablaFlora",     titulo:"Flora",               columnas:["Familia","Nombre científico","Nombre común","NOM-059-SEMARNAT"]},
          {key:"tablaMamiferos", titulo:"Mamíferos",           columnas:["Familia","Nombre científico","Nombre común","NOM-059-SEMARNAT"]},
          {key:"tablaAvifauna",  titulo:"Avifauna",            columnas:["Familia","Nombre científico","Nombre común","NOM-059-SEMARNAT"]},
          {key:"tablaHerpeto",   titulo:"Anfibios y reptiles", columnas:["Familia","Nombre científico","Nombre común","NOM-059-SEMARNAT"]}
        ]}
    ]},

    { id:"III5", grp:"III. Aspectos técnicos", titulo:"III.5 Identificación de impactos", desc:"La metodología (Leopold + Gómez-Orea + índices) y las escalas se incluyen automáticamente.", fields:[
      {id:"incluirMetodo", l:"Incluir metodología y tablas de criterios/escalas (boilerplate)", tipo:"check", b:"boiler", def:true},
      {id:"III5abierta", l:"Matriz de Leopold, evaluación de índices, descripción de impactos y balance", tipo:"open",
        nota:"Sección ABIERTA: requiere construir la matriz de Leopold y la matriz de resultados con los cálculos del proyecto. Guía ✎ conservada.", b:"abierta"},
      {id:"iaImpactos", l:"Identificación de impactos (III.5) — redacción con IA", tipo:"ia", seccion:"impactos", b:"abierta",
        nota:"Genera III.5.7 (descripción de impactos altos/medios) y III.5.8 (balance) con IA, según la metodología Leopold/Gómez-Orea. Editable; se inserta en III.5."}
    ]},

    { id:"III6", grp:"III. Aspectos técnicos", titulo:"III.6 / III.7 Medidas y sustentabilidad", desc:"", fields:[
      {id:"III6abierta", l:"Medidas de prevención/mitigación por etapa y condiciones adicionales", tipo:"open",
        nota:"Sección ABIERTA: tablas de medidas por etapa (preparación, operación, abandono) + Programa de Vigilancia Ambiental. Guía ✎ conservada.", b:"abierta"},
      {id:"iaMedidas", l:"Medidas de mitigación (III.6/III.7) — redacción con IA", tipo:"ia", seccion:"medidas", b:"abierta",
        nota:"Genera las medidas por etapa (impacto, responsable, indicador, NOM) + Programa de Vigilancia con IA. Editable; se inserta en III.6."},
      {id:"tablaMedidas", l:"Tablas de medidas y vigilancia (III.27–III.30) — llenar con IA", tipo:"tablaIA", b:"abierta",
        nota:"Pega los impactos/medidas (o adjunta una imagen) y la IA llena las tablas de medidas por etapa y el Programa de Vigilancia, SIN límite de filas. Se vuelcan al documento.",
        tablas:[
          {key:"tablaMedidasPrep", titulo:"Medidas — preparación/construcción", columnas:["Factor ambiental","Impacto / fuente","Medida de prevención/mitigación","Programa y responsable","NOM / marco legal","Resultado / impacto residual"]},
          {key:"tablaMedidasOper", titulo:"Medidas — operación",                columnas:["Factor ambiental","Impacto / fuente","Medida de prevención/mitigación","Programa y responsable","NOM / marco legal","Resultado / impacto residual"]},
          {key:"tablaMedidasAband",titulo:"Medidas — abandono",                 columnas:["Factor ambiental","Impacto / fuente","Medida de prevención/mitigación","Programa y responsable","NOM / marco legal","Resultado / impacto residual"]},
          {key:"tablaVigilancia",  titulo:"Programa de Vigilancia Ambiental",    columnas:["Etapa","Acción de vigilancia","Indicador verificable","Frecuencia","Responsable"]}
        ]}
    ]},

    { id:"IV", grp:"IV. Abandono", titulo:"IV. Abandono del sitio", desc:"Párrafos plantilla con variables. Se redactan solos.", fields:[
      {id:"ivComponentes", l:"Componentes que se intervendrán", tipo:"text", b:"cerrada", def:"tanques, líneas, dispensarios, trampas y drenajes"},
      {id:"incluirAbandono", l:"Incluir párrafos boilerplate de cierre (IV.1–IV.8)", tipo:"check", b:"boiler", def:true}
    ]},

    { id:"V", grp:"V. Conclusión", titulo:"V. Conclusión", desc:"Texto fijo (no requiere modificación salvo indicación de ASEA).", fields:[
      {id:"incluirConclusion", l:"Incluir conclusión estándar", tipo:"check", b:"boiler", def:true}
    ]},

    { id:"anexos", grp:"VI. Anexos", titulo:"VI. Planos y anexos", desc:'Plano general y figuras adicionales (anexo fotográfico). Usa "+ Agregar imagen".', fields:[] }
  ];

  // Lista de campos cerrados/boiler que cuentan para el progreso
  const REQUERIDOS = ["proyecto","empresa","calle","colonia","municipio","estado","cp","superficie","inversion","empleosDir","rfcEmpresa","repLegal","claveCatastral","permisoCRE","regASEA","uab"];

  // ============== SEMÁFORO DE SECCIÓN ==============
  function seccionStatus(sec){
    const FL={text:1,num:1,money:1,date:1,select:1,selectEstado:1};
    let total=0, done=0;
    (sec.fields||[]).forEach(f=>{
      if(FL[f.tipo]){
        total++;
        const v=state[f.id]!=null?state[f.id]:(f.def!=null?f.def:"");
        if(v!==""&&String(v).trim()!=="") done++;
      } else if(f.tipo==="ia"){
        total++;
        if(state[f.id]&&String(state[f.id]).trim()) done++;
      } else if(f.tipo==="tablaIA"){
        (f.tablas||[]).forEach(t=>{
          total++;
          const r=state.tablas&&state.tablas[t.key];
          if(Array.isArray(r)&&r.length) done++;
        });
      } else if(f.tipo==="sustancias"){
        Object.keys(D.SUSTANCIAS).forEach(name=>{
          total++; const s=state.sustancias&&state.sustancias[name];
          if(s&&String(s.cap||"").trim()&&String(s.prov||"").trim()) done++;
        });
      } else if(f.tipo==="susDinamica"){
        total++;
        const arr=state[f.id];
        if(Array.isArray(arr)&&arr.some(r=>String(r.prod||"").trim())) done++;
      }
    });
    if(!total) return "neutral";
    return done===total?"green":"yellow";
  }

  // ============== RENDER DEL FORMULARIO ==============
  function badge(b){
    const m={cerrada:["cerrada","Cerrada"],boiler:["boiler","Redactada-cerrada"],abierta:["abierta","Abierta ✎"]};
    const x=m[b]||m.cerrada; return `<span class="badge ${x[0]}">${x[1]}</span>`;
  }

  // Numeración automática de figuras en orden de documento (respeta toggles)
  function numerarFiguras(){
    const figs=state.figuras||{}; const out={}; let n=0;
    for(const a of D.AREAS){
      const list=figs[a.id]||[];
      const gatedOff = a.gatedBy && state[a.gatedBy]===false;
      out[a.id]=list.map(f=>({ id:f.id, titulo:f.titulo,
        num: (gatedOff || a.numbered===false) ? null : (++n) }));
    }
    return out;
  }

  function renderForm(){
    const toc=$("#toc"); const form=$("#form");
    let tocHtml="", lastGrp="", formHtml="";
    const figMap = numerarFiguras();
    const areasBySec = {};
    D.AREAS.forEach(a=>{ (areasBySec[a.sec]=areasBySec[a.sec]||[]).push(a); });
    SECTIONS.forEach(sec=>{
      if(sec.grp!==lastGrp){ tocHtml+=`<div class="grp">${esc(sec.grp)}</div>`; lastGrp=sec.grp; }
      const st=seccionStatus(sec);
      const dot=st!=="neutral"?`<span class="toc-dot ${st}"></span>`:"";
      tocHtml+=`<a href="#sec-${sec.id}" data-sec="${sec.id}">${dot}${esc(sec.titulo)}</a>`;
      formHtml+=`<section class="card" id="sec-${sec.id}"><h2>${esc(sec.titulo)}</h2>`;
      if(sec.desc) formHtml+=`<div class="desc">${esc(sec.desc)}</div>`;
      sec.fields.forEach(f=>{ formHtml+=renderField(f); });
      (areasBySec[sec.id]||[]).forEach(a=>{ formHtml+=renderFigArea(a, figMap[a.id]||[]); });
      formHtml+=`</section>`;
    });
    toc.innerHTML=tocHtml; form.innerHTML=formHtml;
    bindInputs();
    bindFiguras();
    bindIA();
    bindChecklist();
    bindAnexos();
    bindTablaIA();
    bindSusDinamica();
    bindImportar();
    setupScrollSpy();
    updateProgress();
    programarLive();
  }

  // Campos del proyecto que la recopilación puede autollenar (derivados de SECTIONS).
  function camposImportables(){
    const tipos={text:1,num:1,money:1,date:1,select:1,selectEstado:1};
    const out=[];
    SECTIONS.forEach(s=>(s.fields||[]).forEach(f=>{
      if(tipos[f.tipo]){ const c={id:f.id,label:f.l||f.id}; if(f.opts) c.opts=f.opts; if(f.tipo==="selectEstado"&&D.LISTA_ESTADOS) c.opts=D.LISTA_ESTADOS; out.push(c); }
    }));
    return out;
  }

  // Autollenado desde la RECOPILACIÓN (fuente primaria) vía IA. El ingeniero verifica.
  function bindImportar(){
    const img=document.querySelector("input[type=file][data-imp-img]");
    if(img) img.onchange=()=>{ const f=img.files[0]; const l=document.querySelector("[data-imp-imgname]"); if(l) l.textContent=f?("📷 "+f.name):""; };
    const btn=document.querySelector("[data-imp-btn]"); if(!btn) return;
    btn.onclick=async()=>{
      const txt=(document.querySelector("[data-imp-txt]")||{}).value||"";
      const url=(document.querySelector("[data-imp-url]")||{}).value||"";
      const file=img&&img.files[0];
      const status=document.querySelector("[data-imp-status]");
      if(!txt.trim() && !url.trim() && !file){ toast("Pega el contenido, un enlace o adjunta una imagen"); return; }
      let imagen=null;
      if(file){ try{ const u=await fileToDataURL(file); const m=u.match(/^data:(.*?);base64,(.*)$/); if(m) imagen={media_type:m[1],data:m[2]}; }catch(e){} }
      btn.disabled=true; const prev=btn.textContent; btn.textContent="Extrayendo…"; if(status) status.textContent=" Leyendo la recopilación con IA…";
      try{
        const r=await fetch("/api/redactar",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accion:"perfil", campos:camposImportables(), datos_crudos:txt.trim(), sheet_url:url.trim(), imagen})});
        const j=await r.json().catch(()=>({ok:false,error:"Respuesta no válida del servidor"}));
        if(!j.ok) throw new Error(j.error||("HTTP "+r.status));
        const c=j.campos||{}; let n=0;
        Object.keys(c).forEach(k=>{ const v=c[k]; if(v!==undefined && v!==null && String(v).trim()!==""){ state[k]=v; n++; } });
        save(); renderForm();
        toast(n?("✓ "+n+" campos autollenados — verifícalos"):"No se encontraron campos en la recopilación");
      }catch(e){ if(status) status.textContent=" Error: "+e.message; btn.disabled=false; btn.textContent=prev; toast("Error al importar: "+e.message); }
    };
  }

  function findField(id){ for(const s of SECTIONS){ for(const f of (s.fields||[])){ if(f.id===id) return f; } } return null; }

  // Pegar datos/imagen → IA estructura filas (sin límite) → tablas del documento.
  function bindTablaIA(){
    document.querySelectorAll("input[type=file][data-timg]").forEach(inp=>{
      inp.onchange=()=>{ const f=inp.files[0]; const lbl=document.querySelector('[data-tdimg-name="'+inp.dataset.timg+'"]'); if(lbl) lbl.textContent=f?("📷 "+f.name):""; };
    });
    document.querySelectorAll("[data-tbtn]").forEach(btn=>{
      btn.onclick=async()=>{
        const fid=btn.dataset.tbtn, field=findField(fid); if(!field) return;
        const draw=document.querySelector('[data-tdraw="'+fid+'"]'); const datos_crudos=draw?draw.value.trim():"";
        const imgInp=document.querySelector('[data-timg="'+fid+'"]'); const file=imgInp&&imgInp.files[0];
        const status=document.querySelector('[data-tstatus="'+fid+'"]');
        if(!datos_crudos && !file){ toast("Pega datos o adjunta una imagen primero"); return; }
        let imagen=null;
        if(file){ try{ const url=await fileToDataURL(file); const m=url.match(/^data:(.*?);base64,(.*)$/); if(m) imagen={media_type:m[1], data:m[2]}; }catch(e){} }
        btn.disabled=true; const prev=btn.textContent; btn.textContent="Estructurando…"; if(status) status.textContent=" Procesando con IA…";
        try{
          const r=await fetch("/api/redactar",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accion:"tabla", tablas:field.tablas, datos_crudos, imagen})});
          const j=await r.json().catch(()=>({ok:false,error:"Respuesta no válida del servidor"}));
          if(!j.ok) throw new Error(j.error||("HTTP "+r.status));
          if(!state.tablas) state.tablas={};
          Object.keys(j.tablas||{}).forEach(k=>{ if(Array.isArray(j.tablas[k])) state.tablas[k]=j.tablas[k]; });
          save(); renderForm();
          toast("Tablas estructuradas ✓ — revisa el documento (III.4.3)");
        }catch(e){ if(status) status.textContent=" Error: "+e.message; btn.disabled=false; btn.textContent=prev; toast("Error IA: "+e.message); }
      };
    });
  }

  // Referencias / Anexos: registro editable de documentos requeridos + enlaces.
  function renderAnexos(){
    const docs = D.ANEXOS_DOCS || [];
    const ax = state.anexos || {};
    const driveIco=`<svg width="16" height="16" viewBox="0 0 87.3 78"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z" fill="#00ac47"/><path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/><path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg>`;
    const fileIco=`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    let items = docs.map(d=>{
      const link=(ax[d.id]!==undefined?ax[d.id]:d.link)||"";
      const abrirBtn=link?`<a href="${esc(link)}" target="_blank" rel="noopener" class="ax-open">${driveIco} Abrir</a>`:"";
      return `<div class="ax-item">
        <div class="ax-top">
          <div class="ax-file-ico">${fileIco}</div>
          <div class="ax-info">
            <div class="ax-nombre">${esc(d.nombre)}</div>
            <div class="ax-usa">Usa en: ${esc(d.usa||"—")}</div>
          </div>
        </div>
        <div class="ax-link-row">
          <input class="ax-link" data-ax="${esc(d.id)}" value="${esc(link)}" placeholder="Enlace de Drive…">
          ${abrirBtn}
        </div>
      </div>`;
    }).join("");
    return `<div class="ax-list">${items}<p style="font-size:11px;color:var(--gris);margin-top:14px;line-height:1.5">Los enlaces se guardan por proyecto en este equipo. Se exportan con Guardar JSON.</p></div>`;
  }
  function bindAnexos(){
    document.querySelectorAll("input.ax-link[data-ax]").forEach(inp=>{
      inp.oninput=()=>{ if(!state.anexos) state.anexos={}; state.anexos[inp.dataset.ax]=inp.value; save(); };
    });
  }

  // Checklist ASEA-00-041 (interactivo, persistente en localStorage).
  function checklistId(gi, ii){ return "ck_"+gi+"_"+ii; }
  function renderChecklist(){
    const grupos = D.CHECKLIST_ASEA || [];
    const cks = state.checklist || {};
    let total=0, hechos=0, h="";
    grupos.forEach((grp, gi)=>{
      h+=`<div class="ck-grp"><h3 style="margin:14px 0 6px">${esc(grp.g)}</h3>`;
      grp.items.forEach((it, ii)=>{
        const obj = typeof it==="string" ? {t:it} : it;
        const id = checklistId(gi, ii); const on = !!cks[id];
        total++; if(on) hechos++;
        h+=`<label class="ck-item" style="display:flex;gap:8px;align-items:flex-start;padding:3px 0;${obj.sub?'margin-left:22px':''}">`+
           `<input type="checkbox" data-ck="${id}" ${on?'checked':''} style="margin-top:3px">`+
           `<span>${esc(obj.t)}</span></label>`;
      });
      h+=`</div>`;
    });
    const pct = total? Math.round(hechos*100/total) : 0;
    return `<div class="checklist"><div class="ck-resumen" style="font-weight:600;margin-bottom:8px">Avance: ${hechos}/${total} (${pct}%)</div>${h}</div>`;
  }
  function bindChecklist(){
    document.querySelectorAll("input[type=checkbox][data-ck]").forEach(cb=>{
      cb.onchange=()=>{
        if(!state.checklist) state.checklist={};
        if(cb.checked) state.checklist[cb.dataset.ck]=true; else delete state.checklist[cb.dataset.ck];
        save();
        const cont = cb.closest(".checklist");
        if(cont){ const res=cont.querySelector(".ck-resumen");
          const all=cont.querySelectorAll("input[type=checkbox][data-ck]");
          const done=cont.querySelectorAll("input[type=checkbox][data-ck]:checked");
          const pct=all.length?Math.round(done.length*100/all.length):0;
          if(res) res.textContent=`Avance: ${done.length}/${all.length} (${pct}%)`;
        }
      };
    });
  }

  // Redacción IA de secciones abiertas (llama a /api/redactar — función serverless en Vercel).
  function bindIA(){
    document.querySelectorAll(".ia-btn[data-ia]").forEach(btn=>{
      btn.onclick = async ()=>{
        const seccion = btn.dataset.ia, target = btn.dataset.target;
        const status = document.querySelector('[data-ia-status="'+target+'"]');
        const sup = g("superficie","");
        const datos = {
          nombre_proyecto: g("proyecto",""),
          municipio: g("municipio",""),
          estado: g("estado",""),
          ubicacion: [g("calle",""),g("colonia",""),g("municipio",""),g("estado","")].filter(Boolean).join(", "),
          superficie: sup ? (sup+" m²") : "",
          en_anp: false
        };
        btn.disabled = true; const prev = btn.textContent; btn.textContent = "Redactando…";
        if(status) status.textContent = " Generando con IA, espera unos segundos…";
        try{
          const r = await fetch("/api/redactar", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({seccion, datos}) });
          const j = await r.json().catch(()=>({ok:false,error:"Respuesta no válida del servidor"}));
          if(!j.ok) throw new Error(j.error || ("HTTP "+r.status));
          state[target] = j.texto; save(); renderForm();
          toast("Redacción generada ✓ — revisa el texto y míralo en el documento (III.4.3)");
        }catch(e){
          if(status) status.textContent = " Error: "+e.message;
          btn.disabled=false; btn.textContent=prev;
          toast("Error IA: "+e.message);
        }
      };
    });
  }

  // Render de un área de figuras (su lugar en la sección): + Agregar, título editable, miniatura
  function renderFigArea(area, entries){
    const gatedOff = area.gatedBy && state[area.gatedBy]===false;
    const head = area.id==="anexo" ? "Anexo fotográfico (figuras adicionales)" : ("Figura: "+(area.defaults[0]||""));
    let h=`<div class="figarea" data-area="${esc(area.id)}">
      <div class="figarea-h"><span class="figarea-t">🖼️ ${esc(head)}</span>
        <button type="button" class="figadd" data-figadd="${esc(area.id)}">+ Agregar imagen</button></div>`;
    if(gatedOff) h+=`<div class="figarea-note">Esta subsección está desactivada; actívala para incluir sus figuras en el documento.</div>`;
    if(!entries.length) h+=`<div class="figarea-empty">Sin imágenes. Usa "+ Agregar imagen".</div>`;
    entries.forEach(f=>{
      const src=imgCache[f.id];
      const numLbl = f.num!=null ? ("Figura "+f.num+".") : (area.numbered===false ? "Imagen" : "Figura —");
      h+=`<div class="figrow">
        <div class="figthumb ${src?'has':''}" data-pick="${esc(f.id)}">${ src?`<img src="${src}" alt="">`:`<span>🖼️</span>` }</div>
        <div class="figmeta">
          <div class="figtitle-row"><span class="fignum">${esc(numLbl)}</span>
            <input class="figtitle" data-figtitle="${esc(f.id)}" data-area="${esc(area.id)}" value="${esc(f.titulo||'')}" placeholder="Título de la figura (editable)"></div>
          <div class="figacts">
            <label class="imglink">${src?'Reemplazar imagen':'Subir imagen'}<input type="file" accept="image/*" data-fig="${esc(f.id)}" hidden></label>
            ${ src?`<button type="button" class="imglink danger" data-figclear="${esc(f.id)}">Quitar imagen</button>`:'' }
            <button type="button" class="imglink danger" data-figdel="${esc(f.id)}" data-area="${esc(area.id)}">Eliminar figura</button>
          </div>
        </div>
      </div>`;
    });
    return h+`</div>`;
  }

  function bindFiguras(){
    const form=$("#form");
    form.querySelectorAll("input[type=file][data-fig]").forEach(inp=>inp.onchange=e=>{ const file=e.target.files[0]; if(file) setImagen(inp.dataset.fig,file); });
    form.querySelectorAll(".figthumb[data-pick]").forEach(t=>t.onclick=()=>{ const i=form.querySelector('input[data-fig="'+t.dataset.pick+'"]'); if(i) i.click(); });
    form.querySelectorAll("[data-figclear]").forEach(b=>b.onclick=()=>delImagen(b.dataset.figclear));
    form.querySelectorAll("[data-figdel]").forEach(b=>b.onclick=()=>removeFigura(b.dataset.area, b.dataset.figdel));
    form.querySelectorAll("[data-figadd]").forEach(b=>b.onclick=()=>addFigura(b.dataset.figadd));
    form.querySelectorAll("input.figtitle[data-figtitle]").forEach(inp=>inp.oninput=()=>editTitulo(inp.dataset.area, inp.dataset.figtitle, inp.value));
  }

  function addFigura(areaId){
    state.figuras[areaId]=state.figuras[areaId]||[];
    state.figuras[areaId].push({ id: areaId+"_"+Date.now().toString(36), titulo:"" });
    save(); renderForm();
    toast("Figura agregada — sube la imagen y edita su título");
  }
  function removeFigura(areaId, figId){
    state.figuras[areaId]=(state.figuras[areaId]||[]).filter(f=>f.id!==figId);
    delete imgCache[figId]; idbDel(figId).catch(()=>{});
    save(); renderForm();
  }
  function editTitulo(areaId, figId, val){
    const f=(state.figuras[areaId]||[]).find(x=>x.id===figId);
    if(f){ f.titulo=val; save(); }
  }

  function renderField(f){
    const val = g(f.id, f.def!=null?f.def:"");
    let inner="";
    switch(f.tipo){
      case "text": case "num": case "money":
        inner=`<input type="${f.tipo==='num'||f.tipo==='money'?'number':'text'}" data-f="${f.id}" value="${esc(val)}" ${f.tipo==='money'?'step="0.01"':''}>`; break;
      case "date":
        inner=`<input type="date" data-f="${f.id}" value="${esc(val)}">`; break;
      case "textarea":
        inner=`<textarea data-f="${f.id}">${esc(val)}</textarea>`; break;
      case "select":
        inner=`<select data-f="${f.id}">${f.opts.map(o=>`<option ${o===val?'selected':''}>${esc(o)}</option>`).join("")}</select>`; break;
      case "selectEstado":
        inner=`<select data-f="${f.id}" data-estado="1"><option value="">— Selecciona —</option>${D.LISTA_ESTADOS.map(o=>`<option ${o===val?'selected':''}>${esc(o)}</option>`).join("")}</select>`; break;
      case "check":
        inner=`<label class="chk"><input type="checkbox" data-f="${f.id}" ${ (state[f.id]===undefined?f.def:state[f.id]) ? 'checked':''}> Activado</label>`; break;
      case "puntos": return renderPuntos(f);
      case "sustancias": return renderSustancias(f);
      case "susDinamica": return renderSusDinamica(f);
      case "estrategias": return renderEstrategias(f);
      case "instrumentos": return renderInstrumentos(f);
      case "open": return `<div class="field"><label>${esc(f.l)} ${badge(f.b)}</label><div class="open-note"><b>⚠ Pendiente manual.</b> ${esc(f.nota)}</div><textarea data-f="${f.id}" placeholder="(Opcional) Notas o texto para esta sección...">${esc(val)}</textarea></div>`;
      case "ia": return `<div class="field"><label>${esc(f.l)} ${badge(f.b)}</label><div class="open-note">${esc(f.nota||"")}</div>`+
        `<div class="ia-row"><button type="button" class="ia-btn" data-ia="${esc(f.seccion)}" data-target="${esc(f.id)}" style="background:#1a6dff;color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:600">✨ Redactar con IA</button>`+
        `<span class="ia-status" data-ia-status="${esc(f.id)}" style="margin-left:10px;color:var(--muted,#888);font-size:13px"></span></div>`+
        `<textarea data-f="${f.id}" placeholder="Aquí aparecerá el texto generado por IA (editable). Se inserta en el documento.">${esc(val)}</textarea></div>`;
      case "guia": return `<div class="guia-panel">${D.GUIA_HTML||""}</div>`;
      case "checklist": return renderChecklist();
      case "anexos": return renderAnexos();
      case "importar": {
        const link = (state.anexos && state.anexos.recopilacion) || "";
        return `<div class="field"><div class="open-note">Pega el contenido del formulario de recopilación, adjunta una imagen/captura, o pega un enlace de Google Sheets. La IA extrae los datos y rellena los campos del proyecto. <b>Revisa siempre lo autollenado.</b></div>`+
          `<input class="ax-link" data-imp-url value="${esc(link)}" placeholder="Enlace de Google Sheets de la recopilación (opcional)">`+
          `<textarea data-imp-txt placeholder="O pega aquí el contenido de la recopilación (texto)…" style="min-height:90px;margin-top:6px"></textarea>`+
          `<div class="ia-row" style="margin-top:6px;display:flex;align-items:center;flex-wrap:wrap;gap:6px">`+
            `<label class="imglink" style="cursor:pointer">📷 Adjuntar imagen<input type="file" accept="image/*" data-imp-img hidden></label>`+
            `<span data-imp-imgname style="font-size:12.5px;color:var(--muted,#888)"></span>`+
            `<button type="button" class="ia-btn" data-imp-btn style="background:#0e3b29;color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:600">⬆ Autollenar datos del proyecto</button>`+
            `<span class="ia-status" data-imp-status style="font-size:13px;color:var(--muted,#888)"></span></div></div>`;
      }
      case "tablaIA": {
        const t=state.tablas||{};
        const resumen=(f.tablas||[]).map(x=>`${x.titulo}: <b>${(t[x.key]||[]).length}</b> filas`).join(" · ");
        return `<div class="field"><label>${esc(f.l)} ${badge(f.b)}</label><div class="open-note">${esc(f.nota||"")}</div>`+
          `<textarea data-tdraw="${f.id}" placeholder="Pega aquí el listado / los datos crudos (texto)…" style="min-height:90px"></textarea>`+
          `<div class="ia-row" style="margin-top:6px;display:flex;align-items:center;flex-wrap:wrap;gap:6px">`+
            `<label class="imglink" style="cursor:pointer">📷 Adjuntar imagen<input type="file" accept="image/*" data-timg="${f.id}" hidden></label>`+
            `<span data-tdimg-name="${f.id}" style="font-size:12.5px;color:var(--muted,#888)"></span>`+
            `<button type="button" class="ia-btn" data-tbtn="${f.id}" style="background:#1a6dff;color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:600">✨ Estructurar con IA</button>`+
            `<span class="ia-status" data-tstatus="${f.id}" style="font-size:13px;color:var(--muted,#888)"></span></div>`+
          `<div style="margin-top:6px;font-size:13px">${resumen}</div></div>`;
      }
    }
    let prev="";
    if(f.b==="boiler" && BOILER_PREVIEW[f.id]) prev=`<details class="boiler-prev"><summary>Ver texto que se generará</summary><div class="body" data-prev="${f.id}">${esc(BOILER_PREVIEW[f.id]())}</div></details>`;
    const isEmpty = f.b==="cerrada" && !(state[f.id]!=null && String(state[f.id]).trim()!=="");
    return `<div class="field${isEmpty?" falta":""}" data-fid="${esc(f.id)}"><label>${esc(f.l)} ${badge(f.b)}${f.hint?` <span class="hint">— ${esc(f.hint)}</span>`:''}</label>${inner}${prev}</div>`;
  }

  function renderPuntos(f){
    const pts = state.puntos || [{x:"",y:""},{x:"",y:""},{x:"",y:""},{x:"",y:""}];
    state.puntos = pts;
    let rows = pts.map((p,i)=>`<tr><td style="padding:3px">${i+1}</td><td><input data-pt="${i}" data-c="x" value="${esc(p.x)}" style="width:100%"></td><td><input data-pt="${i}" data-c="y" value="${esc(p.y)}" style="width:100%"></td></tr>`).join("");
    return `<div class="field"><label>${esc(f.l)} ${badge(f.b)}</label>
      <table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="text-align:left;padding:3px">Punto</th><th style="text-align:left">X (Este)</th><th style="text-align:left">Y (Norte)</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderSustancias(f){
    const TH = s=>`<th style="text-align:left;padding:5px 7px;background:var(--verde-claro);border:1px solid var(--linea);white-space:nowrap;font-size:11.5px">${s}</th>`;
    const TD = s=>`<td style="padding:4px 6px;border:1px solid var(--linea);font-size:11.5px">${s}</td>`;
    const INP = (name,k,val,w,ph)=>`<input data-sus="${esc(name)}" data-k="${k}" value="${esc(val)}" placeholder="${ph||""}" style="width:${w}px;font-size:11.5px;padding:3px 5px;border:1px solid var(--linea);border-radius:4px;background:#fbfdfc">`;
    let rows = Object.keys(D.SUSTANCIAS).map(name=>{
      const c=D.SUSTANCIAS[name]; const s=state.sustancias[name]||{tanqueId:c.tanqueId,cap:"",prov:""};
      return `<tr>
        ${TD(INP(name,"tanqueId",s.tanqueId||c.tanqueId||"",50))}
        ${TD(`<b>${esc(name)}</b>`)}
        ${TD(esc(c.estado))}
        ${TD(esc(c.cretib))}
        ${TD(esc(c.cas))}
        ${TD(`<span style="display:flex;align-items:center;gap:4px">${INP(name,"cap",s.cap,80,"10,000")}<span style="font-size:10.5px;color:var(--gris)">gal</span></span>`)}
        ${TD(INP(name,"prov",s.prov,110,"Pemex"))}
      </tr>`;
    }).join("");
    const heads = ["ID Tanque","Producto","Estado físico","Clave CRETIB","No. CAS","Capacidad (gal)","Proveedor"].map(TH).join("");
    return `<div class="field" data-fid="${esc(f.id)}"><label>${esc(f.l)} ${badge(f.b)}</label>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr>${heads}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  const SUS_DIN_COLS = ["Producto (nombre comercial)","Volúmenes","Estado físico","Clave CRETIB","No. CAS","Área de uso","Proveedor"];
  const SUS_DIN_KEYS = ["prod","vol","estado","cretib","cas","area","prov"];
  const SUS_DIN_W    = [190, 75, 75, 70, 85, 130, 110];

  function renderSusDinamica(f){
    const key=f.id; const rows=state[key]||[];
    const TH = s=>`<th style="text-align:left;padding:5px 7px;background:var(--verde-claro);border:1px solid var(--linea);white-space:nowrap;font-size:11.5px">${s}</th>`;
    const heads = SUS_DIN_COLS.map(TH).join("")+`<th></th>`;
    const rowsHtml = rows.map((r,i)=>{
      const cells = SUS_DIN_KEYS.map((k,j)=>
        `<td style="padding:3px 4px;border:1px solid var(--linea)"><input data-sd="${esc(key)}" data-row="${i}" data-k="${k}" value="${esc(r[k]||"")}" style="width:${SUS_DIN_W[j]}px;font-size:11.5px;padding:3px 5px;border:1px solid var(--linea);border-radius:4px;background:#fbfdfc"></td>`
      ).join("");
      return `<tr>${cells}<td style="border:1px solid var(--linea);text-align:center"><button class="sd-del" data-sd="${esc(key)}" data-row="${i}" title="Eliminar fila" style="border:none;background:transparent;color:#b3261e;cursor:pointer;font-size:14px;padding:1px 5px;line-height:1">×</button></td></tr>`;
    }).join("") || `<tr><td colspan="${SUS_DIN_COLS.length+1}" style="padding:10px;color:var(--gris);font-size:12px;text-align:center;font-style:italic">Sin filas — usa "+ Agregar fila"</td></tr>`;
    return `<div class="field" data-fid="${esc(f.id)}"><label>${esc(f.l)} ${badge(f.b)}</label>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr>${heads}</tr></thead><tbody>${rowsHtml}</tbody></table></div>
      <button class="sd-add" data-sd="${esc(key)}" style="margin-top:7px;padding:5px 12px;font-size:11.5px;font-weight:600;color:var(--verde);background:var(--verde-tint);border:1px solid #cfe0d6;border-radius:6px;cursor:pointer">+ Agregar fila</button>
    </div>`;
  }

  function renderEstrategias(f){
    let rows = D.ESTRATEGIAS_POEGT.map((e,i)=>{
      const st = state.estrategias[i] || {n:e.n,d:e.d};
      return `<div class="strat"><div class="t"><span class="num">${e.n}.</span> ${esc(e.t)}</div>
        <select data-estr="${i}">${D.DISPOSICIONES.map(o=>`<option ${o===st.d?'selected':''}>${esc(o)}</option>`).join("")}</select></div>`;
    }).join("");
    return `<div class="field"><label>${esc(f.l)} ${badge(f.b)} <span class="hint">— cada opción inserta el párrafo estándar correspondiente</span></label>${rows}</div>`;
  }

  function renderInstrumentos(f){
    let rows = D.INSTRUMENTOS.map((it,i)=>{
      const sel = state.instrumentos[i] ? state.instrumentos[i].sel : it.sel;
      return `<label class="chk"><input type="checkbox" data-instr="${i}" ${sel?'checked':''}> <span><b>${esc(it.nombre)}</b> <span class="hint">(${esc(it.cat)})</span></span></label>`;
    }).join("");
    return `<div class="field"><label>${esc(f.l)} ${badge(f.b)}</label>${rows}</div>`;
  }

  // Previews dinámicos de boilerplate
  const BOILER_PREVIEW = {
    estrategias: ()=> "Se genera una tabla con la disposición y el párrafo estándar de cada una de las 44 estrategias.",
    instrumentos: ()=> "Tabla con instrumento, descripción y vinculación de cada norma seleccionada.",
    incluirMEC: ()=> D.BOILER.mec.slice(0,260)+"…",
    incluirMetodo: ()=> D.BOILER.metodologia.replace("{{proyecto}}", g("proyecto","[proyecto]")).slice(0,260)+"…",
    incluirAbandono: ()=> D.BOILER.abandono_iv1.slice(0,260)+"…",
    incluirConclusion: ()=> D.BOILER.conclusion
  };

  // ============== BINDINGS ==============
  function bindSusDinamica(){
    const form=document.getElementById("form"); if(!form) return;
    form.querySelectorAll("input[data-sd]").forEach(inp=>{
      inp.addEventListener("input",()=>{
        const {sd,row,k}=inp.dataset;
        if(!state[sd]) state[sd]=[];
        if(!state[sd][+row]) state[sd][+row]={};
        state[sd][+row][k]=inp.value; save();
      });
    });
    form.querySelectorAll("button.sd-add").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const key=btn.dataset.sd;
        if(!state[key]) state[key]=[];
        state[key].push({prod:"",vol:"",estado:"Líquido",cretib:"",cas:"",area:"",prov:""});
        save(); renderForm();
      });
    });
    form.querySelectorAll("button.sd-del").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const {sd,row}=btn.dataset;
        if(state[sd]&&state[sd].length>0) state[sd].splice(+row,1);
        save(); renderForm();
      });
    });
  }

  function bindInputs(){
    $("#form").querySelectorAll("[data-f]").forEach(el=>{
      const ev = (el.type==="checkbox") ? "change" : "input";
      el.addEventListener(ev, ()=>{
        const id=el.dataset.f;
        state[id] = el.type==="checkbox" ? el.checked : el.value;
        if(el.dataset.estado) onEstadoChange(el.value);
        save();
        refreshPreviews();
      });
    });
    $("#form").querySelectorAll("[data-pt]").forEach(el=>el.addEventListener("input",()=>{
      const i=+el.dataset.pt, c=el.dataset.c; state.puntos[i][c]=el.value; save();
    }));
    $("#form").querySelectorAll("[data-sus]").forEach(el=>el.addEventListener("input",()=>{
      const n=el.dataset.sus,k=el.dataset.k; state.sustancias[n]=state.sustancias[n]||{cap:"",prov:""}; state.sustancias[n][k]=el.value; save();
    }));
    $("#form").querySelectorAll("[data-estr]").forEach(el=>el.addEventListener("change",()=>{
      const i=+el.dataset.estr; state.estrategias[i]={n:D.ESTRATEGIAS_POEGT[i].n,d:el.value}; save();
    }));
    $("#form").querySelectorAll("[data-instr]").forEach(el=>el.addEventListener("change",()=>{
      const i=+el.dataset.instr; state.instrumentos[i]={sel:el.checked}; save();
    }));
  }

  function onEstadoChange(estado){
    const blk = D.ESTADOS[estado];
    if(blk){
      if(blk.ugaDefault && !g("ugaEstatal")){ state.ugaEstatal = blk.ugaDefault; save(); renderForm(); }
      toast("Plan Estatal y criterios UGA de "+estado+" cargados");
    }
  }

  function refreshPreviews(){
    document.querySelectorAll("[data-prev]").forEach(el=>{
      const id=el.dataset.prev; if(BOILER_PREVIEW[id]) el.textContent=BOILER_PREVIEW[id]();
    });
  }

  function updateProgress(){
    const FL={text:1,num:1,money:1,date:1,select:1,selectEstado:1};
    let total=0, done=0;
    SECTIONS.forEach(sec=>(sec.fields||[]).forEach(f=>{
      if(FL[f.tipo]){ total++; const v=state[f.id]!=null?state[f.id]:(f.def!=null?f.def:""); if(v!==""&&String(v).trim()!=="") done++; }
      else if(f.tipo==="ia"){ total++; if(state[f.id]&&String(state[f.id]).trim()) done++; }
      else if(f.tipo==="tablaIA"){ (f.tablas||[]).forEach(t=>{ total++; const r=state.tablas&&state.tablas[t.key]; if(Array.isArray(r)&&r.length) done++; }); }
      else if(f.tipo==="sustancias"){ Object.keys(D.SUSTANCIAS).forEach(name=>{ total++; const s=state.sustancias&&state.sustancias[name]; if(s&&String(s.cap||"").trim()&&String(s.prov||"").trim()) done++; }); }
      else if(f.tipo==="susDinamica"){ total++; const arr=state[f.id]; if(Array.isArray(arr)&&arr.some(r=>String(r.prod||"").trim())) done++; }
    }));
    const pct=total?Math.round(done/total*100):0;
    const bar=$("#progBar"); if(bar) bar.style.width=pct+"%";
    const txt=$("#progText"); if(txt) txt.textContent=`${done}/${total} campos completados`;
  }

  function setupScrollSpy(){
    const links=[...document.querySelectorAll("nav.toc a")];
    const mainEl=document.querySelector("main");
    const ps=document.getElementById("progSection");
    const obs=new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){
        const id=e.target.id.replace("sec-","");
        links.forEach(l=>l.classList.toggle("active", l.dataset.sec===id));
        if(ps){ const lk=links.find(l=>l.dataset.sec===id);
          const txt=lk?lk.textContent.trim().replace(/^\S+\s*/,"").slice(0,36):"";
          ps.textContent=txt; ps.classList.toggle("visible",!!txt); }
      } });
    },{root:mainEl, rootMargin:"-8% 0px -78% 0px"});
    document.querySelectorAll("section.card").forEach(s=>obs.observe(s));
  }

  // ============== MOTOR DE ENSAMBLADO (bloques + 2 vistas) ==============
  let vistaModo = "borrador";  // "borrador" | "final"
  function interp(tpl, map){ return tpl.replace(/\{\{(\w+)\}\}/g, (m,k)=> (map[k]!=null&&map[k]!=="")? map[k] : "["+k+"]"); }
  function fmtMoney(v){ if(!v) return "[ ]"; const n=Number(v); return isNaN(n)?esc(v):n.toLocaleString("es-MX",{minimumFractionDigits:2}); }

  function vars(){
    return {
      proyecto: g("proyecto","[Nombre del proyecto]"),
      municipio: g("municipio","[municipio]"),
      estado: g("estado","[estado]"),
      uab: g("uab"), clavePolitica:g("clavePolitica"), ordRegional:g("ordRegional"),
      regionEco:g("regionEco"), regionEcoNombre:g("regionEcoNombre"),
      ubicacion: [g("calle"),g("colonia"),g("municipio"),g("estado"),g("cp")?"C.P. "+g("cp"):""].filter(Boolean).join(", ") || "[ubicación del proyecto]"
    };
  }

  function makeCtx(){ return { g, v:vars(), interp, money:fmtMoney, state, D, figsByArea:numerarFiguras() }; }
  function buildBlocks(){ return window.IPDOC.build(makeCtx()); }

  // Cuenta áreas pendientes (instrucciones + tablas por llenar + figuras sin imagen)
  function contarPendientes(blocks){
    return blocks.filter(b => (b.t==="p" && b.k==="instr") || (b.t==="table" && b.k==="scaffold") || (b.t==="fig" && !imgCache[b.id])).length;
  }

  // Lista de figuras (con su capítulo) derivada del propio documento.
  function figList(){
    const blocks=buildBlocks(); const out=[]; let chap="General";
    for(const b of blocks){
      if(b.t==="h" && b.n===1) chap=b.x;
      else if(b.t==="fig") out.push({ id:b.id, caption:b.caption, chap });
    }
    return out;
  }
  function contarNuevos(blocks){
    return blocks.filter(b => (b.t==="p" && b.k==="auto") || (b.t==="table" && b.k==="auto")).length;
  }

  // Render de un párrafo multi-línea
  function paras(t){ return String(t).split(/\n+/).filter(s=>s.trim()).map(s=>`<p>${esc(s)}</p>`).join(""); }

  // Render de tabla
  function renderTabla(b, modo){
    const scaffold = b.k==="scaffold";
    const auto = b.k==="auto";
    const cls = scaffold ? "tbl-scaffold" : (auto && modo==="borrador" ? "tbl-new" : "");
    let h = "";
    if(b.title) h += `<p class="tbl-title ${ (auto&&modo==='borrador')?'hl-new':'' } ${scaffold?'hl-instr-inline':''}"><b>${esc(b.title)}</b>${scaffold?' <span class="pend-tag">⛏ Pendiente por llenar</span>':''}</p>`;
    h += `<table class="${cls}">`;
    if(b.head) h += `<tr>${b.head.map(c=>`<th>${esc(c)}</th>`).join("")}</tr>`;
    (b.rows||[]).forEach(r=>{
      // fila de subtítulo (1 sola celda con texto y demás vacías) → resáltala como banda
      const isBand = Array.isArray(r) && r.length>1 && r[0] && r.slice(1).every(c=>c==="");
      if(isBand){ h += `<tr><td colspan="${b.head?b.head.length:r.length}" class="band">${esc(r[0])}</td></tr>`; }
      else { h += `<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`; }
    });
    h += `</table>`;
    return h;
  }

  // Render principal: bloques -> HTML, aplicando resaltado según el modo
  function renderBlocks(blocks, modo){
    let h = "";
    for(const b of blocks){
      switch(b.t){
        case "cover":
          h += `<div class="cover-page"><h1 class="cover">INFORME PREVENTIVO</h1>
            <div class="cover-sub">Formato para Sector Hidrocarburos – ASEA</div>
            <div class="cover-box"><div>Proyecto</div>
            <div class="proj ${modo==='borrador'?'hl-new':''}">${esc(b.proyecto)}</div>
            <div class="${modo==='borrador'?'hl-new':''}">${esc(b.empresa)}</div>
            <div style="margin-top:10px;color:#777">${esc(b.fecha)}</div></div></div>`;
          break;
        case "toc":
          h += b.items.map(it=>`<div class="toc-line"><span>${esc(it)}</span><span>#</span></div>`).join("");
          break;
        case "h":
          if(b.n===1) h += `<h2 class="chap">${esc(b.x)}</h2>`;
          else h += `<h${b.n}>${esc(b.x)}</h${b.n}>`;
          break;
        case "p":
          if(b.instr || b.pend){
            h += `<div class="instr">✎ <b>${b.pend?'Pendiente: ':''}</b>${esc(b.x)}</div>`;
          } else if(b.k==="auto"){
            h += modo==="borrador" ? `<div class="hl-new">${paras(b.x)}</div>` : paras(b.x);
          } else {
            h += paras(b.x);
          }
          break;
        case "table":
          h += renderTabla(b, modo);
          break;
        case "fig": {
          const src = imgCache[b.id];
          if(src) h += `<figure class="figimg"><img src="${src}" alt="${esc(b.caption)}"><figcaption>${esc(b.caption)}</figcaption></figure>`;
          else h += `<div class="figbox"><div class="figicon">🖼️</div><div class="figcap">${esc(b.caption)} <span class="pend-tag">— imagen pendiente</span></div></div>`;
          break;
        }
        case "firma":
          h += `<div class="firma"><div>Por el promovente<br>${esc(b.promovente)}<br>Fecha: ________</div>
                <div>Por el responsable técnico<br>${esc(b.tecnico)}<br>Fecha: ________</div></div>`;
          break;
        case "refs":
          h += `<ul class="refs ${modo==='borrador'?'hl-new':''}">`+b.items.map(r=>`<li>${esc(r)}</li>`).join("")+`</ul>`;
          break;
        case "sp": h += `<div style="height:8px"></div>`; break;
      }
    }
    return h;
  }

  // ============== VISTA PREVIA / EXPORTACIÓN ==============
  // Renderiza el documento en el panel derecho (vista en vivo). No oculta el editor.
  function renderLiveDoc(){
    const doc = $("#doc"); if(!doc) return;
    const blocks = buildBlocks();
    doc.innerHTML = renderBlocks(blocks, vistaModo);
    doc.className = "doc " + (vistaModo==="borrador" ? "modo-borrador" : "modo-final");
    const np = contarPendientes(blocks), nn = contarNuevos(blocks);
    const info = $("#prevInfo");
    if(info) info.textContent = (vistaModo==="borrador"
        ? `Borrador · ${nn} bloques nuevos · ${np} áreas pendientes`
        : `Documento limpio · ${np} áreas pendientes`);
    document.querySelectorAll(".seg-btn").forEach(x=>x.classList.toggle("active", x.dataset.modo===vistaModo));
  }
  function mostrarVista(modo){ if(modo) vistaModo = modo; renderLiveDoc(); }
  function toggleFocus(){ document.body.classList.toggle("focus-doc"); }
  function volver(){ document.body.classList.remove("focus-doc"); }

  function wordStyles(){
    return `<style>
      @page{size:A4;margin:2.2cm}
      body{font-family:"Times New Roman",serif;font-size:11pt;line-height:1.45;color:#000}
      h1.cover{font-size:30pt;text-align:center;letter-spacing:8pt;color:#0e3b29;margin-top:60pt}
      .cover-sub{text-align:center;color:#555;font-size:13pt}
      .cover-box{border:2pt solid #0e3b29;padding:18pt;text-align:center;margin:24pt 0}
      .cover-box .proj{font-size:18pt;font-weight:bold}
      h2{font-size:15pt;color:#0e3b29;border-bottom:1.5pt solid #0e3b29;page-break-after:avoid;margin-top:18pt}
      h2.chap{font-size:17pt;page-break-before:always}
      h3{font-size:13pt;color:#17533a;page-break-after:avoid}
      h4{font-size:12pt;color:#333;page-break-after:avoid}
      p{text-align:justify;margin:6pt 0}
      table{border-collapse:collapse;width:100%;margin:8pt 0}
      th,td{border:0.75pt solid #666;padding:3pt 5pt;font-size:9.5pt;vertical-align:top}
      th{background:#eef3f0}
      td.band{background:#d7e8dc;font-weight:bold}
      .toc-line{font-size:10.5pt;border-bottom:1px dotted #aaa}
      .instr{background:#FFE8A3;border-left:3pt solid #b8860b;padding:4pt 8pt;font-style:italic;font-size:9.5pt;color:#5b4600;margin:5pt 0}
      .hl-new{background:#FFF59D}
      .hl-new p{background:#FFF59D}
      .tbl-new th,.tbl-new td{background:#FFFDE7}
      .tbl-new th{background:#FFF1A8}
      .tbl-scaffold th,.tbl-scaffold td{border:0.75pt dashed #b8860b}
      .pend-tag{color:#b8860b;font-style:italic;font-weight:normal;font-size:8.5pt}
      .figbox{border:1.5pt dashed #b8860b;background:#FFF8E1;text-align:center;padding:22pt 10pt;margin:8pt 0}
      .figicon{font-size:26pt;color:#b8860b}
      .figcap{font-size:9.5pt;color:#5b4600;font-style:italic;margin-top:4pt}
      .figimg{text-align:center;margin:10pt 0}
      .figimg img{max-width:100%;border:0.5pt solid #999}
      .figimg figcaption{font-size:9.5pt;color:#333;font-style:italic;margin-top:4pt}
      .firma{margin-top:30pt}.firma div{display:inline-block;width:45%;border-top:1px solid #000;text-align:center;margin:0 2%;font-size:10pt}
      ul.refs li{font-size:9pt;margin:2pt 0}
    </style>`;
  }

  function exportWord(modo){
    modo = modo || vistaModo;
    const blocks = buildBlocks();
    const contenido = renderBlocks(blocks, modo);
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">${wordStyles()}</head><body>${contenido}</body></html>`;
    const blob = new Blob(['﻿', html], {type:"application/msword"});
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a");
    const nombre = (g("proyecto","Informe_Preventivo")||"Informe_Preventivo").replace(/[^\wÀ-ſ]+/g,"_");
    const suf = modo==="borrador" ? "BORRADOR" : "LIMPIO";
    a.href=url; a.download=`IP_${nombre}_${suf}.doc`; a.click();
    URL.revokeObjectURL(url);
    toast(`Word (${suf}) generado ✓`);
  }

  function guardarJSON(){
    // Incluye las imágenes para que el proyecto sea portable (puede pesar).
    const payload=Object.assign({}, state, { __images: imgCache });
    const blob=new Blob([JSON.stringify(payload)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a");
    const nombre=(g("proyecto","proyecto")||"proyecto").replace(/[^\w]+/g,"_");
    a.href=url; a.download=`IP_datos_${nombre}.json`; a.click(); URL.revokeObjectURL(url);
    const n=Object.keys(imgCache).length;
    toast("Respuestas guardadas ✓" + (n?` (incluye ${n} imágenes)`:""));
  }
  function cargarJSON(file){
    const r=new FileReader();
    r.onload=async ()=>{ try{
      const obj=JSON.parse(r.result);
      const imgs=obj.__images||{}; delete obj.__images;
      state=obj; normalize(); save();
      imgCache=imgs;
      try{ for(const id in imgs){ await idbPut(id, imgs[id]); } }catch(e){}
      renderForm(); toast("Respuestas cargadas ✓");
    }catch(e){ toast("Archivo inválido"); } };
    r.readAsText(file);
  }

  function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200); }

  // ============== MODALES ==============
  function openModal(id, populate){
    const m=$(id); if(!m) return;
    if(populate) populate();
    m.classList.add("open");
    document.body.style.overflow="hidden";
  }
  function closeModal(id){
    const m=$(id); if(!m) return;
    m.classList.remove("open");
    document.body.style.overflow="";
  }

  // ============== ÍNDICE DEL DOCUMENTO (panel derecho) ==============
  function renderDocToc(){
    const panel=$("#docTocPanel"); if(!panel) return;
    const doc=$("#doc"); if(!doc){ panel.innerHTML=""; return; }
    const nodes=[...doc.querySelectorAll("h2,h3")];
    if(!nodes.length){ panel.innerHTML='<div style="padding:10px 16px;font-size:12px;color:#888">Sin secciones aún</div>'; return; }
    let h='<div class="dtoc-hdr">Índice del documento</div>';
    nodes.forEach((n,i)=>{
      const l3=n.tagName==="H3";
      h+=`<a class="${l3?"l3":""}" data-di="${i}">${esc(n.textContent.trim().slice(0,58))}</a>`;
    });
    panel.innerHTML=h;
    panel.querySelectorAll("a[data-di]").forEach((a,i)=>{
      a.onclick=()=>{ nodes[i].scrollIntoView({behavior:"smooth",block:"start"}); toggleDocToc(false); };
    });
  }
  function toggleDocToc(force){
    const p=$("#docTocPanel"); if(!p) return;
    const open=typeof force==="boolean"?force:!p.classList.contains("open");
    p.classList.toggle("open",open);
    if(open) renderDocToc();
  }

  // ============== INIT ==============
  // ===== GESTIÓN DE PROYECTOS (localStorage multi-proyecto) =====
  const PROJECT_INDEX="vr_ip_idx";
  let currentProjectId=null;
  function pKey(id){ return "vr_ip_p_"+id; }
  function loadIdx(){ try{ return JSON.parse(localStorage.getItem(PROJECT_INDEX))||[]; }catch(e){ return []; } }
  function saveIdx(idx){ localStorage.setItem(PROJECT_INDEX,JSON.stringify(idx)); }
  function fmtDate(){ return new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}); }

  function saveCurrentProject(){
    if(!currentProjectId) return;
    localStorage.setItem(pKey(currentProjectId),JSON.stringify(state));
    const idx=loadIdx(), proj=idx.find(p=>p.id===currentProjectId);
    if(proj){ proj.name=g("proyecto","Sin nombre")||"Sin nombre"; proj.municipio=g("municipio",""); proj.estado=g("estado",""); proj.mod=fmtDate(); saveIdx(idx); }
  }

  function openProject(id){
    try{ const raw=localStorage.getItem(pKey(id)); state=raw?JSON.parse(raw):{}; }catch(e){ state={}; }
    normalize(); currentProjectId=id; hideHome();
    renderForm(); renderLiveDoc(); updateProgress();
  }

  function newProject(){
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
    const idx=loadIdx();
    idx.unshift({id,name:"Nuevo IP",municipio:"",estado:"",mod:fmtDate()});
    saveIdx(idx); state={}; normalize(); currentProjectId=id;
    localStorage.setItem(pKey(id),JSON.stringify(state));
    hideHome(); renderForm(); renderLiveDoc(); updateProgress();
  }

  function deleteProject(id){
    if(!confirm("¿Eliminar este proyecto?\nEsta acción no se puede deshacer.")) return;
    saveIdx(loadIdx().filter(p=>p.id!==id));
    localStorage.removeItem(pKey(id));
    renderHome();
  }

  function showHome(){ const hv=document.getElementById("homeView"); if(hv) hv.classList.add("visible"); renderHome(); }
  function hideHome(){ const hv=document.getElementById("homeView"); if(hv) hv.classList.remove("visible"); }

  function renderHome(){
    const grid=document.getElementById("homeGrid"); if(!grid) return;
    const idx=loadIdx();
    const fileIco=`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    let h=`<div class="ip-card new" id="btnNewProject">
      <div class="new-plus"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
      <div class="new-lbl">Nuevo Informe</div>
    </div>`;
    idx.forEach(p=>{
      h+=`<div class="ip-card" data-pid="${esc(p.id)}">
        <div class="ipc-ico">${fileIco}</div>
        <div class="ipc-name">${esc(p.name||"Sin nombre")}</div>
        <div class="ipc-meta">${esc([p.municipio,p.estado].filter(Boolean).join(", ")||"—")}</div>
        <div class="ipc-date">Mod: ${esc(p.mod||"—")}</div>
        <button class="ipc-del" data-del="${esc(p.id)}" title="Eliminar"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>`;
    });
    if(!idx.length) h+=`<div class="home-empty">Sin proyectos. Crea tu primer IP con el botón "+".</div>`;
    grid.innerHTML=h;
    const nb=document.getElementById("btnNewProject"); if(nb) nb.onclick=newProject;
    grid.querySelectorAll(".ip-card[data-pid]").forEach(c=>c.onclick=(e)=>{ if(e.target.closest("[data-del]")) return; openProject(c.dataset.pid); });
    grid.querySelectorAll("[data-del]").forEach(b=>b.onclick=(e)=>{ e.stopPropagation(); deleteProject(b.dataset.del); });
  }

  function migrateOldData(){
    if(loadIdx().length>0) return;
    try{ const raw=localStorage.getItem(STORE); if(!raw) return;
      const data=JSON.parse(raw);
      const id="legacy_"+Date.now().toString(36);
      saveIdx([{id,name:data.proyecto||"IP importado",municipio:data.municipio||"",estado:data.estado||"",mod:fmtDate()}]);
      localStorage.setItem(pKey(id),raw);
    }catch(e){}
  }
  // ===== FIN GESTIÓN DE PROYECTOS =====

  function init(){
    normalize();
    renderForm();
    renderLiveDoc();
    // Carga el bucket de imágenes (async) y refresca cuando esté listo
    idbAll().then(m=>{ imgCache=m; renderForm(); renderLiveDoc(); updateProgress(); });
    const bind=(id,fn)=>{ const el=$(id); if(el) el.onclick=fn; };
    bind("#btnVista", toggleFocus);
    bind("#btnVista2", toggleFocus);
    bind("#btnVolver", volver);
    bind("#btnWord", ()=>exportWord("borrador"));
    bind("#btnWordBorrador", ()=>exportWord("borrador"));
    bind("#btnWordLimpio", ()=>exportWord("final"));
    bind("#btnGuardar", guardarJSON);
    bind("#btnCargar", ()=>$("#fileInput").click());
    const fi=$("#fileInput"); if(fi) fi.onchange=(e)=>{ if(e.target.files[0]) cargarJSON(e.target.files[0]); };
    document.querySelectorAll(".seg-btn").forEach(x=>x.onclick=()=>mostrarVista(x.dataset.modo));

    // TOC sidebar links
    document.querySelectorAll('nav.toc a').forEach(a=>a.addEventListener("click",e=>{
      e.preventDefault();
      const t=document.querySelector(a.getAttribute("href")); if(t) t.scrollIntoView({behavior:"smooth"});
    }));

    // Índice del documento
    bind("#btnDocToc", ()=>toggleDocToc());
    document.addEventListener("click", e=>{ if(!e.target.closest("#docTocPanel")&&!e.target.closest("#btnDocToc")) toggleDocToc(false); });

    // Home button
    bind("#btnHome", showHome);

    // Icon buttons → modales
    bind("#btnGuia", ()=>openModal("#modalGuia", ()=>{
      const b=$("#modalGuiaBody"); if(b) b.innerHTML=D.GUIA_HTML||"<p>Sin contenido.</p>";
    }));
    bind("#btnAnexosRef", ()=>openModal("#modalAnexos", ()=>{
      const b=$("#modalAnexosBody"); if(b){ b.innerHTML=renderAnexos(); bindAnexos(); }
    }));

    // Cerrar modales
    document.querySelectorAll(".modal-close[data-close]").forEach(btn=>btn.onclick=()=>closeModal("#"+btn.dataset.close));
    document.querySelectorAll(".modal-overlay").forEach(m=>m.onclick=(e)=>{ if(e.target===m) closeModal("#"+m.id); });

    // Proyectos: migrar datos previos y mostrar home
    migrateOldData();
    showHome();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
