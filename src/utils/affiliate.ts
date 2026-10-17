/**
 * Core utility functions for CLASSIFY TECH affiliate links and data transformations.
 */

export const AMAZON_TAG = 'classifytech-21';
export const FLIPKART_ID = 'inf_ed6b592b-00d1-46f4-bdb7-6aa275ecb425';
// Base domain is strictly configurable via environment variable (PUBLIC_SITE_URL or PUBLIC_APP_URL)
// Never assumed to be an unowned domain (e.g. classifytech.com).
export function getPublicSiteUrl(): string {
  if (typeof process === 'undefined' || !process.env) return '';
  const url =
    process.env.PUBLIC_SITE_URL ||
    process.env.VITE_PUBLIC_SITE_URL ||
    process.env.PUBLIC_APP_URL ||
    '';
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed.includes('classifytech.com') || trimmed.includes('your-custom-domain')) {
    return '';
  }
  return trimmed;
}

export const CONFIGURABLE_SHORT_DOMAIN = getPublicSiteUrl();
export const CUSTOM_SHORT_DOMAIN = CONFIGURABLE_SHORT_DOMAIN;

export function isCustomDomainConfigured(domain?: string): boolean {
  const d = domain !== undefined ? domain : getPublicSiteUrl();
  return Boolean(d && d.length > 0 && !d.includes('classifytech.com'));
}

export type SupportedStore = 'amazon' | 'flipkart' | 'myntra' | 'meesho';

export interface StoreDetection {
  param: 'flipkart' | 'amazon' | 'go';
  label: string;
  isSupported: boolean;
}

export function detectStore(inputUrl: string): StoreDetection {
  try {
    const parsed = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('flipkart.') || host.includes('fkrt.')) {
      return { param: 'flipkart', label: 'Flipkart Verified Link', isSupported: true };
    }
    if (host.includes('amazon.') || host.includes('amzn.')) {
      return { param: 'amazon', label: 'Amazon Verified Link', isSupported: true };
    }
    return { param: 'go', label: 'Universal Redirect Link', isSupported: true };
  } catch {
    return { param: 'go', label: 'Universal Link', isSupported: false };
  }
}

export function isShortLink(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    const host = parsed.hostname.toLowerCase();
    return host === 'amzn.in' || host === 'amzn.to' || host === 'fkrt.it' || host.includes('dl.flipkart.com');
  } catch {
    return false;
  }
}

/**
 * Validates whether a URL belongs to one of the 4 supported retailers:
 * Amazon India, Flipkart, Myntra, or Meesho.
 */
export function isAllowedRetailerHost(hostname: string): { allowed: boolean; store?: SupportedStore; storeName?: string } {
  const host = hostname.toLowerCase().trim();

  // Amazon India
  if (
    host === 'amazon.in' ||
    host.endsWith('.amazon.in') ||
    host === 'amzn.in' ||
    host.endsWith('.amzn.in') ||
    host === 'amzn.to' ||
    host.endsWith('.amzn.to')
  ) {
    return { allowed: true, store: 'amazon', storeName: 'Amazon India' };
  }

  // Flipkart
  if (
    host === 'flipkart.com' ||
    host.endsWith('.flipkart.com') ||
    host === 'fkrt.it' ||
    host.endsWith('.fkrt.it')
  ) {
    return { allowed: true, store: 'flipkart', storeName: 'Flipkart' };
  }

  // Myntra
  if (host === 'myntra.com' || host.endsWith('.myntra.com')) {
    return { allowed: true, store: 'myntra', storeName: 'Myntra' };
  }

  // Meesho
  if (host === 'meesho.com' || host.endsWith('.meesho.com')) {
    return { allowed: true, store: 'meesho', storeName: 'Meesho' };
  }

  return { allowed: false };
}

export interface ProcessedAffiliateResult {
  isValid: boolean;
  error?: string;
  store?: SupportedStore;
  storeName?: string;
  cleanUrl?: string;
  affiliateUrl?: string;
  isShort?: boolean;
  hasTracking?: boolean;
  trackingNote?: string;
}

/**
 * Validates and processes user's affiliate input links for Amazon, Flipkart, Myntra, and Meesho.
 * STRICT REQUIREMENT: Preserves user's original URL and affiliate tracking parameters exactly.
 * NEVER silently replaces, appends, or overwrites the user's affiliate IDs.
 */
