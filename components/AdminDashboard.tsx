import React, { useState, useMemo, useRef } from 'react';
import { Book, User, BorrowRequest, HistoryRecord, Fine } from '../types';
import BookForm from './BookForm';
import UserForm from './UserForm';
import AnalyticsDashboard from './AnalyticsDashboard';
import { downloadCatalogPDF } from '../utils/pdfGenerator';


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
    onBorrow: (bookId: string) => void;
    onIssueBook: (bookId: string, userId: string) => void;
    globalStatus: { msg: { text: string, type: 'success' | 'error' } | null, set: (text: string, type?: 'success' | 'error') => void };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    activeTab, books, users, requests, history, fines,
    onAddBook, onUpdateBook, onDeleteBook, onBulkAddBooks,
    onAddUser, onUpdateUser, onDeleteUser, onBulkAddUsers,
    onHandleRequest, onReturnBook, onPayFine, onBorrow, onIssueBook,
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

    const [issuingToUserId, setIssuingToUserId] = useState('');
    const [issueSearch, setIssueSearch] = useState('');

    // Inline Status Message logic moved to App.tsx (globalStatus)
    const statusMsg = globalStatus.msg;
    const setStatusMsg = globalStatus.set;

    const filteredBooks = books.filter(b =>
        (filter === 'All' || b.category === filter) &&
        (b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.author.toLowerCase().includes(search.toLowerCase()) ||
            b.id.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idA - idB;
    });

    const filteredUsers = users.filter(u =>
        (filter === 'All' ? u.role !== 'ADMIN' : u.role === filter) &&
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

    const handleDownloadCatalog = () => {
        downloadCatalogPDF(filteredBooks, setStatusMsg);
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
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-10 pb-8 border-b border-white/40">
                    <div className="flex gap-4 items-center w-full md:w-auto flex-1">
                        <div className="relative w-full md:w-80 lg:w-[28rem]">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder={activeTab === 'users' ? "Search name, ID or class..." : activeTab === 'history' ? "Search circulation records..." : activeTab === 'books' ? "Search title, author or ISBN..." : "Search archives..."}
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                className="neo-input rounded-2xl pl-12 pr-6 py-3.5 text-sm text-gray-800 w-full"
                            />
                        </div>
                        {activeTab === 'books' && (
                            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="neo-input rounded-2xl px-6 py-3.5 text-sm outline-none cursor-pointer">
                                {categories.map(c => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
                            </select>
                        )}
                        {activeTab === 'users' && (
                            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="neo-input rounded-2xl px-6 py-3.5 text-sm outline-none cursor-pointer">
                                <option value="All">All Members</option>
                                <option value="STUDENT">Students</option>
                                <option value="USTHAD">Usthads</option>
                            </select>
                        )}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto items-center">
                        {activeTab === 'books' && (
                            <>
                                <input type="file" ref={importBooksInputRef} className="hidden" accept=".csv" onChange={handleBulkBookImport} />
                                <button onClick={() => importBooksInputRef.current?.click()} className="neo-button py-3 px-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group text-gray-500 hover:text-teal-600">
                                    <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Import
                                </button>
                                <button onClick={handleDownloadCatalog} className="neo-button py-3 px-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group text-gray-500 hover:text-teal-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Catalog
                                </button>
                                <button onClick={() => { setEditingBook(null); setShowBookForm(true); }} className="accent-teal shadow-[0_10px_20px_rgba(155,194,185,0.3)] hover:scale-[1.02] py-3 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                    Add New
                                </button>
                            </>
                        )}
                        {activeTab === 'users' && (
                            <>
                                <input type="file" ref={importUsersInputRef} className="hidden" accept=".csv" onChange={handleBulkUserImport} />
                                <button onClick={() => importUsersInputRef.current?.click()} className="neo-button py-3 px-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group text-gray-500 hover:text-teal-600">
                                    <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Import
                                </button>
                                <button onClick={() => { setEditingUser(null); setShowUserForm(true); }} className="accent-teal shadow-[0_10px_20px_rgba(155,194,185,0.3)] hover:scale-[1.02] py-3 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                    Add Member
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
                <div className="space-y-10 animate-in fade-in duration-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-black text-gray-400 uppercase tracking-widest">Library Overview</h2>
                            <button onClick={() => setShowPassModal(true)} className="p-2 glass-button rounded-xl transition-all" title="Change Admin Password">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatCard title="Total Inventory" value={totalVolume} subtitle={`${uniqueTitles} Titles`} icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" color="emerald" />
                        <StatCard title="Checked Out" value={issuedBooksCount} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="blue" />
                        <StatCard title="Open Requests" value={pendingRequestsCount} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
                        <StatCard title="Due Fines" value={fines.filter(f => f.status === 'PENDING').length} icon="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" color="red" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Confirmations and Returns panels */}
                        <div className="neo-card rounded-[2.5rem] overflow-hidden">
                            <div className="px-8 py-6 border-b border-white/40 flex justify-between items-center bg-white/10 uppercase tracking-widest text-[10px] font-black text-gray-400">
                                <h3>Pending Actions</h3>
                                <span className="bg-amber-500/20 text-amber-600 px-3 py-1 rounded-full">{requests.filter(r => r.status === 'PENDING').length} To Do</span>
                            </div>
                            <div className="divide-y divide-white/20 max-h-[450px] overflow-y-auto no-scrollbar">
                                {requests.filter(r => r.status === 'PENDING').map(req => (
                                    <div key={req.id} className="p-6 flex items-center justify-between hover:bg-white/40 transition-colors">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 tracking-tight">{req.userName}</p>
                                            <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest leading-none">Wants: <span className="text-teal-600">{req.bookTitle}</span></p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => onHandleRequest(req.id, 'APPROVE')} className="w-8 h-8 rounded-xl neo-flat flex items-center justify-center text-teal-600 hover:accent-teal hover:text-white transition-all">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                            <button onClick={() => onHandleRequest(req.id, 'DENY')} className="w-8 h-8 rounded-xl neo-flat flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {requests.filter(r => r.status === 'PENDING').length === 0 && <div className="p-20 text-center text-gray-400 text-xs italic">Clear for now</div>}
                            </div>
                        </div>

                        <div className="neo-card rounded-[2.5rem] overflow-hidden">
                            <div className="px-8 py-6 border-b border-white/40 bg-white/10 flex items-center justify-between uppercase tracking-widest text-[10px] font-black text-gray-400">
                                <h3>Active Returns</h3>
                                <div className="relative">
                                    <input type="text" placeholder="Scan or search..." value={returnSearch} onChange={(e) => setReturnSearch(e.target.value)} className="w-48 neo-input rounded-full px-4 py-1.5 text-[10px] pr-10" />
                                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>
                            <div className="divide-y divide-white/20 max-h-[450px] overflow-y-auto no-scrollbar">
                                {activeCirculation.map(h => (
                                    <div key={h.id} className="p-6 flex items-center justify-between hover:bg-white/40 transition-colors">
                                        <div className="overflow-hidden pr-4">
                                            <p className="text-sm font-bold text-gray-800 truncate tracking-tight">{h.bookTitle}</p>
                                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1 truncate">By {h.userName}</p>
                                        </div>
                                        <button onClick={() => { setSelectedReturn(h); setShowFineModal(true); setHasIssue(false); setFineAmount(0); setFineReason(''); }} className="neo-button p-2 text-[10px] font-black text-teal-600 hover:text-teal-700">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                                        </button>
                                    </div>
                                ))}
                                {activeCirculation.length === 0 && <div className="p-20 text-center text-gray-400 text-xs italic">All items returned</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Books Tab Content */}
            {activeTab === 'books' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredBooks.map(book => (
                            <div key={book.id} className="neo-card rounded-3xl overflow-hidden group hover:neo-card-hover transition-all">
                                <div className="flex h-48">
                                    <div className="w-[35%] overflow-hidden neo-inset relative">
                                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="w-[65%] p-6 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[8px] font-black text-teal-600 neo-inset px-2.5 py-1 rounded-full uppercase tracking-[0.15em]">{book.category}</span>
                                            <p className="text-[8px] text-gray-400 font-bold tracking-widest">#{book.id}</p>
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-800 leading-snug mb-1 line-clamp-2 pr-4">{book.title}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">by {book.author}</p>
                                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/40">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${book.availableCopies === 0 ? 'bg-rose-400' : 'bg-teal-400'}`}></div>
                                                <p className="text-[10px] font-black text-gray-700">{book.availableCopies}/{book.totalCopies}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setSelectedBookDetail(book)} className="w-8 h-8 rounded-xl neo-button flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                                <button onClick={() => { setEditingBook(book); setShowBookForm(true); }} className="w-8 h-8 rounded-xl neo-button flex items-center justify-center text-gray-400 hover:text-teal-600 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Other Records Tabs */}
            {(activeTab === 'users' || activeTab === 'requests' || activeTab === 'history' || activeTab === 'fines') && (
                <div className="bg-white/50 border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm">
                            {activeTab === 'users' && (
                                <>
                                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                        <tr><th className="px-6 py-4">Profile</th><th className="px-6 py-4">ID</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Class</th><th className="px-6 py-4 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-all group zebra-row">
                                                <td className="px-6 py-4"><div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-[10px] font-medium text-gray-500">{user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}</div></td>
                                                <td className="px-6 py-4 font-mono text-[11px] text-gray-500">{user.id === '••••••••' ? '••••••••' : user.id}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' : user.role === 'USTHAD' ? 'accent-amber border-amber-100' : 'accent-emerald border-emerald-100'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-xs">{user.class || '---'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditingUser(user); setShowUserForm(true); }} className="p-1.5 text-gray-400 hover:text-emerald-500 rounded-md transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                        <button onClick={() => setConfirmDialog({ show: true, title: 'Remove Access', message: `Revoke access for ${user.name}?`, onConfirm: () => onDeleteUser(user.id) })} className="p-1.5 text-gray-400 hover:text-red-400 rounded-md transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                            {activeTab === 'requests' && (
                                <>
                                    <thead className="bg-zinc-900/20 border-b border-zinc-900/50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                                        <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Book</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {requests.map(req => (
                                            <tr key={req.id} className="hover:bg-gray-50 transition-all zebra-row">
                                                <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">{new Date(req.timestamp).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{req.userName}</td>
                                                <td className="px-6 py-4 text-gray-600 text-xs">{req.bookTitle}</td>
                                                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${req.status === 'PENDING' ? 'accent-amber border-amber-100' : req.status === 'APPROVED' ? 'accent-emerald border-emerald-100' : 'accent-rose border-rose-100'}`}>{req.status}</span></td>
                                                <td className="px-6 py-4 text-right">
                                                    {req.status === 'PENDING' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => onHandleRequest(req.id, 'APPROVE')} className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-[10px] font-bold uppercase transition-all">Approve</button>
                                                            <button onClick={() => onHandleRequest(req.id, 'DENY')} className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase transition-all">Deny</button>
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
                                    <thead className="bg-zinc-900/20 border-b border-zinc-900/50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                                        <tr><th className="px-6 py-4">Borrowed</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Book</th><th className="px-6 py-4">Issued By</th><th className="px-6 py-4">Returned</th><th className="px-6 py-4">Status</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {history.map(record => (
                                            <tr key={record.id} className="hover:bg-gray-50 transition-all zebra-row">
                                                <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">{new Date(record.borrowDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{record.userName}</td>
                                                <td className="px-6 py-4 text-gray-600 text-xs">{record.bookTitle}</td>
                                                <td className="px-6 py-4 text-gray-500 text-xs">{record.issuedBy || '---'}</td>
                                                <td className="px-6 py-4 text-gray-400 font-mono text-[10px]">{record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '---'}</td>
                                                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${record.returnDate ? 'bg-gray-50 text-gray-400 border-gray-100' : 'accent-blue border-blue-100'}`}>{record.returnDate ? 'Returned' : 'In Use'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                            {activeTab === 'fines' && (
                                <>
                                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                        <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Book</th><th className="px-6 py-4">Reason</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {fines.map(fine => (
                                            <tr key={fine.id} className="hover:bg-gray-50 transition-all zebra-row">
                                                <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">{new Date(fine.timestamp).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{fine.userName}</td>
                                                <td className="px-6 py-4 text-gray-600 text-xs">{fine.bookTitle}</td>
                                                <td className="px-6 py-4 text-gray-500 text-xs">{fine.reason}</td>
                                                <td className="px-6 py-4 text-right font-mono text-xs text-emerald-600 font-bold">₹{fine.amount}</td>
                                                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${fine.status === 'PAID' ? 'accent-emerald border-emerald-100' : 'accent-rose border-rose-100'}`}>{fine.status}</span></td>
                                                <td className="px-6 py-4 text-right">{fine.status === 'PENDING' && <button onClick={() => onPayFine(fine.id)} className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 rounded text-[9px] font-bold text-emerald-600 uppercase tracking-wider border border-emerald-100 transition-all">Mark Paid</button>}</td>
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
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
                    <div className="glass-panel w-full max-w-md rounded-[2rem] p-8 space-y-6">
                        <div className="flex justify-between items-center mb-2"><h3 className="font-black text-xl text-gray-900 uppercase tracking-tight">Advanced Settings</h3><button onClick={() => setShowPassModal(false)} className="text-gray-400 hover:text-gray-900"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                        <div className="space-y-4">
                            <input type="password" placeholder="Current Password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-sm" />
                            <input type="password" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4"><button onClick={() => setShowPassModal(false)} className="flex-1 py-3 text-sm font-black uppercase text-gray-400">Discard</button><button onClick={() => { if (currentPass === storedAdminPass) { localStorage.setItem('adminPassword', newPass); setStatusMsg('Password updated!'); setShowPassModal(false); } else setStatusMsg('Invalid current password!', 'error'); }} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-200">Save Hub</button></div>
                    </div>
                </div>
            )}

            {showFineModal && selectedReturn && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
                    <div className="glass-panel w-full max-w-md rounded-[2.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Confirm Return</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{selectedReturn.bookTitle} • {selectedReturn.userName}</p>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100"><span className="text-sm font-black text-gray-700 uppercase tracking-tighter">Are there any issues?</span><button onClick={() => setHasIssue(!hasIssue)} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${hasIssue ? 'bg-rose-600 shadow-lg shadow-rose-200' : 'bg-gray-200'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${hasIssue ? 'left-8' : 'left-1'}`}></div></button></div>
                        {hasIssue && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                                <input type="number" value={fineAmount} onChange={(e) => setFineAmount(Number(e.target.value))} className="glass-input rounded-xl px-4 py-3 text-sm w-full" placeholder="Fine Amount (₹)" />
                                <textarea value={fineReason} onChange={(e) => setFineReason(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-sm w-full h-24 no-scrollbar" placeholder="Detailed reason..." />
                            </div>
                        )}
                        <div className="flex gap-4"><button onClick={() => setShowFineModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-400">Discard</button><button onClick={() => { onReturnBook(selectedReturn.bookId, selectedReturn.userId, hasIssue ? { amount: fineAmount, reason: fineReason } : undefined); setShowFineModal(false); }} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200">Issue Return</button></div>
                    </div>
                </div>
            )}

            {confirmDialog.show && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[11000] p-4">
                    <div className="glass-panel w-full max-w-sm rounded-[2.5rem] p-10 text-center animate-in zoom-in-95 duration-300 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)]">
                        <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                            <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{confirmDialog.title}</h3>
                        <p className="text-sm text-gray-500 mt-4 leading-relaxed">{confirmDialog.message}</p>
                        <div className="mt-10 flex gap-4">
                            <button onClick={() => setConfirmDialog({ ...confirmDialog, show: false })} className="flex-1 py-4 text-xs font-black uppercase text-gray-400">Discard</button>
                            <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, show: false }); }} className="flex-1 bg-rose-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200">Confirm Action</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedBookDetail && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl" onClick={() => setSelectedBookDetail(null)}></div>
                    <div className="relative w-full max-w-5xl glass-panel rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)]">
                        <div className="w-full md:w-1/3 h-64 md:h-auto bg-gray-50 border-r border-gray-100"><img src={selectedBookDetail.coverUrl} className="w-full h-full object-cover" /></div>
                        <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar relative">
                            <button onClick={() => setSelectedBookDetail(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            <span className="text-[10px] font-black accent-emerald px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">{selectedBookDetail.category}</span>
                            <h2 className="text-3xl font-black text-gray-900 mt-4 uppercase tracking-tight">{selectedBookDetail.title}</h2>
                            <p className="text-gray-500 text-lg mb-8 font-medium">by {selectedBookDetail.author}</p>
                            <div className="grid grid-cols-3 gap-8 mb-10 pb-8 border-b border-gray-100">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Specs</p><p className="text-xs text-gray-700 mt-2 font-mono">ISBN: {selectedBookDetail.isbn}</p><p className="text-xs text-gray-700 font-mono">ID: #{selectedBookDetail.id}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Stock</p><p className="text-xs text-gray-700 mt-2 font-bold">{selectedBookDetail.availableCopies} / {selectedBookDetail.totalCopies}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Value</p><p className="text-xs text-emerald-600 mt-2 font-bold">₹{selectedBookDetail.price}</p></div>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl shadow-inner">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Direct Issuance</p>
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                placeholder="Search user..."
                                                value={issueSearch}
                                                onChange={(e) => setIssueSearch(e.target.value)}
                                                className="w-full glass-input rounded-xl px-4 py-3 text-sm text-gray-900 outline-none transition-all font-medium"
                                            />
                                            {issueSearch && (
                                                <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto no-scrollbar">
                                                    {users.filter(u => u.role !== 'ADMIN' && (u.name.toLowerCase().includes(issueSearch.toLowerCase()) || u.id.toLowerCase().includes(issueSearch.toLowerCase()))).map(u => (
                                                        <button
                                                            key={u.id}
                                                            onClick={() => { setIssuingToUserId(u.id); setIssueSearch(u.name); }}
                                                            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-all border-b border-gray-100 last:border-0"
                                                        >
                                                            <div className="font-bold">{u.name}</div>
                                                            <div className="text-[10px] text-gray-500">ID: {u.id} • {u.role}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!issuingToUserId) {
                                                    setStatusMsg('Please select a user first!', 'error');
                                                    return;
                                                }
                                                onIssueBook(selectedBookDetail.id, issuingToUserId);
                                                setSelectedBookDetail(null);
                                                setIssuingToUserId('');
                                                setIssueSearch('');
                                            }}
                                            disabled={!issuingToUserId}
                                            className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg ${issuingToUserId ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            Issue Book
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-3">
                                    <button
                                        onClick={() => { onIssueBook(selectedBookDetail.id, (localStorage.getItem('albayan_active_session') ? JSON.parse(localStorage.getItem('albayan_active_session')!).id : 'Admin')); setSelectedBookDetail(null); }}
                                        className="flex-1 py-4 glass-button text-gray-900 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-50 transition-all group shadow-md"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            Quick Borrow (Self)
                                        </span>
                                    </button>
                                    <button onClick={() => { setEditingBook(selectedBookDetail); setShowBookForm(true); setSelectedBookDetail(null); }} className="flex-1 py-4 glass-button text-gray-500 font-black uppercase text-xs tracking-widest rounded-2xl hover:text-gray-900 transition-all shadow-md">Edit Specs</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon, color }: any) => {
    const colors: Record<string, string> = { emerald: 'text-teal-accent', blue: 'text-blue-500', amber: 'text-amber-500', red: 'text-rose-500' };
    return (
        <div className="neo-card p-8 rounded-[2rem] transition-all hover:scale-[1.02] group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl neo-inset ${colors[color]} opacity-80 group-hover:opacity-100 transition-opacity`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                </div>
                {subtitle && <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{subtitle}</span>}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{title}</p>
                <p className="text-3xl font-black text-gray-800 tracking-tight mt-1">{value}</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
