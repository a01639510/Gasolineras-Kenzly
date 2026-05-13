import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  X,
  Plus,
  Archive,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { Gasolinera, Plantilla, RequerimientoDato } from '../../types';
import { PLANTILLAS_ESTANDAR } from '../../constants/plantillas';
import { generateDocumentContent } from '../../services/geminiService';
import { cn } from '../../lib/utils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

interface DocumentGeneratorProps {
  gasolineras: Gasolinera[];
}

interface ValidationResult {
  gasolineraId: string;
  missingFields: RequerimientoDato[];
  isValid: boolean;
}

export default function DocumentGenerator({ gasolineras }: DocumentGeneratorProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Plantilla | null>(null);
  const [selectedGasIds, setSelectedGasIds] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<{name: string, content: string}[]>([]);
  const [showMissingForm, setShowMissingForm] = useState<string | null>(null);

  const handleToggleGas = (id: string) => {
    setSelectedGasIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const validateSelection = async () => {
    if (!selectedTemplate) return;
    setIsValidating(true);
    
    // Simulate some logic delay for UX
    await new Promise(r => setTimeout(r, 800));

    const results = selectedGasIds.map(id => {
      const gas = gasolineras.find(g => g.id === id);
      const missing = selectedTemplate.campos_requeridos.filter(req => {
        if (!gas) return true;
        const val = gas[req.field as keyof Gasolinera];
        return val === undefined || val === null || val === '';
      });
      return {
        gasolineraId: id,
        missingFields: missing,
        isValid: missing.length === 0
      };
    });

    setValidationResults(results);
    setIsValidating(false);
    
    const allValid = results.every(r => r.isValid);
    if (allValid) {
      setStep(3);
    } else {
      // Stay on step 2 to fix missing data
    }
  };

  const generateDocuments = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    const docs: {name: string, content: string}[] = [];

    try {
      for (const id of selectedGasIds) {
        const gas = gasolineras.find(g => g.id === id);
        if (!gas) continue;
        
        const content = await generateDocumentContent(selectedTemplate.nombre, gas, {});
        docs.push({
          name: `${selectedTemplate.nombre}_${gas.razon_social.replace(/\s+/g, '_')}.docx`,
          content
        });
      }
      setGeneratedDocs(docs);
      setStep(4);
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    
    for (const doc of generatedDocs) {
      const docBlob = await createDocxBlob(doc.content, doc.name.split('.')[0]);
      zip.file(doc.name, docBlob);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `Documentos_${selectedTemplate?.nombre.replace(/\s+/g, '_')}.zip`);
  };

  const createDocxBlob = async (text: string, title: string) => {
    const sections = text.split('\n\n');
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          ...sections.map(s => new Paragraph({
            children: [new TextRun(s)],
            spacing: { after: 200 }
          }))
        ]
      }]
    });

    return await Packer.toBlob(doc);
  };

  const downloadSingleDoc = async (doc: {name: string, content: string}) => {
    const blob = await createDocxBlob(doc.content, doc.name.split('.')[0]);
    saveAs(blob, doc.name);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          <FileText className="text-cyan-500" size={32} />
          Generador de Machotes
        </h2>
        <p className="text-slate-400">Genera documentación técnica masiva validada por IA.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between glass-card p-4">
        {[1, 2, 3, 4].map(num => (
          <div key={num} className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all",
              step === num ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]" : 
              step > num ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-500"
            )}>
              {step > num ? <CheckCircle2 size={16} /> : num}
            </div>
            <span className={cn(
              "text-xs font-bold uppercase tracking-widest hidden md:block",
              step === num ? "text-cyan-400" : step > num ? "text-emerald-400" : "text-slate-600"
            )}>
              {num === 1 ? 'Plantilla' : num === 2 ? 'Validación' : num === 3 ? 'Generación' : 'Descarga'}
            </span>
            {num < 4 && <div className="h-px w-8 md:w-20 bg-white/5" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-4">1. Selecciona Plantilla</h3>
                <div className="space-y-3">
                  {PLANTILLAS_ESTANDAR.map(plantilla => (
                    <button
                      key={plantilla.id}
                      onClick={() => setSelectedTemplate(plantilla)}
                      className={cn(
                        "w-full glass-card p-5 text-left border transition-all hover:scale-[1.02]",
                        selectedTemplate?.id === plantilla.id ? "border-cyan-500 bg-cyan-500/5 ring-1 ring-cyan-500/20" : "border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="font-bold text-white mb-1 flex items-center justify-between">
                        {plantilla.nombre}
                        {selectedTemplate?.id === plantilla.id && <CheckCircle2 className="text-cyan-500" size={18} />}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{plantilla.descripcion}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-4">2. Selecciona Estaciones ({selectedGasIds.length})</h3>
                <div className="glass-card max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
                  {gasolineras.map(gas => (
                    <button
                      key={gas.id}
                      onClick={() => handleToggleGas(gas.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/5 mb-1",
                        selectedGasIds.includes(gas.id) ? "bg-white/10" : ""
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        selectedGasIds.includes(gas.id) ? "bg-cyan-500 border-cyan-500" : "border-white/20"
                      )}>
                        {selectedGasIds.includes(gas.id) && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">{gas.razon_social}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{gas.rfc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setStep(2)}
                disabled={!selectedTemplate || selectedGasIds.length === 0}
                className="btn-primary flex items-center gap-2"
              >
                Continuar a Validación <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Validación de Datos</h3>
                <p className="text-sm text-slate-400">Verificando que las estaciones cuenten con los requerimientos para: {selectedTemplate?.nombre}</p>
              </div>
              <button 
                onClick={validateSelection}
                disabled={isValidating}
                className="btn-secondary flex items-center gap-2"
              >
                {isValidating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                {validationResults.length === 0 ? 'Iniciar Validación' : 'Re-validar'}
              </button>
            </div>

            {validationResults.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {validationResults.map(res => {
                  const gas = gasolineras.find(g => g.id === res.gasolineraId)!;
                  return (
                    <div key={res.gasolineraId} className="glass-card p-5 flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          res.isValid ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                          {res.isValid ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        </div>
                        <div>
                          <div className="font-bold text-white">{gas.razon_social}</div>
                          <div className="text-xs text-slate-500">
                            {res.isValid ? 'Todos los datos completos' : `${res.missingFields.length} campos faltantes`}
                          </div>
                        </div>
                      </div>

                      {!res.isValid && (
                        <div className="flex items-center gap-4">
                          <div className="flex -space-x-2">
                            {res.missingFields.slice(0, 3).map(f => (
                              <div key={f.id} title={f.label} className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] text-slate-500">
                                {f.id.slice(0, 2).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={() => setShowMissingForm(res.gasolineraId)}
                            className="text-xs font-bold text-cyan-500 hover:underline"
                          >
                            Rellenar ahora
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between pt-8 border-t border-white/5">
              <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft size={18} /> Anterior
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={validationResults.length === 0 || !validationResults.every(r => r.isValid)}
                className="btn-primary flex items-center gap-2"
              >
                Generar Documentos <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/5"
          >
            {isGenerating ? (
              <div className="text-center space-y-6">
                <div className="relative">
                  <Loader2 className="animate-spin text-cyan-500" size={64} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="text-cyan-400 fill-cyan-400" size={24} />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">AI en Acción</h3>
                  <p className="text-slate-400 text-sm">Redactando {selectedGasIds.length} documentos técnicos personalizados...</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto">
                  <FileText className="text-cyan-500" size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Listos para procesar</h3>
                  <p className="text-slate-400 text-sm">Los datos han sido validados. Se generarán {selectedGasIds.length} machotes únicos.</p>
                </div>
                <button onClick={generateDocuments} className="btn-primary px-12 py-4 text-lg">
                  Lanzar Generación Masiva
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Documentos Listos</h3>
                <p className="text-sm text-slate-400">Se han generado {generatedDocs.length} documentos satisfactoriamente.</p>
              </div>
              <button onClick={downloadAllAsZip} className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-none">
                <Archive size={18} /> Descargar todo (.ZIP)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedDocs.map((doc, idx) => (
                <div key={idx} className="glass-card p-5 border border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl text-blue-400">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white truncate max-w-[200px]">{doc.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Word Document | {Math.round(doc.content.length / 1024)} KB</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => downloadSingleDoc(doc)}
                    className="p-3 bg-white/5 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500 hover:text-white"
                  >
                    <Download size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-8 flex justify-center">
              <button 
                onClick={() => {
                  setStep(1);
                  setGeneratedDocs([]);
                  setSelectedGasIds([]);
                }}
                className="btn-secondary flex items-center gap-2"
              >
                Nueva Generación Masiva
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for missing data */}
      {showMissingForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowMissingForm(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 glass-card p-8 w-full max-w-lg border border-white/10"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Completar Datos Requeridos</h3>
              <button onClick={() => setShowMissingForm(null)} className="text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              {validationResults.find(r => r.gasolineraId === showMissingForm)?.missingFields.map(req => (
                <div key={req.id} className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{req.label}</label>
                  <input 
                    type="text" 
                    className="glass-input w-full" 
                    placeholder={`Ingresa ${req.label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowMissingForm(null)} className="btn-secondary flex-1">Cerrar</button>
              <button 
                onClick={() => {
                  // In a real app we'd save this to Firebase
                  // For now we'll just mock completion to proceed
                  setValidationResults(prev => prev.map(r => 
                    r.gasolineraId === showMissingForm ? { ...r, isValid: true, missingFields: [] } : r
                  ));
                  setShowMissingForm(null);
                }}
                className="btn-primary flex-1"
              >
                Guardar y Validar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
