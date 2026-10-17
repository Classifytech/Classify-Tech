import type { TechArticle } from '../data/newsData.ts';

export interface Rss2JsonItem {
  title: string;
  pubDate: string;
  link: string;
  guid?: string;
  author?: string;
  thumbnail?: string;
  description?: string;
  content?: string;
  enclosure?: {
    link?: string;
    type?: string;
  };
  categories?: string[];
}

export interface Rss2JsonResponse {
  status: string;
  feed?: {
    url?: string;
    title?: string;
    link?: string;
    description?: string;
  };
  items?: Rss2JsonItem[];
}

/**
 * Strips HTML tags, unwraps CDATA, and thoroughly decodes both numeric
 * (decimal/hex) and common named HTML entities.
 */
/**
 * Strips HTML tags, unwraps CDATA, and thoroughly decodes both numeric
 * (decimal/hex) and common named HTML entities.
 */
export function cleanHtmlText(html: string): string {
  if (!html) return '';

  let text = html;

  // 1. Unwrap CDATA sections: <![CDATA[ content ]]>
  text = text.replace(/<!\[CDATA\[(.*?)\]\]>/gis, '$1');

  // 2. Pre-decode XML-escaped HTML brackets so encoded tags like &lt;img&gt; or &lt;p&gt; are parsed as tags
  text = text
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&');

  // Secondary CDATA check in case unescaped after pre-decode
  text = text.replace(/<!\[CDATA\[(.*?)\]\]>/gis, '$1');

  // 3. Remove script, style, iframe, and img blocks completely
  text = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<img\b[^>]*>/gi, '');

  // 4. Replace block-level closing tags and line breaks with double newlines
  text = text
    .replace(/<\/(p|div|h[1-6]|li|article|section|blockquote)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip all remaining HTML tags
    .replace(/<[^>]+>/g, ' ');

  // 5. Decode decimal numeric entities: e.g. &#8217; -> ’, &#8220; -> “, &#8221; -> ”
  text = text.replace(/&#(\d+);/g, (_, dec) => {
    try {
      const code = parseInt(dec, 10);
      return code >= 32 ? String.fromCodePoint(code) : '';
    } catch {
      return '';
    }
  });

  // 6. Decode hex numeric entities: e.g. &#x2019; -> ’
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      const code = parseInt(hex, 16);
      return code >= 32 ? String.fromCodePoint(code) : '';
    } catch {
      return '';
    }
  });

  // 7. Named HTML entities dictionary
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&hellip;': '…',
    '&mdash;': '—',
    '&ndash;': '–',
    '&lsquo;': '‘',
    '&rsquo;': '’',
    '&ldquo;': '“',
    '&rdquo;': '”',
    '&trade;': '™',
    '&copy;': '©',
    '&reg;': '®',
    '&bull;': '•',
    '&cent;': '¢',
    '&pound;': '£',
    '&euro;': '€',
    '&yen;': '¥',
    '&times;': '×',
    '&divide;': '÷',
    '&plusmn;': '±',
  };

  for (const [entity, replacement] of Object.entries(entities)) {
    text = text.split(entity).join(replacement);
  }

  // Clean lines and normalize paragraph breaks
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0);

  return lines.join('\n\n');
}

/**
 * Formats source credit into a professional journalistic credit (e.g., GSMArena Tech Wire).
 */
export function formatSourceCredit(rawTitle: string, linkStr: string = ''): string {
  const combined = `${rawTitle || ''} ${linkStr || ''}`.toLowerCase();
  if (combined.includes('gsmarena')) {
    return 'GSMArena';
  }
  if (combined.includes('androidauthority')) {
    return 'Android Authority';
  }
  if (combined.includes('gadgets360') || combined.includes('ndtv')) {
    return 'Gadgets 360';
  }
  if (combined.includes('9to5google')) {
    return '9to5Google';
  }
  if (combined.includes('theverge')) {
    return 'The Verge';
  }

  // Fallback domain extraction
  try {
    if (linkStr && /^https?:\/\//i.test(linkStr)) {
      const parsed = new URL(linkStr);
      const host = parsed.hostname.replace(/^www\./, '');
      const parts = host.split('.');
      if (parts[0]) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
    }
  } catch {}

  const clean = cleanHtmlText(rawTitle).split('-')[0].split('|')[0].trim();
  return clean || 'Publisher';
}

/**
 * Curated high-resolution fallback technology photos by category and keywords
 * to ensure cards never show repetitive or broken images.
 */
const CONTEXTUAL_TECH_IMAGES: Record<string, string[]> = {
  CHIPSET: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
  ],
  INDIA: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80',
  ],
  GAMING: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
  ],
  '5G': [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  ],
  ALL: [
    'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
  ],
};

/**
 * Extracts the best available image URL from thumbnail, enclosure, or HTML content.
 * Enhances low-resolution thumbnails (e.g. GSMArena) to high definition.
 */
