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
  }
  function save(){ localStorage.setItem(STORE, JSON.stringify(state)); updateProgress(); }
  function g(id, def=""){ return state[id]!=null && state[id]!=="" ? state[id] : def; }

  // ---- Definición del cuestionario (secciones = capítulos del IP) ----
  // tipos: text, num, money, date, select, textarea, open(boiler/abierta info)
  const SECTIONS = [
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
      {id:"estrategias", l:"Vinculación con las 44 estrategias del POEGT", tipo:"estrategias", b:"boiler"}
    ]},

    { id:"II3", grp:"II. Fundamento jurídico", titulo:"II.2.4 / II.3 Plan municipal y parque industrial", desc:"", fields:[
      {id:"ugaEstatal", l:"Clave UGA estatal", tipo:"text", b:"cerrada"},
      {id:"municipioPlan", l:"Municipio del Plan Municipal", tipo:"text", b:"cerrada", hint:"si difiere"},
      {id:"parqueInd", l:"¿El proyecto está en un parque industrial evaluado por la Secretaría?", tipo:"select", opts:["No (predio independiente)","Sí"], b:"boiler"}
    ]},

    { id:"III1", grp:"III. Aspectos técnicos", titulo:"III.1 Datos generales del proyecto", desc:"Datos administrativos cerrados.", fields:[
      {id:"claveCatastral", l:"Clave catastral", tipo:"text", b:"cerrada"},
      {id:"respObra", l:"Responsable de la obra", tipo:"text", b:"cerrada"},
      {id:"permisoCRE", l:"Permiso de la CRE", tipo:"text", b:"cerrada"},
      {id:"regASEA", l:"No. de Registro ASEA", tipo:"text", b:"cerrada"},
      {id:"usoSuelo", l:"Uso de suelo del sitio", tipo:"select", opts:["Urbano","Suburbano","Industrial","Agrícola","Erial"], b:"cerrada"},
      {id:"III1abierta", l:"III.1.2–III.1.7 Descripción técnica, dimensiones, programa de trabajo", tipo:"open",
        nota:"Sección ABIERTA: requiere memoria técnica, planos, diagrama de Gantt y detalles de tanques/tuberías/maquinaria. Se conserva la guía ✎ del formato.", b:"abierta"}
    ]},

    { id:"III2", grp:"III. Aspectos técnicos", titulo:"III.2 Sustancias peligrosas", desc:"CRETIB y CAS pre-cargados. Sólo ajusta capacidad y proveedor.", fields:[
      {id:"sustancias", l:"Sustancias en tanque de almacenamiento", tipo:"sustancias", b:"cerrada"}
    ]},

    { id:"III3", grp:"III. Aspectos técnicos", titulo:"III.3 Emisiones, descargas y residuos", desc:"", fields:[
      {id:"III3abierta", l:"Emisiones atmosféricas, descargas, residuos (RSU/RME/RP/RCD), ruido y diagrama de flujos", tipo:"open",
        nota:"Sección ABIERTA: especificar por etapa (preparación, construcción, operación, abandono) con medidas de control. Guía ✎ conservada.", b:"abierta"}
    ]},

    { id:"III4", grp:"III. Aspectos técnicos", titulo:"III.4 Diagnóstico ambiental", desc:"El Modelo Ecológico Conceptual (MEC) se incluye automáticamente.", fields:[
      {id:"incluirMEC", l:"Incluir texto de principios del MEC (boilerplate)", tipo:"check", b:"boiler", def:true},
      {id:"III4abierta", l:"Clima, geología, edafología, hidrología, flora/fauna, medio socioeconómico, diagnóstico", tipo:"open",
        nota:"Sección ABIERTA: requiere mapas, cartas, listados de flora/fauna (NOM-059) y datos INEGI/CONAGUA. Guía ✎ conservada.", b:"abierta"}
    ]},

    { id:"III5", grp:"III. Aspectos técnicos", titulo:"III.5 Identificación de impactos", desc:"La metodología (Leopold + Gómez-Orea + índices) y las escalas se incluyen automáticamente.", fields:[
      {id:"incluirMetodo", l:"Incluir metodología y tablas de criterios/escalas (boilerplate)", tipo:"check", b:"boiler", def:true},
      {id:"III5abierta", l:"Matriz de Leopold, evaluación de índices, descripción de impactos y balance", tipo:"open",
        nota:"Sección ABIERTA: requiere construir la matriz de Leopold y la matriz de resultados con los cálculos del proyecto. Guía ✎ conservada.", b:"abierta"}
    ]},

    { id:"III6", grp:"III. Aspectos técnicos", titulo:"III.6 / III.7 Medidas y sustentabilidad", desc:"", fields:[
      {id:"III6abierta", l:"Medidas de prevención/mitigación por etapa y condiciones adicionales", tipo:"open",
        nota:"Sección ABIERTA: tablas de medidas por etapa (preparación, operación, abandono) + Programa de Vigilancia Ambiental. Guía ✎ conservada.", b:"abierta"}
    ]},

    { id:"IV", grp:"IV. Abandono", titulo:"IV. Abandono del sitio", desc:"Párrafos plantilla con variables. Se redactan solos.", fields:[
      {id:"ivComponentes", l:"Componentes que se intervendrán", tipo:"text", b:"cerrada", def:"tanques, líneas, dispensarios, trampas y drenajes"},
      {id:"incluirAbandono", l:"Incluir párrafos boilerplate de cierre (IV.1–IV.8)", tipo:"check", b:"boiler", def:true}
    ]},

    { id:"V", grp:"V. Conclusión", titulo:"V. Conclusión", desc:"Texto fijo (no requiere modificación salvo indicación de ASEA).", fields:[
      {id:"incluirConclusion", l:"Incluir conclusión estándar", tipo:"check", b:"boiler", def:true}
    ]}
  ];

  // Lista de campos cerrados/boiler que cuentan para el progreso
  const REQUERIDOS = ["proyecto","empresa","calle","colonia","municipio","estado","cp","superficie","inversion","empleosDir","rfcEmpresa","repLegal","claveCatastral","permisoCRE","regASEA","uab"];

  // ============== RENDER DEL FORMULARIO ==============
  function badge(b){
    const m={cerrada:["cerrada","Cerrada"],boiler:["boiler","Redactada-cerrada"],abierta:["abierta","Abierta ✎"]};
    const x=m[b]||m.cerrada; return `<span class="badge ${x[0]}">${x[1]}</span>`;
  }

  function renderForm(){
    const toc=$("#toc"); const form=$("#form");
    let tocHtml="", lastGrp="";
    let formHtml="";
    SECTIONS.forEach(sec=>{
      if(sec.grp!==lastGrp){ tocHtml+=`<div class="grp">${esc(sec.grp)}</div>`; lastGrp=sec.grp; }
      tocHtml+=`<a href="#sec-${sec.id}" data-sec="${sec.id}">${esc(sec.titulo)}</a>`;
      formHtml+=`<section class="card" id="sec-${sec.id}"><h2>${esc(sec.titulo)}</h2>`;
      if(sec.desc) formHtml+=`<div class="desc">${esc(sec.desc)}</div>`;
      sec.fields.forEach(f=>{ formHtml+=renderField(f); });
      formHtml+=`</section>`;
    });
    toc.innerHTML=tocHtml; form.innerHTML=formHtml;
    bindInputs();
    setupScrollSpy();
    updateProgress();
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
      case "estrategias": return renderEstrategias(f);
      case "instrumentos": return renderInstrumentos(f);
      case "open": return `<div class="field"><label>${esc(f.l)} ${badge(f.b)}</label><div class="open-note"><b>⚠ Pendiente manual.</b> ${esc(f.nota)}</div><textarea data-f="${f.id}" placeholder="(Opcional) Notas o texto para esta sección...">${esc(val)}</textarea></div>`;
    }
    let prev="";
    if(f.b==="boiler" && BOILER_PREVIEW[f.id]) prev=`<details class="boiler-prev"><summary>Ver texto que se generará</summary><div class="body" data-prev="${f.id}">${esc(BOILER_PREVIEW[f.id]())}</div></details>`;
    return `<div class="field"><label>${esc(f.l)} ${badge(f.b)}${f.hint?` <span class="hint">— ${esc(f.hint)}</span>`:''}</label>${inner}${prev}</div>`;
  }

  function renderPuntos(f){
    const pts = state.puntos || [{x:"",y:""},{x:"",y:""},{x:"",y:""},{x:"",y:""}];
    state.puntos = pts;
    let rows = pts.map((p,i)=>`<tr><td style="padding:3px">${i+1}</td><td><input data-pt="${i}" data-c="x" value="${esc(p.x)}" style="width:100%"></td><td><input data-pt="${i}" data-c="y" value="${esc(p.y)}" style="width:100%"></td></tr>`).join("");
    return `<div class="field"><label>${esc(f.l)} ${badge(f.b)}</label>
      <table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="text-align:left;padding:3px">Punto</th><th style="text-align:left">X (Este)</th><th style="text-align:left">Y (Norte)</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderSustancias(f){
    let rows = Object.keys(D.SUSTANCIAS).map(name=>{
      const c = D.SUSTANCIAS[name]; const s = state.sustancias[name] || {cap:"",prov:""};
      return `<tr><td><b>${esc(name)}</b></td><td>${esc(c.estado)}</td><td>${esc(c.cretib)}</td><td>${esc(c.cas)}</td>
        <td><input data-sus="${esc(name)}" data-k="cap" value="${esc(s.cap)}" placeholder="m³" style="width:80px"></td>
        <td><input data-sus="${esc(name)}" data-k="prov" value="${esc(s.prov)}" style="width:120px"></td></tr>`;
    }).join("");
    return `<div class="field"><label>${esc(f.l)} ${badge(f.b)}</label>
      <table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th>Producto</th><th>Estado</th><th>CRETIB</th><th>CAS</th><th>Capacidad</th><th>Proveedor</th></tr></thead><tbody>${rows}</tbody></table></div>`;
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
    const done = REQUERIDOS.filter(id=>state[id]&&String(state[id]).trim()!=="").length;
    const pct = Math.round(done/REQUERIDOS.length*100);
    const bar=$("#progBar"); if(bar) bar.style.width=pct+"%";
  }

  function setupScrollSpy(){
    const links=[...document.querySelectorAll("nav.toc a")];
    const obs=new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){ const id=e.target.id.replace("sec-","");
        links.forEach(l=>l.classList.toggle("active", l.dataset.sec===id)); } });
    },{rootMargin:"-40% 0px -55% 0px"});
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

  function makeCtx(){ return { g, v:vars(), interp, money:fmtMoney, state, D }; }
  function buildBlocks(){ return window.IPDOC.build(makeCtx()); }

  // Cuenta áreas pendientes (instrucciones + tablas por llenar)
  function contarPendientes(blocks){
    return blocks.filter(b => (b.t==="p" && b.k==="instr") || (b.t==="table" && b.k==="scaffold") || b.t==="fig").length;
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
        case "fig":
          h += `<div class="figbox"><div class="figicon">🖼️</div><div class="figcap">${esc(b.caption)} <span class="pend-tag">— imagen pendiente</span></div></div>`;
          break;
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
  function mostrarVista(modo){
    if(modo) vistaModo = modo;
    const blocks = buildBlocks();
    $("#doc").innerHTML = renderBlocks(blocks, vistaModo);
    $("#doc").className = "doc " + (vistaModo==="borrador" ? "modo-borrador" : "modo-final");
    // actualizar toggles y contador
    const np = contarPendientes(blocks), nn = contarNuevos(blocks);
    const info = $("#prevInfo");
    if(info) info.textContent = (vistaModo==="borrador"
        ? `Borrador · ${nn} bloques nuevos resaltados · ${np} áreas pendientes`
        : `Documento limpio · ${np} áreas pendientes resaltadas`);
    document.querySelectorAll(".seg-btn").forEach(x=>x.classList.toggle("active", x.dataset.modo===vistaModo));
    $("#formWrap").style.display="none";
    $("#previewWrap").style.display="block";
    window.scrollTo(0,0);
  }
  function volver(){ $("#previewWrap").style.display="none"; $("#formWrap").style.display="grid"; }

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
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a");
    const nombre=(g("proyecto","proyecto")||"proyecto").replace(/[^\w]+/g,"_");
    a.href=url; a.download=`IP_datos_${nombre}.json`; a.click(); URL.revokeObjectURL(url);
    toast("Respuestas guardadas ✓");
  }
  function cargarJSON(file){
    const r=new FileReader();
    r.onload=()=>{ try{ state=JSON.parse(r.result); normalize(); save(); renderForm(); toast("Respuestas cargadas ✓"); }catch(e){ toast("Archivo inválido"); } };
    r.readAsText(file);
  }

  function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200); }

  // ============== INIT ==============
  function init(){
    normalize();
    renderForm();
    $("#btnVista").onclick=()=>mostrarVista("borrador");
    $("#btnVista2").onclick=()=>mostrarVista("borrador");
    $("#btnVolver").onclick=volver;
    $("#btnWord").onclick=()=>exportWord("borrador");
    $("#btnWordBorrador").onclick=()=>exportWord("borrador");
    $("#btnWordLimpio").onclick=()=>exportWord("final");
    $("#btnGuardar").onclick=guardarJSON;
    $("#btnCargar").onclick=()=>$("#fileInput").click();
    $("#fileInput").onchange=(e)=>{ if(e.target.files[0]) cargarJSON(e.target.files[0]); };
    document.querySelectorAll(".seg-btn").forEach(x=>x.onclick=()=>mostrarVista(x.dataset.modo));
    document.querySelectorAll('nav.toc a').forEach(a=>a.addEventListener("click",e=>{
      e.preventDefault(); document.querySelector(a.getAttribute("href")).scrollIntoView({behavior:"smooth"});
    }));
  }
  document.addEventListener("DOMContentLoaded", init);
})();
