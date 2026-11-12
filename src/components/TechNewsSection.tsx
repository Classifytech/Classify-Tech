import React, { useState } from 'react';
import { TechArticle } from '../data/newsData.ts';
import {
  Newspaper,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Flag,
  Heart,
  RefreshCw,
  Play,
  Youtube,
  ExternalLink,
} from 'lucide-react';
import { handleImageFallback } from '../utils/imageFallback.ts';

interface TechNewsSectionProps {
  articles: TechArticle[];
  favoriteIds?: Set<string>;
  isAdmin?: boolean;
  onSelectArticle: (article: TechArticle) => void;
  onReportArticle?: (article: TechArticle) => void;
  onToggleFavorite?: (article: TechArticle) => void;
  onRefreshRss?: () => void;
  isRssLoading?: boolean;
  lastRssSyncTime?: string;
}

export const TechNewsSection: React.FC<TechNewsSectionProps> = ({
  articles,
  favoriteIds = new Set(),
  isAdmin = false,
  onSelectArticle,
  onReportArticle,
  onToggleFavorite,
  onRefreshRss,
  isRssLoading = false,
  lastRssSyncTime,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const heroArticle = articles.find((a) => a.isHero) || articles.find((a) => a.isVideo);
  const showHero = !!heroArticle && (selectedCategory === 'ALL' || heroArticle.category === selectedCategory);

  const filteredArticles = articles.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'GAMING') return item.category === 'GAMING' || (item as any).category === 'BATTERY';
    if (selectedCategory === 'CHIPSET') return item.category === 'CHIPSET';
    return item.category === selectedCategory;
  });

  const gridArticles = filteredArticles.filter((item) => !showHero || item.id !== heroArticle?.id);

  const categories = [
    { key: 'ALL', label: 'All Tech News' },
    { key: 'INDIA', label: 'India Launches' },
    { key: 'CHIPSET', label: 'Chipset & AI' },
    { key: 'GAMING', label: 'Gaming & Battery' },
    { key: '5G', label: '5G & Telecom' },
  ];

  return (
    <section id="techNewsSection" className="space-y-4 sm:space-y-6 w-full">
      {/* Clean Public Section Header with Admin-Only Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-black text-[#00f2fe] uppercase tracking-wider mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-ping shrink-0" />
            <ShieldCheck className="w-3.5 h-3.5 text-[#00e676]" /> Verified Tech Editorial Desk
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            Latest Worldwide &amp; Indian <span className="grad-text">Tech News &amp; Reviews</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Live syndicated tech articles, verified hardware benchmarks, and smartphone releases. Accurate, independent reporting updated around the clock.
          </p>
        </div>

        {/* Sync Live RSS & AdSense Compliant Sections: Visible ONLY for Admin */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0 animate-in fade-in">
            {onRefreshRss && (
              <button
                type="button"
                onClick={onRefreshRss}
                disabled={isRssLoading}
                title="Admin RSS Sync: GSMArena, Android Authority, Gadgets 360, 9to5Google, and The Verge"
                className="text-[11px] text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 font-bold flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00f2fe] ${isRssLoading ? 'animate-spin' : ''}`} />
                <span>{isRssLoading ? 'Syncing...' : 'Sync Live RSS'}</span>
                {lastRssSyncTime && !isRssLoading && (
                  <span className="text-[10px] text-slate-400 font-normal">({lastRssSyncTime})</span>
                )}
              </button>
            )}

            <div className="text-[11px] text-slate-400 bg-white/5 px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#00f2fe]" /> AdSense Compliant • Fair Dealing Sec 52
            </div>
          </div>
        )}
      </div>

      {/* Category Filter Pills (YouTube 3D Tactile Pills) */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1.5 w-full" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            role="tab"
            aria-selected={selectedCategory === cat.key}
            className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer ${
              selectedCategory === cat.key
                ? 'pill-3d-active'
                : 'pill-3d text-slate-300 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* TOP HERO NEWS CARD: CLASSIFY TECH Official Video Release */}
      {showHero && heroArticle && (
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-[#0c1322] via-[#090f1d] to-[#121c32] shadow-2xl p-5 sm:p-7 group hover:border-[#00f2fe]/60 transition-all duration-300 animate-in fade-in">
          {/* Subtle Ambient Red & Cyan Accents */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00f2fe]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
            {/* 16:9 Thumbnail with YouTube Play Button Overlay */}
            <div
              onClick={() => onSelectArticle(heroArticle)}
              className="relative w-full lg:w-[48%] aspect-video rounded-2xl overflow-hidden bg-slate-950 shrink-0 cursor-pointer shadow-xl border border-white/10 group-hover:border-[#00f2fe]/40 transition duration-300"
            >
              <img
                src={heroArticle.img}
                alt={heroArticle.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => handleImageFallback(e, heroArticle.category)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* YouTube Play Icon Button Overlay */}
              <a
                href={heroArticle.videoUrl || 'https://youtube.com/@classifytech'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer border border-white/30"
                aria-label="Play YouTube Video"
                title="Watch on YouTube"
              >
                <Play className="w-7 h-7 fill-white translate-x-0.5" />
              </a>

              {/* Top Badge on Thumbnail */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-black bg-gradient-to-r from-red-500 via-rose-400 to-[#00f2fe] shadow-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  {heroArticle.badge || 'NEW VIDEO RELEASE'}
                </span>
              </div>

              {/* Bottom Channel Tag & Timestamp */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 font-medium">
                <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <Youtube className="w-4 h-4 text-red-500 fill-red-500" />
                  <span className="font-bold tracking-tight">
                    {heroArticle.channelName || 'CLASSIFY TECH'}
                  </span>
                </span>
                <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#00f2fe]" />
                  {heroArticle.time}
                </span>
              </div>
            </div>

            {/* Video Details & Action Buttons */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-cyan-300 border border-cyan-500/20">
                      Official Broadcast
                    </span>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Technical Teardown
                    </span>
                  </div>

                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(heroArticle)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-md backdrop-blur-md ${
                        favoriteIds.has(heroArticle.id)
                          ? 'bg-rose-500 text-white border border-rose-300'
                          : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 border border-white/15'
                      }`}
                      title={favoriteIds.has(heroArticle.id) ? 'Remove from favorites' : 'Save to favorites'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favoriteIds.has(heroArticle.id) ? 'fill-white text-white' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>

                <h2
                  onClick={() => onSelectArticle(heroArticle)}
                  className="text-xl sm:text-2xl lg:text-3xl font-black text-white hover:text-[#00f2fe] transition cursor-pointer leading-tight mb-3"
                >
                  {heroArticle.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 line-clamp-3">
                  {heroArticle.desc}
                </p>

                {/* Bullets Preview */}
                {heroArticle.bullets && heroArticle.bullets.length > 0 && (
                  <ul className="space-y-1.5 mb-4 text-xs text-slate-400">
                    {heroArticle.bullets.slice(0, 3).map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] mt-1.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action Buttons: Watch Video + Read Summary */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
                <a
                  href={heroArticle.videoUrl || 'https://youtube.com/@classifytech'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Video</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <button
                  type="button"
                  onClick={() => onSelectArticle(heroArticle)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/15 transition cursor-pointer hover:border-[#00f2fe]/40"
                >
                  <Newspaper className="w-4 h-4 text-[#00f2fe]" />
                  <span>Read Summary</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#00f2fe]" />
                </button>

                {onReportArticle && (
                  <button
                    type="button"
                    onClick={() => onReportArticle(heroArticle)}
                    className="ml-auto px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                    title="Report editorial issue"
                  >
                    <Flag className="w-3 h-3" /> Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State Fallback if a category has no matching articles */}
      {gridArticles.length === 0 && !showHero && (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-white/5">
          <Newspaper className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-white font-bold text-sm">No articles in this category right now</p>
          <p className="text-slate-400 text-xs mt-1">
            Try switching to &quot;All Tech News&quot; to fetch the latest dispatches.
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#00f2fe]/10 hover:bg-[#00f2fe]/20 text-[#00f2fe] text-xs font-bold border border-[#00f2fe]/30 transition"
          >
            Show All Articles
          </button>
        </div>
      )}

      {/* Articles Grid (Without external source labels) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {gridArticles.map((article, idx) => {
          const isFeatured = idx === 0 && !showHero;
          const isFav = favoriteIds.has(article.id);
          return (
            <article
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className={`glass-card glass-card-hover rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between group border border-white/10 hover:border-[#00f2fe] transition duration-300 ${
                isFeatured ? 'md:col-span-2 lg:col-span-2' : ''
              }`}
            >
              <div className={`relative ${isFeatured ? 'h-48 sm:h-64' : 'h-44'} bg-slate-950 overflow-hidden`}>
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

                {/* Favorite Heart Toggle */}
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(article);
                    }}
                    aria-label={
                      isFav
                        ? `Remove ${article.title} from favorites`
                        : `Save ${article.title} to favorites`
                    }
                    aria-pressed={isFav}
                    className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition shadow-lg backdrop-blur-md ${
                      isFav
                        ? 'bg-rose-500 text-white scale-105 border border-rose-300 shadow-rose-500/30'
                        : 'bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 border border-white/20 hover:border-rose-400'
                    }`}
                    title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    <Heart
                      className={`w-4 h-4 transition ${
                        isFav ? 'fill-white text-white' : 'hover:text-rose-400'
                      }`}
                    />
                  </button>
                )}

                <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] text-slate-300 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#00f2fe]" /> {article.time}
                </div>
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h2
                    className={`font-black text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-[#00f2fe] transition ${
                      isFeatured ? 'text-base sm:text-xl' : 'text-sm sm:text-base'
                    }`}
                  >
                    {article.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {article.desc}
                  </p>
                </div>

                {/* Card Footer: Clean Layout with Report and Read Full Story Actions (No Source Labels) */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    {onReportArticle && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReportArticle(article);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                        title="File an editorial grievance or report a factual typo"
                      >
                        <Flag className="w-3 h-3" /> Report
                      </button>
                    )}
                  </div>

                  <span className="text-[#00f2fe] flex items-center gap-1 group-hover:translate-x-1 transition text-xs font-bold">
                    Read Story <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
