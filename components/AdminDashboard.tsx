
import React, { useState, useMemo, useRef } from 'react';
import { Book, User, BorrowRequest, HistoryRecord, Fine } from '../types';
import BookForm from './BookForm';
import UserForm from './UserForm';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';

const storedAdminPass = typeof window !== 'undefined' ? localStorage.getItem('adminPassword') || 'admin@484' : 'admin@484';

interface AdminDashboardProps {
  activeTab: string;
  books: Book[];
  users: User[];
  requests: BorrowRequest[];
  history: HistoryRecord[];
  fines: Fine[];
  onAddBook: (b: Book) => void;
  onUpdateBook: (b: Book) => void;
  onDeleteBook: (id: string) => void;
  onBulkAddBooks: (books: Book[]) => Promise<void>;
  onAddUser: (u: User) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onBulkAddUsers: (users: User[]) => Promise<void>;
  onHandleRequest: (id: string, action: 'APPROVE' | 'DENY') => void;
  onReturnBook: (bid: string, uid: string, fine?: { amount: number, reason: string }) => void;
  onPayFine: (id: string) => void;
  globalStatus: { msg: { text: string, type: 'success' | 'error' } | null, set: (text: string, type?: 'success' | 'error') => void };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab, books, users, requests, history, fines,
  onAddBook, onUpdateBook, onDeleteBook, onBulkAddBooks,
  onAddUser, onUpdateUser, onDeleteUser, onBulkAddUsers,
  onHandleRequest, onReturnBook, onPayFine,
  globalStatus
}) => {
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const importBooksInputRef = useRef<HTMLInputElement>(null);
  const importUsersInputRef = useRef<HTMLInputElement>(null);
  const [returnSearch, setReturnSearch] = useState('');
  const [showPassModal, setShowPassModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);
  const [showFineModal, setShowFineModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<HistoryRecord | null>(null);
  const [fineAmount, setFineAmount] = useState<number>(0);
  const [fineReason, setFineReason] = useState<string>('');
  const [hasIssue, setHasIssue] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; }>({ show: false, title: '', message: '', onConfirm: () => { } });
  const [dateRange, setDateRange] = useState({ start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });

  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();

  const statusMsg = globalStatus.msg;
  const setStatusMsg = globalStatus.set;

  const filteredBooks = books.filter(b =>
    (filter === 'All' || b.category === filter) &&
    (b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredUsers = users.filter(u =>
    (filter === 'All' || u.role === filter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase()) ||
      u.class?.toLowerCase().includes(search.toLowerCase()))
  );

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });
    const uniqueCats = Array.from(new Set(books.map(b => b.category)));
    return [{ name: 'All', count: books.length }, ...uniqueCats.map(c => ({ name: c, count: counts[c] }))];
  }, [books]);

  const handleBulkBookImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) { setStatusMsg(t('error_csv_empty') || 'CSV file is empty!', 'error'); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const booksToImport: Book[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const bookData: any = {};
        headers.forEach((h, idx) => { bookData[h] = values[idx]; });
        if (bookData.title) {
          booksToImport.push({
            id: bookData.id || `B${Date.now()}-${i}`,
            title: bookData.title,
            author: bookData.author || 'Unknown',
            category: bookData.category || 'General',
            year: parseInt(bookData.year) || new Date().getFullYear(),
            isbn: bookData.isbn || '---',
            coverUrl: bookData.coverUrl || 'https://picsum.photos/seed/book/400/600',
            price: parseFloat(bookData.price) || 0,
            totalCopies: parseInt(bookData.copies) || 1,
            availableCopies: parseInt(bookData.copies) || 1,
            currentBorrowers: []
          });
        }
      }
      if (booksToImport.length > 0) {
        await onBulkAddBooks(booksToImport);
        setStatusMsg(`${booksToImport.length} ${t('books_imported') || 'Books imported'}`);
      }
    };
    reader.readAsText(file);
  };

  const totalVolume = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const uniqueTitles = books.length;
  const issuedBooksCount = history.filter(h => !h.returnDate).length;
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;

  const activeCirculation = useMemo(() => {
    return history.filter(h => !h.returnDate && (
      h.bookTitle.toLowerCase().includes(returnSearch.toLowerCase()) ||
      h.userName.toLowerCase().includes(returnSearch.toLowerCase())
    ));
  }, [history, returnSearch]);

  return (
    <div className={`relative ${isRTL ? 'text-right font-arabic' : 'text-left'}`}>
      {statusMsg && (
        <div className={`sticky top-6 z-[12000] mb-10 px-10 py-6 rounded-[2.5rem] border backdrop-blur-xl shadow-2xl animate-in fade-in duration-700 flex items-center justify-between gap-6 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`w-3.5 h-3.5 rounded-full ${statusMsg.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse`}></div>
            <span className="text-sm font-black uppercase tracking-[0.25em]">{statusMsg.text}</span>
          </div>
          <button onClick={() => globalStatus.set('')} className="p-2 hover:bg-white/10 rounded-full transition-all opacity-40 hover:opacity-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {activeTab !== 'dashboard' && (
        <div className={`flex flex-col md:flex-row gap-4 items-center justify-between mb-8 pb-6 border-b border-zinc-900/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex gap-2 items-center w-full md:w-auto flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="relative w-full md:w-80 lg:w-[28rem]">
              <input
                type="text" placeholder={t('search_placeholder')}
                value={search} onChange={(e) => setSearch(e.target.value)}
                className={`bg-[#0c0c0e] border border-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/90 focus:border-zinc-700 outline-none w-full transition-all ${isRTL ? 'text-right' : ''}`}
              />
            </div>
            {activeTab === 'books' && (
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`bg-[#0c0c0e] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm text-zinc-400 outline-none ${isRTL ? 'text-right' : ''}`}>
                {categories.map(c => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
              </select>
            )}
          </div>
          <div className={`flex gap-2 w-full md:w-auto items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            {activeTab === 'books' && (
              <button onClick={() => { setEditingBook(null); setShowBookForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95">
                {t('add_book')}
              </button>
            )}
            {activeTab === 'users' && (
              <button onClick={() => { setEditingUser(null); setShowUserForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95">
                {t('add_user')}
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-10 animate-in fade-in duration-700">
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-xl font-black text-zinc-400 uppercase tracking-widest">{t('admin_overview')}</h2>
            <div className={`flex items-center gap-2 bg-zinc-900 p-2 rounded-2xl border border-zinc-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="bg-zinc-800 rounded-xl text-xs text-white px-3 py-1.5 outline-none" />
              <span className="text-zinc-700">→</span>
              <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="bg-zinc-800 rounded-xl text-xs text-white px-3 py-1.5 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title={t('total_books')} value={totalVolume} subtitle={`${uniqueTitles} ${t('unique_titles')}`} icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5" color="emerald" />
            <StatCard title={t('issued_books')} value={issuedBooksCount} icon="M8 7V3m8 4V3" color="blue" />
            <StatCard title={t('new_requests')} value={pendingRequestsCount} icon="M9 12l2 2 4-4" color="amber" />
            <StatCard title={t('active_fines')} value={fines.filter(f => f.status === 'PENDING').length} icon="M12 8c-1.657 0-3 1.343-3 3" color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[var(--bg-card)] border border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
              <div className={`px-6 py-4 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className={`font-semibold text-xs text-zinc-300 flex items-center gap-2 uppercase tracking-widest ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  {t('confirmations')}
                </h3>
              </div>
              <div className="divide-y divide-zinc-900 max-h-[400px] overflow-y-auto no-scrollbar">
                {requests.filter(r => r.status === 'PENDING').map(req => (
                  <div key={req.id} className={`p-5 flex items-center justify-between hover:bg-zinc-900/30 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-sm font-medium text-white/90">{req.userName}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{t('requested')}: <span className="text-zinc-400">{req.bookTitle}</span></p>
                    </div>
                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <button onClick={() => onHandleRequest(req.id, 'APPROVE')} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium active:scale-95">{t('approve')}</button>
                      <button onClick={() => onHandleRequest(req.id, 'DENY')} className="px-4 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-medium active:scale-95">{t('deny')}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
              <div className={`px-6 py-4 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className={`font-semibold text-xs text-zinc-300 flex items-center gap-2 shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  {t('returns')}
                </h3>
              </div>
              <div className="divide-y divide-zinc-900 max-h-[400px] overflow-y-auto no-scrollbar">
                {activeCirculation.map(h => (
                  <div key={h.id} className={`p-5 flex items-center justify-between hover:bg-zinc-900/30 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`overflow-hidden pr-4 ${isRTL ? 'text-right' : ''}`}>
                      <p className="text-sm font-medium text-white/90 truncate">{h.bookTitle}</p>
                      <p className="text-[11px] text-emerald-500 font-medium truncate">{h.userName}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedReturn(h); setShowFineModal(true); setHasIssue(false); setFineAmount(0); setFineReason(''); }}
                      className="shrink-0 px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-lg text-xs font-medium active:scale-95"
                    >
                      {t('returns')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'books' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredBooks.map(book => (
            <div key={book.id} className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden group hover:border-zinc-800 transition-all">
              <div className={`flex h-48 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-[35%] overflow-hidden bg-zinc-900/50">
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className={`w-[65%] p-5 flex flex-col ${isRTL ? 'text-right' : ''}`}>
                  <h4 className="text-sm font-semibold text-white/90 leading-snug">{book.title}</h4>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate">{book.author}</p>
                  <div className="mt-auto flex gap-2">
                    <button onClick={() => setSelectedBookDetail(book)} className="text-[10px] text-zinc-400 hover:text-white uppercase font-black">{t('details')}</button>
                    <button onClick={() => { setEditingBook(book); setShowBookForm(true); }} className="text-[10px] text-zinc-400 hover:text-emerald-500 uppercase font-black">{t('edit')}</button>
                    <button onClick={() => onDeleteBook(book.id)} className="text-[10px] text-zinc-400 hover:text-red-500 uppercase font-black">{t('delete')}</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${isRTL ? 'text-right' : ''}`}>
              <thead className="bg-[#09090b] border-b border-zinc-900 text-zinc-500 text-[10px] font-medium tracking-wide uppercase">
                <tr className={isRTL ? 'flex-row-reverse' : ''}>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">{t('details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-900/20 transition-all">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-600">{user.id}</td>
                    <td className="px-6 py-4 font-medium text-white/90">{user.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${user.role === 'ADMIN' ? 'bg-purple-500/5 text-purple-400' : 'bg-emerald-500/5 text-emerald-400'}`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setEditingUser(user); setShowUserForm(true); }} className="p-2 text-zinc-600 hover:text-white transition-all">{t('edit')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBookForm && (
        <BookForm
          onClose={() => setShowBookForm(false)}
          onSubmit={(b) => { editingBook ? onUpdateBook(b) : onAddBook(b); setShowBookForm(false); }}
          initialData={editingBook}
        />
      )}

      {showUserForm && (
        <UserForm
          onClose={() => setShowUserForm(false)}
          onSubmit={(u) => { editingUser ? onUpdateUser(u) : onAddUser(u); setShowUserForm(false); }}
          initialData={editingUser}
        />
      )}

      {showFineModal && selectedReturn && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 font-sans">
          <div className={`bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${isRTL ? 'text-right' : ''}`}>
            <div className="px-8 py-6 border-b border-zinc-800">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">{t('returns')}</h3>
              <p className="text-xs text-zinc-500 mt-1">{selectedReturn.bookTitle} - {selectedReturn.userName}</p>
            </div>
            <div className="p-8 space-y-6">
              <div className={`flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-bold text-zinc-300">Issues?</span>
                <button onClick={() => setHasIssue(!hasIssue)} className={`w-12 h-6 rounded-full transition-all relative ${hasIssue ? 'bg-red-600' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasIssue ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              {hasIssue && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <input type="number" value={fineAmount} onChange={(e) => setFineAmount(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="Amount" />
                  <textarea value={fineReason} onChange={(e) => setFineReason(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white h-24 resize-none" placeholder="Reason" />
                </div>
              )}
              <div className={`pt-4 flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button onClick={() => setShowFineModal(false)} className="flex-1 py-3 text-sm font-bold text-zinc-500 hover:text-white bg-zinc-800 rounded-xl">{t('cancel')}</button>
                <button onClick={() => { onReturnBook(selectedReturn.bookId, selectedReturn.userId, hasIssue ? { amount: fineAmount, reason: fineReason } : undefined); setShowFineModal(false); }} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg">{t('confirmations')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, color }: any) => {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/5',
    blue: 'text-blue-500 bg-blue-500/5',
    amber: 'text-amber-500 bg-amber-500/5',
    red: 'text-red-500 bg-red-500/5',
  };
  return (
    <div className="bg-[var(--bg-card)] border border-zinc-900 p-6 rounded-2xl shadow-sm transition-all hover:border-zinc-800">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl border border-zinc-800 ${colorClasses[color]}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} /></svg>
        </div>
        <div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-semibold text-white/90">{value}</p>
            {subtitle && <p className="text-[10px] text-zinc-600 font-medium truncate max-w-[80px]">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
