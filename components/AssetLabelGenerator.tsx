import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { generateBookQRCode, generateSmartQRCode } from '../utils/qrcode';

interface AssetLabelGeneratorProps {
    onClose: () => void;
    existingBooks: Book[];
}

const AssetLabelGenerator: React.FC<AssetLabelGeneratorProps> = ({ onClose, existingBooks }) => {
    const [mode, setMode] = useState<'range' | 'selection'>('range');
    const [prefix, setPrefix] = useState('ALB');
    const [startNum, setStartNum] = useState(1);
    const [count, setCount] = useState(10);
    const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
    const [useSmartTags, setUseSmartTags] = useState(true);
    const [labels, setLabels] = useState<{ id: string; qrUrl: string; title?: string }[]>([]);
    const [generating, setGenerating] = useState(false);

    const generateLabels = async () => {
        setGenerating(true);
        const newLabels = [];

        if (mode === 'range') {
            for (let i = 0; i < count; i++) {
                const id = `${prefix}-${String(startNum + i).padStart(3, '0')}`;
                const qrUrl = await generateBookQRCode(id, 200);
                newLabels.push({ id, qrUrl });
            }
        } else {
            for (const id of selectedBookIds) {
                const book = existingBooks.find(b => b.id === id);
                if (!book) continue;
                const qrUrl = useSmartTags
                    ? await generateSmartQRCode(book, 200)
                    : await generateBookQRCode(id, 200);
                newLabels.push({ id, qrUrl, title: book.title });
            }
        }

        setLabels(newLabels);
        setGenerating(false);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md print:p-0 print:bg-white print:relative print:z-0">
            <div className="relative w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-3xl flex flex-col max-h-[90vh] print:max-w-none print:bg-white print:border-none print:rounded-none print:shadow-none print:max-h-none print:h-auto">
                {/* Header - Hidden on Print */}
                <div className="px-10 py-8 border-b border-zinc-800 flex items-center justify-between shrink-0 print:hidden">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Asset Tag Generator</h3>
                        <p className="text-sm text-zinc-500 mt-1">Generate professional QR labels for your library books</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-all text-zinc-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden print:block">
                    {/* Controls - Hidden on Print */}
                    <div className="w-full md:w-80 bg-zinc-950/50 border-r border-zinc-800 p-8 overflow-y-auto no-scrollbar print:hidden">
                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Generation Mode</label>
                                <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
                                    <button
                                        onClick={() => setMode('range')}
                                        className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${mode === 'range' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        Range
                                    </button>
                                    <button
                                        onClick={() => setMode('selection')}
                                        className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${mode === 'selection' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        Existing
                                    </button>
                                </div>
                            </div>

                            {mode === 'range' ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">ID Prefix</label>
                                        <input
                                            type="text" value={prefix} onChange={e => setPrefix(e.target.value.toUpperCase())}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-mono"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Start At</label>
                                            <input
                                                type="number" value={startNum} onChange={e => setStartNum(parseInt(e.target.value) || 1)}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Quantity</label>
                                            <input
                                                type="number" value={count} onChange={e => setCount(parseInt(e.target.value) || 1)}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Select Books ({selectedBookIds.length})</label>
                                    <div className="max-h-64 overflow-y-auto border border-zinc-800 rounded-2xl bg-zinc-900/50 p-2 space-y-1 no-scrollbar">
                                        {existingBooks.map(book => (
                                            <button
                                                key={book.id}
                                                onClick={() => {
                                                    setSelectedBookIds(prev =>
                                                        prev.includes(book.id) ? prev.filter(i => i !== book.id) : [...prev, book.id]
                                                    );
                                                }}
                                                className={`w-full text-left p-3 rounded-xl text-[10px] transition-all flex items-center justify-between group ${selectedBookIds.includes(book.id) ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
                                            >
                                                <span className="truncate flex-1 font-medium">{book.title}</span>
                                                <span className="font-mono ml-2 opacity-50">#{book.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl group cursor-pointer" onClick={() => setUseSmartTags(!useSmartTags)}>
                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${useSmartTags ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-900/20' : 'border-zinc-700 bg-zinc-950'}`}>
                                            {useSmartTags && (
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-tight">Use Smart Tags</p>
                                            <p className="text-[8px] text-zinc-600 font-medium">Includes Title, Author & Category in QR</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={generateLabels}
                                disabled={generating || (mode === 'selection' && selectedBookIds.length === 0)}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {generating ? 'Generating...' : 'Apply Parameters'}
                            </button>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 bg-zinc-900/50 overflow-y-auto p-12 no-scrollbar print:p-0 print:bg-white print:overflow-visible">
                        {labels.length > 0 ? (
                            <div className="space-y-12 print:space-y-0" id="print-area">
                                <div className="flex justify-between items-center mb-8 print:hidden">
                                    <h4 className="text-xs font-black text-zinc-600 uppercase tracking-widest">Preview & Print Layout</h4>
                                    <button
                                        onClick={handlePrint}
                                        className="px-8 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                        Print Tags
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
                                    {labels.map((label, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center gap-3 print:border-zinc-300 print:shadow-none print:break-inside-avoid">
                                            <div className="w-full flex justify-between items-center opacity-40">
                                                <span className="text-[6px] font-black uppercase tracking-widest text-black">ALBAYAN LIBRARY</span>
                                                <span className="text-[6px] font-mono text-black">#ID-{label.id.split('-').pop()}</span>
                                            </div>
                                            <div className="bg-white p-1">
                                                <img src={label.qrUrl} alt={label.id} className="w-full aspect-square" />
                                            </div>
                                            <div className="text-center w-full">
                                                <p className="text-[10px] font-black text-black tracking-tight leading-none truncate">{label.title || 'ASSET TAG'}</p>
                                                <p className="text-[8px] font-mono font-bold text-zinc-800 mt-1 uppercase">{label.id}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                    @media print {
                                        body { visibility: hidden; background: white; }
                                        #print-area, #print-area * { visibility: visible; }
                                        #print-area { 
                                            position: absolute; 
                                            left: 0; 
                                            top: 0; 
                                            width: 100%; 
                                            margin: 0;
                                            padding: 0;
                                        }
                                    }
                                `}} />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mb-6 text-zinc-700">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                                </div>
                                <h5 className="text-xl font-bold text-zinc-400">Ready to Generate</h5>
                                <p className="text-sm text-zinc-600 mt-2 max-w-xs">Configure the parameters on the left and click "Apply" to preview your stickers.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetLabelGenerator;
