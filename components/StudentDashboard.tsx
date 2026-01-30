import React, { useState, useMemo } from 'react';
import { Book, User, BorrowRequest, HistoryRecord, Fine } from '../types';
import { downloadCatalogPDF } from '../utils/pdfGenerator';

const StatCompact = ({ title, value, color }: any) => {
    const colors: Record<string, string> = { emerald: 'teal', amber: 'amber', red: 'rose', blue: 'blue' };
    const colorClass = colors[color];
    const shadowColors: Record<string, string> = { emerald: 'rgba(20,184,166,0.2)', amber: 'rgba(245,158,11,0.2)', red: 'rgba(244,63,94,0.2)', blue: 'rgba(59,130,246,0.2)' };

    return (
        <div className="glass-card p-10 rounded-[3rem] transition-all hover:glass-card-hover group border-white">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 opacity-60">{title}</h3>
            <div className="flex items-center justify-between">
                <p className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{value}</p>
                <div
                    className={`w-14 h-14 rounded-2xl bg-${colorClass}-500/10 border border-${colorClass}-500/20 text-${colorClass}-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm`}
                    style={{ boxShadow: `0 8px 16px ${shadowColors[color]}` }}
                >
                    <div className="w-3 h-3 rounded-full bg-current animate-pulse shadow-[0_0_12px_rgba(current,0.4)]" />
                </div>
            </div>
        </div>
    );
};

