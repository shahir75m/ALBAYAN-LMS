
import React, { useState, useMemo } from 'react';
import { User, Role } from '../types';
import Logo from './Logo';
import About from './About';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';

interface LoginProps {
  onLogin: (userData: User) => void;
  onIdentify: (identity: { id: string, name: string, avatarUrl?: string }) => void;
  initialIdentity: { id: string, name: string, avatarUrl?: string } | null;
  onClearIdentity: () => void;
  availableUsers: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onIdentify, initialIdentity, onClearIdentity, availableUsers }) => {
  const [step, setStep] = useState<'IDENTIFY' | 'PORTAL' | 'USER_PICK' | 'ADMIN_AUTH'>(initialIdentity ? 'PORTAL' : 'IDENTIFY');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const storedAdminPass = localStorage.getItem('adminPassword') || 'admin@484';
  const [isSyncing, setIsSyncing] = useState(false);

  const { t, isRTL, setLanguage, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const handleManualIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) { setError(t('enter_id') || "Please enter your User ID or Name."); return; }
    setIsSyncing(true);
    setTimeout(() => {
      onIdentify({ id: manualEmail, name: manualEmail.includes('@') ? manualEmail.split('@')[0] : manualEmail });
      setIsSyncing(false);
      setStep('PORTAL');
      setError(null);
    }, 600);
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassInput === storedAdminPass) {
      setStep('USER_PICK');
      setError(null);
    } else {
      setError(t('incorrect_pass') || "Incorrect Admin Password.");
    }
  };

  const handleRoleCardClick = (role: Role) => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setStep('ADMIN_AUTH');
      setAdminPassInput('');
    } else {
      setStep('USER_PICK');
      setUserSearch('');
    }
    setError(null);
  };

  const filteredUsers = useMemo(() => {
    const list = [...availableUsers].filter(u => u.role === selectedRole);
    if (selectedRole === 'ADMIN' && !list.find(u => u.id === storedAdminPass)) {
      list.push({ id: storedAdminPass, name: 'Master Admin', role: 'ADMIN', class: 'System' });
    }
    return list.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.id.toLowerCase().includes(userSearch.toLowerCase()));
  }, [availableUsers, selectedRole, userSearch, storedAdminPass]);

  const handleFinalSelect = (user: User) => {
    onLogin(user);
  };

  if (step === 'IDENTIFY') {
    return (
      <div className={`min-h-screen bg-[#09090b] flex items-center justify-center p-4 ${isRTL ? 'font-arabic' : ''}`}>
        <div className="absolute top-8 right-8 flex gap-3 z-50">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none hover:border-zinc-700 transition-all cursor-pointer"
          >
            <option value="en">English</option>
            <option value="ml">Malayalam</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
        <div className="w-full max-w-[400px] bg-[#0c0c0e] border border-zinc-900 rounded-3xl p-8 md:p-10 shadow-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full"></div>
          <div className={`flex flex-col items-center mb-10 ${isRTL ? 'text-right' : ''}`}>
            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm mb-6">
              <Logo className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">{t('identify')}</h2>
            <p className="text-zinc-500 text-xs mt-2 text-center">{isRTL ? 'ادخل هويتك للمتابعة' : 'Enter your ID to proceed to portals'}</p>
          </div>
          <div className="space-y-6">
            <form onSubmit={handleManualIdentify} className="space-y-4">
              <div className="space-y-2">
                <label className={`text-[10px] font-medium uppercase tracking-wider text-zinc-500 ml-1 ${isRTL ? 'text-right block' : ''}`}>{t('id_card')}</label>
                <input
                  type="text"
                  placeholder="ID"
                  className={`w-full bg-[#09090b] border border-zinc-800 rounded-xl px-5 py-3.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all ${isRTL ? 'text-right' : ''}`}
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSyncing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98]"
              >
                {isSyncing ? t('verifying') : t('identify')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'ADMIN_AUTH') {
    return (
      <div className={`min-h-screen bg-[#09090b] flex items-center justify-center p-4 ${isRTL ? 'font-arabic' : ''}`}>
        <div className={`w-full max-w-[400px] bg-[#0c0c0e] border border-zinc-900 rounded-3xl p-8 md:p-10 shadow-3xl relative overflow-hidden ${isRTL ? 'text-right' : ''}`}>
          <div className="mb-8">
            <button onClick={() => setStep('PORTAL')} className={`text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-all text-xs mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              {t('back_to_portals')}
            </button>
            <h2 className="text-xl font-semibold tracking-tight text-white">{t('admin_auth')}</h2>
          </div>
          <form onSubmit={handleAdminVerify} className="space-y-4">
            <input autoFocus type="password" placeholder="••••••••" className={`w-full bg-[#09090b] border border-zinc-800 rounded-xl px-5 py-3.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all ${isRTL ? 'text-right' : ''}`} value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-3.5 rounded-xl transition-all shadow-lg">{t('access_admin')}</button>
          </form>
          {error && <p className="text-red-400 text-xs mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  if (step === 'PORTAL') {
    return (
      <div className={`min-h-screen bg-[#09090b] overflow-y-auto no-scrollbar scroll-smooth ${isRTL ? 'font-arabic' : ''}`}>
        <div className="min-h-screen library-bg flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 relative overflow-hidden">
          <div className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'} z-20`}>
            <button onClick={() => handleRoleCardClick('ADMIN')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-white transition-all backdrop-blur-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span className="text-xs font-black uppercase tracking-widest">{t('staff_access')}</span>
            </button>
          </div>
          <div className="text-center mb-12 z-10">
            <div className="flex justify-center mb-6">
              <div className={`p-5 bg-zinc-900/70 rounded-[2rem] border border-zinc-800 shadow-2xl backdrop-blur-xl flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Logo className="w-16 h-16" />
                <div className={`text-left border-zinc-800 pl-4 ${isRTL ? 'border-r pr-4' : 'border-l pl-4 font-serif'}`}>
                  <span className="block text-white tracking-tight text-2xl leading-none">BAYANUL</span>
                  <span className="block text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">ULOOM</span>
                </div>
              </div>
            </div>
            <h2 className="text-5xl font-serif text-white tracking-tight">{t('select_portal')}</h2>
          </div>
          <div className="w-full max-w-lg z-10 flex flex-col gap-6">
            <button onClick={() => handleRoleCardClick('STUDENT')} className="group relative w-full glass-card p-12 rounded-[3rem] text-center transition-all hover:scale-[1.02] shadow-2xl border border-white/5">
              <h3 className="text-4xl font-serif text-white tracking-wide mb-4">{t('student_access')}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-[320px] mx-auto font-medium">
                {isRTL ? 'ادخل إلى المكتبة الرقمية لاستكشاف الكتب وإدارة حقيبتك ومتابعة الطلبات.' : 'Enter the digital library to explore books, manage your bag, and track requests.'}
              </p>
              <div className={`mt-12 flex items-center justify-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-widest group-hover:gap-5 transition-all ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                <span>{t('student_portal')}</span>
                <svg className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </button>
            <button onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })} className={`text-zinc-600 hover:text-zinc-400 text-[11px] font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 group py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {t('learn_more')}
              <svg className="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
          <button onClick={onClearIdentity} className={`mt-12 text-zinc-700 hover:text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 group z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="w-8 h-[1px] bg-zinc-900 transition-all group-hover:w-12 group-hover:bg-zinc-700"></span>
            {t('switch_identity')}
          </button>
        </div>
        <div id="about-section" className="border-t border-zinc-900 bg-[#09090b]">
          <About studentsCount={availableUsers.filter(u => u.role === 'STUDENT').length} />
        </div>
      </div>
    );
  }

  if (step === 'USER_PICK' && selectedRole) {
    return (
      <div className={`min-h-screen bg-[#09090b] flex flex-col items-center justify-start py-12 md:py-20 px-6 animate-in fade-in duration-500 ${isRTL ? 'font-arabic' : ''}`}>
        <div className={`w-full max-w-2xl ${isRTL ? 'text-right' : ''}`}>
          <button onClick={() => setStep('PORTAL')} className={`mb-8 text-zinc-500 hover:text-zinc-300 flex items-center gap-2 group transition-all text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
            <svg className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {t('back_to_portals')}
          </button>
          <div className={`mb-10 ${isRTL ? 'text-right' : ''}`}>
            <h2 className="text-3xl font-semibold text-white tracking-tight">{t('select_account')}</h2>
            <p className="text-zinc-500 text-sm mt-1">{selectedRole}</p>
          </div>
          <div className="relative mb-10">
            <input type="text" placeholder={t('search_users')} className={`w-full bg-[#0c0c0e] border border-zinc-900 rounded-2xl p-4 text-sm text-white outline-none focus:border-zinc-700 transition-all ${isRTL ? 'text-right' : ''}`} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto no-scrollbar">
            {filteredUsers.map(user => (
              <button key={user.id} onClick={() => handleFinalSelect(user)} className={`flex items-center gap-4 bg-[#0c0c0e] border border-zinc-900 hover:border-zinc-800 p-4 rounded-2xl text-left transition-all active:scale-[0.98] group ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-500 transition-all overflow-hidden shrink-0">
                  {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{user.name.charAt(0)}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">{user.name}</p>
                  <p className="text-[10px] text-zinc-600 truncate uppercase tracking-wider">{user.id}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default Login;
