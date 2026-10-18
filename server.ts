import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  isAllowedRetailerHost,
  validateAndProcessAffiliateUrl,
  generateShortCode,
  buildShortUrl,
  CUSTOM_SHORT_DOMAIN,
} from './src/utils/affiliate.ts';
import {
  cleanHtmlText,
  FREE_TECH_RSS_FEEDS,
  transformRssItemToArticle,
  type Rss2JsonResponse,
  type Rss2JsonItem,
} from './src/utils/rssParser.ts';
import type { TechArticle } from './src/data/newsData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_FILE = path.resolve(__dirname, 'src/data/shortlinks.json');
const CONTACT_FILE = path.resolve(__dirname, 'src/data/contact_submissions.json');
const REPORTS_FILE = path.resolve(__dirname, 'src/data/news_reports.json');
const ADMIN_LOOT_FILE = path.resolve(__dirname, 'src/data/admin_loot.json');
const ADMIN_NEWS_FILE = path.resolve(__dirname, 'src/data/admin_news.json');
const ADMIN_PHONES_FILE = path.resolve(__dirname, 'src/data/admin_phones.json');

export interface StoredShortLink {
  code: string;
  originalUrl: string;
  affiliateUrl: string;
  store: string;
  storeName: string;
  hasTracking: boolean;
  trackingNote: string;
  createdAt: number;
  clicks: number;
}

// Cryptographically secure active admin session tokens
interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}
const activeAdminSessions = new Map<string, AdminSession>();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of activeAdminSessions.entries()) {
    if (now > session.expiresAt) {
      activeAdminSessions.delete(token);
    }
  }
}

// Helper: Verify if request header or bearer token is a valid active admin session
export function isValidAdminSession(req: Request): boolean {
  pruneExpiredSessions();
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  } else if (req.body && req.body.adminToken) {
    token = String(req.body.adminToken).trim();
  }

  if (!token) return false;
  const session = activeAdminSessions.get(token);
  return Boolean(session && Date.now() <= session.expiresAt);
}

// In-Memory Rate Limiting Tracker
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);
  if (!record || now > record.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (record.count >= maxRequests) {
    return true;
  }
  record.count += 1;
  return false;
}

// Helper: Extract safe client IP for rate limiting (prevents X-Forwarded-For header spoofing)
function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

// Load shortlinks safely from file
function loadShortlinks(): Record<string, StoredShortLink> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read shortlinks data file:', err);
  }
  return {};
}

// Save shortlinks safely with atomic write and return boolean status
function saveShortlinks(links: Record<string, StoredShortLink>): boolean {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(links, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
    return true;
  } catch (err) {
    console.error('Failed to write shortlinks data file:', err);
    return false;
  }
}

