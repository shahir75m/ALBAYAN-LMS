
import React from 'react';

const About: React.FC = () => {
    return (
        <div className="space-y-12 animate-in fade-in duration-1000 max-w-5xl mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-zinc-900/50 border border-zinc-800 p-10 md:p-16 rounded-[3rem] backdrop-blur-xl shadow-2xl overflow-hidden text-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]"></div>

                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase mb-6 relative">
                        AL BAYAN <span className="text-emerald-500">LIBRARY</span>
                    </h1>
                    <p className="text-xl md:text-2xl font-serif text-zinc-400 mb-10 italic">
                        Muttichira Shuhada Memorial Bayanul Uloom Dars
                    </p>

                    <div className="h-px w-32 bg-emerald-500/30 mx-auto mb-10"></div>

                    <div className="space-y-6 text-lg md:text-xl text-zinc-300 leading-relaxed max-w-3xl mx-auto">
                        <p className="font-medium">
                            മുട്ടിച്ചിറ ശുഹദാക്കളുടെ പുണ്യസാന്നിധ്യത്തിൽ, ആത്മീയതയുടെയും വിജ്ഞാനത്തിന്റെയും വെളിച്ചം പകർന്നു നൽകുന്ന മുട്ടിച്ചിറ ശുഹദാ മെമ്മോറിയൽ ബയാനുൽ ഉലൂം ദർസിന്റെ കീഴിലുള്ള വിപുലമായ ഗ്രന്ഥശേഖരമാണ് ബയാനുൽ ഉലൂം ലൈബ്രറി.
                        </p>
                        <p>
                            നൂറ്റാണ്ടുകൾ പഴക്കമുള്ള ആധികാരിക മതഗ്രന്ഥങ്ങൾ മുതൽ ആധുനിക ചരിത്ര-സാഹിത്യ കൃതികൾ വരെ ഉൾക്കൊള്ളുന്ന ഈ ലൈബ്രറി, വിദ്യാർത്ഥികൾക്കും ഗവേഷകർക്കും അറിവിന്റെ അക്ഷയഖനിയാണ്.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mission Quote */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-3xl text-center">
                <p className="text-emerald-400 font-medium leading-relaxed italic">
                    "സാങ്കേതികവിദ്യയുടെ അനന്തസാധ്യതകൾ പ്രയോജനപ്പെടുത്തി, ലൈബ്രറി പ്രവർത്തനങ്ങൾ കൂടുതൽ സുതാര്യവും കാര്യക്ഷമവുമാക്കുക എന്ന ലക്ഷ്യത്തോടെയാണ് <span className="font-black not-italic text-emerald-300 uppercase tracking-wider ml-1">AL BAYAN LIBRARY MANAGEMENT SYSTEM</span> സജ്ജമാക്കിയിരിക്കുന്നത്."
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureCard
                    icon="🌐"
                    title="ഡിജിറ്റൽ കാറ്റലോഗ്"
                    description="ലൈബ്രറിയിലെ ആയിരക്കണക്കിന് പുസ്തകങ്ങൾ ഏതൊക്കെയാണെന്ന് ഓൺലൈനിലൂടെ എളുപ്പത്തിൽ കണ്ടെത്താം. (Digital Catalog)"
                />
                <FeatureCard
                    icon="🔍"
                    title="സ്മാർട്ട് സെർച്ച്"
                    description="പുസ്തകത്തിന്റെ പേര്, രചയിതാവ് അല്ലെങ്കിൽ വിഷയം എന്നിവ ഉപയോഗിച്ച് വേഗത്തിൽ തിരയാനുള്ള സൗകര്യം. (Smart Search)"
                />
                <FeatureCard
                    icon="📊"
                    title="കാര്യക്ഷമമായ ഇടപാടുകൾ"
                    description="പുസ്തകങ്ങൾ നൽകുന്നതും (Issue) തിരിച്ചു സ്വീകരിക്കുന്നതും (Return) ഡിജിറ്റലായി രേഖപ്പെടുത്തുന്നതിലൂടെ കൃത്യത ഉറപ്പുവരുത്തുന്നു. (Efficient Transactions)"
                />
                <FeatureCard
                    icon="📖"
                    title="മുതഅല്ലിം ഫ്രണ്ട്ലി"
                    description="ദർസിലെ വിദ്യാർത്ഥികൾക്ക് തങ്ങൾക്കാവശ്യമായ ഗ്രന്ഥങ്ങൾ ലൈബ്രറിയിൽ ലഭ്യമാണോ എന്ന് തത്സമയം പരിശോധിക്കാം. (Student Friendly)"
                />
            </div>

            {/* Footer Info */}
            <div className="pt-10 border-t border-zinc-900 text-center">
                <p className="text-zinc-600 text-xs font-black uppercase tracking-[0.3em]">
                    Knowledge is Light • വിജ്ഞാനം പ്രകാശമാണ്
                </p>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
    <div className="group bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem] hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-500 shadow-lg">
        <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed font-medium">
            {description}
        </p>
    </div>
);

export default About;
