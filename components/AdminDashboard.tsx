
import React, { useState, useMemo, useRef } from 'react';
// Retrieve stored admin password or default
const storedAdminPass = typeof window !== 'undefined' ? localStorage.getItem('adminPassword') || 'admin@484' : 'admin@484';
import { Book, User, BorrowRequest, HistoryRecord } from '../types';
import BookForm from './BookForm';
import UserForm from './UserForm';

interface AdminDashboardProps {
  activeTab: string;
  books: Book[];
  users: User[];
  requests: BorrowRequest[];
  history: HistoryRecord[];
  onAddBook: (b: Book) => void;
  onUpdateBook: (b: Book) => void;
  onDeleteBook: (id: string) => void;
  onAddUser: (u: User) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onHandleRequest: (id: string, action: 'APPROVE' | 'DENY') => void;
  onReturnBook: (bid: string, uid: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab, books, users, requests, history,
  onAddBook, onUpdateBook, onDeleteBook,
  onAddUser, onUpdateUser, onDeleteUser,
  onHandleRequest, onReturnBook
}) => {
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const importBooksInputRef = useRef<HTMLInputElement>(null);
  const importUsersInputRef = useRef<HTMLInputElement>(null);

  // Return Search state
  const [returnSearch, setReturnSearch] = useState('');

  // Password Change State
  const [showPassModal, setShowPassModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');

  // Analytics State
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const filteredBooks = books.filter(b =>
    (filter === 'All' || b.category === filter) &&
    (b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['All', ...Array.from(new Set(books.map(b => b.category)))];

  // Bulk Book Import Handler
  const handleBulkBookImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const bookData: any = {};

        headers.forEach((header, index) => {
          bookData[header] = values[index];
        });

        if (bookData.title && bookData.author) {
          const newBook: Book = {
            id: bookData.id || `B${Date.now()}${i}`,
            title: bookData.title,
            author: bookData.author,
            category: bookData.category || 'General',
            year: parseInt(bookData.year) || new Date().getFullYear(),
            isbn: bookData.isbn || '---',
            coverUrl: bookData.coverurl || 'https://picsum.photos/seed/book/400/600',
            price: parseFloat(bookData.price) || 0,
            totalCopies: parseInt(bookData.copies) || 1,
            availableCopies: parseInt(bookData.copies) || 1,
            currentBorrowers: []
          };
          onAddBook(newBook);
        }
      }
      alert('Books bulk import complete!');
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Bulk User Import Handler
  const handleBulkUserImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const userData: any = {};

        headers.forEach((header, index) => {
          userData[header] = values[index];
        });

        if (userData.name && userData.id) {
          const newUser: User = {
            id: userData.id,
            name: userData.name,
            role: (userData.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT'),
            class: userData.class || userData.department || '',
            avatarUrl: userData.avatarurl || ''
          };
          onAddUser(newUser);
        }
      }
      alert('Users bulk import complete!');
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Stats Logic
  const totalBooks = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const issuedBooksCount = history.filter(h => !h.returnDate).length;
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;

  const topReader = useMemo(() => {
    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).getTime() + 86400000;

    const rangeHistory = history.filter(h => h.borrowDate >= start && h.borrowDate <= end);
    const counts: Record<string, { count: number; name: string }> = {};

    rangeHistory.forEach(h => {
      counts[h.userId] = {
        count: (counts[h.userId]?.count || 0) + 1,
        name: h.userName
      };
    });

    return Object.values(counts).sort((a, b) => b.count - a.count)[0] || { name: 'N/A', count: 0 };
  }, [history, dateRange]);

  const activeCirculation = useMemo(() => {
    return history.filter(h => !h.returnDate && (
      h.bookTitle.toLowerCase().includes(returnSearch.toLowerCase()) ||
      h.userName.toLowerCase().includes(returnSearch.toLowerCase())
    ));
  }, [history, returnSearch]);

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-zinc-400 uppercase tracking-widest">Library Overview</h2>
            <button
              onClick={() => setShowPassModal(true)}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-zinc-500 hover:text-white"
              title="Change Admin Password"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-2xl border border-zinc-800 shadow-2xl">
            <span className="text-[10px] font-black text-zinc-600 px-3 uppercase">Range</span>
            <input
              type="date" value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-zinc-800 border-none rounded-xl text-xs text-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-zinc-700 text-xs">→</span>
            <input
              type="date" value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-zinc-800 border-none rounded-xl text-xs text-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Volume" value={totalBooks} icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" color="emerald" />
          <StatCard title="Books Issued" value={issuedBooksCount} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="blue" />
          <StatCard title="New Requests" value={pendingRequestsCount} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
          <StatCard title="Star Reader" value={topReader.name} subtitle={`${topReader.count} books in range`} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
              <h3 className="font-semibold text-xs text-zinc-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                Borrow Queue
              </h3>
            </div>
            <div className="divide-y divide-zinc-900 max-h-[400px] overflow-y-auto no-scrollbar">
              {requests.filter(r => r.status === 'PENDING').map(req => (
                <div key={req.id} className="p-5 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white/90">{req.userName}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Requested: <span className="text-zinc-400">{req.bookTitle}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onHandleRequest(req.id, 'APPROVE')}
                      className="px-4 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 rounded-lg text-xs font-medium text-white transition-all active:scale-95"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onHandleRequest(req.id, 'DENY')}
                      className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs font-medium transition-all active:scale-95"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
              {requests.filter(r => r.status === 'PENDING').length === 0 && (
                <div className="p-16 text-center text-zinc-600 text-xs italic font-medium">No pending requests</div>
              )}
            </div>
          </div>

          <div className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between">
              <h3 className="font-semibold text-xs text-zinc-300 flex items-center gap-2 shrink-0">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Returns
              </h3>
              <div className="relative w-40 ml-4">
                <input
                  type="text"
                  placeholder="Find book/user..."
                  value={returnSearch}
                  onChange={(e) => setReturnSearch(e.target.value)}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-1 text-[10px] text-zinc-400 focus:border-zinc-700 outline-none transition-all"
                />
              </div>
            </div>
            <div className="divide-y divide-zinc-900 max-h-[400px] overflow-y-auto no-scrollbar">
              {activeCirculation.map(h => (
                <div key={h.id} className="p-5 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
                  <div className="overflow-hidden pr-4">
                    <p className="text-sm font-medium text-white/90 truncate">{h.bookTitle}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Holder: <span className="text-zinc-400">{h.userName}</span></p>
                  </div>
                  <button
                    onClick={() => onReturnBook(h.bookId, h.userId)}
                    className="shrink-0 px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 rounded-lg text-xs font-medium transition-all active:scale-95"
                  >
                    Return
                  </button>
                </div>
              ))}
              {activeCirculation.length === 0 && (
                <div className="p-16 text-center text-zinc-600 text-xs italic font-medium">
                  {returnSearch ? 'No matching circulation' : 'All books are in stock'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter & Search Views
  if (activeTab === 'books') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 items-center w-full md:w-auto flex-1">
            <div className="relative w-full md:w-80 lg:w-[28rem]">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" placeholder="Search title, author or ISBN..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-[#0c0c0e] border border-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/90 focus:border-zinc-700 outline-none w-full transition-all"
              />
            </div>
            <select
              value={filter} onChange={(e) => setFilter(e.target.value)}
              className="bg-[#0c0c0e] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none text-zinc-400 transition-all cursor-pointer"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="file"
              ref={importBooksInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleBulkBookImport}
            />
            <button
              onClick={() => importBooksInputRef.current?.click()}
              className="flex-1 md:flex-initial border border-zinc-900 hover:border-zinc-800 text-zinc-400 font-medium text-xs py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import
            </button>
            <button
              onClick={() => { setEditingBook(null); setShowBookForm(true); }}
              className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Book
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBooks.map(book => (
            <div key={book.id} className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden group hover:border-zinc-800 transition-all shadow-sm">
              <div className="flex h-48">
                <div className="w-[35%] overflow-hidden bg-zinc-900/50">
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="w-[65%] p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-semibold text-emerald-500/80 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">{book.category}</span>
                    <p className="text-[9px] text-zinc-700 font-medium">#{book.id}</p>
                  </div>
                  <h4 className="text-sm font-semibold text-white/90 leading-snug line-clamp-2">{book.title}</h4>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate">by {book.author}</p>

                  <div className="mt-auto pt-4 flex justify-between items-end border-t border-zinc-900/50">
                    <div>
                      <p className="text-[10px] text-zinc-600 font-medium">Availability</p>
                      <p className={`text-xs font-semibold mt-0.5 ${book.availableCopies === 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                        {book.availableCopies} <span className="text-zinc-600 font-normal">/ {book.totalCopies}</span>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingBook(book); setShowBookForm(true); }} className="p-2 text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-lg transition-all" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => { if (confirm('Delete book?')) onDeleteBook(book.id) }} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showBookForm && (
          <BookForm onClose={() => setShowBookForm(false)} onSubmit={(b) => { editingBook ? onUpdateBook(b) : onAddBook(b); setShowBookForm(false); }} initialData={editingBook} />
        )}
      </div>
    );
  }

  // Other tabs...
  if (activeTab === 'users' || activeTab === 'requests' || activeTab === 'history') {
    return (
      <div className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="p-6 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center">
          <h3 className="font-semibold text-xs text-zinc-400">Library Records</h3>
          {activeTab === 'users' && (
            <div className="flex gap-2">
              <input
                type="file"
                ref={importUsersInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleBulkUserImport}
              />
              <button
                onClick={() => importUsersInputRef.current?.click()}
                className="border border-zinc-900 hover:border-zinc-800 text-zinc-500 font-medium text-[10px] py-1.5 px-4 rounded-lg transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Import
              </button>
              <button onClick={() => { setEditingUser(null); setShowUserForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[10px] py-1.5 px-4 rounded-lg transition-all active:scale-[0.98]">Add User</button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm">
            {activeTab === 'users' && (
              <>
                <thead className="bg-[#09090b] border-b border-zinc-900 text-zinc-500 text-[10px] font-medium tracking-wide">
                  <tr><th className="px-6 py-4">Profile</th><th className="px-6 py-4">ID</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Class/Dept</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-zinc-900/20 transition-all group">
                      <td className="px-6 py-4">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center text-[10px] font-medium text-zinc-500">
                          {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-600">{user.id === storedAdminPass ? '••••••••' : user.id}</td>
                      <td className="px-6 py-4 font-medium text-white/90">{user.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${user.role === 'ADMIN' ? 'bg-purple-500/5 text-purple-400 border-purple-500/10' : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{user.class || '---'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingUser(user); setShowUserForm(true); }} className="p-2 text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-lg transition-all" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button onClick={() => { if (confirm('Remove user access?')) onDeleteUser(user.id) }} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {activeTab === 'requests' && (
              <>
                <thead className="bg-[#09090b] border-b border-zinc-900 text-zinc-500 text-[10px] font-medium tracking-wide">
                  <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Book</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-zinc-900/20 transition-all">
                      <td className="px-6 py-4 text-zinc-600 text-[11px]">{new Date(req.timestamp).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-white/90">{req.userName}</td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{req.bookTitle}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${req.status === 'PENDING' ? 'bg-amber-500/5 text-amber-500 border-amber-500/10' :
                          req.status === 'APPROVED' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' :
                            'bg-red-500/5 text-red-500 border-red-500/10'
                          }`}>{req.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => onHandleRequest(req.id, 'APPROVE')} className="px-3 py-1 bg-emerald-600/90 hover:bg-emerald-600 rounded-lg text-xs font-medium text-white transition-all active:scale-95">Approve</button>
                            <button onClick={() => onHandleRequest(req.id, 'DENY')} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs font-medium transition-all active:scale-95">Deny</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {activeTab === 'history' && (
              <>
                <thead className="bg-[#09090b] border-b border-zinc-900 text-zinc-500 text-[10px] font-medium tracking-wide">
                  <tr><th className="px-6 py-4">Borrowed</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Book</th><th className="px-6 py-4">Returned</th><th className="px-6 py-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {history.map(record => (
                    <tr key={record.id} className="hover:bg-zinc-900/20 transition-all">
                      <td className="px-6 py-4 text-zinc-600 text-[11px]">{new Date(record.borrowDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-white/90">{record.userName}</td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{record.bookTitle}</td>
                      <td className="px-6 py-4 text-zinc-600 text-[11px]">{record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '---'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${record.returnDate ? 'bg-zinc-800/30 text-zinc-600 border-zinc-800' : 'bg-blue-500/5 text-blue-500 border-blue-500/10'}`}>
                          {record.returnDate ? 'Returned' : 'In Use'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
        {showUserForm && <UserForm onClose={() => setShowUserForm(false)} onSubmit={(u) => { editingUser ? onUpdateUser(u) : onAddUser(u); setShowUserForm(false); }} initialData={editingUser} />}

        {/* Password Change Modal */}
        {showPassModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-white">Advanced Settings</h3>
                <button onClick={() => setShowPassModal(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-all text-zinc-500 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Current Master Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">New Master Password</label>
                  <input
                    type="password"
                    placeholder="Enter new master password"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-500"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                  <p className="text-[10px] text-zinc-600 mt-2 italic">This password will be required for the next admin login.</p>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button onClick={() => { setShowPassModal(false); setCurrentPass(''); setNewPass(''); }} className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-white transition-all">Cancel</button>
                  <button
                    onClick={() => {
                      if (currentPass !== storedAdminPass) {
                        alert('Incorrect current password!');
                        return;
                      }
                      if (!newPass.trim()) {
                        alert('New password cannot be empty!');
                        return;
                      }

                      localStorage.setItem('adminPassword', newPass.trim());
                      alert('Master Admin password updated successfully!');
                      setShowPassModal(false);
                      setCurrentPass('');
                      setNewPass('');
                      window.location.reload();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2 rounded-lg text-sm font-bold transition-all shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

const StatCard = ({ title, value, subtitle, icon, color }: any) => {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20',
    blue: 'text-blue-500 bg-blue-500/5 border-blue-500/20',
    amber: 'text-amber-500 bg-amber-500/5 border-amber-500/20',
    purple: 'text-purple-500 bg-purple-500/5 border-purple-500/20',
  };

  return (
    <div className="bg-[#0c0c0e] border border-zinc-900 p-6 rounded-2xl shadow-sm transition-all hover:border-zinc-800">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
          </svg>
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
