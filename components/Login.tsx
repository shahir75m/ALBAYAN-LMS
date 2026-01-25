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
      setError("Please identify yourself.");
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
      setError("Access Denied: Invalid Credentials");
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
      list.push({ id: storedAdminPass, name: 'System Administrator', role: 'ADMIN', class: 'Core' });
    }
    return list.filter(u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [availableUsers, selectedRole, userSearch]);

  const MinimalInput = ({ label, ...props }: any) => (
    <div className="group">
      <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-2 group-focus-within:text-emerald-400 transition-colors">{label}</label>
      <input
        {...props}
        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all placeholder:text-zinc-700"
      />
    </div>
  );

  const PrimaryButton = ({ children, isLoading, color = 'emerald', ...props }: any) => (
    <button
      {...props}
      disabled={isLoading}
      className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 ${color === 'emerald'
        ? 'bg-emerald-600 hover:bg-emerald-500 text-white glow-emerald shadow-lg shadow-emerald-900/20'
        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
        }`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
        </div>
      ) : children}
    </button>
  );

  // Decorative Background Components
  const BackgroundGlows = () => (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] invert" />
    </div>
  );

  if (step === 'IDENTIFY') {
    return (
      <div className="min-h-screen grid items-center justify-center p-6 relative overflow-hidden">
        <BackgroundGlows />
        <div className="w-full max-w-sm glass-main rounded-[3rem] p-10 relative z-10 animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-12">
            <div className="inline-flex p-4 glass-card rounded-2xl mb-8 glow-emerald neon-border">
              <Logo className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter mb-3 uppercase">Initialize</h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Bridge Access Point</p>
          </div>

          <form onSubmit={handleManualIdentify} className="space-y-8">
            <MinimalInput
              label="Digital Identity"
              placeholder="User ID or Identifier"
              value={manualEmail}
              onChange={(e: any) => setManualEmail(e.target.value)}
              autoFocus
            />

            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider text-center">{error}</p>}

            <PrimaryButton type="submit" isLoading={isSyncing}>
              Access Terminal
            </PrimaryButton>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'ADMIN_AUTH') {
    return (
      <div className="min-h-screen grid items-center justify-center p-6 relative">
        <BackgroundGlows />
        <div className="w-full max-w-sm glass-main rounded-[3rem] p-10 relative z-10 animate-in fade-in zoom-in duration-500">
          <button onClick={() => setStep('PORTAL')} className="mb-8 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all group">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Reverse
          </button>

          <div className="mb-10">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Admin</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Elevated Permissions Required</p>
          </div>

          <form onSubmit={handleAdminVerify} className="space-y-8">
            <MinimalInput
              label="Encryption Key"
              type="password"
              placeholder="••••••••"
              value={adminPassInput}
              onChange={(e: any) => setAdminPassInput(e.target.value)}
              autoFocus
            />
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider">{error}</p>}
            <PrimaryButton type="submit">Verify Protocol</PrimaryButton>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'PORTAL' && initialIdentity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative animate-in fade-in duration-1000">
        <BackgroundGlows />

        <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="p-2 glass-card rounded-xl glow-emerald neon-border"><Logo className="w-8 h-8" /></div>
            <div>
              <span className="block font-black text-white tracking-widest text-lg leading-none uppercase">Albayan</span>
              <span className="block text-emerald-500/80 font-bold tracking-[0.3em] text-[8px] uppercase">Library OS</span>
            </div>
          </div>

          <button
            onClick={() => handleRoleCardClick('ADMIN')}
            className="px-6 py-2.5 glass-card rounded-full text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all"
          >
            Admin.Node
          </button>
        </header>

        <main className="w-full max-w-xl text-center relative z-10">
          <div className="mb-16">
            <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6 uppercase flex flex-col">
              <span className="opacity-50">Albayan</span>
              <span className="text-glow-emerald">LMS</span>
            </h2>
            <p className="text-zinc-500 max-w-sm mx-auto text-xs font-bold uppercase tracking-[0.25em] leading-relaxed">
              Global Knowledge Repository & Management System
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <button
              onClick={() => handleRoleCardClick('STUDENT')}
              className="group relative glass-main hover:bg-white/[0.06] rounded-[2.5rem] p-12 transition-all active:scale-[0.98] glow-emerald neon-border overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col items-center relative z-10">
                <div className="w-20 h-20 glass-card rounded-[2rem] flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform duration-700">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Access Library</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] group-hover:text-emerald-400 transition-colors">Digital Portal Entrance</p>
              </div>
            </button>
          </div>

          <div className="mt-16">
            <button onClick={onClearIdentity} className="text-[9px] font-black text-zinc-600 hover:text-zinc-300 uppercase tracking-[0.2em] transition-colors border-b border-zinc-800 pb-1">
              Switching Persona: {initialIdentity.name}
            </button>
          </div>
        </main>

        <div className="fixed bottom-10 z-20">
          <button
            onClick={() => document.getElementById('about-modal')?.classList.remove('hidden')}
            className="text-[10px] font-black text-white/20 hover:text-white/60 uppercase tracking-[0.4em] transition-all hover:scale-105"
          >
            Core Documentation
          </button>
        </div>

        <div id="about-modal" className="hidden fixed inset-0 bg-black/95 z-50 overflow-y-auto backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="p-10 max-w-5xl mx-auto relative">
            <button onClick={() => document.getElementById('about-modal')?.classList.add('hidden')} className="fixed top-10 right-10 p-3 glass-card rounded-full text-white hover:glow-emerald transition-all z-[60]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <About studentsCount={availableUsers.filter(u => u.role === 'STUDENT').length} />
          </div>
        </div>

      </div>
    );
  }

  if (step === 'USER_PICK' && selectedRole) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden animate-in slide-in-from-bottom duration-700">
        <BackgroundGlows />
        <div className="max-w-3xl w-full mx-auto p-10 md:p-20 flex-1 flex flex-col relative z-10">
          <div className="flex items-center justify-between mb-12">
            <button onClick={() => setStep('PORTAL')} className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all group">
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Reverse
            </button>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">{selectedRole} DATASET</span>
          </div>

          <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Identity Core</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-12">Select your profile to synchronize session</p>

          <div className="mb-10 relative group">
            <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              autoFocus
              placeholder="Filter by name or reference ID..."
              className="w-full glass-main rounded-[2rem] py-5 pl-16 pr-6 text-sm text-white outline-none focus:glow-emerald transition-all placeholder:text-zinc-700"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto rounded-[3rem] glass-main overflow-hidden border-white/5">
            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => onLogin(user)}
                    className="w-full flex items-center gap-6 p-8 hover:bg-white/[0.05] transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 group-hover:glow-emerald transition-all text-sm font-black">
                      {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover rounded-2xl" /> : user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight">{user.name}</p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1 group-hover:text-zinc-400 transition-colors">{user.id === storedAdminPass ? 'Central Core Admin' : user.id}</p>
                    </div>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">Identity not found in database</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Login;
