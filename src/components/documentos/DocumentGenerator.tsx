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
  Archive,
  RefreshCcw,
  Zap,
} from 'lucide-react';
import { Gasolinera, Plantilla, RequerimientoDato, TipoReporte } from '../../types';
import { PLANTILLAS_ESTANDAR, COLORES_REPORTE, ETIQUETAS_REPORTE } from '../../constants/plantillas';
import { generateReporteAmbiental, FALLBACK_MARKER } from '../../services/geminiService';
import { resolverReportesAplicables } from '../../services/reportResolver';
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

const STEP_LABELS = ['Plantilla', 'Validación', 'Generación', 'Descarga'];

export default function DocumentGenerator({ gasolineras }: DocumentGeneratorProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Plantilla | null>(null);
  const [selectedGasIds, setSelectedGasIds] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<{ name: string; content: string; isFallback?: boolean }[]>([]);
  const [showMissingForm, setShowMissingForm] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleToggleGas = (id: string) => {
    setSelectedGasIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const validateSelection = async () => {
    if (!selectedTemplate) return;
    setIsValidating(true);
    await new Promise(r => setTimeout(r, 600));

    const results = selectedGasIds.map(id => {
      const gas = gasolineras.find(g => g.id === id);
      const missing = selectedTemplate.campos_requeridos.filter(req => {
        if (!gas) return true;
        const val = gas[req.field as keyof Gasolinera];
        return val === undefined || val === null || val === '';
      });
      return { gasolineraId: id, missingFields: missing, isValid: missing.length === 0 };
    });

    setValidationResults(results);
    setIsValidating(false);
    if (results.every(r => r.isValid)) setStep(3);
  };

  const INTER_REQUEST_DELAY_MS = 13000; // stay under 5 req/min free-tier limit

  const generateDocuments = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);
    const docs: { name: string; content: string }[] = [];

    try {
      for (let i = 0; i < selectedGasIds.length; i++) {
        const gas = gasolineras.find(g => g.id === selectedGasIds[i]);
        if (!gas) continue;

        if (i > 0) await new Promise(r => setTimeout(r, INTER_REQUEST_DELAY_MS));

        const raw = await generateReporteAmbiental(selectedTemplate.id as TipoReporte, gas);
        const isFallback = raw.startsWith(FALLBACK_MARKER);
        const content = isFallback ? raw.slice(FALLBACK_MARKER.length) : raw;
        docs.push({
          name: `${isFallback ? 'BORRADOR_' : ''}${ETIQUETAS_REPORTE[selectedTemplate.id] ?? selectedTemplate.nombre}_${gas.razon_social.replace(/\s+/g, '_')}.docx`,
          content,
          isFallback,
        });
        setGenerationProgress(Math.round(((i + 1) / selectedGasIds.length) * 100));
      }
      setGeneratedDocs(docs);
      setStep(4);
    } catch (error: unknown) {
      const msg = (error as any)?.message ?? String(error);
      const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
      const retryMatch = msg.match(/"retryDelay":"(\d+)s"/);
      const retrySecs = retryMatch ? retryMatch[1] : null;

      if (is429) {
        const quotaExhausted = msg.includes('limit: 0');
        setGenerationError(
          quotaExhausted
            ? 'Cuota diaria de la API de Gemini agotada. Activa facturación en Google AI Studio o espera hasta mañana para que se restablezca.'
            : `Límite de solicitudes por minuto alcanzado.${retrySecs ? ` Reintentando automáticamente en ${retrySecs}s…` : ' Intenta de nuevo en 1 minuto.'}`
        );
      } else {
        setGenerationError('Error al conectar con la API de Gemini. Revisa tu clave API y conexión.');
      }
      if (docs.length > 0) {
        setGeneratedDocs(docs);
        setStep(4);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const createDocxBlob = async (text: string, title: string) => {
    const sections = text.split('\n\n').filter(Boolean);
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...sections.map(s => new Paragraph({
            children: [new TextRun(s)],
            spacing: { after: 200 },
          })),
        ],
      }],
    });
    return await Packer.toBlob(doc);
  };

  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    for (const doc of generatedDocs) {
      const blob = await createDocxBlob(doc.content, doc.name.replace('.docx', ''));
      zip.file(doc.name, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `Reportes_${selectedTemplate?.nombre_corto ?? 'Kenzly'}.zip`);
  };

  const downloadSingleDoc = async (doc: { name: string; content: string }) => {
    const blob = await createDocxBlob(doc.content, doc.name.replace('.docx', ''));
    saveAs(blob, doc.name);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 80 }} className="space-y-8">
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileText size={28} color="var(--primary)" />
          Generador de Reportes
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Genera reportes ambientales oficiales (MISSE, IP, MIA-P, RGRP) con contenido redactado por IA.
        </p>
      </div>

      {/* Stepper */}
      <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                background: isActive ? 'var(--primary)' : isDone ? 'var(--success)' : 'rgba(255,255,255,0.06)',
                color: isActive || isDone ? '#fff' : 'var(--text-muted)',
                boxShadow: isActive ? '0 0 18px rgba(26,109,255,0.5)' : 'none',
              }}>
                {isDone ? <CheckCircle2 size={16} /> : num}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
                color: isActive ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--text-muted)',
                display: 'none',
              }} className="hidden md:block">
                {label}
              </span>
              {num < 4 && <div style={{ height: 1, width: 40, background: 'var(--border-glass)' }} className="hidden md:block" />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Template + Stations */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Template selector */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                  1. Tipo de reporte
                </p>
                <div className="space-y-3">
                  {PLANTILLAS_ESTANDAR.map(plantilla => {
                    const colors = COLORES_REPORTE[plantilla.id];
                    const isSelected = selectedTemplate?.id === plantilla.id;
                    return (
                      <button
                        key={plantilla.id}
                        onClick={() => setSelectedTemplate(plantilla)}
                        className="glass-card"
                        style={{
                          width: '100%', padding: '16px 20px', textAlign: 'left',
                          border: isSelected ? `1px solid ${colors.border}` : '1px solid var(--border-glass)',
                          background: isSelected ? colors.bg : undefined,
                          cursor: 'pointer', transition: 'all 0.18s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: isSelected ? colors.text : 'var(--text-primary)', fontSize: 14 }}>
                            {plantilla.nombre_corto}
                          </span>
                          {isSelected && <CheckCircle2 size={16} color={colors.text} />}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                          {plantilla.autoridad}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0', fontWeight: 600 }}>
                          {plantilla.tiempo_resolucion}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Station selector */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                  2. Estaciones ({selectedGasIds.length} seleccionadas)
                </p>
                <div className="glass-card" style={{ maxHeight: 420, overflowY: 'auto', padding: 8 }}>
                  {gasolineras.length === 0 && (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      Sin estaciones registradas
                    </div>
                  )}
                  {gasolineras.map(gas => {
                    const aplicables = resolverReportesAplicables(gas);
                    const isCompatible = !selectedTemplate || aplicables.includes(selectedTemplate.id as TipoReporte);
                    const isSelected = selectedGasIds.includes(gas.id);
                    return (
                      <button
                        key={gas.id}
                        onClick={() => handleToggleGas(gas.id)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                          borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
                          background: isSelected ? 'var(--primary-dim)' : undefined,
                          marginBottom: 4, textAlign: 'left',
                          border: isSelected ? '1px solid var(--primary-glow)' : '1px solid transparent',
                          opacity: selectedTemplate && !isCompatible ? 0.45 : 1,
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
                          background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <CheckCircle2 size={11} color="#fff" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {gas.razon_social}
                          </p>
                          <p className="font-mono-kenzly" style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px' }}>{gas.rfc}</p>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {aplicables.map(tipo => {
                              const c = COLORES_REPORTE[tipo];
                              return (
                                <span key={tipo} style={{
                                  fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                                  background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                                  letterSpacing: '0.4px', textTransform: 'uppercase',
                                }}>
                                  {ETIQUETAS_REPORTE[tipo]}
                                </span>
                              );
                            })}
                            {aplicables.length === 0 && (
                              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin tipo de proyecto</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedTemplate && (
              <div style={{ padding: '12px 18px', background: 'var(--primary-dim)', borderRadius: 10, border: '1px solid var(--primary-glow)', fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--primary)' }}>{selectedTemplate.nombre}</strong>
                {' — '}{selectedTemplate.fundamento_legal}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedTemplate || selectedGasIds.length === 0}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: (!selectedTemplate || selectedGasIds.length === 0) ? 0.4 : 1 }}
              >
                Continuar a Validación <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Validation */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Validación de Datos</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Verificando campos requeridos para: <strong style={{ color: 'var(--text-secondary)' }}>{selectedTemplate?.nombre}</strong>
                </p>
              </div>
              <button
                onClick={validateSelection}
                disabled={isValidating}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
              >
                {isValidating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
                {validationResults.length === 0 ? 'Iniciar Validación' : 'Re-validar'}
              </button>
            </div>

            {validationResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {validationResults.map(res => {
                  const gas = gasolineras.find(g => g.id === res.gasolineraId)!;
                  return (
                    <div key={res.gasolineraId} className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: res.isValid ? 'var(--success-dim)' : 'var(--warning-dim)',
                        }}>
                          {res.isValid
                            ? <CheckCircle2 size={22} color="var(--success)" />
                            : <AlertCircle size={22} color="var(--warning)" />}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px', fontSize: 14 }}>{gas.razon_social}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                            {res.isValid ? 'Todos los campos completos' : `${res.missingFields.length} campo${res.missingFields.length > 1 ? 's' : ''} faltante${res.missingFields.length > 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>

                      {!res.isValid && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
                            {res.missingFields.slice(0, 4).map(f => (
                              <span key={f.id} title={f.label} style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                background: 'var(--warning-dim)', color: 'var(--warning)',
                                textTransform: 'uppercase', letterSpacing: '0.4px',
                              }}>
                                {f.id.slice(0, 3).toUpperCase()}
                              </span>
                            ))}
                            {res.missingFields.length > 4 && (
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{res.missingFields.length - 4}</span>
                            )}
                          </div>
                          <button
                            onClick={() => setShowMissingForm(res.gasolineraId)}
                            style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Rellenar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--border-glass)' }}>
              <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={validationResults.length === 0 || !validationResults.every(r => r.isValid)}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: (validationResults.length === 0 || !validationResults.every(r => r.isValid)) ? 0.4 : 1 }}
              >
                Generar Reportes <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Generate */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass-card"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', minHeight: 300 }}
          >
            {generationError && (
              <div style={{ width: '100%', maxWidth: 560, marginBottom: 32, padding: '16px 20px', borderRadius: 12, background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0, lineHeight: 1.5 }}>{generationError}</p>
              </div>
            )}
            {isGenerating ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
                  <Loader2 className="animate-spin" size={64} color="var(--primary)" />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={24} color="var(--primary)" fill="var(--primary)" />
                  </div>
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>IA redactando…</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 4px' }}>
                  Reporte {Math.min(Math.ceil(generationProgress / (100 / selectedGasIds.length)), selectedGasIds.length)} de {selectedGasIds.length} — {generationProgress}% completado
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 20px', opacity: 0.7 }}>
                  Pausando 13s entre solicitudes (límite API: 5/min)
                </p>
                <div style={{ width: 240, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', margin: '0 auto' }}>
                  <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 4, width: `${generationProgress}%`, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary-dim)', border: '1px solid var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <FileText size={32} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>Listos para procesar</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 32px' }}>
                  Se generarán <strong style={{ color: 'var(--text-secondary)' }}>{selectedGasIds.length}</strong> reporte{selectedGasIds.length > 1 ? 's' : ''} de tipo <strong style={{ color: 'var(--primary)' }}>{selectedTemplate?.nombre_corto}</strong>.
                </p>
                <button onClick={generateDocuments} className="btn-primary" style={{ padding: '14px 48px', fontSize: 15 }}>
                  Lanzar Generación Masiva
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4: Download */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Reportes Listos</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  {generatedDocs.length} documento{generatedDocs.length > 1 ? 's' : ''} generado{generatedDocs.length > 1 ? 's' : ''} satisfactoriamente.
                </p>
              </div>
              <button onClick={downloadAllAsZip} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <Archive size={16} /> Descargar ZIP
              </button>
            </div>

            {generatedDocs.some(d => d.isFallback) && (
              <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: 'var(--warning)', margin: 0, lineHeight: 1.6 }}>
                  <strong>Cuota API agotada.</strong> Los documentos marcados con "BORRADOR_" contienen la estructura y datos reales pero sin redacción por IA.
                  Activa facturación en <strong>aistudio.google.com</strong> o espera al restablecimiento de cuota (medianoche hora del Pacífico) y regenera.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="glass-card"
                  style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, transition: 'border 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ padding: 12, background: 'var(--primary-dim)', borderRadius: 10, border: '1px solid var(--primary-glow)' }}>
                      <FileText size={22} color="var(--primary)" />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 3px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.name}
                      </p>
                      <p className="font-mono-kenzly" style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 4px' }}>
                        DOCX · ~{Math.max(1, Math.round(doc.content.length / 1024))} KB
                      </p>
                      {doc.isFallback && (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                          Borrador sin IA
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadSingleDoc(doc)}
                    style={{ padding: 10, borderRadius: 8, background: 'var(--primary-dim)', border: '1px solid var(--primary-glow)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Download size={16} color="var(--primary)" />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
              <button
                onClick={() => { setStep(1); setGeneratedDocs([]); setSelectedGasIds([]); setValidationResults([]); setGenerationProgress(0); setGenerationError(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Nueva Generación
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: fill missing fields */}
      {showMissingForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={() => setShowMissingForm(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ position: 'relative', zIndex: 10, padding: 32, width: '100%', maxWidth: 480 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Completar Datos Requeridos</h3>
              <button onClick={() => setShowMissingForm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
              {validationResults.find(r => r.gasolineraId === showMissingForm)?.missingFields.map(req => (
                <div key={req.id}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>
                    {req.label}
                  </label>
                  <input type="text" className="glass-input" style={{ width: '100%' }} placeholder={`Ingresa ${req.label.toLowerCase()}`} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowMissingForm(null)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Cerrar
              </button>
              <button
                onClick={() => {
                  setValidationResults(prev => prev.map(r =>
                    r.gasolineraId === showMissingForm ? { ...r, isValid: true, missingFields: [] } : r
                  ));
                  setShowMissingForm(null);
                }}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Marcar Completo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
