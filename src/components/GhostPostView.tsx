import React, { useEffect, useState, useRef } from 'react';
import { ExternalLink, ShieldCheck, ArrowRight, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface GhostPostViewProps {
  code: string;
  postId: string;
  onExit?: () => void;
}

export const GhostPostView: React.FC<GhostPostViewProps> = ({ code, postId, onExit }) => {
  const [affiliateUrl, setAffiliateUrl] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('Official Merchant');
  const [status, setStatus] = useState<string>('Verifying official merchant product listing...');
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(true);
  const hasTriggeredRef = useRef<boolean>(false);

  const resolveDestination = async () => {
    setError(null);
    setIsRedirecting(true);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsRedirecting(false);
      setError('You appear to be offline. Please reconnect to the internet and click retry.');
      return;
    }

    const search = typeof window !== 'undefined' ? window.location.search || '' : '';
    const endpoint = `https://classify.classifytechz.workers.dev/api/resolve/${encodeURIComponent(code)}${search}`;
    let resolved: any = null;

    try {
      const cfRes = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (cfRes.ok) {
        resolved = await cfRes.json();
      }
    } catch (workerErr) {
      console.warn('[GhostPost] Worker resolve failed, trying proxy fallback:', workerErr);
    }

    // Local server proxy fallback
    if (!resolved || !resolved.success || !resolved.affiliateUrl) {
      try {
        const localRes = await fetch(`/api/resolve/${encodeURIComponent(code)}${search}`);
        if (localRes.ok) {
          resolved = await localRes.json();
        }
      } catch (localErr) {
        console.warn('[GhostPost] Proxy fallback resolve failed:', localErr);
      }
    }

    if (resolved && resolved.success && resolved.affiliateUrl) {
      const targetUrl = resolved.affiliateUrl;
      const merchant = resolved.storeName || (resolved.store ? resolved.store.toUpperCase() : 'Official Partner Store');
      
      setAffiliateUrl(targetUrl);
      setStoreName(merchant);
      setStatus(`Routing to verified ${merchant} product page...`);

      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;

        // 4. Dynamically trigger click on <a id="ghostPostCta">
        setTimeout(() => {
          const cta = document.getElementById('ghostPostCta') as HTMLAnchorElement | null;
          if (cta) {
            cta.href = targetUrl;
            cta.rel = 'opener';
            cta.setAttribute('referrerpolicy', 'unsafe-url');
            try {
              cta.click();
            } catch (clickErr) {
              console.warn('[GhostPost] programmatic click fallback:', clickErr);
            }
          }

          // 100ms fallback to window.location.href
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 100);
        }, 50);
      }
    } else {
      setIsRedirecting(false);
      setError(resolved?.error || 'This product link is expired, unavailable, or has been removed.');
    }
  };

  useEffect(() => {
    // 1. Ensure <meta name="referrer" content="unsafe-url"> is present in document head for Amazon/Flipkart tracking
    let metaReferrer = document.querySelector('meta[name="referrer"]') as HTMLMetaElement | null;
    const prevReferrer: string = (metaReferrer ? metaReferrer.getAttribute('content') : null) || 'no-referrer-when-downgrade';
    if (metaReferrer) {
      metaReferrer.setAttribute('content', 'unsafe-url');
    } else {
      metaReferrer = document.createElement('meta');
      metaReferrer.name = 'referrer';
      metaReferrer.content = 'unsafe-url';
      document.head.appendChild(metaReferrer);
    }

    // 2. Use window.history.replaceState to set browser URL to /post/${postId}
    // while keeping incoming query parameters (fbclid, etc.) in memory and in the URL
    const search = window.location.search || '';
    const ghostPath = `/post/${postId}${search}`;
    try {
      if (window.location.pathname !== `/post/${postId}`) {
        window.history.replaceState(null, '', ghostPath);
      }
    } catch (e) {
      console.warn('[GhostPost] replaceState failed:', e);
    }

    resolveDestination();

    return () => {
      const meta = document.querySelector('meta[name="referrer"]') as HTMLMetaElement | null;
      if (meta) {
        meta.setAttribute('content', prevReferrer);
      }
    };
  }, [code, postId]);

  return (
    <article
      data-post-id={postId}
      id="ghostPost"
      className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-[#00f2fe] selection:text-black font-sans relative overflow-hidden"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00f2fe]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <header className="w-full max-w-2xl flex items-center justify-between py-4 border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#4facfe] flex items-center justify-center text-black font-black text-lg shadow-lg shadow-[#00f2fe]/20">
            C
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              CLASSIFY TECH
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-semibold border border-cyan-500/20">
              Hardware Desk
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline font-mono">Verified Partner Protocol</span>
        </div>
      </header>

      {/* Main Ghost Post Article Card */}
      <main className="w-full max-w-xl my-auto py-8 z-10">
        <div className="bg-[#0e1626]/90 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
          {/* Post Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/30">
              <Layers className="w-3.5 h-3.5" />
              Verified Deal Post
            </span>
            <span className="font-mono text-[11px] text-gray-400">
              Post ID: <span className="text-gray-200">{postId}</span>
            </span>
          </div>

          {/* Post Title */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-3">
            CLASSIFY TECH Verified Hardware Recommendation
          </h1>

          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            This post references an official retail listing verified for pricing authenticity, hardware architecture, and consumer safety.
          </p>

          {/* Status Box */}
          {error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-200">Unable to Resolve Link</h3>
                  <p className="text-xs text-gray-300 mt-1">{error}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    hasTriggeredRef.current = false;
                    resolveDestination();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00f2fe]/20 hover:bg-[#00f2fe]/30 text-[#00f2fe] border border-[#00f2fe]/40 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
                {onExit && (
                  <button
                    type="button"
                    onClick={onExit}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>Return to Homepage</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00f2fe]/10 flex items-center justify-center text-[#00f2fe]">
                  <RefreshCw className={`w-4 h-4 ${isRedirecting ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{status}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Target Retailer: <strong className="text-cyan-300">{storeName}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Official CTA Anchor Required by User Specification */}
          <div className="space-y-3">
            <a
              id="ghostPostCta"
              href={affiliateUrl || '#'}
              rel="opener"
              referrerPolicy="unsafe-url"
              className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                affiliateUrl
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-black hover:opacity-95 shadow-lg shadow-[#00f2fe]/20 cursor-pointer'
                  : 'bg-white/10 text-gray-400 cursor-not-allowed pointer-events-none'
              }`}
            >
              <span>Continue to {storeName}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="text-center">
              <p className="text-[11px] text-gray-500">
                Automatic navigation active. Click the button above if your browser does not redirect within a second.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="w-full max-w-2xl py-4 border-t border-white/10 text-center z-10">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} CLASSIFY TECH. All product trademarks, logos, and retailer brand identities belong to their respective owners.
        </p>
      </footer>
    </article>
  );
};
