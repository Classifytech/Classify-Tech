import React, { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Trash2,
  Lock,
} from 'lucide-react';
import {
  isSupportedRetailerUrl,
  generateShortCode,
  buildBrandedShortUrl,
  type GeneratedLinkRecord,
} from '../utils/affiliate';

interface LinkMakerSectionProps {
  onOpenLegal: (tab: 'terms' | 'privacy' | 'editorial') => void;
  showToast: (msg: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const LinkMakerSection: React.FC<LinkMakerSectionProps> = ({
  onOpenLegal,
  showToast,
  isExpanded: externalIsExpanded,
  onToggleExpand: externalOnToggleExpand,
}) => {
  // Local collapsible state with fallback
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalExpanded;
  const toggleExpanded = () => {
    if (externalOnToggleExpand) {
      externalOnToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Form states
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [activeResult, setActiveResult] = useState<GeneratedLinkRecord | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // History of generated links
  const [history, setHistory] = useState<GeneratedLinkRecord[]>(() => {
    try {
      const saved = localStorage.getItem('classify_affiliate_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed
            .filter((item) => {
              if (!item || typeof item !== 'object') return false;
              const code = item.code || (item as any).shortCode;
              if (!code || typeof code !== 'string') return false;
              if (seen.has(code)) return false;
              seen.add(code);
              return true;
            })
            .map((item) => ({
              ...item,
              code: item.code || (item as any).shortCode,
            }));
        }
      }
    } catch {}
    return [];
  });

  // Listen for hash change (#linkMakerSection) or custom trigger to auto-open
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#linkMakerSection') {
        if (!isExpanded) {
          if (externalOnToggleExpand) externalOnToggleExpand();
          else setInternalExpanded(true);
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [isExpanded, externalOnToggleExpand]);

  const saveToHistory = (item: GeneratedLinkRecord) => {
    if (!item || !item.code) return;
    setHistory((prev) => {
      const filtered = prev.filter((h) => h && h.code && h.code !== item.code);
      const updated = [item, ...filtered].slice(0, 15);
      try {
        localStorage.setItem('classify_affiliate_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('classify_affiliate_history');
    } catch {}
    showToast('Link history cleared.');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMessage('Please paste a product link.');
      return;
    }

    const validation = isSupportedRetailerUrl(trimmed);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Please enter a valid HTTP or HTTPS link.');
      return;
    }

    setIsLoading(true);

    // 1. Generate code & postId on the website
    const code = generateShortCode(6);
    const postId = `post-${code}`;
    const brandedShortUrl = buildBrandedShortUrl(code);

    try {
      // 2. Primary call to server route (/api/shorten)
      let responseData: any = null;
      let primaryFailed = false;

      try {
        const res = await fetch('/api/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: trimmed,
            code,
            postId,
          }),
        });

        if (res.ok) {
          responseData = await res.json();
        } else {
          primaryFailed = true;
        }
      } catch {
        primaryFailed = true;
      }

      // 3. Direct frontend fallback to Cloudflare Worker V2 if backend route fails
      if (primaryFailed || !responseData || !responseData.success) {
        const cfRes = await fetch('https://classify.classifytechz.workers.dev/api/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: trimmed,
            code,
            postId,
          }),
        });

        if (cfRes.ok) {
          responseData = await cfRes.json();
        } else {
          const errData = await cfRes.json().catch(() => null);
          throw new Error(errData?.error || 'Cloudflare Worker V2 synchronization failed. Please try again.');
        }
      }

      const generatedRecord: GeneratedLinkRecord = {
        code: responseData.code || code,
        postId: responseData.postId || postId,
        shortUrl: brandedShortUrl,
        originalUrl: trimmed,
        // Secretly saved for Admin Vault inspection only, NEVER displayed in public UI
        affiliateUrl: responseData.affiliateUrl || responseData.finalUrl,
        store: responseData.store || validation.store || 'amazon',
        storeName: responseData.storeName || validation.storeName || 'Amazon',
        kvSaved: responseData.kvSaved ?? true,
        createdAt: responseData.createdAt || Date.now(),
        expiresAt: responseData.expiresAt || (Date.now() + 31536000 * 1000),
        ttlSeconds: responseData.ttlSeconds || 31536000,
      };

