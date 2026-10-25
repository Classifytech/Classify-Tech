import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { isPrivateOrProhibitedHost } from './src/utils/security.ts';
import {
  isSupportedRetailerUrl,
  generateShortCode,
} from './src/utils/affiliate.ts';
import {
  cleanHtmlText,
  FREE_TECH_RSS_FEEDS,
  transformRssItemToArticle,
  type Rss2JsonResponse,
  type Rss2JsonItem,
} from './src/utils/rssParser.ts';
import type { TechArticle } from './src/data/newsData.ts';
import {
  synthesizeOriginalTechArticle,
  synthesizeWithDeterministicFallback,
  getAvailableGeminiKeys,
} from './src/utils/aiSynthesizer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const CONTACT_FILE = path.resolve(__dirname, 'src/data/contact_submissions.json');
const REPORTS_FILE = path.resolve(__dirname, 'src/data/news_reports.json');
const ADMIN_NEWS_FILE = path.resolve(__dirname, 'src/data/admin_news.json');
const ADMIN_PHONES_FILE = path.resolve(__dirname, 'src/data/admin_phones.json');

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

// Helper: Extract safe client IP for rate limiting
function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

// -------------------------------------------------------------
// SECURE MULTI-API KEY SELECTION (SERVER-ONLY)
// Keys are read strictly from environment secret configuration.
// No hardcoded credentials or Base64 vault chunks in source code.
// Priority: GEMINI_API_KEY -> API_KEY -> GEMINI_API_KEY_2 -> GEMINI_API_KEY_3
// -------------------------------------------------------------
function getPrivateServerKeys(): string[] {
  const keys: string[] = [];
  const envKeys = [
    process.env.GEMINI_API_KEY,
    process.env.API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ];
  for (const k of envKeys) {
    if (typeof k === 'string') {
      const trimmed = k.trim();
      if (trimmed.length > 10 && !keys.includes(trimmed)) {
        keys.push(trimmed);
      }
    }
  }
  return keys;
}

let serverKeyRotationIndex = 0;
let serverCooldownUntil = 0;
let serverLastCallTime = 0;
const SERVER_MIN_SPACING_MS = 2500;

