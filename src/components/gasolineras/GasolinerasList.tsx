import { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  MoreVertical, 
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Gasolinera } from '../../types';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface GasolinerasListProps {
  gasolineras: Gasolinera[];
  onSelect: (id: string) => void;
}

export default function GasolinerasList({ gasolineras, onSelect }: GasolinerasListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGas = gasolineras.filter(g => 
    g.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.rfc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Estaciones</h2>
          <p className="text-slate-400">Administra el padrón de estaciones de servicio.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por razón social o RFC..." 
              className="glass-input pl-10 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white">
            <Filter size={20} />
          </button>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => onSelect('new')}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGas.map((gas, i) => (
          <motion.div
            key={gas.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card group hover:border-cyan-500/30 transition-all cursor-pointer overflow-hidden p-6 relative"
            onClick={() => onSelect(gas.id)}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-3xl rounded-full group-hover:bg-cyan-500/10 transition-all" />

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-cyan-500/10 transition-all">
                  <MapPin className="text-cyan-500" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{gas.razon_social}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{gas.rfc}</p>
                </div>
              </div>
              <button className="text-slate-600 hover:text-white">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">NRA</p>
                  <p className="text-sm font-mono text-slate-300">{gas.nra || 'Sin asignar'}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Permiso CRE</p>
                  <p className="text-sm font-mono text-slate-300">{gas.permiso_cre || 'Pendiente'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {gas.status_coa === 'presentada' ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <AlertCircle size={14} className="text-amber-500" />
                  )}
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-widest",
                    gas.status_coa === 'presentada' ? "text-green-500" : "text-amber-500"
                  )}>
                    COA {gas.status_coa || 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-cyan-500 group-hover:translate-x-1 transition-transform">
                  <span className="text-xs font-bold">Detalles</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredGas.length === 0 && (
          <div className="col-span-full py-20 text-center glass-card border-dashed">
            <p className="text-slate-500 italic">No se encontraron estaciones para tu búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
