import React from 'react';
import Logo from './Logo';

interface AboutProps {
    booksCount?: number;
    studentsCount?: number;
}

const About: React.FC<AboutProps> = ({ booksCount, studentsCount }) => {
    return (
        <div className="max-w-6xl mx-auto px-6 py-24 space-y-32 animate-in fade-in duration-1000 bg-[#f0f2f5]">
            {/* Hero Section - The Future of Knowledge */}
            <section className="relative flex flex-col md:flex-row items-center gap-20">
                <div className="flex-1 space-y-10">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="p-4 neo-card rounded-2xl">
                            <Logo className="w-10 h-10" />
                        </div>
                        <div className="px-6 py-2 rounded-full neo-inset text-teal-600 text-[10px] font-black uppercase tracking-[0.3em]">
                            Vision 2026
                        </div>
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black text-gray-900 leading-[0.85] tracking-tighter uppercase opacity-90">
                        THE FUTURE OF <br />
                        <span className="text-teal-600/30">KNOWLEDGE</span>
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed max-w-lg font-bold italic pr-10">
                        Welcome to Bayanul Uloom Dars, where tradition meets modernity in Islamic education. Our aim is to nurture pious, knowledgeable, and socially responsible individuals guided by the principles of Islam.
                    </p>
                </div>
                <div className="relative w-full md:w-2/5 aspect-square">
                    <div className="absolute inset-0 bg-teal-500/5 blur-[120px] rounded-full"></div>
                    <div className="relative h-full w-full neo-card rounded-[4rem] flex items-center justify-center overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent"></div>
                        <svg className="w-32 h-32 text-teal-600 transition-transform duration-1000 group-hover:scale-110 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Content Section - Our Quiet Mission */}
            <section className="relative flex flex-col md:flex-row-reverse items-center gap-20">
                <div className="flex-1 space-y-10">
                    <h2 className="text-6xl md:text-8xl font-black text-gray-900 leading-tight tracking-tight uppercase opacity-90">
                        ലക്ഷ്യങ്ങൾ
                    </h2>
                    <div className="space-y-6 text-gray-500 text-xl leading-relaxed font-black">
                        <ul className="space-y-6 list-none">
                            <li className="flex gap-6 items-start">
                                <span className="text-teal-600 text-2xl">•</span>
                                <span className="pt-1">പ്രാമാണിക ഗ്രന്ഥങ്ങളിൽ അവഗാഹമുള്ള പണ്ഡിതപ്രതിഭകളെ വാർത്തെടുക്കുക.</span>
                            </li>
                            <li className="flex gap-6 items-start">
                                <span className="text-teal-600 text-2xl">•</span>
                                <span className="pt-1">ആധുനിക വെല്ലുവിളികളെ നേരിടാനുതകുന്ന പ്രബോധകരെയും ഇസ്ലാമിക ബോധമുള്ള സമൂഹത്തെയും വളർത്തിയെടുക്കുക.</span>
                            </li>
                            <li className="flex gap-6 items-start">
                                <span className="text-teal-600 text-2xl">•</span>
                                <span className="pt-1">സമൂഹത്തിന് ആത്മീയ നേതൃത്വങ്ങളെ സമ്മാനിക്കുക</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="relative w-full md:w-2/5 aspect-square">
                    <div className="absolute inset-0 bg-gray-500/5 blur-[120px] rounded-full"></div>
                    <div className="relative h-full w-full neo-card rounded-[4rem] flex items-center justify-center overflow-hidden group">
                        <svg className="w-32 h-32 text-gray-300 transition-transform duration-1000 group-hover:scale-110 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Stats row - Responsive Grid */}
            <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 pt-20 border-t border-gray-100">
                <StatItem
                    value={booksCount !== undefined ?
                        (booksCount >= 1000 ? `${(booksCount / 1000).toFixed(1)}k+` : booksCount.toString())
                        : "0"}
                    label="Volumes"
                />
                <StatItem
                    value={studentsCount !== undefined ? studentsCount.toString() : "0"}
                    label="Muthallims"
                />
                <StatItem value="100%" label="Digital" />
                <StatItem value="24/7" label="Access" />
            </section>

            {/* Minimalist Footer */}
            <section className="relative pt-32 pb-16 border-t border-gray-100">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-4 text-center md:text-left">
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Stay Connected</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em]">
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
    <div className="space-y-2 p-8 neo-card rounded-[2rem] text-center">
        <p className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">{value}</p>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">{label}</p>
    </div>
);

const FooterSocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-16 h-16 rounded-2xl neo-button flex items-center justify-center text-gray-400 hover:text-teal-600 transition-all duration-500"
    >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
        </svg>
    </a>
);

export default About;
