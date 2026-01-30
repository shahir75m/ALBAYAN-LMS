import React, { useState, useMemo } from 'react';
import { Book, User, BorrowRequest, HistoryRecord, Fine } from '../types';
import { downloadCatalogPDF } from '../utils/pdfGenerator';

const StatCompact = ({ title, value, color }: any) => {
    const colors: Record<string, string> = { emerald: 'text-teal-accent', amber: 'text-amber-500', red: 'text-rose-500', blue: 'text-blue-500' };
    return (
        <div className="neo-card p-8 rounded-[2rem] transition-all group hover:scale-[1.02]">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">{title}</h3>
            <div className="flex items-center justify-between">
                <p className="text-4xl font-black text-gray-800 tracking-tight">{value}</p>
                <div className={`w-3 h-3 rounded-full ${colors[color]} shadow-current opacity-80 group-hover:animate-pulse`}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <circle cx="12" cy="12" r="8" />
                    </svg>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {myActiveBorrows.map(h => {
                                        const book = books.find(b => b.id === h.bookId);
                                        return (
                                            <div key={h.id} className="neo-card p-6 rounded-[2rem] flex gap-5 hover:neo-card-hover transition-all cursor-pointer group" onClick={() => book && setSelectedBook(book)}>
                                                <div className="w-20 h-28 neo-inset rounded-xl overflow-hidden shrink-0 border border-white/40">
                                                    <img src={book?.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={h.bookTitle} />
                                                </div>
                                                <div className="flex flex-col py-1 flex-1">
                                                    <h4 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{h.bookTitle}</h4>
                                                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold">Borrowed: {new Date(h.borrowDate).toLocaleDateString()}</p>
                                                    <div className="mt-auto flex items-center justify-between">
                                                        <span className="text-[9px] text-teal-600 font-black uppercase tracking-widest">In Your Care</span>
                                                        <div className="w-8 h-8 rounded-full neo-flat flex items-center justify-center text-gray-400 group-hover:text-teal-600 transition-colors">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredBooks.map(book => {
                            const isTaken = book.availableCopies === 0;
                            const hasRequested = requests.some(r => r.userId === currentUser.id && r.bookId === book.id && r.status === 'PENDING');
                            const isBorrowing = book.currentBorrowers.some(cb => cb.userId === currentUser.id);
                            const availabilityPercent = (book.availableCopies / book.totalCopies) * 100;

                            const bookQueue = requests
                                .filter(r => r.bookId === book.id && r.status === 'PENDING')
                                .sort((a, b) => a.timestamp - b.timestamp);
                            const myQueuePosition = bookQueue.findIndex(r => r.userId === currentUser.id) + 1;
                            const totalInQueue = bookQueue.length;

                            return (
                                <div key={book.id} className="neo-card rounded-[2rem] overflow-hidden flex flex-col group hover:neo-card-hover transition-all cursor-pointer" onClick={() => setSelectedBook(book)}>
                                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-50/50 border-b border-white/20">
                                        <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={book.title} />
                                        <div className="absolute top-4 left-4">
                                            <span className="text-[8px] font-bold text-teal-600 bg-white/80 neo-inset px-2 py-1 rounded-full backdrop-blur-md uppercase tracking-widest">
                                                {book.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h4 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{highlightText(book.title, search)}</h4>
                                        <p className="text-gray-400 text-[10px] mt-1.5 font-bold uppercase tracking-widest truncate">by {highlightText(book.author, search)}</p>

                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Stock Level</p>
                                                <p className="text-[10px] text-teal-600 font-black">{book.availableCopies}/{book.totalCopies}</p>
                                            </div>
                                            <div className="w-full h-1.5 neo-inset rounded-full bg-gray-200/50 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${availabilityPercent === 0 ? 'bg-rose-400' : availabilityPercent <= 25 ? 'bg-amber-400' : 'bg-teal-400'}`}
                                                    style={{ width: `${availabilityPercent}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8">
                                            {isBorrowing ? (
                                                <div className="w-full py-3 neo-pressed text-teal-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                    In Hand
                                                </div>
                                            ) : hasRequested ? (
                                                <div className="w-full py-3 neo-pressed text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl flex flex-col items-center justify-center">
                                                    <span>{isTaken ? 'In Queue' : 'Requested'}</span>
                                                    {isTaken && myQueuePosition > 0 && (
                                                        <span className="text-[7px] mt-0.5 opacity-70">Position #{myQueuePosition}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        isTaken ? handleNotify(book.title) : onBorrow(book.id);
                                                    }}
                                                    className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isTaken
                                                        ? 'neo-button text-gray-400 hover:text-gray-600'
                                                        : 'accent-teal shadow-[0_10px_20px_rgba(155,194,185,0.3)] hover:scale-[1.02]'
                                                        }`}
                                                >
                                                    {isTaken ? 'Want This' : 'Borrow Now'}
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
                                <tr className="glass-panel border-b border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Date Requested</th>
                                    <th className="px-6 py-4">Resource Title</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Queue Position</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {myRequests.map(req => {
                                    const book = books.find(b => b.id === req.bookId);
                                    const isInQueue = book && book.availableCopies === 0 && req.status === 'PENDING';
                                    const bookQueue = isInQueue ? requests
                                        .filter(r => r.bookId === req.bookId && r.status === 'PENDING')
                                        .sort((a, b) => a.timestamp - b.timestamp) : [];
                                    const queuePosition = bookQueue.findIndex(r => r.id === req.id) + 1;

                                    return (
                                        <tr key={req.id} className="hover:bg-gray-50 transition-all zebra-row">
                                            <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">{new Date(req.timestamp).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{req.bookTitle}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${req.status === 'PENDING' ? 'accent-amber border-amber-100' :
                                                    req.status === 'APPROVED' ? 'accent-emerald border-emerald-100' :
                                                        'accent-rose border-rose-100'
                                                    }`}>{isInQueue ? 'IN QUEUE' : req.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isInQueue && queuePosition > 0 ? (
                                                    <span className="text-xs text-amber-600 font-bold">#{queuePosition} of {bookQueue.length}</span>
                                                ) : <span className="text-gray-300">---</span>}
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

            {activeTab === 'history' && (
                <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
                    <div className="p-6 border-b border-white/10 glass-panel">
                        <h3 className="font-semibold text-xs text-zinc-300 uppercase tracking-widest">Borrowing History</h3>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="glass-panel border-b border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Borrowed</th>
                                    <th className="px-6 py-4">Book Title</th>
                                    <th className="px-6 py-4">Issued By</th>
                                    <th className="px-6 py-4">Returned</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {myHistory.map(record => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition-all zebra-row">
                                        <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">{new Date(record.borrowDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{record.bookTitle}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{record.issuedBy || '---'}</td>
                                        <td className="px-6 py-4 text-gray-400 font-mono text-[10px]">{record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '---'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${record.returnDate ? 'bg-gray-50 text-gray-400 border-gray-100' : 'accent-blue border-blue-100'}`}>
                                                {record.returnDate ? 'Returned' : 'In Hand'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {myHistory.length === 0 && <tr><td colSpan={5} className="p-16 text-center text-zinc-600 text-xs italic">No borrowing history found</td></tr>}
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
                                <tr className="glass-panel border-b border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {myFines.map(fine => (
                                    <tr key={fine.id} className="hover:bg-gray-50 transition-all zebra-row">
                                        <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">{new Date(fine.timestamp).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-gray-600 text-xs">{fine.reason}</td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-600 font-bold">₹{fine.amount}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${fine.status === 'PAID' ? 'accent-emerald border-emerald-100' : 'accent-rose border-rose-100'}`}>{fine.status}</span>
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
                    <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-2xl" onClick={() => setSelectedBook(null)}></div>
                    <div className="relative w-full max-w-4xl glass-panel rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)]">
                        <div className="w-full md:w-2/5 aspect-[3/4] md:aspect-auto bg-gray-50"><img src={selectedBook.coverUrl} className="w-full h-full object-cover" /></div>
                        <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar relative">
                            <button onClick={() => setSelectedBook(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            <span className="text-[10px] font-black accent-emerald px-3 py-1 rounded-full border border-emerald-100 tracking-widest uppercase">{selectedBook.category}</span>
                            <h2 className="text-3xl font-black text-gray-900 mt-4 uppercase">{selectedBook.title}</h2>
                            <p className="text-gray-500 text-lg mb-8 italic">by {selectedBook.author}</p>
                            <div className="grid grid-cols-2 gap-8 mb-10 pb-8 border-b border-gray-100 text-sm">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Specs</p><p className="text-gray-700">ISBN: {selectedBook.isbn}</p><p className="text-gray-700">ID: #{selectedBook.id}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Stock</p><p className="text-gray-700">{selectedBook.availableCopies} available of {selectedBook.totalCopies}</p></div>
                            </div>
                            <button
                                onClick={() => { selectedBook.availableCopies === 0 ? handleNotify(selectedBook.title) : onBorrow(selectedBook.id); setSelectedBook(null); }}
                                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl ${selectedBook.availableCopies === 0 ? 'glass-button text-gray-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200'}`}
                            >
                                {selectedBook.availableCopies === 0 ? 'Join Waitlist' : 'Borrow Concept Asset'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
