/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, ShieldCheck, FileSignature, Loader2, Lock, Download } from 'lucide-react';
import SignatureCanvas from '../components/ui/SignatureCanvas';
import api from '../services/api';
import { useSignature } from '../hooks/useSignature';

export default function SignaturePortal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canSign, setCanSign] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5); // Fast demo time. Use 15-30s in prod.
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await api.post(`/consents/${id}/pdf`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TCLE_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF', error);
      alert('Erro ao gerar PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const sigPad = useRef({});
  const { metadata, captureEvidence } = useSignature();

  useEffect(() => {
    // If we're on the verify route, there must be a valid PIN session token
    const token = sessionStorage.getItem(`consent_token_${id}`);
    if (!token) {
        // Redirect to PIN entry if no token
        navigate(`/sign/${id}`);
        return;
    }
    fetchConsent(token);
  }, [id, navigate]);

  useEffect(() => {
    if (timeLeft > 0 && consent && !loading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanSign(true);
    }
  }, [timeLeft, consent, loading]);

  const fetchConsent = async (token) => {
    try {
      const res = await api.get(`/consents/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setConsent(res.data);
    } catch (err) {
      setError('Documento não encontrado ou inválido.');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (sigPad.current.isEmpty()) {
      alert("Por favor, assine o documento.");
      return;
    }

    setSigning(true);
    
    const signatureData = sigPad.current.toDataURL(); 
    const evidence = captureEvidence();

    try {
      await api.post(`/consents/${id}/sign/patient`, {
        signature_image: signatureData,
        metadata: evidence
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar assinatura. Tente novamente.");
      setSigning(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-brand-navy animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-lg text-center max-w-sm border border-slate-100 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-brand-navy">Erro de Acesso</h3>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">{error}</p>
        </div>
    </div>
  );

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-navy p-6">
      <div className="bg-white p-10 rounded-[2rem] shadow-2xl text-center max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="mx-auto bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-brand-navy mb-2">Documento Assinado!</h2>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          O Termo de Consentimento foi registrado com sucesso na Blockchain Sentinel.
          Uma cópia será enviada para seu WhatsApp.
        </p>
        <div className="bg-slate-50 p-5 rounded-2xl text-xs text-left text-slate-500 font-mono border border-slate-200 break-all space-y-3">
           <div>
               <strong className="text-brand-navy text-[10px] uppercase tracking-widest block mb-1">Hash de Integridade</strong>
               {consent.sha256_hash || "Calculando..."}
           </div>
           <div>
               <strong className="text-brand-navy text-[10px] uppercase tracking-widest block mb-1">Carimbo de Tempo</strong>
               {new Date().toLocaleString()}
           </div>
        </div>
        <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="w-full mt-6 py-4 bg-brand-navy text-brand-champagne rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-brand-navy/90 transition-colors disabled:opacity-50 shadow-lg shadow-brand-navy/20"
        >
            {downloadingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Baixar PDF do TCLE
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header — brand-navy */}
      <header className="bg-brand-navy px-6 py-4 sticky top-0 z-10 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="bg-brand-champagne text-brand-navy p-2 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-black text-lg tracking-tight text-white uppercase">Sentinel<span className="text-brand-champagne">ID</span></span>
        </div>
        <div className="text-[10px] font-black tracking-widest px-4 py-1.5 bg-white/10 text-brand-champagne rounded-full border border-white/20 uppercase flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Ambiente Seguro
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Info Card */}
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6">
            <h1 className="text-xl font-black mb-1 text-brand-navy">{consent.procedure_name}</h1>
            <p className="text-sm text-slate-500 mb-4">Dr(a). {consent.doctor.name} • CRM {consent.doctor.crm}</p>
            
            <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <h3 className="text-xs font-black text-amber-800 mb-1 flex items-center gap-2 uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4" /> Importante
                    </h3>
                    <p className="text-sm text-amber-900 leading-relaxed">
                        Este procedimento possui riscos específicos. Ao assinar, você confirma que leu os termos abaixo e entendeu as explicações médicas.
                    </p>
                </div>
            </div>
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6 space-y-4">
             <h3 className="font-black text-brand-navy border-b border-slate-100 pb-3 uppercase tracking-wide text-sm">Termos do Procedimento</h3>
             <div className="prose prose-sm prose-slate text-slate-600 max-h-80 overflow-y-auto p-5 bg-slate-50 rounded-2xl text-justify border border-slate-100">
                {consent.clauses && consent.clauses.length > 0 ? (
                    consent.clauses.map((clause, idx) => (
                        <div key={idx} className="mb-4 last:mb-0">
                            <strong className="block text-brand-navy mb-1 text-[10px] uppercase tracking-widest">{clause.title || clause.category}</strong>
                            <p className="text-sm leading-relaxed">{clause.template_text || clause.text}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-400 italic">Nenhum termo disponível para visualização.</p>
                )}
             </div>
        </div>

        {/* Sign Section */}
        <div className="bg-white rounded-[1.5rem] shadow-lg border border-slate-100 p-6 ring-1 ring-brand-navy/5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-brand-navy uppercase tracking-wide text-sm">Sua Assinatura</h3>
                {!canSign && (
                    <span className="text-[10px] font-black tracking-widest text-brand-navy flex items-center gap-1.5 bg-brand-champagne/30 px-3 py-1.5 rounded-full animate-pulse uppercase">
                        <Clock className="w-3 h-3" /> Leia por {timeLeft}s
                    </span>
                )}
            </div>
            
            <SignatureCanvas ref={sigPad} />
            
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                 <span className="font-mono text-[11px]">IP Seguro: {metadata.ip || 'Detectando...'}</span>
                 <button onClick={() => sigPad.current.clear()} className="text-brand-navy font-bold hover:underline text-xs uppercase tracking-wide">Limpar</button>
            </div>

            <button
                onClick={handleSign}
                disabled={!canSign || signing}
                className={`w-full mt-6 py-4 rounded-2xl font-black text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 relative overflow-hidden
                    ${!canSign || signing 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-brand-navy text-brand-champagne shadow-lg shadow-brand-navy/20 hover:bg-brand-navy/90 active:scale-[0.98]'
                    }`}
            >
                {signing ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Registrando na Blockchain...
                    </span>
                ) : (
                    <>
                        <FileSignature className="w-5 h-5" />
                        Assinar Digitalmente
                    </>
                )}
            </button>
        </div>
      </main>
    </div>
  );
}