export function validateAndProcessAffiliateUrl(rawInput: string): ProcessedAffiliateResult {
  const trimmed = rawInput ? rawInput.trim() : '';
  if (!trimmed) {
    return { isValid: false, error: 'Please enter a valid product or affiliate URL.' };
  }

  let parsed: URL;
  try {
    const fullUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(fullUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: 'Only secure HTTP/HTTPS URLs are allowed.' };
    }
  } catch {
    return { isValid: false, error: 'Invalid URL format. Please check and try again.' };
  }

  const retailerCheck = isAllowedRetailerHost(parsed.hostname);
  if (!retailerCheck.allowed || !retailerCheck.store) {
    return {
      isValid: false,
      error: 'यह लिंक मान्य नहीं है। केवल Amazon, Flipkart, Myntra और Meesho के लिंक ही स्वीकार किए जाते हैं।',
    };
  }

  const isShort = isShortLink(parsed.toString());

  // If it's a short link (amzn.to, fkrt.it), preserve it exactly as provided by user
  if (isShort) {
    return {
      isValid: true,
      store: retailerCheck.store,
      storeName: retailerCheck.storeName,
      cleanUrl: parsed.toString(),
      affiliateUrl: parsed.toString(),
      isShort: true,
      hasTracking: true,
      trackingNote: 'User short link preserved with integrated affiliate tracking',
    };
  }

  // Long URLs: preserve user URL exactly without modifying or overwriting any tracking
  const urlObj = new URL(parsed.toString());
  let hasTracking = false;
  let trackingNote = '';

  if (retailerCheck.store === 'amazon') {
    const existingTag = urlObj.searchParams.get('tag');
    if (existingTag) {
      hasTracking = true;
      trackingNote = `User affiliate tag preserved (${existingTag})`;
    } else {
      hasTracking = false;
      trackingNote = 'Original product link preserved (no affiliate tag detected)';
    }
  } else if (retailerCheck.store === 'flipkart') {
    const existingAffid = urlObj.searchParams.get('affid');
    if (existingAffid) {
      hasTracking = true;
      trackingNote = `User affiliate ID preserved (${existingAffid})`;
    } else {
      hasTracking = false;
      trackingNote = 'Original product link preserved (no affiliate ID detected)';
    }
  } else if (retailerCheck.store === 'myntra') {
    const hasMyntraAff =
      urlObj.searchParams.has('affiliateId') ||
      urlObj.searchParams.has('utm_source') ||
      urlObj.searchParams.has('utm_campaign') ||
      urlObj.searchParams.has('ref');
    if (hasMyntraAff) {
      hasTracking = true;
      trackingNote = 'User Myntra partner tracking preserved';
    } else {
      hasTracking = false;
      trackingNote = 'Product link preserved (no affiliate tracking detected)';
    }
  } else if (retailerCheck.store === 'meesho') {
    const hasMeeshoAff =
      urlObj.searchParams.has('ref') ||
      urlObj.searchParams.has('referrer') ||
      urlObj.searchParams.has('utm_source') ||
      urlObj.searchParams.has('utm_campaign');
    if (hasMeeshoAff) {
      hasTracking = true;
      trackingNote = 'User Meesho referral tracking preserved';
    } else {
      hasTracking = false;
      trackingNote = 'Product link preserved (no referral tracking detected)';
    }
  }

  return {
    isValid: true,
    store: retailerCheck.store,
    storeName: retailerCheck.storeName,
    cleanUrl: parsed.toString(),
    affiliateUrl: urlObj.toString(), // PRESERVED EXACTLY
    isShort: false,
    hasTracking,
    trackingNote,
  };
}

/**
 * Generates a clean 6-character unique alphanumeric short code
 */
export function generateShortCode(length = 6): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Builds the canonical short URL using live origin, configured domain, or relative path.
 * In browser: uses window.location.origin if domain is not provided.
 * In server: uses provided domain (req protocol + host) or getPublicSiteUrl().
 */
