import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, FileText, CheckCircle, Clock, ChevronDown, Check, AlertTriangle, Loader2 } from 'lucide-react';
import ReviewConsentModal from './ReviewConsentModal';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Documentos</h1>
        <p className="text-slate-500 mt-2">Acompanhe o status e gerencie os TCLEs gerados.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por paciente, CPF ou procedimento..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
            <div className="text-center py-12 text-slate-400">Carregando...</div>
        ) : consents.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500">Nenhum documento encontrado.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {consents.map((consent) => (
                    <div key={consent.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-brand-200 hover:shadow-sm transition-all flex justify-between items-center group">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${tabs.find(t => t.id === consent.status)?.bg || 'bg-slate-50'}`}>
                                <FileText className={`w-6 h-6 ${tabs.find(t => t.id === consent.status)?.color || 'text-slate-400'}`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{consent.patient_name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                    <span className="font-medium text-slate-700">{consent.procedure_name}</span>
                                    <span>•</span>
                                    <span>{new Date(consent.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Dr. {consent.doctor_name}</span>
                                </div>
                            </div>
                        </div>

                            <div className="flex items-center gap-3">
                                {['DRAFT', 'APPROVED', 'REJECTED', 'AUDITING'].includes(consent.status) && (
                                     <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5
                                        ${consent.status === 'APPROVED' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                          consent.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                          consent.status === 'AUDITING' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                          'bg-slate-50 text-slate-600 border-slate-100'}
                                     `}>
                                        {consent.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                                        {consent.status === 'REJECTED' && <AlertTriangle className="w-3 h-3" />}
                                        {consent.status === 'AUDITING' && <Loader2 className="w-3 h-3 animate-spin" />}
                                        
                                        {consent.status === 'APPROVED' ? 'IA: Pré-aprovado' :
                                         consent.status === 'REJECTED' ? 'IA: Atenção' :
                                         consent.status === 'AUDITING' ? 'IA: Analisando...' :
                                         'Rascunho'}
                                     </div>
                                )}
                                
                                {['DRAFT', 'APPROVED', 'REJECTED'].includes(consent.status) && (
                                    <button 
                                        onClick={() => handleReview(consent)}
                                        className="px-4 py-2 bg-brand-50 text-brand-700 rounded-lg text-sm font-semibold hover:bg-brand-100 transition-colors"
                                    >
                                        Revisar
                                    </button>
                                )}
                                 {consent.status === 'PENDING_PATIENT' && (
                                <span className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Aguardando
                                </span>
                            )}
                            {consent.status === 'SIGNED' && (
                                <button className="px-4 py-2 text-emerald-600 bg-emerald-50 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-100 transition-colors">
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
  );
}
