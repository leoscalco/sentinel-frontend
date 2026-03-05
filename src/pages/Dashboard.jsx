import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ShieldX, Search, FolderOpen, CalendarDays, FileText, Loader2, Send, X, User, TrendingUp, Clock, Shield, PenTool, Eye, Download, RotateCcw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import PatientFolder from '../components/PatientFolder';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [calendarItems, setCalendarItems] = useState([]);
  const [calendarRange, setCalendarRange] = useState('week');
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [resendingPin, setResendingPin] = useState(null);
  const [heatmapModal, setHeatmapModal] = useState(null); // { date, items }

  // ── Fetchers ──
  const fetchPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      const params = new URLSearchParams();
      if (user?.id) params.append('doctor_id', user.id);
      if (patientSearch.trim()) params.append('search', patientSearch.trim());
      const res = await api.get(`/patients?${params}`);
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingPatients(false); }
  }, [user?.id, patientSearch]);

  const fetchCalendar = useCallback(async () => {
    setLoadingCalendar(true);
    try {
      const params = new URLSearchParams({ range: calendarRange });
      if (user?.id) params.append('doctor_id', user.id);
      const res = await api.get(`/consents/calendar?${params}`);
      setCalendarItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingCalendar(false); }
  }, [user?.id, calendarRange]);

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const params = new URLSearchParams();
      if (user?.id) params.append('doctor_id', user.id);
      const res = await api.get(`/dashboard/metrics?${params}`);
      setMetrics(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingMetrics(false); }
  }, [user?.id]);

  useEffect(() => { if (user?.id) fetchPatients(); }, [user?.id, fetchPatients]);
  useEffect(() => { if (user?.id) fetchCalendar(); }, [user?.id, fetchCalendar]);
  useEffect(() => { if (user?.id) fetchMetrics(); }, [user?.id, fetchMetrics]);
  useEffect(() => { const t = setTimeout(() => fetchPatients(), 300); return () => clearTimeout(t); }, [patientSearch]);

  // ── Calendar grouping ──
  const calendarGrouped = calendarItems.reduce((acc, i) => {
    (acc[i.date_group] = acc[i.date_group] || []).push(i); return acc;
  }, {});

  // ── Heatmap data ──
  const heatmapData = useMemo(() => {
    if (!metrics?.heatmap) return { weeks: [], maxCount: 0 };
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const start = new Date(today); start.setDate(start.getDate() - 182); // 6 months
    start.setDate(start.getDate() - start.getDay());
    const weeks = []; let week = []; let maxCount = 0;
    const cur = new Date(start);
    while (cur <= today || week.length > 0) {
      const key = cur.toISOString().split('T')[0];
      const count = metrics.heatmap[key] || 0;
      if (count > maxCount) maxCount = count;
      week.push({ date: key, count, isFuture: cur > today, dow: cur.getDay() });
      if (week.length === 7) { weeks.push(week); week = []; }
      cur.setDate(cur.getDate() + 1);
      if (cur > today && week.length === 0) break;
    }
    if (week.length > 0) weeks.push(week);
    return { weeks, maxCount };
  }, [metrics?.heatmap]);

  // ── Helpers ──
  const getShieldBadge = (s) => {
    const m = { 'SEGURO': 'bg-emerald-50 text-emerald-700 border-emerald-200', 'CUIDADO': 'bg-amber-50 text-amber-700 border-amber-200', 'PERIGO': 'bg-red-50 text-red-700 border-red-200' };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${m[s] || m['SEGURO']}`}>{s}</span>;
  };
  const statusMap = { 'DRAFT': { t: 'RASCUNHO', c: 'bg-slate-100 text-slate-600 border-slate-200' }, 'PENDING': { t: 'PENDING', c: 'bg-slate-100 text-slate-500 border-slate-200' }, 'AUDITING': { t: 'AUDITORIA', c: 'bg-yellow-50 text-yellow-700 border-yellow-200' }, 'APPROVED': { t: 'APROVADO', c: 'bg-blue-50 text-blue-700 border-blue-200' }, 'PENDING_PATIENT': { t: 'AG. PACIENTE', c: 'bg-blue-50 text-blue-700 border-blue-200' }, 'REJECTED': { t: 'REJEITADO', c: 'bg-red-50 text-red-600 border-red-200' }, 'SIGNED': { t: 'FINALIZADO', c: 'bg-emerald-50 text-emerald-600 border-emerald-200' } };
  const getStatusBadge = (st) => { const v = statusMap[st] || statusMap['DRAFT']; return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${v.c}`}>{v.t}</span>; };
  const getInitials = (n) => { const p = n.trim().split(/\s+/); return (p[0]?.[0] || '') + (p[p.length - 1]?.[0] || ''); };
  const fmtTime = (s) => s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`;
  const getHeatmapColor = (count, max) => {
    if (count === 0) return 'bg-slate-100';
    const i = max > 0 ? count / max : 0;
    if (i <= 0.25) return 'bg-brand-champagne/40';
    if (i <= 0.5) return 'bg-brand-champagne/70';
    if (i <= 0.75) return 'bg-brand-champagne';
    return 'bg-brand-navy';
  };

  // ── Actions ──
  const handleResendPin = async (e, consentId) => {
    e?.stopPropagation();
    setResendingPin(consentId);
    try {
      const res = await api.post(`/consents/${consentId}/send-pin`, {});
      const pin = res.data.pin;
      let baseUrl = window.location.origin;
      if (baseUrl.includes('localhost')) baseUrl = import.meta.env.VITE_PUBLIC_URL || 'https://juan-uncorned-janay.ngrok-free.dev';
      const signatureUrl = `${baseUrl}/sign/${consentId}`;
      const phone = '34611716226';
      const message = `Olá! Aqui está o link para assinar o seu Termo de Consentimento da clínica:\n\n${signatureUrl}\n\nO seu PIN de acesso é: ${pin}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } catch { alert("Erro ao reenviar PIN"); }
    finally { setResendingPin(null); }
  };

  const handleDownload = async (e, consentId) => {
    e?.stopPropagation();
    try {
      const response = await api.get(`/consents/${consentId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a'); a.href = url; a.download = `TCLE_${consentId}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert("Erro ao baixar PDF"); }
  };

  // ── Action buttons for a consent item ──
  const ActionButtons = ({ item, compact = false }) => {
    const st = item.status;
    const sz = compact ? 'w-3 h-3' : 'w-3.5 h-3.5';
    const btnCls = `p-1.5 rounded-lg transition-all ${compact ? 'p-1' : 'p-1.5'}`;
    return (
      <div className="flex items-center gap-1">
        {/* Reenviar for PENDING_PATIENT */}
        {(st === 'PENDING_PATIENT' || st === 'APPROVED') && (
          <button onClick={(e) => handleResendPin(e, item.id)} disabled={resendingPin === item.id}
            className={`${btnCls} text-blue-500 hover:bg-blue-50`} title="Reenviar link">
            {resendingPin === item.id ? <Loader2 className={`${sz} animate-spin`} /> : <Send className={sz} />}
          </button>
        )}
        {/* Revisar for DRAFT or REJECTED */}
        {(st === 'DRAFT' || st === 'REJECTED') && (
          <button onClick={(e) => { e?.stopPropagation(); navigate(`/audit/${item.id}`); }}
            className={`${btnCls} text-amber-500 hover:bg-amber-50`} title="Revisar">
            <RotateCcw className={sz} />
          </button>
        )}
        {/* Detalhes (always) */}
        <button onClick={(e) => { e?.stopPropagation(); navigate(`/audit/${item.id}`); }}
          className={`${btnCls} text-brand-navy hover:bg-brand-navy/5`} title="Detalhes">
          <Eye className={sz} />
        </button>
        {/* Download (always) */}
        <button onClick={(e) => handleDownload(e, item.id)}
          className={`${btnCls} text-slate-400 hover:bg-slate-100`} title="Download PDF">
          <Download className={sz} />
        </button>
      </div>
    );
  };

  // ── Heatmap day click ──
  const handleHeatmapDayClick = (day) => {
    if (day.isFuture || day.count === 0) return;
    // Find calendar items for this date from the full calendar data
    // We need to fetch from calendar endpoint for broader range
    const dateItems = calendarItems.filter(i => i.date_group === day.date);
    if (dateItems.length > 0) {
      setHeatmapModal({ date: day.date, items: dateItems });
    } else {
      // Fetch for this specific day
      (async () => {
        try {
          const params = new URLSearchParams({ range: 'month' });
          if (user?.id) params.append('doctor_id', user.id);
          const res = await api.get(`/consents/calendar?${params}`);
          const all = Array.isArray(res.data) ? res.data : [];
          const dayItems = all.filter(i => i.date_group === day.date);
          setHeatmapModal({ date: day.date, items: dayItems });
        } catch { setHeatmapModal({ date: day.date, items: [] }); }
      })();
    }
  };

  return (
    <MainLayout title="PAINEL MÉDICO" subtitle="UNIDADE SÃO PAULO" showNewTcle={true} fullWidth={true}>
      <div className="flex flex-col gap-6 pb-6">
        
        {/* ═══ TOP SECTION: CALENDAR ═══ */}
        <section className="flex flex-col bg-slate-50/80 p-6 rounded-[32px] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700 w-full shrink-0">
          <div className="flex items-center justify-between mb-6 shrink-0 z-20">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-brand-navy" />
              <h2 className="text-sm font-black tracking-widest text-brand-navy uppercase">Calendário de TCLEs</h2>
            </div>
            <div className="flex rounded-xl overflow-hidden border-2 border-brand-navy">
              <button onClick={() => setCalendarRange('week')}
                className={`px-6 py-2 text-xs font-black tracking-widest uppercase transition-all ${calendarRange === 'week' ? 'bg-brand-navy text-brand-champagne' : 'bg-white text-brand-navy hover:bg-brand-navy/5'}`}
              >Semana</button>
              <button onClick={() => setCalendarRange('month')}
                className={`px-6 py-2 text-xs font-black tracking-widest uppercase transition-all ${calendarRange === 'month' ? 'bg-brand-navy text-brand-champagne' : 'bg-white text-brand-navy hover:bg-brand-navy/5'}`}
              >Mês</button>
            </div>
          </div>

          <div className="grid grid-cols-1 grid-rows-1 relative min-h-[400px] w-full items-stretch">
            {/* ═══ HEATMAP ═══ */}
            <div className={`col-start-1 row-start-1 bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col justify-center transition-opacity duration-300 w-full h-full ${calendarRange === 'month' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-[10px] font-black tracking-widest text-brand-navy uppercase">Atividade nos últimos 6 meses</span>
              </div>
              <div className="flex gap-2 sm:gap-4 justify-center w-full px-2">
                {/* Day labels */}
                <div className="flex flex-col gap-1 sm:gap-1.5 shrink-0">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
                    <div key={i} className="flex-1 flex items-center justify-end pr-1 min-h-[14px] sm:min-h-[18px]">
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 leading-none">{d}</span>
                    </div>
                  ))}
                </div>
                {/* Grid */}
                <div className="flex-1 flex gap-1 sm:gap-1.5 overflow-x-auto pb-2 custom-scrollbar items-start">
                  {heatmapData.weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1 sm:gap-1.5 flex-1 min-w-0">
                      {week.map((day, di) => (
                        <div key={di} className="relative group w-full aspect-square shrink-0">
                          <div
                            onClick={() => handleHeatmapDayClick(day)}
                            className={`w-full h-full rounded-[3px] sm:rounded-[4px] transition-all ${
                              day.isFuture ? 'bg-transparent' : getHeatmapColor(day.count, heatmapData.maxCount)
                            } ${day.count > 0 && !day.isFuture ? 'hover:ring-2 hover:ring-brand-navy/40 cursor-pointer hover:scale-110 relative z-10' : ''}`}
                          />
                          {!day.isFuture && (
                            <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 bg-brand-navy text-white text-[9px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
                              {day.count} TCLE{day.count !== 1 ? 's' : ''} • {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-2 mt-5 justify-end mt-auto">
                <span className="text-[9px] font-bold text-slate-400">Menos</span>
                {['bg-slate-100', 'bg-brand-champagne/40', 'bg-brand-champagne/70', 'bg-brand-champagne', 'bg-brand-navy'].map((c, i) => (
                  <div key={i} className={`w-[14px] h-[14px] rounded-[3px] ${c}`} />
                ))}
                <span className="text-[9px] font-bold text-slate-400">Mais</span>
              </div>
            </div>

            {/* ═══ GOOGLE CALENDAR WEEK VIEW ═══ */}
            <div className={`col-start-1 row-start-1 bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-100 shadow-sm flex flex-col transition-opacity duration-300 w-full h-full ${calendarRange === 'week' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              {loadingCalendar ? (
                <div className="flex items-center justify-center p-16 text-slate-400 h-full"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...</div>
              ) : (
                <div className="grid grid-cols-7 gap-1 sm:gap-2 h-full min-h-0">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const curr = new Date();
                    const dayDate = new Date(curr.setDate(curr.getDate() - 6 + i));
                    const dateKey = dayDate.toISOString().split('T')[0];
                    const items = calendarGrouped[dateKey] || [];
                    const isToday = dayDate.toDateString() === new Date().toDateString();

                    return (
                      <div key={i} className={`flex flex-col border-r border-slate-100 last:border-0 px-1 sm:px-2 min-h-0 ${isToday ? 'bg-slate-50/50 rounded-xl' : ''}`}>
                        <div className="flex flex-col items-center mb-3 shrink-0 pt-2">
                          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-brand-navy' : 'text-slate-400'}`}>
                            {dayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                          </span>
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black mt-1 ${isToday ? 'bg-brand-navy text-white shadow-md' : 'text-slate-700'}`}>
                            {dayDate.getDate()}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 pb-2 pr-[2px] flex-1 overflow-y-auto custom-scrollbar min-h-0">
                          {items.map(item => (
                            <div key={item.id} onClick={() => navigate(`/audit/${item.id}`)}
                              className="p-2 sm:p-2.5 rounded-xl border border-slate-100 hover:border-brand-champagne hover:shadow-sm transition-all cursor-pointer group flex flex-col gap-1.5 bg-white shadow-sm hover:-translate-y-0.5"
                            >
                              <div className="flex items-start justify-between min-w-0">
                                <span className="text-[10px] sm:text-xs font-black text-slate-700 truncate min-w-0 pr-1 group-hover:text-brand-navy transition-colors">{item.procedure_name}</span>
                              </div>
                              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 truncate w-full flex items-center gap-1">
                                <User className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{item.patient_name}</span>
                              </p>
                              <div className="mt-0.5 flex items-center justify-between">
                                {getStatusBadge(item.status)}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                  <ActionButtons item={item} compact={true} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ BOTTOM SECTION: Metrics & Patients ═══ */}
        <div className="flex flex-col xl:flex-row gap-6 shrink-0 xl:h-[380px]">
          
          {/* Left Column: Metrics 2x2 Grid */}
          <div className="xl:w-[55%] 2xl:w-[60%] shrink-0">
            {!loadingMetrics && metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Score Médio */}
                <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-brand-navy" />
                    <span className="text-[10px] font-black tracking-widest text-brand-navy uppercase">Score Médio</span>
                  </div>
                  <div className="flex items-end gap-3 flex-1">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E4E4E4" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                          stroke={metrics.compliance_score.average >= 80 ? '#10b981' : metrics.compliance_score.average >= 50 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="3" strokeDasharray={`${metrics.compliance_score.average}, 100`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-brand-navy">{Math.round(metrics.compliance_score.average)}%</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-end gap-px h-8 mb-1">
                        {metrics.compliance_score.trend.map((v, i) => (
                          <div key={i} className="flex-1 rounded-t-sm transition-colors"
                            style={{ height: `${Math.max(v, 5)}%`, backgroundColor: v >= 80 ? 'rgba(16,185,129,0.5)' : v >= 50 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)' }}
                            title={`TCLE ${i + 1}: ${v}% conformidade`} />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">{metrics.compliance_score.approved_count}/{metrics.compliance_score.total_consents} aprovados</p>
                    </div>
                  </div>
                </div>

                {/* Gatilhos de Risco */}
                <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-brand-navy" />
                    <span className="text-[10px] font-black tracking-widest text-brand-navy uppercase">Gatilhos de Risco</span>
                  </div>
                  {Object.keys(metrics.risk_triggers.triggers).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-3">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 mb-1" />
                      <p className="text-[10px] text-slate-400 font-bold text-center">Nenhum gatilho identificado</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 flex-1">
                      {Object.entries(metrics.risk_triggers.triggers).slice(0, 4).map(([name, count]) => {
                        const maxTrig = Math.max(...Object.values(metrics.risk_triggers.triggers));
                        return (
                          <div key={name}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]" title={name}>{name}</span>
                              <span className="text-[10px] font-black text-brand-navy">{count}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${(count / maxTrig) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tempo de Leitura */}
                <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-brand-navy" />
                    <span className="text-[10px] font-black tracking-widest text-brand-navy uppercase">Tempo de Leitura</span>
                  </div>
                  <div className="text-3xl font-black text-brand-navy mb-1">{fmtTime(metrics.reading_time.average_seconds)}</div>
                  <p className="text-[10px] font-bold text-slate-400 mb-2">Média de {metrics.reading_time.samples} assinaturas</p>
                  <div className="flex items-center gap-3 text-[10px] font-bold mt-auto">
                    <span className="text-slate-400">Mín: <span className="text-slate-600">{fmtTime(metrics.reading_time.min_seconds)}</span></span>
                    <span className="text-slate-400">Máx: <span className="text-slate-600">{fmtTime(metrics.reading_time.max_seconds)}</span></span>
                  </div>
                </div>

                {/* Assinaturas */}
                <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <PenTool className="w-4 h-4 text-brand-navy" />
                    <span className="text-[10px] font-black tracking-widest text-brand-navy uppercase">Assinaturas</span>
                  </div>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E4E4E4" strokeWidth="3" />
                        {metrics.signature_distribution.total > 0 && (
                          <>
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#081D3B" strokeWidth="3"
                              strokeDasharray={`${(metrics.signature_distribution.internal / metrics.signature_distribution.total) * 100}, 100`} strokeLinecap="round" />
                            {metrics.signature_distribution.govbr > 0 && (
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                                strokeDasharray={`${(metrics.signature_distribution.govbr / metrics.signature_distribution.total) * 100}, 100`}
                                strokeDashoffset={`-${(metrics.signature_distribution.internal / metrics.signature_distribution.total) * 100}`} strokeLinecap="round" />
                            )}
                          </>
                        )}
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-brand-navy">{metrics.signature_distribution.total}</span>
                    </div>
                    <div className="space-y-1.5 mt-auto mb-auto">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-brand-navy" /><span className="text-[10px] font-bold text-slate-500">Interna: <span className="text-brand-navy font-black">{metrics.signature_distribution.internal}</span></span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-slate-500">Gov.br: <span className="text-emerald-600 font-black">{metrics.signature_distribution.govbr}</span></span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Patient Folders sidebar */}
          <section className="xl:w-[45%] 2xl:w-[40%] bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[460px] xl:h-full shrink-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-brand-navy" />
                <h2 className="text-sm font-black tracking-widest text-brand-navy uppercase">Pastas de Pacientes</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">{patients.length} total</span>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input type="text" value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                placeholder="Buscar por nome ou CPF..."
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-brand-100 focus:border-brand-navy outline-none transition-all placeholder-slate-400 font-medium"
              />
              {patientSearch && <button onClick={() => setPatientSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X className="w-4 h-4" /></button>}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
              {loadingPatients ? (
                <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Sincronizando...</div>
              ) : patients.length === 0 ? (
                <div className="text-center py-8 flex flex-col items-center">
                  <User className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium text-sm">{patientSearch ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado.'}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {patients.map(p => (
                    <button key={p.id} onClick={() => setSelectedPatient(p)}
                      className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-brand-champagne hover:shadow-md transition-all text-left flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-brand-champagne/40 flex items-center justify-center text-brand-navy font-black text-[11px] uppercase shrink-0 group-hover:scale-110 transition-transform">
                          {getInitials(p.name)}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <h3 className="font-bold text-brand-navy text-sm truncate uppercase tracking-tight">{p.name}</h3>
                          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">CPF: {p.document_id}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        {getShieldBadge(p.shield_status)}
                        <span className="text-[10px] font-bold text-slate-400">{p.consents_count} TCLE{p.consents_count !== 1 ? 's' : ''}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ═══ PATIENT FOLDER MODAL ═══ */}
      {selectedPatient && (
        <PatientFolder patient={selectedPatient} onClose={() => setSelectedPatient(null)}
          onNewTcle={() => { setSelectedPatient(null); navigate(`/new-consent?patient_id=${selectedPatient.id}`); }}
          onViewConsent={(id) => { setSelectedPatient(null); navigate(`/audit/${id}`); }}
        />
      )}

      {/* ═══ HEATMAP DAY MODAL ═══ */}
      {heatmapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setHeatmapModal(null)}>
          <div className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-brand-navy p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-brand-champagne" />
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wider">
                    {new Date(heatmapModal.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <p className="text-white/60 text-xs font-bold">{heatmapModal.items.length} TCLE{heatmapModal.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={() => setHeatmapModal(null)} className="text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {heatmapModal.items.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">Nenhum TCLE neste dia.</p>
              ) : heatmapModal.items.map(item => (
                <div key={item.id}
                  className="p-4 rounded-xl border-2 border-slate-100 hover:border-brand-champagne hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between"
                  onClick={() => { setHeatmapModal(null); navigate(`/audit/${item.id}`); }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-brand-navy/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-700 truncate group-hover:text-brand-navy transition-colors">{item.procedure_name}</p>
                      <p className="text-[11px] text-slate-400 font-bold truncate">{item.patient_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionButtons item={item} compact />
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
