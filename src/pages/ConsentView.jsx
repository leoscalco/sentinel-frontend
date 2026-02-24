/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, ShieldCheck, Activity, Clock } from 'lucide-react';
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

  if (loading) return <div className="p-8 text-center">Carregando auditoria...</div>;
  if (!consent) return <div className="p-8 text-center">Documento não encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-brand-600" />
                    Auditoria de Conformidade
                </h1>
                <p className="text-slate-500 font-mono text-sm mt-1">ID: {consent.id}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold border
                ${consent.status === 'SIGNED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
            `}>
                STATUS: {consent.status}
            </div>
        </div>

        {/* Evidence Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                <Activity className="w-5 h-5 text-brand-500" /> Evidências de Assinatura
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Integridade (Blockchain)</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="text-xs text-slate-500 block">SHA-256 HASH</span>
                            <code className="text-xs break-all text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 block">
                                {consent.sha256_hash || "Pendente"}
                            </code>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block">INTEGRITY SEAL</span>
                            <code className="text-xs break-all text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 block">
                                {consent.integrity_seal_hash || "Pendente"}
                            </code>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Metadados do Paciente</h3>
                    <ul className="text-sm space-y-3">
                        <li className="flex justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                            <span className="text-slate-500">Data Assinatura</span>
                            <span className="font-medium font-mono text-xs">
                                {consent.patient_signature_date ? new Date(consent.patient_signature_date).toLocaleString() : '-'}
                            </span>
                        </li>
                        <li className="flex justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                            <span className="text-slate-500">Tipo</span>
                            <span className="font-medium">{consent.signature_type || '-'}</span>
                        </li>
                         <li className="flex justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                            <span className="text-slate-500">Score de Risco</span>
                            <span className={`font-bold ${consent.risk_score > 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {consent.risk_score}
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            {consent.signature_image_base64 && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rubrica Digital Capturada</h3>
                    <div className="border border-slate-200 rounded-lg p-4 inline-block bg-white shadow-sm">
                        <img src={consent.signature_image_base64} alt="Assinatura" className="h-24 mix-blend-multiply" />
                    </div>
                </div>
            )}
        </div>

        {/* Document Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-brand-500" /> Conteúdo do TCLE
            </h2>
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 max-h-96 overflow-y-auto">
                <h3 className="text-center font-bold text-lg mb-6 uppercase tracking-widest text-slate-900 border-b pb-4">
                    Termo de Consentimento Livre e Esclarecido
                </h3>
                <div className="space-y-4 text-sm text-slate-700 text-justify">
                    <p><strong>Paciente:</strong> {consent.patient.name}</p>
                    <p><strong>Médico:</strong> {consent.doctor.name} (CRM: {consent.doctor.crm})</p>
                    <p><strong>Procedimento:</strong> {consent.procedure_name}</p>
                    
                    <hr className="border-slate-200 my-4"/>
                    
                    {consent.clauses?.map((c, i) => (
                        <div key={i} className="mb-4">
                            <strong className="block text-slate-900 mb-1">{i+1}. {c.category}</strong>
                            {c.text}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                <Clock className="w-5 h-5 text-slate-400" /> Trilha de Auditoria (Sentinel Log)
            </h2>
            <div className="space-y-0 divide-y divide-slate-100">
                {consent.audit_results?.map((audit, i) => (
                    <div key={i} className="flex gap-4 py-3 text-sm hover:bg-slate-50 transition-colors px-2 rounded-lg">
                        <div className="min-w-32 text-slate-400 text-xs font-mono pt-1">
                            {new Date(audit.checked_at).toLocaleString()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${audit.is_compliant ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {audit.is_compliant ? 'CONFORME' : 'NÃO CONFORME'}
                                </span>
                            </div>
                            <p className="text-slate-600">{audit.notes}</p>
                        </div>
                    </div>
                ))}
            </div>
             {!consent.audit_results?.length && (
                <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg">
                    Nenhum registro de auditoria encontrado.
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
