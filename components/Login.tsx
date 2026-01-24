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
    const list = [...availableUsers].filter(u => u.role === selectedRole);
    if (selectedRole === 'ADMIN' && !list.find(u => u.id === storedAdminPass)) {
      list.push({ id: storedAdminPass, name: 'Master Admin', role: 'ADMIN', class: 'System' });
    }
    return list.filter(u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [availableUsers, selectedRole, userSearch]);

  // --- Components for Sub-steps ---

  const MinimalInput = ({ label, ...props }: any) => (
    <div className="group">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1 group-focus-within:text-emerald-500 transition-colors">{label}</label>
      <input
        {...props}
        className="w-full bg-zinc-900/50 border-b border-zinc-800 text-sm text-zinc-200 py-3 outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-600 focus:bg-zinc-900"
      />
    </div>
  );

  const PrimaryButton = ({ children, isLoading, ...props }: any) => (
    <button
      {...props}
      disabled={isLoading}
      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-3 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Processing..." : children}
    </button>
  );

  // --- Renders ---

  if (step === 'IDENTIFY') {
    return (
      <div className="min-h-screen grid items-center justify-center p-6 bg-[#0f0f11]">
        <div className="w-full max-w-sm animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex p-3 bg-zinc-900 rounded-2xl mb-6 shadow-sm">
              <Logo className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
            <p className="text-zinc-500 text-sm">Sign in to access the library portal.</p>
          </div>

          <form onSubmit={handleManualIdentify} className="space-y-6">
            <MinimalInput
              label="User ID"
              placeholder="Enter your ID"
              value={manualEmail}
              onChange={(e: any) => setManualEmail(e.target.value)}
              autoFocus
            />

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <PrimaryButton type="submit" isLoading={isSyncing}>
              Continue
            </PrimaryButton>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'ADMIN_AUTH') {
    return (
      <div className="min-h-screen grid items-center justify-center p-6 bg-[#0f0f11]">
        <div className="w-full max-w-sm animate-in fade-in zoom-in duration-300">
          <button onClick={() => setStep('PORTAL')} className="mb-6 text-zinc-500 hover:text-white text-xs flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-white">Admin Access</h2>
            <p className="text-zinc-500 text-sm mt-1">Verify your credentials to proceed.</p>
          </div>

          <form onSubmit={handleAdminVerify} className="space-y-6">
            <MinimalInput
              label="Secure Password"
              type="password"
              placeholder="••••••••"
              value={adminPassInput}
              onChange={(e: any) => setAdminPassInput(e.target.value)}
              autoFocus
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <PrimaryButton type="submit">Unlock Portal</PrimaryButton>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'PORTAL' && initialIdentity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f0f11] animate-in fade-in duration-700">

        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-white tracking-tight">ALBAYAN LMS</span>
          </div>

          <button
            onClick={() => handleRoleCardClick('ADMIN')}
            className="text-xs font-medium text-zinc-500 hover:text-white transition-colors"
          >
            Admin Access
          </button>
        </header>

        <main className="w-full max-w-lg text-center z-0">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-4">Digital Library</h2>
          <p className="text-zinc-500 mb-12 max-w-xs mx-auto text-sm leading-relaxed">
            Your gateway to knowledge. Manage books, track history, and explore resources.
          </p>

          <button
            onClick={() => handleRoleCardClick('STUDENT')}
            className="group relative w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-10 transition-all active:scale-[0.99]"
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <span className="text-lg font-semibold text-white mb-2">Enter as Student</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Click to Browse</span>
            </div>
          </button>

          <div className="mt-12">
            <button onClick={onClearIdentity} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Not {initialIdentity.name}? <span className="underline">Switch Account</span>
            </button>
          </div>
        </main>

        {/* About Section Teaser */}
        <div className="fixed bottom-6 z-10">
          <button onClick={() => document.getElementById('about-modal')?.classList.toggle('hidden')} className="text-[10px] font-bold text-zinc-700 hover:text-zinc-500 uppercase tracking-widest">
            About The Library
          </button>
        </div>

        {/* Hidden About Modal/Section for cleaner look - could use state but staying simple */}
        <div id="about-modal" className="hidden fixed inset-0 bg-black/90 z-50 overflow-y-auto">
          <div className="p-8 max-w-4xl mx-auto">
            <button onClick={() => document.getElementById('about-modal')?.classList.toggle('hidden')} className="fixed top-8 right-8 text-white">Close</button>
            <About studentsCount={availableUsers.filter(u => u.role === 'STUDENT').length} />
          </div>
        </div>

      </div>
    );
  }

  if (step === 'USER_PICK' && selectedRole) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0f0f11] animate-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-2xl w-full mx-auto p-6 md:p-12 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setStep('PORTAL')} className="text-zinc-500 hover:text-white text-xs flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">{selectedRole} DIRECTORY</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">Select Your Profile</h2>

          <div className="mb-6 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              autoFocus
              placeholder="Search by name or ID..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-600"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto rounded-2xl border border-zinc-800/50 bg-zinc-900/30">
            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-zinc-800/50">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => onLogin(user)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 group-hover:bg-zinc-700 transition-colors text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">{user.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{user.id === storedAdminPass ? 'MASTER ADMIN' : user.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-600 text-sm">No profiles found.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Login;
