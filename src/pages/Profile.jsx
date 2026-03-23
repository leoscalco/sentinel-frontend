import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, CheckCircle, AlertCircle, Plus, User, ArrowLeft } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const [specialties, setSpecialties] = useState([]);
    const [procedures, setProcedures] = useState([]);
    
    // Fallback to empty context if missing
    const [selectedSpecialties, setSelectedSpecialties] = useState(user?.specialties || []);
    const [selectedProcedures, setSelectedProcedures] = useState(user?.procedures || []);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        crm: user?.crm || '',
        address: user?.address || '',
        phone_24h: user?.phone_24h || ''
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Feature Request State
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestData, setRequestData] = useState({ type: 'SPECIALTY', name: '', description: '' });
    const [requestSuccess, setRequestSuccess] = useState(false);

    const fetchSpecialties = async () => {
        try {
            const res = await api.get('/onboarding/specialties');
            setSpecialties(res.data);
        } catch (err) {
            console.error("Failed to load specialties", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProcedures = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            selectedSpecialties.forEach(id => params.append('specialty_id', id));
            const res = await api.get('/onboarding/procedures', { params });
            setProcedures(res.data);
            
            // Clean up stranded selected procedures whose specialty was unselected
            const validIds = new Set(res.data.map(p => p.id));
            setSelectedProcedures(prev => prev.filter(id => validIds.has(id)));
        } catch (err) {
            console.error("Failed to load procedures", err);
        }
    }, [selectedSpecialties]);

    useEffect(() => {
        fetchSpecialties();
    }, []);

    useEffect(() => {
        if (selectedSpecialties.length > 0) {
            fetchProcedures();
        } else {
            setProcedures([]);
            setSelectedProcedures([]);
        }
    }, [selectedSpecialties, fetchProcedures]);

    const toggleSpecialty = (id) => {
        setSelectedSpecialties(prev => 
            prev.includes(id) ? prev.filter(curr => curr !== id) : [...prev, id]
        );
    };

    const toggleProcedure = (id) => {
        setSelectedProcedures(prev => 
            prev.includes(id) ? prev.filter(curr => curr !== id) : [...prev, id]
        );
    };

    const handleSaveProfile = async () => {
        if (selectedSpecialties.length === 0 || selectedProcedures.length === 0) {
            alert("Selecione pelo menos uma especialidade e um procedimento.");
            return;
        }
        if (!formData.name || !formData.crm || !formData.address || !formData.phone_24h) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        setSaving(true);
        try {
            const res = await api.put('/auth/me', {
                ...formData,
                specialty_ids: selectedSpecialties,
                procedure_ids: selectedProcedures
            });
            updateUser(res.data); // Update context with fresh user object
            alert("Perfil atualizado com sucesso!");
            navigate('/dashboard');
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Erro ao atualizar perfil.");
        } finally {
            setSaving(false);
        }
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();
        try {
            await api.post('/onboarding/requests', {
                request_type: requestData.type,
                name: requestData.name,
                description: requestData.description || null
            });
            setRequestSuccess(true);
            setTimeout(() => {
                setShowRequestForm(false);
                setRequestSuccess(false);
                setRequestData({ type: 'SPECIALTY', name: '', description: '' });
            }, 3000);
        } catch (err) {
            console.error("Failed to send request", err);
            alert("Erro ao enviar solicitação.");
        }
    };

    if (loading) return (
       <MainLayout title="MEU PERFIL" subtitle="CONFIGURAÇÕES DA CONTA">
           <div className="flex h-64 items-center justify-center text-slate-400 font-medium">Carregando...</div>
       </MainLayout>
    );

    return (
       <MainLayout title="MEU PERFIL" subtitle="DADOS E PREFERÊNCIAS MÉDICAS" showNewTcle={true}>
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Personal Info */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-brand-navy"/> Informações Pessoais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Nome Completo</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-50 focus:border-brand-navy outline-none transition-all placeholder-slate-300 bg-slate-50 focus:bg-white" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">CRM</label>
                            <input type="text" value={formData.crm} onChange={e => setFormData({...formData, crm: e.target.value})} className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-50 focus:border-brand-navy outline-none transition-all placeholder-slate-300 bg-slate-50 focus:bg-white" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Endereço de Atendimento</label>
                            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-50 focus:border-brand-navy outline-none transition-all placeholder-slate-300 bg-slate-50 focus:bg-white" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Telefone (24h/Emergência)</label>
                            <input type="text" value={formData.phone_24h} onChange={e => setFormData({...formData, phone_24h: e.target.value})} className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-50 focus:border-brand-navy outline-none transition-all placeholder-slate-300 bg-slate-50 focus:bg-white" required />
                        </div>
                    </div>
                </section>

                {/* Specialties Section */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold flex items-center gap-3 mb-6 text-slate-800">
                        <span className="bg-brand-navy text-white rounded-xl w-8 h-8 flex items-center justify-center text-sm shadow-sm">1</span> 
                        Especialidades Médicas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {specialties.map(spec => (
                            <button
                                key={spec.id}
                                onClick={() => toggleSpecialty(spec.id)}
                                className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 text-sm ${
                                    selectedSpecialties.includes(spec.id) 
                                    ? 'border-brand-navy bg-brand-champagne/30 text-brand-navy shadow-sm font-bold' 
                                    : 'border-slate-100 bg-slate-50 hover:border-brand-navy/30 text-slate-600 font-medium'
                                }`}
                            >
                                {spec.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Procedures Section */}
                {selectedSpecialties.length > 0 && (
                    <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h3 className="text-lg font-bold flex items-center gap-3 mb-6 text-slate-800">
                            <span className="bg-brand-navy text-white rounded-xl w-8 h-8 flex items-center justify-center text-sm shadow-sm">2</span> 
                            Procedimentos Realizados
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {procedures.map(proc => (
                                <button
                                    key={proc.id}
                                    onClick={() => toggleProcedure(proc.id)}
                                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                                        selectedProcedures.includes(proc.id)
                                        ? 'border-brand-navy bg-brand-navy text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                    }`}
                                >
                                    {proc.name}
                                </button>
                            ))}
                            {procedures.length === 0 && <span className="text-sm text-slate-400 italic">Nenhum procedimento encontrado.</span>}
                        </div>
                    </section>
                )}

                {/* Not Found / Request Form */}
                <section className="pt-2">
                    {!showRequestForm ? (
                        <button 
                            onClick={() => setShowRequestForm(true)}
                            className="text-slate-500 text-sm font-bold tracking-wide uppercase hover:text-brand-navy flex items-center gap-2 transition"
                        >
                            <AlertCircle className="w-4 h-4" /> Solicitar inclusão no motor da IA
                        </button>
                    ) : (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                            {requestSuccess ? (
                                <div className="flex flex-col items-center justify-center py-6 text-emerald-600">
                                    <CheckCircle className="w-12 h-12 mb-3" />
                                    <p className="font-bold text-lg">Solicitação enviada com sucesso!</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSendRequest} className="space-y-6">
                                    <h4 className="font-bold flex items-center gap-2 mb-2 text-slate-800"><Plus className="w-5 h-5 text-brand-navy"/> Sugerir Inclusão</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Categoria</label>
                                            <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-brand-50 focus:border-brand-navy bg-slate-50" value={requestData.type} onChange={e => setRequestData({...requestData, type: e.target.value})}>
                                                <option value="SPECIALTY">Especialidade</option>
                                                <option value="PROCEDURE">Procedimento</option>
                                                <option value="BOTH">Ambos</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Nome sugerido</label>
                                            <input type="text" required value={requestData.name} onChange={e => setRequestData({...requestData, name: e.target.value})} className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-brand-50 focus:border-brand-navy bg-slate-50" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Detalhes Opcionais</label>
                                        <textarea rows="3" value={requestData.description} onChange={e => setRequestData({...requestData, description: e.target.value})} className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-brand-50 focus:border-brand-navy resize-none bg-slate-50"></textarea>
                                    </div>
                                    <div className="flex gap-4 justify-end pt-2">
                                        <button type="button" onClick={() => setShowRequestForm(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                                        <button type="submit" className="px-6 py-3 text-sm bg-brand-navy text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-md active:scale-95">Enviar Solicitação</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </section>
                
                {/* Save Button */}
                <div className="pb-16 pt-8 flex justify-end border-t border-slate-200">
                    <button 
                        onClick={handleSaveProfile}
                        disabled={saving || selectedSpecialties.length === 0 || selectedProcedures.length === 0}
                        className="bg-brand-navy text-brand-champagne px-10 py-4 rounded-2xl font-black tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto uppercase active:scale-95"
                    >
                        {saving ? 'GRAVANDO...' : 'SALVAR PREFERÊNCIAS'} <CheckCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>
       </MainLayout>
    );
}
