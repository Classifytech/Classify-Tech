import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Header } from './components/Header.tsx';
import { Ticker } from './components/Ticker.tsx';
import { TechNewsSection } from './components/TechNewsSection.tsx';
import { FavoritesSection } from './components/FavoritesSection.tsx';
import { PhotographySection } from './components/PhotographySection.tsx';
import { LootSection } from './components/LootSection.tsx';
import { LinkMakerSection } from './components/LinkMakerSection.tsx';
import { Footer } from './components/Footer.tsx';

// Lazy-loaded components and modals to optimize initial bundle size & webpage load speed
const CompareSection = React.lazy(() => import('./components/CompareSection.tsx').then((m) => ({ default: m.CompareSection })));
const NewsModal = React.lazy(() => import('./components/NewsModal.tsx').then((m) => ({ default: m.NewsModal })));
const PhotoModal = React.lazy(() => import('./components/PhotoModal.tsx').then((m) => ({ default: m.PhotoModal })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard.tsx').then((m) => ({ default: m.AdminDashboard })));
const ContactModal = React.lazy(() => import('./components/ContactModal.tsx').then((m) => ({ default: m.ContactModal })));
const LegalModal = React.lazy(() => import('./components/LegalModal.tsx').then((m) => ({ default: m.LegalModal })));
const AdminModal = React.lazy(() => import('./components/AdminModal.tsx').then((m) => ({ default: m.AdminModal })));

// Data
import { defaultTechArticles, TechArticle } from './data/newsData.ts';
import { defaultPhotographyPortfolio, PhotoItem } from './data/photographyData.ts';
import { defaultLootDeals, LootDeal } from './data/lootData.ts';
import { defaultPhones, PhoneSpecs } from './data/phonesData.ts';
import {
  transformRssItemToArticle,
  FREE_TECH_RSS_FEEDS,
  AUTO_REFRESH_INTERVAL_MS,
  type Rss2JsonResponse,
} from './utils/rssParser.ts';
import {
  loadFavoritesFromStorage,
  saveFavoritesToStorage,
  toggleFavoriteItem,
  type FavoriteItem,
} from './utils/favorites.ts';

import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => loadFavoritesFromStorage());

  const [articles, setArticles] = useState<TechArticle[]>(() => {
    try {
      const saved = localStorage.getItem('classify_articles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
      }
    } catch {}
    return defaultTechArticles;
  });

  const [photos] = useState<PhotoItem[]>(defaultPhotographyPortfolio);

  const [lootDeals, setLootDeals] = useState<LootDeal[]>(() => {
    try {
      const saved = localStorage.getItem('classify_loot_deals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultLootDeals;
  });

  const [phones, setPhones] = useState<Record<string, PhoneSpecs>>(() => {
    try {
      const saved = localStorage.getItem('classify_phones_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length >= 50) {
          return { ...defaultPhones, ...parsed };
        }
      }
    } catch {}
    return defaultPhones;
  });

  // RSS Sync State (Admin controlled)
  const [isRssLoading, setIsRssLoading] = useState(false);
  const [lastRssSyncTime, setLastRssSyncTime] = useState<string>('Just Now');

  // Modal states
  const [selectedArticle, setSelectedArticle] = useState<TechArticle | null>(null);
  const [initialReportOpen, setInitialReportOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'affiliate' | 'editorial'>('terms');
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Theme state: default dark mode or high-contrast light mode
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('classify_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    try {
      localStorage.setItem('classify_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme === 'light' ? 'High-Contrast Light' : 'Dark'} Mode`);
  };

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  /**
   * Fetches latest tech news from multiple free RSS feeds (GSMArena, Android Authority, Gadgets 360, 9to5Google, The Verge)
   * Auto-refreshes every 15 minutes in background without reloading the page.
   */
  const fetchLiveRssNews = async (isManual = false) => {
    setIsRssLoading(true);
    try {
      let freshArticles: TechArticle[] = [];

      // 1. Try backend RSS syndication proxy first (fast, CORS-free, server-cached)
      try {
        const backendRes = await fetch(`/api/news/rss${isManual ? '?refresh=true' : ''}`);
        if (backendRes.ok) {
          const json = await backendRes.json();
          if (json.success && Array.isArray(json.articles) && json.articles.length > 0) {
            freshArticles = json.articles;
          }
        }
      } catch (err) {
        console.warn('Backend RSS proxy unavailable, attempting direct client syndication...', err);
      }

      // 2. Direct client fallback across all 5 feeds if backend returned nothing
      if (freshArticles.length === 0) {
        const fetchPromises = FREE_TECH_RSS_FEEDS.map(async (feed) => {
          try {
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.rssUrl)}`;
            const res = await fetch(apiUrl);
            if (res.ok) {
              const data: Rss2JsonResponse = await res.json();
              if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
                const feedTitle = data.feed?.title || feed.name;
                return data.items
                  .slice(0, 6)
                  .map((item) => transformRssItemToArticle(item, feedTitle));
              }
            }
          } catch {}
          return [] as TechArticle[];
        });

        const settled = await Promise.allSettled(fetchPromises);
        for (const res of settled) {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            freshArticles.push(...res.value);
          }
        }
      }

      // 3. Update articles state and deduplicate by headline
      if (freshArticles.length > 0) {
        setArticles((prev) => {
          const seen = new Set<string>();
          const deduped: TechArticle[] = [];
          for (const item of [...freshArticles, ...prev]) {
            const key = item.title.toLowerCase().trim();
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(item);
            }
          }
          return deduped.slice(0, 30);
        });

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastRssSyncTime(timeStr);

        if (isManual) {
          showToast(`Synced ${freshArticles.length} live articles across tech RSS feeds!`);
        }
      } else {
        if (isManual) {
          showToast('Live RSS feeds are up to date.');
        }
      }
    } catch {
      if (isManual) {
        showToast('Displaying verified tech articles (cached).');
      }
    } finally {
      setIsRssLoading(false);
    }
  };

  // Background 15-minute timer for automatic updates without page reload
  useEffect(() => {
    fetchLiveRssNews(false);

    const timerId = setInterval(() => {
      fetchLiveRssNews(false);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(timerId);
  }, []);

  // Load server-persisted content (Loot deals, Custom articles, Phones DB)
  useEffect(() => {
    const loadServerContent = async () => {
      try {
        const res = await fetch('/api/content');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (Array.isArray(data.lootDeals) && data.lootDeals.length > 0) {
              setLootDeals((prev) => {
                const next = [...prev];
                data.lootDeals.forEach((deal: LootDeal, idx: number) => {
                  if (deal && idx < next.length) next[idx] = deal;
                });
                return next;
              });
            }
            if (Array.isArray(data.customNews) && data.customNews.length > 0) {
              setArticles((prev) => {
                const seen = new Set(prev.map((a) => a.id));
                const newItems = data.customNews.filter((a: TechArticle) => a && !seen.has(a.id));
                return [...newItems, ...prev];
              });
            }
            if (data.customPhones && Object.keys(data.customPhones).length > 0) {
              setPhones((prev) => ({ ...prev, ...data.customPhones }));
            }
          }
        }
      } catch (err) {
        console.warn('Could not load server content:', err);
      }
    };

    loadServerContent();
  }, []);

  // Deep-linking support for shared story links (?story=id)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const storyId = params.get('story') || params.get('article');
        if (storyId) {
          const match = articles.find((a) => a.id === storyId);
          if (match) {
            setSelectedArticle(match);
          }
        }
      }
    } catch {}
  }, [articles]);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('classify_articles', JSON.stringify(articles));
    } catch {}
  }, [articles]);

  useEffect(() => {
    try {
      localStorage.setItem('classify_loot_deals', JSON.stringify(lootDeals));
    } catch {}
  }, [lootDeals]);

  useEffect(() => {
    try {
      localStorage.setItem('classify_phones_db', JSON.stringify(phones));
    } catch {}
  }, [phones]);

  // Sync favorites to localStorage
  useEffect(() => {
    saveFavoritesToStorage(favorites);
  }, [favorites]);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  const handleToggleFavoriteArticle = (article: TechArticle) => {
    const res = toggleFavoriteItem(favorites, {
      id: article.id,
      type: 'article',
      data: article,
    });
    setFavorites(res.updated);
    if (res.isFavorited) {
      showToast(`Saved to Favorites`);
    } else {
      showToast('Removed from Favorites');
    }
  };

  const handleToggleFavoriteDeal = (deal: LootDeal) => {
    const res = toggleFavoriteItem(favorites, {
      id: deal.id,
      type: 'deal',
      data: deal,
    });
    setFavorites(res.updated);
    if (res.isFavorited) {
      showToast(`Saved "${deal.title.slice(0, 30)}..." to Favorites`);
    } else {
      showToast('Removed deal from Favorites');
    }
  };

  const handleClearAllFavorites = () => {
    setFavorites([]);
  };

  // Admin handlers
  const handleUpdateLootDeal = (index: number, updated: LootDeal) => {
    setLootDeals((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const handleAddArticle = (newArticle: TechArticle) => {
    setArticles((prev) => [newArticle, ...prev]);
  };

  const handleAddPhone = (newPhone: PhoneSpecs) => {
    setPhones((prev) => ({
      ...prev,
      [newPhone.id]: newPhone,
    }));
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-[#00f2fe] selection:text-black ${theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#06080f] text-slate-100'}`}>
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 max-w-sm rounded-2xl bg-slate-900/95 border-2 border-[#00f2fe] px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-[#00e676] shrink-0" />
          <span className="break-words">{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        favoritesCount={favorites.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenContact={() => setContactModalOpen(true)}
      />

      {/* Live Tech News Wire Ticker */}
      <Ticker />

      {/* Protected Master Admin Console (with dedicated Live RSS Auto-Sync controls) */}
      {isAdminUnlocked && (
        <Suspense fallback={null}>
          <AdminDashboard
            adminToken={adminToken || undefined}
            lootDeals={lootDeals}
            onUpdateLootDeal={handleUpdateLootDeal}
            onAddArticle={handleAddArticle}
            onAddPhone={handleAddPhone}
            onLock={() => {
              setIsAdminUnlocked(false);
              showToast('Master Admin Console locked.');
            }}
            onShowToast={showToast}
            onRefreshRss={() => fetchLiveRssNews(true)}
            isRssLoading={isRssLoading}
            lastRssSyncTime={lastRssSyncTime}
          />
        </Suspense>
      )}

      {/* Primary Page Content Container */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 py-6 sm:py-8 w-full flex-1">
        
        {/* 1. Tech News & Editorial Blog (Clean Public View with Enhanced Report Actions) */}
        <TechNewsSection
          articles={articles}
          favoriteIds={favoriteIds}
          isAdmin={isAdminUnlocked}
          onSelectArticle={(art) => {
            setSelectedArticle(art);
            setInitialReportOpen(false);
          }}
          onReportArticle={(art) => {
            setSelectedArticle(art);
            setInitialReportOpen(true);
          }}
          onToggleFavorite={handleToggleFavoriteArticle}
          onRefreshRss={() => fetchLiveRssNews(true)}
          isRssLoading={isRssLoading}
          lastRssSyncTime={lastRssSyncTime}
        />

        {/* 2. Personal Favorites & Saved Watchlist */}
        <FavoritesSection
          favorites={favorites}
          onToggleFavoriteArticle={handleToggleFavoriteArticle}
          onToggleFavoriteDeal={handleToggleFavoriteDeal}
          onClearAllFavorites={handleClearAllFavorites}
          onSelectArticle={(art) => {
            setSelectedArticle(art);
            setInitialReportOpen(false);
          }}
          onShowToast={showToast}
        />

        {/* 3. Flagship Smartphone Camera & Photography Showcase */}
        <PhotographySection
          photos={photos}
          onSelectPhoto={(photo) => setSelectedPhoto(photo)}
        />

        {/* 4. Classify Universal Loot Hub */}
        <LootSection
          deals={lootDeals}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavoriteDeal}
          onShowToast={showToast}
        />

        {/* 5. Complete 16-Point Hardware Comparator (100+ Devices Database) */}
        <Suspense
          fallback={
            <div className="glass-card rounded-2xl p-8 sm:p-12 text-center border border-cyan-500/25 space-y-3">
              <div className="w-8 h-8 border-2 border-[#00f2fe] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-white font-extrabold text-sm sm:text-base">
                Loading 100+ Smartphone Comparator Matrix...
              </div>
              <p className="text-xs text-slate-400">
                Optimizing 16-point hardware specifications and benchmark database
              </p>
            </div>
          }
        >
          <CompareSection phones={phones} />
        </Suspense>

        {/* 6. Smart Affiliate Redirect Generator */}
        <LinkMakerSection
          onShowToast={showToast}
          onOpenLegal={(tab) => {
            setLegalModalTab(tab);
            setLegalModalOpen(true);
          }}
        />

      </main>

      {/* Footer with Compact Social Links & AdSense Legal Navigation */}
      <Footer
        onOpenLegal={(tab) => {
          setLegalModalTab(tab);
          setLegalModalOpen(true);
        }}
        onOpenContact={() => setContactModalOpen(true)}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      {/* Lazy Loaded Modals */}
      <Suspense fallback={null}>
        {selectedArticle && (
          <NewsModal
            article={selectedArticle}
            initialReportOpen={initialReportOpen}
            isFavorited={favoriteIds.has(selectedArticle.id)}
            onToggleFavorite={handleToggleFavoriteArticle}
            onClose={() => {
              setSelectedArticle(null);
              setInitialReportOpen(false);
            }}
            onShowToast={showToast}
          />
        )}

        {selectedPhoto && (
          <PhotoModal
            photo={selectedPhoto}
            allPhotos={photos}
            onClose={() => setSelectedPhoto(null)}
            onSelectPhoto={(p) => setSelectedPhoto(p)}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {contactModalOpen && (
          <ContactModal
            isOpen={contactModalOpen}
            onClose={() => setContactModalOpen(false)}
            onShowToast={showToast}
          />
        )}

        {legalModalOpen && (
          <LegalModal
            isOpen={legalModalOpen}
            initialTab={legalModalTab}
            onClose={() => setLegalModalOpen(false)}
            onOpenContact={() => {
              setLegalModalOpen(false);
              setContactModalOpen(true);
            }}
          />
        )}

        {adminModalOpen && (
          <AdminModal
            isOpen={adminModalOpen}
            onClose={() => setAdminModalOpen(false)}
            onUnlock={(token) => {
              setIsAdminUnlocked(true);
              if (token) setAdminToken(token);
            }}
            onShowToast={showToast}
          />
        )}
      </Suspense>

    </div>
  );
}
