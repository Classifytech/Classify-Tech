import React, { useState, useEffect } from 'react';
import { PhotoItem } from '../data/photographyData.ts';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Camera, Sparkles, Sliders, Info, Download } from 'lucide-react';

interface PhotoModalProps {
  photo: PhotoItem | null;
  allPhotos: PhotoItem[];
  onClose: () => void;
  onSelectPhoto: (p: PhotoItem) => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  photo,
  allPhotos,
  onClose,
  onSelectPhoto,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // Safe currentIndex calculated before any hook calls
  const currentIndex = photo ? Math.max(0, allPhotos.findIndex((p) => p.id === photo.id)) : 0;

  // Keyboard navigation & Esc to close
  useEffect(() => {
    if (!photo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        const prevIdx = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
        onSelectPhoto(allPhotos[prevIdx]);
        setIsZoomed(false);
      }
      if (e.key === 'ArrowRight') {
        const nextIdx = (currentIndex + 1) % allPhotos.length;
        onSelectPhoto(allPhotos[nextIdx]);
        setIsZoomed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, allPhotos, currentIndex, onClose, onSelectPhoto]);

  // Lock background scroll safely
  useEffect(() => {
    if (!photo) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [photo]);

  if (!photo) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
    onSelectPhoto(allPhotos[prevIdx]);
    setIsZoomed(false);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (currentIndex + 1) % allPhotos.length;
    onSelectPhoto(allPhotos[nextIdx]);
    setIsZoomed(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-5 overflow-y-auto overscroll-contain animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Top Bar Floating Controls */}
      <div className="absolute top-3 left-3 right-3 sm:top-5 sm:left-6 sm:right-6 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse"></span>
          <span className="text-xs font-black uppercase tracking-wider text-white truncate max-w-[190px] sm:max-w-none">
            {photo.category} • {photo.device}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            aria-label="Toggle Zoom"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/80 border border-white/20 text-white hover:text-[#00f2fe] flex items-center justify-center transition cursor-pointer shadow-lg"
            title={isZoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          <a
            href={photo.highResUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Full High Resolution File"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/80 border border-white/20 text-white hover:text-[#00e676] flex items-center justify-center transition cursor-pointer shadow-lg"
            title="Download / View High Resolution"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            aria-label="Close Lightbox"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/80 border border-white/20 text-white hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition cursor-pointer shadow-lg"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        aria-label="Previous Photo"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/75 border border-white/20 text-white hover:bg-[#00f2fe] hover:text-black flex items-center justify-center transition shadow-2xl cursor-pointer"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next Photo"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/75 border border-white/20 text-white hover:bg-[#00f2fe] hover:text-black flex items-center justify-center transition shadow-2xl cursor-pointer"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Content Modal Container */}
      <div 
        className="w-full max-w-6xl max-h-[92vh] sm:max-h-[88vh] flex flex-col lg:flex-row rounded-3xl overflow-hidden glass-card border border-white/15 my-auto bg-slate-950/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* High-Resolution Image Canvas: sized responsively to never push the sidebar off screen */}
        <div 
          className="relative bg-black flex items-center justify-center overflow-hidden h-48 sm:h-64 md:h-72 lg:h-auto lg:flex-1 shrink-0 cursor-zoom-in"
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <img
            src={photo.highResUrl}
            alt={photo.title}
            className={`max-w-full max-h-full object-contain transition-all duration-300 ease-out select-none ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
            }`}
          />
          <div className="absolute bottom-2 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-slate-300 border border-white/10 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#00f2fe]" /> High Resolution Sample • {photo.rating}
          </div>
        </div>

        {/* Sidebar with Metadata and Smoothly Scrollable Technical EXIF Parameters */}
        <div className="w-full lg:w-96 p-4 sm:p-6 bg-slate-900/90 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between overflow-hidden min-h-0 flex-1 lg:flex-initial shrink lg:shrink-0">
          
          {/* Scrollable container for camera details and EXIF parameters */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 pr-1 scrollbar-thin">
            <div>
              <div className="inline-flex px-2 py-0.5 rounded-md bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] text-[10px] font-black uppercase mb-1.5">
                {photo.category} Photography
              </div>
              <h3 id="photo-modal-title" className="text-base sm:text-lg font-black text-white leading-snug">
                {photo.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {photo.description}
              </p>
            </div>

            {/* Hardware & Sensor Info */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#00f2fe]" /> Camera System
              </div>
              <div className="text-xs font-bold text-white">{photo.device}</div>
              <div className="text-[11px] text-slate-400 font-medium">{photo.sensor}</div>
            </div>

            {/* Technical EXIF Parameters: Smoothly scrollable with no clipping */}
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 space-y-2.5">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#00f2fe] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Technical EXIF Parameters
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Focal Length</div>
                  <div className="font-bold text-white font-mono">{photo.exif.focalLength}</div>
                </div>
                <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Aperture</div>
                  <div className="font-bold text-white font-mono">{photo.exif.aperture}</div>
                </div>
                <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Shutter Speed</div>
                  <div className="font-bold text-white font-mono">{photo.exif.shutter}</div>
                </div>
                <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Sensitivity</div>
                  <div className="font-bold text-white font-mono">{photo.exif.iso}</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-xl">
                Lens Optics: <span className="text-slate-200">{photo.exif.lens}</span>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Photo {currentIndex + 1} of {allPhotos.length}
            </span>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