      setActiveResult(generatedRecord);
      saveToHistory(generatedRecord);
      setInputUrl('');
      showToast('Verified Smart Link created & synced with Cloudflare KV!');
    } catch (err: any) {
      console.error('Error generating short link:', err);
      setErrorMessage(err.message || 'Failed to create verified short link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      showToast('Copied short link to clipboard!');
      setTimeout(() => setHasCopied(false), 2200);
    } catch {
      showToast('Failed to copy. Please copy manually.');
    }
  };


  const getStoreBadgeColor = (store: string) => {
    switch (store) {
      case 'amazon':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'flipkart':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'myntra':
        return 'bg-pink-500/15 text-pink-400 border-pink-500/30';
      default:
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <section id="linkMakerSection" className="max-w-7xl mx-auto px-4 sm:px-6 my-10 scroll-mt-24">
      <div className="link-maker-card glass-card rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl bg-white dark:bg-gradient-to-b dark:from-slate-950/95 dark:to-[#040814]/95 transition-all">
        
        {/* COLLAPSIBLE HEADER / TOGGLE BAR */}
        <div
          onClick={toggleExpanded}
          className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-900 transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-[#00f2fe] flex items-center justify-center shrink-0 shadow-inner">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Smart Affiliate Link Studio
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                Convert Amazon, Flipkart &amp; Myntra URLs into clean CLASSIFY TECH short links
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden md:inline">
              {isExpanded ? 'Click to Hide Studio' : 'Click to Open Studio'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-200/60 dark:bg-white/5 border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300/60 dark:hover:bg-white/10 transition">
              {isExpanded ? <ChevronUp className="w-5 h-5 text-[#00f2fe]" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* EXPANDED CONTENT BODY */}
        {isExpanded && (
          <div className="p-5 sm:p-8 space-y-6 animate-in fade-in duration-200">
            
            {/* SUPPORTED STORES */}
            <div className="store-pills-bar flex items-center justify-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10">
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-300 border border-amber-500/25 font-bold text-xs sm:text-sm">
                Amazon
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-300 border border-blue-500/25 font-bold text-xs sm:text-sm">
                Flipkart
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-pink-500/10 text-pink-500 dark:text-pink-300 border border-pink-500/25 font-bold text-xs sm:text-sm">
                Myntra
              </span>
            </div>

            {/* URL INPUT FORM */}
            <form onSubmit={handleGenerate} className="space-y-3">
              <div>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Paste any Amazon, Flipkart, or Myntra product link here..."
                  className="w-full px-5 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-black/60 border border-slate-300 dark:border-cyan-500/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition shadow-inner"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-[#00f2fe] text-black font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/25 transition active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Generating Link...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Get Link</span>
                  </>
                )}
              </button>
            </form>

            {/* ERROR BANNER */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ACTIVE RESULT CARD (LIQUID GLASS, COMPACT, IMMEDIATELY BELOW GET LINK) */}
            {activeResult && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md border border-cyan-500/30 dark:border-cyan-400/30 shadow-lg shadow-cyan-950/20 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase border ${getStoreBadgeColor(activeResult.store)}`}>
                      {activeResult.storeName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Verified Short Link
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-[#00e676] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-[#00e676]" />
                    <span className="hidden xs:inline">Direct Redirect</span>
                  </div>
                </div>

                {/* THE BRANDED SHORT LINK BOX & DUAL BALANCED ACTIONS */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/60 border border-slate-300/80 dark:border-cyan-500/25 text-cyan-700 dark:text-[#00f2fe] font-mono text-xs sm:text-sm font-bold break-all select-all flex items-center justify-between shadow-inner">
                      <span className="break-all">{activeResult.shortUrl}</span>
                      <span title="Organic Hidden Post Protected" className="inline-flex items-center ml-2 shrink-0">
                        <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeResult.shortUrl)}
                        className="px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-800 dark:text-[#00f2fe] border border-cyan-500/35 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        {hasCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={activeResult.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white border border-slate-300 dark:border-white/15 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <span>Open Product</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* TRUST & DIRECT ROUTING NOTE */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span className="truncate">Clean redirection to official merchant page • Zero intermediate ad screens</span>
                </div>
              </div>
            )}

            {/* TERMS & PRIVACY FOOTER (COMPACT, BENEATH GENERATOR) */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <p className="leading-relaxed">
                <span className="font-bold text-slate-800 dark:text-slate-300">100% Free for Public Users:</span> CLASSIFY TECH does not charge any user or the general public any money, subscription, or fees to generate or use links.
              </p>
              <p className="leading-relaxed">
                <span className="font-bold text-slate-800 dark:text-slate-300">Affiliate Commission Disclosure:</span> CLASSIFY TECH participates in official affiliate programs for Amazon, Flipkart, and Myntra. When someone purchases a product through a generated link, we may earn a small affiliate commission at zero extra cost to the buyer. Review our{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal('terms')}
                  className="text-cyan-600 dark:text-[#00f2fe] hover:underline font-bold cursor-pointer"
                >
                  Affiliate Terms &amp; Conditions
                </button>.
              </p>
              <p className="leading-relaxed">
                <span className="font-bold text-slate-800 dark:text-slate-300">Privacy &amp; 1-Year Reliability:</span> We do not collect personal buyer data. Only the generated short link and the verified product affiliate link are stored in Cloudflare KV for 1 year (365 days) so every short link opens its product page directly. Read our{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="text-cyan-600 dark:text-[#00f2fe] hover:underline font-bold cursor-pointer"
                >
                  Privacy Policy
                </button>.
              </p>
            </div>

            {/* RECENT GENERATED LINKS HISTORY (DESTINATION LINK PERMANENTLY HIDDEN FROM PUBLIC UI) */}
            {history.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                      Recent Generated Links ({history.length})
                    </h3>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar pr-1">
                  {history.map((item, index) => {
                    const itemKey = item.code ? `link-${item.code}-${index}` : `link-idx-${index}-${item.createdAt || index}`;
                    return (
                      <div
                        key={itemKey}
                        className="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getStoreBadgeColor(item.store)}`}>
                            {item.storeName}
                          </span>
                          <span className="font-mono text-cyan-300 font-bold truncate">
                            {item.shortUrl}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-lg">
                          Original: {item.originalUrl}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyToClipboard(item.shortUrl)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#00f2fe] hover:text-black text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <a
                          href={item.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00f2fe] border border-cyan-500/40 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
};
