import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
  BrainCircuit,
  Library,
  Flame,
} from 'lucide-react';
import { Gasolinera } from './types';
import Dashboard from './components/dashboard/Dashboard';
import GasolinerasList from './components/gasolineras/GasolinerasList';
import GasolineraDetail from './components/gasolineras/GasolineraDetail';
import AIPanel from './components/ai/AIPanel';
import DocumentGenerator from './components/documentos/DocumentGenerator';

type View = 'dashboard' | 'gasolineras' | 'detalles' | 'ai' | 'machotes';

const NAV_ITEMS = [
  { id: 'dashboard',   icon: <BarChart3 size={18} />,   label: 'Dashboard' },
  { id: 'gasolineras', icon: <MapPin size={18} />,       label: 'Estaciones' },
  { id: 'machotes',    icon: <Library size={18} />,      label: 'Machotes' },
  { id: 'ai',          icon: <BrainCircuit size={18} />, label: 'Inteligencia COA' },
] as const;

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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Gasolinera));
      setGasolineras(docs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'gasolineras'));
    return () => unsubscribe();
  }, [user]);

  const handleSelectGas = (id: string) => {
    setSelectedGasId(id);
    setActiveView('detalles');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ color: 'var(--primary)' }}
        >
          <BrainCircuit size={44} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="glass-card"
          style={{ width: '100%', maxWidth: 420, padding: 48, textAlign: 'center' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(135deg, var(--primary) 0%, #1558CC 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-glow-primary)',
            }}>
              <Flame size={32} color="#fff" />
            </div>
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.5px', marginBottom: 6,
          }}>
            EcoGas Manager MX
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 36, lineHeight: 1.6 }}>
            Plataforma de Gestión Ambiental y Cumplimiento Regulatorio
          </p>

          <button
            onClick={signInWithGoogle}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, background: '#fff', color: '#111', padding: '12px 20px',
              borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none',
              cursor: 'pointer', transition: 'opacity 0.18s ease, transform 0.18s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 18, height: 18 }} />
            Ingresar con Google
          </button>

          <div style={{
            marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-glass)',
            display: 'flex', justifyContent: 'center', gap: 16,
            fontSize: 10, color: 'var(--text-muted)', fontWeight: 800,
            letterSpacing: '1.5px', textTransform: 'uppercase',
          }}>
            <span>ASEA</span><span style={{ opacity: 0.4 }}>•</span>
            <span>SEMARNAT</span><span style={{ opacity: 0.4 }}>•</span>
            <span>PROFEPA</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="glass-sidebar" style={{ width: 224, display: 'flex', flexDirection: 'column', padding: 16, zIndex: 50, flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', marginBottom: 32 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--primary) 0%, #1558CC 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Droplets size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            EcoGas MX
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeView === item.id || (item.id === 'gasolineras' && activeView === 'detalles');
            return (
              <NavItem
                key={item.id}
                active={isActive}
                onClick={() => setActiveView(item.id as View)}
                icon={item.icon}
                label={item.label}
              />
            );
          })}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 4 }}>
            <img
              src={user.photoURL || ''}
              alt=""
              style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border-glass)', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Consultor Ambiental
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
              transition: 'color 0.18s ease, background 0.18s ease',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--danger)'; b.style.background = 'var(--danger-dim)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text-muted)'; b.style.background = 'transparent'; }}
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div style={{ padding: '28px 32px', minHeight: '100%' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
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

function NavItem({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: active ? 600 : 500,
        background: active ? 'rgba(26,109,255,0.15)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        borderLeft: active ? '2px solid rgba(26,109,255,0.6)' : '2px solid transparent',
        transition: 'all 0.18s ease',
        textAlign: 'left',
      }}
      onMouseEnter={e => {
        if (!active) {
          const b = e.currentTarget;
          b.style.background = 'var(--bg-surface)';
          b.style.color = 'var(--text-secondary)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const b = e.currentTarget;
          b.style.background = 'transparent';
          b.style.color = 'var(--text-muted)';
        }
      }}
    >
      <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
