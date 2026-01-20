
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
    setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner(
        "barcode-reader",
        { fps: 10, qrbox: { width: 250, height: 150 } },
        false
      );
      scannerRef.current.render((decodedText) => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
        setIsScanning(false);
        setFormData(prev => ({ ...prev, isbn: decodedText }));
        fetchBookDetails(decodedText);
      }, (error) => { });
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
    <div className="fixed inset-0 z-[9999]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>

      <div className="fixed inset-0 z-10 overflow-y-auto bg-zinc-950">
        <div className="flex min-h-screen items-start justify-center text-center sm:items-start sm:p-0">
          <div className="relative transform overflow-hidden bg-zinc-950 text-left shadow-2xl transition-all w-full min-h-screen flex flex-col">
            <div className="px-10 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 shrink-0 sticky top-0 z-50 backdrop-blur-xl">
              <div>
                <h3 className="font-black text-xl uppercase tracking-tighter text-white">
                  {initialData ? 'Edit Archive' : 'Add New Volume'}
                </h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Resource Management Portal</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all text-zinc-500 hover:text-white border border-transparent hover:border-zinc-700">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-10 space-y-8 flex-1 max-w-5xl mx-auto w-full">
              {/* Camera Scanner Section */}
              <div className="relative group w-full">
                {!isScanning ? (
                  <button
                    type="button"
                    onClick={startScanner}
                    disabled={isFetching}
                    className={`w-full py-6 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all hover:border-emerald-500/50 group ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
                      <svg className={`w-8 h-8 ${isFetching ? 'text-zinc-500 animate-spin' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isFetching ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-widest">
                        {isFetching ? 'Retrieving Metadata...' : 'Use Camera Scanner'}
                      </p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center mt-1">Or scan with your physical laser scanner below</p>
                    </div>
                  </button>
                ) : (
                  <div className="w-full bg-zinc-950 border-2 border-emerald-500/30 rounded-[2rem] overflow-hidden p-6">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Position barcode within frame</p>
                      <button onClick={stopScanner} className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest">Cancel Scan</button>
                    </div>
                    <div id="barcode-reader" className="overflow-hidden rounded-2xl"></div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full">
                <div className="w-full">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2.5">
                    ISBN / Barcode
                    <span className="ml-2 text-emerald-500/60 lowercase italic font-normal tracking-normal">(Laser scanner ready)</span>
                  </label>
                  <div className="relative flex gap-2">
                    <input
                      ref={isbnInputRef}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all font-mono placeholder:text-zinc-800"
                      value={formData.isbn}
                      onKeyDown={handleIsbnKeyDown}
                      onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="Scan barcode here..."
                    />
                    <button
                      type="button"
                      onClick={() => fetchBookDetails(formData.isbn || '')}
                      className="px-6 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase text-zinc-300 rounded-2xl transition-all border border-zinc-700"
                    >
                      Fetch
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2.5">Book Title</label>
                  <input
                    required
                    placeholder="The Alchemist"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all placeholder:text-zinc-800"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2.5">Author(s)</label>
                  <input
                    required
                    placeholder="Paulo Coelho"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all placeholder:text-zinc-800"
                    value={formData.author}
                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2.5">Catalog ID</label>
                  <input
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-mono text-white transition-all placeholder:text-zinc-800"
                    value={formData.id}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g. B1234"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2.5">Category</label>
                  <input
                    required
                    list="categories"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all placeholder:text-zinc-800"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Fiction"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2.5">Stock Count</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all"
                    value={formData.totalCopies}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, totalCopies: val, availableCopies: initialData ? formData.availableCopies : val });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2.5">Valuation ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2.5">Cover Image</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-20 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shrink-0">
                      <img src={formData.coverUrl} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://picsum.photos/seed/book/400/600')} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Image URL"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all"
                        value={formData.coverUrl}
                        onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                      />
                      <div className="relative">
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
                          className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase text-zinc-300 rounded-xl cursor-pointer border border-zinc-700 transition-all"
                        >
                          {isFetching ? 'Uploading...' : 'Upload from Local'}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-end items-center gap-6">
                  <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all">Discard Changes</button>
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-emerald-900/40 active:scale-95">
                    {initialData ? 'Update Archive' : 'Commit to Database'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookForm;
