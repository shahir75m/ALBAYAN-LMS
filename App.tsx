
import React, { useState, useEffect, useCallback } from 'react';
import { Book, User, BorrowRequest, HistoryRecord } from './types';
import Splash from './components/Splash';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import Logo from './components/Logo';
import { api } from './api';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  const [cloudIdentity, setCloudIdentity] = useState<{ id: string, name: string, avatarUrl?: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const refreshAllData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [b, u, r, h] = await Promise.all([
        api.getBooks(),
        api.getUsers(),
        api.getRequests(),
        api.getHistory()
      ]);
      setBooks(b || []);
      setUsers(u || []);
      setRequests(r || []);
      setHistory(h || []);

      setIsLocalMode(api.isUsingFallback());
    } catch (err: any) {
      console.warn("Cloud Sync Interaction:", err.message);
      setIsLocalMode(api.isUsingFallback());
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const savedIdentity = localStorage.getItem('albayan_cloud_identity');
      if (savedIdentity) {
        setCloudIdentity(JSON.parse(savedIdentity));
      }

      const savedSession = localStorage.getItem('albayan_active_session');
      if (savedSession) {
        setCurrentUser(JSON.parse(savedSession));
      }

      await refreshAllData();
      const interval = setInterval(refreshAllData, 5000);

      setTimeout(() => setLoading(false), 2000);
      return () => clearInterval(interval);
    };
    init();
  }, [refreshAllData]);

  const handleIdentify = (identity: { id: string, name: string, avatarUrl?: string }) => {
    setCloudIdentity(identity);
    localStorage.setItem('albayan_cloud_identity', JSON.stringify(identity));
  };

  const handleLogin = async (userData: User) => {
    setIsSyncing(true);
    try {
      setCurrentUser(userData);
      localStorage.setItem('albayan_active_session', JSON.stringify(userData));
      await refreshAllData();
    } catch (err) {
      setCurrentUser(userData);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSwitchPortal = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('albayan_active_session');
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFullLogout = useCallback(() => {
    setCurrentUser(null);
    setCloudIdentity(null);
    localStorage.removeItem('albayan_active_session');
    localStorage.removeItem('albayan_cloud_identity');
  }, []);

  const handleAddOrUpdateBook = async (book: Book) => {
    await api.saveBook(book);
    await refreshAllData();
  };

  const handleDeleteBook = async (id: string) => {
    await api.deleteBook(id);
    await refreshAllData();
  };

  const handleAddOrUpdateUser = async (user: User) => {
    await api.saveUser(user);
    await refreshAllData();
  };

  const handleDeleteUser = async (id: string) => {
    await api.deleteUser(id);
    await refreshAllData();
  };

  const handleRequestAction = async (requestId: string, action: 'APPROVE' | 'DENY') => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    try {
      if (action === 'APPROVE') {
        const book = books.find(b => b.id === req.bookId);
        if (book && book.availableCopies > 0) {
          const updatedBook = {
            ...book,
            availableCopies: book.availableCopies - 1,
            currentBorrowers: [...book.currentBorrowers, { userId: req.userId, userName: req.userName }]
          };
          await api.saveBook(updatedBook);
          await api.addHistoryRecord({
            id: `H${Date.now()}`,
            bookId: req.bookId,
            bookTitle: req.bookTitle,
            userId: req.userId,
            userName: req.userName,
            borrowDate: Date.now()
          });
        }
      }
      await api.updateRequestStatus(requestId, action === 'APPROVE' ? 'APPROVED' : 'DENIED');
      await refreshAllData();
    } catch (err) {
      alert("Action failed: " + err);
    }
  };

  const handleReturnBook = async (bookId: string, userId: string) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      const updatedBook = {
        ...book,
        availableCopies: Math.min(book.totalCopies, book.availableCopies + 1),
        currentBorrowers: book.currentBorrowers.filter(cb => cb.userId !== userId)
      };
      await api.saveBook(updatedBook);
      const record = history.find(h => h.bookId === bookId && h.userId === userId && !h.returnDate);
      if (record) await api.updateHistoryRecord({ ...record, id: record.id, returnDate: Date.now() });
    }
    await refreshAllData();
  };

  const handleBorrowRequest = async (bookId: string) => {
    if (!currentUser) return;
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    await api.createRequest({
      id: `R${Date.now()}`,
      bookId,
      bookTitle: book.title,
      userId: currentUser.id,
      userName: currentUser.name,
      status: 'PENDING',
      timestamp: Date.now()
    });
    await refreshAllData();
  };

  if (loading) return <Splash />;

  if (!currentUser) {
    return (
      <Login
        onLogin={handleLogin}
        onIdentify={handleIdentify}
        initialIdentity={cloudIdentity}
        onClearIdentity={handleFullLogout}
        availableUsers={users}
      />
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 overflow-hidden">
      <Sidebar
        role={currentUser.role}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onLogout={handleSwitchPortal}
        user={currentUser}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-zinc-800 rounded-xl border border-zinc-700 text-zinc-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="text-sm font-black uppercase">ALBAYAN</span>
          </div>
          <button onClick={handleSwitchPortal} className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
          </button>
        </div>

        <div className="flex-1 p-4 md:p-8">
          <div className="fixed top-20 md:top-4 right-4 md:right-8 z-50 flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-2xl backdrop-blur-md shadow-2xl">
              <div className="flex flex-col items-end">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isLocalMode ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {isLocalMode ? 'LocalStorage Mode' : 'Cloud Sync Active'}
                </span>
                <span className="text-[10px] text-zinc-300 font-bold">{cloudIdentity?.id}</span>
              </div>
              <button onClick={handleFullLogout} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-500 border border-zinc-700" title="Full Logout">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
              </button>
            </div>
            {isSyncing && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-emerald-400 animate-pulse">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Refreshing...
              </div>
            )}
            {isLocalMode && (
              <div className="text-[9px] font-bold text-amber-500/50 uppercase tracking-widest bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10">
                Backend Unreachable
              </div>
            )}
          </div>

          <div className="w-full">
            <header className="mb-10">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                {activeTab.replace('-', ' ')}
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                Currently in <span className="text-emerald-400 font-bold">{currentUser.role}</span> Portal
              </p>
            </header>

            {currentUser.role === 'ADMIN' ? (
              <AdminDashboard
                activeTab={activeTab} books={books} users={users} requests={requests} history={history}
                onAddBook={handleAddOrUpdateBook} onUpdateBook={handleAddOrUpdateBook} onDeleteBook={handleDeleteBook}
                onAddUser={handleAddOrUpdateUser} onUpdateUser={handleAddOrUpdateUser} onDeleteUser={handleDeleteUser}
                onHandleRequest={handleRequestAction} onReturnBook={handleReturnBook}
              />
            ) : (
              <StudentDashboard
                activeTab={activeTab} books={books} requests={requests} history={history} currentUser={currentUser} onBorrow={handleBorrowRequest}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