interface StudentDashboardProps {
    activeTab: string;
    books: Book[];
    requests: BorrowRequest[];
    history: HistoryRecord[];
    fines: Fine[];
    currentUser: User;
    onBorrow: (bookId: string) => void;
    globalStatus: { msg: { text: string, type: 'success' | 'error' } | null, set: (text: string, type?: 'success' | 'error') => void };
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
    activeTab, books, requests, history, fines, currentUser, onBorrow, globalStatus
}) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [sortBy, setSortBy] = useState('title');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    const filteredBooks = books.filter(b =>
        (filter === 'All' || b.category === filter) &&
        (b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.author.toLowerCase().includes(search.toLowerCase()) ||
            b.id.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'author') return a.author.localeCompare(b.author);
        if (sortBy === 'year') return b.year - a.year;
        return 0;
    });

    const categories = useMemo(() => {
        const counts: Record<string, number> = {};
        books.forEach(b => {
            counts[b.category] = (counts[b.category] || 0) + 1;
        });
        const uniqueCats = Array.from(new Set(books.map(b => b.category)));
        return [
            { name: 'All', count: books.length },
            ...uniqueCats.map(c => ({ name: c, count: counts[c] }))
        ];
    }, [books]);

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <mark key={i} className="bg-emerald-500/30 text-emerald-400 p-0 rounded-sm">{part}</mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    };

    const myHistory = history.filter(h => h.userId === currentUser.id);
    const myRequests = requests.filter(r => r.userId === currentUser.id);
    const myActiveBorrows = history.filter(h => h.userId === currentUser.id && !h.returnDate);
    const myFines = fines.filter(f => f.userId === currentUser.id);
    const myPendingFines = myFines.filter(f => f.status === 'PENDING');

    const statusMsg = globalStatus.msg;
    const setStatusMsg = globalStatus.set;

    const handleNotify = (title: string) => {
        setStatusMsg(`Priority Notification Set: You will be alerted when "${title}" returns.`);
    };

    const handleDownloadCatalog = () => {
        downloadCatalogPDF(filteredBooks, setStatusMsg);
    };

    return (
        <div className="relative">
            {/* Global Status Message Banner */}
            {statusMsg && (
                <div className={`sticky top-4 z-[60] mb-8 px-8 py-5 rounded-[2.5rem] glass-panel border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 flex items-center justify-between gap-4 ${statusMsg.type === 'success'
                    ? 'border-emerald-500/30 text-emerald-400'
                    : 'border-red-500/30 text-red-400'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${statusMsg.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'} shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse`}></div>
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{statusMsg.text}</span>
                    </div>
                    <button onClick={() => globalStatus.set('')} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Tab Content Switching */}
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCompact title="Active Holds" value={myActiveBorrows.length} color="emerald" />
                        <StatCompact title="Queue Position" value={myRequests.filter(r => r.status === 'PENDING').length} color="amber" />
                        <StatCompact title="Active Fines" value={myPendingFines.length} color="red" />
                        <StatCompact title="Lifetime Reads" value={myHistory.filter(h => h.returnDate).length} color="blue" />
                    </div>

                    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-white/10 glass-panel flex items-center justify-between">
                            <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                                Books In Your Care
                            </h3>
                        </div>
                        <div className="p-6">
                            {myActiveBorrows.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {myActiveBorrows.map(h => {
                                        const book = books.find(b => b.id === h.bookId);
                                        return (
                                            <div key={h.id} className="glass-card p-6 rounded-[2.2rem] flex gap-5 hover:glass-card-hover transition-all cursor-pointer group border-white/60" onClick={() => book && setSelectedBook(book)}>
                                                <div className="w-20 h-28 bg-gray-50/50 rounded-2xl overflow-hidden shrink-0 border border-white/40 shadow-sm relative">
                                                    <img src={book?.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={h.bookTitle} />
                                                </div>
                                                <div className="flex flex-col py-1 flex-1 relative">
                                                    <h4 className="font-black text-gray-900 text-sm leading-snug line-clamp-2 uppercase tracking-tight">{h.bookTitle}</h4>
                                                    <p className="text-[9px] text-gray-400 mt-2 uppercase tracking-widest font-black opacity-70">Issued: {new Date(h.borrowDate).toLocaleDateString()}</p>
                                                    <div className="mt-auto flex items-center justify-between">
                                                        <span className="text-[8px] text-teal-600 font-black uppercase tracking-[0.2em] bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20 shadow-[0_2px_8px_rgba(20,184,166,0.15)]">In Care</span>
                                                        <div className="w-9 h-9 rounded-xl glass-button flex items-center justify-center text-gray-300 group-hover:text-teal-600 transition-all shadow-sm">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-500 border border-white/10"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg></div>
                                    <p className="text-zinc-400 font-medium text-xs italic">Your library bag is empty.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'catalog' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col md:flex-row gap-4 items-center flex-1 w-full">
                            <div className="relative w-full md:w-80">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text" placeholder="Find your next book..."
                                    value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm w-full transition-all shadow-lg"
                                />
                            </div>
                            <div className="relative w-full md:w-48">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs outline-none appearance-none cursor-pointer"
                                >
                                    <option value="title">Sort by Title</option>
                                    <option value="author">Sort by Author</option>
                                    <option value="year">Sort by Newest</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <div className="relative w-full md:w-48">
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs outline-none appearance-none cursor-pointer"
                                >
                                    {categories.map(c => (
                                        <option key={c.name} value={c.name}>
                                            {c.name} ({c.count})
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <button onClick={handleDownloadCatalog} className="neo-button py-3 px-8 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-all whitespace-nowrap text-gray-600 hover:text-teal-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Export Catalog
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredBooks.map(book => {
                            const isTaken = book.availableCopies === 0;
                            const hasRequested = requests.some(r => r.userId === currentUser.id && r.bookId === book.id && r.status === 'PENDING');
                            const isBorrowing = book.currentBorrowers.some(cb => cb.userId === currentUser.id);
                            const availabilityPercent = (book.availableCopies / book.totalCopies) * 100;

                            const bookQueue = requests
                                .filter(r => r.bookId === book.id && r.status === 'PENDING')
                                .sort((a, b) => a.timestamp - b.timestamp);
                            const myQueuePosition = bookQueue.findIndex(r => r.userId === currentUser.id) + 1;

                            return (
                                <div key={book.id} className="glass-card rounded-[2.2rem] overflow-hidden flex flex-col group hover:glass-card-hover transition-all cursor-pointer border-white/60" onClick={() => setSelectedBook(book)}>
                                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-50/50 border-b border-gray-100/30">
                                        <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={book.title} />
                                        <div className="absolute top-5 left-5">
                                            <span className="text-[8px] font-black text-teal-600 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white uppercase tracking-[0.2em] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                                                {book.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-7 flex flex-col flex-1">
                                        <h4 className="font-black text-gray-900 text-[13px] leading-snug line-clamp-2 uppercase tracking-tight">{highlightText(book.title, search)}</h4>
                                        <p className="text-gray-400 text-[9px] mt-2 font-black uppercase tracking-[0.15em] opacity-60">by {highlightText(book.author, search)}</p>

                                        <div className="mt-8 pt-6 border-t border-gray-100/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest opacity-60">Inventory Status</p>
                                                <p className="text-[10px] text-teal-600 font-black">{book.availableCopies} <span className="text-gray-300">/ {book.totalCopies}</span></p>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100/50 rounded-full overflow-hidden border border-gray-50/50">
                                                <div
                                                    className={`h-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--color-rgb),0.3)] ${availabilityPercent === 0 ? 'bg-rose-400' : availabilityPercent <= 25 ? 'bg-amber-400' : 'bg-teal-400'}`}
                                                    style={{ width: `${availabilityPercent}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8">
                                            {isBorrowing ? (
                                                <div className="w-full py-4 bg-teal-500/10 text-teal-600 text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl border border-teal-500/20 flex items-center justify-center gap-2">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    Active Asset
                                                </div>
                                            ) : hasRequested ? (
                                                <div className="w-full py-4 bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl border border-amber-500/20 flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.1)]">
                                                    <span>{isTaken ? `Hold #${myQueuePosition}` : 'Hold Active'}</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); isTaken ? handleNotify(book.title) : onBorrow(book.id); }}
                                                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 shadow-sm ${isTaken
                                                        ? 'glass-button text-gray-400 hover:text-gray-900'
                                                        : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-500/10'
                                                        }`}
                                                >
                                                    {isTaken ? 'Set Alert' : 'Request Access'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'my-requests' && (
                <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
                    <div className="p-6 border-b border-white/10 glass-panel">
                        <h3 className="font-semibold text-xs text-zinc-300 uppercase tracking-widest">Request History</h3>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Resource</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-center">Queue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50">
                                {myRequests.map(req => {
                                    const book = books.find(b => b.id === req.bookId);
                                    const isInQueue = book && book.availableCopies === 0 && req.status === 'PENDING';
                                    const bookQueue = isInQueue ? requests
                                        .filter(r => r.bookId === req.bookId && r.status === 'PENDING')
                                        .sort((a, b) => a.timestamp - b.timestamp) : [];
                                    const queuePosition = bookQueue.findIndex(r => r.id === req.id) + 1;

                                    return (
                                        <tr key={req.id} className="hover:bg-white/40 transition-all zebra-row group">
                                            <td className="px-8 py-5 text-gray-400 font-mono text-[10px] uppercase tracking-widest">{new Date(req.timestamp).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 font-black text-gray-900 tracking-tight">{req.bookTitle}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                    req.status === 'APPROVED' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                                                        'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                    }`}>{isInQueue ? 'IN QUEUE' : req.status}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                {isInQueue && queuePosition > 0 ? (
                                                    <span className="text-[10px] text-amber-600 font-black tracking-widest bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">#{queuePosition} OF {bookQueue.length}</span>
                                                ) : <span className="text-gray-300 font-black tracking-[0.3em]">---</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {myRequests.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40">No pending requests</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
                    <div className="p-6 border-b border-white/10 glass-panel">
                        <h3 className="font-semibold text-xs text-zinc-300 uppercase tracking-widest">Borrowing History</h3>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Borrowed</th>
                                    <th className="px-8 py-5">Resource</th>
                                    <th className="px-8 py-5">Issued By</th>
                                    <th className="px-8 py-5">Returned</th>
                                    <th className="px-8 py-5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50">
                                {myHistory.map(record => (
                                    <tr key={record.id} className="hover:bg-white/40 transition-all zebra-row group">
                                        <td className="px-8 py-5 text-gray-400 font-mono text-[10px] uppercase tracking-widest">{new Date(record.borrowDate).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 font-black text-gray-900 tracking-tight">{record.bookTitle}</td>
                                        <td className="px-8 py-5 text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70">{record.issuedBy || '---'}</td>
                                        <td className="px-8 py-5 text-gray-300 font-mono text-[10px] uppercase tracking-widest">{record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '---'}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${record.returnDate ? 'bg-gray-100/50 text-gray-400 border-gray-200' : 'bg-teal-500/10 text-teal-600 border-teal-500/20'}`}>
                                                {record.returnDate ? 'ARCHIVED' : 'ACTIVE'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {myHistory.length === 0 && <tr><td colSpan={5} className="p-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40">History is clear</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'my-fines' && (
                <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
                    <div className="p-6 border-b border-white/10 glass-panel">
                        <h3 className="font-semibold text-xs text-zinc-300 uppercase tracking-widest">My Fines</h3>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Reason</th>
                                    <th className="px-8 py-5 text-right">Credit/Debit</th>
                                    <th className="px-8 py-5 text-center">Settlement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50">
                                {myFines.map(fine => (
                                    <tr key={fine.id} className="hover:bg-white/40 transition-all zebra-row group">
                                        <td className="px-8 py-5 text-gray-400 font-mono text-[10px] uppercase tracking-widest">{new Date(fine.timestamp).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 text-gray-600 font-bold text-xs uppercase tracking-tight">{fine.reason}</td>
                                        <td className="px-8 py-5 text-right font-black text-rose-600 tracking-tight">₹{fine.amount}</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${fine.status === 'PAID' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>{fine.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {myFines.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40">Accounts settled</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* selectedBook Details Modal */}
            {selectedBook && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-2xl" onClick={() => setSelectedBook(null)}></div>
                    <div className="relative w-full max-w-4xl glass-panel rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh] shadow-[0_32px_128px_rgba(0,0,0,0.08)] border-white/60">
                        <div className="w-full md:w-2/5 h-72 md:h-auto bg-gray-50/50">
                            <img src={selectedBook.coverUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 p-8 md:p-14 overflow-y-auto no-scrollbar relative">
                            <button onClick={() => setSelectedBook(null)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center glass-button rounded-xl text-gray-400 hover:text-gray-900 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>

                            <span className="text-[10px] font-black text-teal-600 bg-teal-500/10 px-4 py-1.5 rounded-full border border-teal-500/20 uppercase tracking-widest">{selectedBook.category}</span>
                            <h2 className="text-4xl font-black text-gray-900 mt-6 uppercase tracking-tight leading-none">{selectedBook.title}</h2>
                            <p className="text-gray-400 text-lg mt-3 font-bold uppercase tracking-wide opacity-70">by {selectedBook.author}</p>

                            <div className="grid grid-cols-2 gap-10 my-10 py-8 border-y border-gray-100/50">
                                <div><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 opacity-60">Identity</p><p className="text-xs text-gray-800 font-black tracking-widest">ISBN: {selectedBook.isbn}</p><p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1 uppercase">ID: #{selectedBook.id}</p></div>
                                <div><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 opacity-60">Availability</p><p className="text-sm text-gray-900 font-black tracking-tight">{selectedBook.availableCopies} <span className="text-[10px] text-gray-400 uppercase">/ {selectedBook.totalCopies} Copies</span></p></div>
                            </div>

                            <button
                                onClick={() => { selectedBook.availableCopies === 0 ? handleNotify(selectedBook.title) : onBorrow(selectedBook.id); setSelectedBook(null); }}
                                className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.25em] transition-all shadow-xl ${selectedBook.availableCopies === 0 ? 'glass-button text-gray-400 hover:text-gray-900 border-white/60' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-500/20'}`}
                            >
                                {selectedBook.availableCopies === 0 ? 'Reserve Next Copy' : 'Complete Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
