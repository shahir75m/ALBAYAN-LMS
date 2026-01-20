
import React from 'react';

const Splash: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50 p-6">
      <div className="relative group">
        {/* Animated Glow behind Logo */}
        <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse"></div>

        <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <img
            src="/icon-logo.png"
            alt="Albayan Library Logo"
            className="w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          />
        </div>
      </div>

      <div className="mt-12 text-center animate-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase">
          ALBAYAN <span className="text-emerald-500">LIBRARY</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-bold tracking-[0.5em] uppercase mt-3">
          Management System
        </p>
      </div>

      <div className="mt-16 w-64 h-[2px] bg-zinc-900 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]"></div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 100%; transform: translateX(0%); }
          100% { width: 0%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Splash;
