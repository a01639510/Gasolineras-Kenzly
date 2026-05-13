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
    { label: 'Total Estaciones', value: gasolineras.length, icon: <MapPin className="text-cyan-400" />, trend: '+2 este mes' },
    { label: 'COAs Pendientes', value: gasolineras.filter(g => g.status_coa === 'pendiente').length, icon: <AlertCircle className="text-amber-400" />, trend: 'Vence en 20 días' },
    { label: 'Cumplimiento', value: '92%', icon: <CheckCircle2 className="text-green-400" />, trend: '+5% vs 2024' },
    { label: 'Visitas Prox.', value: '12', icon: <Clock className="text-blue-400" />, trend: 'Prox. 7 días' }
  ];

  const chartData = [
    { name: 'Magna', value: 400, color: '#22d3ee' },
    { name: 'Premium', value: 300, color: '#3b82f6' },
    { name: 'Diesel', value: 200, color: '#6366f1' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Panel de Control</h2>
          <p className="text-slate-400">Resumen de operaciones y cumplimiento ambiental.</p>
        </div>
        <button 
          onClick={() => onSelect('new')} // Just to trigger view change or modal
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
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
            className="glass-card p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.trend}</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-white">Volumen de Despacho (m³)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-cyan-400" /> Magna
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Premium
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
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
        <div className="glass-card p-6 flex flex-col">
          <h3 className="font-bold text-white mb-6">Estado COA por Zona</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
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
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">CDMX</span>
              <span className="text-white font-bold">12</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Edo. Mex</span>
              <span className="text-white font-bold">8</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white">Vencimientos Próximos</h3>
          <button className="text-xs text-cyan-400 font-bold hover:underline">Ver todos</button>
        </div>
        <div className="divide-y divide-white/5">
          {gasolineras.slice(0, 5).map((gas) => (
            <div 
              key={gas.id} 
              className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => onSelect(gas.id)}
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <FileSearch size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{gas.razon_social}</p>
                <p className="text-xs text-slate-500">{gas.rfc}</p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-xs px-2 py-1 rounded inline-block font-bold mb-1",
                  gas.status_coa === 'pendiente' ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"
                )}>
                  COA {gas.status_coa}
                </p>
                <p className="text-[10px] text-slate-600 uppercase">31 dic 2026</p>
              </div>
            </div>
          ))}
          {gasolineras.length === 0 && (
            <div className="p-12 text-center text-slate-500 italic">
              No hay estaciones registradas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
