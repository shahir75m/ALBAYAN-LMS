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
      setError("Invalid password.");
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
    let list = [...availableUsers];

    if (selectedRole === 'ADMIN') {
      // Admin Directory flow: show ONLY Admins
      list = list.filter(u => u.role === 'ADMIN');
      if (!list.find(u => u.id === storedAdminPass)) {
        list.push({ id: storedAdminPass, name: 'Master Admin', role: 'ADMIN', class: 'System' });
      }
    } else {
      // Library Portal flow: show ONLY Students and Usthads (Hide Admins)
      list = list.filter(u => u.role !== 'ADMIN');
    }

    return list.filter(u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase())
    ).sort((a, b) => {
      // 1. Role priority: USTHAD first
      if (a.role === 'USTHAD' && b.role !== 'USTHAD') return -1;
      if (a.role !== 'USTHAD' && b.role === 'USTHAD') return 1;

      // 2. Numeric ID sorting
      const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
      const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
      if (idA !== idB) return idA - idB;

      // 3. Fallback to name
      return a.name.localeCompare(b.name);
    });
  }, [availableUsers, selectedRole, userSearch]);

  // --- Components for Sub-steps ---

  const MinimalInput = ({ label, ...props }: any) => (
    <div className="group">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 group-focus-within:text-teal-600 transition-colors px-1">{label}</label>
      <input
        {...props}
        className="neo-input w-full rounded-2xl text-sm py-4 px-6 outline-none transition-all placeholder:text-gray-400/50"
      />
    </div>
  );

  const PrimaryButton = ({ children, isLoading, ...props }: any) => (
    <button
      {...props}
      disabled={isLoading}
      className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${props.className || 'accent-teal shadow-[0_15px_30px_-5px_rgba(155,194,185,0.4)] hover:shadow-[0_25px_50px_-10px_rgba(155,194,185,0.5)]'}`}
    >
      {isLoading ? "Syncing Logic..." : children}
    </button>
  );

  // --- Renders ---

  if (step === 'IDENTIFY') {
    return (
      <div className="min-h-screen grid items-center justify-center p-6 bg-[#f0f2f5]">
        <div className="w-full max-w-sm animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex p-6 neo-card rounded-3xl mb-8">
              <Logo className="w-16 h-16" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-3 uppercase">Sync Identity</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.4em]">Initialize Library Portal</p>
          </div>

          <form onSubmit={handleManualIdentify} className="neo-card relative rounded-[2.5rem] p-10 space-y-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-teal-accent"></div>
            <MinimalInput
              label="Sync Identity Key"
              placeholder="Enter User ID or Name"
              value={manualEmail}
              onChange={(e: any) => setManualEmail(e.target.value)}
              autoFocus
            />

            {error && <p className="text-rose-500 text-[10px] text-center font-black uppercase tracking-[0.2em]">{error}</p>}

            <PrimaryButton type="submit" isLoading={isSyncing}>
              Join Catalog
            </PrimaryButton>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'ADMIN_AUTH') {
    return (
      <div className="min-h-screen grid items-center justify-center p-6 bg-[#f0f2f5]">
        <div className="w-full max-w-sm animate-in fade-in zoom-in duration-300">
          <button onClick={() => setStep('PORTAL')} className="mb-6 text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Return to Hub
          </button>

          <div className="neo-card relative rounded-[2.5rem] p-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-800"></div>
            <div className="mb-10 text-center pt-2">
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Admin Logic</h2>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Verify Secure Credentials</p>
            </div>

            <form onSubmit={handleAdminVerify} className="space-y-10">
              <MinimalInput
                label="Master Access Code"
                type="password"
                placeholder="••••••••"
                value={adminPassInput}
                onChange={(e: any) => setAdminPassInput(e.target.value)}
                autoFocus
              />
              {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] text-center">{error}</p>}
              <PrimaryButton type="submit" className="bg-gray-900 text-white shadow-[0_15px_30px_-5px_rgba(0,0,0,0.2)] hover:bg-black">Unlock Systems</PrimaryButton>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'PORTAL' && initialIdentity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 bg-[#f0f2f5]">

        <header className="absolute top-0 left-0 right-0 p-10 flex justify-between items-center z-10 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4 group cursor-pointer transition-all">
            <div className="neo-card p-2 rounded-xl group-hover:scale-105 transition-all">
              <Logo className="w-8 h-8" />
            </div>
            <div>
              <span className="block font-black text-gray-900 tracking-tighter text-xl leading-none">ALBAYAN</span>
              <span className="block text-teal-600 font-bold tracking-[0.3em] text-[10px] mt-1 shrink-0 uppercase">Soft UI Portal</span>
            </div>
          </div>

          <button
            onClick={() => handleRoleCardClick('ADMIN')}
            className="neo-button text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-teal-600 transition-all px-8 py-4"
          >
            Terminal Access
          </button>
        </header>

        <main className="w-full max-w-xl text-center z-0">
          <div className="mb-20">
            <h2 className="text-7xl md:text-8xl font-black text-gray-900 tracking-tighter mb-4 uppercase opacity-90">CATALOG</h2>
            <div className="flex items-center justify-center gap-6">
              <div className="h-[2px] w-12 bg-teal-accent/30 rounded-full"></div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.6em] whitespace-nowrap">Unified Library Hub</p>
              <div className="h-[2px] w-12 bg-teal-accent/30 rounded-full"></div>
            </div>
          </div>

          <button
            onClick={() => handleRoleCardClick('STUDENT')}
            className="group relative w-full neo-card rounded-[3.5rem] p-20 transition-all active:scale-[0.98] border-0 hover:neo-card-hover"
          >
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 neo-inset rounded-[3rem] flex items-center justify-center mb-12 group-hover:scale-105 transition-transform duration-700">
                <Logo className="w-16 h-16 opacity-80" />
              </div>
              <span className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Main Entrance</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] group-hover:text-teal-600 transition-colors">Digital Repository Interface</span>
            </div>
          </button>

          <div className="mt-20">
            <button onClick={onClearIdentity} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-teal-600 transition-all">
              Not {initialIdentity.name}? <span className="text-teal-600 border-b-2 border-teal-600/20 pb-0.5 ml-2">Switch Account</span>
            </button>
          </div>
        </main>

        <div className="fixed bottom-10 z-10 w-full flex justify-center px-6">
          <button onClick={() => document.getElementById('about-modal')?.classList.toggle('hidden')} className="neo-button text-[10px] font-black text-gray-500 hover:text-teal-600 uppercase tracking-[0.3em] px-12 py-5 transition-all flex items-center gap-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Library Manifesto
          </button>
        </div>

        <div id="about-modal" className="hidden fixed inset-0 bg-[#f0f2f5]/90 backdrop-blur-xl z-[100] overflow-y-auto p-6 md:p-12">
          <div className="max-w-4xl mx-auto neo-card rounded-[3rem] p-8 md:p-16 relative">
            <button onClick={() => document.getElementById('about-modal')?.classList.toggle('hidden')} className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center neo-button text-gray-500 hover:text-teal-600 transition-all font-black text-lg">✕</button>
            <About studentsCount={availableUsers.filter(u => u.role === 'STUDENT').length} />
          </div>
        </div>

      </div>
    );
  }

  if (step === 'USER_PICK' && selectedRole) {
    return (
      <div className="min-h-screen flex flex-col animate-in slide-in-from-bottom-6 duration-700 bg-[#f0f2f5]">
        <div className="max-w-4xl w-full mx-auto p-8 md:p-20 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-16">
            <button onClick={() => setStep('PORTAL')} className="neo-button p-4 text-gray-400 hover:text-teal-600 transition-all group">
              <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] neo-inset px-6 py-2 rounded-full border border-teal-500/10">
              {selectedRole === 'ADMIN' ? 'Secure Node' : 'Library Node'} Directory
            </span>
          </div>

          <h2 className="text-5xl font-black text-gray-900 mb-12 uppercase tracking-tight pr-10 leading-none">Who's Accessing Today?</h2>

          <div className="mb-12 relative group">
            <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              autoFocus
              placeholder="Query by name or credential ID..."
              className="w-full neo-input rounded-[2rem] py-6 pl-16 pr-8 text-base outline-none transition-all font-bold placeholder:text-gray-400/50"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto neo-card rounded-[3rem] overflow-hidden no-scrollbar border-0">
            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-white/20">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => onLogin(user)}
                    className="w-full flex items-center gap-8 p-8 hover:bg-white/40 transition-all text-left group active:scale-[0.99]"
                  >
                    <div className="w-16 h-16 rounded-[1.5rem] neo-inset flex items-center justify-center text-gray-400 group-hover:text-teal-600 transition-all text-xl font-black shrink-0 overflow-hidden">
                      {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-black text-gray-900 group-hover:text-teal-600 transition-colors uppercase tracking-tight leading-none">{user.name}</p>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest neo-inset ${user.role === 'ADMIN' ? 'text-purple-600' : user.role === 'USTHAD' ? 'text-amber-600' : 'text-teal-600'}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2 leading-none">{user.id === storedAdminPass ? 'MASTER SYSTEM NODE' : `UID: ${user.id}`} • {user.class || 'General'}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-24 text-center">
                <div className="mb-6 text-gray-200 flex justify-center"><svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                <p className="text-gray-400 text-xs font-black uppercase tracking-[0.4em]">No matching logic profiles found</p>
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
