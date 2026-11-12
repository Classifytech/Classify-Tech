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

export const WORKER_URL = 'https://classify.classifytechz.workers.dev';

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
  const cleanCode = (code || '').trim();
  if (origin && typeof origin === 'string' && origin.startsWith('http')) {
    const cleanOrigin = origin.replace(/\/+$/, '');
    return `${cleanOrigin}/s/${cleanCode}`;
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/s/${cleanCode}`;
  }
  return `/s/${cleanCode}`;
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
 * Smart API call to Cloudflare Worker with automatic GET fallback.
 * 1. POST ${WORKER_URL}/api/shorten with { url, customCode }
 * 2. Fallback: GET ${WORKER_URL}/?url=...&shorten=1&code=...
 * 3. Secondary Fallback: Local /api/shorten proxy
 */
export async function shortenUrlWithWorker(
  url: string,
  customCode?: string
): Promise<WorkerShortenResponse> {
  const trimmedUrl = url.trim();
  const trimmedCode = (customCode || '').trim();

  // Attempt 1: Direct POST /api/shorten
  try {
    const postBody: Record<string, string> = { url: trimmedUrl };
    if (trimmedCode) {
      postBody.customCode = trimmedCode;
    }

    const postRes = await fetch(`${WORKER_URL}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody),
      signal: AbortSignal.timeout(9000),
    });

    if (postRes.ok) {
      const data: WorkerShortenResponse = await postRes.json();
      if (data && (data.success || data.affiliateUrl || data.shortUrl)) {
        return data;
      }
    }
  } catch (postErr) {
    console.warn('[Affiliate API] Worker POST failed, attempting GET fallback:', postErr);
  }

  // Attempt 2: Fallback GET /?url=...&shorten=1&code=...
  try {
    let getUrl = `${WORKER_URL}/?url=${encodeURIComponent(trimmedUrl)}&shorten=1`;
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
        return data;
      }
    }
  } catch (getErr) {
    console.warn('[Affiliate API] Worker GET fallback failed, attempting local proxy:', getErr);
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

    if (workerRes.success && (workerRes.shortUrl || workerRes.affiliateUrl)) {
      const replacement = workerRes.shortUrl || workerRes.affiliateUrl || targetUrl;
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
