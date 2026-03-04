import { useState, useEffect } from 'react';
import { X, FileText, Plus, ShieldCheck, ShieldAlert, ShieldX, Loader2, ChevronRight, User, Phone, Calendar } from 'lucide-react';
import api from '../services/api';

export default function PatientFolder({ patient, onClose, onNewTcle, onViewConsent }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/patients/${patient.id}`);
        setDetail(res.data);
      } catch (err) {
        console.error("Failed to fetch patient detail", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [patient.id]);

  const getShieldBadge = (status) => {
    const map = {
      'SEGURO': { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <ShieldCheck className="w-4 h-4" /> },
      'CUIDADO': { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <ShieldAlert className="w-4 h-4" /> },
      'PERIGO': { cls: 'bg-red-50 text-red-700 border-red-200', icon: <ShieldX className="w-4 h-4" /> },
    };
    const m = map[status] || map['SEGURO'];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${m.cls}`}>
        {m.icon} {status}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'DRAFT': { text: 'RASCUNHO', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
      'PENDING': { text: 'PENDING', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
      'AUDITING': { text: 'AUDITORIA', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      'APPROVED': { text: 'APROVADO', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      'PENDING_PATIENT': { text: 'AG. PACIENTE', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      'REJECTED': { text: 'REJEITADO', cls: 'bg-red-50 text-red-600 border-red-200' },
      'SIGNED': { text: 'FINALIZADO', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    };
    const m = statusMap[status] || statusMap['DRAFT'];
    return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${m.cls}`}>{m.text}</span>;
  };

  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm" />

      {/* Modal */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-brand-navy p-6 pb-5">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-champagne/30 flex items-center justify-center text-brand-champagne font-black text-lg uppercase shrink-0">
              {getInitials(patient.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-black text-lg truncate">{patient.name}</h2>
              <div className="flex items-center gap-4 mt-1.5 text-white/60 text-xs font-bold">
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {patient.document_id}</span>
                {patient.phone_number && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone_number}</span>
                )}
              </div>
              <div className="mt-3">
                {getShieldBadge(detail?.shield_status || patient.shield_status)}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black tracking-widest text-brand-navy uppercase">
                  TCLEs ({detail?.consents?.length || 0})
                </span>
              </div>

              {detail?.consents?.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Nenhum TCLE encontrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {detail?.consents?.map(consent => (
                    <div
                      key={consent.id}
                      onClick={() => onViewConsent(consent.id)}
                      className="p-4 bg-white rounded-xl border-2 border-slate-100 hover:border-brand-champagne hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-brand-navy/30 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-700 truncate group-hover:text-brand-navy transition-colors">
                            {consent.procedure_name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(consent.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(consent.status)}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-navy transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onNewTcle}
            className="w-full bg-brand-navy hover:bg-brand-navy/90 text-brand-champagne font-black tracking-widest uppercase text-xs py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-navy/20"
          >
            <Plus className="w-4 h-4" /> Novo TCLE para este Paciente
          </button>
        </div>
      </div>
    </div>
  );
}