async function generateSynthesizedArticleServer(
  rawTitle: string,
  rawContent: string,
  sourceName = 'Official Technical Release',
  sourceUrl = ''
) {
  const keys = getPrivateServerKeys();
  const now = Date.now();

  if (
    keys.length === 0 ||
    now < serverCooldownUntil ||
    (now - serverLastCallTime < SERVER_MIN_SPACING_MS && serverLastCallTime > 0)
  ) {
    return synthesizeWithDeterministicFallback(rawTitle, rawContent, sourceName, sourceUrl);
  }

  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash'];
  const attempts = Math.min(keys.length, 3);

  for (let i = 0; i < attempts; i++) {
    const activeKey = keys[(serverKeyRotationIndex + i) % keys.length];
    for (const modelName of modelsToTry) {
      try {
        serverLastCallTime = Date.now();
        const ai = new GoogleGenAI({
          apiKey: activeKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const prompt = `You are the Senior Technical Editor at CLASSIFY TECH, an authoritative independent consumer hardware and mobile electronics publication.

TASK:
Write a comprehensive, deeply informative, 100% original 4-to-5 paragraph CLASSIFY TECH Analysis on this tech announcement.
Do NOT copy verbatim sentences from the source facts. Restructure, analyze, and expand the information with architectural clarity and market depth.

SOURCE FACTS:
- Source Publisher: ${sourceName}
- Raw Headline: ${rawTitle}
- Source Details:
${rawContent.slice(0, 3000)}

EDITORIAL CRITERIA:
1. Headline: Clean, engaging, authentic journalistic headline (do NOT append any suffix like ': Architectural Context & Market Outlook').
2. Lead Summary: A single crisp, high-impact summary sentence.
3. Paragraphs: Provide an array of 4 to 5 rich, distinct editorial paragraphs covering:
   - Paragraph 1: Core technical announcement and primary hardware/software specifications in completely fresh language.
   - Paragraph 2: Deep architectural breakdown (silicon fabrication, CPU/GPU clusters, ISP/NPU capabilities, cooling architecture).
   - Paragraph 3: Competitive positioning against rival flagships or alternatives in the same class.
   - Paragraph 4: Pricing expectations, Indian & global market availability, and real-world consumer value.
   - Paragraph 5 (optional/conclusion): CLASSIFY TECH long-term outlook and verdict.
4. Bullets: Exactly 3 to 4 analytical key takeaways.`;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              'You are an expert technical editor at CLASSIFY TECH. Write original, deep, non-plagiarized consumer hardware journalism with zero fluff and no fake title suffixes.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                leadSummary: { type: Type.STRING },
                paragraphs: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                bullets: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['headline', 'leadSummary', 'paragraphs', 'bullets'],
            },
          },
        });

        const responseText = response.text?.trim() || '';
        if (responseText) {
          const parsed = JSON.parse(responseText);
          if (parsed.headline && Array.isArray(parsed.paragraphs) && parsed.paragraphs.length >= 3) {
            serverKeyRotationIndex = (serverKeyRotationIndex + 1) % keys.length;
            const cleanHeadline = parsed.headline
              .replace(/:\s*Architectural Context & Market Outlook/gi, '')
              .trim();

            return {
              headline: cleanHeadline,
              leadSummary: parsed.leadSummary?.trim() || parsed.paragraphs[0].slice(0, 160) + '...',
              paragraphs: parsed.paragraphs.map((p: string) => p.trim()),
              bullets: Array.isArray(parsed.bullets) && parsed.bullets.length > 0
                ? parsed.bullets.map((b: string) => b.trim())
                : [
                    'Architectural advancements verified by CLASSIFY TECH analysis.',
                    'Market implications evaluated across global and Indian consumer tiers.',
                    'Detailed hardware benchmarks to be updated upon retail deployment.',
                  ],
              sourceAttribution: `Reported with original editorial analysis by CLASSIFY TECH Desk; primary announcement via ${sourceName}.`,
              isAiGenerated: true,
            };
          }
        }
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
          serverCooldownUntil = Date.now() + 60000;
          break;
        }
        // Silent failover to next model or key with zero console exposure
      }
    }
  }

  return synthesizeWithDeterministicFallback(rawTitle, rawContent, sourceName, sourceUrl);
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

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  // Security Headers & Payload Size Limits
  app.use(express.json({ limit: '50kb' }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), midis=()');
    
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    const host = req.get('host');
    if (host) {
      if (/[\r\n\0\\;<>@]/.test(host) || host.length > 255) {
        console.warn(`[Security] Blocked malformed Host header: ${host}`);
        return res.status(400).send('Invalid Host header');
      }

      if (process.env.STRICT_HOST_CHECK === 'true') {
        const isAllowedHost =
          host === 'classifytech.ai.studio' ||
          host.endsWith('.ai.studio') ||
          host.endsWith('.run.app') ||
          host.includes('localhost') ||
          host.includes('127.0.0.1');
        if (!isAllowedHost) {
          console.warn(`[Security] Blocked request with unlisted Host header: ${host}`);
          return res.status(400).send('Invalid Host header');
        }
      }
    }

    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://tpc.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; connect-src 'self' https://classify.classifytechz.workers.dev https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://api.rss2json.com https://*.gsmarena.com https://*.androidauthority.com https://*.gadgets360.com https://*.9to5google.com https://*.theverge.com https://feeds.feedburner.com https: ws: wss:; frame-src 'self' https://googleads.g.doubleclick.net https://*.doubleclick.net https://*.googlesyndication.com https://tpc.googlesyndication.com; frame-ancestors 'self' https://*.google.com https://*.google.dev https://*.aistudio.google.com https://aistudio.google.com https://*.run.app; form-action 'self';"
    );
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'CLASSIFY TECH API',
      timestamp: Date.now(),
      uptime: process.uptime(),
    });
  });

  // Google AdSense & Search Engine Crawler endpoints
  app.get('/robots.txt', (_req: Request, res: Response) => {
    const robotsPath = path.resolve(__dirname, 'public/robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.type('text/plain').sendFile(robotsPath);
    } else {
      res.type('text/plain').send('User-agent: *\nAllow: /\n\nUser-agent: Mediapartners-Google\nAllow: /\n');
    }
  });

  app.get('/ads.txt', (_req: Request, res: Response) => {
    const adsPath = path.resolve(__dirname, 'public/ads.txt');
    if (fs.existsSync(adsPath)) {
      res.type('text/plain').sendFile(adsPath);
    } else {
      res.type('text/plain').send('# Google AdSense Authorized Digital Sellers\n');
    }
  });

  // Public Content Fetch Endpoint (Serves Custom Articles & Phone Database)
  app.get('/api/content', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      customNews: loadAdminNews(),
      customPhones: loadAdminPhones(),
    });
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

  // API: Live RSS News Syndication
  let newsCache: { timestamp: number; articles: TechArticle[] } | null = null;
  const NEWS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (location) {
          const nextUrl = new URL(location, url).toString();
          const nextParsed = new URL(nextUrl);
          if (
            nextParsed.protocol === 'https:' &&
            ALLOWED_ARTICLE_DOMAINS.includes(nextParsed.hostname) &&
            !isPrivateOrProhibitedHost(nextParsed.hostname)
          ) {
            return extractFullArticleFromWeb(nextUrl);
          }
        }
        return null;
      }

      if (!res.ok) return null;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) return null;

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

      const fetchPromises = FREE_TECH_RSS_FEEDS.map(async (feed) => {
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

        const maxAiArticles = Math.min(deduped.length, 6);
        for (let i = 0; i < deduped.length; i++) {
          const article = deduped[i];
          let sourceText = article.fullBody.join('\n\n') || article.desc;
          if (article.sourceUrl && i < maxAiArticles) {
            const extracted = await extractFullArticleFromWeb(article.sourceUrl);
            if (extracted && extracted.paragraphs.length >= 2) {
              sourceText = extracted.paragraphs.join('\n\n');
            }
          }

          try {
            // Synthesize top items via private Gemini vault (or fallback if in cooldown); format remaining with topic-aware deterministic fallback
            const synthesized = i < maxAiArticles
              ? await generateSynthesizedArticleServer(
                  article.title,
                  sourceText,
                  article.sourceName || 'Tech Announcement',
                  article.sourceUrl || ''
                )
              : synthesizeWithDeterministicFallback(
                  article.title,
                  sourceText,
                  article.sourceName || 'Tech Announcement',
                  article.sourceUrl || ''
                );

            if (synthesized) {
              article.title = synthesized.headline;
              article.desc = synthesized.leadSummary;
              article.fullBody = synthesized.paragraphs;
              if (synthesized.bullets && synthesized.bullets.length > 0) {
                article.bullets = synthesized.bullets;
              }
            }
          } catch {
            // Safe fallback
          }
        }

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

  // In-memory cache & in-flight promise map for detailed article synthesis (2 hours TTL)
  const serverArticleSynthesisCache = new Map<string, { timestamp: number; data: any }>();
  const inFlightArticleRequests = new Map<string, Promise<any>>();
  const ARTICLE_SYNTHESIS_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

  // Dedicated endpoint to fetch untruncated full article content on-demand with AI synthesis
  app.get('/api/news/article', async (req: Request, res: Response) => {
    try {
      const targetUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
      const rawTitle = typeof req.query.title === 'string' ? req.query.title.trim() : 'Tech Hardware Announcement';
      const sourceName = typeof req.query.source === 'string' ? req.query.source.trim() : 'Technical Release';

      if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
        return res.status(400).json({ success: false, error: 'Valid URL parameter required' });
      }

      try {
        const parsed = new URL(targetUrl);
        if (isPrivateOrProhibitedHost(parsed.hostname)) {
          return res.status(403).json({ success: false, error: 'Access to internal or prohibited host is denied.' });
        }
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format.' });
      }

      const cacheKey = `${rawTitle}_${targetUrl}`.toLowerCase().trim();
      const cached = serverArticleSynthesisCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ARTICLE_SYNTHESIS_CACHE_TTL_MS) {
        return res.json({
          success: true,
          fromCache: true,
          ...cached.data,
        });
      }

      let synthesisPromise = inFlightArticleRequests.get(cacheKey);
      if (!synthesisPromise) {
        synthesisPromise = (async () => {
          const extracted = await extractFullArticleFromWeb(targetUrl);
          const sourceText = extracted && extracted.paragraphs.length > 0
            ? extracted.paragraphs.join('\n\n')
            : rawTitle;

          const synthesized = await generateSynthesizedArticleServer(
            rawTitle,
            sourceText,
            sourceName,
            targetUrl
          );

          const payload = {
            headline: synthesized.headline,
            lead: synthesized.leadSummary,
            paragraphs: synthesized.paragraphs,
            bullets: synthesized.bullets,
            sourceAttribution: synthesized.sourceAttribution,
            count: synthesized.paragraphs.length,
            isAiGenerated: synthesized.isAiGenerated,
          };

          serverArticleSynthesisCache.set(cacheKey, {
            timestamp: Date.now(),
            data: payload,
          });

          return payload;
        })().finally(() => {
          inFlightArticleRequests.delete(cacheKey);
        });

        inFlightArticleRequests.set(cacheKey, synthesisPromise);
      }

      const payload = await synthesisPromise;
      return res.json({
        success: true,
        ...payload,
      });
    } catch (err) {
      console.error('Error in /api/news/article:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch article' });
    }
  });

  // -------------------------------------------------------------
  // CLASSIFY TECH Smart Affiliate Shortener & Hidden Post Redirects
  // -------------------------------------------------------------

  // 1. API: Shorten product link & atomic sync with Cloudflare Worker V2
  app.post('/api/shorten', async (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    if (isRateLimited(`shorten_${clientIp}`, 30, 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait a minute before creating more short links.',
      });
    }

    try {
      const { url, code: clientCode, postId: clientPostId } = req.body || {};
      if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({ success: false, error: 'Please enter a valid product link.' });
      }

      const trimmedUrl = url.trim();
      const validation = isSupportedRetailerUrl(trimmedUrl);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error || 'Please enter a valid HTTP or HTTPS link.' });
      }

      const code = (clientCode && typeof clientCode === 'string' && /^[a-zA-Z0-9_-]{4,16}$/.test(clientCode.trim()))
        ? clientCode.trim()
        : generateShortCode(6);
      const postId = (clientPostId && typeof clientPostId === 'string' && clientPostId.trim())
        ? clientPostId.trim()
        : `post-${code}`;

      // Single Atomic Sync with Cloudflare Worker V2
      const workerController = new AbortController();
      const timeout = setTimeout(() => workerController.abort(), 9000);

      const cfRes = await fetch('https://classify.classifytechz.workers.dev/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmedUrl,
          code,
          postId,
        }),
        signal: workerController.signal,
      }).finally(() => clearTimeout(timeout));

      if (cfRes.ok) {
        const data: any = await cfRes.json();
        return res.json({
          success: true,
          code: data.code || code,
          postId: data.postId || postId,
          affiliateUrl: data.affiliateUrl || data.finalUrl || trimmedUrl,
          store: data.store || validation.store || 'amazon',
          storeName: data.storeName || validation.storeName || 'Amazon',
          kvSaved: data.kvSaved ?? true,
          createdAt: data.createdAt || Date.now(),
          expiresAt: data.expiresAt || (Date.now() + 31536000 * 1000),
          ttlSeconds: data.ttlSeconds || 31536000,
        });
      }

      const errorBody = await cfRes.text().catch(() => '');
      console.warn('[Cloudflare Worker V2] API shorten returned status:', cfRes.status, errorBody);
      return res.status(cfRes.status >= 400 && cfRes.status < 500 ? cfRes.status : 502).json({
        success: false,
        error: 'Cloudflare Worker V2 sync failed. Please try again.',
      });
    } catch (err: any) {
      console.error('Error in /api/shorten proxy:', err);
      return res.status(500).json({
        success: false,
        error: err.name === 'AbortError' ? 'Cloudflare Worker V2 request timed out. Please try again.' : 'Failed to process affiliate link.',
      });
    }
  });

  // 2. API: Resolve short link from Cloudflare Worker KV
  app.get('/api/resolve/:code', async (req: Request, res: Response) => {
    const { code } = req.params;
    if (!code || !/^[a-zA-Z0-9_-]{4,20}$/.test(code)) {
      return res.status(400).json({ success: false, error: 'Invalid short code format.' });
    }

    try {
      const cfRes = await fetch(`https://classify.classifytechz.workers.dev/api/resolve/${encodeURIComponent(code)}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      });

      if (cfRes.ok) {
        const data = await cfRes.json();
        return res.json(data);
      }

      return res.status(cfRes.status === 404 ? 404 : 502).json({
        success: false,
        error: cfRes.status === 404 ? 'Short link not found in Cloudflare KV.' : 'Failed to resolve short link from Cloudflare KV.',
      });
    } catch (err: any) {
      console.error(`Error resolving shortcode ${code}:`, err);
      return res.status(500).json({ success: false, error: 'Network error resolving short link.' });
    }
  });

  // 3. Instant Direct Short-Link Redirect (/s/:code)
  app.get('/s/:code', async (req: Request, res: Response) => {
    const { code } = req.params;
    if (!code || !/^[a-zA-Z0-9_-]{4,20}$/.test(code)) {
      return res.redirect(302, '/');
    }

    try {
      const cfRes = await fetch(`https://classify.classifytechz.workers.dev/api/resolve/${encodeURIComponent(code)}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      });

      if (cfRes.ok) {
        const data: any = await cfRes.json();
        if (data && data.success && data.affiliateUrl) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return res.redirect(302, data.affiliateUrl);
        }
      }
    } catch (err) {
      console.error(`Error in instant redirect for /s/${code}:`, err);
    }

    return res.redirect(302, '/');
  });

  // Mount Vite in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CLASSIFY TECH server running on http://0.0.0.0:${PORT}`);
  });
}

const isMainModule = () => {
  if (!process.argv[1]) return false;
  if (process.argv.some((arg) => arg.includes('--test') || arg.includes('test.ts'))) {
    return false;
  }
  const resolvedArg = path.resolve(process.argv[1]);
  const currentFile = fileURLToPath(import.meta.url);
  return (
    resolvedArg === currentFile ||
    process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js')
  );
};

if (isMainModule()) {
  startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}
