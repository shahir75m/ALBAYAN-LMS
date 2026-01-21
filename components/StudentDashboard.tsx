
import React, { useState } from 'react';
import { Book, User, BorrowRequest, HistoryRecord, Fine } from '../types';

interface StudentDashboardProps {
  activeTab: string;
  books: Book[];
  requests: BorrowRequest[];
  history: HistoryRecord[];
  fines: Fine[];
  currentUser: User;
  onBorrow: (bookId: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  activeTab, books, requests, history, fines, currentUser, onBorrow
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredBooks = books.filter(b =>
    (filter === 'All' || b.category === filter) &&
    (b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))
  );

  const categories = ['All', ...Array.from(new Set(books.map(b => b.category)))];

  const myHistory = history.filter(h => h.userId === currentUser.id);
  const myRequests = requests.filter(r => r.userId === currentUser.id);
  const myActiveBorrows = history.filter(h => h.userId === currentUser.id && !h.returnDate);
  const myFines = fines.filter(f => f.userId === currentUser.id);
  const myPendingFines = myFines.filter(f => f.status === 'PENDING');

  const handleNotify = (title: string) => {
    alert(`Priority Notification Set: You will be alerted via dashboard when "${title}" returns to circulation.`);
  };

  if (activeTab === 'dashboard') {
    return (
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
                    <div key={h.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl flex gap-6 hover:border-emerald-500/40 transition-all shadow-xl group">
                      <div className="w-24 h-32 bg-zinc-900 rounded-2xl overflow-hidden shrink-0 shadow-2xl">
                        <img src={book?.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={h.bookTitle} />
                      </div>
                      <div className="flex flex-col py-2">
                        <h4 className="font-bold text-zinc-100 text-base leading-snug line-clamp-2">{h.bookTitle}</h4>
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
    );
  }

  if (activeTab === 'catalog') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row gap-4 items-center">
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
          <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto no-scrollbar">
            {categories.map(c => (
              <button
                key={c} onClick={() => setFilter(c)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${filter === c
                  ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-[#0c0c0e] text-zinc-500 hover:text-zinc-300 border-zinc-900'
                  }`}
              >
                {c}
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

            return (
              <div key={book.id} className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden flex flex-col group hover:border-zinc-800 transition-all shadow-sm active:scale-[0.99]">
                <div className="aspect-[3/4] relative overflow-hidden bg-zinc-900 border-b border-zinc-900/50">
                  <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={book.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-semibold text-white/90 bg-[#09090b]/80 px-2.5 py-1 rounded-lg border border-white/5 backdrop-blur-md shadow-sm">
                      {book.category}
                    </span>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5">
                    <h4 className="font-semibold text-white text-base leading-tight line-clamp-2">{book.title}</h4>
                    <p className="text-zinc-400 text-[11px] mt-1.5 truncate">by {book.author}</p>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[10px] text-zinc-600 font-medium mb-1">Status</p>
                      {isTaken ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-red-500/80 rounded-full" />
                          <p className="text-[11px] text-zinc-500 truncate max-w-[100px]">{borrower.userName}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                          <p className="text-[11px] text-emerald-500/90 font-medium">Available</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-600 font-medium mb-1">Stock</p>
                      <p className="text-[11px] text-zinc-400 font-medium">{book.availableCopies} / {book.totalCopies}</p>
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
                        onClick={() => isTaken ? handleNotify(book.title) : onBorrow(book.id)}
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
    );
  }

  if (activeTab === 'my-requests') {
    return (
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
    );
  }

  return null;
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
