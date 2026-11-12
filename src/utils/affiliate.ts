/**
 * CLASSIFY TECH Smart Affiliate Shortener Utilities
 * Fully synchronized with Cloudflare Worker Engine (https://classify.classifytechz.workers.dev)
 * 
 * Supported Retailers:
 * - Amazon (amazon.in, amazon.com, amzn.in, amzn.to, amzn.eu)
 * - Flipkart (flipkart.com, dl.flipkart.com, fkrt.it, fkrt.cc, fkrt.to, fkrt.co, fktr.in)
 * - Myntra (myntra.com, myntr.in, myntr.it)
 * - Ajio (ajio.com)
 * - Meesho (meesho.com)
 * - Nykaa (nykaa.com)
 * - Croma (croma.com)
 * - Tata CLiQ (tatacliq.com)
 * - Snapdeal (snapdeal.com)
 * - Reliance Digital (reliancedigital.in)
 * - FirstCry (firstcry.com)
 * - Any valid HTTP/HTTPS store
 */

export const WORKER_URLS = [
  'https://classifytech.classifytechz.workers.dev',
  'https://classify.classifytechz.workers.dev',
];

export const WORKER_URL = 'https://classifytech.classifytechz.workers.dev';

export const COLLISION_SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export type SupportedStore =
  | 'amazon'
  | 'flipkart'
  | 'myntra'
  | 'ajio'
  | 'meesho'
  | 'nykaa'
  | 'croma'
  | 'tatacliq'
  | 'snapdeal'
  | 'reliancedigital'
  | 'firstcry'
  | 'other';

export const STORE_DISPLAY_NAMES: Record<string, string> = {
  amazon: 'Amazon',
  flipkart: 'Flipkart',
  myntra: 'Myntra',
  ajio: 'Ajio',
  meesho: 'Meesho',
  nykaa: 'Nykaa',
  croma: 'Croma',
  tatacliq: 'Tata CLiQ',
  snapdeal: 'Snapdeal',
  reliancedigital: 'Reliance Digital',
  firstcry: 'FirstCry',
  other: 'Partner Store',
};

export function getStoreDisplayName(storeKey?: string): string {
  if (!storeKey) return 'Partner Store';
  const normalized = storeKey.toLowerCase().trim();
  return STORE_DISPLAY_NAMES[normalized] || storeKey.charAt(0).toUpperCase() + storeKey.slice(1);
}

export interface RetailerValidationResult {
  valid: boolean;
  store?: SupportedStore;
  storeName?: string;
  error?: string;
  cleanUrl?: string;
}

/**
 * Checks if a URL belongs to a supported retailer and is safe.
 * Strictly rejects dangerous schemes (javascript:, data:, vbscript:, file:).
 */
export function isSupportedRetailerUrl(rawUrl: string): RetailerValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Please enter a valid product link.' };
  }

  const trimmed = rawUrl.trim();

  // Reject unsafe schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('about:') ||
    lower.startsWith('blob:')
  ) {
    return { valid: false, error: 'Unsafe or prohibited URL scheme detected.' };
  }

  let parsed: URL;
  try {
    let candidate = trimmed;
    if (candidate.startsWith('//')) {
      candidate = `https:${candidate}`;
    } else if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
      candidate = `https://${candidate}`;
    }
    parsed = new URL(candidate);
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS and HTTP URLs are allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Amazon
  if (hostname.includes('amazon') || hostname.includes('amzn')) {
    return { valid: true, store: 'amazon', storeName: 'Amazon', cleanUrl: parsed.toString() };
  }

  // Flipkart
  if (hostname.includes('flipkart') || hostname.includes('fkrt') || hostname.includes('fktr')) {
    return { valid: true, store: 'flipkart', storeName: 'Flipkart', cleanUrl: parsed.toString() };
  }

  // Myntra
  if (hostname.includes('myntra') || hostname.includes('myntr')) {
    return { valid: true, store: 'myntra', storeName: 'Myntra', cleanUrl: parsed.toString() };
  }

  // Ajio
  if (hostname.includes('ajio')) {
    return { valid: true, store: 'ajio', storeName: 'Ajio', cleanUrl: parsed.toString() };
  }

  // Meesho
  if (hostname.includes('meesho')) {
    return { valid: true, store: 'meesho', storeName: 'Meesho', cleanUrl: parsed.toString() };
  }

  // Nykaa
  if (hostname.includes('nykaa')) {
    return { valid: true, store: 'nykaa', storeName: 'Nykaa', cleanUrl: parsed.toString() };
  }

  // Croma
  if (hostname.includes('croma')) {
    return { valid: true, store: 'croma', storeName: 'Croma', cleanUrl: parsed.toString() };
  }

  // Tata CLiQ
  if (hostname.includes('tatacliq')) {
    return { valid: true, store: 'tatacliq', storeName: 'Tata CLiQ', cleanUrl: parsed.toString() };
  }

  // Snapdeal
  if (hostname.includes('snapdeal')) {
    return { valid: true, store: 'snapdeal', storeName: 'Snapdeal', cleanUrl: parsed.toString() };
  }

  // Reliance Digital
  if (hostname.includes('reliancedigital')) {
    return { valid: true, store: 'reliancedigital', storeName: 'Reliance Digital', cleanUrl: parsed.toString() };
  }

  // FirstCry
  if (hostname.includes('firstcry')) {
    return { valid: true, store: 'firstcry', storeName: 'FirstCry', cleanUrl: parsed.toString() };
  }

  // Accepts any other valid HTTP/HTTPS link to be processed by Cloudflare Worker
  return {
    valid: true,
    store: 'other',
    storeName: 'Partner Store',
    cleanUrl: parsed.toString(),
  };
}

