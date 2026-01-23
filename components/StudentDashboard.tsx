
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
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCompact title="Active Holds" value={myActiveBorrows.length} color="emerald" />
            <StatCompact title="Queue Position" value={myRequests.filter(r => r.status === 'PENDING').length} color="amber" />
            <StatCompact title="Active Fines" value={myPendingFines.length} color="red" />
            <StatCompact title="Lifetime Reads" value={myHistory.filter(h => h.returnDate).length} color="blue" />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="px-10 py-8 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Books In Your Care
              </h3>
            </div>
            <div className="p-10">
              {myActiveBorrows.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {myActiveBorrows.map(h => {
                    const book = books.find(b => b.id === h.bookId);
                    return (
                      <div key={h.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl flex gap-6 hover:border-emerald-500/40 transition-all shadow-xl group cursor-pointer" onClick={() => book && setSelectedBook(book)}>
                        <div className="w-24 h-32 bg-zinc-900 rounded-2xl overflow-hidden shrink-0 shadow-2xl">
                          <img src={book?.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={h.bookTitle} />
                        </div>
                        <div className="flex flex-col py-2">
                          <h4 className="font-bold text-zinc-100 text-base leading-snug">{h.bookTitle}</h4>
                          <p className="text-[10px] text-zinc-600 mt-2 font-black uppercase tracking-widest">Borrowed: {new Date(h.borrowDate).toLocaleDateString()}</p>
                          <div className="mt-auto">
                            <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">Standard Period</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-24 text-center">
                  <div className="w-20 h-20 bg-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-zinc-600"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg></div>
                  <p className="text-zinc-500 font-medium text-lg italic">Your library bag is empty.</p>
                  <p className="text-zinc-700 text-sm mt-2 not-italic">Browse the catalog to add books to your reading list.</p>
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
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto no-scrollbar">
              {categories.map(c => (
                <button
                  key={c.name} onClick={() => setFilter(c.name)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border whitespace-nowrap flex items-center gap-2 ${filter === c.name
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => {
              const isTaken = book.availableCopies === 0;
              const borrower = book.currentBorrowers[0];
              const hasRequested = requests.some(r => r.userId === currentUser.id && r.bookId === book.id && r.status === 'PENDING');
              const isBorrowing = book.currentBorrowers.some(cb => cb.userId === currentUser.id);
              const availabilityPercent = (book.availableCopies / book.totalCopies) * 100;

              return (
                <div key={book.id} className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden flex flex-col group hover:border-zinc-800 transition-all shadow-sm active:scale-[0.99] cursor-pointer" onClick={() => setSelectedBook(book)}>
                  <div className="aspect-[3/4] relative overflow-hidden bg-zinc-900 border-b border-zinc-900/50">
                    <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={book.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                    <div className="absolute top-4 left-4">
                      <span className="text-[10px] font-semibold text-white/90 bg-[#09090b]/80 px-2.5 py-1 rounded-lg border border-white/5 backdrop-blur-md shadow-sm">
                        {book.category}
                      </span>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      <h4 className="font-semibold text-white text-base leading-tight">{highlightText(book.title, search)}</h4>
                      <p className="text-zinc-400 text-[11px] mt-1.5 truncate">by {highlightText(book.author, search)}</p>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-zinc-600 font-medium">Availability</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{book.availableCopies} / {book.totalCopies}</p>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${availabilityPercent === 0 ? 'bg-red-500' : availabilityPercent <= 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${availabilityPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-auto">
                      {isBorrowing ? (
                        <div className="w-full py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium rounded-xl flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          In Your Care
                        </div>
                      ) : hasRequested ? (
                        <div className="w-full py-2.5 bg-amber-500/5 text-amber-500 text-xs font-medium rounded-xl flex items-center justify-center gap-2 border border-amber-500/10 transition-all">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                          Requested
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            isTaken ? handleNotify(book.title) : onBorrow(book.id);
                          }}
                          className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isTaken
                            ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 shadow-sm'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/10'
                            }`}
                        >
                          {isTaken ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                              Notify Me
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                              Borrow Book
                            </>
                          )}
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
        <div className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-700">
          <div className="p-6 border-b border-zinc-900 bg-zinc-900/20">
            <h3 className="font-semibold text-xs text-zinc-400">Request History</h3>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#09090b] border-b border-zinc-900 text-zinc-500 text-[10px] font-medium tracking-wide">
                  <th className="px-6 py-4">Date Requested</th>
                  <th className="px-6 py-4">Resource Title</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {myRequests.map(req => (
                  <tr key={req.id} className="hover:bg-zinc-900/30 transition-all">
                    <td className="px-6 py-4 text-zinc-600 text-[11px]">{new Date(req.timestamp).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-white/90">{req.bookTitle}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${req.status === 'PENDING' ? 'bg-amber-500/5 text-amber-500 border-amber-500/10' :
                        req.status === 'APPROVED' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' :
                          'bg-red-500/5 text-red-500 border-red-500/10'
                        }`}>{req.status}</span>
                    </td>
                  </tr>
                ))}
                {myRequests.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-16 text-center text-zinc-600 text-xs italic">No requests found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'my-fines' && (
        <div className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-700">
          <div className="p-6 border-b border-zinc-900 bg-zinc-900/20">
            <h3 className="font-semibold text-xs text-zinc-400 uppercase tracking-widest">Your Outstanding & Past Fines</h3>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#09090b] border-b border-zinc-900 text-zinc-500 text-[10px] font-medium tracking-wide">
                  <th className="px-6 py-4">Date Issued</th>
                  <th className="px-6 py-4">Book Title</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {myFines.map(fine => (
                  <tr key={fine.id} className="hover:bg-zinc-900/30 transition-all">
                    <td className="px-6 py-4 text-zinc-600 text-[11px]">{new Date(fine.timestamp).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-white/90">{fine.bookTitle}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{fine.reason}</td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-500 font-bold">₹{fine.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${fine.status === 'PAID' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' : 'bg-red-500/5 text-red-500 border-red-500/10'}`}>
                        {fine.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {myFines.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-zinc-600 text-xs italic">You have no recorded fines. Happy reading!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setSelectedBook(null)}></div>
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-3xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row">
            <div className="w-full md:w-2/5 aspect-[3/4] md:aspect-auto relative overflow-hidden bg-zinc-900">
              <img src={selectedBook.coverUrl} className="w-full h-full object-cover" alt={selectedBook.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
            </div>
            <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col h-full overflow-y-auto no-scrollbar">
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute top-8 right-8 p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all text-zinc-500 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="mb-8">
                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 mb-4">
                  {selectedBook.category}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2 tracking-tighter uppercase">{selectedBook.title}</h2>
                <p className="text-zinc-500 text-lg font-medium">by {selectedBook.author}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Identification</label>
                  <p className="text-sm text-zinc-300 font-mono">ISBN: {selectedBook.isbn}</p>
                  <p className="text-sm text-zinc-300 mt-1">Ref ID: #{selectedBook.id}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Publication</label>
                  <p className="text-sm text-zinc-300">Edition Year: {selectedBook.year}</p>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-900 p-6 rounded-3xl mb-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Stock Level</p>
                    <p className="text-2xl font-black text-white">{selectedBook.availableCopies} of {selectedBook.totalCopies}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedBook.availableCopies > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                      {selectedBook.availableCopies > 0 ? 'Ready to Borrow' : 'All copies out'}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${(selectedBook.availableCopies / selectedBook.totalCopies) * 100 === 0 ? 'bg-red-500' : (selectedBook.availableCopies / selectedBook.totalCopies) * 100 <= 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(selectedBook.availableCopies / selectedBook.totalCopies) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-auto flex gap-4 pt-8 border-t border-zinc-900">
                {selectedBook.currentBorrowers.some(cb => cb.userId === currentUser.id) ? (
                  <div className="flex-1 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Currently In Your Care
                  </div>
                ) : requests.some(r => r.userId === currentUser.id && r.bookId === selectedBook.id && r.status === 'PENDING') ? (
                  <div className="flex-1 py-4 bg-amber-500/5 text-amber-500 text-sm font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 border border-amber-500/10">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    Pending Request
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      selectedBook.availableCopies === 0 ? handleNotify(selectedBook.title) : onBorrow(selectedBook.id);
                      setSelectedBook(null);
                    }}
                    className={`flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${selectedBook.availableCopies === 0
                      ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/20'
                      }`}
                  >
                    {selectedBook.availableCopies === 0 ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        Notify Availability
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Borrow This Book
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCompact = ({ title, value, color }: any) => {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
    amber: 'text-amber-500 bg-amber-500/5 border-amber-500/10',
    red: 'text-red-500 bg-red-500/5 border-red-500/10',
    blue: 'text-blue-500 bg-blue-500/5 border-blue-500/10',
  };
  return (
    <div className="bg-[#0c0c0e] border border-zinc-900 p-6 rounded-2xl shadow-sm transition-all hover:border-zinc-800">
      <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-semibold text-white/90 leading-none">{value}</p>
        <div className={`w-1.5 h-1.5 rounded-full ${colorMap[color].split(' ')[0]} shadow-[0_0_8px_currentColor] opacity-50`}></div>
      </div>
    </div>
  );
};

export default StudentDashboard;