// Save contact submission safely with atomic write
function saveContactSubmission(entry: { name: string; email: string; category: string; message: string; timestamp: number }): boolean {
  try {
    const dir = path.dirname(CONTACT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let existing: any[] = [];
    if (fs.existsSync(CONTACT_FILE)) {
      existing = JSON.parse(fs.readFileSync(CONTACT_FILE, 'utf-8'));
    }
    existing.push(entry);
    const tempFile = `${CONTACT_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(existing, null, 2), 'utf-8');
    fs.renameSync(tempFile, CONTACT_FILE);
    return true;
  } catch (err) {
    console.error('Failed to save contact submission:', err);
    return false;
  }
}

// Save news report safely with atomic write
function saveNewsReport(entry: { articleId: string; articleTitle: string; reason: string; email?: string; details: string; timestamp: number }): boolean {
  try {
    const dir = path.dirname(REPORTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let existing: any[] = [];
    if (fs.existsSync(REPORTS_FILE)) {
      existing = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
    }
    existing.push(entry);
    const tempFile = `${REPORTS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(existing, null, 2), 'utf-8');
    fs.renameSync(tempFile, REPORTS_FILE);
    return true;
  } catch (err) {
    console.error('Failed to save news report:', err);
    return false;
  }
}

function loadAdminLoot(): any[] {
  try {
    if (fs.existsSync(ADMIN_LOOT_FILE)) {
      return JSON.parse(fs.readFileSync(ADMIN_LOOT_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load admin loot file:', err);
  }
  return [];
}

function saveAdminLoot(deals: any[]): boolean {
  try {
    const dir = path.dirname(ADMIN_LOOT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempFile = `${ADMIN_LOOT_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(deals, null, 2), 'utf-8');
    fs.renameSync(tempFile, ADMIN_LOOT_FILE);
    return true;
  } catch (err) {
    console.error('Failed to save admin loot file:', err);
    return false;
  }
}

function loadAdminNews(): any[] {
  try {
    if (fs.existsSync(ADMIN_NEWS_FILE)) {
      return JSON.parse(fs.readFileSync(ADMIN_NEWS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load admin news file:', err);
  }
  return [];
}

function saveAdminNews(articles: any[]): boolean {
  try {
    const dir = path.dirname(ADMIN_NEWS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempFile = `${ADMIN_NEWS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(articles, null, 2), 'utf-8');
    fs.renameSync(tempFile, ADMIN_NEWS_FILE);
    return true;
  } catch (err) {
    console.error('Failed to save admin news file:', err);
    return false;
  }
}

function loadAdminPhones(): Record<string, any> {
  try {
    if (fs.existsSync(ADMIN_PHONES_FILE)) {
      return JSON.parse(fs.readFileSync(ADMIN_PHONES_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load admin phones file:', err);
  }
  return {};
}

function saveAdminPhones(phones: Record<string, any>): boolean {
  try {
    const dir = path.dirname(ADMIN_PHONES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempFile = `${ADMIN_PHONES_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(phones, null, 2), 'utf-8');
    fs.renameSync(tempFile, ADMIN_PHONES_FILE);
    return true;
  } catch (err) {
    console.error('Failed to save admin phones file:', err);
    return false;
  }
}

// In-memory cache synced with disk
let shortlinksStore = loadShortlinks();

const ALLOWED_ARTICLE_DOMAINS = [
  'gsmarena.com',
  'www.gsmarena.com',
  'androidauthority.com',
  'www.androidauthority.com',
  'gadgets360.com',
  'www.gadgets360.com',
  '9to5google.com',
  'www.9to5google.com',
  'theverge.com',
  'www.theverge.com',
  'feeds.feedburner.com',
  'api.rss2json.com',
];

/**
 * Helper to check if a hostname is a private, loopback, link-local, or reserved network target (SSRF Protection)
 */
export function isPrivateOrProhibitedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();

  // Basic hostnames and local domains
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host === '::' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.test') ||
    host.endsWith('.invalid') ||
    host.endsWith('.example')
  ) {
    return true;
  }

  // Check for IPv4 literals
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const parts = ipv4Match.slice(1).map(Number);
    const [a, b, c, d] = parts;
    if (parts.some(p => p > 255)) return true; // Malformed

    if (a === 127) return true; // Loopback
    if (a === 10) return true; // Private 10.0.0.0/8
    if (a === 100 && b >= 64 && b <= 127) return true; // Shared 100.64.0.0/10
    if (a === 169 && b === 254) return true; // Link-local 169.254.0.0/16
    if (a === 172 && b >= 16 && b <= 31) return true; // Private 172.16.0.0/12
    if (a === 192 && b === 0 && c === 0) return true; // IETF Protocol 192.0.0.0/24
    if (a === 192 && b === 0 && c === 2) return true; // TEST-NET-1 192.0.2.0/24
    if (a === 192 && b === 88 && c === 99) return true; // 6to4 Relay 192.88.99.0/24
    if (a === 192 && b === 168) return true; // Private 192.168.0.0/16
    if (a === 198 && b >= 18 && b <= 19) return true; // Benchmarking 198.18.0.0/15
    if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2 198.51.100.0/24
    if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3 203.0.113.0/24
    if (a >= 224) return true; // Multicast (224.0.0.0/4) and Reserved (240.0.0.0/4)
    if (a === 0) return true; // Current network
  }

  // Check for IPv6 literals
  if (host.includes(':')) {
    if (host === '::1' || host === '::') return true;
    if (host.startsWith('fe80:')) return true; // Link-local
    if (host.startsWith('fc') || host.startsWith('fd')) return true; // Unique local
    if (host.startsWith('ff')) return true; // Multicast
    
    if (host.startsWith('::ffff:')) {
      const mappedIpv4 = host.replace('::ffff:', '');
      return isPrivateOrProhibitedHost(mappedIpv4);
    }
  }

  // Check for common DNS rebinding / tunnel services that embed IP in hostname
  const rebindingPattern = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/;
  if (host.includes('.xip.io') || host.includes('.nip.io') || host.includes('.sslip.io')) {
    const ipMatch = host.match(rebindingPattern);
    if (ipMatch && isPrivateOrProhibitedHost(ipMatch[0])) {
      return true;
    }
  }

  return false;
}

/**
 * Safely resolves a short URL (like amzn.to or fkrt.it)
 * Follows redirect with strict timeout and verifies destination host
 */
async function safelyResolveShortUrl(urlStr: string): Promise<string> {
  let currentUrl = urlStr;
  let maxHops = 4;

  while (maxHops > 0) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return urlStr;
      }
      if (isPrivateOrProhibitedHost(parsed.hostname)) {
        return urlStr;
      }
    } catch {
      return urlStr;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'manual',
        signal: controller.signal,
      });

      const location = response.headers.get('location');
      if (location && (response.status >= 300 && response.status < 400)) {
        const nextUrl = new URL(location, currentUrl).toString();
        const nextParsed = new URL(nextUrl);
        if (isPrivateOrProhibitedHost(nextParsed.hostname)) {
          return urlStr;
        }
        currentUrl = nextUrl;
        maxHops--;

        const check = isAllowedRetailerHost(nextParsed.hostname);
        if (check.allowed) {
          return currentUrl;
        }
      } else {
        const check = isAllowedRetailerHost(parsed.hostname);
        if (check.allowed) {
          return currentUrl;
        }
        break;
      }
    } catch {
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  return urlStr;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  // Security Headers & Payload Size Limits
  app.use(express.json({ limit: '50kb' }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), midis=()');
    
    // Add HSTS for production (using a standard 1-year duration)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Host Header Validation to prevent Host Header Injection
    const host = req.get('host');
    const isDev = process.env.NODE_ENV !== 'production' || host?.includes('localhost');
    if (host && !isDev) {
      const isAllowedHost = host === 'classifytech.ai.studio' || host.endsWith('.ai.studio');
      if (!isAllowedHost) {
        console.warn(`[Security] Blocked request with suspicious Host header: ${host}`);
        return res.status(400).send('Invalid Host header');
      }
    }

    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; connect-src 'self' https://api.rss2json.com https://*.gsmarena.com https://*.androidauthority.com https://*.gadgets360.com https://*.9to5google.com https://*.theverge.com https://feeds.feedburner.com https: ws: wss:; frame-ancestors 'none'; form-action 'self';"
    );
    next();
  });

  // Health check endpoint for uptime monitors and deployment checks
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'CLASSIFY TECH API',
      timestamp: Date.now(),
      uptime: process.uptime(),
    });
  });

  // Admin Verification Endpoint (Fails closed if ADMIN_SECRET is not configured)
  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    if (isRateLimited(`admin_verify_${clientIp}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Too many authentication attempts. Please try again after 15 minutes.',
      });
    }

    const { pin } = req.body;
    const adminSecret =
      process.env.ADMIN_SECRET ||
      process.env.ADMIN_PASSWORD ||
      process.env.ADMIN_PIN ||
      process.env.MASTER_ADMIN_PIN;

    // Fail closed if admin secret is missing, unconfigured, or set to a placeholder
    if (!adminSecret || adminSecret.startsWith('YOUR_') || adminSecret.trim().length < 4) {
      return res.status(503).json({
        success: false,
        error: 'Admin authentication is disabled because ADMIN_SECRET is not configured on the server.',
      });
    }

    if (pin && typeof pin === 'string' && pin.trim() === adminSecret.trim()) {
      // Generate cryptographically secure random session token
      const sessionToken = `ct_sess_${crypto.randomBytes(32).toString('hex')}`;
      const session: AdminSession = {
        token: sessionToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_TTL_MS,
      };
      activeAdminSessions.set(sessionToken, session);

      return res.json({
        success: true,
        token: sessionToken,
        expiresInSeconds: SESSION_TTL_MS / 1000,
        message: 'Security clearance verified.',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid master security credentials.',
    });
  });

  // Public Content Fetch Endpoint (Serves server-persisted Loot Deals, Custom Articles & Phone Database)
  app.get('/api/content', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      lootDeals: loadAdminLoot(),
      customNews: loadAdminNews(),
      customPhones: loadAdminPhones(),
    });
  });

  // Protected Admin Endpoint: Save/Update Loot Deals Array
  app.post('/api/admin/loot', (req: Request, res: Response) => {
    if (!isValidAdminSession(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Admin session required.' });
    }
    const { lootDeals } = req.body;
    if (!Array.isArray(lootDeals)) {
      return res.status(400).json({ success: false, error: 'lootDeals must be an array.' });
    }
    const saved = saveAdminLoot(lootDeals);
    if (!saved) {
      return res.status(500).json({ success: false, error: 'Failed to write loot deals to server storage.' });
    }
    return res.json({ success: true, message: 'Loot deals saved to server storage successfully.' });
  });

  // Protected Admin Endpoint: Add Custom News Article
  app.post('/api/admin/news', (req: Request, res: Response) => {
    if (!isValidAdminSession(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Admin session required.' });
    }
    const { article } = req.body;
    if (!article || !article.title || !article.id) {
      return res.status(400).json({ success: false, error: 'Article payload is invalid.' });
    }
    const existing = loadAdminNews();
    const updated = [article, ...existing.filter((item: any) => item.id !== article.id)].slice(0, 50);
    const saved = saveAdminNews(updated);
    if (!saved) {
      return res.status(500).json({ success: false, error: 'Failed to write custom article to server storage.' });
    }
    return res.json({ success: true, message: 'Article saved to server storage successfully.' });
  });

  // Protected Admin Endpoint: Add Phone Specs
  app.post('/api/admin/phones', (req: Request, res: Response) => {
    if (!isValidAdminSession(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Admin session required.' });
    }
    const { phone } = req.body;
    if (!phone || !phone.id || !phone.name) {
      return res.status(400).json({ success: false, error: 'Phone payload is invalid.' });
    }
    const existing = loadAdminPhones();
    existing[phone.id] = phone;
    const saved = saveAdminPhones(existing);
    if (!saved) {
      return res.status(500).json({ success: false, error: 'Failed to write phone specs to server storage.' });
    }
    return res.json({ success: true, message: 'Phone specs saved to server storage successfully.' });
  });

  // Contact Submission Endpoint with Persistent Storage & Anti-Spam Rate Limiting
  app.post('/api/contact', (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    if (isRateLimited(`contact_${clientIp}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait a few minutes before submitting another inquiry.',
      });
    }

    const { name, email, category, message } = req.body;
    if (!name || !email || !message || typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Name, valid email address, and message description are required.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    if (name.trim().length > 100 || email.trim().length > 150 || message.trim().length > 3000) {
      return res.status(400).json({
        success: false,
        error: 'Field length exceeds maximum limit.',
      });
    }

    const saved = saveContactSubmission({
      name: name.trim(),
      email: email.trim(),
      category: String(category || 'General Inquiry').slice(0, 100),
      message: message.trim(),
      timestamp: Date.now(),
    });

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Storage error. Unable to save your contact submission.',
      });
    }

    return res.json({
      success: true,
      deliveryServiceConfigured: false,
      message: 'Your inquiry has been safely received and logged by our help desk.',
    });
  });

  // News Report Submission Endpoint with Persistent Storage & Anti-Spam Rate Limiting
  app.post('/api/report', (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    if (isRateLimited(`report_${clientIp}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait a few minutes before submitting another report.',
      });
    }

    const { articleId, articleTitle, reason, email, details } = req.body;
    if (!articleId || !details || typeof details !== 'string' || !details.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Article ID and description details are required.',
      });
    }

    if (details.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Report description exceeds maximum length limit.',
      });
    }

    const saved = saveNewsReport({
      articleId: String(articleId).slice(0, 100),
      articleTitle: String(articleTitle || 'Untitled Story').slice(0, 200),
      reason: String(reason || 'Typo / Specification Correction').slice(0, 100),
      email: email ? String(email).trim().slice(0, 150) : undefined,
      details: details.trim(),
      timestamp: Date.now(),
    });

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Storage error. Unable to save your fact-check report.',
      });
    }

    return res.json({
      success: true,
      message: 'Fact-check report logged with editorial desk.',
    });
  });

  // 1. API: Shorten Affiliate URL
  app.post('/api/shorten', async (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    if (isRateLimited(`shorten_${clientIp}`, 20, 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait a minute before creating another short link.',
      });
    }

    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Please paste a valid product or affiliate link.',
        });
      }

      let inputUrl = url.trim();

      // Preliminary validation
      let processed = validateAndProcessAffiliateUrl(inputUrl);
      if (!processed.isValid) {
        return res.status(400).json({
          success: false,
          error: processed.error || 'Only Amazon India, Flipkart, Myntra, and Meesho links are supported.',
        });
      }

      // If it's a short URL (e.g. amzn.to, fkrt.it), attempt safe resolution
      if (processed.isShort) {
        const resolved = await safelyResolveShortUrl(inputUrl);
        if (resolved && resolved !== inputUrl) {
          processed = validateAndProcessAffiliateUrl(resolved);
        }
      }

      const finalAffiliateUrl = processed.affiliateUrl || inputUrl;

      // Check if this exact affiliate URL already has an existing short code
      const existing = Object.values(shortlinksStore).find(
        (item) => item.affiliateUrl === finalAffiliateUrl
      );

      let code = existing?.code;
      let newlyCreated = false;
      if (!code) {
        // Generate a collision-free 6-character code
        let attempts = 0;
        do {
          code = generateShortCode(6);
          attempts++;
        } while (shortlinksStore[code] && attempts < 20);

        const newEntry: StoredShortLink = {
          code,
          originalUrl: inputUrl,
          affiliateUrl: finalAffiliateUrl,
          store: processed.store || 'amazon',
          storeName: processed.storeName || 'Online Store',
          hasTracking: processed.hasTracking ?? true,
          trackingNote: processed.trackingNote || 'Verified affiliate link',
          createdAt: Date.now(),
          clicks: 0,
        };

        shortlinksStore[code] = newEntry;
        newlyCreated = true;
      }

      // Check persistence: save to disk and fail if write fails
      const saved = saveShortlinks(shortlinksStore);
      if (!saved) {
        if (newlyCreated && code) {
          delete shortlinksStore[code];
        }
        return res.status(500).json({
          success: false,
          error: 'Failed to persist short link mapping to server storage.',
        });
      }

      // Auto-detect current live domain from request headers or host
      const host = req.get('host');
      const forwardedProto = req.headers['x-forwarded-proto'];
      const protocol = (typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol) || 'https';
      const liveOrigin = host ? `${protocol}://${host}` : undefined;
      const shortUrl = buildShortUrl(code, liveOrigin);

      return res.json({
        success: true,
        code,
        shortUrl,
        redirectPath: `/s/${code}`,
        originalUrl: inputUrl,
        affiliateUrl: finalAffiliateUrl,
        store: processed.store,
        storeName: processed.storeName,
        hasTracking: processed.hasTracking,
        trackingNote: processed.trackingNote,
      });
    } catch (err) {
      console.error('Error in /api/shorten:', err);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred while generating the short link.',
      });
    }
  });

  // 2. API: Lookup Short Link details
  app.get('/api/links/:code', (req: Request, res: Response) => {
    const { code } = req.params;
    if (!/^[a-zA-Z0-9]{5,10}$/.test(code)) {
      return res.status(400).json({ success: false, error: 'Invalid short code format.' });
    }
    const entry = shortlinksStore[code];
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Short link not found.' });
    }
    const host = req.get('host');
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = (typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol) || 'https';
    const liveOrigin = host ? `${protocol}://${host}` : undefined;

    return res.json({
      success: true,
      code: entry.code,
      shortUrl: buildShortUrl(entry.code, liveOrigin),
      affiliateUrl: entry.affiliateUrl,
      store: entry.store,
      storeName: entry.storeName,
      createdAt: entry.createdAt,
      clicks: entry.clicks,
    });
  });

  // 3. API: Live RSS News Syndication (GSMArena, Android Authority, Gadgets 360, 9to5Google, The Verge)
  let newsCache: { timestamp: number; articles: TechArticle[] } | null = null;
  const NEWS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Direct XML helper to extract full, untruncated article content (<content:encoded> / <content>)
  function parseRawXmlToRssItems(xml: string): Rss2JsonItem[] {
    const items: Rss2JsonItem[] = [];
    const itemMatches = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) || [];
    for (const block of itemMatches) {
      const titleMatch = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const linkMatch =
        block.match(/<link[^>]*href=["']([^"']+)["']/i) ||
        block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const link = linkMatch ? linkMatch[1].trim() : '';

      const contentMatch = block.match(/<(?:content:encoded|content)[^>]*>([\s\S]*?)<\/(?:content:encoded|content)>/i);
      const content = contentMatch ? contentMatch[1].trim() : '';

      const descMatch = block.match(/<(?:description|summary)[^>]*>([\s\S]*?)<\/(?:description|summary)>/i);
      const description = descMatch ? descMatch[1].trim() : '';

      const pubDateMatch = block.match(/<(?:pubDate|published|updated)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated)>/i);
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';

      const thumbMatch =
        block.match(/<(?:enclosure|media:content)[^>]*url=["']([^"']+)["']/i) ||
        block.match(/<img[^>]+src=["']([^"']+)["']/i);
      const thumbnail = thumbMatch ? thumbMatch[1].trim() : undefined;

      if (title && (link || description || content)) {
        items.push({
          title,
          link,
          pubDate,
          content: content || description,
          description: description || content,
          thumbnail,
        });
      }
    }
    return items;
  }

  // In-memory cache for full untruncated article content (1 hour TTL)
  const articleFullCache = new Map<string, { timestamp: number; paragraphs: string[]; lead?: string }>();

  async function extractFullArticleFromWeb(url: string): Promise<{ paragraphs: string[]; lead?: string } | null> {
    try {
      const cached = articleFullCache.get(url);
      if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
        return cached;
      }

      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'https:') return null;
      if (!ALLOWED_ARTICLE_DOMAINS.includes(parsedUrl.hostname)) return null;
      if (isPrivateOrProhibitedHost(parsedUrl.hostname)) return null;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual', // Strictly no automatic redirects
        signal: AbortSignal.timeout(5000), // Strict connection/total timeout
      });

      // Handle manual redirect if needed (though usually article links should be direct)
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (location) {
          const nextUrl = new URL(location, url).toString();
          const nextParsed = new URL(nextUrl);
          if (nextParsed.protocol === 'https:' && 
              ALLOWED_ARTICLE_DOMAINS.includes(nextParsed.hostname) &&
              !isPrivateOrProhibitedHost(nextParsed.hostname)) {
            // Recurse once if it's a safe redirect
            return extractFullArticleFromWeb(nextUrl);
          }
        }
        return null;
      }

      if (!res.ok) return null;

      // Check Content-Type (must be HTML)
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) return null;

      // Response Size Limit (max 1MB)
      const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
      if (contentLength > 1024 * 1024) return null;

      const html = await res.text();
      if (html.length > 1024 * 1024) return null;

      let container = '';
      if (url.includes('gsmarena.com')) {
        const m = html.match(/<div[^>]*id=["']review-body["'][^>]*>([\s\S]*?)<\/div>/i);
        if (m) container = m[1];
      } else if (url.includes('theverge.com')) {
        const m = html.match(/<div[^>]*class=["'][^"']*c-entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (m) container = m[1];
      } else if (url.includes('9to5google.com')) {
        const m = html.match(/<div[^>]*class=["'][^"']*(?:post-content|entry-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (m) container = m[1];
      } else if (url.includes('androidauthority.com')) {
        const m = html.match(/<div[^>]*class=["'][^"']*(?:article-content|post-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (m) container = m[1];
      } else if (url.includes('gadgets360.com')) {
        const m = html.match(/<div[^>]*class=["'][^"']*(?:content_text|story__detail)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (m) container = m[1];
      }

      if (!container) {
        const art = html.match(/<article[\s\S]*?<\/article>/i);
        if (art) container = art[0];
        else {
          const main = html.match(/<main[\s\S]*?<\/main>/i);
          if (main) container = main[0];
          else container = html;
        }
      }

      const pMatches = container.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
      const paragraphs: string[] = [];
      const seen = new Set<string>();

      for (const p of pMatches) {
        const clean = cleanHtmlText(p);
        if (
          clean.length > 35 &&
          !clean.toLowerCase().startsWith('via') &&
          !clean.toLowerCase().startsWith('source:') &&
          !clean.toLowerCase().includes('cookie policy') &&
          !clean.toLowerCase().includes('all rights reserved') &&
          !clean.toLowerCase().includes('subscribe to our') &&
          !seen.has(clean.toLowerCase())
        ) {
          seen.add(clean.toLowerCase());
          paragraphs.push(clean);
        }
      }

      if (paragraphs.length > 0) {
        const result = {
          paragraphs,
          lead: paragraphs[0],
        };
        articleFullCache.set(url, { timestamp: Date.now(), ...result });
        return result;
      }
    } catch {
      // Network or parse error
    }
    return null;
  }

  app.get('/api/news/rss', async (req: Request, res: Response) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const clientIp = getClientIp(req);

      // Rate limit forced refresh requests to prevent upstream RSS endpoint spam
      if (forceRefresh && isRateLimited(`rss_refresh_${clientIp}`, 3, 5 * 60 * 1000)) {
        if (newsCache) {
          return res.json({
            success: true,
            fromCache: true,
            rateLimited: true,
            message: 'Rate limit reached for forced RSS refresh. Serving cached news.',
            count: newsCache.articles.length,
            articles: newsCache.articles,
          });
        }
      }

      if (!forceRefresh && newsCache && Date.now() - newsCache.timestamp < NEWS_CACHE_TTL_MS) {
        return res.json({
          success: true,
          fromCache: true,
          count: newsCache.articles.length,
          articles: newsCache.articles,
        });
      }

      // Fetch all RSS feeds concurrently with direct XML untruncated content support
      const fetchPromises = FREE_TECH_RSS_FEEDS.map(async (feed) => {
        // Step 1: Direct XML fetch to extract complete, untruncated content
        try {
          const directRes = await fetch(feed.rssUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(6000),
          });
          if (directRes.ok) {
            const xml = await directRes.text();
            if (xml.includes('<item') || xml.includes('<entry')) {
              const rawItems = parseRawXmlToRssItems(xml);
              if (rawItems.length > 0) {
                return rawItems.slice(0, 8).map((item) => transformRssItemToArticle(item, feed.name));
              }
            }
          }
        } catch {
          // Fall back seamlessly to JSON proxy
        }

        // Step 2: Fallback to rss2json proxy API
        try {
          const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.rssUrl)}`;
          const response = await fetch(apiUrl, {
            headers: { 'User-Agent': 'CLASSIFY-TECH/1.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) {
            const data: Rss2JsonResponse = await response.json();
            if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
              const feedTitle = data.feed?.title || feed.name;
              return data.items.slice(0, 6).map((item) => transformRssItemToArticle(item, feedTitle));
            }
          }
        } catch (feedErr) {
          console.warn(`[RSS] Failed to fetch feed ${feed.name}:`, feedErr);
        }
        return [] as TechArticle[];
      });

      const settled = await Promise.allSettled(fetchPromises);
      const aggregated: TechArticle[] = [];
      for (const result of settled) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          aggregated.push(...result.value);
        }
      }

      if (aggregated.length > 0) {
        const seen = new Set<string>();
        const deduped: TechArticle[] = [];
        for (const item of aggregated) {
          const key = item.title.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(item);
          }
        }

        // Pre-enrich top articles whose content is truncated so initial open is untruncated
        const enrichPromises = deduped.slice(0, 10).map(async (article) => {
          if (
            article.sourceUrl &&
            (article.fullBody.length <= 2 || article.fullBody.some((p) => p.includes('...')))
          ) {
            const extracted = await extractFullArticleFromWeb(article.sourceUrl);
            if (extracted && extracted.paragraphs.length >= 2) {
              article.fullBody = extracted.paragraphs;
              if (extracted.lead && extracted.lead.length > 20) {
                article.desc = extracted.lead;
              }
            }
          }
        });
        await Promise.allSettled(enrichPromises);

        newsCache = {
          timestamp: Date.now(),
          articles: deduped,
        };

        return res.json({
          success: true,
          fromCache: false,
          count: deduped.length,
          articles: deduped,
        });
      }

      if (newsCache) {
        return res.json({
          success: true,
          fromCache: true,
          count: newsCache.articles.length,
          articles: newsCache.articles,
        });
      }

      return res.json({
        success: false,
        count: 0,
        articles: [],
      });
    } catch (err) {
      console.error('Error in /api/news/rss:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to syndicate RSS news.',
        articles: newsCache ? newsCache.articles : [],
      });
    }
  });

  // 3b. Dedicated endpoint to fetch untruncated full article content on-demand
  app.get('/api/news/article', async (req: Request, res: Response) => {
    try {
      const targetUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
      if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
        return res.status(400).json({ success: false, error: 'Valid URL parameter required' });
      }

      // SSRF Protection: Validate hostname
      try {
        const parsed = new URL(targetUrl);
        if (isPrivateOrProhibitedHost(parsed.hostname)) {
          return res.status(403).json({ success: false, error: 'Access to internal or prohibited host is denied.' });
        }
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format.' });
      }

      const extracted = await extractFullArticleFromWeb(targetUrl);
      if (extracted && extracted.paragraphs.length > 0) {
        return res.json({
          success: true,
          paragraphs: extracted.paragraphs,
          lead: extracted.lead,
          count: extracted.paragraphs.length,
        });
      }

      return res.json({
        success: false,
        paragraphs: [],
        message: 'Could not extract article content, displaying syndicated feed excerpt.',
      });
    } catch (err) {
      console.error('Error in /api/news/article:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch article' });
    }
  });

  // 4. Short Code Redirect Endpoint (handles both /s/:code and /:code)
  const handleShortCodeRedirect = (req: Request, res: Response, next: NextFunction) => {
    const { code } = req.params;

    // Filter out common static assets or system paths
    const reserved = ['assets', 'src', 'api', 'favicon', 'robots', 'vite', 'node_modules', 's'];
    if (reserved.includes(code.toLowerCase())) {
      return next();
    }

    const entry = shortlinksStore[code];
    if (entry && entry.affiliateUrl) {
      // Validate allowed retailer host and scheme before redirecting
      try {
        const parsed = new URL(entry.affiliateUrl);
        const check = isAllowedRetailerHost(parsed.hostname);
        if (check.allowed && (parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
          // Increment click count
          entry.clicks = (entry.clicks || 0) + 1;
          saveShortlinks(shortlinksStore);

          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
          return res.redirect(302, entry.affiliateUrl);
        }
      } catch (err) {
        console.error('Failed to parse affiliate redirect destination:', err);
      }
    }

    // If not matching a short link, proceed to SPA
    next();
  };

  app.get('/s/:code([a-zA-Z0-9]{5,10})', handleShortCodeRedirect);
  app.get('/:code([a-zA-Z0-9]{5,10})', handleShortCodeRedirect);

  // 5. Mount Vite in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CLASSIFY TECH server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}