/**
 * Regular expression to identify HTTP and HTTPS URLs within raw text.
 */
export const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

/**
 * Extracts all valid HTTP/HTTPS URLs from raw text, removing trailing punctuation.
 */
export function extractUrlsFromText(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  return matches.map((url) => url.replace(/[.,;:!?)]+$/, ''));
}

/**
 * Validates if the returned affiliate URL is a broken or dummy link.
 * Guards against placeholder Flipkart links lacking a 'pid=' parameter.
 */
export function isDummyOrBrokenLink(affiliateUrl?: string): boolean {
  if (!affiliateUrl) return true;
  const lower = affiliateUrl.toLowerCase();
  // Flipkart dummy/placeholder link guard
  if (lower.includes('/item/p/product') && !lower.includes('pid=')) {
    return true;
  }
  return false;
}

/**
 * Inspects URL parameters for affiliate IDs and Meta/Facebook tracking attribution.
 */
export interface DetectedTrackingParams {
  hasFlipkartPid: boolean;
  hasAmazonTag: boolean;
  hasFlipkartAffid: boolean;
  hasMyntraAffiliateId: boolean;
  hasEncryptedPayload: boolean;
  hasCts: boolean;
  hasUtmZigId: boolean;
  hasContentSourceFb: boolean;
  hasChannelTypeFb: boolean;
}

export function analyzeTrackingParams(url?: string): DetectedTrackingParams {
  if (!url) {
    return {
      hasFlipkartPid: false,
      hasAmazonTag: false,
      hasFlipkartAffid: false,
      hasMyntraAffiliateId: false,
      hasEncryptedPayload: false,
      hasCts: false,
      hasUtmZigId: false,
      hasContentSourceFb: false,
      hasChannelTypeFb: false,
    };
  }
  const lower = url.toLowerCase();
  return {
    hasFlipkartPid: lower.includes('pid='),
    hasAmazonTag: lower.includes('tag=classifytech-21'),
    hasFlipkartAffid: lower.includes('affid='),
    hasMyntraAffiliateId: lower.includes('affiliate_id='),
    hasEncryptedPayload: lower.includes('encrypted_payload='),
    hasCts: lower.includes('cts='),
    hasUtmZigId: lower.includes('utm_zig_id='),
    hasContentSourceFb: lower.includes('content_source=fb'),
    hasChannelTypeFb: lower.includes('channel_type=fb'),
  };
}

/**
 * Generates a collision-safe alphanumeric short code.
 */
