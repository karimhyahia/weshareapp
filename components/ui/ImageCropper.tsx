import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '../../LanguageContext';

interface ImageCropperProps {
    imageSrc: string;
    onCancel: () => void;
    onSave: (croppedImage: string) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCancel, onSave }) => {
    const { t } = useLanguage();
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        const viewportSize = 280;
        const fitScale = viewportSize / Math.max(naturalWidth, naturalHeight);
        setScale(fitScale);
    };

    const handleSave = () => {
        const img = imgRef.current;
        if (!img) return;

        const canvas = document.createElement('canvas');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        const viewportSize = 280;
        const ratio = size / viewportSize;

        ctx.translate(size / 2, size / 2);
        ctx.translate(position.x * ratio, position.y * ratio);
        ctx.scale(scale * ratio, scale * ratio);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        onSave(canvas.toDataURL('image/jpeg', 0.9));
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Adjust Photo</h3>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center gap-6">
                    <div className="relative overflow-hidden w-[280px] h-[280px] bg-slate-100 rounded-full border-4 border-white shadow-lg ring-1 ring-slate-200 cursor-move">
                        <div
                            ref={containerRef}
                            className="w-full h-full flex items-center justify-center"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Crop"
                                onLoad={handleImageLoad}
                                draggable={false}
                                className="max-w-none transition-transform duration-75 ease-linear"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    transformOrigin: 'center'
                                }}
                            />
                        </div>
                        <div className="absolute inset-0 pointer-events-none opacity-30">
                            <div className="w-full h-full border border-white/50 rounded-full"></div>
                            <div className="absolute top-1/2 left-0 w-full h-px bg-white/50"></div>
                            <div className="absolute top-0 left-1/2 w-px h-full bg-white/50"></div>
                        </div>
                    </div>

                    <div className="w-full px-4 flex items-center gap-4">
                        <ZoomOut size={16} className="text-slate-400" />
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.01"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                        />
                        <ZoomIn size={16} className="text-slate-400" />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex gap-3">
                    <Button variant="secondary" fullWidth onClick={onCancel}>{t('common.cancel')}</Button>
                    <Button variant="primary" fullWidth onClick={handleSave} icon={<Check size={16} />}>Apply</Button>
                </div>
            </div>
        </div>
    );
};