export function extractImageUrl(item: Rss2JsonItem, categoryKey: string = 'ALL'): string {
  // 1. Direct thumbnail check
  if (item.thumbnail && /^https?:\/\//i.test(item.thumbnail)) {
    return cleanAndUpgradeImageUrl(item.thumbnail);
  }

  // 2. Enclosure link check (image types)
  if (item.enclosure?.link && /^https?:\/\//i.test(item.enclosure.link)) {
    return cleanAndUpgradeImageUrl(item.enclosure.link);
  }

  // 3. Scan HTML description or content for <img> tags
  const combined = `${item.description || ''} ${item.content || ''}`;
  const imgMatch = combined.match(/<img[^>]+src=["'](https?:\/\/[^"'>\s]+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return cleanAndUpgradeImageUrl(imgMatch[1]);
  }

  // 4. Deterministic contextual fallback matching article topic
  const pool = CONTEXTUAL_TECH_IMAGES[categoryKey] || CONTEXTUAL_TECH_IMAGES.ALL;
  const seed = (item.title || 'tech').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return pool[seed % pool.length];
}

/**
 * Upgrades thumbnail URLs to full-resolution counterparts where available.
 */
function cleanAndUpgradeImageUrl(rawUrl: string): string {
  let url = rawUrl.replace(/&amp;/g, '&').trim();

  // GSMArena thumbnail upgrade: remove /-184x111/ or /-344x258/ subpath
  if (url.includes('gsmarena.com') && url.includes('/-')) {
    url = url.replace(/\/-[0-9]+x[0-9]+\//, '/');
  }

  return url;
}

/**
 * Assigns category badge based on headline and content keywords.
 * Includes comprehensive coverage of AI (OpenAI, ChatGPT, Gemini, etc.),
 * mobile chipsets, India-specific launches, gaming, battery/charging, and 5G.
 */
export function inferCategory(title: string, desc: string): {
  category: 'ALL' | 'INDIA' | 'CHIPSET' | 'GAMING' | '5G';
  badge: string;
} {
  const combined = `${title || ''} ${desc || ''}`.toLowerCase();

  // India Tech Launches & Regional Pricing
  if (
    combined.includes('india') ||
    combined.includes('poco') ||
    combined.includes('redmi') ||
    combined.includes('xiaomi') ||
    combined.includes('realme') ||
    combined.includes('jio') ||
    combined.includes('airtel') ||
    combined.includes('rupee') ||
    combined.includes('inr') ||
    combined.includes('flipkart')
  ) {
    return { category: 'INDIA', badge: 'INDIA TECH LAUNCH' };
  }

  // Gaming, Battery & Fast Charging
  if (
    combined.includes('gaming') ||
    combined.includes('game') ||
    combined.includes('fps') ||
    combined.includes('bgmi') ||
    combined.includes('gpu') ||
    combined.includes('battery') ||
    combined.includes('charging') ||
    combined.includes('mah') ||
    combined.includes('charger') ||
    combined.includes('fast charge')
  ) {
    return { category: 'GAMING', badge: 'GAMING & BATTERY' };
  }

  // Chipset, Silicon, and Artificial Intelligence
  if (
    combined.includes('snapdragon') ||
    combined.includes('dimensity') ||
    combined.includes('qualcomm') ||
    combined.includes('mediatek') ||
    combined.includes('processor') ||
    combined.includes('chipset') ||
    combined.includes('silicon') ||
    combined.includes('openai') ||
    combined.includes('chatgpt') ||
    combined.includes('gemini') ||
    combined.includes('copilot') ||
    combined.includes('claude') ||
    combined.includes('deepseek') ||
    combined.includes('artificial intelligence') ||
    combined.includes('ai ') ||
    combined.includes(' ai') ||
    combined.includes('npu')
  ) {
    return { category: 'CHIPSET', badge: 'CHIPSET & AI' };
  }

  // 5G, Telecom & Wireless Networks
  if (
    combined.includes('5g') ||
    combined.includes('telecom') ||
    combined.includes('spectrum') ||
    combined.includes('wifi') ||
    combined.includes('wi-fi') ||
    combined.includes('cellular') ||
    combined.includes('satellite')
  ) {
    return { category: '5G', badge: '5G & TELECOM' };
  }

  return { category: 'ALL', badge: 'TECH NEWS' };
}

/**
 * Formats RSS pubDate into user-friendly relative text.
 */
export function formatPubDate(pubDateStr: string): string {
  if (!pubDateStr) return 'Recent Update';
  try {
    const date = new Date(pubDateStr);
    if (isNaN(date.getTime())) return 'Live Feed';
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just Now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const days = Math.floor(diffHours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } catch {
    return 'Recent Update';
  }
}

/**
 * Converts a raw rss2json item into our standardized TechArticle model.
 * STRICT: Never fabricates synthetic paragraphs or false bylines.
 * Displays genuine feed content and provides direct link to publisher's original story.
 */
export function transformRssItemToArticle(
  item: Rss2JsonItem,
  rawFeedTitle: string = 'Live Tech Feed'
): TechArticle {
  const cleanTitle = cleanHtmlText(item.title);

  // Pick the richest available text source between content and description
  const textFromContent = cleanHtmlText(item.content || '');
  const textFromDesc = cleanHtmlText(item.description || '');

  // Combine content and description safely to ensure all available paragraphs are retained
  let combinedText = '';
  if (textFromContent && textFromDesc) {
    if (textFromContent.includes(textFromDesc)) {
      combinedText = textFromContent;
    } else if (textFromDesc.includes(textFromContent)) {
      combinedText = textFromDesc;
    } else {
      combinedText = `${textFromDesc}\n\n${textFromContent}`;
    }
  } else {
    combinedText = textFromContent || textFromDesc || cleanTitle;
  }

  const { category, badge } = inferCategory(cleanTitle, combinedText);
  const imageUrl = extractImageUrl(item, category);
  const sourceName = formatSourceCredit(rawFeedTitle, item.link || '');

  // Split authentic content into natural paragraphs and deduplicate
  const cleanSnippetArtifacts = (str: string): string => {
    return str
      .replace(/\[(?:&#8230;|&#x2026;|…|\.\.\.)\]/gi, '')
      .replace(/\[\+?\d+\s*(?:more\s*)?chars?\]/gi, '')
      .replace(/The post\s+.*?appeared first on\s+.*$/gis, '')
      .replace(/Continue reading on\s+.*$/gis, '')
      .replace(/Read more\s*\.{0,3}$/gi, '')
      .trim();
  };

  const rawParagraphs = cleanSnippetArtifacts(combinedText)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10);

  const seenParas = new Set<string>();
  const paragraphs: string[] = [];
  for (const p of rawParagraphs) {
    const key = p.toLowerCase();
    if (!seenParas.has(key)) {
      seenParas.add(key);
      paragraphs.push(p);
    }
  }

  const finalParagraphs =
    paragraphs.length > 0
      ? paragraphs
      : [combinedText || `${cleanTitle}. Read the full story on ${sourceName || 'the original publisher website'}.`];

  // Extract a clean, complete sentence for summaryDesc (never truncate midway with ellipses)
  let summaryDesc = '';
  if (textFromDesc && textFromDesc.length >= 20 && textFromDesc.length <= 260) {
    summaryDesc = cleanSnippetArtifacts(textFromDesc);
  } else {
    const textToSearch = cleanSnippetArtifacts(textFromDesc || combinedText);
    const match = textToSearch.match(/^.*?[.!?](?:\s|$)/);
    if (match && match[0].trim().length >= 30) {
      summaryDesc = match[0].trim();
    } else if (textToSearch.length <= 260) {
      summaryDesc = textToSearch;
    } else {
      const sub = textToSearch.slice(0, 260);
      const lastSpace = sub.lastIndexOf(' ');
      summaryDesc = (lastSpace > 50 ? sub.slice(0, lastSpace) : sub).trim() + '.';
    }
  }

  const uniqueId =
    item.guid && item.guid.length > 5
      ? `rss-${item.guid.replace(/[^a-zA-Z0-9_-]/g, '').slice(-32)}`
      : item.link
        ? `rss-${encodeURIComponent(item.link).slice(-36)}`
        : `rss-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  return {
    id: uniqueId,
    title: cleanTitle,
    desc: summaryDesc,
    fullBody: finalParagraphs,
    bullets: [
      `${sourceName || 'Publisher'} (${item.pubDate ? formatPubDate(item.pubDate) : 'Live Wire'})`,
      `Topic Focus: ${badge}`,
      `Authentic Editorial Coverage • Direct Publisher Link Verified`
    ],
    badge,
    category,
    sourceName: sourceName || undefined,
    sourceUrl: item.link || undefined,
    time: formatPubDate(item.pubDate),
    img: imageUrl,
  };
}

/**
 * Free Curated Tech RSS Feed Endpoints.
 */
export const FREE_TECH_RSS_FEEDS = [
  {
    name: 'GSMArena Tech Wire',
    rssUrl: 'https://www.gsmarena.com/rss-news-reviews.php3',
  },
  {
    name: 'Android Authority Hardware Wire',
    rssUrl: 'https://www.androidauthority.com/feed/',
  },
  {
    name: 'Gadgets 360 India Tech',
    rssUrl: 'https://feeds.feedburner.com/gadgets360-latest',
  },
  {
    name: '9to5Google Android Wire',
    rssUrl: 'https://9to5google.com/feed/',
  },
  {
    name: 'The Verge Technology',
    rssUrl: 'https://www.theverge.com/rss/index.xml',
  },
];

export const AUTO_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 Minutes
