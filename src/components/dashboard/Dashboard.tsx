import { motion } from 'motion/react';
import {
  Plus,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSearch,
  BarChart2
} from 'lucide-react';
import { Gasolinera, TipoProyecto } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardProps {
  gasolineras: Gasolinera[];
  onSelect: (id: string) => void;
}

const TIPO_LABELS: Record<TipoProyecto, string> = {
  gas_lp_carburacion: 'Gas LP Carb.',
  gas_lp_publico: 'Gas LP Púb.',
  gasolinera_petroliferos: 'Gasolinera',
  autoconsumo: 'Autoconsumo',
};

const TIPO_COLORS: Record<TipoProyecto, string> = {
  gasolinera_petroliferos: '#1A6DFF',
  gas_lp_publico: '#8FAAC8',
  gas_lp_carburacion: '#1558CC',
  autoconsumo: '#3D8BFF',
};

const COA_COLORS: Record<string, string> = {
  pendiente: '#F59E0B',
  presentada: '#22C55E',
  observaciones: '#EF4444',
};

export default function Dashboard({ gasolineras, onSelect }: DashboardProps) {
  const tipoData = Object.entries(
    gasolineras.reduce((acc, g) => {
      const tipo = g.tipo_proyecto ?? 'gasolinera_petroliferos';
      acc[tipo] = (acc[tipo] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([tipo, count]) => ({
    name: TIPO_LABELS[tipo as TipoProyecto] ?? tipo,
    value: count,
    color: TIPO_COLORS[tipo as TipoProyecto] ?? '#1A6DFF',
  }));

  const coaData = Object.entries(
    gasolineras.reduce((acc, g) => {
      const status = g.status_coa ?? 'pendiente';
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: COA_COLORS[status] ?? '#8FAAC8',
  }));

  const estadoData = gasolineras.reduce((acc, g) => {
    if (!g.estado) return acc;
    acc[g.estado] = (acc[g.estado] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const estadoEntries = Object.entries(estadoData).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const presentadas = gasolineras.filter(g => g.status_coa === 'presentada').length;
  const conObservaciones = gasolineras.filter(g => g.status_coa === 'observaciones').length;
  const total = gasolineras.length;

  const stats = [
    {
      label: 'Total Estaciones',
      value: total,
      icon: <MapPin size={20} color="var(--primary)" />,
      trend: total > 0 ? `${total} registradas` : 'Sin datos',
    },
    {
      label: 'COAs Pendientes',
      value: gasolineras.filter(g => g.status_coa === 'pendiente').length,
      icon: <AlertCircle size={20} color="var(--warning)" />,
      trend: 'Requieren atención',
    },
    {
      label: 'COAs Presentadas',
      value: presentadas,
      icon: <CheckCircle2 size={20} color="var(--success)" />,
      trend: total > 0 ? `${Math.round((presentadas / total) * 100)}% del total` : '—',
    },
    {
      label: 'Con Observaciones',
      value: conObservaciones,
      icon: <Clock size={20} color="var(--accent)" />,
      trend: conObservaciones > 0 ? 'Pendientes de respuesta' : 'Sin observaciones',
    },
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
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'right', maxWidth: 100 }}>
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
        {/* Bar chart: tipo de proyecto */}
        <div className="lg:col-span-2 glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Estaciones por Tipo de Proyecto
            </h3>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {tipoData.map(t => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
                  {t.name}
                </div>
              ))}
            </div>
          </div>
          <div className="h-64 w-full">
            {tipoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={tipoData}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{ backgroundColor: '#0D1225', border: '1px solid rgba(26,109,255,0.2)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 12 }}
                    formatter={(value: number) => [value, 'Estaciones']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {tipoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 256, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
                <BarChart2 size={36} style={{ opacity: 0.25 }} />
                <span style={{ fontSize: 13 }}>Sin datos — registra tu primera estación</span>
              </div>
            )}
          </div>
        </div>

        {/* Pie: estado COA + estado breakdown */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 20px' }}>
            Estado COA
          </h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {coaData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height={192}>
                  <PieChart>
                    <Pie data={coaData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {coaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0D1225', border: '1px solid rgba(26,109,255,0.2)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 192, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
                Sin estaciones registradas
              </div>
            )}
          </div>
          {estadoEntries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16, borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
              {estadoEntries.map(([estado, count]) => (
                <div key={estado} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                    {estado}
                  </span>
                  <span className="font-mono-kenzly" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stations list */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            Estaciones Registradas
          </h3>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
            {gasolineras.length} total
          </span>
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
                  background: gas.status_coa === 'observaciones' ? 'var(--danger-dim)' : gas.status_coa === 'presentada' ? 'var(--success-dim)' : 'var(--warning-dim)',
                  color: gas.status_coa === 'observaciones' ? 'var(--danger)' : gas.status_coa === 'presentada' ? 'var(--success)' : 'var(--warning)',
                }}>
                  COA {gas.status_coa ?? 'pendiente'}
                </span>
                <p className="font-mono-kenzly" style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
                  {gas.municipio ? `${gas.municipio}${gas.estado ? `, ${gas.estado}` : ''}` : gas.estado ?? '—'}
                </p>
              </div>
            </div>
          ))}
          {gasolineras.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No hay estaciones registradas. Haz clic en "Registrar Estación" para comenzar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
