
import React from 'react';

const Splash: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#f0f2f5] flex flex-col items-center justify-center z-[100] p-6">
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in-90 duration-1000">
        <div className="p-10 neo-card rounded-[3rem] mb-12">
          <img
            src="/icon-logo-removebg-preview (1).png"
            alt="Albayan Library Logo"
            className="w-24 h-24 md:w-32 md:h-32 object-contain opacity-90"
          />
        </div>
      </div>

      <div className="text-center animate-in slide-in-from-bottom-6 duration-700 delay-300">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">
          ALBAYAN <span className="text-teal-600/40">SYSTEMS</span>
        </h1>
        <p className="text-gray-400 text-[10px] font-black tracking-[0.5em] uppercase mt-4">
          Booting Hub Environment
        </p>
      </div>

      <div className="mt-20 w-72 h-1 neo-inset rounded-full overflow-hidden">
        <div className="h-full bg-teal-accent/50 animate-loading-line rounded-full"></div>
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
