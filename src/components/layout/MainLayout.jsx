import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FileText, User, LogOut, ShieldCheck, Plus } from 'lucide-react';

export default function MainLayout({ title, subtitle, showNewTcle = false, fullWidth = false, children }) {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Painel', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Histórico', path: '/documents', icon: FileText },
    { name: 'Meu Perfil', path: '/profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-[80px] bg-brand-navy flex flex-col items-center py-6 shadow-xl z-20 shrink-0 h-full">
        {/* Logo/Shield Area */}
        <div className="bg-brand-champagne text-brand-navy p-3 rounded-2xl shadow-inner mb-8">
            <ShieldCheck className="w-6 h-6" />
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 w-full flex flex-col items-center gap-6 mt-4">
            {navLinks.map((link) => {
                const isActive = location.pathname.startsWith(link.path);
                const Icon = link.icon;
                return (
                    <Link
                        key={link.path}
                        to={link.path}
                        title={link.name}
                        className={`p-3 rounded-xl transition-all duration-200 ${
                            isActive 
                            ? 'bg-white/10 text-brand-champagne shadow-sm' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Icon className="w-5 h-5" />
                    </Link>
                );
            })}
        </nav>

        {/* Logout */}
        <button 
            onClick={logout}
            title="Sair"
            className="p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all mt-auto"
        >
            <LogOut className="w-5 h-5" />
        </button>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between z-10 shrink-0">
             <div className="flex items-center gap-4">
                 <h1 className="text-xl font-black tracking-tight text-brand-navy uppercase">{title || "SENTINEL AEGIS"}</h1>
                 {subtitle && (
                     <>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">{subtitle}</span>
                     </>
                 )}
             </div>
             
             <div className="flex items-center gap-6">
                {showNewTcle && (
                    <button 
                        onClick={() => navigate('/new-consent')}
                        className="bg-brand-navy text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-md active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> NOVO TCLE
                    </button>
                )}
             </div>
          </header>

          {/* Scrolling Content Area */}
          <main className={`flex-1 overflow-y-auto p-4 sm:p-8 w-full bg-slate-50 ${fullWidth ? '' : 'max-w-6xl mx-auto'}`}>
              <div className="w-full h-full">
                {children || <Outlet />}
              </div>
          </main>
      </div>
    </div>
  );
}
