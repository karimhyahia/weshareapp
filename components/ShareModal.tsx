
import React from 'react';
import QRCode from 'react-qr-code';
import { X, Download, Layout as LayoutIcon, Hash } from 'lucide-react';
import { Button } from './ui/Button';
import { CardData } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CardData;
  onUpdate: (data: CardData) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data, onUpdate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 transition-all max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Share your card</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center space-y-6">
          
          {/* QR Code Preview */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm relative group">
             <div className="relative">
                <QRCode 
                    value={`https://weshare.site/u/${data.profile.name.replace(/\s+/g, '').toLowerCase()}`} 
                    size={200}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                    fgColor={data.qrColor}
                    level="H"
                />
                {data.showQrLogo && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-xl p-1 flex items-center justify-center shadow-lg border border-slate-100">
                        {data.company.logoUrl ? (
                            <img 
                                src={data.company.logoUrl} 
                                alt="Logo" 
                                className="w-full h-full object-cover rounded-lg" 
                            />
                        ) : (
                            <div className={`w-full h-full rounded-lg flex items-center justify-center text-white transition-colors duration-300`} style={{ backgroundColor: data.qrColor }}>
                                <LayoutIcon size={20} />
                            </div>
                        )}
                    </div>
                )}
             </div>
          </div>

          {/* Customization Controls */}
          <div className="w-full bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100">
             <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block text-center">QR Color</label>
                <div className="flex gap-3 justify-center mb-3">
                    {[
                        '#0f172a', '#2563eb', '#7c3aed', '#db2777', '#059669',
                    ].map((color) => (
                        <button
                            key={color}
                            onClick={() => onUpdate({ ...data, qrColor: color })}
                            className={`
                                w-8 h-8 rounded-full transition-all duration-200 
                                ${data.qrColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'}
                            `}
                            style={{ backgroundColor: color }}
                            aria-label={`Set QR color to ${color}`}
                        />
                    ))}
                </div>
                
                <div className="flex items-center justify-center">
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 gap-3">
                       <span className="text-xs text-slate-600 font-medium pl-1">Custom</span>
                       <div className="flex items-center gap-2">
                            <div className="relative w-6 h-6 rounded-full overflow-hidden shadow-sm border border-slate-200">
                                 <input 
                                    type="color" 
                                    value={data.qrColor}
                                    onChange={(e) => onUpdate({ ...data, qrColor: e.target.value })}
                                    className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer p-0 border-0"
                                 />
                            </div>
                            <div className="relative">
                                <Hash size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text"
                                    value={data.qrColor.replace('#', '')}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^[0-9A-F]{0,6}$/i.test(val)) {
                                             onUpdate({ ...data, qrColor: '#' + val });
                                        }
                                    }}
                                    className="w-16 pl-4 py-0.5 text-xs rounded border border-slate-200 uppercase"
                                />
                            </div>
                       </div>
                    </div>
                </div>
             </div>
             
             <div className="h-px bg-slate-200 w-full"></div>

             <div className="flex items-center justify-between px-2">
                 <span className="text-sm font-medium text-slate-700">Show Logo</span>
                 <button 
                    onClick={() => onUpdate({ ...data, showQrLogo: !data.showQrLogo })}
                    className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                        ${data.showQrLogo ? 'bg-slate-900' : 'bg-slate-300'}
                    `}
                 >
                    <span className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm
                        ${data.showQrLogo ? 'translate-x-6' : 'translate-x-1'}
                    `} />
                 </button>
             </div>
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-slate-900">Scan to view profile</p>
            <p className="text-xs text-slate-500">weshare.site/u/{data.profile.name.replace(/\s+/g, '').toLowerCase()}</p>
          </div>

          <div className="flex gap-3 w-full pt-2">
             <Button 
                variant="outline" 
                fullWidth 
                onClick={() => alert("Simulation: Image downloaded!")}
                icon={<Download size={16} />}
             >
                Save
             </Button>
             <Button 
                fullWidth
                onClick={() => {
                    navigator.clipboard.writeText(`https://weshare.site/u/${data.profile.name.replace(/\s+/g, '').toLowerCase()}`);
                    alert("Link copied to clipboard!");
                }}
             >
                Copy Link
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
