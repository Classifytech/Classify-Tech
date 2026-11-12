import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  isSupportedRetailerUrl,
  extractUrlsFromText,
  isDummyOrBrokenLink,
  shortenUrlWithWorker,
  getStoreDisplayName,
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
}) => {
  // Input & state
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDummyWarning, setIsDummyWarning] = useState(false);

  // Active result state
  const [activeResult, setActiveResult] = useState<GeneratedLinkRecord | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = async (textToCopy: string) => {
    if (!textToCopy) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        setHasCopied(true);
        showToast('Copied short link to clipboard!');
        setTimeout(() => setHasCopied(false), 2000);
        return;
      }
      throw new Error('Clipboard API not available');
    } catch {
      // Robust fallback using temporary textarea
      try {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (success) {
          setHasCopied(true);
          showToast('Copied short link to clipboard!');
          setTimeout(() => setHasCopied(false), 2000);
          return;
        }
      } catch {}
      showToast('Copy failed. Please copy manually.');
    }
  };

  const saveToHistorySilent = (item: GeneratedLinkRecord) => {
    if (!item || !item.code) return;
    try {
      const saved = localStorage.getItem('classify_affiliate_history');
      let list: GeneratedLinkRecord[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) list = parsed;
      }
      const filtered = list.filter((h) => h && h.code && h.code !== item.code);
      const updated = [item, ...filtered].slice(0, 15);
      localStorage.setItem('classify_affiliate_history', JSON.stringify(updated));
    } catch {}
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsDummyWarning(false);

    const rawInput = inputText.trim();
    if (!rawInput) {
      setErrorMessage('Please paste a product or deal link.');
      return;
    }

    const detectedUrls = extractUrlsFromText(rawInput);
    const targetUrl = detectedUrls.length > 0 ? detectedUrls[0] : rawInput;

    const validation = isSupportedRetailerUrl(targetUrl);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Please enter a valid HTTP or HTTPS link.');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMessage('You appear to be offline. Please check your internet connection and retry.');
      return;
    }

    setIsLoading(true);

    try {
      // Background Cloudflare Worker resolution with KV persistence and affiliate tagging
      const workerRes = await shortenUrlWithWorker(targetUrl);

      if (!workerRes.success) {
        throw new Error(workerRes.error || 'Failed to generate short link. Please try again.');
      }

      // Dummy link guard: prevents generating broken links lacking pid
      if (isDummyOrBrokenLink(workerRes.affiliateUrl)) {
        setIsDummyWarning(true);
        setErrorMessage('The merchant link appears to be an incomplete placeholder (missing product ID). Please check the original product link and retry.');
        setIsLoading(false);
        return;
      }

      // Output shortUrl (or fallback to affiliateUrl)
      const code = workerRes.shortCode || generateShortCode(6);
      const resolvedShortUrl = workerRes.shortUrl || buildBrandedShortUrl(code);
      const primaryLink = resolvedShortUrl || workerRes.affiliateUrl || targetUrl;

      const record: GeneratedLinkRecord = {
        code,
        postId: `post-${code}`,
        shortUrl: primaryLink,
        originalUrl: targetUrl,
        affiliateUrl: workerRes.affiliateUrl,
        resolvedUrl: workerRes.resolvedUrl || targetUrl,
        store: workerRes.store || validation.store || 'other',
        storeName: getStoreDisplayName(workerRes.store || validation.store),
        createdAt: Date.now(),
      };

      setActiveResult(record);
      saveToHistorySilent(record);
      showToast('Smart short link generated!');
    } catch (err: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setErrorMessage('You appear to be offline. Please check your internet connection and retry.');
      } else {
        setErrorMessage(err?.message || 'Failed to process link. Please check your connection and retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStoreBadgeClass = (store?: string) => {
    switch (store?.toLowerCase()) {
      case 'amazon':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';
      case 'flipkart':
        return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40';
      case 'myntra':
        return 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/40';
      case 'ajio':
        return 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40';
      case 'meesho':
        return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40';
      case 'nykaa':
        return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40';
      case 'croma':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40';
      case 'tatacliq':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40';
      case 'snapdeal':
        return 'bg-red-100 text-red-900 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40';
      case 'reliancedigital':
        return 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40';
      case 'firstcry':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    }
  };

  return (
    <section id="linkMakerSection" className="max-w-4xl mx-auto px-4 sm:px-6 my-8 scroll-mt-24">
      <div className="rounded-3xl border border-slate-200 dark:border-cyan-500/30 overflow-hidden shadow-xl bg-white dark:bg-slate-950 transition-all">
        
        {/* COMPACT CLEAN HEADER */}
        <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-[#00f2fe] flex items-center justify-center shrink-0 shadow-inner">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Smart Link Shortener
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instant, verified short links with direct store redirection
            </p>
          </div>
        </div>

        {/* INPUT & ACTION CONTAINER */}
        <div className="p-5 sm:p-6 space-y-4">
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="url"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                  if (isDummyWarning) setIsDummyWarning(false);
                }}
                placeholder="Paste any shopping or deal link here..."
                className="w-full h-13 sm:h-14 pl-4 pr-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-[#00f2fe] focus:ring-2 focus:ring-[#00f2fe]/20 transition shadow-xs"
                disabled={isLoading}
              />
              {inputText && (
                <button
                  type="button"
                  onClick={() => {
                    setInputText('');
                    if (errorMessage) setErrorMessage(null);
                    if (isDummyWarning) setIsDummyWarning(false);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                  title="Clear link"
                  aria-label="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="w-full sm:w-auto px-7 h-13 sm:h-14 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-[#00f2fe] text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-cyan-500/25 transition active:scale-[0.99] shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Shortening...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Shorten Link</span>
                </>
              )}
            </button>
          </form>

          {/* ERROR & DUMMY LINK ALERT */}
          {errorMessage && (
            <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in ${
              isDummyWarning
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-500/40 text-red-900 dark:text-red-200'
            }`}>
              <div className="flex items-start gap-2.5">
                <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isDummyWarning ? 'text-amber-500' : 'text-red-500'}`} />
                <div>
                  <strong className="block font-bold">
                    {isDummyWarning ? 'Incomplete Product Link' : 'Unable to Shorten Link'}
                  </strong>
                  <span className="text-xs opacity-90">{errorMessage}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white/10 dark:hover:bg-white/20 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* CLEAN, MINIMAL OUTPUT CARD (SHOWN ONLY AFTER LINK IS GENERATED) */}
          {activeResult && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 shadow-lg space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${getStoreBadgeClass(activeResult.store)}`}>
                    {activeResult.storeName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Ready to Share
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-[#00e676] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-[#00e676]" />
                  <span>Verified Link</span>
                </div>
              </div>

              {/* SINGLE READ-ONLY SHORT LINK BOX & EXACTLY TWO PROMINENT BUTTONS */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-[#00f2fe] font-mono text-sm sm:text-base font-bold break-all select-all flex items-center shadow-inner">
                  <span className="truncate">{activeResult.shortUrl}</span>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeResult.shortUrl)}
                    className="px-5 py-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-[#00f2fe] border border-cyan-500/35 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs"
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
                    className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-100 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* CLEAN DISCLOSURE FOOTER */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-700 dark:text-slate-300">100% Free:</span> CLASSIFY TECH never charges users fees or subscriptions to shorten or access links.
            </p>
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Affiliate Disclosure:</span> Some generated links are affiliate links which may earn us a small commission at no additional cost to you. Review our{' '}
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="text-cyan-600 dark:text-[#00f2fe] hover:underline font-semibold cursor-pointer"
              >
                Affiliate Terms
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="text-cyan-600 dark:text-[#00f2fe] hover:underline font-semibold cursor-pointer"
              >
                Privacy Policy
              </button>.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
