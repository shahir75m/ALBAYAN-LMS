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
        setStatusMsg("Resource Metadata Fetched Successfully");
      } else {
        setScanStatus('error');
        setStatusMsg("Identity not found in global archive", 'error');
      }
    } catch (error) {
      setScanStatus('error');
      setStatusMsg("Archive Link error", 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleIsbnKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchBookDetails(formData.isbn || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Book);
  };

  const GlassInput = ({ label, ...props }: any) => (
    <div>
      <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 px-1">{label}</label>
      <input
        {...props}
        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-800 focus:bg-white/[0.05] focus:glow-emerald outline-none transition-all"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-700" onClick={onClose}></div>
      <div className="relative w-full max-w-lg glass-main border-white/5 rounded-[3.5rem] overflow-hidden animate-in zoom-in duration-500 flex flex-col max-h-[90vh]">
        <div className="px-10 py-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
          <h3 className="font-black text-[10px] text-zinc-400 uppercase tracking-[0.4em]">{initialData ? 'Update Asset' : 'Register New Asset'}</h3>
          <button onClick={onClose} className="p-3 glass-card rounded-full text-zinc-600 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 p-10 overflow-y-auto no-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-8">
            {statusMsg && (
              <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${statusMsg.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                <div className={`w-2 h-2 rounded-full ${statusMsg.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`}></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{statusMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 px-1">Resource Hash (ISBN/UPC)</label>
              <div className="relative flex gap-3">
                <input
                  ref={isbnInputRef}
                  className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-800 focus:bg-white/[0.05] focus:glow-emerald outline-none transition-all font-mono"
                  value={formData.isbn}
                  onKeyDown={handleIsbnKeyDown}
                  onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="Scan identifier..."
                />
                <button
                  type="button"
                  onClick={() => fetchBookDetails(formData.isbn || '')}
                  className="px-8 bg-zinc-900 border border-white/5 text-[10px] font-black text-zinc-500 hover:text-white rounded-2xl transition-all uppercase tracking-[0.2em] hover:bg-zinc-800"
                >
                  Sync
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <GlassInput label="Asset Title" required value={formData.title} onChange={(e: any) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="col-span-2">
                <GlassInput label="Originator (Author)" required value={formData.author} onChange={(e: any) => setFormData({ ...formData, author: e.target.value })} />
              </div>
              <GlassInput label="Node Reference" required value={formData.id} onChange={(e: any) => setFormData({ ...formData, id: e.target.value })} />
              <GlassInput label="Category Cluster" required value={formData.category} onChange={(e: any) => setFormData({ ...formData, category: e.target.value })} />
              <GlassInput label="Units in Stock" type="number" min="1" value={formData.totalCopies} onChange={(e: any) => {
                const newVal = parseInt(e.target.value) || 0;
                const diff = newVal - (formData.totalCopies || 0);
                setFormData({ ...formData, totalCopies: newVal, availableCopies: initialData ? Math.max(0, (formData.availableCopies || 0) + diff) : newVal });
              }} />
              <GlassInput label="Unit Value (INR)" type="number" step="1" value={formData.price} onChange={(e: any) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
            </div>

            <div>
              <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-3 px-1">Display Architecture</label>
              <div className="flex gap-6 items-center p-6 glass-card rounded-[2.5rem] border-white/5">
                <div className="w-16 h-24 glass-card border-white/10 rounded-2xl overflow-hidden shrink-0 glow-emerald">
                  <img src={formData.coverUrl} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://picsum.photos/seed/book/400/600')} alt="Asset Preview" />
                </div>
                <div className="flex-1 space-y-4">
                  <input
                    type="text"
                    placeholder="External link to artwork..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 text-xs text-white focus:glow-emerald outline-none transition-all placeholder:text-zinc-800"
                    value={formData.coverUrl}
                    onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <input type="file" accept="image/*" className="hidden" id="coverUpload" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setIsFetching(true);
                          const url = await import('../api').then(m => m.api.uploadImage(file));
                          setFormData({ ...formData, coverUrl: url });
                          setStatusMsg("Display synchronised");
                        } catch (err: any) {
                          setStatusMsg("Sync error: " + err.message, 'error');
                        } finally {
                          setIsFetching(false);
                        }
                      }
                    }} />
                    <label htmlFor="coverUpload" className="px-6 py-2.5 glass-card border-white/5 text-[10px] font-black text-zinc-500 hover:text-white rounded-xl cursor-pointer transition-all inline-flex items-center gap-3 uppercase tracking-[0.2em] hover:bg-white/5">
                      <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {isFetching ? 'Synchronising...' : 'Local Source'}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 flex justify-end gap-6 border-t border-white/5">
              <button type="button" onClick={onClose} className="px-6 text-[10px] font-black text-zinc-600 hover:text-white transition-all uppercase tracking-[0.3em]">Discard</button>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all glow-emerald shadow-xl shadow-emerald-900/20 active:scale-[0.97]">
                {initialData ? 'Update Core' : 'Execute Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookForm;
