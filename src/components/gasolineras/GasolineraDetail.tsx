import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Container, Droplets, Activity, Plus,
  ShieldCheck, FileText, AlertTriangle, ChevronRight,
  MapPin, X, CheckCircle2, Clock, ExternalLink,
} from 'lucide-react';
import { Gasolinera, Tanque, PozoMonitoreo, Tramite, TipoProyecto } from '../../types';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { resolverReportesAplicables, etiquetaReporte } from '../../services/reportResolver';
import { COLORES_REPORTE } from '../../constants/plantillas';

enum OperationType { GET = 'get', WRITE = 'write' }

function handleFirestoreError(error: unknown, op: OperationType, path: string | null) {
  console.error('Firestore Error:', { error: error instanceof Error ? error.message : String(error), op, path });
}

interface Props {
  gasId: string;
  gasolinera?: Gasolinera;
  onBack: () => void;
}

const TIPOS_PROYECTO: { value: TipoProyecto; label: string }[] = [
  { value: 'gasolinera_petroliferos', label: 'Gasolinera (Diésel / Gasolina)' },
  { value: 'gas_lp_carburacion',      label: 'Estación de Gas LP — Carburación' },
  { value: 'gas_lp_publico',          label: 'Estación de Gas LP — Expendio Público' },
  { value: 'autoconsumo',             label: 'Autoconsumo' },
];

