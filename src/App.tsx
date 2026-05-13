import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

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
import { 
  BarChart3, 
  MapPin, 
  Droplets,
  LogOut, 
  User as UserIcon,
  BrainCircuit,
  ChevronRight,
  Library
} from 'lucide-react';
import { cn } from './lib/utils';
import { Gasolinera, Tramite } from './types';
import Dashboard from './components/dashboard/Dashboard';
import GasolinerasList from './components/gasolineras/GasolinerasList';
import GasolineraDetail from './components/gasolineras/GasolineraDetail';
import AIPanel from './components/ai/AIPanel';
import DocumentGenerator from './components/documentos/DocumentGenerator';

type View = 'dashboard' | 'gasolineras' | 'detalles' | 'ai' | 'machotes';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedGasId, setSelectedGasId] = useState<string | null>(null);
  const [gasolineras, setGasolineras] = useState<Gasolinera[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'gasolineras'), where('creador_id', '==', user.uid));
    const path = 'gasolineras';
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Gasolinera));
      setGasolineras(docs);
    }, (error) => handleFirestoreError(error, OperationType.GET, path));
    return () => unsubscribe();
  }, [user]);

  const handleSelectGas = (id: string) => {
    setSelectedGasId(id);
    setActiveView('detalles');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-cyan-500"
        >
          <BrainCircuit size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 glass-card p-12 max-w-md w-full text-center border border-white/10"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-cyan-500/20 rounded-2xl">
              <Droplets className="text-cyan-400" size={40} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">EcoGas Manager MX</h1>
          <p className="text-slate-400 mb-8">Plataforma de Gestión Ambiental y Cumplimiento Regulatorio (ASEA/SEMARNAT)</p>
          
          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 px-6 rounded-xl font-medium hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Ingresar con Google
          </button>
          
          <div className="mt-8 pt-8 border-t border-white/5 flex justify-center gap-4 text-xs text-slate-500 uppercase tracking-widest">
            <span>ASEA</span>
            <span>•</span>
            <span>SEMARNAT</span>
            <span>•</span>
            <span>PROFEPA</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-sidebar flex flex-col p-4 z-50">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Droplets className="text-cyan-500" size={24} />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">EcoGas MX</span>
        </div>

        <nav className="flex-1 space-y-2 glass-nav-item">
          <NavItem 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')}
            icon={<BarChart3 size={20} />}
            label="Dashboard"
          />
          <NavItem 
            active={activeView === 'gasolineras' || activeView === 'detalles'} 
            onClick={() => setActiveView('gasolineras')}
            icon={<MapPin size={20} />}
            label="Estaciones"
          />
          <NavItem 
            active={activeView === 'machotes'} 
            onClick={() => setActiveView('machotes')}
            icon={<Library size={20} />}
            label="Machotes"
          />
          <NavItem 
            active={activeView === 'ai'} 
            onClick={() => setActiveView('ai')}
            icon={<BrainCircuit size={20} />}
            label="Inteligencia COA"
          />
        </nav>

        <div className="pt-4 border-t border-white/5 space-y-2">
          <div className="px-3 py-2 flex items-center gap-3">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-white/10" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">Consultor Ambiental</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto">
        {/* Background ambient light */}
        <div className="fixed inset-0 pointer-events-none opacity-30 overflow-hidden">
          <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[20%] left-[10%] w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 px-8 py-8 h-full glass-main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeView === 'dashboard' && <Dashboard gasolineras={gasolineras} onSelect={handleSelectGas} />}
              {activeView === 'gasolineras' && <GasolinerasList gasolineras={gasolineras} onSelect={handleSelectGas} />}
              {activeView === 'detalles' && selectedGasId && (
                <GasolineraDetail 
                  gasId={selectedGasId} 
                  gasolinera={gasolineras.find(g => g.id === selectedGasId)} 
                  onBack={() => setActiveView('gasolineras')}
                />
              )}
              {activeView === 'ai' && <AIPanel gasolineras={gasolineras} />}
              {activeView === 'machotes' && <DocumentGenerator gasolineras={gasolineras} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group",
        active 
          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
          : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
      )}
    >
      <span className={cn(active ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300")}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
      {active && (
        <motion.div 
          layoutId="activeIndicator"
          className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]"
        />
      )}
    </button>
  );
}
