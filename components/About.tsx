import React from 'react';
import Logo from './Logo';

const About: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto px-6 py-24 space-y-32 animate-in fade-in duration-1000">
            {/* Hero Section - The Future of Knowledge */}
            <section className="relative flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm">
                            <Logo className="w-8 h-8" />
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            Vision 2026
                        </div>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-serif text-white leading-tight tracking-tighter">
                        THE FUTURE OF <br />
                        <span className="text-zinc-600">KNOWLEDGE</span>
                    </h1>
                    <p className="text-lg text-zinc-400 leading-relaxed max-w-lg font-medium">
                        Silent sophistication. Modern curation. We preserve the past and illuminate the future through curated wisdom and digital precision.
                    </p>
                </div>
                <div className="relative w-full md:w-1/3 aspect-square">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full"></div>
                    <div className="relative h-full w-full glass-card border border-white/5 rounded-[4rem] flex items-center justify-center overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
                        <svg className="w-24 h-24 text-emerald-500 transition-transform duration-700 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Content Section - Our Quiet Mission */}
            <section className="relative flex flex-col md:flex-row-reverse items-center gap-16">
                <div className="flex-1 space-y-8">
                    <h2 className="text-5xl md:text-7xl font-serif text-white leading-tight tracking-tight">
                        OUR QUIET <br />
                        <span className="text-zinc-600">MISSION</span>
                    </h2>
                    <div className="space-y-6 text-zinc-400 text-lg leading-relaxed font-medium">
                        <p>
                            മുട്ടിച്ചിറ ശുഹദാക്കളുടെ പുണ്യസ്മരണയിലായി അറിവിൻ്റെ അലയൊലികൾ തീർക്കുന്ന ബയാനുൽ ഉലൂം ലൈബ്രറി. പരമ്പരാഗതമായ അറിവിനെ ആധുനിക സാങ്കേതിക വിദ്യയിലൂടെ കൂട്ടിയിണക്കുന്നു.
                        </p>
                        <p className="text-sm text-zinc-500 border-l border-emerald-500/30 pl-6 italic">
                            A sanctuary for muthallims and seekers, where history meets the horizon of digital accessibility.
                        </p>
                    </div>
                </div>
                <div className="relative w-full md:w-1/3 aspect-square">
                    <div className="absolute inset-0 bg-zinc-500/5 blur-[120px] rounded-full"></div>
                    <div className="relative h-full w-full glass-card border border-white/5 rounded-[4rem] flex items-center justify-center overflow-hidden group">
                        <svg className="w-24 h-24 text-zinc-500 transition-transform duration-700 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Stats row - Minimalist */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-20 border-t border-zinc-900">
                <StatItem value="10k+" label="Volumes" />
                <StatItem value="500+" label="Muthallims" />
                <StatItem value="100%" label="Digital" />
                <StatItem value="24/7" label="Access" />
            </section>

            {/* Footer Tagline */}
            <div className="text-center pt-20">
                <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.5em]">
                    Preserving Knowledge • Inspiring Futures
                </p>
            </div>
        </div>
    );
};

const StatItem = ({ value, label }: { value: string, label: string }) => (
    <div className="space-y-1">
        <p className="text-3xl font-serif text-white tracking-tighter">{value}</p>
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{label}</p>
    </div>
);

export default About;
