/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, ShieldCheck, Activity, Clock, CheckCircle, XCircle, Fingerprint, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ConsentView() {
  const { id } = useParams();
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsent();
  }, [id]);

  const fetchConsent = async () => {
    try {
      const res = await api.get(`/consents/${id}`);
      setConsent(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-brand-navy animate-spin" />
    </div>
  );
  if (!consent) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Documento não encontrado.</p>
        </div>
    </div>
  );

  const statusConfig = {
    'SIGNED': { text: 'FINALIZADO', bg: 'bg-emerald-50', text_color: 'text-emerald-700', border: 'border-emerald-200' },
    'PENDING_PATIENT': { text: 'AG. PACIENTE', bg: 'bg-amber-50', text_color: 'text-amber-700', border: 'border-amber-200' },
    'APPROVED': { text: 'APROVADO', bg: 'bg-blue-50', text_color: 'text-blue-700', border: 'border-blue-200' },
    'DRAFT': { text: 'RASCUNHO', bg: 'bg-slate-50', text_color: 'text-slate-600', border: 'border-slate-200' },
  };
  const statusInfo = statusConfig[consent.status] || statusConfig['DRAFT'];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Top Bar — brand-navy */}
      <header className="bg-brand-navy px-8 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
            <div className="bg-brand-champagne text-brand-navy p-2.5 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
                <h1 className="text-lg font-black tracking-tight text-white uppercase">Auditoria de Conformidade</h1>
                <p className="text-brand-champagne/60 font-mono text-[11px] tracking-wide">ID: {consent.id}</p>
            </div>
        </div>
        <span className={`px-4 py-2 rounded-xl font-black text-[10px] tracking-widest uppercase border ${statusInfo.bg} ${statusInfo.text_color} ${statusInfo.border}`}>
            {statusInfo.text}
        </span>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Evidence Card */}
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6 md:p-8">
            <h2 className="text-base font-black mb-6 flex items-center gap-2 text-brand-navy uppercase tracking-wide">
                <Activity className="w-5 h-5 text-brand-champagne" /> Evidências de Assinatura
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Integrity */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Fingerprint className="w-3.5 h-3.5" /> Integridade (Blockchain)
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">SHA-256 Hash</span>
                            <code className="text-xs break-all text-brand-navy bg-white px-3 py-2 rounded-xl border border-slate-200 block font-mono">
                                {consent.sha256_hash || "Pendente"}
                            </code>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Integrity Seal</span>
                            <code className="text-xs break-all text-brand-navy bg-white px-3 py-2 rounded-xl border border-slate-200 block font-mono">
                                {consent.integrity_seal_hash || "Pendente"}
                            </code>
                        </div>
                    </div>
                </div>

                {/* Patient Metadata */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Metadados do Paciente</h3>
                    <ul className="text-sm space-y-3">
                        <li className="flex justify-between border-b border-slate-200 pb-3">
                            <span className="text-slate-500 text-xs font-medium">Data Assinatura</span>
                            <span className="font-bold font-mono text-[11px] text-brand-navy">
                                {consent.patient_signature_date ? new Date(consent.patient_signature_date).toLocaleString() : '—'}
                            </span>
                        </li>
                        <li className="flex justify-between border-b border-slate-200 pb-3">
                            <span className="text-slate-500 text-xs font-medium">Tipo</span>
                            <span className="font-bold text-xs text-brand-navy">{consent.signature_type || '—'}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-slate-500 text-xs font-medium">Score de Risco</span>
                            <span className={`font-black text-sm ${consent.risk_score > 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {consent.risk_score}
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            {consent.signature_image_base64 && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Rubrica Digital Capturada</h3>
                    <div className="border border-slate-200 rounded-2xl p-4 inline-block bg-white shadow-sm">
                        <img src={consent.signature_image_base64} alt="Assinatura" className="h-24 mix-blend-multiply" />
                    </div>
                </div>
            )}
        </div>

        {/* Document Content */}
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6 md:p-8">
             <h2 className="text-base font-black mb-6 flex items-center gap-2 text-brand-navy uppercase tracking-wide">
                <FileText className="w-5 h-5 text-brand-champagne" /> Conteúdo do TCLE
            </h2>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-h-96 overflow-y-auto">
                <h3 className="text-center font-black text-sm mb-6 uppercase tracking-widest text-brand-navy border-b border-slate-200 pb-4">
                    Termo de Consentimento Livre e Esclarecido
                </h3>
                <div className="space-y-4 text-sm text-slate-700 text-justify">
                    <p><strong className="text-brand-navy">Paciente:</strong> {consent.patient.name}</p>
                    <p><strong className="text-brand-navy">Médico:</strong> {consent.doctor.name} (CRM: {consent.doctor.crm})</p>
                    <p><strong className="text-brand-navy">Procedimento:</strong> {consent.procedure_name}</p>
                    
                    <hr className="border-slate-200 my-4"/>
                    
                    {consent.clauses?.map((c, i) => (
                        <div key={i} className="mb-4">
                            <strong className="block text-brand-navy mb-1">{i+1}. {c.title || c.category}</strong>
                            <span className="leading-relaxed">{c.template_text || c.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6 md:p-8">
             <h2 className="text-base font-black mb-6 flex items-center gap-2 text-brand-navy uppercase tracking-wide">
                <Clock className="w-5 h-5 text-brand-champagne" /> Trilha de Auditoria
            </h2>
            <div className="space-y-0 divide-y divide-slate-100">
                {consent.audit_results?.map((audit, i) => (
                    <div key={i} className="flex gap-4 py-4 text-sm hover:bg-slate-50 transition-colors px-3 rounded-xl">
                        <div className="pt-0.5">
                            {audit.passed || audit.is_compliant ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`font-black text-[10px] tracking-widest px-3 py-1 rounded-full uppercase ${
                                    (audit.passed || audit.is_compliant) 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {(audit.passed || audit.is_compliant) ? 'CONFORME' : 'NÃO CONFORME'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Pilar {audit.pillar}
                                </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed">{audit.finding || audit.notes}</p>
                            {audit.suggestion && (
                                <p className="text-xs text-amber-600 mt-1 italic">💡 {audit.suggestion}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
             {!consent.audit_results?.length && (
                <div className="text-center py-10 text-slate-400 italic bg-slate-50 rounded-2xl">
                    Nenhum registro de auditoria encontrado.
                </div>
            )}
        </div>

      </main>
    </div>
  );
}
