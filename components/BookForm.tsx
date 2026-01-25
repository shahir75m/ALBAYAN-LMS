import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../types';

interface BookFormProps {
  onClose: () => void;
  onSubmit: (book: Book) => void;
  initialData?: Book | null;
}

const BookForm: React.FC<BookFormProps> = ({ onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<Book>>({
    id: '', title: '', author: '', category: 'General',
    year: 2024, isbn: '', totalCopies: 1, availableCopies: 1,
    coverUrl: 'https://picsum.photos/seed/book/400/600',
    price: 0,
    currentBorrowers: []
  });

  const [isFetching, setIsFetching] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const isbnInputRef = useRef<HTMLInputElement>(null);

  // local status logic for the modal
  const [statusMsg, setStatusMsgState] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const setStatusMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsgState({ text, type });
    setTimeout(() => setStatusMsgState(null), 5000);
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(prev => ({ ...prev, id: `B${Math.floor(Math.random() * 9000) + 1000}` }));
      // Auto-focus ISBN field for laser scanner ready state if not editing
      setTimeout(() => isbnInputRef.current?.focus(), 500);
    }
  }, [initialData]);

  const fetchBookDetails = async (isbn: string) => {
    if (!isbn || isbn.length < 10) return;
    setIsFetching(true);
    setScanStatus('idle');
    try {
      const cleanIsbn = isbn.replace(/[-\s]/g, '');
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
      const data = await response.json();

      if (data.totalItems > 0) {
        const info = data.items[0].volumeInfo;
        const saleInfo = data.items[0].saleInfo;

        setFormData(prev => ({
          ...prev,
          title: info.title || prev.title,
          author: info.authors ? info.authors.join(', ') : prev.author,
          category: info.categories ? info.categories[0] : prev.category,
          year: info.publishedDate ? parseInt(info.publishedDate.split('-')[0]) : prev.year,
          isbn: isbn,
          coverUrl: info.imageLinks?.thumbnail || prev.coverUrl,
          price: saleInfo?.listPrice?.amount || prev.price || 0,
        }));
        setScanStatus('success');
      } else {
        setScanStatus('error');
        setStatusMsg("No metadata found for this ISBN. Enter details manually.", 'error');
      }
    } catch (error) {
      console.error("Error fetching book details:", error);
      setScanStatus('error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleIsbnKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Stop form submission
      fetchBookDetails(formData.isbn || '');
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Book);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-zinc-950 border border-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-sm text-zinc-200 uppercase tracking-wide">{initialData ? 'Edit Asset' : 'Register New Asset'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 rounded-lg transition-all text-zinc-500 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {statusMsg && (
          <div className={`mx-6 mt-4 p-3 rounded-xl border flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${statusMsg.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-[10px] font-bold uppercase tracking-tight">{statusMsg.text}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto no-scrollbar">

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Resource ISBN/UPC</label>
              <div className="relative flex gap-2">
                <input
                  ref={isbnInputRef}
                  className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none text-white transition-all font-mono placeholder:text-zinc-700"
                  value={formData.isbn}
                  onKeyDown={handleIsbnKeyDown}
                  onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="Enter or scan identifier..."
                />
                <button
                  type="button"
                  onClick={() => fetchBookDetails(formData.isbn || '')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-all uppercase tracking-wider"
                >
                  Fetch
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Title</label>
                <input
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none text-white transition-all placeholder:text-zinc-700"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Author</label>
                <input
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none text-white transition-all placeholder:text-zinc-700"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Asset ID</label>
                <input
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none font-mono text-white transition-all placeholder:text-zinc-700"
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Category</label>
                <input
                  required
                  list="categories"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none text-white transition-all placeholder:text-zinc-700"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Inventory Count</label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none text-white transition-all placeholder:text-zinc-700"
                  value={formData.totalCopies}
                  onChange={e => {
                    const newVal = parseInt(e.target.value) || 0;
                    const oldTotal = formData.totalCopies || 0;
                    const diff = newVal - oldTotal;

                    setFormData({
                      ...formData,
                      totalCopies: newVal,
                      availableCopies: initialData ? Math.max(0, (formData.availableCopies || 0) + diff) : newVal
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Asset Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none text-white transition-all placeholder:text-zinc-700"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Display Profile</label>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-16 bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden shrink-0 shadow-inner">
                  <img src={formData.coverUrl} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://picsum.photos/seed/book/400/600')} alt="Cover Preview" />
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Cover artwork URL..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:border-emerald-500/50 outline-none text-white transition-all placeholder:text-zinc-700"
                    value={formData.coverUrl}
                    onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="coverUpload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setIsFetching(true);
                            const url = await import('../api').then(m => m.api.uploadImage(file));
                            setFormData({ ...formData, coverUrl: url });
                            setStatusMsg("Cover image uploaded successfully!");
                          } catch (err: any) {
                            setStatusMsg("Upload failed: " + err.message, 'error');
                          } finally {
                            setIsFetching(false);
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="coverUpload"
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-white rounded-lg cursor-pointer border border-zinc-800 transition-all inline-flex items-center gap-1.5 uppercase tracking-wider"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {isFetching ? 'Uploading...' : 'Local File'}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-zinc-900/50">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wider">Discard</button>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
                {initialData ? 'Update Asset' : 'Register Asset'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookForm;
