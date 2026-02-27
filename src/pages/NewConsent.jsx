import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Calendar, FileText, CheckCircle2, X } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';

export default function NewConsent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [procedures, setProcedures] = useState([]);
  
  const [formData, setFormData] = useState({
    patientName: '',
    patientDocument: '',
    patientBirthDate: '',
    patientPhone: '',
    medicalNote: '',
    procedure: '',
    conditions: []
  });

  const availableConditions = [
    'FUMANTE', 'DIABÉTICO', 'QUELOIDE', 'CARDÍACO', 'ALERGIA'
  ];

  const [noteItems, setNoteItems] = useState([]);
  const [currentNoteInput, setCurrentNoteInput] = useState('');

  const handleNoteKeyDown = (e) => {
      if (['Enter', 'Tab', ';'].includes(e.key)) {
          e.preventDefault();
          const splitValues = currentNoteInput.split(/[;\n\t]+/).map(s => s.trim()).filter(Boolean);
          if (splitValues.length > 0 || currentNoteInput.trim() !== '') {
              const toAdd = splitValues.length > 0 ? splitValues : [currentNoteInput.trim()];
              const newItems = [...noteItems, ...toAdd];
              setNoteItems(newItems);
          }
          setCurrentNoteInput('');
      } else if (e.key === 'Backspace' && !currentNoteInput && noteItems.length > 0) {
          e.preventDefault();
          const newItems = noteItems.slice(0, -1);
          setNoteItems(newItems);
          setCurrentNoteInput(noteItems[noteItems.length - 1]);
      }
  };

  const handleNotePaste = (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text');
      const splitValues = pastedData.split(/[;\n\t]+/).map(s => s.trim()).filter(Boolean);
      if (splitValues.length > 0) {
          const newItems = [...noteItems, ...splitValues];
          setNoteItems(newItems);
      }
  };

  const removeNoteItem = (index) => {
      const newItems = noteItems.filter((_, i) => i !== index);
      setNoteItems(newItems);
  };

  useEffect(() => {
    // Sync local visual notes items to main formData.
    // Ensure that it combines arrays uniquely mapped
    const additional = currentNoteInput.trim() ? [currentNoteInput.trim()] : [];
    const allNotes = [...noteItems, ...additional];
    setFormData(prev => ({ ...prev, medicalNote: allNotes.join('\n') }));
  }, [noteItems, currentNoteInput]);

  const fetchProcedures = useCallback(async () => {
    try {
        const res = await api.get(`/procedures?doctor_id=${user.id}`);
        setProcedures(res.data);
    } catch (e) {
        console.error("Failed to fetch procedures", e);
    }
  }, [user.id]);

  useEffect(() => {
    if (user?.id) {
        fetchProcedures();
    }
  }, [user.id, fetchProcedures]);

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

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.procedure) {
        alert("Por favor, selecione um procedimento.");
        return;
    }
    
    setGenerating(true);
    try {
      await api.post('/consents/generate', {
        doctor: {
            name: user.name,
            crm: user.crm,
            email: user.email,
            address: user.address, 
            phone_24h: user.phone_24h
        },
        patient: {
            name: formData.patientName,
            document_id: formData.patientDocument,
            birth_date: formData.patientBirthDate ? new Date(formData.patientBirthDate).toISOString() : null,
            phone_number: formData.patientPhone,
            conditions: formData.conditions
        },
        medical_note: formData.medicalNote,
        procedure: formData.procedure
      });
      navigate('/documents'); // Redirect to history to see the new generation
    } catch (err) {
      console.error("Failed to generate", err);
      alert("Erro ao gerar documento. Verifique os dados.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <MainLayout title="NOVO DOCUMENTO" subtitle="GERADOR INTELIGENTE">
        <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-brand-100 flex flex-col gap-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex items-center gap-3 border-b pb-4">
                <ShieldCheck className="w-6 h-6 text-brand-navy" />
                <h2 className="text-xl font-bold tracking-tight text-brand-navy uppercase">ANAMNESE DE BLINDAGEM</h2>
            </div>

            <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Left Column: Patient Info */}
                <div className="space-y-8">
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Nome do Paciente</label>
                            <input 
                                type="text" 
                                required
                                value={formData.patientName}
                                onChange={e => setFormData({...formData, patientName: e.target.value})}
                                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-100 focus:border-brand-navy outline-none transition-all placeholder-slate-300"
                                placeholder="Ex: João da Silva"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Documento (CPF)</label>
                                <input 
                                    type="text" 
                                    value={formData.patientDocument}
                                    onChange={e => setFormData({...formData, patientDocument: e.target.value})}
                                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-100 focus:border-brand-navy outline-none transition-all placeholder-slate-300"
                                    placeholder="000.000.000-00"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Data Nascimento</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.patientBirthDate}
                                        onChange={e => setFormData({...formData, patientBirthDate: e.target.value})}
                                        className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-100 focus:border-brand-navy outline-none transition-all text-slate-600"
                                        required
                                    />
                                    <Calendar className="w-4 h-4 absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Telefone (WhatsApp)</label>
                                <input 
                                    type="text" 
                                    value={formData.patientPhone}
                                    onChange={e => setFormData({...formData, patientPhone: e.target.value})}
                                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-100 focus:border-brand-navy outline-none transition-all placeholder-slate-300"
                                    placeholder="+5511999999999"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Gatilhos de Risco Jurídico</label>
                        <div className="flex flex-wrap gap-2">
                            {availableConditions.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => toggleCondition(c)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all border-2 ${
                                        formData.conditions.includes(c)
                                        ? 'border-brand-navy bg-brand-navy text-white shadow-md'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Nota Médica / Evolução</label>
                        <div className="w-full border-2 border-slate-200 rounded-2xl p-3 bg-white focus-within:ring-4 focus-within:ring-brand-100 focus-within:border-brand-navy transition-all min-h-[120px] cursor-text flex flex-wrap gap-2 items-start"
                             onClick={() => document.getElementById('medicalNoteInput')?.focus()}
                        >
                            {noteItems.map((note, index) => (
                                <div key={index} className="flex items-center gap-1 bg-brand-navy/5 text-brand-navy font-medium text-sm px-3 py-1.5 rounded-lg border border-brand-navy/10 break-words max-w-full">
                                    <span className="flex-1 min-w-0 break-words">{note}</span>
                                    <button 
                                        type="button" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeNoteItem(index);
                                        }}
                                        className="text-brand-navy/50 hover:text-red-500 transition-colors shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <input
                                id="medicalNoteInput"
                                type="text"
                                value={currentNoteInput}
                                onChange={e => setCurrentNoteInput(e.target.value)}
                                onKeyDown={handleNoteKeyDown}
                                onPaste={handleNotePaste}
                                className="flex-1 bg-transparent min-w-[120px] text-sm text-slate-700 outline-none mt-1 placeholder-slate-300"
                                placeholder={noteItems.length === 0 ? "Descreva e pressione Enter ou ' ; ' para separar..." : ""}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Procedure Selection & Submit */}
                <div className="space-y-6 flex flex-col h-full">
                    <div className="flex-1 space-y-3">
                        <label className="block text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">Selecione o Procedimento</label>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {procedures.length === 0 ? (
                                <p className="text-sm text-slate-400 p-4 border-2 border-dashed border-slate-200 rounded-xl text-center">Nenhum procedimento encontrado. Configure seu perfil primeiro.</p>
                            ) : procedures.map(proc => {
                                const isSelected = formData.procedure === proc.type;
                                return (
                                    <button
                                        key={proc.id}
                                        type="button"
                                        onClick={() => setFormData({...formData, procedure: proc.type})}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                                            isSelected
                                            ? 'border-brand-navy bg-brand-champagne/30 font-bold text-brand-navy shadow-sm'
                                            : 'border-slate-100 hover:border-slate-300 text-slate-600 font-medium bg-white'
                                        }`}
                                    >
                                        <span className="text-sm">{proc.name}</span>
                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-brand-navy" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={generating || procedures.length === 0}
                        className="w-full bg-brand-navy text-white py-4 rounded-2xl font-black tracking-widest text-sm hover:bg-opacity-90 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6 uppercase"
                    >
                        {generating ? (
                            <>GERANDO DOCUMENTO...</>
                        ) : (
                            <><ShieldCheck className="w-5 h-5" /> GerAR BLINDAGEM</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    </MainLayout>
  );
}
