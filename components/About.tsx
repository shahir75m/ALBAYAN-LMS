import React from 'react';
import Logo from './Logo';

interface AboutProps {
    booksCount?: number;
    studentsCount?: number;
}

const About: React.FC<AboutProps> = ({ booksCount, studentsCount }) => {
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
                        Welcome to Bayanul Uloom Dars, where tradition meets modernity in Islamic education. Our aim is to nurture pious, knowledgeable, and socially responsible individuals guided by the principles of Islam. Join us on this journey of enlightenment and spiritual growth.
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
                        ലക്ഷ്യങ്ങൾ
                    </h2>
                    <div className="space-y-6 text-zinc-400 text-lg leading-relaxed font-medium">
                        <ul className="space-y-4 list-none">
                            <li className="flex gap-4">
                                <span className="text-emerald-500">•</span>
                                <span>പ്രാമാണിക ഗ്രന്ഥങ്ങളിൽ അവഗാഹമുള്ള പണ്ഡിതപ്രതിഭകളെ വാർത്തെടുക്കുക.</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-emerald-500">•</span>
                                <span>ആധുനിക വെല്ലുവിളികളെ നേരിടാനുതകുന്ന പ്രബോധകരെയും ഇസ്ലാമിക ബോധമുള്ള സമൂഹത്തെയും വളർത്തിയെടുക്കുക.</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-emerald-500">•</span>
                                <span>സമൂഹത്തിന് ആത്മീയ നേതൃത്വങ്ങളെ സമ്മാനിക്കുക</span>
                            </li>
                        </ul>
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

            {/* Stats row - Responsive Grid */}
            <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 pt-20 border-t border-zinc-900">
                <StatItem
                    value={booksCount ? (booksCount >= 1000 ? `${(booksCount / 1000).toFixed(1)}k+` : `${booksCount}+`) : "10k+"}
                    label="Volumes"
                />
                <StatItem
                    value={studentsCount ? `${studentsCount}+` : "500+"}
                    label="Muthallims"
                />
                <StatItem value="100%" label="Digital" />
                <StatItem value="24/7" label="Access" />
            </section>

            {/* Minimalist Footer */}
            <section className="relative pt-32 pb-16 border-t border-zinc-900">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-4 text-center md:text-left">
                        <h3 className="text-2xl font-serif text-white tracking-tight">Stay Connected</h3>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
                            Preserving Knowledge • Inspiring Futures
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <FooterSocialLink
                            href="https://www.instagram.com/muttichira_dars/"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5a4.25 4.25 0 004.25 4.25h8.5a4.25 4.25 0 004.25-4.25v-8.5a4.25 4.25 0 00-4.25-4.25h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.25-.25a.75.75 0 110 1.5.75.75 0 010-1.5z" />}
                        />
                        <FooterSocialLink
                            href="https://www.youtube.com/@muttichiradars"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 11.75a29 29 0 00-.46-5.33zM9.75 15.02V8.48L15.45 11.75l-5.7 3.27z" />}
                        />
                        <FooterSocialLink
                            href="https://sites.google.com/view/bayanululoomdars-usthad/home"
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0v-8m0 0l-4 4m4-4l4 4M2 12h20" />}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const StatItem = ({ value, label }: { value: string, label: string }) => (
    <div className="space-y-1">
        <p className="text-3xl font-serif text-white tracking-tighter">{value}</p>
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{label}</p>
    </div>
);

const FooterSocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-500"
    >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
        </svg>
    </a>
);

export default About;
