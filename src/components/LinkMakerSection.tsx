import React, { useState } from 'react';
import {
  validateAndProcessAffiliateUrl,
  generateShortCode,
  buildShortUrl,
  createStealthRedirectUrl,
  addToAffiliateHistory,
  AFFILIATE_HISTORY_STORAGE_KEY,
  type AffiliateHistoryItem,
} from '../utils/affiliate.ts';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  History,
  Trash2,
  Clock,
  ArrowRight,
  Loader2,
  Info,
} from 'lucide-react';

interface LinkMakerSectionProps {
  onShowToast: (msg: string) => void;
  onOpenLegal?: (tab: 'terms' | 'privacy' | 'affiliate' | 'editorial') => void;
}

export const LinkMakerSection: React.FC<LinkMakerSectionProps> = ({ onShowToast, onOpenLegal }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [outputUrl, setOutputUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [redirectPath, setRedirectPath] = useState('');
  const [trackingNote, setTrackingNote] = useState('');
  const [directAffiliateUrl, setDirectAffiliateUrl] = useState('');
  const [storeBadge, setStoreBadge] = useState('Amazon · Flipkart · Myntra · Meesho');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Local storage history state (last 5 generated links)
  const [history, setHistory] = useState<AffiliateHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(AFFILIATE_HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 5);
        }
      }
    } catch (e) {
      console.warn('Failed to parse affiliate link history from localStorage:', e);
    }
    return [];
  });

  const handleGenerate = async () => {
    setErrorMsg('');
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMsg('Please paste a valid product or affiliate link first.');
      onShowToast('Please paste a product or affiliate link.');
      return;
    }

    // 1. Strict preliminary client validation for 4 allowed stores
    const validation = validateAndProcessAffiliateUrl(trimmed);
    if (!validation.isValid) {
      const err = validation.error || 'यह लिंक मान्य नहीं है। केवल Amazon, Flipkart, Myntra और Meesho के लिंक ही स्वीकार किए जाते हैं।';
      setErrorMsg(err);
      onShowToast(err);
      return;
    }

    setIsGenerating(true);

    const origin = typeof window !== 'undefined' && window.location && window.location.origin
      ? window.location.origin
      : '';

    let generatedShortUrl = '';
    let finalCode = '';
    let finalRedirectPath = '';
    let finalAffiliateUrl = validation.affiliateUrl || trimmed;
    let finalTrackingNote = validation.trackingNote || 'Verified affiliate link';
    let finalStoreName = validation.storeName ? `${validation.storeName} Verified` : 'Verified Partner Link';
    let finalStore = validation.store || 'amazon';

    try {
      // 2. Call backend API if available
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate short link.');
      }

      finalCode = data.code;
      finalRedirectPath = data.redirectPath || `/s/${data.code}`;
      finalAffiliateUrl = data.affiliateUrl || finalAffiliateUrl;
      finalTrackingNote = data.trackingNote || finalTrackingNote;
      finalStoreName = data.storeName ? `${data.storeName} Verified` : finalStoreName;
      finalStore = data.store || finalStore;

      // Ensure full HTTPS clickable URL with current live domain
      if (data.shortUrl && data.shortUrl.startsWith('http')) {
        generatedShortUrl = data.shortUrl;
      } else if (origin) {
        generatedShortUrl = `${origin.replace(/\/+$/, '')}/s/${data.code}`;
      } else {
        generatedShortUrl = buildShortUrl(data.code);
      }

      // Also sync to local static storage for cross-page persistence
      try {
        const stored = JSON.parse(localStorage.getItem('classify_static_shortlinks') || '{}');
        stored[data.code] = finalAffiliateUrl;
        localStorage.setItem('classify_static_shortlinks', JSON.stringify(stored));
      } catch (e) {
        console.warn('Failed to cache shortlink locally:', e);
      }
    } catch (apiErr: any) {
      // If server returned a business validation rejection message, show it
      if (apiErr?.message && apiErr.message.includes('मान्य नहीं है')) {
        setErrorMsg(apiErr.message);
        onShowToast(apiErr.message);
        setIsGenerating(false);
        return;
      }

      // 3. STATIC FALLBACK (for GitHub Pages, Netlify without Node server, or offline)
      // Preserves original user affiliate tag/ID and strictly adheres to 4 stores
      finalCode = generateShortCode(6);
      const storeParam = validation.store === 'flipkart'
        ? 'flipkart'
        : validation.store === 'amazon'
        ? 'amazon'
        : validation.store === 'myntra'
        ? 'myntra'
        : validation.store === 'meesho'
        ? 'meesho'
        : 'go';

      const stealthUrl = createStealthRedirectUrl(origin || 'https://classifytech.web.app', finalAffiliateUrl, storeParam);
      generatedShortUrl = stealthUrl;
      finalRedirectPath = stealthUrl;
      finalTrackingNote = validation.trackingNote || 'User original affiliate tracking preserved (Static Fallback)';

      try {
        const stored = JSON.parse(localStorage.getItem('classify_static_shortlinks') || '{}');
        stored[finalCode] = finalAffiliateUrl;
        localStorage.setItem('classify_static_shortlinks', JSON.stringify(stored));
      } catch (e) {
        console.warn('Failed to save static shortlink fallback:', e);
      }
    }

    // Ensure full URL in state
    setOutputUrl(generatedShortUrl);
    setShortCode(finalCode);
    setRedirectPath(finalRedirectPath);
    setDirectAffiliateUrl(finalAffiliateUrl);
    setTrackingNote(finalTrackingNote);
    setStoreBadge(finalStoreName);

    // Update local storage history (last 5 links)
    const updatedHistory = addToAffiliateHistory(
      {
        originalUrl: trimmed,
        finalUrl: generatedShortUrl,
        shortCode: finalCode,
        monetizedUrl: finalAffiliateUrl,
        store: finalStore,
        label: finalStoreName,
      },
      history,
      5
    );

    setHistory(updatedHistory);
    try {
      localStorage.setItem(AFFILIATE_HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn('Failed to save affiliate history to localStorage:', e);
    }

    // Auto-copy generated short link to clipboard
    try {
      await navigator.clipboard.writeText(generatedShortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onShowToast('Short link generated & copied to clipboard!');
    } catch {
      onShowToast('Short link generated successfully!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!outputUrl) return;
    try {
      await navigator.clipboard.writeText(outputUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onShowToast('Short link copied to clipboard!');
    } catch {
      onShowToast('Failed to copy to clipboard.');
    }
  };

  const handleOpenLink = () => {
    if (!outputUrl && !redirectPath) return;

    const destination = outputUrl.startsWith('http') ? outputUrl : (redirectPath || `/s/${shortCode}`);
    window.open(destination, '_blank', 'noopener,noreferrer');
  };

  const handleCopyHistoryItem = async (item: AffiliateHistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.finalUrl);
      setCopiedHistoryId(item.id);
      setTimeout(() => setCopiedHistoryId(null), 2000);
      onShowToast('Short link copied to clipboard!');
    } catch {
      onShowToast('Failed to copy link.');
    }
  };

  const handleOpenHistoryItem = (item: AffiliateHistoryItem) => {
    const destination = item.finalUrl.startsWith('http')
      ? item.finalUrl
      : (item.shortCode ? `/s/${item.shortCode}` : item.monetizedUrl);

    window.open(destination, '_blank', 'noopener,noreferrer');
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(AFFILIATE_HISTORY_STORAGE_KEY);
    } catch {}
    onShowToast('Affiliate short link history cleared.');
  };

  const handleReuseHistoryItem = (item: AffiliateHistoryItem) => {
    setInputUrl(item.originalUrl);
    setOutputUrl(item.finalUrl);
    setShortCode(item.shortCode || '');
    setRedirectPath(item.shortCode ? `/s/${item.shortCode}` : '');
    setDirectAffiliateUrl(item.monetizedUrl);
    setStoreBadge(item.label);
    setErrorMsg('');
    onShowToast('Loaded short link into generator.');
  };

  const formatTimestamp = (ts: number): string => {
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <section id="quickLinkMakerSlot" className="pt-2 w-full">
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-cyan-500/35 shadow-xl max-w-4xl mx-auto w-full space-y-4">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-[#00f2fe] flex items-center justify-center text-base shrink-0 border border-cyan-500/30">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black text-white leading-tight">
                Affiliate Link Shortener
              </h3>
              <p className="text-xs text-slate-400">
                Paste any link from Amazon India, Flipkart, Myntra, or Meesho. Generates short custom domain links with preserved affiliate tracking.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-500/15 text-[#00e676] border border-emerald-400/30 self-start sm:self-auto shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> {storeBadge}
          </span>
        </div>

        {/* Input & Button Section */}
        <div className="space-y-2">
          <div>
            <label
              htmlFor="affiliateLinkInput"
              className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Paste Affiliate Link
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <input
                id="affiliateLinkInput"
                type="url"
                placeholder="Paste Amazon, Flipkart, Myntra, or Meesho link (short or full URL)..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                className="flex-1 min-w-0 rounded-xl bg-black/90 border border-white/20 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-[#00f2fe] outline-none"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="grad-btn px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black shrink-0 inline-flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" /> Generate Short Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Test Samples */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-500">Quick Test Samples:</span>
            <button
              type="button"
              onClick={() => {
                setInputUrl('https://www.amazon.in/dp/B0CX21345');
                setErrorMsg('');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-[#00f2fe] border border-white/10 transition cursor-pointer"
            >
              🟠 Amazon India
            </button>
            <button
              type="button"
              onClick={() => {
                setInputUrl('https://www.flipkart.com/poco-x6-pro-5g-racing-grey-512-gb/p/itm12345');
                setErrorMsg('');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-[#00f2fe] border border-white/10 transition cursor-pointer"
            >
              🔵 Flipkart
            </button>
            <button
              type="button"
              onClick={() => {
                setInputUrl('https://www.myntra.com/running-shoes/nike/revolution?affiliateId=ctech2025&utm_source=affiliate');
                setErrorMsg('');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-[#00f2fe] border border-white/10 transition cursor-pointer"
            >
              🔴 Myntra
            </button>
            <button
              type="button"
              onClick={() => {
                setInputUrl('https://www.meesho.com/s/p/123456?ref=classifytech');
                setErrorMsg('');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-[#00f2fe] border border-white/10 transition cursor-pointer"
            >
              🟣 Meesho
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1.5 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </p>
          )}

          {/* Privacy & Zero-Hijacking Trust Guarantee */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Zero Tag Hijacking: Creator tracking tags (tag, affid, utm, ref) are 100% preserved.</span>
            </div>
            {onOpenLegal && (
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => onOpenLegal('terms')}
                  className="text-[#00f2fe] hover:underline cursor-pointer font-bold"
                >
                  Shortener Terms
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="text-[#00f2fe] hover:underline cursor-pointer font-bold"
                >
                  Privacy Policy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Generated Short Link Output Box */}
        {outputUrl && (
          <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Generated Short Link
              </label>
              {trackingNote && (
                <span className="text-[11px] text-[#00e676] font-medium flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> {trackingNote}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
              {/* Display Short URL */}
              <input
                type="text"
                readOnly
                value={outputUrl}
                aria-label="Generated Short URL"
                className="flex-1 min-w-0 rounded-xl bg-slate-950 border border-cyan-400/60 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-[#00f2fe] font-bold outline-none select-all"
              />

              {/* Exactly Two Primary Action Buttons: Copy Link & Open Link */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="grad-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-initial shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  type="button"
                  onClick={handleOpenLink}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-[#00e676] text-xs sm:text-sm font-black inline-flex items-center justify-center gap-1.5 transition flex-1 sm:flex-initial cursor-pointer"
                  title="Open Short Link in new tab"
                >
                  <ExternalLink className="w-4 h-4" /> Open Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Local Storage History List (Last 5 Links) */}
        <div className="pt-3 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#00f2fe]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Recent Generated Links <span className="text-slate-500 font-normal">({history.length}/5)</span>
              </h4>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[11px] text-slate-400 hover:text-red-400 transition flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/5 cursor-pointer"
                title="Clear history"
              >
                <Trash2 className="w-3 h-3" /> Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>No links generated yet. Your last 5 generated short links will be stored here automatically.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => {
                const isCopied = copiedHistoryId === item.id;
                const isAmazon = item.store === 'amazon';
                const isFlipkart = item.store === 'flipkart';
                const isMyntra = item.store === 'myntra';
                const isMeesho = item.store === 'meesho';

                const badgeClass = isAmazon
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : isFlipkart
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : isMyntra
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : isMeesho
                  ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                  : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';

                return (
                  <div
                    key={item.id}
                    className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    {/* Item Information */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeClass}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTimestamp(item.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono truncate">
                        <span className="text-slate-500 shrink-0 text-[11px]">Original:</span>
                        <span className="truncate text-slate-400 text-[11px]" title={item.originalUrl}>
                          {item.originalUrl}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono truncate">
                        <span className="text-slate-500 shrink-0 text-[11px]">Short Link:</span>
                        <span className="truncate text-[#00f2fe] font-semibold text-[11px]" title={item.finalUrl}>
                          {item.finalUrl}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReuseHistoryItem(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/15 hover:text-[#00f2fe] border border-white/10 text-xs font-semibold text-slate-300 transition inline-flex items-center gap-1 cursor-pointer"
                        title="Load into generator"
                      >
                        <ArrowRight className="w-3 h-3" /> Load
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyHistoryItem(item)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-500/20 text-[#00e676] border border-emerald-400/40'
                            : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                        }`}
                        title="Copy short link"
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {isCopied ? 'Copied' : 'Copy'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenHistoryItem(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00e676] border border-emerald-400/30 text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        title="Open short link redirect"
                      >
                        <ExternalLink className="w-3 h-3" /> Open
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
