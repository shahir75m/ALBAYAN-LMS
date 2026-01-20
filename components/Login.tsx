
import React, { useState, useMemo } from 'react';
import { User, Role } from '../types';
import Logo from './Logo';

interface LoginProps {
  onLogin: (userData: User) => void;
  onIdentify: (identity: { id: string, name: string, avatarUrl?: string }) => void;
  initialIdentity: { id: string, name: string, avatarUrl?: string } | null;
  onClearIdentity: () => void;
  availableUsers: User[];
}


const Login: React.FC<LoginProps> = ({ onLogin, onIdentify, initialIdentity, onClearIdentity, availableUsers }) => {
  const [step, setStep] = useState<'IDENTIFY' | 'PORTAL' | 'USER_PICK'>(initialIdentity ? 'PORTAL' : 'IDENTIFY');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState('');
  const storedAdminPass = localStorage.getItem('adminPassword') || 'admin@484';
  const [isSyncing, setIsSyncing] = useState(false);


  const handleManualIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.includes('@') && manualEmail !== storedAdminPass) {
      setError("Enter a valid cloud ID or username.");
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      onIdentify({
        id: manualEmail,
        name: manualEmail === storedAdminPass ? 'Master Admin' : manualEmail.split('@')[0],
      });
      setIsSyncing(false);
      setStep('PORTAL');
    }, 600);
  };

  const handleRoleCardClick = (role: Role) => {
    setSelectedRole(role);
    setStep('USER_PICK');
    setUserSearch('');
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full"></div>
          <div className="flex flex-col items-center mb-10">
            <div className="p-6 bg-zinc-950 rounded-[2rem] border border-zinc-800 shadow-xl mb-6"><Logo className="w-14 h-14" /></div>
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Library Access</h2>
            <p className="text-zinc-600 text-[10px] font-black tracking-[0.4em] uppercase mt-2 text-center leading-relaxed">Enter your ID to continue</p>
          </div>
          <div className="space-y-6">
            <form onSubmit={handleManualIdentify} className="space-y-4">
              <input
                type="text" placeholder={storedAdminPass === 'admin@484' ? "Identity / Master ID (admin@484)" : "Enter your Admin ID"}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} required
              />
              <button type="submit" disabled={isSyncing} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[11px] tracking-widest py-4 rounded-2xl transition-all shadow-xl active:scale-95">
                {isSyncing ? "Verifying..." : "Continue to Portals"}
              </button>
            </form>
            {error && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest bg-red-500/10 py-4 rounded-2xl border border-red-500/20">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'PORTAL' && initialIdentity) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
            <p className="text-sm font-bold text-zinc-400">Identity: <span className="text-white">{initialIdentity.id}</span></p>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Choose Portal</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <button onClick={() => handleRoleCardClick('ADMIN')} className="group relative bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] text-left hover:border-emerald-500/50 transition-all active:scale-95 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/10"></div>
            <div className="w-20 h-20 bg-zinc-950 rounded-3xl border border-zinc-800 flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Administrator</h3>
            <p className="text-zinc-500 text-sm mt-3 leading-relaxed">System management, analytics, and resource control.</p>
          </button>
          <button onClick={() => handleRoleCardClick('STUDENT')} className="group relative bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] text-left hover:border-blue-500/50 transition-all active:scale-95 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/5 blur-[60px] rounded-full group-hover:bg-blue-500/10"></div>
            <div className="w-20 h-20 bg-zinc-950 rounded-3xl border border-zinc-800 flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Student / Staff</h3>
            <p className="text-zinc-500 text-sm mt-3 leading-relaxed">Book requests, personal reading bag, and catalog browsing.</p>
          </button>
        </div>
        <button onClick={onClearIdentity} className="mt-16 text-zinc-600 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 bg-zinc-900/50 px-6 py-3 rounded-2xl border border-zinc-800 active:scale-95">
          Switch Cloud ID
        </button>
      </div>
    );
  }

  if (step === 'USER_PICK' && selectedRole) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-start py-20 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full max-w-2xl">
          <button onClick={() => setStep('PORTAL')} className="mb-10 text-zinc-500 hover:text-white flex items-center gap-3 group transition-all">
            <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 group-hover:border-zinc-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Portals</span>
          </button>
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Select Account</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">{selectedRole} DIRECTORY</p>
          </div>
          <div className="relative mb-12">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
            <input
              autoFocus
              type="text"
              placeholder={`Quick search ${selectedRole.toLowerCase()}s...`}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[2rem] pl-16 pr-8 py-6 text-lg text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all placeholder:text-zinc-700 shadow-2xl"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-2 pb-10">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleFinalSelect(user)}
                className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 p-5 rounded-[1.5rem] text-left transition-all active:scale-[0.97] hover:bg-zinc-800/50 group"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all overflow-hidden shrink-0">
                  {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="font-black">{user.name.charAt(0)}</span>}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest truncate">{user.id}</p>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
                <div className="mb-4 flex justify-center opacity-20">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <p className="text-zinc-700 text-sm font-bold uppercase tracking-widest italic">No matching users in this portal</p>
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
