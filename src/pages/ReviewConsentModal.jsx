import { useState, useEffect } from 'react';
import Modal from '../components/ui/Modal';
import { Check, FileText, AlertTriangle, CheckCircle, RefreshCw, X, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function ReviewConsentModal({ isOpen, onClose, consent, onApprove, approving }) {
  const [loadingRegen, setLoadingRegen] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [localConsent, setLocalConsent] = useState(consent);

  useEffect(() => {
    setLocalConsent(consent);
  }, [consent]);

  if (!localConsent) return null;

  const handleRegenerate = async () => {
    if (!refinementText.trim()) return;
    setLoadingRegen(true);
    try {
        // Construct payload according to GenerateConsentRequest schema
        const procedureCode = localConsent.clauses?.[0]?.procedure_type || 'unknown'; 
        
        const payload = {
            procedure: procedureCode,
            doctor: {
                name: localConsent.doctor.name,
                crm: localConsent.doctor.crm,
                address: localConsent.doctor.address,
                phone_24h: localConsent.doctor.phone_24h,
                specialties: localConsent.doctor.specialties || []
            },
            patient: {
                name: localConsent.patient.name,
                document_id: localConsent.patient.document_id,
                birth_date: localConsent.patient.birth_date,
                phone_number: localConsent.patient.phone_number || '',
                conditions: localConsent.patient.conditions || []
            },
            medical_note: localConsent.anamnesis_data?.medical_note || null,
            anamnesis: localConsent.anamnesis_data || {},
            annotations: refinementText,
            replaces_consent_id: localConsent.id
        };

        const genRes = await api.post('/consents/generate', payload);
        
        // generate returns { consent_id, status, approved, ... }
        // Fetch the full consent to update the preview with clauses, audit_results, etc.
        const fullRes = await api.get(`/consents/${genRes.data.consent_id}`);
        setLocalConsent(fullRes.data);
        setRefinementText('');
    } catch (err) {
        console.error("Failed to regenerate", err);
        alert("Erro ao regerar documento.");
    } finally {
        setLoadingRegen(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Painel de Blindagem" maxWidth="max-w-[90vw]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[80vh]">
        
        {/* LEFT COLUMN: Paper Preview */}
        <div className="bg-slate-100 rounded-xl p-6 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                    SHA-256: {localConsent.sha256_hash ? localConsent.sha256_hash.substring(0, 16) + '...' : 'PENDING'}
                </div>
                <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                    Rascunho Auditado
                </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* A4-like paper container mirroring pdf_adapter.py template */}
                <div 
                    className="bg-white shadow-lg mx-auto text-[#333]"
                    style={{ 
                        maxWidth: '210mm', 
                        minHeight: '297mm',
                        padding: '2.5cm',
                        fontFamily: "'Helvetica', 'Arial', sans-serif",
                        fontSize: '11pt',
                        lineHeight: '1.5',
                    }}
                >
                    {/* Header — mirrors .header h1 + h3 */}
                    <div className="text-center mb-10">
                        <h1 className="text-base font-bold uppercase tracking-wide mb-2" style={{ fontSize: '16pt' }}>
                            Termo de Consentimento Livre e Esclarecido
                        </h1>
                        <h3 className="text-sm text-slate-600" style={{ fontSize: '13pt' }}>
                            {localConsent.procedure_name}
                        </h3>
                    </div>

                    {/* Doctor Info — mirrors .doctor-info */}
                    <div className="mb-5 p-3 rounded" style={{ backgroundColor: '#f9f9f9' }}>
                        <p><strong>Médico Responsável:</strong> {localConsent.doctor?.name}</p>
                        <p><strong>CRM:</strong> {localConsent.doctor?.crm}</p>
                        <p><strong>Telefone:</strong> {localConsent.doctor?.phone_24h}</p>
                    </div>

                    {/* Patient Info — mirrors .patient-info */}
                    <div className="mb-5 p-3 rounded" style={{ backgroundColor: '#f9f9f9' }}>
                        <p><strong>Paciente:</strong> {localConsent.patient?.name}</p>
                        <p><strong>Documento:</strong> {localConsent.patient?.document_id}</p>
                    </div>

                    {/* Clauses — mirrors .section h2 + template_text */}
                    {localConsent.clauses && localConsent.clauses.length > 0 ? (
                        <div>
                            {localConsent.clauses.map((clause, idx) => (
                                <div key={idx} className="mb-4">
                                    <h2 
                                        className="font-bold mt-5 pb-1 mb-2" 
                                        style={{ fontSize: '13pt', color: '#2c3e50', borderBottom: '1px solid #ccc' }}
                                    >
                                        {clause.title}
                                    </h2>
                                    <div 
                                        className="text-justify"
                                        dangerouslySetInnerHTML={{ 
                                            __html: (clause.template_text || '').replace(/\n/g, '<br>') 
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            Carregando conteúdo do documento...
                        </div>
                    )}

                    {/* Annotations — mirrors pdf_adapter.py conditional section */}
                    {localConsent.annotations && (
                        <div 
                            className="mt-5 p-3 rounded"
                            style={{ backgroundColor: '#f0f7ff', borderLeft: '3px solid #3b82f6' }}
                        >
                            <h2 className="font-bold mb-2" style={{ fontSize: '13pt', color: '#1e40af' }}>
                                Observações do Médico
                            </h2>
                            <div 
                                className="text-justify"
                                dangerouslySetInnerHTML={{ 
                                    __html: localConsent.annotations.replace(/\n/g, '<br>') 
                                }}
                            />
                        </div>
                    )}
                    
                    {/* Signature Block — mirrors .signature-block */}
                    <div className="mt-12" style={{ pageBreakInside: 'avoid' }}>
                        <div className="mx-auto text-center" style={{ width: '80%', borderTop: '1px solid #000', marginTop: '40px', paddingTop: '10px' }}>
                            {localConsent.patient?.name}<br />
                            <span className="text-sm text-slate-500">Paciente (ou Responsável)</span>
                        </div>
                        <div className="mx-auto text-center" style={{ width: '80%', borderTop: '1px solid #000', marginTop: '40px', paddingTop: '10px' }}>
                            {localConsent.doctor?.name}<br />
                            <span className="text-sm text-slate-500">Médico Responsável</span>
                        </div>
                        <div className="text-center mt-5">
                            Data: {new Date().toLocaleDateString('pt-BR')}
                        </div>
                    </div>

                    {/* Footer Hash — mirrors .footer-hash */}
                    <div 
                        className="text-center mt-8 pt-2"
                        style={{ fontFamily: "'Courier New', monospace", fontSize: '8pt', color: '#888', borderTop: '1px dotted #ccc' }}
                    >
                        ID do Documento: {localConsent.id}<br />
                        Cadeia de Custódia (SHA-256): {localConsent.sha256_hash || 'RASCUNHO - SEM VALIDADE JURÍDICA'}
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Sentinel Intelligence */}
        <div className="flex flex-col h-full bg-white pr-2">
            
            {/* Header / Insights */}
            <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-brand-600" />
                    Sentinel Intelligence
                </h2>

                {localConsent.status === 'APPROVED' ? (
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex gap-4 animate-in fade-in duration-500">
                        <div className="bg-teal-100 p-2 rounded-full h-fit text-teal-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-teal-900">Conformidade Verificada</h3>
                            <p className="text-sm text-teal-700 mt-1">
                                Documento aprovado em todos os 10 pilares legais e éticos. Pronto para assinatura.
                            </p>
                        </div>
                    </div>
                ) : (
                   <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4 animate-in fade-in duration-500">
                        <div className="bg-amber-100 p-2 rounded-full h-fit text-amber-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900">Pontos de Atenção</h3>
                            <div className="text-sm text-amber-800 mt-2 space-y-2">
                                {localConsent.audit_results?.filter(r => !r.passed).map((r, i) => (
                                    <p key={i} className="flex gap-2">
                                        <span className="text-amber-500">•</span> {r.finding}
                                    </p>
                                ))}
                                {(!localConsent.audit_results || localConsent.audit_results.length === 0) && (
                                     <p>Nenhuma informação de auditoria disponível.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Refinement Area */}
            <div className="flex-1 flex flex-col min-h-0 mb-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-brand-500" />
                    Ajustar com IA
                </label>
                <textarea 
                    className="flex-1 w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                    placeholder="Descreva ajustes necessários... (Ex: 'O paciente tem diabetes', 'Adicionar risco de hematoma')"
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                />
                <div className="flex justify-end mt-3">
                    <button 
                        onClick={handleRegenerate}
                        disabled={loadingRegen || !refinementText.trim()}
                        className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                        {loadingRegen ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {loadingRegen ? 'Regerando...' : 'Regerar com Ajustes'}
                    </button>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-auto border-t border-slate-100 pt-6 flex justify-between items-center">
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-slate-800 font-medium text-sm px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    Descartar
                </button>
                
                <button
                    onClick={() => onApprove(localConsent.id)}
                    disabled={approving || loadingRegen}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-3 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                >
                    {approving ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin" /> Processando...
                        </>
                    ) : (
                        <>
                            <span>Aprovar e Enviar</span>
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>

        </div>
      </div>
    </Modal>
  );
}
