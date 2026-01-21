
import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../types';
import { Html5QrcodeScanner } from 'html5-qrcode';

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

  const [isScanning, setIsScanning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isbnInputRef = useRef<HTMLInputElement>(null);

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
        alert("No metadata found for this ISBN. Please enter details manually.");
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

  const startScanner = () => {
    setIsScanning(true);
    setScanStatus('idle');
    setTimeout(() => {
      // Optimized for 1D Barcodes (ISBN)
      scannerRef.current = new Html5QrcodeScanner(
        "barcode-reader",
        {
          fps: 20,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        /* verbose= */ false
      );
      scannerRef.current.render((decodedText) => {
        // Success
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
        setIsScanning(false);
        setFormData(prev => ({ ...prev, isbn: decodedText }));
        fetchBookDetails(decodedText);
      }, (errorMessage) => {
        // Silently handle scan errors (common during focus)
      });
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => setIsScanning(false)).catch(() => setIsScanning(false));
    } else {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Book);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#0c0c0e] border border-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-zinc-900 flex justify-between items-center shrink-0 bg-zinc-900/10">
          <h3 className="font-semibold text-sm text-white/90">{initialData ? 'Edit Asset' : 'Register New Asset'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-all text-zinc-500 hover:text-zinc-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar">
          {/* Scanner Option */}
          <div className="relative mb-8">
            {!isScanning ? (
              <button
                type="button"
                onClick={startScanner}
                disabled={isFetching}
                className="w-full py-8 border border-zinc-900 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 group hover:border-zinc-700 hover:bg-zinc-900/30 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500 transition-colors group-hover:border-zinc-700">
                  {isFetching ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-medium text-white/60">
                    {isFetching ? 'Processing metadata...' : 'Quick Scan with Camera'}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">Laser scanner integration active</p>
                </div>
              </button>
            ) : (
              <div className="w-full bg-[#09090b] border border-zinc-900 rounded-xl overflow-hidden p-4 relative">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <p className="text-[10px] font-medium text-emerald-500/90 uppercase tracking-wider">Scanner Active</p>
                  </div>
                  <button onClick={stopScanner} className="text-[10px] font-medium text-zinc-500 hover:text-white transition-colors">Close Camera</button>
                </div>

                <div className="relative">
                  <div id="barcode-reader" className="overflow-hidden rounded-lg grayscale invert hue-rotate-180 brightness-110 contrast-125 border border-zinc-800"></div>
                  {/* Visual Guide Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.5)] z-10 pointer-events-none"></div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[9px] text-zinc-600 leading-relaxed italic">
                    Place the book barcode clearly inside the frame.<br />
                    Ensure good lighting and avoid reflections.
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Resource ISBN/UPC</label>
              <div className="relative flex gap-2">
                <input
                  ref={isbnInputRef}
                  className="flex-1 bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none text-white/90 transition-all font-mono placeholder:text-zinc-800"
                  value={formData.isbn}
                  onKeyDown={handleIsbnKeyDown}
                  onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="Enter or scan identifier..."
                />
                <button
                  type="button"
                  onClick={() => fetchBookDetails(formData.isbn || '')}
                  className="px-4 py-2 bg-zinc-900 hover:border-zinc-800 text-[11px] font-medium text-zinc-400 rounded-xl border border-zinc-900 transition-all active:scale-95"
                >
                  Fetch
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Title</label>
                <input
                  required
                  className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none text-white/90 transition-all"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Author</label>
                <input
                  required
                  className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none text-white/90 transition-all"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Asset ID</label>
                <input
                  required
                  className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none font-mono text-white/90 transition-all"
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Category</label>
                <input
                  required
                  list="categories"
                  className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none text-white/90 transition-all"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Inventory Count</label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none text-white/90 transition-all"
                  value={formData.totalCopies}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, totalCopies: val, availableCopies: initialData ? formData.availableCopies : val });
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Asset Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none text-white/90 transition-all"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Display Profile</label>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-16 bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden shrink-0 shadow-inner">
                  <img src={formData.coverUrl} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://picsum.photos/seed/book/400/600')} alt="Cover Preview" />
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Cover artwork URL..."
                    className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2 text-xs focus:border-zinc-700 outline-none text-white/90 transition-all"
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
                          } catch (err) {
                            alert("Upload failed: " + err);
                          } finally {
                            setIsFetching(false);
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="coverUpload"
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-zinc-400 rounded-lg cursor-pointer border border-zinc-900 transition-all inline-flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {isFetching ? 'Uploading...' : 'Local File'}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 bg-[#0c0c0e]">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">Discard</button>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-xs font-medium transition-all shadow-lg shadow-emerald-900/10 active:scale-95">
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
