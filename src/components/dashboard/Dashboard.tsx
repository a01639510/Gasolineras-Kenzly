import { motion } from 'motion/react';
import { 
  Plus, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  FileSearch
} from 'lucide-react';
import { Gasolinera } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '../../lib/utils';

interface DashboardProps {
  gasolineras: Gasolinera[];
  onSelect: (id: string) => void;
}

export default function Dashboard({ gasolineras, onSelect }: DashboardProps) {
  const stats = [
    { label: 'Total Estaciones', value: gasolineras.length, icon: <MapPin size={20} color="var(--primary)" />, trend: '+2 este mes' },
    { label: 'COAs Pendientes', value: gasolineras.filter(g => g.status_coa === 'pendiente').length, icon: <AlertCircle size={20} color="var(--warning)" />, trend: 'Vence en 20 días' },
    { label: 'Cumplimiento', value: '92%', icon: <CheckCircle2 size={20} color="var(--success)" />, trend: '+5% vs 2024' },
    { label: 'Visitas Prox.', value: '12', icon: <Clock size={20} color="var(--accent)" />, trend: 'Prox. 7 días' }
  ];

  const chartData = [
    { name: 'Magna', value: 400, color: '#1A6DFF' },
    { name: 'Premium', value: 300, color: '#8FAAC8' },
    { name: 'Diesel', value: 200, color: '#1558CC' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: '0 0 4px' }}>
            Panel de Control
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Resumen de operaciones y cumplimiento ambiental.
          </p>
        </div>
        <button onClick={() => onSelect('new')} className="btn-primary">
          <Plus size={16} />
          Registrar Estación
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card"
            style={{ padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{
                padding: 10, background: 'var(--primary-dim)',
                borderRadius: 10, border: '1px solid var(--primary-glow)',
              }}>
                {stat.icon}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {stat.trend}
              </span>
            </div>
            <p className="font-mono-kenzly" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Volumen de Despacho (m³)
            </h3>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A6DFF' }} /> Magna
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8FAAC8' }} /> Premium
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Info */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 20px' }}>
            Estado COA por Zona
          </h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height={192}>
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>CDMX</span>
              <span className="font-mono-kenzly" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>12</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Edo. Mex</span>
              <span className="font-mono-kenzly" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>8</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            Vencimientos Próximos
          </h3>
          <button style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.5px' }}>
            Ver todos
          </button>
        </div>
        <div>
          {gasolineras.slice(0, 5).map((gas) => (
            <div
              key={gas.id}
              onClick={() => onSelect(gas.id)}
              style={{
                padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14,
                borderBottom: '1px solid var(--border-glass)', cursor: 'pointer',
                transition: 'background 0.18s ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface-hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--primary-dim)', border: '1px solid var(--primary-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FileSearch size={16} color="var(--primary)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {gas.razon_social}
                </p>
                <p className="font-mono-kenzly" style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{gas.rfc}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                  display: 'inline-block', marginBottom: 4, letterSpacing: '0.5px', textTransform: 'uppercase',
                  background: gas.status_coa === 'pendiente' ? 'var(--warning-dim)' : 'var(--success-dim)',
                  color: gas.status_coa === 'pendiente' ? 'var(--warning)' : 'var(--success)',
                }}>
                  COA {gas.status_coa}
                </span>
                <p className="font-mono-kenzly" style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>
                  31 dic 2026
                </p>
              </div>
            </div>
          ))}
          {gasolineras.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>
              No hay estaciones registradas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
