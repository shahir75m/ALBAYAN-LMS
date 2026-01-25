
import React, { useState, useEffect, useCallback } from 'react';
import { Book, User, BorrowRequest, HistoryRecord, Fine } from './types';
import Splash from './components/Splash';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import About from './components/About';
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
  const [fines, setFines] = useState<Fine[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Status Message
  const [statusMsg, setStatusMsgState] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const setStatusMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsgState({ text, type });
    setTimeout(() => setStatusMsgState(null), 4000);
  };

  const refreshAllData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [b, u, r, h, f] = await Promise.all([
        api.getBooks(),
        api.getUsers(),
        api.getRequests(),
        api.getHistory(),
        api.getFines()
      ]);
      setBooks(b || []);
      setUsers(u || []);
      setRequests(r || []);
      setHistory(h || []);
      setFines(f || []);

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
        const user = JSON.parse(savedSession);
        // Requirement: Admin must re-authenticate on refresh
        if (user.role === 'ADMIN') {
          localStorage.removeItem('albayan_active_session');
          setCurrentUser(null);
        } else {
          setCurrentUser(user);
        }
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

  const handleBulkAddBooks = async (books: Book[]) => {
    await api.bulkSaveBooks(books);
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

  const handleBulkAddUsers = async (users: User[]) => {
    await api.bulkSaveUsers(users);
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
        if (book && (book.availableCopies || 0) > 0) {
          const updatedBook = {
            ...book,
            availableCopies: Number(book.availableCopies || 0) - 1,
            currentBorrowers: [...(book.currentBorrowers || []), { userId: req.userId, userName: req.userName }]
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
      setStatusMsg(`Request ${action === 'APPROVE' ? 'Approved' : 'Denied'}`);
      await refreshAllData();
    } catch (err: any) {
      setStatusMsg("Action failed: " + err.message, 'error');
    }
  };

  const handleReturnBook = async (bookId: string, userId: string, fine?: { amount: number, reason: string }) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      const currentAvailable = Number(book.availableCopies || 0);
      const total = Number(book.totalCopies || 1);
      const updatedBook = {
        ...book,
        availableCopies: Math.min(total, currentAvailable + 1),
        currentBorrowers: (book.currentBorrowers || []).filter(cb => cb.userId !== userId)
      };
      await api.saveBook(updatedBook);
      const record = history.find(h => h.bookId === bookId && h.userId === userId && !h.returnDate);
      if (record) {
        await api.updateHistoryRecord({ ...record, id: record.id, returnDate: Date.now() });

        if (fine && fine.amount > 0) {
          await api.createFine({
            id: `F${Date.now()}`,
            userId,
            userName: record.userName,
            bookId,
            bookTitle: record.bookTitle,
            amount: fine.amount,
            reason: fine.reason,
            status: 'PENDING',
            timestamp: Date.now()
          });
        }
      }
    }
    await refreshAllData();
  };

  const handlePayFine = async (fineId: string) => {
    await api.updateFineStatus(fineId, 'PAID');
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

  return (
    <div className="min-h-screen bg-[#030305] text-white selection:bg-emerald-500/30 overflow-x-hidden relative">
      {/* Atmospheric Background Blobs */}
      <div className="bg-blob w-[800px] h-[800px] bg-emerald-500/20 -top-40 -left-40 animate-float" />
      <div className="bg-blob w-[600px] h-[600px] bg-blue-500/10 top-1/2 -right-20 animate-float-delayed" />
      <div className="bg-blob w-[700px] h-[700px] bg-purple-500/10 -bottom-40 left-1/4 animate-float-fast" />

      {statusMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className={`flex items-center gap-3 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-top-4 border backdrop-blur-xl ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
            <span className={`w-2 h-2 rounded-full ${statusMsg.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`}></span>
            {statusMsg.text}
          </div>
        </div>
      )}

      {!currentUser ? (
        <Login
          onLogin={handleLogin}
          onIdentify={handleIdentify}
          initialIdentity={cloudIdentity}
          onClearIdentity={handleFullLogout}
          availableUsers={users}
        />
      ) : (
        <div className="flex flex-col lg:flex-row min-h-screen relative z-10">
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
          <main className="flex-1 p-6 lg:p-12 overflow-x-hidden">
            <header className="mb-12 flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter uppercase">
                  {activeTab === 'dashboard' ? 'Neural Core' :
                    activeTab === 'books' || activeTab === 'catalog' ? 'Data Vault' :
                      activeTab === 'users' ? 'User Matrix' :
                        activeTab === 'requests' ? 'Access Control' :
                          activeTab === 'history' ? 'System Logs' :
                            activeTab === 'fines' ? 'Financial Hub' :
                              'Interface'}
                </h1>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  Protocol: {activeTab.toUpperCase()} ACTIVE
                </p>
              </div>
              <div className="hidden md:flex flex-col items-end">
                <span className="text-zinc-600 font-mono text-[9px] uppercase tracking-widest">Node ID: {currentUser.id}</span>
                <span className="text-zinc-700 font-mono text-[8px] uppercase tracking-widest">Status: Authenticated</span>
              </div>

              {/* Mobile Menu Toggle */}
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-3 glass-card rounded-2xl text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
            </header>

            {currentUser.role === 'ADMIN' ? (
              <AdminDashboard
                activeTab={activeTab}
                books={books}
                users={users}
                requests={requests}
                history={history}
                fines={fines}
                onAddBook={handleAddOrUpdateBook}
                onUpdateBook={handleAddOrUpdateBook}
                onDeleteBook={handleDeleteBook}
                onBulkAddBooks={handleBulkAddBooks}
                onAddUser={handleAddOrUpdateUser}
                onUpdateUser={handleAddOrUpdateUser}
                onDeleteUser={handleDeleteUser}
                onBulkAddUsers={handleBulkAddUsers}
                onHandleRequest={handleRequestAction}
                onReturnBook={handleReturnBook}
                onPayFine={handlePayFine}
                globalStatus={{ msg: statusMsg, set: setStatusMsg }}
              />
            ) : (
              <StudentDashboard
                activeTab={activeTab}
                books={books}
                requests={requests}
                history={history}
                fines={fines}
                currentUser={currentUser}
                onBorrow={handleBorrowRequest}
                globalStatus={{ msg: statusMsg, set: setStatusMsg }}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
