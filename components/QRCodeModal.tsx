import React, { useEffect, useState } from 'react';
import { Book } from '../types';
import { generateBookQRCode, downloadQRCode, printQRCode } from '../utils/qrcode';

interface QRCodeModalProps {
    book: Book;
    onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ book, onClose }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const generateQR = async () => {
            try {
                setLoading(true);
                const url = await generateBookQRCode(book.id, 400);
                setQrCodeUrl(url);
            } catch (error) {
                console.error('Failed to generate QR code:', error);
            } finally {
                setLoading(false);
            }
        };

        generateQR();
    }, [book.id]);

    const handleDownload = () => {
        if (qrCodeUrl) {
            const filename = `${book.id}_${book.title.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
            downloadQRCode(qrCodeUrl, filename);
        }
    };

    const handlePrint = () => {
        if (qrCodeUrl) {
            printQRCode(qrCodeUrl, `${book.title} - ID: ${book.id}`);
        }
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(book.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">QR Code</h3>
                        <p className="text-xs text-zinc-500 mt-1">Scan to identify this book</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-all text-zinc-400 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* QR Code Display */}
                        <div className="flex-1 flex flex-col items-center">
                            <div className="bg-white p-6 rounded-2xl shadow-lg">
                                {loading ? (
                                    <div className="w-[400px] h-[400px] flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-zinc-300 border-t-emerald-500"></div>
                                    </div>
                                ) : (
                                    <img src={qrCodeUrl} alt="QR Code" className="w-[400px] h-[400px]" />
                                )}
                            </div>
                            <p className="text-xs text-zinc-600 mt-4 text-center italic">
                                Scan with any QR code reader
                            </p>
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 flex flex-col">
                            <div className="bg-zinc-800/50 border border-zinc-800 rounded-2xl p-6 mb-6">
                                <h4 className="text-lg font-bold text-white mb-2 line-clamp-2">{book.title}</h4>
                                <p className="text-sm text-zinc-400 mb-4">by {book.author}</p>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">
                                            Book ID
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-emerald-500 font-mono">
                                                {book.id}
                                            </code>
                                            <button
                                                onClick={handleCopyId}
                                                className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all text-zinc-400 hover:text-white"
                                                title="Copy ID"
                                            >
                                                {copied ? (
                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">
                                            Category
                                        </label>
                                        <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-500/20">
                                            {book.category}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">
                                            ISBN
                                        </label>
                                        <p className="text-sm text-zinc-300 font-mono">{book.isbn}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-auto space-y-3">
                                <button
                                    onClick={handleDownload}
                                    disabled={loading}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download PNG
                                </button>

                                <button
                                    onClick={handlePrint}
                                    disabled={loading}
                                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print QR Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;
