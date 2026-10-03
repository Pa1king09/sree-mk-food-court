import React, { useState, useEffect } from 'react';
import { X, QrCode, Wifi, Copy, Check, Printer } from 'lucide-react';
import QRCode from 'qrcode';

interface ShareQrModalProps {
  onClose: () => void;
}

export const ShareQrModal: React.FC<ShareQrModalProps> = ({ onClose }) => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Determine the current public URL
    const url = import.meta.env.VITE_PUBLIC_URL || (window.location.origin + '/');
    setCurrentUrl(url);

    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0c2419',
        light: '#ffffff'
      }
    }).then(setQrDataUrl).catch(console.error);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-forest-950 border border-gold-600/50 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 text-cream-300 hover:text-white rounded-lg hover:bg-forest-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="w-12 h-12 bg-forest-900 border border-gold-500/40 rounded-full flex items-center justify-center mx-auto mb-3 text-gold-400 shadow">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-serif font-bold text-gold-400 mb-1">
          Scan for Menu
        </h3>
        <p className="text-xs text-cream-200 mb-4">
          Connect to restaurant Wi-Fi & scan from any smartphone.
        </p>

        {/* QR Code Canvas / Image */}
        <div className="bg-white p-3 rounded-xl inline-block shadow-lg border-2 border-gold-500/60 mb-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Menu QR Code" className="w-56 h-56 mx-auto rounded" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-forest-900 font-semibold">
              Generating QR...
            </div>
          )}
        </div>

        {/* Local Network URL Pill */}
        <div className="flex items-center justify-between bg-forest-900 border border-forest-700 rounded-lg px-3 py-2 text-xs font-mono text-cream-200 mb-4">
          <span className="truncate mr-2">{currentUrl}</span>
          <button
            onClick={handleCopy}
            className="text-gold-400 hover:text-gold-300 flex-shrink-0 flex items-center space-x-1"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Network & Access notice */}
        <div className="bg-forest-900/80 rounded-lg p-2.5 text-[11px] text-cream-300 text-left border border-forest-800 flex items-start space-x-2">
          <Wifi className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
          <p>
            Scan with any smartphone camera to open the live menu instantly. Works on mobile data or any Wi-Fi connection even when restaurant computers are turned off.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold text-xs shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print QR Card</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-forest-800 hover:bg-forest-700 text-cream-100 font-semibold text-xs border border-forest-700 transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