export default function GasolineraDetail({ gasId, gasolinera: initialGas, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'infra' | 'env' | 'docs'>('infra');
  const [tanques, setTanques] = useState<Tanque[]>([]);
  const [pozos, setPozos]   = useState<PozoMonitoreo[]>([]);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [showAddTanque, setShowAddTanque] = useState(false);
  const [showAddPozo, setShowAddPozo]   = useState(false);
  const isNew = gasId === 'new';

  // Form state for new gasolinera
  const [form, setForm] = useState<Partial<Gasolinera>>({
    razon_social: '', rfc: '', municipio: '', estado: '',
    lat: 19.4326, lng: -99.1332, creador_id: auth.currentUser?.uid || '',
    tipo_proyecto: 'gasolinera_petroliferos',
    esta_en_anp: false, esta_en_ramsar: false, requiere_remocion_vegetacion: false,
  });
  const setF = (k: keyof Gasolinera, v: any) => setForm(p => ({ ...p, [k]: v }));

  const [newTanque, setNewTanque] = useState<Partial<Tanque>>({
    producto: 'magna', capacidad_l: 40000, tipo_pared: 'doble_pared',
    material: 'acero', anio_instalacion: new Date().getFullYear(),
    estado_operativo: 'activo', sistema_deteccion_fugas: true,
  });
  const [newPozo, setNewPozo] = useState<Partial<PozoMonitoreo>>({
    profundidad_m: 15, presencia_hidrocarburos: false, lat: 0, lng: 0,
  });

  useEffect(() => {
    if (isNew) return;
    const unsubs = [
      onSnapshot(collection(db, `gasolineras/${gasId}/tanques`),
        s => setTanques(s.docs.map(d => ({ id: d.id, ...d.data() } as Tanque))),
        e => handleFirestoreError(e, OperationType.GET, `gasolineras/${gasId}/tanques`)),
      onSnapshot(collection(db, `gasolineras/${gasId}/pozos`),
        s => setPozos(s.docs.map(d => ({ id: d.id, ...d.data() } as PozoMonitoreo))),
        e => handleFirestoreError(e, OperationType.GET, `gasolineras/${gasId}/pozos`)),
      onSnapshot(collection(db, `gasolineras/${gasId}/tramites`),
        s => setTramites(s.docs.map(d => ({ id: d.id, ...d.data() } as Tramite))),
        e => handleFirestoreError(e, OperationType.GET, `gasolineras/${gasId}/tramites`)),
    ];
    return () => unsubs.forEach(u => u());
  }, [gasId, isNew]);

  const handleCreate = async () => {
    if (!form.razon_social || !form.rfc) return;
    const id = form.rfc!.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).slice(2, 7);
    const reportes = resolverReportesAplicables(form as Gasolinera);
    const data = { ...form, id, creador_id: auth.currentUser?.uid, reportes_aplicables: reportes } as Gasolinera;
    try {
      await setDoc(doc(db, 'gasolineras', id), data);
      onBack();
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'gasolineras'); }
  };

  const handleAddTanque = async () => {
    try {
      await addDoc(collection(db, `gasolineras/${gasId}/tanques`), { ...newTanque, id_gasolinera: gasId });
      setShowAddTanque(false);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, `gasolineras/${gasId}/tanques`); }
  };

  const handleAddPozo = async () => {
    try {
      await addDoc(collection(db, `gasolineras/${gasId}/pozos`), { ...newPozo, id_gasolinera: gasId });
      setShowAddPozo(false);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, `gasolineras/${gasId}/pozos`); }
  };

  // ── FORM DE NUEVA GASOLINERA ──────────────────────────────────────────────
  if (isNew) {
    return (
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}>
            <ArrowLeft size={22} />
          </button>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Nueva Estación</h2>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <SectionTitle>Datos del Promovente</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <FormField label="Razón Social *" value={form.razon_social || ''} onChange={v => setF('razon_social', v)} />
            <FormField label="RFC *" value={form.rfc || ''} onChange={v => setF('rfc', v.toUpperCase())} />
            <FormField label="Representante Legal" value={form.representante_legal || ''} onChange={v => setF('representante_legal', v)} />
            <FormField label="Correo electrónico" value={form.correo_electronico || ''} onChange={v => setF('correo_electronico', v)} />
            <FormField label="Teléfono" value={form.telefono || ''} onChange={v => setF('telefono', v)} />
            <FormField label="NRA (si ya existe)" value={form.nra || ''} onChange={v => setF('nra', v)} />
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="Domicilio para notificaciones" value={form.domicilio_notificaciones || ''} onChange={v => setF('domicilio_notificaciones', v)} />
            </div>
          </div>

          <SectionTitle>Ubicación de la Instalación</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
            <FormField label="Calle" value={form.calle || ''} onChange={v => setF('calle', v)} />
            <FormField label="Número exterior" value={form.numero_exterior || ''} onChange={v => setF('numero_exterior', v)} />
            <FormField label="Colonia / Fraccionamiento" value={form.colonia || ''} onChange={v => setF('colonia', v)} />
            <FormField label="Código Postal" value={form.cp || ''} onChange={v => setF('cp', v)} />
            <FormField label="Municipio *" value={form.municipio || ''} onChange={v => setF('municipio', v)} />
            <FormField label="Estado *" value={form.estado || ''} onChange={v => setF('estado', v)} />
            <FormField label="Superficie total (m²)" type="number" value={String(form.superficie_total_m2 || '')} onChange={v => setF('superficie_total_m2', Number(v))} />
            <FormField label="Superficie utilizada (m²)" type="number" value={String(form.superficie_utilizada_m2 || '')} onChange={v => setF('superficie_utilizada_m2', Number(v))} />
          </div>

          <SectionTitle>Tipo de Proyecto</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
                Tipo de actividad *
              </label>
              <select
                className="glass-input"
                style={{ width: '100%', color: 'var(--text-primary)', appearance: 'none', background: 'var(--bg-surface)' }}
                value={form.tipo_proyecto || ''}
                onChange={e => setF('tipo_proyecto', e.target.value as TipoProyecto)}
              >
                {TIPOS_PROYECTO.map(t => (
                  <option key={t.value} value={t.value} style={{ background: '#060912' }}>{t.label}</option>
                ))}
              </select>
            </div>
            <FormField label="Capacidad total almacenamiento (L)" type="number" value={String(form.capacidad_almacenamiento_litros || '')} onChange={v => setF('capacidad_almacenamiento_litros', Number(v))} />
            <FormField label="Número de tanques" type="number" value={String(form.numero_tanques_total || '')} onChange={v => setF('numero_tanques_total', Number(v))} />
            <FormField label="Número de trabajadores" type="number" value={String(form.num_trabajadores_total || '')} onChange={v => setF('num_trabajadores_total', Number(v))} />
          </div>

          <div style={{ display: 'flex', gap: 24, marginBottom: 28 }}>
            <CheckboxField label="¿Está en Área Natural Protegida (ANP)?" checked={form.esta_en_anp || false} onChange={v => setF('esta_en_anp', v)} />
            <CheckboxField label="¿Está en sitio RAMSAR?" checked={form.esta_en_ramsar || false} onChange={v => setF('esta_en_ramsar', v)} />
            <CheckboxField label="¿Requiere remoción de vegetación forestal?" checked={form.requiere_remocion_vegetacion || false} onChange={v => setF('requiere_remocion_vegetacion', v)} />
          </div>

          {/* Preview de reportes que aplican */}
          {form.tipo_proyecto && (form.capacidad_almacenamiento_litros ?? 0) > 0 && (
            <div style={{ background: 'var(--primary-dim)', border: '1px solid rgba(26,109,255,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 8px' }}>
                Reportes que aplican automáticamente
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {resolverReportesAplicables(form as Gasolinera).map(r => {
                  const col = COLORES_REPORTE[r];
                  return (
                    <span key={r} style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: col.bg, color: col.text, border: `1px solid ${col.border}`, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      {etiquetaReporte(r)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 20, borderTop: '1px solid var(--border-glass)' }}>
            <button onClick={onBack} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} className="btn-primary">Registrar Estación</button>
          </div>
        </div>
      </div>
    );
  }

  if (!initialGas) return null;
  const gas = initialGas;
  const reportes = gas.reportes_aplicables ?? resolverReportesAplicables(gas);
  const capacidadTotal = tanques.reduce((s, t) => s + t.capacidad_l, 0);

  // Alertas reales derivadas de datos
  const alertas: string[] = [];
  if (!gas.nra) alertas.push('NRA no registrado');
  if (!gas.representante_legal) alertas.push('Representante legal no capturado');
  if (!gas.capacidad_almacenamiento_litros) alertas.push('Capacidad de almacenamiento sin registrar');
  if (gas.status_coa === 'pendiente') alertas.push('COA en estatus pendiente — verificar plazo');
  if (tramites.length === 0) alertas.push('Sin trámites registrados — generar reporte desde Machotes');

  // ── VISTA DETALLE ─────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 80 }}>
      <AnimatePresence>
        {showAddTanque && (
          <Modal title="Vincular Tanque de Almacenamiento" onClose={() => setShowAddTanque(false)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <SelectField label="Producto" value={newTanque.producto} options={['magna', 'premium', 'diesel', 'gas_lp']} onChange={v => setNewTanque({ ...newTanque, producto: v as any })} />
              <FormField label="Capacidad (L)" type="number" value={String(newTanque.capacidad_l)} onChange={v => setNewTanque({ ...newTanque, capacidad_l: Number(v) })} />
              <SelectField label="Tipo de pared" value={newTanque.tipo_pared} options={['simple_pared', 'doble_pared']} onChange={v => setNewTanque({ ...newTanque, tipo_pared: v as any })} />
              <SelectField label="Material" value={newTanque.material} options={['acero', 'fibra_de_vidrio', 'FRP']} onChange={v => setNewTanque({ ...newTanque, material: v as any })} />
              <FormField label="Año instalación" type="number" value={String(newTanque.anio_instalacion)} onChange={v => setNewTanque({ ...newTanque, anio_instalacion: Number(v) })} />
              <SelectField label="Estado operativo" value={newTanque.estado_operativo} options={['activo', 'fuera_de_servicio', 'en_mantenimiento']} onChange={v => setNewTanque({ ...newTanque, estado_operativo: v as any })} />
            </div>
            <button onClick={handleAddTanque} className="btn-primary" style={{ width: '100%' }}>Vincular Tanque</button>
          </Modal>
        )}
        {showAddPozo && (
          <Modal title="Agregar Pozo de Monitoreo" onClose={() => setShowAddPozo(false)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <FormField label="Profundidad (m)" type="number" value={String(newPozo.profundidad_m)} onChange={v => setNewPozo({ ...newPozo, profundidad_m: Number(v) })} />
              <SelectField label="Presencia de HC" value={newPozo.presencia_hidrocarburos ? 'SI' : 'NO'} options={['SI', 'NO']} onChange={v => setNewPozo({ ...newPozo, presencia_hidrocarburos: v === 'SI' })} />
            </div>
            <button onClick={handleAddPozo} className="btn-primary" style={{ width: '100%' }}>Agregar Pozo</button>
          </Modal>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, marginTop: 2 }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            {gas.razon_social}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <MapPin size={12} />
            {gas.municipio && gas.estado ? `${gas.municipio}, ${gas.estado}` : 'Ubicación no registrada'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {reportes.map(r => {
            const col = COLORES_REPORTE[r];
            return (
              <span key={r} style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: col.bg, color: col.text, border: `1px solid ${col.border}`, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {etiquetaReporte(r)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-surface)', borderRadius: 14, width: 'fit-content', border: '1px solid var(--border-glass)', marginBottom: 28 }}>
        <TabBtn icon={<Container size={16} />} label="Infraestructura" active={activeTab === 'infra'} onClick={() => setActiveTab('infra')} />
        <TabBtn icon={<Activity size={16} />} label="Monitoreo Ambiental" active={activeTab === 'env'} onClick={() => setActiveTab('env')} />
        <TabBtn icon={<FileText size={16} />} label="Trámites / COA" active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {activeTab === 'infra' && (
            <>
              {/* Tanques */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>
                      Tanques de Almacenamiento (TAS)
                    </h3>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>NOM-005-ASEA-2016</p>
                  </div>
                  {capacidadTotal > 0 && (
                    <span className="font-mono-kenzly" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                      {capacidadTotal.toLocaleString()} L total
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {tanques.map(t => {
                    const colores: Record<string, string> = { magna: 'var(--success)', premium: 'var(--danger)', diesel: 'var(--accent)', gas_lp: 'var(--primary)' };
                    return (
                      <div key={t.id} className="glass-card" style={{ padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-surface-hover)', color: colores[t.producto] ?? 'var(--text-primary)', textTransform: 'uppercase' }}>
                            {t.producto}
                          </span>
                          <span className="font-mono-kenzly" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {t.capacidad_l.toLocaleString()} L
                          </span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                          {t.tipo_pared.replace('_', ' ')}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{t.material} • {t.anio_instalacion}</p>
                        <div style={{ marginTop: 10, padding: '4px 0', borderTop: '1px solid var(--border-glass)' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: t.estado_operativo === 'activo' ? 'var(--success)' : 'var(--warning)', textTransform: 'uppercase' }}>
                            {t.estado_operativo.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setShowAddTanque(true)}
                    className="glass-card"
                    style={{ padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', border: '1px dashed var(--border-glass)', background: 'transparent', minHeight: 110 }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-glass)'}
                  >
                    <Plus size={20} color="var(--text-muted)" />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vincular Tanque</span>
                  </button>
                </div>
              </section>

              {/* Info técnica */}
              {gas.capacidad_almacenamiento_litros && (
                <div className="glass-card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>
                    Datos Técnicos del Proyecto
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <KPISmall label="Capacidad total" value={`${gas.capacidad_almacenamiento_litros.toLocaleString()} L`} />
                    {gas.superficie_total_m2 && <KPISmall label="Superficie predio" value={`${gas.superficie_total_m2} m²`} />}
                    {gas.num_trabajadores_total && <KPISmall label="Trabajadores" value={String(gas.num_trabajadores_total)} />}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'env' && (
            <>
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                    Pozos de Monitoreo
                  </h3>
                  <button
                    onClick={() => setShowAddPozo(true)}
                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    + Agregar Pozo
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pozos.map(p => (
                    <div key={p.id} className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ padding: 8, borderRadius: 8, background: p.presencia_hidrocarburos ? 'var(--danger-dim)' : 'var(--success-dim)' }}>
                        <Droplets size={18} color={p.presencia_hidrocarburos ? 'var(--danger)' : 'var(--success)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>Pozo {p.id.slice(-4)}</p>
                        <p className="font-mono-kenzly" style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                          Prof. {p.profundidad_m} m {p.nivel_estatico_m ? `• NE ${p.nivel_estatico_m} m` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: p.presencia_hidrocarburos ? 'var(--danger)' : 'var(--success)', margin: 0 }}>
                          {p.presencia_hidrocarburos ? `Positivo — ${p.espesor_mancha_cm ?? '?'} cm` : 'Negativo'}
                        </p>
                        {p.fecha_ultima_lectura && (
                          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>{p.fecha_ultima_lectura}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {pozos.length === 0 && (
                    <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13, borderStyle: 'dashed' }}>
                      Sin pozos registrados para esta estación.
                    </div>
                  )}
                </div>
              </section>

              {/* Flags ambientales */}
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>
                  Flags Ambientales (determinan tipo de reporte)
                </h3>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <FlagBadge label="Área Natural Protegida" active={gas.esta_en_anp ?? false} />
                  <FlagBadge label="Sitio RAMSAR" active={gas.esta_en_ramsar ?? false} />
                  <FlagBadge label="Remoción Forestal" active={gas.requiere_remocion_vegetacion ?? false} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'docs' && (
            <>
              <section>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>
                  Trámites Registrados
                </h3>
                {tramites.length > 0 ? (
                  <div className="glass-card" style={{ overflow: 'hidden' }}>
                    {tramites.map((tr, i) => {
                      const col = COLORES_REPORTE[tr.tipo] ?? COLORES_REPORTE['MISSE_FormatoA'];
                      const estadoColor: Record<string, string> = {
                        aprobado: 'var(--success)', pendiente: 'var(--warning)',
                        en_proceso: 'var(--primary)', presentado: 'var(--accent)', rechazado: 'var(--danger)',
                      };
                      return (
                        <div key={tr.id} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: i < tramites.length - 1 ? '1px solid var(--border-glass)' : 'none' }}>
                          <div style={{ padding: 8, borderRadius: 8, background: col.bg, border: `1px solid ${col.border}`, flexShrink: 0 }}>
                            <FileText size={16} color={col.text} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>{tr.tipo}</p>
                            {tr.fecha_generacion && (
                              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Generado: {tr.fecha_generacion}</p>
                            )}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: estadoColor[tr.estado] ?? 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {tr.estado}
                          </span>
                          {tr.folio && (
                            <span className="font-mono-kenzly" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{tr.folio}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="glass-card" style={{ padding: 40, textAlign: 'center', borderStyle: 'dashed' }}>
                    <FileText size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 4px' }}>Sin trámites registrados</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, opacity: 0.7 }}>
                      Genera reportes desde la sección Machotes
                    </p>
                  </div>
                )}
              </section>

              {/* Reportes aplicables */}
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>
                  Reportes Aplicables (auto-resueltos)
                </h3>
                {reportes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {reportes.map(r => {
                      const col = COLORES_REPORTE[r];
                      const p = { MISSE_FormatoA: 'SENER', Informe_Preventivo: 'ASEA', MIA_Particular: 'ASEA', RGRP: 'SEMARNAT / ASEA' }[r];
                      return (
                        <div key={r} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: col.bg, border: `1px solid ${col.border}` }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: col.text }}>{etiquetaReporte(r)}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{p}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Completa tipo de proyecto y capacidad para ver los reportes aplicables.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info del sitio */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 14px' }}>
              Información del Sitio
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <InfoRow label="RFC" value={gas.rfc} mono />
              <InfoRow label="NRA" value={gas.nra || '—'} mono />
              <InfoRow label="Permiso CRE" value={gas.permiso_cre || '—'} mono />
              {gas.tipo_proyecto && <InfoRow label="Tipo" value={TIPOS_PROYECTO.find(t => t.value === gas.tipo_proyecto)?.label ?? gas.tipo_proyecto} />}
              {gas.capacidad_almacenamiento_litros && <InfoRow label="Capacidad" value={`${gas.capacidad_almacenamiento_litros.toLocaleString()} L`} mono />}
              {gas.cp && <InfoRow label="CP" value={gas.cp} mono />}
            </div>
          </div>

          {/* Responsable técnico */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 14px' }}>
              Responsable Técnico
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-dim)', border: '1px solid var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={20} color="var(--primary)" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                  {gas.responsable_tecnico || 'No asignado'}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Consultor Ambiental</p>
              </div>
            </div>
          </div>

          {/* Alertas reales */}
          {alertas.length > 0 && (
            <div className="glass-card" style={{ padding: 20, background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={16} color="var(--danger)" />
                <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                  Pendientes ({alertas.length})
                </h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {alertas.map((a, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 500 }}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {alertas.length === 0 && (
            <div className="glass-card" style={{ padding: 20, background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>Datos completos</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componentes auxiliares ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px', paddingTop: 8, borderTop: '1px solid var(--border-glass)' }}>
      {children}
    </p>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 500,
        background: active ? 'rgba(26,109,255,0.15)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        transition: 'all 0.18s ease',
      }}
    >
      {icon}{label}
    </button>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 8, borderBottom: '1px solid var(--border-glass)' }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <span className={mono ? 'font-mono-kenzly' : ''} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  );
}

function KPISmall({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{label}</p>
      <p className="font-mono-kenzly" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
    </div>
  );
}

function FlagBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: active ? 'var(--danger)' : 'var(--text-muted)', fontWeight: active ? 700 : 500 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--danger)' : 'var(--border-glass)', position: 'relative' }} className={active ? 'status-pulse' : ''} />
      {label}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 480, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} className="glass-input" style={{ width: '100%', boxSizing: 'border-box' }} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value?: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>{label}</label>
      <select className="glass-input" style={{ width: '100%', color: 'var(--text-primary)', appearance: 'none', background: 'var(--bg-surface)' }} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o} style={{ background: '#060912' }}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--primary)' }} />
      {label}
    </label>
  );
}
