import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col font-sans">
            {/* Navbar */}
            <nav className="flex justify-between items-center p-6 bg-brand-navy text-white">
                <div className="text-2xl font-bold tracking-widest text-brand-champagne">
                    SENTINEL
                </div>
                <div className="space-x-4">
                    <button 
                        onClick={() => navigate('/login')}
                        className="text-white hover:text-brand-champagne transition"
                    >
                        Entrar
                    </button>
                    <button 
                        onClick={() => navigate('/register')}
                        className="bg-brand-champagne text-brand-navy px-4 py-2 rounded font-bold hover:opacity-90 transition"
                    >
                        Cadastre-se
                    </button>
                </div>
            </nav>

            {/* Hero Section - Concept 1 (Navy Blue) */}
            <main className="flex-1">
                <section className="bg-brand-navy text-white min-h-[60vh] flex flex-col justify-center items-center text-center px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 max-w-3xl leading-tight text-white">
                        SEU TERMO É UM <span className="text-brand-champagne">ESCUDO</span> OU APENAS UM PAPEL?
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-12">
                        Por que modelos genéricos falham exatamente quando você mais precisa deles.
                    </p>
                    <button 
                        onClick={() => navigate('/register')}
                        className="bg-brand-champagne text-brand-navy text-lg px-8 py-3 rounded font-bold hover:scale-105 transition-transform"
                    >
                        Descubra a Diferença
                    </button>
                </section>

                {/* Value Proposition - Concept 2 (Light Gray) */}
                <section className="bg-brand-gray text-brand-navy py-24 px-4 flex flex-col justify-center items-center text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 max-w-3xl leading-snug">
                        NA <span className="text-blue-700">INTERCORRÊNCIA</span>, O PACIENTE <span className="text-blue-700">ESQUECE</span> O QUE VOCÊ DISSE.
                    </h2>
                    <h3 className="text-2xl font-semibold mb-12">
                        O QUE TE SALVA É O QUE VOCÊ CONSEGUE PROVAR.
                    </h3>
                    
                    <div className="max-w-2xl bg-white p-8 border-l-4 border-brand-navy shadow-lg text-left">
                        <p className="text-lg leading-relaxed text-gray-700">
                            Se o seu <strong>TCLE não previu</strong> aquela <strong>complicação</strong> específica 
                            ou a <strong>biologia individual</strong> do paciente, ele <strong>será usado contra você para alegar omissão</strong>.
                        </p>
                    </div>
                </section>
            </main>

            <footer className="bg-brand-navy text-white text-center py-6 text-sm opacity-80 border-t border-brand-navy/50">
                &copy; 2026 Sentinel. Todos os direitos reservados.
            </footer>
        </div>
    );
};

export default Landing;
