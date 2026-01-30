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
    <div className="fixed inset-0 bg-[#f0f2f5]/40 backdrop-blur-xl flex items-center justify-center z-[9999] p-4">
      <div className="neo-card w-full max-w-md rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-white/40 bg-white/10 flex justify-between items-center shrink-0">
          <h3 className="font-black text-[10px] text-gray-500 uppercase tracking-[0.2em]">{initialData ? 'Edit Asset Specs' : 'Register New Resource'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl neo-button flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {statusMsg && (
          <div className={`mx-8 mt-6 p-4 rounded-2xl neo-inset flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${statusMsg.type === 'success' ? 'text-teal-600' : 'text-rose-500'
            }`}>
            <div className={`w-2 h-2 rounded-full ${statusMsg.type === 'success' ? 'bg-teal-500' : 'bg-rose-500'} animate-pulse`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">{statusMsg.text}</span>
          </div>
        )}

        <div className="p-8 overflow-y-auto no-scrollbar">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Resource ISBN/UPC</label>
              <div className="relative flex gap-3">
                <input
                  ref={isbnInputRef}
                  className="neo-input flex-1 rounded-2xl px-6 py-3.5 text-sm outline-none transition-all font-bold placeholder:text-gray-400/50"
                  value={formData.isbn}
                  onKeyDown={handleIsbnKeyDown}
                  onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="Scan or enter ID..."
                />
                <button
                  type="button"
                  onClick={() => fetchBookDetails(formData.isbn || '')}
                  className="neo-button px-6 py-3 text-[10px] uppercase font-black tracking-widest text-teal-600"
                >
                  Fetch
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Resource Title</label>
                <input
                  required
                  className="neo-input w-full rounded-2xl px-6 py-3.5 text-sm font-bold"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Main Author/Writer</label>
                <input
                  required
                  className="neo-input w-full rounded-2xl px-6 py-3.5 text-sm font-bold"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Internal UID</label>
                <input
                  required
                  className="neo-input w-full rounded-2xl px-6 py-3.5 font-bold text-sm"
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Classification</label>
                <input
                  required
                  list="categories"
                  className="neo-input w-full rounded-2xl px-6 py-3.5 text-sm font-bold"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">In Stock</label>
                <input
                  type="number"
                  min="1"
                  className="neo-input w-full rounded-2xl px-6 py-3.5 text-sm font-bold"
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Asset Value (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="neo-input w-full rounded-2xl px-6 py-3.5 text-sm font-bold"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Visual Profile</label>
              <div className="flex gap-6 items-center">
                <div className="w-16 h-20 neo-inset rounded-2xl overflow-hidden shrink-0">
                  <img src={formData.coverUrl} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://picsum.photos/seed/book/400/600')} alt="Cover Preview" />
                </div>
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    placeholder="Source artwork URL..."
                    className="neo-input w-full rounded-xl px-4 py-2.5 text-[10px] font-bold"
                    value={formData.coverUrl}
                    onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                  />
                  <div className="flex gap-3">
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
                      className="neo-button px-4 py-2.5 text-[9px] flex items-center justify-center gap-2 uppercase font-black text-gray-500 hover:text-teal-600 cursor-pointer w-full transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {isFetching ? 'Syncing...' : 'Local File'}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end gap-4 border-t border-white/40">
              <button type="button" onClick={onClose} className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors tracking-widest">Cancel</button>
              <button type="submit" className="accent-teal shadow-[0_10px_20px_rgba(155,194,185,0.3)] hover:scale-[1.02] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                {initialData ? 'Patch Specs' : 'Commit Resource'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookForm;
