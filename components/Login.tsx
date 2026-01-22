
import React, { useState, useMemo } from 'react';
import { User, Role } from '../types';
import Logo from './Logo';
import About from './About';

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


  const handleManualIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) {
      setError("Please enter your User ID or Name.");
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      onIdentify({
        id: manualEmail,
        name: manualEmail.includes('@') ? manualEmail.split('@')[0] : manualEmail,
      });
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
      setError("Incorrect Admin Password.");
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

    return list.filter(u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [availableUsers, selectedRole, userSearch]);

  const handleFinalSelect = (user: User) => {
    onLogin(user);
  };

  if (step === 'IDENTIFY') {
    return (
      <div className="min-h-screen bg-[#09090b] overflow-y-auto no-scrollbar scroll-smooth">
        {/* Landing Page Navbar */}
        <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-xl border-b border-zinc-900/50 bg-[#09090b]/80">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-white font-serif text-lg tracking-tight">AL BAYAN</span>
          </div>
          <button
            onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500 transition-colors"
          >
            About Library
          </button>
        </nav>

        <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20">
          <div className="w-full max-w-[400px] bg-[#0c0c0e] border border-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-3xl relative overflow-hidden animate-in fade-in zoom-in duration-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full"></div>
            <div className="flex flex-col items-center mb-10">
              <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm mb-6">
                <Logo className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-white">Library Access</h2>
              <p className="text-zinc-500 text-xs mt-2 text-center">Enter your User ID to proceed to portals</p>
            </div>
            <div className="space-y-6">
              <form onSubmit={handleManualIdentify} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 ml-1">User ID</label>
                  <input
                    type="text"
                    placeholder="e.g. library_user_123"
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-5 py-3.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                >
                  {isSyncing ? "Verifying..." : "Continue to Portals"}
                </button>
              </form>

              <div className="pt-4 flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-px bg-zinc-900 flex-1"></div>
                  <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">Or</span>
                  <div className="h-px bg-zinc-900 flex-1"></div>
                </div>
                <button
                  onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-all flex items-center gap-2 group"
                >
                  Explore Library Details
                  <svg className="w-3 h-3 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-[10px] font-medium text-center bg-red-500/5 py-3 rounded-lg border border-red-500/10">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] animate-pulse">
            Scroll down to learn more
          </div>
        </div>

        {/* About Section on Landing Page */}
        <div id="about-section" className="border-t border-zinc-900 bg-[#09090b] py-20">
          <div className="max-w-4xl mx-auto px-6 mb-16 text-center">
            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              Library Overview
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-white mb-6">അറിവിന്റെ അക്ഷയഖനി</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              മുട്ടിച്ചിറ ശുഹദാക്കളുടെ സ്മരണയിൽ വിജ്ഞാനത്തിന്റെ വിളഭൂമിയായി പടുത്തുയർത്തിയ ആധുനിക ലൈബ്രറി സംവിധാനം.
            </p>
          </div>
          <About />
          <div className="max-w-md mx-auto px-6 mt-12 mb-20 text-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest transition-all hover:text-emerald-500"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'ADMIN_AUTH') {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-[#0c0c0e] border border-zinc-900 rounded-3xl p-8 md:p-10 shadow-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full"></div>
          <div className="mb-8">
            <button onClick={() => setStep('PORTAL')} className="text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-all text-xs mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Portals
            </button>
            <h2 className="text-xl font-semibold tracking-tight text-white">Admin Verification</h2>
            <p className="text-zinc-500 text-xs mt-2">Enter your administration password</p>
          </div>
          <div className="space-y-6">
            <form onSubmit={handleAdminVerify} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 ml-1">Password</label>
                <input
                  autoFocus
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-5 py-3.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all"
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
              >
                Access Admin Portal
              </button>
            </form>
            {error && (
              <p className="text-red-400 text-[10px] font-medium text-center bg-red-500/5 py-3 rounded-lg border border-red-500/10">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'PORTAL' && initialIdentity) {
    return (
      <div className="min-h-screen library-bg flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 relative overflow-hidden">
        {/* Subtle Admin Access in Corner */}
        <div className="absolute top-8 right-8 z-20">
          <button
            onClick={() => handleRoleCardClick('ADMIN')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:text-white transition-all group backdrop-blur-md"
          >
            <svg className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs font-medium tracking-wide">Staff Access</span>
          </button>
        </div>

        {/* Hero Content */}
        <div className="text-center mb-12 z-10">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm">
              <Logo className="w-16 h-16" />
            </div>
          </div>
          <h2 className="text-4xl font-serif text-white/90 tracking-tight drop-shadow-lg">Select Portal</h2>
          <div className="h-1 w-20 bg-emerald-500/50 mx-auto mt-4 rounded-full blur-[1px]"></div>
        </div>

        <div className="w-full max-w-lg z-10">
          <button
            onClick={() => handleRoleCardClick('STUDENT')}
            className="group relative w-full glass-card p-12 rounded-[2.5rem] text-center transition-all hover:scale-[1.02] active:scale-[0.98] animate-in zoom-in duration-700"
          >
            {/* Animated Glow behind icon */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-700"></div>

            <div className="relative">
              <div className="w-20 h-20 bg-zinc-900/80 rounded-3xl border border-zinc-700/50 flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:border-emerald-500/30 transition-all duration-500">
                <svg className="w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              <h3 className="text-3xl font-serif text-white tracking-wide mb-4">Student Access</h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                Enter the digital library to explore books, manage your bag, and track requests.
              </p>

              <div className="mt-10 flex items-center justify-center gap-2 text-emerald-400 font-medium text-sm group-hover:gap-4 transition-all duration-300">
                <span>Enter Portal</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClearIdentity}
          className="mt-16 text-zinc-500 hover:text-zinc-300 text-[10px] font-medium uppercase tracking-[0.2em] transition-all flex items-center gap-3 group z-10"
        >
          <span className="w-6 h-[1px] bg-zinc-800 transition-all group-hover:w-10 group-hover:bg-zinc-600"></span>
          Switch Identity
        </button>
      </div>
    );
  }

  if (step === 'USER_PICK' && selectedRole) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-start py-12 md:py-20 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full max-w-2xl">
          <button onClick={() => setStep('PORTAL')} className="mb-8 text-zinc-500 hover:text-zinc-300 flex items-center gap-2 group transition-all text-xs">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Portals</span>
          </button>

          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-white tracking-tight">Select Account</h2>
            <p className="text-zinc-500 text-sm mt-1">{selectedRole} Directory</p>
          </div>

          <div className="relative mb-10">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              autoFocus
              type="text"
              placeholder={`Search ${selectedRole.toLowerCase()}s...`}
              className="w-full bg-[#0c0c0e] border border-zinc-900 rounded-2xl pl-12 pr-6 py-4 text-sm text-white outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-700"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto no-scrollbar pr-1 pb-10">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleFinalSelect(user)}
                className="flex items-center gap-4 bg-[#0c0c0e] border border-zinc-900 hover:border-zinc-800 p-4 rounded-2xl text-left transition-all active:scale-[0.98] group"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-500 transition-all overflow-hidden shrink-0">
                  {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{user.name.charAt(0)}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">{user.name}</p>
                  <p className="text-[10px] text-zinc-600 truncate uppercase tracking-wider">{user.id === storedAdminPass ? '••••••••' : user.id}</p>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-zinc-900 rounded-2xl">
                <p className="text-zinc-600 text-xs">No matching users found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Login;
