import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ShieldX, Search, FolderOpen, CalendarDays, FileText, ChevronRight, Loader2, Send, X, Plus, User, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import PatientFolder from '../components/PatientFolder';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Patient folders
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Calendar
  const [calendarItems, setCalendarItems] = useState([]);
  const [calendarRange, setCalendarRange] = useState('week');
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  // Resend PIN state
  const [resendingPin, setResendingPin] = useState(null);

  // ── Fetch patients ──
  const fetchPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      const params = new URLSearchParams();
      if (user?.id) params.append('doctor_id', user.id);
      if (patientSearch.trim()) params.append('search', patientSearch.trim());
      const res = await api.get(`/patients?${params}`);
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch patients", err);
    } finally {
      setLoadingPatients(false);
    }
  }, [user?.id, patientSearch]);

  // ── Fetch calendar ──
  const fetchCalendar = useCallback(async () => {
    setLoadingCalendar(true);
    try {
      const params = new URLSearchParams({ range: calendarRange });
      if (user?.id) params.append('doctor_id', user.id);
      const res = await api.get(`/consents/calendar?${params}`);
      setCalendarItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch calendar", err);
    } finally {
      setLoadingCalendar(false);
    }
  }, [user?.id, calendarRange]);

  useEffect(() => { if (user?.id) fetchPatients(); }, [user?.id, fetchPatients]);
  useEffect(() => { if (user?.id) fetchCalendar(); }, [user?.id, fetchCalendar]);

  // ── Debounced patient search ──
  useEffect(() => {
    const t = setTimeout(() => fetchPatients(), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientSearch]);

  // ── Group calendar by date ──
  const calendarGrouped = calendarItems.reduce((acc, item) => {
    (acc[item.date_group] = acc[item.date_group] || []).push(item);
    return acc;
  }, {});

  // ── Helpers ──
  const getShieldIcon = (status) => {
    const map = {
      'SEGURO': <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      'CUIDADO': <ShieldAlert className="w-5 h-5 text-amber-500" />,
      'PERIGO': <ShieldX className="w-5 h-5 text-red-500" />,
    };
    return map[status] || map['SEGURO'];
  };

  const getShieldBadge = (status) => {
    const map = {
      'SEGURO': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'CUIDADO': 'bg-amber-50 text-amber-700 border-amber-200',
      'PERIGO': 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${map[status] || map['SEGURO']}`}>
        {status}
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

  const formatDateGroup = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
  };

  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
  };

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
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } catch {
      alert("Erro ao reenviar PIN");
    } finally {
      setResendingPin(null);
    }
  };

  return (
    <MainLayout title="PAINEL MÉDICO" subtitle="UNIDADE SÃO PAULO" showNewTcle={true}>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* ─── LEFT: Patient Folders (3 cols) ─── */}
        <section className="lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-brand-navy" />
              <h2 className="text-sm font-black tracking-widest text-brand-navy uppercase">Pastas de Pacientes</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">{patients.length} paciente{patients.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
              placeholder="Buscar por nome ou CPF..."
              className="w-full pl-11 pr-10 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-brand-100 focus:border-brand-navy outline-none transition-all placeholder-slate-300 font-medium"
            />
            {patientSearch && (
              <button onClick={() => setPatientSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Patient grid */}
          {loadingPatients ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Sincronizando...
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
              <User className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">{patientSearch ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado.'}</p>
              <button onClick={() => navigate('/new-consent')} className="mt-4 text-brand-navy font-bold hover:underline text-sm uppercase tracking-wide">
                Gerar primeiro TCLE
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patients.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-brand-champagne hover:shadow-md transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-brand-champagne/40 flex items-center justify-center text-brand-navy font-black text-sm uppercase shrink-0 group-hover:scale-110 transition-transform">
                      {getInitials(p.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-brand-navy text-sm truncate group-hover:text-brand-navy/80 transition-colors">{p.name}</h3>
                        {getShieldIcon(p.shield_status)}
                      </div>
                      <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">CPF: {p.document_id}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] font-bold text-slate-400">{p.consents_count} TCLE{p.consents_count !== 1 ? 's' : ''}</span>
                        {getShieldBadge(p.shield_status)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ─── RIGHT: Calendar (2 cols) ─── */}
        <section className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <CalendarDays className="w-5 h-5 text-brand-navy" />
            <h2 className="text-sm font-black tracking-widest text-brand-navy uppercase">Calendário</h2>
          </div>

          {/* Toggle */}
          <div className="flex rounded-xl overflow-hidden border-2 border-brand-navy mb-5">
            <button
              onClick={() => setCalendarRange('week')}
              className={`flex-1 py-2.5 text-xs font-black tracking-widest uppercase transition-all ${
                calendarRange === 'week'
                  ? 'bg-brand-navy text-brand-champagne'
                  : 'bg-white text-brand-navy hover:bg-brand-navy/5'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setCalendarRange('month')}
              className={`flex-1 py-2.5 text-xs font-black tracking-widest uppercase transition-all ${
                calendarRange === 'month'
                  ? 'bg-brand-navy text-brand-champagne'
                  : 'bg-white text-brand-navy hover:bg-brand-navy/5'
              }`}
            >
              Mês
            </button>
          </div>

          {/* Timeline */}
          {loadingCalendar ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : Object.keys(calendarGrouped).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">Nenhum TCLE neste período.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {Object.entries(calendarGrouped)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([dateGroup, items]) => (
                <div key={dateGroup}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-2 mt-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-navy/20 shrink-0" />
                    <span className="text-xs font-black tracking-widest text-brand-navy uppercase">
                      {formatDateGroup(dateGroup)}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {/* Items */}
                  <div className="ml-5 border-l-2 border-slate-100 pl-5 space-y-2 pb-3">
                    {items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/audit/${item.id}`)}
                        className="bg-white p-3 rounded-xl border border-slate-100 hover:border-brand-champagne hover:shadow-sm transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-brand-navy/40 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-700 truncate group-hover:text-brand-navy transition-colors">{item.procedure_name}</p>
                            <p className="text-[11px] font-bold text-slate-400 truncate">{item.patient_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {item.status === 'PENDING_PATIENT' && (
                            <button
                              onClick={(e) => handleResendPin(e, item.id)}
                              disabled={resendingPin === item.id}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                              title="Reenviar link"
                            >
                              {resendingPin === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Patient Folder Modal */}
      {selectedPatient && (
        <PatientFolder
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onNewTcle={() => {
            setSelectedPatient(null);
            navigate(`/new-consent?patient_id=${selectedPatient.id}`);
          }}
          onViewConsent={(consentId) => {
            setSelectedPatient(null);
            navigate(`/audit/${consentId}`);
          }}
        />
      )}

    </MainLayout>
  );
}
