import React from 'react';
import { LootDeal } from '../data/lootData.ts';
import { Flame, ExternalLink, Tag, ShieldCheck, Heart } from 'lucide-react';

interface LootSectionProps {
  deals: LootDeal[];
  favoriteIds?: Set<string>;
  onToggleFavorite?: (deal: LootDeal) => void;
  onShowToast: (msg: string) => void;
}

export const LootSection: React.FC<LootSectionProps> = ({
  deals,
  favoriteIds = new Set(),
  onToggleFavorite,
  onShowToast,
}) => {
  return (
    <section id="lootSection" className="space-y-4 sm:space-y-6 pt-2 w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-black text-[#00e676] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Flame className="w-4 h-4 text-[#00e676]" /> Verified Direct Retail Price Drops
          </span>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
            Classify <span className="grad-text">Universal Loot Hub</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Two verified mega price-cut slots updated daily across Flipkart and Amazon. Genuine discounts with instant 0.01s store redirection.
          </p>
        </div>

        <div className="text-[11px] text-slate-300 bg-emerald-500/10 border border-emerald-400/25 px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00e676]" /> 100% Authentic Seller Drops
        </div>
      </div>

      {/* Two Dedicated Loot Cards Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
        {deals.map((deal, idx) => {
          const isFav = favoriteIds.has(deal.id);
          const borderGradient = idx === 0
            ? 'from-[#00e676] via-[#00f2fe] to-[#8a2be2]'
            : 'from-[#00f2fe] via-[#8a2be2] to-[#ff2a85]';

          return (
            <div
              key={deal.id}
              className={`rounded-3xl p-[2px] bg-gradient-to-r ${borderGradient} shadow-2xl transition hover:scale-[1.01]`}
            >
              <div className="bg-[#090d18] rounded-[22px] p-4 sm:p-6 h-full flex flex-col justify-between gap-4">
                
                <div className="flex items-start gap-3.5 sm:gap-5">
                  <div className="relative shrink-0">
                    <img
                      src={deal.img}
                      alt={deal.title}
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover border border-white/10"
                    />
                    <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#00e676] text-black text-[10px] font-black shadow-md">
                      {deal.discount}
                    </span>
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[#00e676] text-[10px] font-black uppercase tracking-wider truncate">
                        <Tag className="w-3 h-3 shrink-0" /> <span className="truncate">{deal.badge} • {deal.store}</span>
                      </div>

                      {/* Favorite Heart Toggle */}
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(deal)}
                          aria-label={isFav ? `Remove ${deal.title} from favorites` : `Save ${deal.title} to favorites`}
                          aria-pressed={isFav}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition shrink-0 shadow-md ${
                            isFav
                              ? 'bg-rose-500 text-white scale-105 border border-rose-300 shadow-rose-500/30'
                              : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/20 hover:border-rose-400'
                          }`}
                          title={isFav ? 'Remove deal from favorites' : 'Save deal to favorites'}
                        >
                          <Heart className={`w-4 h-4 transition ${isFav ? 'fill-white text-white' : 'hover:text-rose-400'}`} />
                        </button>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                      {deal.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {deal.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Verified Loot Price</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-3xl font-black text-[#00e676]">{deal.price}</span>
                      <span className="text-xs sm:text-sm text-slate-500 line-through font-medium">{deal.mrp}</span>
                    </div>
                  </div>

                  <a
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grad-btn px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black shrink-0 inline-flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                  >
                    Grab Loot Deal <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
