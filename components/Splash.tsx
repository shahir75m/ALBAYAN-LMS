
import React from 'react';

const Splash: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-transparent flex flex-col items-center justify-center z-[100] p-6 transition-colors duration-500">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-teal-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />

      <div className="relative flex flex-col items-center animate-in fade-in zoom-in-90 duration-1000">
        <div className="p-8 glass-card rounded-[3.5rem] mb-12 border-white/20 shadow-[0_32px_128px_rgba(0,0,0,0.05)]">
          <img
            src="/icon-logo-removebg-preview (1).png"
            alt="Albayan Library Logo"
            className="w-24 h-24 md:w-32 md:h-32 object-contain opacity-90 group-hover:scale-110 transition-transform duration-700"
          />
        </div>
      </div>

      <div className="text-center animate-in slide-in-from-bottom-6 duration-700 delay-300 relative z-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">
          ALBAYAN <span className="text-teal-600/40 opacity-70">HUB</span>
        </h1>
        <p className="text-[10px] font-black tracking-[0.5em] uppercase mt-5 opacity-40">
          Synchronizing Core Services
        </p>
      </div>

      <div className="mt-20 w-72 h-1 bg-white/5 rounded-full overflow-hidden border border-white/10 relative z-10">
        <div className="h-full bg-teal-500/40 animate-loading-line rounded-full shadow-[0_0_8px_rgba(20,184,166,0.3)]"></div>
      </div>

      <style>{`
        @keyframes loading-line {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }
        .animate-loading-line {
          width: 40%;
          animation: loading-line 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default Splash;
