import React, { useState, useMemo } from 'react';
import { Book, User, BorrowRequest, HistoryRecord, Fine } from '../types';

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

    return (
        <div className="relative">
            {/* Global Status Message Banner */}
            {statusMsg && (
                <div className={`sticky top-4 z-[60] mb-8 px-8 py-5 rounded-[2.5rem] border backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-4 duration-500 flex items-center justify-between gap-4 ${statusMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${statusMsg.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse`}></div>
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{statusMsg.text}</span>
                    </div>
                    <button onClick={() => globalStatus.set('')} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Tab Content Switching */}
            {activeTab === 'dashboard' && (
                <div className="space-y-12 animate-in fade-in zoom-in duration-1000">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCompact title="Active Holds" value={myActiveBorrows.length} color="emerald" />
                        <StatCompact title="Queue Position" value={myRequests.filter(r => r.status === 'PENDING').length} color="amber" />
                        <StatCompact title="Global Fines" value={myPendingFines.length} color="red" />
                        <StatCompact title="Identity Rating" value={myHistory.filter(h => h.returnDate).length} color="blue" />
                    </div>

                    <div className="glass-main border-white/5 rounded-[3rem] overflow-hidden">
                        <div className="px-10 py-7 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-zinc-500">
                                Assigned Assets
                            </h3>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full">In Your Care</span>
                        </div>
                        <div className="p-10">
                            {myActiveBorrows.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {myActiveBorrows.map(h => {
                                        const book = books.find(b => b.id === h.bookId);
                                        return (
                                            <div key={h.id} className="glass-card hover:bg-white/[0.04] p-6 rounded-[2.5rem] flex gap-6 group cursor-pointer transition-all active:scale-[0.98]" onClick={() => book && setSelectedBook(book)}>
                                                <div className="w-20 h-28 glass-card border-white/10 rounded-2xl overflow-hidden shrink-0 glow-emerald">
                                                    <img src={book?.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={h.bookTitle} />
                                                </div>
                                                <div className="flex flex-col py-2">
                                                    <h4 className="font-black text-white text-base tracking-tight leading-tight line-clamp-2">{h.bookTitle}</h4>
                                                    <p className="text-[9px] text-zinc-500 font-bold mt-2 uppercase tracking-[0.2em]">Hash: {new Date(h.borrowDate).toLocaleDateString()}</p>
                                                    <div className="mt-auto">
                                                        <span className="inline-flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                            Secured
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-24 text-center">
                                    <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6 text-zinc-700"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
                                    <p className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.4em] italic shadow-black/50">Terminal Empty: No active links</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'catalog' && (
                <div className="space-y-12 animate-in slide-in-from-bottom duration-1000">
                    <div className="flex flex-col gap-10">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full group">
                                <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text" placeholder="Protocol: Search Global Knowledge Hub..."
                                    value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="glass-main border-white/5 rounded-[2rem] pl-16 pr-8 py-5 text-sm text-white placeholder:text-zinc-700 focus:glow-emerald outline-none w-full transition-all"
                                />
                            </div>
                            <div className="relative w-full md:w-64">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full glass-main border-white/5 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 outline-none focus:glow-emerald appearance-none cursor-pointer transition-all"
                                >
                                    <option value="title">Sorting: Alphanumeric</option>
                                    <option value="author">Sorting: Originator</option>
                                    <option value="year">Sorting: Chronology</option>
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-4 w-full no-scrollbar">
                            {categories.map(c => (
                                <button
                                    key={c.name} onClick={() => setFilter(c.name)}
                                    className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border whitespace-nowrap flex items-center gap-3 shrink-0 ${filter === c.name
                                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 glow-emerald'
                                        : 'glass-card text-zinc-500 hover:text-zinc-300 border-white/5'
                                        }`}
                                >
                                    {c.name}
                                    <span className={`px-2 py-0.5 rounded-md ${filter === c.name ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/5 text-zinc-600'}`}>
                                        {c.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {filteredBooks.map(book => {
                            const isTaken = book.availableCopies === 0;
                            const hasRequested = requests.some(r => r.userId === currentUser.id && r.bookId === book.id && r.status === 'PENDING');
                            const isBorrowing = book.currentBorrowers.some(cb => cb.userId === currentUser.id);
                            const availabilityPercent = (book.availableCopies / book.totalCopies) * 100;

                            return (
                                <div key={book.id} className="glass-card rounded-[2.5rem] overflow-hidden flex flex-col group hover:glow-emerald transition-all active:scale-[0.99] cursor-pointer relative" onClick={() => setSelectedBook(book)}>
                                    <div className="aspect-[3/4.2] relative overflow-hidden bg-black/20">
                                        <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt={book.title} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent opacity-80" />

                                        <div className="absolute top-5 left-5">
                                            <span className="text-[8px] font-black text-white/90 bg-black/60 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-xl uppercase tracking-widest">
                                                {book.category}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-6 left-6 right-6">
                                            <h4 className="font-black text-white text-xl leading-tight tracking-tight drop-shadow-2xl shadow-black">{highlightText(book.title, search)}</h4>
                                            <p className="text-zinc-400 text-[10px] mt-2 font-black uppercase tracking-[0.2em] drop-shadow-xl">Log: {highlightText(book.author, search)}</p>
                                        </div>
                                    </div>
                                    <div className="p-7 flex flex-col flex-1 bg-[#050507]/20 backdrop-blur-sm border-t border-white/5">
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.3em]">Stock Capacity</p>
                                                <p className="text-[10px] text-zinc-300 font-bold">{book.availableCopies} / {book.totalCopies}</p>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 shadow-[0_0_10px_currentColor] ${availabilityPercent === 0 ? 'bg-red-500' : availabilityPercent <= 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${availabilityPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-auto">
                                            {isBorrowing ? (
                                                <div className="w-full py-4 glass-card border-white/5 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3">
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                                                    Session Active
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        isTaken ? handleNotify(book.title) : onBorrow(book.id);
                                                    }}
                                                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${hasRequested
                                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                        : isTaken
                                                            ? 'glass-card border-white/5 text-zinc-500 hover:text-zinc-200'
                                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white glow-emerald shadow-xl shadow-emerald-900/20'
                                                        }`}
                                                >
                                                    {hasRequested ? 'Pending Sync' : isTaken ? 'Queue Access' : 'Initialize Data'}
                                                    {!hasRequested && <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
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
                <div className="bg-zinc-900/10 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-700">
                    <div className="p-6 border-b border-zinc-900/50 bg-zinc-900/10">
                        <h3 className="font-semibold text-xs text-zinc-400 uppercase tracking-widest">Request History</h3>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-zinc-900/20 border-b border-zinc-900/50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Date Requested</th>
                                    <th className="px-6 py-4">Resource Title</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Queue Position</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/50">
                                {myRequests.map(req => {
                                    const book = books.find(b => b.id === req.bookId);
                                    const isInQueue = book && book.availableCopies === 0 && req.status === 'PENDING';
                                    const bookQueue = isInQueue ? requests
                                        .filter(r => r.bookId === req.bookId && r.status === 'PENDING')
                                        .sort((a, b) => a.timestamp - b.timestamp) : [];
                                    const queuePosition = bookQueue.findIndex(r => r.id === req.id) + 1;

                                    return (
                                        <tr key={req.id} className="hover:bg-zinc-900/20 transition-all">
                                            <td className="px-6 py-4 text-zinc-600 font-mono text-[10px]">{new Date(req.timestamp).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-medium text-white/90">{req.bookTitle}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>{isInQueue ? 'IN QUEUE' : req.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isInQueue && queuePosition > 0 ? (
                                                    <span className="text-xs text-amber-500 font-bold">#{queuePosition} of {bookQueue.length}</span>
                                                ) : <span className="text-zinc-700">---</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {myRequests.length === 0 && <tr><td colSpan={4} className="p-16 text-center text-zinc-600 text-xs italic">No requests found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'my-fines' && (
                <div className="bg-zinc-900/10 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-700">
                    <div className="p-6 border-b border-zinc-900/50 bg-zinc-900/10">
                        <h3 className="font-semibold text-xs text-zinc-400 uppercase tracking-widest">My Fines</h3>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-zinc-900/20 border-b border-zinc-900/50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/50">
                                {myFines.map(fine => (
                                    <tr key={fine.id} className="hover:bg-zinc-900/20 transition-all">
                                        <td className="px-6 py-4 text-zinc-600 font-mono text-[10px]">{new Date(fine.timestamp).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-zinc-300 text-xs">{fine.reason}</td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-500 font-bold">₹{fine.amount}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${fine.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{fine.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {myFines.length === 0 && <tr><td colSpan={4} className="p-16 text-center text-zinc-600 text-xs italic">No fines found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* selectedBook Details Modal */}
            {selectedBook && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-700" onClick={() => setSelectedBook(null)}></div>
                    <div className="relative w-full max-w-5xl glass-main border-white/5 rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in duration-500 shadow-[0_0_100px_-20px_rgba(0,0,0,1)]">
                        <div className="w-full md:w-2/5 aspect-[3/4.2] md:aspect-auto bg-black/20 relative">
                            <img src={selectedBook.coverUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050507]/40" />
                        </div>
                        <div className="flex-1 p-10 md:p-16 overflow-y-auto no-scrollbar relative flex flex-col">
                            <button onClick={() => setSelectedBook(null)} className="absolute top-10 right-10 p-3 glass-card rounded-full text-white hover:glow-emerald transition-all z-20">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="relative z-10">
                                <span className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/10">{selectedBook.category}</span>
                                <h2 className="text-4xl md:text-5xl font-black text-white mt-8 uppercase tracking-tighter leading-[0.9]">{selectedBook.title}</h2>
                                <p className="text-zinc-500 text-xl mt-6 font-black uppercase tracking-[0.2em] opacity-60">Origin: {selectedBook.author}</p>

                                <div className="grid grid-cols-2 gap-10 mt-12 pt-12 border-t border-white/5">
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Specification</p>
                                        <p className="text-zinc-300 font-bold mb-1">ISBN.ID: {selectedBook.isbn}</p>
                                        <p className="text-zinc-300 font-bold">NODE.REF: #{selectedBook.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Integrity</p>
                                        <p className="text-zinc-300 font-bold">{selectedBook.availableCopies} Units Active / {selectedBook.totalCopies} Total</p>
                                    </div>
                                </div>

                                <div className="mt-16">
                                    <button
                                        onClick={() => { selectedBook.availableCopies === 0 ? handleNotify(selectedBook.title) : onBorrow(selectedBook.id); setSelectedBook(null); }}
                                        className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-[0.97] flex items-center justify-center gap-4 ${selectedBook.availableCopies === 0 ? 'glass-card border-white/5 text-zinc-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white glow-emerald'}`}
                                    >
                                        {selectedBook.availableCopies === 0 ? 'Secure Waitlist Position' : 'Initialize Data Sync'}
                                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCompact = ({ title, value, color }: any) => {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 glow-emerald',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]',
        red: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 glow-cyan'
    };
    return (
        <div className="glass-main border-white/5 p-8 rounded-[2.5rem] transition-all hover:bg-white/[0.04] group">
            <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">{title}</h3>
            <div className="flex items-center justify-between">
                <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${colors[color]}`}>
                    <div className="w-2 h-2 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