export function buildShortUrl(code: string, domain?: string): string {
  let base = domain;
  if (base === undefined) {
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
      base = window.location.origin;
    } else {
      base = getPublicSiteUrl();
    }
  }
  const cleanBase = (base || '').replace(/\/+$/, '');
  if (!cleanBase) {
    return `/s/${code}`;
  }
  return `${cleanBase}/s/${code}`;
}

/**
 * 1. Hardcoded IDs & Long URL Conversion:
 * Appends the correct affiliate parameters to standard Flipkart and Amazon URLs.
 * Amazon Tag: classifytech-21
 * Flipkart ID: inf_ed6b592b-00d1-46f4-bdb7-6aa275ecb425
 */
export function convertNormalUrlToMyAffiliate(inputUrl: string): string {
  const amazonTag = AMAZON_TAG;
  const flipkartId = FLIPKART_ID;

  if (!inputUrl || !inputUrl.trim()) {
    return inputUrl;
  }

  try {
    const cleanUrl = inputUrl.trim().startsWith('http') ? inputUrl.trim() : `https://${inputUrl.trim()}`;
    const urlObj = new URL(cleanUrl);
    const host = urlObj.hostname.toLowerCase();

    // Check for shortlink
    if (host === 'amzn.in' || host === 'amzn.to' || host.includes('dl.flipkart.com') || host === 'fkrt.it') {
      return 'SHORTLINK_ERROR';
    }

    // Amazon Setup
    if (host.includes('amazon.')) {
      urlObj.searchParams.set('tag', amazonTag);
      urlObj.searchParams.set('linkCode', 'll1');
      return urlObj.toString();
    }

    // Flipkart Setup
    if (host.includes('flipkart.com') || host.includes('flipkart.')) {
      urlObj.searchParams.set('affid', flipkartId);
      return urlObj.toString();
    }

    return urlObj.toString();
  } catch {
    return inputUrl;
  }
}

// Backward-compatible alias
export function convertToAffiliateUrl(
  inputUrl: string,
  amazonTag: string = AMAZON_TAG,
  flipkartId: string = FLIPKART_ID
): { url: string; error?: string } {
  if (!inputUrl || inputUrl.trim().length === 0) {
    return { url: '', error: 'Please enter a valid product URL.' };
  }

  const cleanUrl = inputUrl.trim().startsWith('http') ? inputUrl.trim() : `https://${inputUrl.trim()}`;

  if (isShortLink(cleanUrl)) {
    return {
      url: cleanUrl,
      error: 'Shortlinks (like amzn.to or fkrt.it) are not supported directly. Please open in your browser and paste the full product URL.',
    };
  }

  try {
    const parsed = new URL(cleanUrl);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('amazon.')) {
      parsed.searchParams.set('tag', amazonTag);
      parsed.searchParams.set('linkCode', 'll1');
      return { url: parsed.toString() };
    }

    if (host.includes('flipkart.com') || host.includes('flipkart.')) {
      parsed.searchParams.set('affid', flipkartId);
      return { url: parsed.toString() };
    }

    return { url: parsed.toString() };
  } catch {
    return { url: cleanUrl, error: 'Invalid URL format.' };
  }
}

/**
 * Stealth Base64 Redirect:
 * In generateQuickStealthUrl(), encodes the final affiliate URL into Base64 using TextEncoder and btoa.
 * Returns URL in format: https://mywebsite.com/?flipkart=BASE64_STRING or ?amazon=BASE64_STRING
 */
