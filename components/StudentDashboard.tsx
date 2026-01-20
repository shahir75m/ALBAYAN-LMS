
import React, { useState } from 'react';
import { Book, User, BorrowRequest, HistoryRecord } from '../types';

interface StudentDashboardProps {
  activeTab: string;
  books: Book[];
  requests: BorrowRequest[];
  history: HistoryRecord[];
  currentUser: User;
  onBorrow: (bookId: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  activeTab, books, requests, history, currentUser, onBorrow 
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

  const handleNotify = (title: string) => {
    alert(`Priority Notification Set: You will be alerted via dashboard when "${title}" returns to circulation.`);
  };

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCompact title="Current Holds" value={myActiveBorrows.length} color="emerald" />
          <StatCompact title="Queue Position" value={myRequests.filter(r => r.status === 'PENDING').length} color="amber" />
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
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative w-full md:w-96">
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" placeholder="Search by title, author or ISBN..." 
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl pl-14 pr-8 py-4 text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none w-full shadow-2xl"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 w-full md:w-auto no-scrollbar mask-fade-right">
            {categories.map(c => (
              <button
                key={c} onClick={() => setFilter(c)}
                className={`px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  filter === c 
                    ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30 border-emerald-500' 
                    : 'bg-zinc-900 text-zinc-500 hover:text-zinc-200 border-zinc-800 hover:bg-zinc-800 shadow-xl'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {filteredBooks.map(book => {
            const isTaken = book.availableCopies === 0;
            const borrower = book.currentBorrowers[0];
            const hasRequested = requests.some(r => r.userId === currentUser.id && r.bookId === book.id && r.status === 'PENDING');
            const isBorrowing = book.currentBorrowers.some(cb => cb.userId === currentUser.id);

            return (
              <div key={book.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col hover:border-emerald-500/50 transition-all group hover:shadow-2xl hover:shadow-emerald-500/10 active:scale-[0.98]">
                <div className="aspect-[3/4] relative overflow-hidden bg-zinc-800">
                  <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt={book.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity"></div>
                  
                  <div className="absolute top-5 left-5">
                    <span className="text-[10px] uppercase font-black text-emerald-400 bg-zinc-950/80 px-3 py-1.5 rounded-2xl border border-emerald-500/20 backdrop-blur-md shadow-2xl tracking-tighter">
                      {book.category}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-6 left-6 right-6">
                    <h4 className="font-black text-white text-xl leading-tight line-clamp-2 drop-shadow-2xl">{book.title}</h4>
                    <p className="text-zinc-400 text-xs mt-2 font-bold italic opacity-80 group-hover:opacity-100 transition-opacity">{book.author}</p>
                    <p className="text-emerald-500 font-bold text-sm mt-1 opacity-90">${book.price?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
                
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.2em] mb-2">Availability</p>
                      {isTaken ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <p className="text-xs text-red-400 font-black truncate max-w-[120px]">Circulated: {borrower.userName}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          <p className="text-xs text-emerald-400 font-black uppercase tracking-tight">On Shelf</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.2em] mb-2">Stock</p>
                      <p className="text-xs text-zinc-300 font-black">{book.availableCopies} / {book.totalCopies}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    {isBorrowing ? (
                      <button disabled className="w-full py-4 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] flex items-center justify-center gap-3 border border-zinc-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        In Your Care
                      </button>
                    ) : hasRequested ? (
                      <button disabled className="w-full py-4 bg-amber-500/5 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] flex items-center justify-center gap-3 border border-amber-500/20">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                        Pending Review
                      </button>
                    ) : (
                      <button
                        onClick={() => isTaken ? handleNotify(book.title) : onBorrow(book.id)}
                        className={`w-full py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 ${
                          isTaken 
                            ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 shadow-black/40' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
                        }`}
                      >
                        {isTaken ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            Notify Me
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in duration-700">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-600 uppercase text-[10px] font-black tracking-[0.2em]">
              <th className="px-10 py-8">Timestamp</th>
              <th className="px-10 py-8">Resource Title</th>
              <th className="px-10 py-8">Current Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {myRequests.map(req => (
              <tr key={req.id} className="hover:bg-white/[0.01] transition-all">
                <td className="px-10 py-8 text-zinc-600 font-mono text-xs">{new Date(req.timestamp).toLocaleString()}</td>
                <td className="px-10 py-8 font-black text-zinc-200">{req.bookTitle}</td>
                <td className="px-10 py-8">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                    req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>{req.status}</span>
                </td>
              </tr>
            ))}
            {myRequests.length === 0 && (
              <tr><td colSpan={3} className="px-10 py-24 text-center text-zinc-600 italic font-medium">No active or historical requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};

const StatCompact = ({ title, value, color }: any) => {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/10',
    amber: 'text-amber-500 bg-amber-500/5 border-amber-500/20 shadow-amber-500/10',
    blue: 'text-blue-500 bg-blue-500/5 border-blue-500/20 shadow-blue-500/10',
  };
  return (
    <div className={`bg-zinc-900 border p-10 rounded-[2.5rem] shadow-2xl transition-all hover:-translate-y-1 ${colorMap[color]}`}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">{title}</h3>
      <p className="text-4xl font-black text-white leading-none">{value}</p>
    </div>
  );
};

export default StudentDashboard;
