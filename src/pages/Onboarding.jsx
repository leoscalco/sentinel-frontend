import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Activity, ChevronRight, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export default function Onboarding() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const [specialties, setSpecialties] = useState([]);
    const [procedures, setProcedures] = useState([]);
    
    const [selectedSpecialties, setSelectedSpecialties] = useState([]);
    const [selectedProcedures, setSelectedProcedures] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Feature Request State
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestData, setRequestData] = useState({ type: 'SPECIALTY', name: '', description: '' });
    const [requestSuccess, setRequestSuccess] = useState(false);

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
    }, [selectedSpecialties]);

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

    const fetchProcedures = async () => {
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
    };

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

        setSaving(true);
        try {
            await api.post('/onboarding/me', {
                specialty_ids: selectedSpecialties,
                procedure_ids: selectedProcedures
            });
            // Force re-fetch of user data in AuthContext to register the updated specialties
            const res = await api.get('/auth/me');
            updateUser(res.data); // Update context with fresh user object
            navigate('/dashboard');
        } catch (err) {
            console.error("Failed to save onboarding data", err);
            alert("Erro ao salvar perfil.");
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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-gray text-brand-navy">Carregando...</div>;

    return (
        <div className="min-h-screen bg-brand-gray font-sans flex text-brand-navy">
            
            {/* Left Decorative/Info Side */}
            <div className="hidden lg:flex lg:w-1/3 bg-brand-navy p-12 flex-col justify-between text-white">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <ShieldCheck className="w-10 h-10 text-brand-champagne" />
                        <span className="text-2xl font-bold tracking-widest text-brand-champagne">SENTINEL AEGIS</span>
                    </div>
                    <h1 className="text-4xl font-bold leading-tight mb-6">Complete o seu Perfil Médico.</h1>
                    <p className="text-lg opacity-80 leading-relaxed">
                        A Inteligência do Sentinel utiliza suas áreas de atuação para calibrar as cláusulas jurídicas, avaliações de risco e as normativas mais recentes (CFM, ANVISA, FDA) aplicáveis aos seus documentos.
                    </p>
                </div>
                <div className="flex items-center gap-4 text-sm opacity-60">
                    <Activity className="w-5 h-5" />
                    <span>Onboarding - Etapa 1 de 1</span>
                </div>
            </div>

            {/* Right Interactive Form Side */}
            <div className="w-full lg:w-2/3 flex flex-col p-8 lg:p-16 max-w-4xl mx-auto overflow-y-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">Configure sua Atuação</h2>
                    <p className="text-slate-600">Olá Dr(a). {user?.name?.split(' ')[0] || ''}, selecione quais procedimentos você realiza para ativarmos o motor de blindagem específico para o seu consultório.</p>
                </div>

                <div className="space-y-10 flex-1">
                    
                    {/* Specialties Section */}
                    <section>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <span className="bg-brand-navy text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span> 
                            Especialidades Médicas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {specialties.map(spec => (
                                <button
                                    key={spec.id}
                                    onClick={() => toggleSpecialty(spec.id)}
                                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                        selectedSpecialties.includes(spec.id) 
                                        ? 'border-brand-navy bg-brand-navy text-white shadow-md' 
                                        : 'border-gray-200 bg-white hover:border-brand-navy/50 text-slate-700'
                                    }`}
                                >
                                    <span className="font-semibold">{spec.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Procedures Section */}
                    {selectedSpecialties.length > 0 && (
                        <section className="animate-in fade-in slide-in-from-top-4 duration-300">
                           <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <span className="bg-brand-navy text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span> 
                                Procedimentos Realizados
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {procedures.map(proc => (
                                    <button
                                        key={proc.id}
                                        onClick={() => toggleProcedure(proc.id)}
                                        className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
                                            selectedProcedures.includes(proc.id)
                                            ? 'border-brand-navy bg-brand-navy text-white'
                                            : 'border-gray-300 bg-white text-slate-600 hover:border-slate-400'
                                        }`}
                                    >
                                        {proc.name}
                                    </button>
                                ))}
                                {procedures.length === 0 && <span className="text-sm text-slate-500 italic">Nenhum procedimento encontrado para as especialidades escolhidas.</span>}
                            </div>
                        </section>
                    )}

                    {/* Not Found / Request Form */}
                    <section className="pt-8 border-t border-gray-200">
                        {!showRequestForm ? (
                            <button 
                                onClick={() => setShowRequestForm(true)}
                                className="text-slate-500 text-sm font-medium hover:text-brand-navy flex items-center gap-1 transition"
                            >
                                <AlertCircle className="w-4 h-4" /> Não encontrou sua especialidade ou procedimento? Solicite aqui.
                            </button>
                        ) : (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in zoom-in-95 duration-200">
                                {requestSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-4 text-green-700">
                                        <CheckCircle className="w-12 h-12 mb-2" />
                                        <p className="font-bold">Agradecemos a sugestão!</p>
                                        <p className="text-sm">Nossa equipe Sentinel irá avaliar a inclusão brevemente.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendRequest} className="space-y-4">
                                        <h4 className="font-bold flex items-center gap-2 mb-4"><Plus className="w-5 h-5 text-brand-navy"/> Sugerir Inclusão</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">O que deseja solicitar?</label>
                                                <select className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-brand-navy" value={requestData.type} onChange={e => setRequestData({...requestData, type: e.target.value})}>
                                                    <option value="SPECIALTY">Nova Especialidade</option>
                                                    <option value="PROCEDURE">Novo Procedimento</option>
                                                    <option value="BOTH">Ambos</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome sugerido</label>
                                                <input type="text" required value={requestData.name} onChange={e => setRequestData({...requestData, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-brand-navy" placeholder="Ex: Tricologia" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Detalhes (Opcional)</label>
                                            <textarea rows="2" value={requestData.description} onChange={e => setRequestData({...requestData, description: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-brand-navy resize-none" placeholder="Explique brevemente para nos ajudar na pesquisa da literatura legal..."></textarea>
                                        </div>
                                        <div className="flex gap-3 justify-end pt-2">
                                            <button type="button" onClick={() => setShowRequestForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                                            <button type="submit" className="px-4 py-2 text-sm bg-brand-navy text-brand-champagne font-bold rounded hover:bg-opacity-90 transition shadow-sm">Enviar Solicitação Sentinel</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </section>
                </div>
                
                {/* Fixed Footer Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                    <button 
                        onClick={handleSaveProfile}
                        disabled={saving || selectedSpecialties.length === 0 || selectedProcedures.length === 0}
                        className="bg-brand-navy text-brand-champagne px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Configurando IA...' : 'Salvar e Acessar Painel'} <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