export function generateShortCode(length = 6): string {
  let result = '';
  if (typeof crypto !== 'undefined') {
    const randomVals = new Uint8Array(length);
    crypto.getRandomValues(randomVals);
    for (let i = 0; i < length; i++) {
      result += COLLISION_SAFE_CHARS[randomVals[i] % COLLISION_SAFE_CHARS.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += COLLISION_SAFE_CHARS.charAt(Math.floor(Math.random() * COLLISION_SAFE_CHARS.length));
    }
  }
  return result;
}

/**
 * Builds the branded short URL using the website origin.
 */
export function buildBrandedShortUrl(code: string, origin?: string): string {
  const cleanCode = (code || '').replace(/^post-/, '').trim();
  if (origin && typeof origin === 'string' && origin.startsWith('http')) {
    const cleanOrigin = origin.replace(/\/+$/, '');
    return `${cleanOrigin}/s/${cleanCode}`;
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/s/${cleanCode}`;
  }
  return `/s/${cleanCode}`;
}

/**
 * Client-Side LocalStorage Cache for Instant Offline & Zero-Failure Short Link Resolution.
 */
const SHORT_LINKS_CACHE_KEY = 'classify_short_links_cache';

export interface ShortCodeMappingRecord {
  code: string;
  postId?: string;
  shortUrl?: string;
  affiliateUrl?: string;
  originalUrl?: string;
  resolvedUrl?: string;
  store?: string;
  storeName?: string;
  timestamp?: number;
}

export function saveShortCodeToCache(record: ShortCodeMappingRecord): void {
  if (!record || !record.code || !record.affiliateUrl) return;
  try {
    if (typeof localStorage === 'undefined') return;
    const cleanCode = record.code.replace(/^post-/, '').trim();
    const raw = localStorage.getItem(SHORT_LINKS_CACHE_KEY);
    const cache: Record<string, ShortCodeMappingRecord> = raw ? JSON.parse(raw) : {};
    
    const entry: ShortCodeMappingRecord = {
      ...record,
      code: cleanCode,
      postId: record.postId || `post-${cleanCode}`,
      timestamp: Date.now(),
    };

    cache[cleanCode] = entry;
    if (entry.postId) {
      cache[entry.postId] = entry;
    }

    localStorage.setItem(SHORT_LINKS_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('[Cache] Failed to save short code mapping:', err);
  }
}

export function getShortCodeFromCache(rawCodeOrPostId: string): ShortCodeMappingRecord | null {
  if (!rawCodeOrPostId || typeof rawCodeOrPostId !== 'string') return null;
  try {
    if (typeof localStorage === 'undefined') return null;
    const cleanKey = rawCodeOrPostId.trim();
    const bareCode = cleanKey.replace(/^post-/, '');
    const postIdKey = `post-${bareCode}`;

    // 1. Check primary cache
    const raw = localStorage.getItem(SHORT_LINKS_CACHE_KEY);
    if (raw) {
      const cache = JSON.parse(raw);
      if (cache[cleanKey] && cache[cleanKey].affiliateUrl) return cache[cleanKey];
      if (cache[bareCode] && cache[bareCode].affiliateUrl) return cache[bareCode];
      if (cache[postIdKey] && cache[postIdKey].affiliateUrl) return cache[postIdKey];
    }

    // 2. Fallback: check affiliate history
    const historyRaw = localStorage.getItem('classify_affiliate_history');
    if (historyRaw) {
      const history = JSON.parse(historyRaw);
      if (Array.isArray(history)) {
        const match = history.find(
          (h) =>
            h &&
            h.affiliateUrl &&
            (h.code === cleanKey || h.code === bareCode || h.postId === cleanKey || h.postId === postIdKey)
        );
        if (match) {
          return {
            code: match.code || bareCode,
            postId: match.postId || postIdKey,
            shortUrl: match.shortUrl,
            affiliateUrl: match.affiliateUrl,
            originalUrl: match.originalUrl,
            resolvedUrl: match.resolvedUrl,
            store: match.store,
            storeName: match.storeName,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[Cache] Failed to read short code mapping:', err);
  }
  return null;
}

/**
 * Robust destination extractor that accurately parses Worker HTML redirects,
 * JSON responses, plain-text URLs, and HTTP redirect headers.
 */
export function extractDestinationFromWorkerResponse(
  textOrJson: any,
  headers?: { get: (name: string) => string | null }
): string | null {
  // Check location header if available (from 301/302 redirects)
  if (headers && typeof headers.get === 'function') {
    const loc = headers.get('location');
    if (loc && typeof loc === 'string' && loc.startsWith('http')) {
      return loc.trim();
    }
  }

  // If already parsed object or JSON
  if (typeof textOrJson === 'object' && textOrJson !== null) {
    const candidate =
      textOrJson.affiliateUrl ||
      textOrJson.url ||
      textOrJson.target ||
      textOrJson.destination ||
      textOrJson.finalUrl ||
      textOrJson.originalUrl ||
      textOrJson.resolvedUrl;
    if (candidate && typeof candidate === 'string' && candidate.startsWith('http')) {
      return candidate.trim();
    }
  }

  if (typeof textOrJson === 'string') {
    const trimmed = textOrJson.trim();

    // Check if it's a JSON string
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const candidate =
          parsed.affiliateUrl ||
          parsed.url ||
          parsed.target ||
          parsed.destination ||
          parsed.finalUrl ||
          parsed.originalUrl ||
          parsed.resolvedUrl;
        if (candidate && typeof candidate === 'string' && candidate.startsWith('http')) {
          return candidate.trim();
        }
      } catch {}
    }

    // Check if it is a plain text URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const firstLine = trimmed.split(/[\r\n]+/)[0].trim();
      if (firstLine.startsWith('http')) return firstLine;
    }

    // HTML Pattern 1: window.location.replace("...") or window.location.href = "..."
    const jsMatch =
      trimmed.match(/window\.location\.(?:replace|href)\s*=\s*["']([^"']+)["']/i) ||
      trimmed.match(/window\.location\.replace\(["']([^"']+)["']\)/i);
    if (jsMatch && jsMatch[1] && jsMatch[1].startsWith('http')) {
      return jsMatch[1].trim();
    }

    // HTML Pattern 2: <meta property="og:url" content="...">
    const ogMatch = trimmed.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
    if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http')) {
      return ogMatch[1].trim();
    }

    // HTML Pattern 3: <meta http-equiv="refresh" content="0;url=...">
    const refreshMatch = trimmed.match(/<meta[^>]+content=["'][^"']*url=([^"'>\s]+)["']/i);
    if (refreshMatch && refreshMatch[1] && refreshMatch[1].startsWith('http')) {
      return refreshMatch[1].trim();
    }

    // HTML Pattern 4: <a href="...">
    const linkMatch = trimmed.match(/<a\b[^>]*href=["'](https?:\/\/[^"']+)["']/i);
    if (linkMatch && linkMatch[1] && !linkMatch[1].includes('workers.dev')) {
      return linkMatch[1].trim();
    }
  }

  return null;
}

export interface ResolvedShortLinkResult {
  success: boolean;
  code: string;
  affiliateUrl?: string;
  originalUrl?: string;
  store?: string;
  storeName?: string;
  error?: string | null;
  fromCache?: boolean;
}

/**
 * Universal Short Link Resolver:
 * Resolves short codes with zero failure:
 * 1. Immediate localStorage cache check
 * 2. Express server proxy (/api/resolve/:code) to bypass browser CORS
 * 3. Direct Cloudflare Worker endpoints with full HTML/JSON/Location parsing
 * 4. Offline/CORS fallback to localStorage cache
 */
export async function resolveShortLink(
  rawCode: string,
  searchQuery: string = ''
): Promise<ResolvedShortLinkResult> {
  const cleanCode = (rawCode || '').replace(/^post-/, '').trim();
  if (!cleanCode) {
    return {
      success: false,
      code: '',
      error: 'Invalid or missing short code.',
    };
  }

  // 1. Check local cache first for instant resolution
  const cached = getShortCodeFromCache(cleanCode);
  if (cached && cached.affiliateUrl) {
    return {
      success: true,
      code: cleanCode,
      affiliateUrl: cached.affiliateUrl,
      originalUrl: cached.originalUrl,
      store: cached.store || 'other',
      storeName: cached.storeName || getStoreDisplayName(cached.store),
      fromCache: true,
    };
  }

  // 2. Try local server proxy endpoint (/api/resolve/:code)
  // Express server executes server-to-server HTTP request without browser CORS restrictions
  try {
    const proxyRes = await fetch(`/api/resolve/${encodeURIComponent(cleanCode)}${searchQuery}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.success && data.affiliateUrl) {
        saveShortCodeToCache({
          code: cleanCode,
          affiliateUrl: data.affiliateUrl,
          store: data.store,
          storeName: data.storeName,
        });
        return {
          success: true,
          code: cleanCode,
          affiliateUrl: data.affiliateUrl,
          store: data.store || 'other',
          storeName: data.storeName || getStoreDisplayName(data.store),
        };
      }
    }
  } catch (proxyErr) {
    console.warn('[Resolve] Server proxy failed, trying direct worker:', proxyErr);
  }

  // 3. Try direct worker endpoints (classifytech & classify)
  for (const domain of WORKER_URLS) {
    try {
      const workerUrl = `${domain}/${encodeURIComponent(cleanCode)}${searchQuery}`;
      const res = await fetch(workerUrl, {
        headers: { Accept: 'text/html,application/json,*/*' },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const text = await res.text();
        const extracted = extractDestinationFromWorkerResponse(text, res.headers);
        if (extracted) {
          const storeValidation = isSupportedRetailerUrl(extracted);
          const result = {
            success: true,
            code: cleanCode,
            affiliateUrl: extracted,
            store: storeValidation.store || 'other',
            storeName: getStoreDisplayName(storeValidation.store),
          };
          saveShortCodeToCache({
            code: cleanCode,
            affiliateUrl: extracted,
            store: result.store,
            storeName: result.storeName,
          });
          return result;
        }
      }
    } catch (err) {
      console.warn(`[Resolve] Worker ${domain} fetch failed:`, err);
    }
  }

  // 4. Fallback check on cache (covers offline, private browsing, and CORS environments)
  const secondaryCache = getShortCodeFromCache(cleanCode);
  if (secondaryCache && secondaryCache.affiliateUrl) {
    return {
      success: true,
      code: cleanCode,
      affiliateUrl: secondaryCache.affiliateUrl,
      originalUrl: secondaryCache.originalUrl,
      store: secondaryCache.store || 'other',
      storeName: secondaryCache.storeName || getStoreDisplayName(secondaryCache.store),
      fromCache: true,
    };
  }

  return {
    success: false,
    code: cleanCode,
    error: 'This product link is expired, unavailable, or has been removed.',
  };
}

