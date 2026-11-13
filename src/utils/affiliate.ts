/**
 * CLASSIFY TECH Smart Affiliate Shortener Utilities
 * Synchronized with Cloudflare Worker Engine (https://classify.classifytechz.workers.dev)
 *
 * Strictly Supported Retailers (3 Stores Only):
 * - Amazon (amazon.in, amazon.com, amzn.in, amzn.to, a.co)
 * - Flipkart (flipkart.com, dl.flipkart.com, fkrt.it, fkrt.cc, fkrt.co)
 * - Myntra (myntra.com, myntr.it, myntr.in)
 */

export const WORKER_URL = 'https://classify.classifytechz.workers.dev';

export const WORKER_URLS = [
  'https://classify.classifytechz.workers.dev',
  'https://classifytech.classifytechz.workers.dev',
];

export const COLLISION_SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export type SupportedStore = 'amazon' | 'flipkart' | 'myntra';

export const STORE_DISPLAY_NAMES: Record<SupportedStore, string> = {
  amazon: 'Amazon',
  flipkart: 'Flipkart',
  myntra: 'Myntra',
};

export function getStoreDisplayName(storeKey?: string): string {
  if (!storeKey) return 'Official Store';
  const normalized = storeKey.toLowerCase().trim() as SupportedStore;
  return STORE_DISPLAY_NAMES[normalized] || 'Official Store';
}

export interface RetailerValidationResult {
  valid: boolean;
  store?: SupportedStore;
  storeName?: string;
  error?: string;
  cleanUrl?: string;
}

function matchesDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

/**
 * Checks if a URL belongs strictly to Amazon, Flipkart, or Myntra.
 * Rejects all other stores and dangerous URL schemes.
 */
