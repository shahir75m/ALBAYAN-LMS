
import React from 'react';
import { Role, User } from '../types';
import Logo from './Logo';

interface SidebarProps {
  role: Role;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  user: User;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  role, activeTab, setActiveTab, onLogout, user, isMobileOpen, onCloseMobile
}) => {
  const navItems = role === 'ADMIN' ? [
    { id: 'dashboard', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'books', label: 'Inventory', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'users', label: 'Circulation', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'requests', label: 'Approvals', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'history', label: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'fines', label: 'Fines', icon: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z M12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z' },
    { id: 'about', label: 'Portal', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ] : [
    { id: 'dashboard', label: 'My Hub', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'catalog', label: 'Library', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'my-requests', label: 'Requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'my-fines', label: 'My Fines', icon: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z M12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z' },
    { id: 'about', label: 'Portal', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <div className={`
        fixed md:static inset-y-0 left-0 z-[80]
        w-64 glass-main flex flex-col shrink-0
        m-4 md:m-6 rounded-[2.5rem]
        transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]
        ${isMobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4 group cursor-pointer">
              <Logo className="w-14 h-14 transition-transform duration-500 group-hover:scale-110" />
              <div>
                <span className="block text-white font-black tracking-tight text-xl leading-none">ALBAYAN</span>
                <span className="block text-emerald-500/80 font-bold tracking-[0.2em] text-[10px] mt-1 uppercase">Library</span>
              </div>
            </div>
            <button onClick={onCloseMobile} className="md:hidden p-2 text-zinc-500 hover:text-white transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all relative group ${activeTab === item.id
                  ? 'text-white bg-emerald-500/10 glow-emerald neon-border'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                  }`}
              >
                <svg className={`w-5 h-5 transition-all duration-300 ${activeTab === item.id ? 'text-emerald-400 scale-110' : 'text-zinc-600 group-hover:text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
                {activeTab === item.id && (
                  <div className="absolute right-4 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8 border-t border-white/5">
          <div className="bg-white/5 p-4 rounded-3xl border border-white/5 mb-6 flex items-center gap-4 hover:bg-white/[0.08] transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-400 border border-white/5 overflow-hidden shrink-0 group-hover:border-emerald-500/30 transition-all">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black uppercase">{user.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">{role}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => { e.preventDefault(); onLogout(); }}
              className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>

            <div className="flex items-center justify-center gap-6 pt-6 border-t border-white/5 mt-2">
              {[
                { href: 'https://www.instagram.com/muttichira_dars/', icon: 'M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5a4.25 4.25 0 004.25 4.25h8.5a4.25 4.25 0 004.25-4.25v-8.5a4.25 4.25 0 00-4.25-4.25h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.25-.25a.75.75 0 110 1.5.75.75 0 010-1.5z' },
                { href: 'https://www.youtube.com/@muttichiradars', icon: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 11.75a29 29 0 00-.46-5.33zM9.75 15.02V8.48L15.45 11.75l-5.7 3.27z' },
                { href: 'https://sites.google.com/view/bayanululoomdars-usthad/home', icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0v-8m0 0l-4 4m4-4l4 4M2 12h20' }
              ].map((social, i) => (
                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="p-1 text-zinc-600 hover:text-emerald-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={social.icon} /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
