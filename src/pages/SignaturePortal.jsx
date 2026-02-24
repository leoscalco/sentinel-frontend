/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, ShieldCheck, FileSignature } from 'lucide-react';
import SignatureCanvas from '../components/ui/SignatureCanvas';
import api from '../services/api';
import { useSignature } from '../hooks/useSignature';

export default function SignaturePortal() {
  const { id } = useParams();
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canSign, setCanSign] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5); // Fast demo time. Use 15-30s in prod.
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);

  const sigPad = useRef({});
  const { metadata, captureEvidence } = useSignature();

  useEffect(() => {
    fetchConsent();
  }, [id]);

  useEffect(() => {
    if (timeLeft > 0 && consent && !loading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanSign(true);
    }
  }, [timeLeft, consent, loading]);

  const fetchConsent = async () => {
    try {
      const res = await api.get(`/consents/${id}`);
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
    
    // Get base64 signature (remove scheme prefix for some backends if needed, but usually data:image/png... is fine)
    const signatureData = sigPad.current.toDataURL(); 
    const evidence = captureEvidence();

    try {
      // Backend expects: { signature_image: "", metadata: {}, govbr_token: null }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Erro de Acesso</h3>
            <p className="text-slate-500 mt-2">{error}</p>
        </div>
    </div>
  );

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Documento Assinado!</h2>
        <p className="text-slate-600 mb-6">
          O Termo de Consentimento foi registrado com sucesso na Blockchain Sentinel.
          Uma cópia será enviada para seu WhatsApp.
        </p>
        <div className="bg-slate-50 p-4 rounded-lg text-xs text-left text-slate-500 font-mono border border-slate-200 break-all">
           <strong>Hash de Integridade:</strong><br/>
           {consent.sha256_hash || "Calculando..."} <br/><br/>
           <strong>Carimbo de Tempo:</strong><br/>
           {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-600" />
            <span className="font-bold text-lg tracking-tight">Sentinel<span className="text-brand-600">ID</span></span>
        </div>
        <div className="text-xs font-medium px-2 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-100 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Ambiente Seguro
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        
        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h1 className="text-xl font-bold mb-1 text-slate-900">{consent.procedure_name}</h1>
            <p className="text-sm text-slate-500 mb-4">Dr(a). {consent.doctor.name} • CRM {consent.doctor.crm}</p>
            
            <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <h3 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Importante
                    </h3>
                    <p className="text-sm text-amber-900 leading-relaxed">
                        Este procedimento possui riscos específicos. Ao assinar, você confirma que leu os termos abaixo e entendeu as explicações médicas.
                    </p>
                </div>
            </div>
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
             <h3 className="font-semibold text-slate-800 border-b pb-2">Termos do Procedimento</h3>
             <div className="prose prose-sm prose-slate text-slate-600 max-h-80 overflow-y-auto p-4 bg-slate-50 rounded-lg text-justify border border-slate-200">
                {consent.clauses && consent.clauses.length > 0 ? (
                    consent.clauses.map((clause, idx) => (
                        <div key={idx} className="mb-4 last:mb-0">
                            <strong className="block text-slate-800 mb-1 text-xs uppercase tracking-wide">{clause.category}</strong>
                            <p className="text-sm leading-relaxed">{clause.text}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-400 italic">Nenhum termo disponível para visualização.</p>
                )}
             </div>
        </div>

        {/* Sign Section */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Sua Assinatura</h3>
                {!canSign && (
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded animate-pulse">
                        <Clock className="w-3 h-3" /> Leia por {timeLeft}s
                    </span>
                )}
            </div>
            
            <SignatureCanvas ref={sigPad} />
            
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                 <span>IP Seguro: {metadata.ip || 'Detectando...'}</span>
                 <button onClick={() => sigPad.current.clear()} className="text-brand-600 hover:underline">Limpar</button>
            </div>

            <button
                onClick={handleSign}
                disabled={!canSign || signing}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden
                    ${!canSign || signing 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-brand-600 text-white shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-[0.98]'
                    }`}
            >
                {signing ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
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
