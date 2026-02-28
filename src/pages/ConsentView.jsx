/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, ShieldCheck, Activity, Clock, CheckCircle, XCircle, Fingerprint, Loader2, Download, User, Stethoscope, CalendarDays, Timer, Globe, Monitor, Lock, Zap, Send } from 'lucide-react';
import api from '../services/api';

export default function ConsentView() {
  const { id } = useParams();
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await api.post(`/consents/${id}/pdf`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TCLE_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF', error);
      alert('Erro ao gerar PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

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
    'SIGNED': { text: 'FINALIZADO', bg: 'bg-emerald-50', text_color: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    'PENDING_PATIENT': { text: 'AG. PACIENTE', bg: 'bg-amber-50', text_color: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    'APPROVED': { text: 'APROVADO', bg: 'bg-blue-50', text_color: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    'DRAFT': { text: 'RASCUNHO', bg: 'bg-slate-50', text_color: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
    'REJECTED': { text: 'REJEITADO', bg: 'bg-red-50', text_color: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    'AUDITING': { text: 'AUDITANDO', bg: 'bg-indigo-50', text_color: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  };
  const statusInfo = statusConfig[consent.status] || statusConfig['DRAFT'];

  // Calculate time between doctor and patient signatures
  const formatDate = (d) => d ? new Date(d).toLocaleString('pt-BR') : null;
  const getTimeDiff = (start, end) => {
    if (!start || !end) return null;
    const diff = new Date(end) - new Date(start);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h ${mins % 60}min`;
    if (hours > 0) return `${hours}h ${mins % 60}min`;
    return `${mins}min`;
  };

  const timeToSign = getTimeDiff(consent.doctor_signature_date, consent.patient_signature_date);
  const timeFromCreation = getTimeDiff(consent.created_at, consent.patient_signature_date || consent.doctor_signature_date);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Top Bar */}
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
        <div className="flex items-center gap-3">
            <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-5 py-2.5 bg-brand-champagne text-brand-navy rounded-xl text-xs font-black tracking-widest uppercase flex items-center gap-2 hover:bg-brand-champagne/80 transition-colors disabled:opacity-50 shadow-sm"
            >
                {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Baixar PDF
            </button>
            <span className={`px-4 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase border flex items-center gap-2 ${statusInfo.bg} ${statusInfo.text_color} ${statusInfo.border}`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                {statusInfo.text}
            </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ═══ TIMELINE DO DOCUMENTO ═══ */}
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6 md:p-8">
            <h2 className="text-base font-black mb-6 flex items-center gap-2 text-brand-navy uppercase tracking-wide">
                <CalendarDays className="w-5 h-5 text-brand-champagne" /> Linha do Tempo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Criação */}
                <div className="relative flex flex-col items-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                        <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Criação</p>
                    <p className="text-xs font-bold text-brand-navy">{formatDate(consent.created_at)}</p>
                </div>

                {/* Assinatura Médico */}
                <div className={`relative flex flex-col items-center text-center p-4 rounded-2xl border ${consent.doctor_signature_date ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${consent.doctor_signature_date ? 'bg-blue-200' : 'bg-slate-200'}`}>
                        <Stethoscope className={`w-5 h-5 ${consent.doctor_signature_date ? 'text-blue-700' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assinatura Médico</p>
                    <p className={`text-xs font-bold ${consent.doctor_signature_date ? 'text-blue-700' : 'text-slate-400'}`}>
                        {formatDate(consent.doctor_signature_date) || 'Pendente'}
                    </p>
                </div>

                {/* Assinatura Paciente */}
                <div className={`relative flex flex-col items-center text-center p-4 rounded-2xl border ${consent.patient_signature_date ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${consent.patient_signature_date ? 'bg-emerald-200' : 'bg-slate-200'}`}>
                        <User className={`w-5 h-5 ${consent.patient_signature_date ? 'text-emerald-700' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assinatura Paciente</p>
                    <p className={`text-xs font-bold ${consent.patient_signature_date ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {formatDate(consent.patient_signature_date) || 'Pendente'}
                    </p>
                </div>

                {/* Tempo/Status Final */}
                <div className={`relative flex flex-col items-center text-center p-4 rounded-2xl border ${consent.status === 'SIGNED' ? 'bg-brand-champagne/20 border-brand-champagne' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${consent.status === 'SIGNED' ? 'bg-brand-champagne' : 'bg-slate-200'}`}>
                        <Timer className={`w-5 h-5 ${consent.status === 'SIGNED' ? 'text-brand-navy' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tempo Total</p>
                    <p className={`text-xs font-bold ${consent.status === 'SIGNED' ? 'text-brand-navy' : 'text-slate-400'}`}>
                        {timeFromCreation || 'Em andamento'}
                    </p>
                    {timeToSign && (
                        <p className="text-[10px] text-slate-400 mt-1">Paciente: {timeToSign} após aprovação</p>
                    )}
                </div>
            </div>
        </div>

        {/* ═══ INFORMAÇÕES DO DOCUMENTO ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Médico */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Stethoscope className="w-3.5 h-3.5" /> Médico Responsável
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Nome</span>
                        <span className="text-sm font-bold text-brand-navy">{consent.doctor.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-500">CRM</span>
                        <span className="text-sm font-bold text-brand-navy font-mono">{consent.doctor.crm}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-500">Procedimento</span>
                        <span className="text-sm font-bold text-brand-navy">{consent.procedure_name}</span>
                    </div>
                </div>
            </div>

            {/* Paciente */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Paciente
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Nome</span>
                        <span className="text-sm font-bold text-brand-navy">{consent.patient.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-500">Documento</span>
                        <span className="text-sm font-bold text-brand-navy font-mono">{consent.patient.document_id}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-500">Método de Assinatura</span>
                        <span className={`text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full border ${
                            consent.signature_type === 'GOVBR' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                            {consent.signature_type || '—'}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* ═══ EVIDÊNCIAS DE INTEGRIDADE ═══ */}
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6 md:p-8">
            <h2 className="text-base font-black mb-6 flex items-center gap-2 text-brand-navy uppercase tracking-wide">
                <Fingerprint className="w-5 h-5 text-brand-champagne" /> Integridade e Criptografia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-black uppercase tracking-widest mb-2">SHA-256 Hash do Documento</span>
                    <code className="text-xs break-all text-brand-navy bg-white px-3 py-2.5 rounded-xl border border-slate-200 block font-mono leading-relaxed">
                        {consent.sha256_hash || "Pendente — documento ainda não foi finalizado"}
                    </code>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-black uppercase tracking-widest mb-2">Selo de Integridade</span>
                    <code className="text-xs break-all text-brand-navy bg-white px-3 py-2.5 rounded-xl border border-slate-200 block font-mono leading-relaxed">
                        {consent.integrity_seal_hash || "Pendente — assinatura do paciente necessária"}
                    </code>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Zap className="w-5 h-5 text-brand-champagne mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score de Risco</p>
                    <p className={`text-2xl font-black mt-1 ${consent.risk_score > 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {consent.risk_score}
                    </p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Send className="w-5 h-5 text-brand-champagne mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p>
                    <p className={`text-sm font-black mt-2 ${consent.sent_via_whatsapp ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {consent.sent_via_whatsapp ? '✓ Enviado' : 'Não enviado'}
                    </p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Lock className="w-5 h-5 text-brand-champagne mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo Assinatura</p>
                    <p className="text-sm font-black mt-2 text-brand-navy">
                        {consent.signature_type || '—'}
                    </p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Activity className="w-5 h-5 text-brand-champagne mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logs</p>
                    <p className="text-2xl font-black mt-1 text-brand-navy">
                        {consent.signature_logs?.length || 0}
                    </p>
                </div>
            </div>
        </div>

        {/* ═══ REGISTROS DE ASSINATURA (LOGS) ═══ */}
        {consent.signature_logs?.length > 0 && (
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6 md:p-8">
            <h2 className="text-base font-black mb-6 flex items-center gap-2 text-brand-navy uppercase tracking-wide">
                <Activity className="w-5 h-5 text-brand-champagne" /> Registros de Assinatura Digital
            </h2>
            <div className="space-y-4">
                {consent.signature_logs.map((log, i) => (
                    <div key={i} className={`p-5 rounded-2xl border ${log.signer_type === 'DOCTOR' ? 'bg-blue-50/50 border-blue-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${log.signer_type === 'DOCTOR' ? 'bg-blue-200' : 'bg-emerald-200'}`}>
                                    {log.signer_type === 'DOCTOR' 
                                        ? <Stethoscope className="w-4 h-4 text-blue-700" />
                                        : <User className="w-4 h-4 text-emerald-700" />
                                    }
                                </div>
                                <div>
                                    <p className="text-xs font-black text-brand-navy uppercase tracking-wider">
                                        {log.signer_type === 'DOCTOR' ? 'Assinatura do Médico' : 'Assinatura do Paciente'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono">{log.signature_provider}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full border ${
                                log.signer_type === 'DOCTOR' 
                                    ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}>
                                ✓ Registrado
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-xs">
                                <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-slate-500">Data/Hora:</span>
                                <span className="font-bold text-brand-navy font-mono text-[11px]">{formatDate(log.created_at)}</span>
                            </div>
                            {log.metadata_snapshot?.ip && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-slate-500">Endereço IP:</span>
                                    <span className="font-bold text-brand-navy font-mono text-[11px]">{log.metadata_snapshot.ip}</span>
                                </div>
                            )}
                            {log.metadata_snapshot?.agent && (
                                <div className="flex items-center gap-2 text-xs md:col-span-2">
                                    <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-slate-500">Navegador:</span>
                                    <span className="font-bold text-brand-navy text-[11px] truncate">{log.metadata_snapshot.agent}</span>
                                </div>
                            )}
                            {log.metadata_snapshot?.time_on_page && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Timer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-slate-500">Tempo na Página:</span>
                                    <span className="font-bold text-brand-navy">{Math.round(log.metadata_snapshot.time_on_page)}s</span>
                                </div>
                            )}
                            {log.metadata_snapshot?.crm && (
                                <div className="flex items-center gap-2 text-xs">
                                    <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-slate-500">CRM:</span>
                                    <span className="font-bold text-brand-navy font-mono">{log.metadata_snapshot.crm}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-200/50">
                            <span className="text-[10px] text-slate-400 font-mono">Log ID: {log.id}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        )}

        {/* ═══ RUBRICA DIGITAL ═══ */}
        {consent.signature_image_base64 && (
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6 md:p-8">
                <h2 className="text-base font-black mb-6 flex items-center gap-2 text-brand-navy uppercase tracking-wide">
                    <Fingerprint className="w-5 h-5 text-brand-champagne" /> Rubrica Digital Capturada
                </h2>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 inline-block bg-white">
                    <img src={consent.signature_image_base64} alt="Assinatura" className="h-28 mix-blend-multiply" />
                </div>
            </div>
        )}

        {/* ═══ CONTEÚDO DO TCLE ═══ */}
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

        {/* ═══ AUDITORIA IA ═══ */}
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6 md:p-8">
             <h2 className="text-base font-black mb-6 flex items-center gap-2 text-brand-navy uppercase tracking-wide">
                <Clock className="w-5 h-5 text-brand-champagne" /> Auditoria de Conformidade (IA)
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
                                    {audit.pillar}
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
