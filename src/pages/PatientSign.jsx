import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, KeyRound, Loader2, Lock } from 'lucide-react';
import api from '../services/api';

export default function PatientSign() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  
  const [basicInfo, setBasicInfo] = useState(null);
  const [pin, setPin] = useState('');

  useEffect(() => {
    fetchBasicInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBasicInfo = async () => {
    try {
      const res = await api.get(`/consents/${id}/basic-info`);
      setBasicInfo(res.data);
      if (res.data.status === 'SIGNED') {
          // Already signed — redirect to audit page
          navigate(`/audit/${id}`, { replace: true });
          return;
      }
    } catch (err) {
      setError('Documento não encontrado ou indisponível.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    
    setVerifying(true);
    setError(null);
    try {
      const res = await api.post(`/consents/${id}/verify-pin`, { pin });
      const token = res.data.access_token;
      
      sessionStorage.setItem(`consent_token_${id}`, token);
      navigate(`/verify/${id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'PIN incorreto. Tente novamente.';
      setError(errorMsg);
      setPin('');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <Loader2 className="w-10 h-10 text-brand-navy animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header — brand-navy */}
      <header className="bg-brand-navy px-8 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
            <div className="bg-brand-champagne text-brand-navy p-2.5 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight text-white uppercase">Sentinel<span className="text-brand-champagne">ID</span></span>
        </div>
        <div className="text-[10px] font-black tracking-widest px-4 py-1.5 bg-white/10 text-brand-champagne rounded-full border border-white/20 uppercase flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Ambiente Seguro
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 border border-slate-100">
          
          <div className="text-center mb-8">
            <div className="mx-auto flex justify-center mb-6">
                <div className="bg-brand-champagne/30 p-4 rounded-2xl">
                    <KeyRound className="w-10 h-10 text-brand-navy stroke-[1.5]" />
                </div>
            </div>
            <p className="text-brand-navy text-sm font-medium px-4 leading-relaxed">
                Verificação de segurança necessária para acessar seu Termo de Consentimento.
            </p>
          </div>

          <div>
            {error && !basicInfo ? (
               <div className="text-center">
                 <div className="mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                     <AlertCircle className="w-8 h-8 text-red-500" />
                 </div>
                 <p className="text-slate-600 font-bold">{error}</p>
               </div>
            ) : (
                <>
                  <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Paciente</p>
                      <p className="font-black text-brand-navy mb-4">{basicInfo?.patient_name_initials}***</p>
                      
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Procedimento</p>
                      <p className="font-bold text-brand-navy mb-4 text-sm">{basicInfo?.procedure_name}</p>
                      
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Médico(a) Responsável</p>
                      <p className="font-bold text-brand-navy text-sm">Dr(a). {basicInfo?.doctor_name}</p>
                  </div>

                  {error && (
                     <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-3 border border-red-100">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="font-medium">{error}</span>
                     </div>
                  )}

                  <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black tracking-widest text-brand-navy uppercase mb-1.5">
                            Código de Acesso (PIN)
                        </label>
                        <p className="text-[13px] text-slate-400 mb-4">
                            Digite os 4 dígitos recebidos via WhatsApp.
                        </p>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                            disabled={verifying || basicInfo?.status === 'SIGNED'}
                            className="w-full text-center text-3xl font-black tracking-[1em] indent-[1em] py-5 bg-white border-[2.5px] border-slate-200 rounded-2xl focus:border-brand-navy focus:ring-4 focus:ring-brand-champagne/30 transition-all outline-none text-brand-navy placeholder:text-slate-200"
                            placeholder="    "
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={pin.length !== 4 || verifying || basicInfo?.status === 'SIGNED'}
                        className="w-full bg-brand-navy hover:bg-brand-navy/90 text-brand-champagne font-black tracking-widest uppercase text-sm py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-navy/20"
                    >
                        {verifying ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</>
                        ) : (
                            'Acessar Documento'
                        )}
                    </button>
                  </form>
                </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
