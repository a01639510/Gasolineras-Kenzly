import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Container, 
  Droplets, 
  Activity, 
  Plus,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Search,
  MapPin
} from 'lucide-react';
import { Gasolinera, Tanque, PozoMonitoreo, Tramite } from '../../types';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, where, doc, setDoc, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

interface GasolineraDetailProps {
  gasId: string;
  gasolinera?: Gasolinera;
  onBack: () => void;
}

export default function GasolineraDetail({ gasId, gasolinera: initialGasolinera, onBack }: GasolineraDetailProps) {
  const [activeTab, setActiveTab] = useState<'infra' | 'env' | 'docs' | 'safety'>('infra');
  const [tanques, setTanques] = useState<Tanque[]>([]);
  const [pozos, setPozos] = useState<PozoMonitoreo[]>([]);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  
  // Modals/Forms state
  const [showAddTanque, setShowAddTanque] = useState(false);
  const [showAddPozo, setShowAddPozo] = useState(false);

  // Creation state
  const [isCreating, setIsCreating] = useState(gasId === 'new');
  const [newGas, setNewGas] = useState<Partial<Gasolinera>>({
    razon_social: '',
    rfc: '',
    municipio: '',
    estado: '',
    lat: 19.4326,
    lng: -99.1332,
    creador_id: auth.currentUser?.uid || ''
  });

  // Sub-record forms
  const [newTanque, setNewTanque] = useState<Partial<Tanque>>({
    producto: 'magna',
    capacidad_l: 40000,
    tipo_pared: 'doble_pared',
    material: 'acero',
    anio_instalacion: new Date().getFullYear(),
    estado_operativo: 'activo',
    sistema_deteccion_fugas: true
  });

  const [newPozo, setNewPozo] = useState<Partial<PozoMonitoreo>>({
    profundidad_m: 15,
    presencia_hidrocarburos: false,
    lat: 0,
    lng: 0
  });

  useEffect(() => {
    if (!gasId || gasId === 'new') return;
    
    const tanksPath = `gasolineras/${gasId}/tanques`;
    const unsubTanques = onSnapshot(collection(db, tanksPath), (snap) => {
      setTanques(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tanque)));
    }, (error) => handleFirestoreError(error, OperationType.GET, tanksPath));

    const wellsPath = `gasolineras/${gasId}/pozos`;
    const unsubPozos = onSnapshot(collection(db, wellsPath), (snap) => {
      setPozos(snap.docs.map(d => ({ id: d.id, ...d.data() } as PozoMonitoreo)));
    }, (error) => handleFirestoreError(error, OperationType.GET, wellsPath));

    const appsPath = `gasolineras/${gasId}/tramites`;
    const unsubTramites = onSnapshot(collection(db, appsPath), (snap) => {
      setTramites(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tramite)));
    }, (error) => handleFirestoreError(error, OperationType.GET, appsPath));

    return () => {
      unsubTanques();
      unsubPozos();
      unsubTramites();
    };
  }, [gasId]);

  const handleCreateGasolinera = async () => {
    if (!newGas.razon_social || !newGas.rfc) return;
    try {
      const id = newGas.rfc.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).slice(2, 7);
      const gasData = { ...newGas, id, creador_id: auth.currentUser?.uid } as Gasolinera;
      await setDoc(doc(db, 'gasolineras', id), gasData);
      onBack();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'gasolineras');
    }
  };

  const handleAddTanque = async () => {
    if (!gasId || gasId === 'new') return;
    try {
      const tanksPath = `gasolineras/${gasId}/tanques`;
      await addDoc(collection(db, tanksPath), { ...newTanque, id_gasolinera: gasId });
      setShowAddTanque(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `gasolineras/${gasId}/tanques`);
    }
  };

  const handleAddPozo = async () => {
    if (!gasId || gasId === 'new') return;
    try {
      const wellsPath = `gasolineras/${gasId}/pozos`;
      await addDoc(collection(db, wellsPath), { ...newPozo, id_gasolinera: gasId });
      setShowAddPozo(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `gasolineras/${gasId}/pozos`);
    }
  };

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold text-white tracking-tight">Nueva Estación</h2>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Razón Social" value={newGas.razon_social || ''} onChange={v => setNewGas({...newGas, razon_social: v})} />
            <FormField label="RFC" value={newGas.rfc || ''} onChange={v => setNewGas({...newGas, rfc: v})} />
            <FormField label="Municipio" value={newGas.municipio || ''} onChange={v => setNewGas({...newGas, municipio: v})} />
            <FormField label="Estado" value={newGas.estado || ''} onChange={v => setNewGas({...newGas, estado: v})} />
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-white/5">
            <button onClick={onBack} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreateGasolinera} className="btn-primary">Registrar Estación</button>
          </div>
        </div>
      </div>
    );
  }

  if (!initialGasolinera) return null;
  const gasolinera = initialGasolinera;

  return (
    <div className="space-y-6 pb-20">
      {/* Modals */}
      <AnimatePresence>
        {showAddTanque && (
          <Modal title="Agregar Tanque de Almacenamiento" onClose={() => setShowAddTanque(false)}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <SelectField label="Producto" value={newTanque.producto} options={['magna', 'premium', 'diesel']} onChange={v => setNewTanque({...newTanque, producto: v as any})} />
              <FormField label="Capacidad (L)" type="number" value={String(newTanque.capacidad_l)} onChange={v => setNewTanque({...newTanque, capacidad_l: Number(v)})} />
              <SelectField label="Pared" value={newTanque.tipo_pared} options={['simple_pared', 'doble_pared']} onChange={v => setNewTanque({...newTanque, tipo_pared: v as any})} />
              <FormField label="Año Instalación" type="number" value={String(newTanque.anio_instalacion)} onChange={v => setNewTanque({...newTanque, anio_instalacion: Number(v)})} />
            </div>
            <button onClick={handleAddTanque} className="btn-primary w-full">Vincular Tanque</button>
          </Modal>
        )}

        {showAddPozo && (
          <Modal title="Agregar Pozo de Monitoreo" onClose={() => setShowAddPozo(false)}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <FormField label="Profundidad (m)" type="number" value={String(newPozo.profundidad_m)} onChange={v => setNewPozo({...newPozo, profundidad_m: Number(v)})} />
              <SelectField label="Presencia HC" value={newPozo.presencia_hidrocarburos ? 'SI' : 'NO'} options={['SI', 'NO']} onChange={v => setNewPozo({...newPozo, presencia_hidrocarburos: v === 'SI'})} />
            </div>
            <button onClick={handleAddPozo} className="btn-primary w-full">Agregar Pozo</button>
          </Modal>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{gasolinera.razon_social}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-bold tracking-widest">
            <MapPinIcon size={12} /> {gasolinera.municipio}, {gasolinera.estado}
          </div>
        </div>

        <div className="ml-auto flex gap-3">
          <button 
            onClick={() => alert('Ficha descargada en formato PDF.')}
            className="btn-secondary flex items-center gap-2 text-sm px-4"
          >
            <FileText size={16} /> Descargar Ficha
          </button>
          <button 
            onClick={() => {
              setActiveTab('infra');
              setShowAddTanque(true);
            }}
            className="btn-primary flex items-center gap-2 text-sm px-4"
          >
            <Plus size={16} /> Agregar Registro
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit border border-white/5">
        <TabButton icon={<Container size={18}/>} label="Infraestructura" active={activeTab === 'infra'} onClick={() => setActiveTab('infra')} />
        <TabButton icon={<Activity size={18}/>} label="Monitoreo" active={activeTab === 'env'} onClick={() => setActiveTab('env')} />
        <TabButton icon={<FileText size={18}/>} label="Trámites/COA" active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} />
        <TabButton icon={<ShieldCheck size={18}/>} label="Seguridad/SASH" active={activeTab === 'safety'} onClick={() => setActiveTab('safety')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'infra' && (
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg">Tanques de Almacenamiento (TAS)</h3>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">NOM-005-ASEA-2016</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tanques.map(tanque => (
                    <div key={tanque.id} className="glass-card p-5 hover:border-white/20 transition-all border border-white/5">
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase",
                          tanque.producto === 'magna' ? "bg-green-500/10 text-green-500" :
                          tanque.producto === 'premium' ? "bg-red-500/10 text-red-500" : "bg-black text-white border border-white/20"
                        )}>
                          {tanque.producto}
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{tanque.capacidad_l.toLocaleString()} L</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xl font-bold text-white mb-1">{tanque.tipo_pared.replace('_', ' ')}</p>
                          <p className="text-xs text-slate-500">{tanque.material}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-600 uppercase mb-1">Instalación</p>
                          <p className="text-xs font-bold text-slate-300">{tanque.anio_instalacion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setShowAddTanque(true)}
                    className="glass-card border-dashed p-8 flex flex-col items-center justify-center gap-2 group hover:border-cyan-500/50 transition-all border border-white/5"
                  >
                    <div className="p-3 bg-white/5 rounded-full text-slate-500 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all">
                      <Plus size={24} />
                    </div>
                    <span className="text-sm font-medium text-slate-500">Vincular Tanque</span>
                  </button>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-bold text-white text-lg">Sistema de Recuperación de Vapores (SRV)</h3>
                <div className="glass-card p-6 border border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-cyan-500/10 rounded-2xl">
                      <Activity className="text-cyan-500" size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-400">Eficiencia Certificada</span>
                        <span className="text-sm font-bold text-white">92.4%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '92.4%' }}
                          className="bg-cyan-500 h-full rounded-full"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-600 uppercase mb-1">Última Prueba</p>
                      <p className="text-xs font-bold text-slate-300">14 Mar 2026</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg">Pozos de Monitoreo</h3>
                  <button 
                    onClick={() => setShowAddPozo(true)}
                    className="text-xs text-cyan-500 font-bold hover:underline"
                  >
                    + Agregar Pozo
                  </button>
                </div>
                <div className="space-y-3">
                  {pozos.map(pozo => (
                    <div key={pozo.id} className="glass-card p-4 flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          pozo.presencia_hidrocarburos ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                        )}>
                          <Droplets size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Pozo {pozo.id}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Profundidad: {pozo.profundidad_m}m</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8 text-right">
                        <div>
                          <p className="text-[10px] text-slate-600 uppercase mb-0.5">Nivel Estático</p>
                          <p className="text-sm font-bold text-slate-300">{pozo.nivel_estatico_m || '--'} m</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 uppercase mb-0.5">Fase Libre</p>
                          <p className={cn(
                            "text-sm font-bold",
                            pozo.presencia_hidrocarburos ? "text-red-500" : "text-green-500"
                          )}>
                            {pozo.presencia_hidrocarburos ? `${pozo.espesor_mancha_cm} cm` : 'Negativo'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pozos.length === 0 && (
                    <div className="glass-card p-12 text-center text-slate-500 italic border-dashed border border-white/5">
                      No hay pozos registrados para esta estación.
                    </div>
                  )}
                </div>
              </section>

              <section className="glass-card p-6 border border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="text-cyan-500" size={20} />
                  <h3 className="font-bold text-white">Historial de Emisiones (COV)</h3>
                </div>
                <div className="h-48 flex items-end gap-2 px-2">
                  {[45, 62, 58, 70, 85, 40, 52, 60, 65, 72, 80, 55].map((val, i) => (
                    <div key={i} className="flex-1 space-y-2">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${val}%` }}
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 border-t-2 border-cyan-500 transition-colors rounded-t"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                  <span>Ene</span>
                  <span>Dic</span>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="font-bold text-white text-lg">Estatus Regulatorio Anual</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StatusCard 
                    label="COA (Año anterior)" 
                    status="Cerrada" 
                    date="Presentada 24/05/2026" 
                    color="green" 
                  />
                  <StatusCard 
                    label="Dictamen NOM-005" 
                    status="Vigente" 
                    date="Vence 31/12/2026" 
                    color="blue" 
                  />
                  <StatusCard 
                    label="MIA / Informe Prev." 
                    status="Autorizado" 
                    date="Oficial ASEA-0021" 
                    color="cyan" 
                  />
                  <StatusCard 
                    label="Prueba SRV" 
                    status="Vencida" 
                    date="Hace 12 días" 
                    color="red" 
                  />
                </div>
              </section>

              <section className="glass-card overflow-hidden border border-white/5">
                <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">Biblioteca de Expedientes</h3>
                  <Search size={16} className="text-slate-500" />
                </div>
                <div className="divide-y divide-white/5 font-medium">
                  {tramites.map(tramite => (
                    <div key={tramite.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileIcon type={tramite.tipo} />
                        <div>
                          <p className="text-sm text-white">{tramite.tipo}</p>
                          <p className="text-[10px] text-slate-500 uppercase">Resguardo Digital • 1.2 MB</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-700" />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 border border-white/5">
            <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Información del Sitio</h4>
            <div className="space-y-4">
              <InfoItem label="RFC" value={gasolinera.rfc} />
              <InfoItem label="NRA" value={gasolinera.nra || '-'} />
              <InfoItem label="Permiso CRE" value={gasolinera.permiso_cre || '-'} />
              <InfoItem label="Ubicación" value={`${gasolinera.lat.toFixed(4)}, ${gasolinera.lng.toFixed(4)}`} />
            </div>
          </div>

          <div className="glass-card p-6 border border-white/5">
            <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Responsable Técnico</h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-cyan-400">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{gasolinera.responsable_tecnico || 'No asignado'}</p>
                <p className="text-xs text-slate-500">Ingeniero Certificado</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 bg-red-500/5 border border-red-500/20">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-red-500" size={18} />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Alertas de Sitio</h4>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
              <li className="text-red-400 font-medium">Dictamen SRV vencido</li>
              <li>Actualización de bitácora mensual pendiente</li>
              <li>Revisión de válvulas check requerida</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm border-2 border-transparent",
        active ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/20 shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div layoutId="tabIndicator" className="w-1 h-1 bg-cyan-400 rounded-full" />
      )}
    </button>
  );
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-end border-b border-white/5 pb-2">
      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{label}</span>
      <span className="text-sm font-mono text-slate-300">{value}</span>
    </div>
  );
}

function StatusCard({ label, status, date, color }: { label: string, status: string, date: string, color: string }) {
  const colors: Record<string, string> = {
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="glass-card p-4 border border-white/5">
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">{label}</p>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-black uppercase tracking-tighter px-2 py-0.5 rounded border", colors[color])}>
          {status}
        </span>
        <span className="text-[10px] text-slate-600 font-medium">{date}</span>
      </div>
    </div>
  );
}

function FileIcon({ type }: { type: string }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-500">
      <FileText size={20} />
    </div>
  );
}

function MapPinIcon({ size = 16 }) {
  return <MapPin size={size} />;
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 glass-card p-8 w-full max-w-lg border border-white/20 shadow-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <input 
        type={type} 
        className="glass-input w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string, value?: string, options: string[], onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <select 
        className="glass-input w-full appearance-none capitalize"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-[#0a0f18]">{opt.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}
