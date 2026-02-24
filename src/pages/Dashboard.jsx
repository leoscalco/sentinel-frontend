import { useState, useEffect } from 'react';
import { Plus, Search, FileText, User, Activity, Loader2, ShieldCheck, Download } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    patientDocument: '',
    patientBirthDate: '',
    medicalNote: '',
    procedure: '',
    conditions: []
  });
  const [generating, setGenerating] = useState(false);
  const [procedures, setProcedures] = useState([]);

  useEffect(() => {
    fetchConsents();
    fetchProcedures();
  }, []);

  const fetchProcedures = async () => {
    try {
        const doctorId = import.meta.env.VITE_DOCTOR_ID;
        const res = await api.get(`/procedures?doctor_id=${doctorId}`);
        setProcedures(res.data);
    } catch (e) {
        console.error("Failed to fetch procedures", e);
    }
  };

  const fetchConsents = async () => {
    try {
      // Use env variable or fallback
      const doctorId = import.meta.env.VITE_DOCTOR_ID; 
      const res = await api.get(`/consents?doctor_id=${doctorId}&limit=5`); // Limit to 5 for dashboard
      setConsents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch consents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.post('/consents/generate', {
        doctor: {
            // Use env or default
            name: "Dr. House",
            crm: "12345/SP",
            email: "house@princeton.edu",
            address: "Princeton Plainsboro", 
            phone_24h: "+1 609-555-0100"
        },
        patient: {
            name: formData.patientName,
            document_id: formData.patientDocument,
            birth_date: formData.patientBirthDate ? new Date(formData.patientBirthDate).toISOString() : null,
            conditions: formData.conditions
        },
        medical_note: formData.medicalNote,
        procedure: formData.procedure
      });
      setShowForm(false);
      fetchConsents(); // Refresh list
      setFormData({ 
        patientName: '', 
        patientDocument: '',
        patientBirthDate: '',
        medicalNote: '',
        procedure: '', 
        conditions: [] 
    });
      alert("Solicitação enviada! O documento está sendo gerado e aparecerá na aba 'Rascunhos' em instantes.");
    } catch (err) {
      console.error("Failed to generate", err);
      alert("Erro ao gerar documento. Verifique os dados.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleCondition = (condition) => {
    setFormData(prev => {
        const exists = prev.conditions.includes(condition);
        return {
            ...prev,
            conditions: exists 
                ? prev.conditions.filter(c => c !== condition)
                : [...prev.conditions, condition]
        };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Painel Médico</h1>
            <nav className="flex items-center gap-4">
               <Link to="/documents" className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Meus Documentos
                </Link>
            </nav>
        </div>
        <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200"
        >
            <Plus className="w-4 h-4" /> Novo TCLE
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-8 space-y-8">
        
        {/* Quick Anamnesis Form */}
        {showForm && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-brand-100 animate-in slide-in-from-top-4 duration-300">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                    <Activity className="w-5 h-5 text-brand-500" /> Anamnese Rápida
                </h2>
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Name & Triggers */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Paciente</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.patientName}
                                    onChange={e => setFormData({...formData, patientName: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                                    placeholder="Ex: João da Silva"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">CPF / RG</label>
                                    <input 
                                        type="text" 
                                        value={formData.patientDocument}
                                        onChange={e => setFormData({...formData, patientDocument: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">D. Nascimento</label>
                                    <input 
                                        type="date" 
                                        value={formData.patientBirthDate}
                                        onChange={e => setFormData({...formData, patientBirthDate: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Gatilhos de Risco (Selecionar)</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Fumante', 'Diabético', 'Queloide', 'Cardíaco', 'Alergia'].map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => toggleCondition(c)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                                                ${formData.conditions.includes(c)
                                                    ? 'bg-rose-50 border-rose-200 text-rose-700 ring-1 ring-rose-500'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Procedures */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Procedimento</label>
                            <div className="flex flex-wrap gap-2">
                                {procedures.map(p => (
                                    <button
                                        key={p.category}
                                        type="button"
                                        onClick={() => setFormData({...formData, procedure: p.category})}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                            formData.procedure === p.category 
                                                ? 'bg-brand-600 text-white shadow-sm' 
                                                : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                                        }`}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                            {!formData.procedure && <p className="text-xs text-red-500 mt-1 pl-1">Selecione um procedimento</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notas Médicas / Observações</label>
                        <textarea 
                            rows="2"
                            value={formData.medicalNote}
                            onChange={e => setFormData({...formData, medicalNote: e.target.value})}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
                            placeholder="Descreva detalhes específicos do caso, condições pré-existentes ou observações relevantes..."
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            type="submit" 
                            disabled={generating}
                            className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            {generating ? 'Gerando Minuta...' : 'Gerar TCLE Seguro'}
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* Consent List (Summary) */}
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-slate-500" /> Atividades Recentes
                </h2>
                <Link to="/documents" className="text-sm text-brand-600 font-medium hover:underline">Ver todos</Link>
            </div>
            
            {loading ? (
                <div className="text-center py-12 text-slate-400">Carregando...</div>
            ) : consents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500">Nenhum documento recente.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {consents.map(consent => (
                        <div key={consent.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                                    ${consent.status === 'SIGNED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}
                                `}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">{consent.procedure_name}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <User className="w-3 h-3" /> {consent.patient_name} • {new Date(consent.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border
                                    ${consent.status === 'SIGNED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                      'bg-slate-50 text-slate-600 border-slate-100'}
                                `}>
                                    {consent.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
