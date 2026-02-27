import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileText, User, Activity, ShieldCheck, ChevronRight, Loader2, Send } from 'lucide-react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';

export default function Dashboard() {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchConsents = useCallback(async () => {
    try {
      const res = await api.get(`/consents?doctor_id=${user.id}`); 
      setConsents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch consents", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const [resendingPin, setResendingPin] = useState(null);

  const handleResendPin = async (e, consentId) => {
    e.stopPropagation();
    
    setResendingPin(consentId);
    try {
      const res = await api.post(`/consents/${consentId}/send-pin`, {});
      const pin = res.data.pin;
      
      let baseUrl = window.location.origin;
      if (baseUrl.includes('localhost')) {
          baseUrl = import.meta.env.VITE_PUBLIC_URL || 'https://juan-uncorned-janay.ngrok-free.dev';
      }
      const signatureUrl = `${baseUrl}/sign/${consentId}`;
      const phone = '34611716226';
      
      const message = `Olá! Aqui está o link para assinar o seu Termo de Consentimento da clínica:\n\n${signatureUrl}\n\nO seu PIN de acesso é: ${pin}`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');

      // alert("PIN reenviado com sucesso via WhatsApp!");
    } catch (error) {
      console.error("Failed to resend PIN", error);
      alert("Erro ao reenviar PIN");
    } finally {
      setResendingPin(null);
    }
  };

  useEffect(() => {
    if (user?.id) {
        fetchConsents();
    }
  }, [user.id, fetchConsents]);

  const getStatusBadge = (status) => {
    const statusMap = {
      'DRAFT': { text: 'RASCUNHO', className: 'bg-slate-100 text-slate-600 border-slate-200' },
      'PENDING': { text: 'PENDING', className: 'bg-slate-100 text-slate-500 border-slate-200' },
      'AUDITING': { text: 'EM AUDITORIA', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      'APPROVED': { text: 'APPROVED', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      'PENDING_PATIENT': { text: 'AG. PACIENTE', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      'REJECTED': { text: 'REJECTED', className: 'bg-red-50 text-red-600 border-red-200' },
      'SIGNED': { text: 'FINALIZADO', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    };
    const mapped = statusMap[status] || statusMap['DRAFT'];
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${mapped.className}`}>
            {mapped.text}
        </span>
    );
  };

  return (
    <MainLayout title="PAINEL MÉDICO" subtitle="UNIDADE SÃO PAULO" showNewTcle={true}>
        
        {/* Activity Section */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5 text-slate-600" />
                <h2 className="text-sm font-black tracking-widest text-brand-navy uppercase">ATIVIDADES RECENTES</h2>
            </div>
            
            {loading ? (
                <div className="text-center py-12 text-slate-400 font-medium">Sincronizando...</div>
            ) : consents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <ShieldCheck className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Nenhuma blindagem jurídica recente.</p>
                    <button onClick={() => navigate('/new-consent')} className="mt-4 text-brand-navy font-bold hover:underline text-sm uppercase tracking-wide">
                        Gerar primeiro TCLE
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {consents.map(consent => (
                        <div 
                            key={consent.id} 
                            onClick={() => navigate(`/audit/${consent.id}`)}
                            className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm hover:border-brand-100 hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-brand-champagne/40 flex items-center justify-center text-brand-navy shrink-0 group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-brand-navy transition-colors">{consent.procedure_name}</h3>
                                    <p className="text-xs font-bold tracking-wide text-slate-400 uppercase mt-1">
                                        {consent.patient_name || 'Paciente Não Identificado'} • {new Date(consent.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {consent.status === 'PENDING_PATIENT' && (
                                    <button 
                                        onClick={(e) => handleResendPin(e, consent.id)}
                                        disabled={resendingPin === consent.id}
                                        className="hidden md:flex px-4 py-2 text-white bg-blue-600 rounded-lg text-xs font-bold tracking-wide uppercase items-center gap-2 shadow-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {resendingPin === consent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                        Reenviar Documento
                                    </button>
                                )}
                                {getStatusBadge(consent.status)}
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-navy transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    </MainLayout>
  );
}
