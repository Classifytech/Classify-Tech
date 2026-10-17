import React, { useState } from 'react';
import { PhotoItem } from '../data/photographyData.ts';
import { Camera, ZoomIn, Sliders, Sparkles } from 'lucide-react';

interface PhotographySectionProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem) => void;
}

export const PhotographySection: React.FC<PhotographySectionProps> = ({
  photos,
  onSelectPhoto,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Nightscape', 'Portrait', 'Architecture', 'Macro', 'Street'];

  const filteredPhotos = photos.filter((p) => {
    if (activeCategory === 'All') return true;
    return p.category === activeCategory;
  });

  return (
    <section id="photoSection" className="space-y-4 sm:space-y-6 pt-2 w-full">
      
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-black text-[#ff2a85] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Camera className="w-3.5 h-3.5" /> Optical Samples & High-Resolution Portfolio
          </span>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
            Smartphone Camera <span className="grad-text">Photography Showcase</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Uncompressed optical camera samples captured across flagship Sony and Samsung sensors. Inspect dynamic range, portrait separation, astrophotography, and macro textures in high-res.
          </p>
        </div>

        <div className="text-[11px] text-slate-300 bg-pink-500/10 border border-pink-500/25 px-3 py-1.5 rounded-xl self-start lg:self-auto flex items-center gap-1.5 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#ff2a85]" /> Interactive High-Res Lightbox with EXIF
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            role="tab"
            aria-selected={activeCategory === cat}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-[#ff2a85] to-[#8a2be2] text-white shadow-md shadow-pink-500/20'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            {cat === 'All' ? '🌟 All Samples' : cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => onSelectPhoto(photo)}
            className="group glass-card glass-card-hover rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-pink-500/50 flex flex-col justify-between transition-all duration-300"
          >
            <div className="relative h-56 sm:h-64 bg-slate-950 overflow-hidden">
              <img
                src={photo.thumbUrl}
                alt={photo.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1220] via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition" />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-black/80 text-white backdrop-blur-md border border-white/15">
                  {photo.category}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-[#ff2a85]/90 text-white shadow-sm">
                  {photo.rating}
                </span>
              </div>

              {/* Hover Zoom Icon */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                <ZoomIn className="w-4 h-4 text-[#00f2fe]" />
              </div>

              {/* Device Bottom Banner */}
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                <span className="font-bold text-white truncate max-w-[60%]">{photo.device}</span>
                <span className="text-[#00f2fe] font-mono text-[10px]">{photo.exif.aperture} • {photo.exif.shutter}</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-black text-white text-sm sm:text-base leading-snug group-hover:text-[#00f2fe] transition">
                  {photo.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {photo.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[70%] font-medium text-slate-300">
                  {photo.sensor}
                </span>
                <span className="text-[#00f2fe] font-bold inline-flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> EXIF Data
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};