export interface WorkerShortenResponse {
  success: boolean;
  resolvedUrl?: string;
  affiliateUrl?: string;
  store?: SupportedStore | string;
  shortCode?: string;
  shortUrl?: string;
  error?: string | null;
}

/**
 * Smart API call to Cloudflare Worker with automatic multi-domain & GET fallback.
 * Automatically saves generated mapping to client-side localStorage cache.
 */
export async function shortenUrlWithWorker(
  url: string,
  customCode?: string
): Promise<WorkerShortenResponse> {
  const trimmedUrl = url.trim();
  const trimmedCode = (customCode || '').trim();

  // Attempt 1: Direct POST /api/shorten across both worker domains
  for (const domain of WORKER_URLS) {
    try {
      const postBody: Record<string, string> = { url: trimmedUrl };
      if (trimmedCode) {
        postBody.customCode = trimmedCode;
      }

      const postRes = await fetch(`${domain}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
        signal: AbortSignal.timeout(9000),
      });

      if (postRes.ok) {
        const data: WorkerShortenResponse = await postRes.json();
        if (data && (data.success || data.affiliateUrl || data.shortUrl)) {
          const finalCode = data.shortCode || (data as any).code || trimmedCode;
          if (finalCode) {
            data.shortCode = finalCode;
            data.shortUrl = buildBrandedShortUrl(finalCode, typeof window !== 'undefined' ? window.location.origin : undefined);
            
            // Persist to reliable client-side cache
            saveShortCodeToCache({
              code: finalCode,
              postId: `post-${finalCode}`,
              shortUrl: data.shortUrl,
              affiliateUrl: data.affiliateUrl || data.resolvedUrl || trimmedUrl,
              resolvedUrl: data.resolvedUrl || trimmedUrl,
              originalUrl: trimmedUrl,
              store: String(data.store || 'other'),
              storeName: getStoreDisplayName(data.store),
            });
          }
          return data;
        }
      }
    } catch (postErr) {
      console.warn(`[Affiliate API] Worker ${domain} POST failed:`, postErr);
    }
  }

  // Attempt 2: Fallback GET /?url=...&shorten=1&code=... across worker domains
  for (const domain of WORKER_URLS) {
    try {
      let getUrl = `${domain}/?url=${encodeURIComponent(trimmedUrl)}&shorten=1`;
      if (trimmedCode) {
        getUrl += `&code=${encodeURIComponent(trimmedCode)}`;
      }

      const getRes = await fetch(getUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(9000),
      });

      if (getRes.ok) {
        const data: WorkerShortenResponse = await getRes.json();
        if (data && (data.success || data.affiliateUrl || data.shortUrl)) {
          const finalCode = data.shortCode || (data as any).code || trimmedCode;
          if (finalCode) {
            data.shortCode = finalCode;
            data.shortUrl = buildBrandedShortUrl(finalCode, typeof window !== 'undefined' ? window.location.origin : undefined);
            
            saveShortCodeToCache({
              code: finalCode,
              postId: `post-${finalCode}`,
              shortUrl: data.shortUrl,
              affiliateUrl: data.affiliateUrl || data.resolvedUrl || trimmedUrl,
              resolvedUrl: data.resolvedUrl || trimmedUrl,
              originalUrl: trimmedUrl,
              store: String(data.store || 'other'),
              storeName: getStoreDisplayName(data.store),
            });
          }
          return data;
        }
      }
    } catch (getErr) {
      console.warn(`[Affiliate API] Worker ${domain} GET fallback failed:`, getErr);
    }
  }

  // Attempt 3: Local backend server proxy /api/shorten
  try {
    const proxyRes = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmedUrl, customCode: trimmedCode || undefined }),
      signal: AbortSignal.timeout(9000),
    });

    if (proxyRes.ok) {
      const data: WorkerShortenResponse = await proxyRes.json();
      if (data && (data.success || data.affiliateUrl || data.shortUrl)) {
        const finalCode = data.shortCode || (data as any).code || trimmedCode;
        if (finalCode) {
          data.shortCode = finalCode;
          data.shortUrl = buildBrandedShortUrl(finalCode, typeof window !== 'undefined' ? window.location.origin : undefined);
          
          saveShortCodeToCache({
            code: finalCode,
            postId: `post-${finalCode}`,
            shortUrl: data.shortUrl,
            affiliateUrl: data.affiliateUrl || data.resolvedUrl || trimmedUrl,
            resolvedUrl: data.resolvedUrl || trimmedUrl,
            originalUrl: trimmedUrl,
            store: String(data.store || 'other'),
            storeName: getStoreDisplayName(data.store),
          });
        }
        return data;
      }
    }
  } catch (proxyErr) {
    console.warn('[Affiliate API] Local server proxy failed:', proxyErr);
  }

  return {
    success: false,
    error: 'Unable to connect to Cloudflare Worker. Please check network connectivity and try again.',
  };
}

/**
 * Full Deal Post / Text Replacement:
 * Scans raw promotional text for product URLs, processes each through the Worker,
 * and returns the updated text with original links replaced by verified short links.
 */
export async function processDealPostText(
  rawText: string,
  customCode?: string
): Promise<{
  updatedText: string;
  results: WorkerShortenResponse[];
  hasUrls: boolean;
}> {
  const urls = extractUrlsFromText(rawText);
  if (urls.length === 0) {
    return { updatedText: rawText, results: [], hasUrls: false };
  }

  const uniqueUrls = Array.from(new Set(urls));
  const results: WorkerShortenResponse[] = [];
  let replacedText = rawText;

  for (let i = 0; i < uniqueUrls.length; i++) {
    const targetUrl = uniqueUrls[i];
    // Apply custom alias to the single URL if only one is present
    const aliasForUrl = uniqueUrls.length === 1 && customCode ? customCode : undefined;
    const workerRes = await shortenUrlWithWorker(targetUrl, aliasForUrl);
    results.push(workerRes);

    if (workerRes.success && (workerRes.shortUrl || workerRes.affiliateUrl || workerRes.shortCode)) {
      const code = workerRes.shortCode;
      const replacement = code
        ? buildBrandedShortUrl(code, typeof window !== 'undefined' ? window.location.origin : undefined)
        : (workerRes.shortUrl || workerRes.affiliateUrl || targetUrl);
      replacedText = replacedText.split(targetUrl).join(replacement);
    }
  }

  return {
    updatedText: replacedText,
    results,
    hasUrls: true,
  };
}

export interface GeneratedLinkRecord {
  code: string;
  postId?: string;
  shortUrl: string;
  originalUrl: string;
  affiliateUrl?: string;
  resolvedUrl?: string;
  store: SupportedStore | string;
  storeName: string;
  kvSaved?: boolean;
  createdAt: number;
  expiresAt?: number;
  ttlSeconds?: number;
}
