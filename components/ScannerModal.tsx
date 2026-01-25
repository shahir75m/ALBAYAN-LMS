import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerModalProps {
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScan }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            scannerRef.current = new Html5QrcodeScanner(
                "app-qr-reader",
                {
                    fps: 20,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                },
                /* verbose= */ false
            );

            scannerRef.current.render((decodedText) => {
                onScan(decodedText);
            }, (error) => {
                // Silently handle scan errors
            });
        }, 300);

        return () => {
            clearTimeout(timeout);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Scan QR Code</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Place the book QR inside the frame</p>
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

                <div className="p-6">
                    <div id="app-qr-reader" className="overflow-hidden rounded-2xl border border-zinc-800 bg-black"></div>
                    <p className="mt-4 text-center text-xs text-zinc-500 italic">
                        Scanning for Albayan Book identifiers...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScannerModal;
