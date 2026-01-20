
import React, { useState, useMemo, useRef } from 'react';
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
          <h2 className="text-xl font-black text-zinc-400 uppercase tracking-widest">Library Overview</h2>
          <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-2xl border border-zinc-800 shadow-2xl">
            <span className="text-[10px] font-black text-zinc-600 px-3 uppercase">Range</span>
            <input 
              type="date" value={dateRange.start} 
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="bg-zinc-800 border-none rounded-xl text-xs text-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-zinc-700 text-xs">→</span>
            <input 
              type="date" value={dateRange.end} 
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="bg-zinc-800 border-none rounded-xl text-xs text-white px-3 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard title="Total Volume" value={totalBooks} icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" color="emerald" />
          <StatCard title="Books Issued" value={issuedBooksCount} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="blue" />
          <StatCard title="New Requests" value={pendingRequestsCount} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
          <StatCard title="Star Reader" value={topReader.name} subtitle={`${topReader.count} books in range`} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h3 className="font-black text-sm uppercase tracking-widest text-zinc-200 flex items-center gap-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Borrow Queue
              </h3>
            </div>
            <div className="divide-y divide-zinc-800 max-h-[400px] overflow-y-auto">
              {requests.filter(r => r.status === 'PENDING').map(req => (
                <div key={req.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="font-bold text-zinc-100">{req.userName}</p>
                    <p className="text-xs text-zinc-500 mt-1">Requested: <span className="text-zinc-300 font-medium italic">{req.bookTitle}</span></p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => onHandleRequest(req.id, 'APPROVE')}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[10px] font-black uppercase text-white transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => onHandleRequest(req.id, 'DENY')}
                      className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
              {requests.filter(r => r.status === 'PENDING').length === 0 && (
                <div className="p-20 text-center text-zinc-600 italic text-sm font-medium">No pending requests</div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
             <div className="px-8 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest text-zinc-200 flex items-center gap-3 shrink-0">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Returns
              </h3>
              <div className="relative w-48 ml-4">
                <input 
                  type="text" 
                  placeholder="Find book/user..."
                  value={returnSearch}
                  onChange={(e) => setReturnSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-1.5 text-[10px] text-zinc-300 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                />
              </div>
            </div>
            <div className="divide-y divide-zinc-800 max-h-[400px] overflow-y-auto">
              {activeCirculation.map(h => (
                <div key={h.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="overflow-hidden pr-4">
                    <p className="font-bold text-zinc-100 truncate">{h.bookTitle}</p>
                    <p className="text-xs text-zinc-500 mt-1">Holder: <span className="text-zinc-300">{h.userName}</span></p>
                  </div>
                  <button 
                    onClick={() => onReturnBook(h.bookId, h.userId)}
                    className="shrink-0 px-4 py-2 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
                  >
                    Return
                  </button>
                </div>
              ))}
              {activeCirculation.length === 0 && (
                <div className="p-20 text-center text-zinc-600 italic text-sm font-medium">
                  {returnSearch ? 'No matching circulation found' : 'All books are in stock'}
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex gap-3 items-center w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" placeholder="Search ID, ISBN, Title..." 
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-6 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none w-full shadow-2xl"
              />
            </div>
            <select 
              value={filter} onChange={(e) => setFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-zinc-300 shadow-2xl"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <input 
              type="file" 
              ref={importBooksInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleBulkBookImport} 
            />
            <button 
              onClick={() => importBooksInputRef.current?.click()}
              className="w-full md:w-auto border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-widest py-3 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import CSV
            </button>
            <button 
              onClick={() => { setEditingBook(null); setShowBookForm(true); }}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest py-3 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-emerald-900/40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              Add Book
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredBooks.map(book => (
            <div key={book.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-emerald-500/40 transition-all hover:shadow-2xl hover:shadow-emerald-500/10">
              <div className="flex h-52">
                <div className="w-2/5 overflow-hidden bg-zinc-800">
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="w-3/5 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] uppercase font-black tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{book.category}</span>
                    <p className="text-[10px] text-zinc-600 font-mono">#{book.id}</p>
                  </div>
                  <h4 className="font-bold text-white text-lg leading-tight line-clamp-2 group-hover:text-emerald-400 transition-colors">{book.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1 font-medium italic line-clamp-1">by {book.author}</p>
                  <p className="text-[10px] text-emerald-500/80 font-bold mt-1">${book.price?.toFixed(2) || '0.00'}</p>
                  
                  <div className="mt-auto pt-5 flex justify-between items-end border-t border-zinc-800/50">
                    <div>
                      <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Available</p>
                      <p className={`text-sm font-black mt-1 ${book.availableCopies === 0 ? 'text-red-500' : 'text-zinc-100'}`}>
                        {book.availableCopies} <span className="text-zinc-600 font-normal">/ {book.totalCopies}</span>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingBook(book); setShowBookForm(true); }} className="p-2.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={() => { if(confirm('Permanently delete book?')) onDeleteBook(book.id) }} className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="p-8 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
            <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400">Library Ledger</h3>
            {activeTab === 'users' && (
               <div className="flex gap-3">
                 <input 
                    type="file" 
                    ref={importUsersInputRef} 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleBulkUserImport} 
                  />
                  <button 
                    onClick={() => importUsersInputRef.current?.click()}
                    className="border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-black uppercase text-[9px] tracking-widest py-2 px-6 rounded-xl transition-all flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Bulk Import
                  </button>
                  <button onClick={() => { setEditingUser(null); setShowUserForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[9px] tracking-widest py-2 px-6 rounded-xl transition-all">Add User</button>
               </div>
            )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            {activeTab === 'users' && (
              <>
                <thead className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-600 uppercase text-[9px] font-black tracking-widest">
                  <tr><th className="px-8 py-5">Profile</th><th className="px-8 py-5">ID</th><th className="px-8 py-5">Name</th><th className="px-8 py-5">Role</th><th className="px-8 py-5">Class/Dept</th><th className="px-8 py-5 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="px-8 py-5">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center text-[10px] font-black">
                          {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                        </div>
                      </td>
                      <td className="px-8 py-5 font-mono text-zinc-600">{user.id}</td>
                      <td className="px-8 py-5 font-bold text-zinc-200">{user.name}</td>
                      <td className="px-8 py-5"><span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{user.role}</span></td>
                      <td className="px-8 py-5 text-zinc-500 italic">{user.class || '---'}</td>
                      <td className="px-8 py-5 text-right flex justify-end gap-2">
                        <button onClick={() => { setEditingUser(user); setShowUserForm(true); }} className="p-2 text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => { if(confirm('Remove user access?')) onDeleteUser(user.id) }} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {activeTab === 'requests' && (
              <>
                <thead className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-600 uppercase text-[9px] font-black tracking-widest">
                  <tr><th className="px-8 py-5">Date</th><th className="px-8 py-5">User</th><th className="px-8 py-5">Book</th><th className="px-8 py-5">Status</th><th className="px-8 py-5 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="px-8 py-5 text-zinc-600 font-mono text-[10px]">{new Date(req.timestamp).toLocaleString()}</td>
                      <td className="px-8 py-5 font-bold text-zinc-200">{req.userName}</td>
                      <td className="px-8 py-5 text-zinc-400 italic font-medium">{req.bookTitle}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${
                          req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>{req.status}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {req.status === 'PENDING' && (
                          <div className="flex justify-end gap-2"><button onClick={() => onHandleRequest(req.id, 'APPROVE')} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[9px] font-black uppercase text-white shadow-lg active:scale-95">Approve</button><button onClick={() => onHandleRequest(req.id, 'DENY')} className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[9px] font-black uppercase active:scale-95">Deny</button></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {activeTab === 'history' && (
              <>
                <thead className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-600 uppercase text-[9px] font-black tracking-widest">
                  <tr><th className="px-8 py-5">Borrowed</th><th className="px-8 py-5">User</th><th className="px-8 py-5">Book</th><th className="px-8 py-5">Returned</th><th className="px-8 py-5">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {history.map(record => (
                    <tr key={record.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="px-8 py-5 text-zinc-600 font-mono text-[10px]">{new Date(record.borrowDate).toLocaleString()}</td>
                      <td className="px-8 py-5 font-bold text-zinc-200">{record.userName}</td>
                      <td className="px-8 py-5 text-zinc-400 italic">{record.bookTitle}</td>
                      <td className="px-8 py-5 text-zinc-600 font-mono text-[10px]">{record.returnDate ? new Date(record.returnDate).toLocaleString() : '---'}</td>
                      <td className="px-8 py-5"><span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${record.returnDate ? 'bg-zinc-800 text-zinc-600 border-zinc-700' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>{record.returnDate ? 'CLOSED' : 'OPEN'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
        {showUserForm && <UserForm onClose={() => setShowUserForm(false)} onSubmit={(u) => { editingUser ? onUpdateUser(u) : onAddUser(u); setShowUserForm(false); }} initialData={editingUser} />}
      </div>
    );
  }

  return null;
};

const StatCard = ({ title, value, subtitle, icon, color }: any) => {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl transition-all hover:-translate-y-1 hover:shadow-emerald-500/5">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl border ${colorClasses[color]} shadow-2xl`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{title}</p>
        <p className="text-3xl font-black text-white mt-2 leading-none">{value}</p>
        {subtitle && <p className="text-[10px] text-zinc-600 mt-3 font-bold uppercase tracking-tight">{subtitle}</p>}
      </div>
    </div>
  );
};

export default AdminDashboard;
