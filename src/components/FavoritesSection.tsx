import React from 'react';
import {
  type FavoriteItem,
  type FavoriteArticleItem,
} from '../utils/favorites.ts';
import { TechArticle } from '../data/newsData.ts';
import {
  Heart,
  Trash2,
  ArrowRight,
  Clock,
  Newspaper,
  BookmarkCheck,
} from 'lucide-react';
import { handleImageFallback } from '../utils/imageFallback.ts';

interface FavoritesSectionProps {
  favorites: FavoriteItem[];
  onToggleFavoriteArticle: (article: TechArticle) => void;
  onClearAllFavorites: () => void;
  onSelectArticle: (article: TechArticle) => void;
  onShowToast: (msg: string) => void;
}

export const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  favorites,
  onToggleFavoriteArticle,
  onClearAllFavorites,
  onSelectArticle,
  onShowToast,
}) => {
  const handleClearAll = () => {
    if (favorites.length === 0) return;
    onClearAllFavorites();
    onShowToast('Personal Favorites cleared.');
  };

  return (
    <section id="favoritesSection" className="space-y-4 sm:space-y-6 pt-2 w-full scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-black text-[#ff2a85] uppercase tracking-wider mb-1.5">
            <Heart className="w-3.5 h-3.5 fill-[#ff2a85] text-[#ff2a85]" />
            <span>Personal Vault • Local Browser Storage</span>
            {favorites.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#ff2a85]/20 text-[#ff2a85] border border-[#ff2a85]/40 text-[10px] font-black">
                {favorites.length} {favorites.length === 1 ? 'article' : 'articles'}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            My Saved <span className="grad-text">Tech Articles</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Quickly revisit bookmarked breaking tech news, hardware breakdowns, and editorial stories.
          </p>
        </div>

        {/* Clear All / Counter Actions */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0 flex-wrap">
          {favorites.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="pill-3d px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-rose-300 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              title="Clear all saved favorites"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <div className="text-[11px] text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
            <BookmarkCheck className="w-3.5 h-3.5 text-[#00f2fe]" />
            <span>Auto-synced</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className="glass-card rounded-3xl border border-white/10 p-8 sm:p-12 text-center max-w-2xl mx-auto flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#ff2a85]/20 to-[#8a2be2]/20 border border-[#ff2a85]/30 flex items-center justify-center shadow-inner">
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-[#ff2a85] stroke-[1.5]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">No Articles Saved Yet</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Tap the heart icon (<Heart className="w-3 h-3 inline text-[#ff2a85] fill-[#ff2a85]" />) on any tech news article to curate your personalized reading list.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#techNewsSection"
              className="pill-3d px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30 hover:bg-cyan-500/25 text-[#00f2fe] text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Explore Tech News</span>
            </a>
          </div>
        </div>
      ) : (
        /* Favorites Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
          {favorites.map((fav) => {
            const article = (fav as FavoriteArticleItem).data;
            return (
              <article
                key={`fav-article-${article.id}`}
                onClick={() => onSelectArticle(article)}
                className="glass-card glass-card-hover rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between group border border-white/10 hover:border-[#ff2a85] transition duration-300 relative"
              >
                {/* Article Thumbnail */}
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  <img
                    src={article.img}
                    alt={article.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageFallback(e, article.category)}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1220] via-transparent to-black/30" />

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase text-black bg-[#00f2fe] shadow-sm">
                    {article.badge}
                  </div>

                  {/* Un-favorite Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavoriteArticle(article);
                    }}
                    aria-label={`Remove ${article.title} from favorites`}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 hover:bg-black text-[#ff2a85] hover:scale-110 flex items-center justify-center transition border border-[#ff2a85]/50 shadow-lg cursor-pointer"
                    title="Remove from favorites"
                  >
                    <Heart className="w-4 h-4 fill-[#ff2a85] text-[#ff2a85]" />
                  </button>

                  <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] text-slate-300 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#00f2fe]" /> {article.time}
                  </div>
                </div>

                {/* Article Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-snug mb-2 group-hover:text-[#ff2a85] transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {article.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] text-[#00f2fe] font-black uppercase tracking-wide">
                      {article.badge || 'Tech Story'}
                    </span>

                    <span className="text-[#00f2fe] group-hover:text-[#ff2a85] inline-flex items-center gap-1 transition">
                      Read Story <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
