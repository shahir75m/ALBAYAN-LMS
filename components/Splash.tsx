
import React from 'react';

const Splash: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 p-6">
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <img
          src="/icon-logo-removebg-preview (1).png"
          alt="Albayan Library Logo"
          className="relative w-28 h-28 md:w-40 md:h-40 object-contain rounded-3xl"
        />
      </div>

      <div className="mt-8 text-center animate-in slide-in-from-bottom-4 duration-700 delay-200">
        <h1 className="text-xl md:text-2xl font-serif text-white/90 tracking-wide">
          Dars <span className="text-emerald-500/80 font-semibold">Bayanul Uloom</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-medium tracking-[0.2em] uppercase mt-2">
          Management System
        </p>
      </div>

      <div className="mt-12 w-48 h-[1px] bg-zinc-800/50 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500/40 animate-loading-line"></div>
      </div>

      <style>{`
        @keyframes loading-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-line {
          width: 60%;
          animation: loading-line 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default Splash;
