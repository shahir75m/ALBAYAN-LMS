
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
    { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'books', label: 'Books Catalog', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'users', label: 'Students & Staff', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'requests', label: 'Borrow Requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'history', label: 'Issue History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ] : [
    { id: 'dashboard', label: 'My Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'catalog', label: 'Library Books', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'my-requests', label: 'My Requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <div className={`
        fixed md:static inset-y-0 left-0 z-[80]
        w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center shadow-lg transition-all">
                <Logo className="w-8 h-8" />
              </div>
              <div>
                <span className="block text-white font-black tracking-tighter text-lg leading-none">ALBAYAN</span>
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1 block">Repository</span>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={onCloseMobile}
              className="md:hidden p-2 text-zinc-500 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all border ${
                  activeTab === item.id 
                    ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/5' 
                    : 'text-zinc-500 hover:text-zinc-200 border-transparent hover:bg-zinc-800/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8 border-t border-zinc-800 bg-zinc-950/30">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700 font-black shadow-inner overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{role}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLogout();
            }}
            type="button"
            className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-red-400/70 hover:text-red-400 hover:bg-red-500/5 rounded-2xl transition-all border border-transparent hover:border-red-500/10 active:scale-95 cursor-pointer relative z-[90]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Secure Exit
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
