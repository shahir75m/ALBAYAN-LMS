
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
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-[#0c0c0e] border border-zinc-900 rounded-3xl p-8 md:p-10 shadow-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full"></div>
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm mb-6">
              <Logo className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Library Access</h2>
            <p className="text-zinc-500 text-xs mt-2 text-center">Verify your identity to proceed to portals</p>
          </div>
          <div className="space-y-6">
            <form onSubmit={handleManualIdentify} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 ml-1">Identity Key</label>
                <input
                  type="password"
                  placeholder="••••••••"
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
                {isSyncing ? "Verifying..." : "Continue"}
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
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-white tracking-tight">Select Portal</h2>
          <p className="text-zinc-500 text-sm mt-2">Choose the access level for this session</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <button
            onClick={() => handleRoleCardClick('ADMIN')}
            className="group relative bg-[#0c0c0e] border border-zinc-900 p-8 rounded-3xl text-left hover:border-emerald-500/30 transition-all active:scale-[0.98] overflow-hidden shadow-sm hover:shadow-emerald-500/5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="w-14 h-14 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight">Administrator</h3>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">Full system access, library management, and user controls.</p>
          </button>
          <button
            onClick={() => handleRoleCardClick('STUDENT')}
            className="group relative bg-[#0c0c0e] border border-zinc-900 p-8 rounded-3xl text-left hover:border-blue-500/30 transition-all active:scale-[0.98] overflow-hidden shadow-sm hover:shadow-blue-500/5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="w-14 h-14 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight">Student / Staff</h3>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">Book browsing, resource requests, and personal library bag.</p>
          </button>
        </div>
        <button
          onClick={onClearIdentity}
          className="mt-12 text-zinc-500 hover:text-zinc-300 text-[10px] font-medium uppercase tracking-widest transition-all flex items-center gap-2 group"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">←</span>
          Switch Identity Card
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