export function generateQuickStealthUrl(
  rawUrl: string,
  baseDomainOverride?: string
): {
  finalUrl: string;
  monetizedUrl: string;
  storeParam: 'flipkart' | 'amazon' | 'go';
  label: string;
  error?: string;
} {
  const cleanInput = rawUrl.trim();
  if (!cleanInput) {
    return {
      finalUrl: '',
      monetizedUrl: '',
      storeParam: 'go',
      label: 'Universal',
      error: 'Please paste a valid product link first.',
    };
  }

  const monetizedUrl = convertNormalUrlToMyAffiliate(cleanInput);

  if (monetizedUrl === 'SHORTLINK_ERROR') {
    return {
      finalUrl: '',
      monetizedUrl: '',
      storeParam: 'go',
      label: 'Shortlink Error',
      error: 'Shortlinks are not supported directly. Please open in your browser and paste the full product URL.',
    };
  }

  const storeInfo = detectStore(cleanInput);

  // Determine base domain (current origin or override)
  let baseDomain = baseDomainOverride;
  if (!baseDomain) {
    if (typeof window !== 'undefined' && window.location) {
      baseDomain = window.location.href.split('?')[0].split('#')[0];
    } else {
      baseDomain = CONFIGURABLE_SHORT_DOMAIN || '';
    }
  }

  // Base64 encoding via TextEncoder and btoa
  let base64Payload = '';
  try {
    if (typeof TextEncoder !== 'undefined') {
      const bytes = new TextEncoder().encode(monetizedUrl);
      let binString = '';
      for (let i = 0; i < bytes.length; i++) {
        binString += String.fromCharCode(bytes[i]);
      }
      const b64 = typeof window !== 'undefined'
        ? window.btoa(binString)
        : Buffer.from(binString, 'binary').toString('base64');
      base64Payload = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } else {
      base64Payload = Buffer.from(monetizedUrl, 'utf-8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
  } catch {
    base64Payload = encodeURIComponent(monetizedUrl);
  }

  const finalUrl = `${baseDomain}?${storeInfo.param}=${base64Payload}`;

  return {
    finalUrl,
    monetizedUrl,
    storeParam: storeInfo.param,
    label: storeInfo.label,
  };
}

export function createStealthRedirectUrl(
  baseUrl: string,
  targetUrl: string,
  storeParam: 'flipkart' | 'amazon' | 'myntra' | 'meesho' | 'go'
): string {
  try {
    const cleanBase = baseUrl.split('?')[0].split('#')[0];
    let encoded = '';
    if (typeof TextEncoder !== 'undefined') {
      const bytes = new TextEncoder().encode(targetUrl);
      let binString = '';
      for (let i = 0; i < bytes.length; i++) {
        binString += String.fromCharCode(bytes[i]);
      }
      const b64 = typeof window !== 'undefined'
        ? window.btoa(binString)
        : Buffer.from(binString, 'binary').toString('base64');
      encoded = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } else {
      encoded = Buffer.from(targetUrl, 'utf-8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
    return `${cleanBase}?${storeParam}=${encoded}`;
  } catch {
    return `${baseUrl}?deal=${encodeURIComponent(targetUrl)}`;
  }
}

export function calculateDiscountLabel(priceStr: string, mrpStr: string): string {
  try {
    const numPrice = parseInt((priceStr || '').replace(/[^0-9]/g, ''), 10);
    const numMrp = parseInt((mrpStr || '').replace(/[^0-9]/g, ''), 10);

    if (!isNaN(numPrice) && !isNaN(numMrp) && numMrp > numPrice && numMrp > 0) {
      const pct = Math.round(((numMrp - numPrice) / numMrp) * 100);
      return `${pct}% OFF`;
    }
  } catch {}
  return 'MEGA DEAL';
}

export function calculatePercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}

export interface AffiliateHistoryItem {
  id: string;
  originalUrl: string;
  finalUrl: string;
  shortCode?: string;
  monetizedUrl: string;
  store: 'flipkart' | 'amazon' | 'myntra' | 'meesho' | 'go';
  label: string;
  timestamp: number;
}

export const AFFILIATE_HISTORY_STORAGE_KEY = 'classify_affiliate_history';

export function addToAffiliateHistory(
  newItem: Omit<AffiliateHistoryItem, 'id' | 'timestamp'> & { id?: string; timestamp?: number },
  currentList: AffiliateHistoryItem[],
  maxItems: number = 5
): AffiliateHistoryItem[] {
  const item: AffiliateHistoryItem = {
    id: newItem.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    originalUrl: newItem.originalUrl,
    finalUrl: newItem.finalUrl,
    shortCode: newItem.shortCode,
    monetizedUrl: newItem.monetizedUrl,
    store: newItem.store,
    label: newItem.label,
    timestamp: newItem.timestamp || Date.now(),
  };

  // Remove existing entry if exact same finalUrl or originalUrl is present
  const filtered = currentList.filter(
    (existing) => existing.finalUrl !== item.finalUrl && existing.originalUrl !== item.originalUrl
  );

  return [item, ...filtered].slice(0, maxItems);
}
