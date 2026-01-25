import React, { useState, useMemo } from 'react';
import { Book, User, BorrowRequest, HistoryRecord, Fine } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const StatCompact = ({ title, value, color }: any) => {
    const colors: Record<string, string> = { emerald: 'text-emerald-500', amber: 'text-amber-500', red: 'text-red-500', blue: 'text-blue-500' };
    return (
        <div className="bg-zinc-900/10 border border-zinc-800 p-6 rounded-2xl transition-all hover:border-zinc-700">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{title}</h3>
            <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-zinc-200">{value}</p>
                <div className={`w-1.5 h-1.5 rounded-full ${colors[color]} bg-current opacity-60`}></div>
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
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('ALBAYAN LIBRARY CATALOG', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableData = filteredBooks.map(book => [book.id, book.title]);

        autoTable(doc, {
            startY: 40,
            head: [['ID', 'TITLE']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        doc.save('Albayan_Library_Catalog.pdf');
        setStatusMsg('Catalog downloaded as PDF!');
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
                <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCompact title="Active Holds" value={myActiveBorrows.length} color="emerald" />
                        <StatCompact title="Queue Position" value={myRequests.filter(r => r.status === 'PENDING').length} color="amber" />
                        <StatCompact title="Active Fines" value={myPendingFines.length} color="red" />
                        <StatCompact title="Lifetime Reads" value={myHistory.filter(h => h.returnDate).length} color="blue" />
                    </div>

                    <div className="bg-zinc-900/10 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-zinc-900/50 bg-zinc-900/10 flex items-center justify-between">
                            <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                Books In Your Care
                            </h3>
                        </div>
                        <div className="p-6">
                            {myActiveBorrows.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {myActiveBorrows.map(h => {
                                        const book = books.find(b => b.id === h.bookId);
                                        return (
                                            <div key={h.id} className="bg-zinc-900/20 border border-zinc-800 p-4 rounded-2xl flex gap-4 hover:border-zinc-700 transition-all cursor-pointer group" onClick={() => book && setSelectedBook(book)}>
                                                <div className="w-16 h-24 bg-zinc-900/50 rounded-lg overflow-hidden shrink-0">
                                                    <img src={book?.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={h.bookTitle} />
                                                </div>
                                                <div className="flex flex-col py-1">
                                                    <h4 className="font-bold text-zinc-200 text-sm leading-tight line-clamp-2">{h.bookTitle}</h4>
                                                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Borrowed: {new Date(h.borrowDate).toLocaleDateString()}</p>
                                                    <p className="text-[9px] text-zinc-600 mt-0.5 uppercase tracking-widest font-bold">Issued by: {h.issuedBy || 'Admin'}</p>
                                                    <div className="mt-auto">
                                                        <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-500/10">Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-12 h-12 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg></div>
                                    <p className="text-zinc-500 font-medium text-xs italic">Your library bag is empty.</p>
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
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text" placeholder="Find your next book..."
                                    value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="bg-[#0c0c0e] border border-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/90 focus:border-zinc-700 outline-none w-full transition-all shadow-sm"
                                />
                            </div>
                            <div className="relative w-full md:w-48">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full bg-[#0c0c0e] border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-400 outline-none focus:border-zinc-700 appearance-none cursor-pointer"
                                >
                                    <option value="title">Sort by Title</option>
                                    <option value="author">Sort by Author</option>
                                    <option value="year">Sort by Newest</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 w-full no-scrollbar">
                                {categories.map(c => (
                                    <button
                                        key={c.name} onClick={() => setFilter(c.name)}
                                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border whitespace-nowrap flex items-center gap-2 shrink-0 ${filter === c.name
                                            ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-[#0c0c0e] text-zinc-500 hover:text-zinc-300 border-zinc-900'
                                            }`}
                                    >
                                        {c.name}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${filter === c.name ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-600'}`}>
                                            {c.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleDownloadCatalog} className="bg-[#0c0c0e] border border-zinc-900 hover:border-zinc-800 text-zinc-400 font-medium text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download PDF Catalog
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
                                <div key={book.id} className="bg-zinc-900/10 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col group hover:border-zinc-700 transition-all shadow-sm active:scale-[0.99] cursor-pointer" onClick={() => setSelectedBook(book)}>
                                    <div className="aspect-[3/4] relative overflow-hidden bg-zinc-900/20 border-b border-zinc-800/50">
                                        <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={book.title} />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                        <div className="absolute top-3 left-3">
                                            <span className="text-[9px] font-bold text-white/90 bg-black/60 px-2 py-1 rounded backdrop-blur-md">
                                                {book.category}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <h4 className="font-bold text-white text-base leading-tight drop-shadow-md">{highlightText(book.title, search)}</h4>
                                            <p className="text-zinc-300 text-[10px] mt-1 font-medium drop-shadow-sm truncate">by {highlightText(book.author, search)}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">Availability</p>
                                                <p className="text-[10px] text-zinc-400 font-bold">{book.availableCopies} / {book.totalCopies}</p>
                                            </div>
                                            <div className="w-full h-1 bg-zinc-900/50 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${availabilityPercent === 0 ? 'bg-red-500' : availabilityPercent <= 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${availabilityPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-auto">
                                            {isBorrowing ? (
                                                <div className="w-full py-2.5 bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2">
                                                    <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                    In Use
                                                </div>
                                            ) : hasRequested ? (
                                                <div className="w-full py-2.5 bg-amber-500/5 text-amber-500 text-[10px] font-bold uppercase tracking-wider rounded-xl flex flex-col items-center justify-center gap-1 border border-amber-500/10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                                        <span>{isTaken ? 'In Queue' : 'Requested'}</span>
                                                    </div>
                                                    {isTaken && myQueuePosition > 0 && (
                                                        <span className="text-[8px] text-amber-600">Position #{myQueuePosition}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        isTaken ? handleNotify(book.title) : onBorrow(book.id);
                                                    }}
                                                    className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isTaken
                                                        ? 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
                                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/10'
                                                        }`}
                                                >
                                                    {isTaken ? 'Join Queue' : 'Borrow'}
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

            {activeTab === 'history' && (
                <div className="bg-zinc-900/10 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-700">
                    <div className="p-6 border-b border-zinc-900/50 bg-zinc-900/10">
                        <h3 className="font-semibold text-xs text-zinc-400 uppercase tracking-widest">Borrowing History</h3>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-zinc-900/20 border-b border-zinc-900/50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Borrowed</th>
                                    <th className="px-6 py-4">Book Title</th>
                                    <th className="px-6 py-4">Issued By</th>
                                    <th className="px-6 py-4">Returned</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/50">
                                {myHistory.map(record => (
                                    <tr key={record.id} className="hover:bg-zinc-900/20 transition-all">
                                        <td className="px-6 py-4 text-zinc-600 font-mono text-[10px]">{new Date(record.borrowDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-white/90">{record.bookTitle}</td>
                                        <td className="px-6 py-4 text-zinc-500 text-xs">{record.issuedBy || '---'}</td>
                                        <td className="px-6 py-4 text-zinc-600 font-mono text-[10px]">{record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '---'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${record.returnDate ? 'bg-zinc-800/50 text-zinc-500 border-zinc-800' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                {record.returnDate ? 'Returned' : 'In Use'}
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
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setSelectedBook(null)}></div>
                    <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                        <div className="w-full md:w-2/5 aspect-[3/4] md:aspect-auto bg-zinc-900"><img src={selectedBook.coverUrl} className="w-full h-full object-cover" /></div>
                        <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar relative">
                            <button onClick={() => setSelectedBook(null)} className="absolute top-8 right-8 text-zinc-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase bg-emerald-500/10 px-3 py-1 rounded-full">{selectedBook.category}</span>
                            <h2 className="text-3xl font-black text-white mt-4 uppercase">{selectedBook.title}</h2>
                            <p className="text-zinc-500 text-lg mb-8 italic">by {selectedBook.author}</p>
                            <div className="grid grid-cols-2 gap-8 mb-10 pb-8 border-b border-zinc-900 text-sm">
                                <div><p className="text-[10px] font-black text-zinc-600 uppercase mb-2">Specs</p><p className="text-zinc-300">ISBN: {selectedBook.isbn}</p><p className="text-zinc-300">ID: #{selectedBook.id}</p></div>
                                <div><p className="text-[10px] font-black text-zinc-600 uppercase mb-2">Stock</p><p className="text-zinc-300">{selectedBook.availableCopies} available of {selectedBook.totalCopies}</p></div>
                            </div>
                            <button
                                onClick={() => { selectedBook.availableCopies === 0 ? handleNotify(selectedBook.title) : onBorrow(selectedBook.id); setSelectedBook(null); }}
                                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${selectedBook.availableCopies === 0 ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20'}`}
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
