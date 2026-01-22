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
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-[#0c0c0e] border border-zinc-900 rounded-3xl p-8 md:p-10 shadow-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full"></div>
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm mb-6">
              <Logo className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Library Access</h2>
            <p className="text-zinc-500 text-xs mt-2 text-center">Enter your ID to proceed to portals</p>
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
      <div className="min-h-screen bg-[#09090b] overflow-y-auto no-scrollbar scroll-smooth">
        <div className="min-h-screen library-bg flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 relative overflow-hidden">
          {/* Subtle Admin Access in Corner */}
          <div className="absolute top-8 right-8 z-20">
            <button
              onClick={() => handleRoleCardClick('ADMIN')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-white transition-all group backdrop-blur-xl"
            >
              <svg className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-black uppercase tracking-widest">Staff Access</span>
            </button>
          </div>

          {/* Hero Content */}
          <div className="text-center mb-12 z-10">
            <div className="flex justify-center mb-6">
              <div className="p-5 bg-zinc-900/70 rounded-[2rem] border border-zinc-800 shadow-2xl backdrop-blur-xl">
                <Logo className="w-16 h-16" />
              </div>
            </div>
            <h2 className="text-5xl font-serif text-white tracking-tight drop-shadow-2xl">Select Portal</h2>
            <div className="h-1 w-24 bg-emerald-500/40 mx-auto mt-6 rounded-full blur-[2px]"></div>
          </div>

          <div className="w-full max-w-lg z-10 flex flex-col gap-6">
            <button
              onClick={() => handleRoleCardClick('STUDENT')}
              className="group relative w-full glass-card p-12 rounded-[3rem] text-center transition-all hover:scale-[1.02] active:scale-[0.98] animate-in zoom-in duration-700 shadow-2xl border border-white/5"
            >
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-1000"></div>

              <div className="relative">
                <div className="w-24 h-24 bg-zinc-900/90 rounded-[2rem] border border-zinc-700/50 flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:border-emerald-500/30 transition-all duration-500 backdrop-blur-xl">
                  <svg className="w-12 h-12 text-emerald-500 group-hover:scale-110 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>

                <h3 className="text-4xl font-serif text-white tracking-wide mb-4">Student Access</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-[320px] mx-auto font-medium">
                  Enter the digital library to explore books, manage your bag, and track requests.
                </p>

                <div className="mt-12 flex items-center justify-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-widest group-hover:gap-5 transition-all duration-500">
                  <span>Enter Digital Library</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-zinc-600 hover:text-zinc-400 text-[11px] font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 group py-4"
            >
              Learn More About Us
              <svg className="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <button
            onClick={onClearIdentity}
            className="mt-12 text-zinc-700 hover:text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 group z-10"
          >
            <span className="w-8 h-[1px] bg-zinc-900 transition-all group-hover:w-12 group-hover:bg-zinc-700"></span>
            Switch Identity
          </button>
        </div>

        {/* About Section on Portal Selection Page */}
        <div id="about-section" className="border-t border-zinc-900 bg-[#09090b] py-24">
          <div className="max-w-5xl mx-auto px-6 mb-20 text-center">
            <div className="inline-block px-6 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[11px] font-black uppercase tracking-[0.3em] mb-10 shadow-2xl">
              Discover Al Bayan
            </div>
            <h2 className="text-4xl md:text-6xl font-serif text-white mb-10 tracking-tight leading-tight">വിജ്ഞാനത്തിന്റെ അക്ഷയഖനിയെ <br /> <span className="text-zinc-500">അടുത്തറിയാം</span></h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
              മുട്ടിച്ചിറ ശുഹദാക്കളുടെ സ്മരണയിൽ പടുത്തുയർത്തിയ ആധുനികമായ ഈ വൈജ്ഞാനിക സംരംഭത്തെക്കുറിച്ചുള്ള കൂടുതൽ വിവരങ്ങൾ താഴെ നൽകുന്നു.
            </p>
          </div>
          <About />
        </div>
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
