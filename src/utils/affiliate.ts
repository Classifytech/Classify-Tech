/**
 * CLASSIFY TECH Smart Affiliate Shortener Utilities
 * 
 * Supported Retailers:
 * - Amazon: amazon.in, amazon.com, amzn.in, amzn.to, amzn.eu
 * - Flipkart: flipkart.com, dl.flipkart.com, fkrt.it, fkrt.cc, fkrt.to, fkrt.co, fktr.in
 * - Myntra: myntra.com, myntr.in, myntr.it
 */

export const COLLISION_SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export interface RetailerValidationResult {
  valid: boolean;
  store?: 'amazon' | 'flipkart' | 'myntra';
  storeName?: 'Amazon' | 'Flipkart' | 'Myntra';
  error?: string;
  cleanUrl?: string;
}

/**
 * Checks if a URL belongs to a supported retailer and is safe.
 * Rejects unsafe schemes like javascript:, data:, vbscript:, file:.
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

  // Amazon (including link.amazon, amazon.in, amazon.com, amzn.to, amzn.in, amzn.eu, etc.)
  const isAmazon = hostname.includes('amazon') || hostname.includes('amzn');
  if (isAmazon) {
    return {
      valid: true,
      store: 'amazon',
      storeName: 'Amazon',
      cleanUrl: parsed.toString(),
    };
  }

  // Flipkart (including dl.flipkart.com, fkrt.it, fkrt.cc, fkrt.to, fkrt.co, fktr.in, etc.)
  const isFlipkart = hostname.includes('flipkart') || hostname.includes('fkrt') || hostname.includes('fktr');
  if (isFlipkart) {
    return {
      valid: true,
      store: 'flipkart',
      storeName: 'Flipkart',
      cleanUrl: parsed.toString(),
    };
  }

  // Myntra (including myntr.in, myntr.it, etc.)
  const isMyntra = hostname.includes('myntra') || hostname.includes('myntr');
  if (isMyntra) {
    return {
      valid: true,
      store: 'myntra',
      storeName: 'Myntra',
      cleanUrl: parsed.toString(),
    };
  }

  // Accepts any other valid HTTP/HTTPS link and pushes to Cloudflare Worker
  return {
    valid: true,
    cleanUrl: parsed.toString(),
  };
}

/**
 * Generates a 6-character collision-safe alphanumeric code.
 */
export function generateShortCode(length = 6): string {
  let result = '';
  // Browser or Node crypto
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
 * Builds the branded short URL using the website's active default domain.
 * Strictly NEVER hardcodes localhost, ports, or workers.dev.
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

export interface GeneratedLinkRecord {
  code: string;
  postId: string;
  shortUrl: string;
  originalUrl: string;
  affiliateUrl?: string; // Only stored for admin inspection; NEVER exposed in public UI
  store: 'amazon' | 'flipkart' | 'myntra';
  storeName: 'Amazon' | 'Flipkart' | 'Myntra';
  kvSaved: boolean;
  createdAt: number;
  expiresAt: number;
  ttlSeconds: number;
}
