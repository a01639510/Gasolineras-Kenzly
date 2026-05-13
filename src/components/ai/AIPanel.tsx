import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Upload, 
  Calculator, 
  FileText, 
  Loader2,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  FlaskConical,
  Recycle,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateEmissions, classifyResidue, generateCOANarrative } from '../../services/geminiService';
import { Gasolinera } from '../../types';
import { cn } from '../../lib/utils';

interface AIPanelProps {
  gasolineras: Gasolinera[];
}

export default function AIPanel({ gasolineras }: AIPanelProps) {
  const [activeTool, setActiveTool] = useState<'emissions' | 'residue' | 'narrative'>('emissions');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // States for forms
  const [volume, setVolume] = useState('');
  const [residueName, setResidueName] = useState('');
  const [selectedGasId, setSelectedGasId] = useState('');

  const handleCalculateEmissions = async () => {
    setLoading(true);
    try {
      const res = await calculateEmissions(Number(volume), true);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClassifyResidue = async () => {
    setLoading(true);
    try {
      const res = await classifyResidue(residueName);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNarrative = async () => {
    setLoading(true);
    try {
      const gas = gasolineras.find(g => g.id === selectedGasId);
      const res = await generateCOANarrative(2, 2026, gas || { name: 'Estación Trial' });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-white tracking-tight uppercase italic">IA Core</h2>
          <div className="p-1.5 bg-cyan-500/20 rounded-lg">
            <Sparkles className="text-cyan-400" size={20} />
          </div>
        </div>
        <p className="text-slate-400">Automatización de cálculos y reportes regulatorios mediante Google Gemini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tools Menu */}
        <div className="lg:col-span-1 space-y-3">
          <ToolItem 
            active={activeTool === 'emissions'} 
            onClick={() => { setActiveTool('emissions'); setResult(null); }}
            icon={<Calculator />} 
            label="Cálculo Emisiones" 
            desc="Basado en EPA AP-42"
          />
          <ToolItem 
            active={activeTool === 'residue'} 
            onClick={() => { setActiveTool('residue'); setResult(null); }}
            icon={<Recycle />} 
            label="Clasificador CRETIB" 
            desc="NOM-052-SEMARNAT"
          />
          <ToolItem 
            active={activeTool === 'narrative'} 
            onClick={() => { setActiveTool('narrative'); setResult(null); }}
            icon={<FileText />} 
            label="Narrativa COA" 
            desc="Generador Técnico"
          />
        </div>

        {/* Workspace */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-8 border border-white/5 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] pointer-events-none" />
            
            {activeTool === 'emissions' && (
              <div className="space-y-6 relative z-10">
                <h3 className="text-xl font-bold text-white">Calculadora de COV Anual</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Volumen Despachado (L)</label>
                    <input 
                      type="number" 
                      placeholder="Ej. 1200000" 
                      className="glass-input w-full"
                      value={volume}
                      onChange={e => setVolume(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Estado SRV</label>
                    <div className="glass-input flex items-center justify-between text-white">
                      <span>Equipada con Etapa II</span>
                      <CheckCircle2 className="text-cyan-500" size={18} />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleCalculateEmissions}
                  disabled={loading || !volume}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
                  Procesar con IA
                </button>
              </div>
            )}

            {activeTool === 'residue' && (
              <div className="space-y-6 relative z-10">
                <h3 className="text-xl font-bold text-white">Clasificación de Residuos</h3>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nombre del Residuo</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Trapos impregnados con hidrocarburo" 
                    className="glass-input w-full"
                    value={residueName}
                    onChange={e => setResidueName(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleClassifyResidue}
                  disabled={loading || !residueName}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <FlaskConical size={20} />}
                  Clasificar (NOM-052)
                </button>
              </div>
            )}

            {activeTool === 'narrative' && (
              <div className="space-y-6 relative z-10">
                <h3 className="text-xl font-bold text-white">Generador de Narrativa Técnica</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Seleccionar Estación</label>
                    <select 
                      className="glass-input w-full text-white appearance-none"
                      value={selectedGasId}
                      onChange={e => setSelectedGasId(e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {gasolineras.map(g => (
                        <option key={g.id} value={g.id}>{g.razon_social}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Sección COA</label>
                    <div className="glass-input text-white">Sección II: Emisiones Atmosfera</div>
                  </div>
                </div>
                <button 
                  onClick={handleGenerateNarrative}
                  disabled={loading || !selectedGasId}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
                  Redactar Narrativa
                </button>
              </div>
            )}
          </div>

          {/* Results Area */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 border border-cyan-500/20 bg-cyan-500/5"
              >
                <div className="flex items-center gap-3 mb-6 border-b border-cyan-500/10 pb-4">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <CheckCircle2 className="text-cyan-400" size={20} />
                  </div>
                  <h4 className="font-bold text-white">Resultado del Procesamiento</h4>
                </div>
                
                {activeTool === 'emissions' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <ResultStat label="COV Anual" value={`${result.toneladas_cov} ton`} />
                    <ResultStat label="Benceno" value={`${result.benceno_kg} kg`} />
                    <ResultStat label="Tolueno" value={`${result.tolueno_kg} kg`} />
                    <ResultStat label="Xilenos" value={`${result.xileno_kg} kg`} />
                    <div className="col-span-full pt-4">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-2">Metodología de Cálculo</p>
                      <p className="text-sm text-slate-300 leading-relaxed italic">"{result.metodologia}"</p>
                    </div>
                  </div>
                )}

                {activeTool === 'residue' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Código CRETIB</p>
                        <p className="text-2xl font-black text-cyan-400">{result.codigo_cretib}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Manejo Recomendado</p>
                        <p className="text-sm text-white font-medium">{result.manejo}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                      {result.descripcion}
                    </p>
                  </div>
                )}

                {activeTool === 'narrative' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500 uppercase font-bold">Respuesta del Modelo</p>
                      <button className="text-[10px] text-cyan-500 border border-cyan-500/30 px-2 py-1 rounded hover:bg-cyan-500/10 active:scale-95 transition-all">Copiar al portapapeles</button>
                    </div>
                    <div className="text-sm text-slate-300 leading-relaxed prose prose-invert font-serif whitespace-pre-wrap max-h-96 overflow-y-auto pr-4 custom-scrollbar">
                      {result}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ToolItem({ active, onClick, icon, label, desc }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, desc: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full text-left p-5 rounded-2xl border transition-all relative group",
        active 
          ? "bg-cyan-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/5" 
          : "bg-white/5 border-white/5 hover:bg-white/10"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl transition-all",
          active ? "bg-cyan-500 text-black shadow-lg" : "bg-white/5 text-slate-500 group-hover:text-cyan-400"
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <p className={cn("font-bold text-sm", active ? "text-white" : "text-slate-400")}>{label}</p>
          <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">{desc}</p>
        </div>
        {active && (
          <ChevronRight className="text-cyan-500" size={16} />
        )}
      </div>
    </button>
  );
}

function ResultStat({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase font-bold mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
