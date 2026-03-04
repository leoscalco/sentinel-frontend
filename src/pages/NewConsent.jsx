import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Calendar, FileText, CheckCircle2, X, ClipboardList, Pill, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react';
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

  // Dynamic risks from selected procedure
  const selectedProc = procedures.find(p => p.type === formData.procedure);
  const availableConditions = selectedProc?.risk_tags || [];

  // Dynamic questionnaire
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  // Medications & Previous Procedures (tag-input)
  const [medItems, setMedItems] = useState([]);
  const [currentMedInput, setCurrentMedInput] = useState('');
  const [procItems, setProcItems] = useState([]);
  const [currentProcInput, setCurrentProcInput] = useState('');

  // Generic tag-input handler factory
  const makeTagHandlers = (items, setItems, currentInput, setCurrentInput) => ({
    onKeyDown: (e) => {
      if (['Enter', 'Tab', ';'].includes(e.key)) {
        e.preventDefault();
        const splitValues = currentInput.split(/[;\n\t]+/).map(s => s.trim()).filter(Boolean);
        if (splitValues.length > 0 || currentInput.trim() !== '') {
          const toAdd = splitValues.length > 0 ? splitValues : [currentInput.trim()];
          setItems([...items, ...toAdd]);
        }
        setCurrentInput('');
      } else if (e.key === 'Backspace' && !currentInput && items.length > 0) {
        e.preventDefault();
        setCurrentInput(items[items.length - 1]);
        setItems(items.slice(0, -1));
      }
    },
    onPaste: (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const splitValues = pasted.split(/[;\n\t]+/).map(s => s.trim()).filter(Boolean);
      if (splitValues.length > 0) setItems([...items, ...splitValues]);
    },
    remove: (index) => setItems(items.filter((_, i) => i !== index)),
  });

  const medHandlers = makeTagHandlers(medItems, setMedItems, currentMedInput, setCurrentMedInput);
  const procHandlers = makeTagHandlers(procItems, setProcItems, currentProcInput, setCurrentProcInput);

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

  // Fetch questions when procedure changes
  useEffect(() => {
    if (!formData.procedure) {
      setQuestions([]);
      setAnswers({});
      return;
    }
    const fetchQuestions = async () => {
      try {
        const res = await api.get(`/procedures/${formData.procedure}/questions`);
        const allQuestions = res.data;
        setQuestions(allQuestions);
        // Initialize answers
        const initial = {};
        allQuestions.forEach(q => {
          initial[q.id] = q.question_type === 'boolean' ? null : '';
        });
        setAnswers(initial);
        // Expand all categories by default
        const cats = {};
        allQuestions.forEach(q => { cats[q.category] = true; });
        setExpandedCategories(cats);
      } catch (e) {
        console.error('Failed to fetch questions', e);
      }
    };
    fetchQuestions();
  }, [formData.procedure]);

  const updateAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
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

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.procedure) {
        alert("Por favor, selecione um procedimento.");
        return;
    }
    
    setGenerating(true);
    try {
      // Build anamnesis from questionnaire answers
      const questionnaireAnswers = {};
      questions.forEach(q => {
        const answer = answers[q.id];
        if (answer !== null && answer !== '') {
          questionnaireAnswers[q.question_text] = answer;
        }
      });

      const anamnesis = {
        medications: medItems.length > 0 ? medItems.join('; ') : null,
        previous_procedures: procItems.length > 0 ? procItems.join('; ') : null,
        questionnaire: Object.keys(questionnaireAnswers).length > 0 ? questionnaireAnswers : null,
      };

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
        procedure: formData.procedure,
        anamnesis: anamnesis,
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
                        {!formData.procedure ? (
                            <p className="text-sm text-slate-400 p-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
                                Selecione um procedimento para ver os riscos específicos.
                            </p>
                        ) : availableConditions.length === 0 ? (
                            <p className="text-sm text-slate-400 p-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
                                Nenhum risco cadastrado para este procedimento.
                            </p>
                        ) : (
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
                        )}
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

                    {/* Medications — tag input */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">
                            <Pill className="w-4 h-4" /> Medicações em Uso
                        </label>
                        <div className="w-full border-2 border-slate-200 rounded-2xl p-3 bg-white focus-within:ring-4 focus-within:ring-brand-100 focus-within:border-brand-navy transition-all min-h-[60px] cursor-text flex flex-wrap gap-2 items-start"
                             onClick={() => document.getElementById('medInput')?.focus()}
                        >
                            {medItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-1 bg-brand-navy/5 text-brand-navy font-medium text-sm px-3 py-1.5 rounded-lg border border-brand-navy/10 break-words max-w-full">
                                    <span className="flex-1 min-w-0 break-words">{item}</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); medHandlers.remove(index); }} className="text-brand-navy/50 hover:text-red-500 transition-colors shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <input
                                id="medInput"
                                type="text"
                                value={currentMedInput}
                                onChange={e => setCurrentMedInput(e.target.value)}
                                onKeyDown={medHandlers.onKeyDown}
                                onPaste={medHandlers.onPaste}
                                className="flex-1 bg-transparent min-w-[120px] text-sm text-slate-700 outline-none mt-1 placeholder-slate-300"
                                placeholder={medItems.length === 0 ? "Ex: Metformina 500mg 2x/dia; Losartana 50mg..." : ""}
                            />
                        </div>
                    </div>
                    
                    {/* Previous Procedures — tag input */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-400 uppercase mb-2">
                            <Stethoscope className="w-4 h-4" /> Procedimentos Anteriores
                        </label>
                        <div className="w-full border-2 border-slate-200 rounded-2xl p-3 bg-white focus-within:ring-4 focus-within:ring-brand-100 focus-within:border-brand-navy transition-all min-h-[60px] cursor-text flex flex-wrap gap-2 items-start"
                             onClick={() => document.getElementById('procInput')?.focus()}
                        >
                            {procItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-1 bg-brand-navy/5 text-brand-navy font-medium text-sm px-3 py-1.5 rounded-lg border border-brand-navy/10 break-words max-w-full">
                                    <span className="flex-1 min-w-0 break-words">{item}</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); procHandlers.remove(index); }} className="text-brand-navy/50 hover:text-red-500 transition-colors shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <input
                                id="procInput"
                                type="text"
                                value={currentProcInput}
                                onChange={e => setCurrentProcInput(e.target.value)}
                                onKeyDown={procHandlers.onKeyDown}
                                onPaste={procHandlers.onPaste}
                                className="flex-1 bg-transparent min-w-[120px] text-sm text-slate-700 outline-none mt-1 placeholder-slate-300"
                                placeholder={procItems.length === 0 ? "Ex: Toxina Botulínica (jan/2024); Peeling TCA..." : ""}
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
                                        onClick={() => {
                            setFormData({...formData, procedure: proc.type, conditions: []});
                        }}
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

                    {/* Dynamic Questionnaire */}
                    {questions.length > 0 && (
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ClipboardList className="w-5 h-5 text-brand-navy" />
                                <h3 className="text-xs font-bold tracking-wide text-slate-400 uppercase">Questionário de Avaliação</h3>
                                <span className="text-xs text-slate-300 font-medium">({questions.length} perguntas)</span>
                            </div>

                            {Object.entries(
                                questions.reduce((acc, q) => {
                                    const cat = q.category || 'outros';
                                    if (!acc[cat]) acc[cat] = [];
                                    acc[cat].push(q);
                                    return acc;
                                }, {})
                            ).map(([category, catQuestions]) => {
                                const categoryLabels = {
                                    'saude': '🏥 Histórico de Saúde',
                                    'pele': '☀️ Pele e Hábitos',
                                    'procedimentos_anteriores': '📋 Procedimentos Anteriores',
                                };
                                const isExpanded = expandedCategories[category] !== false;
                                return (
                                    <div key={category} className="border border-slate-100 rounded-xl overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(category)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                                        >
                                            <span className="text-sm font-bold text-brand-navy">{categoryLabels[category] || category}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">{catQuestions.length} perguntas</span>
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div className="p-4 space-y-4">
                                                {catQuestions.map(q => (
                                                    <div key={q.id} className="space-y-1.5">
                                                        <label className="text-sm text-slate-700 font-medium flex items-center gap-1">
                                                            {q.question_text}
                                                            {q.is_required && <span className="text-red-400 text-xs">*</span>}
                                                        </label>
                                                        {q.question_type === 'boolean' ? (
                                                            <div className="flex gap-2">
                                                                {['Sim', 'Não'].map(opt => (
                                                                    <button
                                                                        key={opt}
                                                                        type="button"
                                                                        onClick={() => updateAnswer(q.id, opt === 'Sim')}
                                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                                                                            answers[q.id] === (opt === 'Sim')
                                                                            ? opt === 'Sim' 
                                                                                ? 'border-amber-400 bg-amber-50 text-amber-700'
                                                                                : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                                                            : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                                                                        }`}
                                                                    >
                                                                        {opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : q.question_type === 'select' && q.options ? (
                                                            <select
                                                                value={answers[q.id] || ''}
                                                                onChange={e => updateAnswer(q.id, e.target.value)}
                                                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-4 focus:ring-brand-100 focus:border-brand-navy outline-none transition-all"
                                                            >
                                                                <option value="">Selecione...</option>
                                                                {q.options.map(opt => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={answers[q.id] || ''}
                                                                onChange={e => updateAnswer(q.id, e.target.value)}
                                                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-4 focus:ring-brand-100 focus:border-brand-navy outline-none transition-all placeholder-slate-300"
                                                                placeholder="Digite sua resposta..."
                                                            />
                                                        )}
                                                        {q.care_impact_text && answers[q.id] === true && (
                                                            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                                                ⚠️ {q.care_impact_text}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

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
