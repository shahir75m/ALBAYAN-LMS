import React, { useState, useMemo, useRef } from 'react';
import { Book, User, BorrowRequest, HistoryRecord, Fine } from '../types';
import BookForm from './BookForm';
import UserForm from './UserForm';
import AnalyticsDashboard from './AnalyticsDashboard';

// Retrieve stored admin password or default
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

    // Return Search state
    const [returnSearch, setReturnSearch] = useState('');

    // Password Change State
    const [showPassModal, setShowPassModal] = useState(false);
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');

    const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);

    // Fine Modal State
    const [showFineModal, setShowFineModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<HistoryRecord | null>(null);
    const [fineAmount, setFineAmount] = useState<number>(0);
    const [fineReason, setFineReason] = useState<string>('');
    const [hasIssue, setHasIssue] = useState<boolean>(false);

    // Custom Confirm Modal State
    const [confirmDialog, setConfirmDialog] = useState<{
        show: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Analytics State
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Inline Status Message logic moved to App.tsx (globalStatus)
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
        books.forEach(b => {
            counts[b.category] = (counts[b.category] || 0) + 1;
        });
        const uniqueCats = Array.from(new Set(books.map(b => b.category)));
        return [
            { name: 'All', count: books.length },
            ...uniqueCats.map(c => ({ name: c, count: counts[c] }))
        ];
    }, [books]);

    // Bulk Book Import Handler
    const handleBulkBookImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                setStatusMsg('CSV file is empty or missing data!', 'error');
                return;
            }

            const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^\w\s]/gi, ''));
            const headerMap: Record<string, string> = {
                'id': 'id', 'book id': 'id', 'title': 'title', 'book title': 'title', 'name': 'title',
                'author': 'author', 'writer': 'author', 'category': 'category', 'genre': 'category', 'type': 'category',
                'year': 'year', 'published': 'year', 'isbn': 'isbn', 'isbn number': 'isbn',
                'coverurl': 'coverUrl', 'cover url': 'coverUrl', 'cover': 'coverUrl', 'image': 'coverUrl',
                'price': 'price', 'cost': 'price', 'amount': 'price', 'copies': 'copies', 'total copies': 'copies', 'stock': 'copies', 'count': 'copies'
            };

            const headers = rawHeaders.map(h => headerMap[h] || h);
            const booksToImport: Book[] = [];

            const splitCsvLine = (line: string) => {
                const result = [];
                let cur = '';
                let inQuote = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') inQuote = !inQuote;
                    else if (char === ',' && !inQuote) {
                        result.push(cur.trim());
                        cur = '';
                    } else cur += char;
                }
                result.push(cur.trim());
                return result;
            };

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const values = splitCsvLine(line);
                const bookData: any = {};
                headers.forEach((header, index) => {
                    if (header) {
                        let val = values[index] || '';
                        if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
                        bookData[header] = val;
                    }
                });

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
                try {
                    await onBulkAddBooks(booksToImport);
                    setStatusMsg(`${booksToImport.length} Books bulk import complete!`);
                } catch (err: any) {
                    setStatusMsg(`Import failed: ${err.message}`, 'error');
                }
            } else setStatusMsg('No valid books found in CSV!', 'error');
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    // Bulk User Import Handler
    const handleBulkUserImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^\w\s]/gi, ''));
            const headerMap: Record<string, string> = {
                'id': 'id', 'user id': 'id', 'student id': 'id', 'roll no': 'id',
                'name': 'name', 'user name': 'name', 'full name': 'name', 'role': 'role', 'type': 'role',
                'class': 'class', 'department': 'class', 'dept': 'class', 'grade': 'class',
                'avatarurl': 'avatarUrl', 'avatar': 'avatarUrl', 'profile': 'avatarUrl', 'image': 'avatarUrl'
            };

            const headers = rawHeaders.map(h => headerMap[h] || h);
            const usersToImport: User[] = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = line.split(',').map(v => v.trim());
                const userData: any = {};
                headers.forEach((header, index) => {
                    if (header) userData[header] = values[index];
                });

                if (userData.name && userData.id) {
                    usersToImport.push({
                        id: userData.id,
                        name: userData.name,
                        role: (userData.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT'),
                        class: userData.class || '',
                        avatarUrl: userData.avatarUrl || ''
                    });
                }
            }

            if (usersToImport.length > 0) {
                try {
                    await onBulkAddUsers(usersToImport);
                    setStatusMsg(`${usersToImport.length} Users bulk import complete!`);
                } catch (err: any) {
                    setStatusMsg(`Import failed: ${err.message}`, 'error');
                }
            } else setStatusMsg('No valid users found in CSV!', 'error');
            e.target.value = '';
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
        <div className="relative">
            {/* Status Message Banner */}
            {statusMsg && (
                <div className={`sticky top-6 z-[12000] mb-10 px-10 py-6 rounded-[2.5rem] border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-6 flex items-center justify-between gap-6 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <div className="flex items-center gap-5">
                        <div className={`w-3.5 h-3.5 rounded-full ${statusMsg.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                        <span className="text-sm font-black uppercase tracking-[0.25em]">{statusMsg.text}</span>
                    </div>
                    <button onClick={() => globalStatus.set('')} className="p-2 hover:bg-white/10 rounded-full transition-all group">
                        <svg className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {activeTab !== 'dashboard' && (
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12 pb-8 border-b border-white/5">
                    <div className="flex gap-4 items-center w-full md:w-auto flex-1">
                        <div className="relative w-full md:w-96 lg:w-[32rem] group">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder={activeTab === 'users' ? "Search digital identities..." : activeTab === 'history' ? "Search circulation logs..." : activeTab === 'books' ? "Search inventory database..." : "Search core archives..."}
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                className="glass-main border-white/5 rounded-2xl pl-12 pr-6 py-3.5 text-sm text-white placeholder:text-zinc-700 focus:glow-emerald outline-none w-full transition-all"
                            />
                        </div>
                        {activeTab === 'books' && (
                            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="glass-main border-white/5 rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest focus:glow-emerald outline-none text-zinc-500 cursor-pointer transition-all">
                                {categories.map(c => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
                            </select>
                        )}
                        {activeTab === 'users' && (
                            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="glass-main border-white/5 rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest focus:glow-emerald outline-none text-zinc-500 cursor-pointer transition-all">
                                <option value="All">Global Nodes</option>
                                <option value="STUDENT">Student Persona</option>
                                <option value="ADMIN">System Admin</option>
                            </select>
                        )}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto items-center">
                        {activeTab === 'books' && (
                            <>
                                <input type="file" ref={importBooksInputRef} className="hidden" accept=".csv" onChange={handleBulkBookImport} />
                                <button onClick={() => importBooksInputRef.current?.click()} className="glass-card border-white/5 hover:border-white/10 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] py-3.5 px-8 rounded-2xl flex items-center gap-3 transition-all hover:text-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Sync Data
                                </button>
                                <button onClick={() => { setEditingBook(null); setShowBookForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] py-3.5 px-8 rounded-2xl flex items-center gap-3 transition-all active:scale-95 glow-emerald shadow-xl shadow-emerald-900/20">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                    Add Entry
                                </button>
                            </>
                        )}
                        {activeTab === 'users' && (
                            <>
                                <input type="file" ref={importUsersInputRef} className="hidden" accept=".csv" onChange={handleBulkUserImport} />
                                <button onClick={() => importUsersInputRef.current?.click()} className="glass-card border-white/5 hover:border-white/10 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] py-3.5 px-8 rounded-2xl flex items-center gap-3 transition-all hover:text-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Import Personas
                                </button>
                                <button onClick={() => { setEditingUser(null); setShowUserForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] py-3.5 px-8 rounded-2xl flex items-center gap-3 transition-all active:scale-95 glow-emerald shadow-xl shadow-emerald-900/20">
                                    Initialize Identity
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <AnalyticsDashboard books={books} history={history} users={users} fines={fines} />
            )}

            {/* Dashboard Content */}
            {activeTab === 'dashboard' && (
                <div className="space-y-12 animate-in fade-in zoom-in duration-1000">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-baseline gap-3">
                                Library <span className="text-emerald-500 opacity-60">Overview</span>
                            </h2>
                            <button onClick={() => setShowPassModal(true)} className="p-3 glass-card rounded-2xl hover:text-white transition-all text-zinc-500 group" title="Advanced Settings">
                                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Global Inventory" value={totalVolume} subtitle={`${uniqueTitles} Units`} icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" color="emerald" />
                        <StatCard title="Active Circulation" value={issuedBooksCount} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="blue" />
                        <StatCard title="Incoming Protocols" value={pendingRequestsCount} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
                        <StatCard title="Outstanding Fines" value={fines.filter(f => f.status === 'PENDING').length} icon="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" color="red" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Confirmations and Returns panels */}
                        <div className="glass-main border-white/5 rounded-[2.5rem] overflow-hidden">
                            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="font-black text-[10px] text-zinc-400 uppercase tracking-[0.3em]">Operational Gate</h3>
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Approvals</span>
                            </div>
                            <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto no-scrollbar">
                                {requests.filter(r => r.status === 'PENDING').map(req => (
                                    <div key={req.id} className="p-7 flex items-center justify-between hover:bg-white/[0.04] transition-all group">
                                        <div><p className="text-sm font-bold text-white tracking-tight">{req.userName}</p><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Requesting: <span className="text-emerald-400/80">{req.bookTitle}</span></p></div>
                                        <div className="flex gap-3">
                                            <button onClick={() => onHandleRequest(req.id, 'APPROVE')} className="px-5 py-2 glass-card border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Execute</button>
                                            <button onClick={() => onHandleRequest(req.id, 'DENY')} className="px-5 py-2 glass-card border-white/5 hover:bg-white/10 text-zinc-500 hover:text-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest">Reject</button>
                                        </div>
                                    </div>
                                ))}
                                {requests.filter(r => r.status === 'PENDING').length === 0 && <div className="p-20 text-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em]">Static: No pending tasks</div>}
                            </div>
                        </div>

                        <div className="glass-main border-white/5 rounded-[2.5rem] overflow-hidden">
                            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <h3 className="font-black text-[10px] text-zinc-400 uppercase tracking-[0.3em]">Circulation Hub</h3>
                                <div className="relative">
                                    <input type="text" placeholder="Filter node..." value={returnSearch} onChange={(e) => setReturnSearch(e.target.value)} className="w-48 glass-main border-white/10 rounded-full px-5 py-1.5 text-[10px] font-black tracking-widest text-zinc-400 placeholder:text-zinc-700 outline-none focus:glow-emerald transition-all" />
                                </div>
                            </div>
                            <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto no-scrollbar">
                                {activeCirculation.map(h => (
                                    <div key={h.id} className="p-7 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                                        <div className="overflow-hidden pr-4"><p className="text-sm font-bold text-white tracking-tight truncate">{h.bookTitle}</p><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Holder: <span className="text-blue-400/80">{h.userName}</span></p></div>
                                        <button onClick={() => { setSelectedReturn(h); setShowFineModal(true); setHasIssue(false); setFineAmount(0); setFineReason(''); }} className="shrink-0 px-5 py-2 glass-card border-white/5 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Recover</button>
                                    </div>
                                ))}
                                {activeCirculation.length === 0 && <div className="p-20 text-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em]">Empty: All units docked</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Books Tab Content */}
            {activeTab === 'books' && (
                <div className="space-y-10 animate-in slide-in-from-bottom duration-1000">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {filteredBooks.map(book => (
                            <div key={book.id} className="glass-card rounded-[2.5rem] overflow-hidden group hover:glow-emerald transition-all relative">
                                <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingBook(book); setShowBookForm(true); }} className="p-2.5 glass-card bg-black/60 rounded-xl text-emerald-400 hover:scale-110 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                    <button onClick={() => setConfirmDialog({ show: true, title: 'Decommission Asset', message: `Proceed with removal of "${book.title}"?`, onConfirm: () => onDeleteBook(book.id) })} className="p-2.5 glass-card bg-black/60 rounded-xl text-red-400 hover:scale-110 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>

                                <div className="h-64 overflow-hidden relative group-hover:h-56 transition-all duration-700">
                                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent opacity-60" />
                                </div>

                                <div className="p-7 flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em] bg-emerald-500/10 px-2.5 py-1 rounded-full">{book.category}</span>
                                        <p className="text-[9px] text-zinc-600 font-black tracking-widest uppercase">ID.#{book.id}</p>
                                    </div>
                                    <h4 className="text-lg font-black text-white leading-tight mb-1 truncate">{book.title}</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">By {book.author}</p>

                                    <div className="mt-auto flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em]">Inventory Link</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" style={{ width: `${(book.availableCopies / book.totalCopies) * 100}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-zinc-200">{book.availableCopies}/{book.totalCopies}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedBookDetail(book)} className="p-3 glass-card hover:glow-emerald text-emerald-400 rounded-2xl transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Other Records Tabs */}
            {(activeTab === 'users' || activeTab === 'requests' || activeTab === 'history' || activeTab === 'fines') && (
                <div className="glass-main border-white/5 rounded-[3rem] overflow-hidden animate-in slide-in-from-bottom duration-1000">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                            {activeTab === 'users' && (
                                <>
                                    <thead className="bg-white/[0.02] border-b border-white/5 text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em]">
                                        <tr><th className="px-10 py-6">Identity Profile</th><th className="px-10 py-6">Ref. Hash</th><th className="px-10 py-6">Designation</th><th className="px-10 py-6">Clearance</th><th className="px-10 py-6">Cluster</th><th className="px-10 py-6 text-right">Gate Control</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-white/[0.03] transition-all group">
                                                <td className="px-10 py-6">
                                                    <div className="w-10 h-10 rounded-2xl glass-card border-white/10 overflow-hidden flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover:glow-emerald transition-all">
                                                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 font-mono text-[11px] text-zinc-600 group-hover:text-zinc-300 transition-colors uppercase">{user.id === storedAdminPass ? '••••••••' : user.id}</td>
                                                <td className="px-10 py-6 font-black text-white text-sm tracking-tight">{user.name}</td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]'}`}>
                                                        {user.role === 'ADMIN' ? 'Level Alpha' : 'Persona Std'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{user.class || 'No Link'}</td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                        <button onClick={() => { setEditingUser(user); setShowUserForm(true); }} className="p-2.5 glass-card border-white/5 hover:text-emerald-400 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                        <button onClick={() => setConfirmDialog({ show: true, title: 'Revoke Identity', message: `Proceed with termination of persona "${user.name}"?`, onConfirm: () => onDeleteUser(user.id) })} className="p-2.5 glass-card border-white/5 hover:text-red-400 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                            {activeTab === 'requests' && (
                                <>
                                    <thead className="bg-white/[0.02] border-b border-white/5 text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em]">
                                        <tr><th className="px-10 py-6">Log Timestamp</th><th className="px-10 py-6">Target Persona</th><th className="px-10 py-6">Resource Allocation</th><th className="px-10 py-6">Sync Status</th><th className="px-10 py-6 text-right">Override</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {requests.map(req => (
                                            <tr key={req.id} className="hover:bg-white/[0.03] transition-all group">
                                                <td className="px-10 py-6 text-zinc-600 font-mono text-[9px] uppercase tracking-widest">{new Date(req.timestamp).toLocaleString()}</td>
                                                <td className="px-10 py-6 font-black text-white text-sm tracking-tight">{req.userName}</td>
                                                <td className="px-10 py-6 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{req.bookTitle}</td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 glow-amber shadow-[0_0_10px_rgba(245,158,11,0.2)]' : req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                        {req.status === 'PENDING' ? 'Wait-Sync' : req.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    {req.status === 'PENDING' && (
                                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={() => onHandleRequest(req.id, 'APPROVE')} className="px-5 py-2 glass-card border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all rounded-xl">Execute</button>
                                                            <button onClick={() => onHandleRequest(req.id, 'DENY')} className="px-5 py-2 glass-card border-white/5 text-zinc-600 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all rounded-xl">Block</button>
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
                                    <thead className="bg-white/[0.02] border-b border-white/5 text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em]">
                                        <tr><th className="px-10 py-6">Handshake</th><th className="px-10 py-6">Entity</th><th className="px-10 py-6">Resource Allocation</th><th className="px-10 py-6">Release</th><th className="px-10 py-6">State</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {history.map(record => (
                                            <tr key={record.id} className="hover:bg-white/[0.03] transition-all group">
                                                <td className="px-10 py-6 text-zinc-600 font-mono text-[9px] uppercase tracking-widest">{new Date(record.borrowDate).toLocaleDateString()}</td>
                                                <td className="px-10 py-6 font-black text-white text-sm tracking-tight">{record.userName}</td>
                                                <td className="px-10 py-6 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{record.bookTitle}</td>
                                                <td className="px-10 py-6 text-zinc-600 font-mono text-[9px] uppercase tracking-widest">{record.returnDate ? new Date(record.returnDate).toLocaleDateString() : 'Active Lock'}</td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${record.returnDate ? 'bg-white/5 text-zinc-500 border-white/10' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]'}`}>
                                                        {record.returnDate ? 'Asset Docked' : 'Link Established'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                            {activeTab === 'fines' && (
                                <>
                                    <thead className="bg-white/[0.02] border-b border-white/5 text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em]">
                                        <tr><th className="px-10 py-6">Breach Date</th><th className="px-10 py-6">Persona</th><th className="px-10 py-6">Resource Link</th><th className="px-10 py-6">Discrepancy</th><th className="px-10 py-6 text-right">Fee (INR)</th><th className="px-10 py-6">Clearance</th><th className="px-10 py-6 text-right">Resolve</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {fines.map(fine => (
                                            <tr key={fine.id} className="hover:bg-white/[0.03] transition-all group">
                                                <td className="px-10 py-6 text-zinc-600 font-mono text-[9px] uppercase tracking-widest">{new Date(fine.timestamp).toLocaleDateString()}</td>
                                                <td className="px-10 py-6 font-black text-white text-sm tracking-tight">{fine.userName}</td>
                                                <td className="px-10 py-6 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{fine.bookTitle}</td>
                                                <td className="px-10 py-6 text-zinc-500 text-[10px] font-bold uppercase truncate max-w-[200px] tracking-widest">{fine.reason}</td>
                                                <td className="px-10 py-6 text-right">
                                                    <span className="text-sm font-black text-emerald-400 tracking-tighter">₹{fine.amount}</span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${fine.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}>
                                                        {fine.status === 'PAID' ? 'Restored' : 'Breach Active'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    {fine.status === 'PENDING' && (
                                                        <button onClick={() => onPayFine(fine.id)} className="px-5 py-2 glass-card border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all rounded-xl opacity-0 group-hover:opacity-100">Synchronize</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* Global Modals */}
            {showBookForm && <BookForm onClose={() => setShowBookForm(false)} onSubmit={(b) => { editingBook ? onUpdateBook(b) : onAddBook(b); setShowBookForm(false); }} initialData={editingBook} />}
            {showUserForm && <UserForm onClose={() => setShowUserForm(false)} onSubmit={(u) => { editingUser ? onUpdateUser(u) : onAddUser(u); setShowUserForm(false); }} initialData={editingUser} />}

            {showPassModal && (
                <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-700" onClick={() => setShowPassModal(false)}></div>
                    <div className="relative w-full max-w-md glass-main border-white/5 rounded-[3.5rem] overflow-hidden animate-in zoom-in duration-500 flex flex-col p-10 shadow-[0_0_100px_-20px_rgba(0,0,0,1)]">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="font-black text-[10px] text-zinc-400 uppercase tracking-[0.4em]">Internal Security</h3>
                            <button onClick={() => setShowPassModal(false)} className="p-3 glass-card rounded-full text-zinc-600 hover:text-white transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 px-1">Active Credentials</label>
                                <input type="password" placeholder="Current Password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:glow-emerald outline-none transition-all placeholder:text-zinc-800" />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 px-1">New Descriptor</label>
                                <input type="password" placeholder="Define security string..." value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:glow-emerald outline-none transition-all placeholder:text-zinc-800" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-6 pt-10 mt-4 border-t border-white/5">
                            <button onClick={() => setShowPassModal(false)} className="px-6 text-[10px] font-black text-zinc-600 hover:text-white transition-all uppercase tracking-[0.3em]">Discard</button>
                            <button onClick={() => { if (currentPass === storedAdminPass) { localStorage.setItem('adminPassword', newPass); setStatusMsg('Internal Security Synchronized'); setShowPassModal(false); } else setStatusMsg('Verification Failed', 'error'); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all glow-emerald">Commit Sync</button>
                        </div>
                    </div>
                </div>
            )}

            {showFineModal && selectedReturn && (
                <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-700" onClick={() => setShowFineModal(false)}></div>
                    <div className="relative w-full max-w-md glass-main border-white/5 rounded-[3.5rem] overflow-hidden animate-in zoom-in duration-500 flex flex-col shadow-[0_0_100px_-20px_rgba(0,0,0,1)]">
                        <div className="px-10 py-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <h3 className="font-black text-[10px] text-zinc-400 uppercase tracking-[0.4em]">Asset Recovery</h3>
                            <button onClick={() => setShowFineModal(false)} className="p-3 glass-card rounded-full text-zinc-600 hover:text-white transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="glass-card p-6 rounded-[2.5rem] border-white/10">
                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-1">Target Identity</p>
                                <p className="text-lg font-black text-white">{selectedReturn.userName}</p>
                                <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest mt-1">{selectedReturn.bookTitle}</p>
                            </div>
                            <div className="flex items-center justify-between p-6 glass-card rounded-[2.5rem] border-white/5">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asset Integrity Issue?</span>
                                    <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Damage or Late return penalties</p>
                                </div>
                                <button onClick={() => setHasIssue(!hasIssue)} className={`w-14 h-7 rounded-full relative transition-all duration-500 ${hasIssue ? 'bg-red-500/20 border border-red-500/40 glow-red shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border border-white/10'}`}>
                                    <div className={`absolute top-1 w-4.5 h-4.5 bg-white rounded-full transition-all duration-500 shadow-lg ${hasIssue ? 'left-8 scale-110 bg-red-400' : 'left-1 scale-90 bg-zinc-600'}`}></div>
                                </button>
                            </div>
                            {hasIssue && (
                                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                                    <div>
                                        <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 px-1">Penalty Value (INR)</label>
                                        <input type="number" value={fineAmount} onChange={(e) => setFineAmount(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:glow-emerald outline-none transition-all placeholder:text-zinc-800" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 px-1">Discrepancy Log</label>
                                        <textarea value={fineReason} onChange={(e) => setFineReason(e.target.value)} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:glow-emerald outline-none transition-all h-28 placeholder:text-zinc-800" placeholder="Describe asset status..." />
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-6 pt-10 border-t border-white/5">
                                <button onClick={() => setShowFineModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em]">Discard</button>
                                <button onClick={() => { onReturnBook(selectedReturn.bookId, selectedReturn.userId, hasIssue ? { amount: fineAmount, reason: fineReason } : undefined); setShowFineModal(false); }} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all glow-emerald">Initialize Sync</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {confirmDialog.show && (
                <div className="fixed inset-0 z-[13000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-700" onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}></div>
                    <div className="relative w-full max-w-sm glass-main border-white/5 rounded-[3.5rem] p-10 text-center animate-in zoom-in duration-500 shadow-[0_0_100px_rgba(0,0,0,1)]">
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-inner group">
                            <svg className="w-10 h-10 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{confirmDialog.title}</h3>
                        <p className="text-[10px] font-bold text-zinc-500 mt-4 uppercase tracking-[0.2em] leading-relaxed px-4">{confirmDialog.message}</p>
                        <div className="mt-12 flex gap-4">
                            <button onClick={() => setConfirmDialog({ ...confirmDialog, show: false })} className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-all">Abort</button>
                            <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, show: false }); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]">Execute</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedBookDetail && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-700" onClick={() => setSelectedBookDetail(null)}></div>
                    <div className="relative w-full max-w-5xl glass-main border-white/10 rounded-[4rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in duration-500 shadow-[0_0_100px_rgba(0,0,0,1)]">
                        <div className="w-full md:w-2/5 aspect-[3/4.2] md:aspect-auto bg-black/40 relative">
                            <img src={selectedBookDetail.coverUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050507]/60" />
                        </div>
                        <div className="flex-1 p-10 md:p-16 overflow-y-auto no-scrollbar relative flex flex-col">
                            <button onClick={() => setSelectedBookDetail(null)} className="absolute top-10 right-10 p-3 glass-card rounded-full text-zinc-600 hover:text-white transition-all z-20">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="relative z-10 flex-1">
                                <span className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/10">{selectedBookDetail.category}</span>
                                <h2 className="text-4xl md:text-5xl font-black text-white mt-10 uppercase tracking-tighter leading-[0.9]">{selectedBookDetail.title}</h2>
                                <p className="text-zinc-500 text-xl mt-6 font-black uppercase tracking-[0.2em] opacity-60">Origin: {selectedBookDetail.author}</p>

                                <div className="grid grid-cols-2 gap-10 mt-16 pt-16 border-t border-white/5">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Global Protocol</p>
                                        <p className="text-zinc-300 font-bold text-[11px] font-mono">ISBN: {selectedBookDetail.isbn}</p>
                                        <p className="text-zinc-300 font-bold text-[11px] font-mono">ID: #{selectedBookDetail.id}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Inventory Health</p>
                                        <p className="text-zinc-300 font-black text-2xl tracking-tighter">{selectedBookDetail.availableCopies} <span className="text-xs uppercase opacity-40 ml-1">/ {selectedBookDetail.totalCopies} Nodes</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-16">
                                <button onClick={() => { setEditingBook(selectedBookDetail); setShowBookForm(true); setSelectedBookDetail(null); }} className="w-full py-5 bg-white/5 border border-white/10 hover:border-emerald-500/40 text-emerald-400 font-black uppercase text-xs tracking-[0.4em] rounded-3xl transition-all hover:bg-emerald-500/5 group flex items-center justify-center gap-4">
                                    Modify Protocol
                                    <svg className="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
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
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 glow-emerald',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 glow-cyan',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]',
        red: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]',
    };
    return (
        <div className="glass-main border-white/5 p-8 rounded-[2.5rem] transition-all hover:bg-white/[0.04] flex items-center gap-6 group">
            <div className={`p-4 rounded-2xl border transition-all duration-500 group-hover:scale-110 ${colorClasses[color]}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
            </div>
            <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{title}</p>
                <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
                    {subtitle && <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
