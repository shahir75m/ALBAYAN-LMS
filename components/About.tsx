
import React from 'react';

const About: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto px-6 py-20 space-y-24 animate-in fade-in duration-1000">
            {/* Hero Section - Balanced Typography */}
            <section className="relative flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                    <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">
                        Vision 2026
                    </div>
                    <h1 className="text-3xl md:text-5xl font-serif text-white leading-tight tracking-tight">
                        THE FUTURE OF <br />
                        <span className="text-zinc-600 font-sans font-light uppercase tracking-widest text-2xl md:text-4xl">Knowledge</span>
                    </h1>
                    <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-md font-medium">
                        Silent sophistication. Modern curation. We preserve the past and illuminate the future through curated wisdom and digital precision.
                    </p>
                </div>
                <div className="relative w-full md:w-64 aspect-square">
                    <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full"></div>
                    <div className="relative h-full w-full glass-card border border-white/5 rounded-3xl flex items-center justify-center overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                        <svg className="w-12 h-12 text-emerald-500 transition-transform duration-700 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Content Section - Minimal & Clean */}
            <section className="relative flex flex-col md:flex-row-reverse items-center gap-12">
                <div className="flex-1 space-y-6">
                    <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight tracking-tight">
                        OUR QUIET <br />
                        <span className="text-zinc-600 font-sans font-light uppercase tracking-widest text-2xl md:text-4xl">Mission</span>
                    </h2>
                    <div className="space-y-4 text-zinc-400 text-sm md:text-base leading-relaxed font-medium">
                        <p>
                            മുട്ടിച്ചിറ ശുഹദാക്കളുടെ പുണ്യസ്മരണയിലായി അറിവിൻ്റെ അലയൊലികൾ തീർക്കുന്ന ബയാനുൽ ഉലൂം ലൈബ്രറി. പരമ്പരാഗതമായ അറിവിനെ ആധുനിക സാങ്കേതിക വിദ്യയിലൂടെ കൂട്ടിയിണക്കുന്നു.
                        </p>
                        <p className="text-xs text-zinc-500 border-l-2 border-emerald-500/20 pl-4 italic">
                            A sanctuary for muthallims and seekers, where history meets the horizon of digital accessibility.
                        </p>
                    </div>
                </div>
                <div className="relative w-full md:w-64 aspect-square">
                    <div className="absolute inset-0 bg-zinc-500/5 blur-[80px] rounded-full"></div>
                    <div className="relative h-full w-full glass-card border border-white/5 rounded-3xl flex items-center justify-center overflow-hidden group">
                        <svg className="w-12 h-12 text-zinc-500 transition-transform duration-700 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Stats row - Ultra Minimalist */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-zinc-900">
                <StatItem value="10k+" label="Volumes" />
                <StatItem value="500+" label="Muthallims" />
                <StatItem value="100%" label="Digital" />
                <StatItem value="24/7" label="Access" />
            </section>

            {/* Footer Tagline */}
            <div className="text-center pt-16">
                <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.4em]">
                    Preserving Knowledge • Inspiring Futures
                </p>
            </div>
        </div>
    );
};

const StatItem = ({ value, label }: { value: string, label: string }) => (
    <div className="space-y-1">
        <p className="text-2xl font-serif text-white tracking-tight">{value}</p>
        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{label}</p>
    </div>
);

export default About;
