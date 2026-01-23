
import React, { useState, useMemo } from 'react';
import { Book, User, BorrowRequest, HistoryRecord, Fine } from '../types';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';

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
  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();

  // Reading Goals State
  const [goalCount, setGoalCount] = useState(() => Number(localStorage.getItem(`goal_${currentUser.id}`) || 5));

  const handleSetGoal = (val: number) => {
    setGoalCount(val);
    localStorage.setItem(`goal_${currentUser.id}`, val.toString());
  };

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

  // Multi-user Stats (for Leaderboard)
  const leaderboard = useMemo(() => {
    const userStats: Record<string, { id: string, name: string, points: number, books: number }> = {};

    history.forEach(h => {
      if (!userStats[h.userId]) {
        userStats[h.userId] = { id: h.userId, name: h.userName, points: 0, books: 0 };
      }
      if (h.returnDate) {
        userStats[h.userId].points += 10;
        userStats[h.userId].books += 1;
      } else {
        userStats[h.userId].points += 5;
      }
    });

    return Object.values(userStats).sort((a, b) => b.points - a.points).slice(0, 5);
  }, [history]);

  const myStats = leaderboard.find(u => u.id === currentUser.id) || { points: 0, books: 0 };
  const readingProgress = Math.min((myStats.books / goalCount) * 100, 100);

  const badges = [
    { id: 'newbie', label: 'Newbie', icon: '🌱', threshold: 0 },
    { id: 'scholar', label: 'Scholar', icon: '📜', threshold: 50 },
    { id: 'sage', label: 'Sage', icon: '🦁', threshold: 200 },
    { id: 'legend', label: 'Library Legend', icon: '👑', threshold: 500 },
  ].filter(b => myStats.points >= b.threshold).reverse();

  const statusMsg = globalStatus.msg;
  const setStatusMsg = globalStatus.set;

  const handleNotify = (title: string) => {
    setStatusMsg(`Priority Notification Set: You will be alerted when "${title}" returns.`);
  };

  return (
    <div className={`relative ${isRTL ? 'text-right font-arabic' : 'text-left'}`}>
      {/* Global Status Message Banner */}
      {statusMsg && (
        <div className={`sticky top-4 z-[60] mb-8 px-8 py-5 rounded-[2.5rem] border backdrop-blur-md shadow-xl animate-in fade-in duration-500 flex items-center justify-between gap-4 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'} ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`w-3 h-3 rounded-full ${statusMsg.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse`}></div>
            <span className="text-xs font-black uppercase tracking-[0.2em]">{statusMsg.text}</span>
          </div>
          <button onClick={() => globalStatus.set('')} className="p-1 hover:bg-white/5 rounded-full transition-colors">
            <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <StatCompact title={t('active_fines')} value={myPendingFines.length} color="red" />
            <StatCompact title={t('lifetime_reads')} value={myHistory.filter(h => h.returnDate).length} color="blue" />
            <StatCompact title={t('points')} value={myStats.points} color="emerald" />
            <StatCompact title={t('goals')} value={`${myStats.books}/${goalCount}`} color="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[var(--bg-card)] border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className={`px-10 py-8 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h3 className={`font-black text-xs uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    {t('books_in_care')}
                  </h3>
                </div>
                <div className="p-10">
                  {myActiveBorrows.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {myActiveBorrows.map(h => {
                        const book = books.find(b => b.id === h.bookId);
                        return (
                          <div key={h.id} className={`bg-zinc-950 border border-zinc-900 p-6 rounded-3xl flex gap-6 hover:border-emerald-500/40 transition-all shadow-xl group cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => book && setSelectedBook(book)}>
                            <div className="w-24 h-32 bg-zinc-900 rounded-2xl overflow-hidden shrink-0 shadow-2xl">
                              <img src={book?.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={h.bookTitle} />
                            </div>
                            <div className={`flex flex-col py-2 ${isRTL ? 'text-right' : ''}`}>
                              <h4 className="font-bold text-zinc-100 text-base leading-snug">{h.bookTitle}</h4>
                              <p className="text-[10px] text-zinc-600 mt-2 font-black uppercase tracking-widest">{t('requested')}: {new Date(h.borrowDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-24 text-center">
                      <p className="text-zinc-500 font-medium text-lg italic">{t('search_placeholder')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-[var(--bg-card)] border border-zinc-900 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-8">{t('leaderboard')}</h3>
                <div className="space-y-6">
                  {leaderboard.map((user, idx) => (
                    <div key={user.id} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                        <div className={isRTL ? 'text-right' : ''}>
                          <p className="text-sm font-bold text-white/90">{user.name}</p>
                          <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{user.points} {t('points')}</p>
                        </div>
                      </div>
                      {idx === 0 && <span className="text-lg">👑</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-zinc-900 rounded-[2.5rem] p-8 shadow-2xl">
                <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-500">{t('goals')}</h3>
                  <button onClick={() => handleSetGoal(goalCount + 1)} className="text-[10px] font-black text-emerald-500">+</button>
                </div>
                <div className="mb-4">
                  <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <p className="text-2xl font-black text-white">{readingProgress.toFixed(0)}%</p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase">{myStats.books} / {goalCount}</p>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000" style={{ width: `${readingProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className={`flex flex-col md:flex-row gap-4 items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex flex-col md:flex-row gap-4 items-center flex-1 w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="relative w-full md:w-80">
                <input
                  type="text" placeholder={t('search_placeholder')}
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className={`bg-[#0c0c0e] border border-zinc-900 rounded-xl px-10 py-2.5 text-sm text-white focus:border-zinc-700 outline-none w-full transition-all ${isRTL ? 'text-right' : ''}`}
                />
              </div>
              <select
                value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className={`bg-[#0c0c0e] border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-400 outline-none focus:border-zinc-700 appearance-none cursor-pointer ${isRTL ? 'text-right' : ''}`}
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="year">Newest</option>
              </select>
            </div>
            <div className={`flex gap-2 overflow-x-auto pb-2 w-full no-scrollbar ${isRTL ? 'flex-row-reverse' : ''}`}>
              {categories.map(c => (
                <button
                  key={c.name} onClick={() => setFilter(c.name)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border whitespace-nowrap flex items-center gap-2 shrink-0 ${filter === c.name ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 'bg-[#0c0c0e] text-zinc-500 border-zinc-900'}`}
                >
                  {c.name} <span className="text-[10px] opacity-60">{c.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => {
              const availabilityPercent = (book.availableCopies / book.totalCopies) * 100;
              const isTaken = book.availableCopies === 0;
              const isBorrowing = book.currentBorrowers.some(cb => cb.userId === currentUser.id);
              const hasRequested = requests.some(r => r.userId === currentUser.id && r.bookId === book.id && r.status === 'PENDING');

              return (
                <div key={book.id} className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden flex flex-col group hover:border-zinc-800 transition-all shadow-sm cursor-pointer" onClick={() => setSelectedBook(book)}>
                  <div className="aspect-[3/4] relative overflow-hidden bg-zinc-900">
                    <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={book.title} />
                    <div className={`absolute bottom-5 left-5 right-5 ${isRTL ? 'text-right' : ''}`}>
                      <h4 className="font-semibold text-white text-base leading-tight">{highlightText(book.title, search)}</h4>
                      <p className="text-zinc-400 text-[11px] mt-1.5 truncate">{book.author}</p>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-4">
                      <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <p className="text-[10px] text-zinc-600 font-medium">{t('availability')}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{book.availableCopies} / {book.totalCopies}</p>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className={`h-full ${isTaken ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${availabilityPercent}%` }} />
                      </div>
                    </div>
                    <div className="mt-auto">
                      <button
                        onClick={(e) => { e.stopPropagation(); isTaken ? handleNotify(book.title) : onBorrow(book.id); }}
                        className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all ${isTaken ? 'bg-zinc-900 text-zinc-400' : 'bg-emerald-600 text-white shadow-lg'}`}
                      >
                        {isBorrowing ? t('in_care') : hasRequested ? t('requested') : isTaken ? t('notify_me') : t('borrow_book')}
                      </button>
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
          <div className={`p-6 border-b border-zinc-900 bg-zinc-900/20 ${isRTL ? 'text-right' : ''}`}>
            <h3 className="font-semibold text-xs text-zinc-400">{t('requested')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${isRTL ? 'text-right' : ''}`}>
              <thead className="bg-[#09090b] border-b border-zinc-900 text-zinc-500 text-[10px] font-medium tracking-wide">
                <tr className={isRTL ? 'flex-row-reverse' : ''}>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {myRequests.map(req => (
                  <tr key={req.id} className="hover:bg-zinc-900/30 transition-all">
                    <td className="px-6 py-4 text-zinc-600 text-[11px]">{new Date(req.timestamp).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-white/90">{req.bookTitle}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${req.status === 'PENDING' ? 'text-amber-500' : req.status === 'APPROVED' ? 'text-emerald-400' : 'text-red-500'}`}>{req.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedBook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setSelectedBook(null)}></div>
          <div className={`relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-3xl flex flex-col md:flex-row ${isRTL ? 'md:flex-row-reverse text-right' : ''}`}>
            <div className="w-full md:w-2/5 aspect-[3/4] bg-zinc-900">
              <img src={selectedBook.coverUrl} className="w-full h-full object-cover" alt={selectedBook.title} />
            </div>
            <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col">
              <h2 className="text-3xl font-black text-white leading-tight mb-2 uppercase">{selectedBook.title}</h2>
              <p className="text-zinc-500 text-lg mb-8">{selectedBook.author}</p>
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <label className="block text-[10px] font-black text-zinc-600 uppercase mb-2">Ref ID</label>
                  <p className="text-sm text-zinc-300 font-mono">#{selectedBook.id}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-600 uppercase mb-2">Category</label>
                  <p className="text-sm text-zinc-300">{selectedBook.category}</p>
                </div>
              </div>
              <div className="mt-auto">
                <button
                  onClick={() => { onBorrow(selectedBook.id); setSelectedBook(null); }}
                  disabled={selectedBook.availableCopies === 0}
                  className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest ${selectedBook.availableCopies === 0 ? 'bg-zinc-800 text-zinc-600' : 'bg-emerald-600 text-white shadow-xl'}`}
                >
                  {selectedBook.availableCopies === 0 ? t('notify_me') : t('borrow_book')}
                </button>
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
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
  };
  return (
    <div className="bg-[#0c0c0e] border border-zinc-900 p-6 rounded-2xl shadow-sm transition-all hover:border-zinc-800">
      <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-semibold text-white/90 leading-none">{value}</p>
        <div className={`w-1.5 h-1.5 rounded-full ${colorMap[color]} shadow-[0_0_8px_currentColor] opacity-50`}></div>
      </div>
    </div>
  );
};

export default StudentDashboard;