export function isSupportedRetailerUrl(rawUrl: string): RetailerValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Please enter a valid Amazon, Flipkart, or Myntra link.' };
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

  // Amazon: amazon.in, amazon.com, amzn.in, amzn.to, a.co
  if (
    matchesDomain(hostname, 'amazon.in') ||
    matchesDomain(hostname, 'amazon.com') ||
    matchesDomain(hostname, 'amzn.in') ||
    matchesDomain(hostname, 'amzn.to') ||
    matchesDomain(hostname, 'a.co')
  ) {
    return { valid: true, store: 'amazon', storeName: 'Amazon', cleanUrl: parsed.toString() };
  }

  // Flipkart: flipkart.com, dl.flipkart.com, fkrt.it, fkrt.cc, fkrt.co
  if (
    matchesDomain(hostname, 'flipkart.com') ||
    matchesDomain(hostname, 'fkrt.it') ||
    matchesDomain(hostname, 'fkrt.cc') ||
    matchesDomain(hostname, 'fkrt.co')
  ) {
    return { valid: true, store: 'flipkart', storeName: 'Flipkart', cleanUrl: parsed.toString() };
  }

  // Myntra: myntra.com, myntr.it, myntr.in
  if (
    matchesDomain(hostname, 'myntra.com') ||
    matchesDomain(hostname, 'myntr.it') ||
    matchesDomain(hostname, 'myntr.in')
  ) {
    return { valid: true, store: 'myntra', storeName: 'Myntra', cleanUrl: parsed.toString() };
  }

  return {
    valid: false,
    error: 'Only Amazon, Flipkart, and Myntra product links are supported.',
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
 * Validates if the returned affiliate URL is a broken or dummy placeholder link.
 * Guards against placeholder Flipkart links lacking a 'pid=' parameter.
 */
export function isDummyOrBrokenLink(affiliateUrl?: string): boolean {
  if (!affiliateUrl) return true;
  const lower = affiliateUrl.toLowerCase();
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
 * Builds the branded short URL using the current website origin (/s/:shortCode).
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
 * Extracts shortCode and postId from browser location parts BEFORE any history.replaceState runs.
 */
export function extractGhostPostFromLocation(
  pathname: string,
  search = '',
  hash = ''
): { code: string; postId: string } | null {
  try {
    // 1. Detect /s/:shortCode
    const sMatch = (pathname || '').match(/^\/s\/([a-zA-Z0-9_-]{4,24})\/?/);
    if (sMatch) {
      const cleanCode = sMatch[1].replace(/^post-/, '').trim();
      return { code: cleanCode, postId: `post-${cleanCode}` };
    }

    // 2. Detect /post/:postId
    const pMatch = (pathname || '').match(/^\/post\/([a-zA-Z0-9_-]{4,30})\/?/);
    if (pMatch) {
      const cleanCode = pMatch[1].replace(/^post-/, '').trim();
      return { code: cleanCode, postId: `post-${cleanCode}` };
    }

    // 3. Detect query parameters (?s=code, ?code=code, ?shortCode=code, ?postId=post-code)
    if (search) {
      const params = new URLSearchParams(search);
      const queryCandidate =
        params.get('s') || params.get('code') || params.get('shortCode') || params.get('postId');
      if (queryCandidate && /^[a-zA-Z0-9_-]{4,30}$/.test(queryCandidate)) {
        const cleanCode = queryCandidate.replace(/^post-/, '').trim();
        return { code: cleanCode, postId: `post-${cleanCode}` };
      }
    }

    // 4. Detect hash routing (#/s/:code or #/post/:id)
    if (hash) {
      const hashMatch = hash.match(/#(?:(?:\/s\/)|(?:\/post\/))([a-zA-Z0-9_-]{4,30})\/?/);
      if (hashMatch) {
        const cleanCode = hashMatch[1].replace(/^post-/, '').trim();
        return { code: cleanCode, postId: `post-${cleanCode}` };
      }
    }
  } catch {
    // Ignore malformed URI errors
  }

  return null;
}

/**
 * Client-Side LocalStorage Cache for Instant Offline & Backup Short Link Resolution.
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
  } catch {
    // Ignore storage quota errors
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
  } catch {
    // Ignore storage read errors
  }
  return null;
}

/**
 * Extracts exact destination URL untouched from Worker JSON, HTML, plain text, or Location header.
 * Never alters or appends parameters to the returned affiliateUrl.
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
  store?: SupportedStore | string;
  storeName?: string;
  error?: string | null;
  fromCache?: boolean;
}

/**
 * Resolves a Ghost Post shortCode cleanly:
 * 1. Fetches saved affiliateUrl from Cloudflare Worker `GET ${WORKER_URL}/?code=${encodeURIComponent(shortCode)}`
 * 2. Falls back to local Express proxy `/api/resolve/:code`
 * 3. Falls back to localStorage cache (`getShortCodeFromCache`)
 * Always preserves the exact Worker affiliateUrl untouched.
 */
export async function resolveShortLink(
  rawCode: string,
  searchQuery = ''
): Promise<ResolvedShortLinkResult> {
  const cleanCode = (rawCode || '').replace(/^post-/, '').trim();
  if (!cleanCode) {
    return {
      success: false,
      code: '',
      error: 'Invalid or missing short code.',
    };
  }

  // 1. Primary: Fetch saved mapping from Cloudflare Worker KV (`/?code=<shortCode>`)
  try {
    const workerGetUrl = `${WORKER_URL}/?code=${encodeURIComponent(cleanCode)}`;
    const res = await fetch(workerGetUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      const extracted = extractDestinationFromWorkerResponse(data || text, res.headers);
      if (extracted) {
        const validation = isSupportedRetailerUrl(extracted);
        const resolvedStore = (data?.store as SupportedStore) || validation.store || 'amazon';
        const resolvedStoreName = getStoreDisplayName(resolvedStore);

        saveShortCodeToCache({
          code: cleanCode,
          affiliateUrl: extracted,
          resolvedUrl: data?.resolvedUrl,
          store: resolvedStore,
          storeName: resolvedStoreName,
        });

        return {
          success: true,
          code: cleanCode,
          affiliateUrl: extracted,
          originalUrl: data?.resolvedUrl,
          store: resolvedStore,
          storeName: resolvedStoreName,
        };
      }
    }
  } catch {
    // Proceed to proxy & localStorage fallback seamlessly
  }

  // 2. Fallback: Local Express server proxy (`/api/resolve/:code`)
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
          store: data.store || 'amazon',
          storeName: data.storeName || getStoreDisplayName(data.store),
        };
      }
    }
  } catch {
    // Proceed to localStorage fallback
  }

  // 3. Fallback: Client-side localStorage backup
  const cached = getShortCodeFromCache(cleanCode);
  if (cached && cached.affiliateUrl) {
    return {
      success: true,
      code: cleanCode,
      affiliateUrl: cached.affiliateUrl,
      originalUrl: cached.originalUrl,
      store: cached.store || 'amazon',
      storeName: cached.storeName || getStoreDisplayName(cached.store),
      fromCache: true,
    };
  }

  return {
    success: false,
    code: cleanCode,
    error: 'Short link not found.',
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
 * 4-Step Website Hidden Post (Ghost Post) & KV Sync Workflow:
 * - Step 1: POST `{ url }` to Cloudflare Worker -> receive `{ success, resolvedUrl, affiliateUrl, store }`
 * - Step 2: Generate unique post `shortCode` on the website side for the Ghost Post
 * - Step 3: Build short link using `${window.location.origin}/s/${shortCode}`
 * - Step 4: POST `{ shortCode, affiliateUrl, resolvedUrl, store }` to Cloudflare Worker to save in KV + save to localStorage backup
 */
export async function shortenUrlWithWorker(
  url: string,
  customCode?: string
): Promise<WorkerShortenResponse> {
  const trimmedUrl = url.trim();
  const validation = isSupportedRetailerUrl(trimmedUrl);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Only Amazon, Flipkart, and Myntra product links are supported.',
    };
  }

  const trimmedCustomCode = (customCode || '').replace(/^post-/, '').trim();

  // Step 1: Send raw input link `{ url }` via POST to Cloudflare Worker
  let workerStep1: {
    success?: boolean;
    resolvedUrl?: string;
    affiliateUrl?: string;
    store?: string;
    shortCode?: string;
    error?: string | null;
  } | null = null;

  try {
    const step1Res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmedUrl }),
      signal: AbortSignal.timeout(9000),
    });

    const data = await step1Res.json();
    if (step1Res.ok && data && data.success && data.affiliateUrl) {
      workerStep1 = data;
    } else if (data && data.error) {
      return { success: false, error: data.error };
    }
  } catch {
    // Will try local /api/shorten proxy below
  }

  // Fallback to local backend proxy `/api/shorten` if direct client fetch failed
  if (!workerStep1 || !workerStep1.affiliateUrl) {
    try {
      const proxyRes = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmedUrl,
          customCode: trimmedCustomCode || undefined,
        }),
        signal: AbortSignal.timeout(9000),
      });

      const proxyData: WorkerShortenResponse = await proxyRes.json();
      if (proxyRes.ok && proxyData && proxyData.success && proxyData.affiliateUrl) {
        const finalCode = (proxyData.shortCode || trimmedCustomCode || generateShortCode(6)).replace(/^post-/, '');
        const brandedUrl = buildBrandedShortUrl(
          finalCode,
          typeof window !== 'undefined' ? window.location.origin : undefined
        );

        saveShortCodeToCache({
          code: finalCode,
          postId: `post-${finalCode}`,
          shortUrl: brandedUrl,
          affiliateUrl: proxyData.affiliateUrl,
          resolvedUrl: proxyData.resolvedUrl || trimmedUrl,
          originalUrl: trimmedUrl,
          store: String(proxyData.store || validation.store || 'amazon'),
          storeName: getStoreDisplayName(proxyData.store || validation.store),
        });

        return {
          ...proxyData,
          shortCode: finalCode,
          shortUrl: brandedUrl,
        };
      }
      if (proxyData && proxyData.error) {
        return { success: false, error: proxyData.error };
      }
    } catch {
      // Handled below
    }

    return {
      success: false,
      error: 'Unable to connect to Cloudflare Worker. Please check network connectivity and try again.',
    };
  }

  // Exact untouched affiliateUrl from Worker
  const exactAffiliateUrl = workerStep1.affiliateUrl;
  const resolvedUrl = workerStep1.resolvedUrl || trimmedUrl;
  const store = workerStep1.store || validation.store || 'amazon';

  // Step 2: Generate unique Ghost Post shortCode on the website side
  const shortCode = trimmedCustomCode || generateShortCode(6);

  // Step 3: Build website short link dynamically (${window.location.origin}/s/${shortCode})
  const shortUrl = buildBrandedShortUrl(
    shortCode,
    typeof window !== 'undefined' ? window.location.origin : undefined
  );

  // Save backup to localStorage immediately
  saveShortCodeToCache({
    code: shortCode,
    postId: `post-${shortCode}`,
    shortUrl,
    affiliateUrl: exactAffiliateUrl,
    resolvedUrl,
    originalUrl: trimmedUrl,
    store,
    storeName: getStoreDisplayName(store),
  });

  // Step 4: Send `{ shortCode, affiliateUrl, resolvedUrl, store }` via POST to Worker to persist in Cloudflare KV
  try {
    await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shortCode,
        affiliateUrl: exactAffiliateUrl,
        resolvedUrl,
        store,
      }),
      signal: AbortSignal.timeout(7000),
    });
  } catch {
    // Non-fatal: localStorage backup is already saved; attempt background server sync silently
    fetch('/api/shorten/kv-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shortCode,
        affiliateUrl: exactAffiliateUrl,
        resolvedUrl,
        store,
      }),
    }).catch(() => {});
  }

  return {
    success: true,
    resolvedUrl,
    affiliateUrl: exactAffiliateUrl,
    store,
    shortCode,
    shortUrl,
    error: null,
  };
}

/**
 * Scans promotional text for Amazon/Flipkart/Myntra URLs, processes each through the Worker,
 * and replaces them with branded website short links.
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
