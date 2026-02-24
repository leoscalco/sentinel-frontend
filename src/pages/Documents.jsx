import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, FileText, CheckCircle, Clock, ChevronDown, Check, AlertTriangle, Loader2 } from 'lucide-react';
import ReviewConsentModal from './ReviewConsentModal';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

export default function Documents() {
  const [activeTab, setActiveTab] = useState('DRAFT'); // DRAFT, PENDING_PATIENT, SIGNED
  const [consents, setConsents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState(null);
  const [approving, setApproving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
        fetchConsents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, user]);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('doctor_id', user.id);
      
      if (activeTab === 'DRAFT') {
        const statuses = ['DRAFT', 'APPROVED', 'REJECTED', 'AUDITING'];
        statuses.forEach(s => params.append('status', s));
      } else {
        params.append('status', activeTab);
      }

      if (search) params.append('search', search);

      const res = await api.get('/consents', { params });
      setConsents(res.data);
    } catch (error) {
      console.error("Failed to fetch consents", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (consent) => {
    // Fetch full details for audit results
    try {
        const res = await api.get(`/consents/${consent.id}`);
        setSelectedConsent(res.data);
        setIsModalOpen(true);
    } catch (err) {
        console.error("Failed to fetch details", err);
        alert("Erro ao carregar detalhes.");
    }
  };

  const handleApprove = async (consentId) => {
    setApproving(true);
    try {
      // Use dedicated sign/doctor endpoint
      await api.post(`/consents/${consentId}/sign/doctor`, {});
      setIsModalOpen(false);
      fetchConsents(); // Refresh list
    } catch (error) {
      console.error("Failed to approve consent", error);
      alert("Erro ao aprovar TCLE");
    } finally {
      setApproving(false);
    }
  };

  const tabs = [
    { id: 'DRAFT', label: 'Rascunhos', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'PENDING_PATIENT', label: 'Ag. Assinatura', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'SIGNED', label: 'Finalizados', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <MainLayout title="MEUS DOCUMENTOS" subtitle="HISTÓRICO DE BLINDAGEM">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all
                      ${isActive 
                        ? 'bg-white text-brand-navy shadow-sm border border-slate-200' 
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar paciente ou procedimento..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:ring-4 focus:ring-brand-50 focus:border-brand-300 outline-none transition-all placeholder-slate-300 text-slate-700 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            {loading ? (
                <div className="text-center py-16 text-slate-400 font-medium">Sincronizando...</div>
            ) : consents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium tracking-wide">Nenhum documento encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {consents.map((consent) => (
                        <div key={consent.id} className="bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-brand-100 hover:shadow-md transition-all flex justify-between items-center group">
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${tabs.find(t => t.id === consent.status)?.bg || 'bg-slate-50'}`}>
                                    <FileText className={`w-6 h-6 ${tabs.find(t => t.id === consent.status)?.color || 'text-slate-400'}`} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-brand-navy transition-colors">{consent.patient_name}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-400 uppercase mt-1">
                                        <span className="text-brand-Navy">{consent.procedure_name}</span>
                                        <span>•</span>
                                        <span>{new Date(consent.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {['DRAFT', 'APPROVED', 'REJECTED', 'AUDITING'].includes(consent.status) && (
                                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border flex items-center gap-2
                                        ${consent.status === 'APPROVED' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                          consent.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                          consent.status === 'AUDITING' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                          'bg-slate-50 text-slate-600 border-slate-200'}
                                    `}>
                                        {consent.status === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
                                        {consent.status === 'REJECTED' && <AlertTriangle className="w-3.5 h-3.5" />}
                                        {consent.status === 'AUDITING' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        
                                        {consent.status === 'APPROVED' ? 'IA: Pré-aprovado' :
                                         consent.status === 'REJECTED' ? 'IA: Atenção' :
                                         consent.status === 'AUDITING' ? 'IA: Analisando...' :
                                         'Rascunho'}
                                    </div>
                                )}
                                
                                {['DRAFT', 'APPROVED', 'REJECTED'].includes(consent.status) && (
                                    <button 
                                        onClick={() => handleReview(consent)}
                                        className="px-5 py-2.5 bg-brand-navy text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-sm hover:bg-opacity-90 transition-all active:scale-95"
                                    >
                                        Revisar
                                    </button>
                                )}
                                {consent.status === 'PENDING_PATIENT' && (
                                    <span className="px-5 py-2.5 text-blue-700 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold tracking-wide uppercase flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Aguardando
                                    </span>
                                )}
                                {consent.status === 'SIGNED' && (
                                    <button className="px-5 py-2.5 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold tracking-wide uppercase flex items-center gap-2 hover:bg-emerald-100 transition-colors">
                                        <Check className="w-4 h-4" />
                                        Assinado
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <ReviewConsentModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            consent={selectedConsent}
            onApprove={handleApprove}
            approving={approving}
          />
        </div>
    </MainLayout>
  );
}
