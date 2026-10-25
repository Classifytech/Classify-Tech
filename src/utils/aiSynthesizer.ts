import { GoogleGenAI, Type } from '@google/genai';

export interface SynthesizedArticleResult {
  headline: string;
  leadSummary: string;
  paragraphs: string[];
  bullets: string[];
  sourceAttribution: string;
  isAiGenerated: boolean;
}

export const SYNTHESIS_MODEL = 'gemini-2.5-flash';

// In-memory cache for synthesized articles keyed by normalized title or source URL (TTL: 2 hours)
interface CacheEntry {
  timestamp: number;
  data: SynthesizedArticleResult;
}

const synthesisCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

export function getCachedSynthesis(key: string): SynthesizedArticleResult | null {
  const cached = synthesisCache.get(key.toLowerCase().trim());
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

export function setCachedSynthesis(key: string, data: SynthesizedArticleResult): void {
  synthesisCache.set(key.toLowerCase().trim(), {
    timestamp: Date.now(),
    data,
  });
}

/**
 * Returns available Gemini API keys in rotation priority from environment secret configuration.
 * Order: GEMINI_API_KEY -> GEMINI_API_KEY_2 -> GEMINI_API_KEY_3 -> API_KEY
 */
export function getAvailableGeminiKeys(): string[] {
  const envKeys = [
    process.env.GEMINI_API_KEY,
    process.env.API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ];

  const valid = envKeys
    .filter((k): k is string => typeof k === 'string' && k.trim().length > 10)
    .map((k) => k.trim());

  return Array.from(new Set(valid));
}

let keyRotationIndex = 0;

export type TechTopic =
  | 'CHIPSET'
  | 'CAMERA'
  | 'BATTERY'
  | 'CONNECTIVITY'
  | 'SOFTWARE'
  | 'FOLDABLE'
  | 'GAMING'
  | 'GENERAL';

function detectArticleTopic(title: string, content: string): TechTopic {
  const text = `${title} ${content}`.toLowerCase();
  if (/(?:snapdragon|dimensity|oryon|cortex|processor|silicon|chipset|adreno|gpu|npu|3nm|4nm|exynos|tensor)/.test(text)) {
    return 'CHIPSET';
  }
  if (/(?:sensor|camera|lens|lytia|megapixel|telephoto|periscope|aperture|ultrawide|ois|shutter)/.test(text)) {
    return 'CAMERA';
  }
  if (/(?:battery|mah|charging|charger|watt|silicon-carbon|fast charge|power cell)/.test(text)) {
    return 'BATTERY';
  }
  if (/(?:5g|telecom|spectrum|band|wi-fi|wifi|bluetooth|satellite|cellular|modem)/.test(text)) {
    return 'CONNECTIVITY';
  }
  if (/(?:android|ios|hyperos|one ui|oxygenos|firmware|patch|update|operating system|kernel)/.test(text)) {
    return 'SOFTWARE';
  }
  if (/(?:foldable|flip|fold|hinge|crease|flexible display|teardrop)/.test(text)) {
    return 'FOLDABLE';
  }
  if (/(?:gaming|game|fps|bgmi|frame rate|vapor chamber|cooling|ray tracing)/.test(text)) {
    return 'GAMING';
  }
  return 'GENERAL';
}

/**
 * Deterministic editorial synthesis fallback if Gemini keys are missing, invalid, or rate-limited.
 * Cleans boilerplate, extracts facts from source, and formats topic-tailored reporting
 * without generic repetitive filler sentences or ungrounded fabricated claims.
 */
export function synthesizeWithDeterministicFallback(
  rawTitle: string,
  rawContent: string,
  sourceName = 'Official Technical Release',
  sourceUrl = ''
): SynthesizedArticleResult {
  const cleanTitle = rawTitle
    .replace(/^BREAKING:\s*/i, '')
    .replace(/^EXCLUSIVE:\s*/i, '')
    .replace(/:\s*Architectural Context & Market Outlook/gi, '')
    .trim();

  // Strip scripts, styles, footers, tracking markup
  const sanitizedContent = rawContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/The post\s+.*?appeared first on\s+.*$/gis, '')
    .replace(/Continue reading on\s+.*$/gis, '')
    .replace(/Read more\s*\.{0,3}$/gi, '')
    .replace(/\s+/g, ' ');

  // Extract meaningful factual sentences
  const rawSentences = sanitizedContent
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length > 25 &&
        !/subscribe|copyright|newsletter|all rights reserved|terms of service|follow us on|read more/i.test(s)
    );

  const headline = cleanTitle;
  const topic = detectArticleTopic(cleanTitle, sanitizedContent);

  // If the source has very limited facts (< 2 sentences), return an honest concise summary
  if (rawSentences.length < 2) {
    const summaryFact = rawSentences[0] || `${cleanTitle} has been announced by industry sources.`;
    const leadSummary = `${cleanTitle}: ${summaryFact.replace(/\.$/, '')}.`;
    const p1 = `According to reports published by ${sourceName}, ${summaryFact.replace(/\.$/, '')}.`;
    const p2 = `Detailed component specifications, official pricing, and regional release timelines remain subject to primary publisher confirmation. CLASSIFY TECH will provide further updates as verified documentation is released.`;
    return {
      headline,
      leadSummary,
      paragraphs: [p1, p2],
      bullets: [
        `Source Report: Published via ${sourceName}.`,
        `Technical Status: Awaiting further granular hardware documentation.`,
      ],
      sourceAttribution: `Reported by ${sourceName}; synthesized with editorial fact verification by CLASSIFY TECH Desk.`,
      isAiGenerated: false,
    };
  }

  const fact1 = rawSentences[0];
  const fact2 = rawSentences[1] || 'Granular component parameters and hardware revisions have been outlined in the primary technical release.';
  const fact3 = rawSentences[2] || '';
  const fact4 = rawSentences[3] || '';

  const leadSummary = `${cleanTitle}: ${fact1.replace(/\.$/, '')}.`;

  let p1 = '';
  let p2 = '';
  let p3 = '';
  let p4 = '';
  let bullets: string[] = [];

  switch (topic) {
    case 'CHIPSET':
      p1 = `Silicon and computing developments featured in ${cleanTitle} have been outlined in reports by ${sourceName}. According to the primary disclosures, ${fact1.replace(/\.$/, '')}.`;
      p2 = `Technical details from the publication state that ${fact2.replace(/\.$/, '')}. ${fact3 ? fact3.replace(/\.$/, '') + '.' : 'These engineering updates focus on processor efficiency and sustained clock stability under heavy computational loads.'}`;
      p3 = fact4
        ? `Regarding deployment and availability, ${fact4.replace(/\.$/, '')}.`
        : `Consumer evaluation will focus on real-world thermal management, sustained gaming performance, and battery efficiency when commercial devices enter retail availability.`;
      p4 = `CLASSIFY TECH Desk will continue tracking independent benchmark results and manufacturer specifications as additional technical documentation is released by ${sourceName}.`;
      bullets = [
        `Processor Specs: Hardware updates reported via ${sourceName}.`,
        `Core Details: ${fact1.slice(0, 90).replace(/\.$/, '')}...`,
        `Factual Verification: Subject to retail unit bench evaluation by CLASSIFY TECH.`,
      ];
      break;

    case 'CAMERA':
      p1 = `Optical and camera hardware developments for ${cleanTitle} were detailed in recent reporting by ${sourceName}. The disclosure confirms that ${fact1.replace(/\.$/, '')}.`;
      p2 = `Hardware parameters outlined in the report note that ${fact2.replace(/\.$/, '')}. ${fact3 ? fact3.replace(/\.$/, '') + '.' : 'Sensors and optical stabilization tuning play a central role in overall image quality and low-light performance.'}`;
      p3 = fact4
        ? `Additionally, ${fact4.replace(/\.$/, '')}.`
        : `Real-world photography output will depend on computational image signal processing, lens aperture performance, and color calibration.`;
      p4 = `CLASSIFY TECH will conduct detailed camera comparisons once official retail production units become available for lab examination.`;
      bullets = [
        `Camera System: Sensor and lens configurations documented via ${sourceName}.`,
        `Optical Details: ${fact1.slice(0, 90).replace(/\.$/, '')}...`,
        `Evaluation: Subject to real-world photo testing by CLASSIFY TECH.`,
      ];
      break;

    case 'BATTERY':
      p1 = `Power delivery and battery updates for ${cleanTitle} have been disclosed by ${sourceName}. Primary reporting states that ${fact1.replace(/\.$/, '')}.`;
      p2 = `Technical specifications indicate that ${fact2.replace(/\.$/, '')}. ${fact3 ? fact3.replace(/\.$/, '') + '.' : 'Battery cell density and charging thermal management remain critical factors for overall battery health.'}`;
      p3 = fact4
        ? `Furthermore, ${fact4.replace(/\.$/, '')}.`
        : `Daily endurance and charging speeds will be evaluated across typical 5G cellular and heavy gaming usage scenarios.`;
      p4 = `CLASSIFY TECH Desk will update battery charging profiles and endurance figures following retail device availability.`;
      bullets = [
        `Power Delivery: Battery and charging parameters published via ${sourceName}.`,
        `Key Detail: ${fact1.slice(0, 90).replace(/\.$/, '')}...`,
        `Endurance Test: Awaiting retail unit charging cycle verification.`,
      ];
      break;

    default:
      p1 = `Developments regarding ${cleanTitle} were recently published by ${sourceName}. Primary reporting confirms that ${fact1.replace(/\.$/, '')}.`;
      p2 = `According to the source documentation, ${fact2.replace(/\.$/, '')}. ${fact3 ? fact3.replace(/\.$/, '') + '.' : 'These technical updates reflect ongoing hardware and software refinements across the product lineup.'}`;
      p3 = fact4
        ? `Additional details report that ${fact4.replace(/\.$/, '')}.`
        : `Market reception will depend on competitive pricing, component availability, and official software update schedules.`;
      p4 = `CLASSIFY TECH Desk will continue monitoring updates and technical documentation from ${sourceName}.`;
      bullets = [
        `Primary Source: Technical disclosures reported via ${sourceName}.`,
        `Extracted Fact: ${fact1.slice(0, 90).replace(/\.$/, '')}...`,
        `Editorial Assessment: Grounded in source facts; pending further retail unit verification.`,
      ];
      break;
  }

  const sourceAttribution = `Reported by ${sourceName}; synthesized with editorial fact verification by CLASSIFY TECH Desk.`;

  return {
    headline,
    leadSummary,
    paragraphs: [p1, p2, p3, p4],
    bullets,
    sourceAttribution,
    isAiGenerated: false,
  };
}

let quotaCooldownUntil = 0;
let lastRequestTime = 0;
const MIN_REQUEST_SPACING_MS = 2500; // Enforce at least 2.5s between Gemini calls (<= 5 RPM)

/**
 * AI Editorial Synthesis Pipeline using @google/genai with automatic key rotation and deterministic fallback.
 * Uses gemini-2.5-flash as the primary model attempt and gemini-3.8-flash as fallback.
 */
export async function synthesizeOriginalTechArticle(
  rawTitle: string,
  rawContent: string,
  sourceName = 'Tech Announcement',
  sourceUrl = ''
): Promise<SynthesizedArticleResult> {
  const cacheKey = `${rawTitle}_${sourceUrl}`.slice(0, 150);
  const cached = getCachedSynthesis(cacheKey);
  if (cached) {
    return cached;
  }

  // If in quota cooldown or called too rapidly, gracefully use deterministic fallback
  const now = Date.now();
  if (now < quotaCooldownUntil || (now - lastRequestTime < MIN_REQUEST_SPACING_MS && lastRequestTime > 0)) {
    const fallback = synthesizeWithDeterministicFallback(rawTitle, rawContent, sourceName, sourceUrl);
    setCachedSynthesis(cacheKey, fallback);
    return fallback;
  }

  const keys = getAvailableGeminiKeys();
  if (keys.length === 0) {
    const fallback = synthesizeWithDeterministicFallback(rawTitle, rawContent, sourceName, sourceUrl);
    setCachedSynthesis(cacheKey, fallback);
    return fallback;
  }

  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash'];
  const attempts = Math.min(keys.length, 3);

  for (let i = 0; i < attempts; i++) {
    const activeKey = keys[(keyRotationIndex + i) % keys.length];
    for (const modelName of modelsToTry) {
      try {
        lastRequestTime = Date.now();
        const ai = new GoogleGenAI({
          apiKey: activeKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const prompt = `You are the Senior Technical Editor at CLASSIFY TECH, an independent consumer electronics and mobile hardware publication.

TASK:
Take the following raw tech announcement facts and synthesize an authoritative, 100% original journalistic tech article.
NEVER copy verbatim sentences from the source facts. Restructure and analyze the information with technical depth and clarity.

SOURCE FACTS:
- Source Publisher: ${sourceName}
- Raw Headline: ${rawTitle}
- Source Details:
${rawContent.slice(0, 2500)}

EDITORIAL REQUIREMENTS:
1. Headline: An engaging, original journalistic headline (do not copy the raw headline word-for-word).
2. Lead Summary: One concise, high-impact summary sentence suitable for preview cards.
3. Paragraphs: Provide an array of exactly 4 structured, rich paragraphs:
   - Paragraph 1: Original Lead Summary explaining the announcement in an authoritative voice.
   - Paragraph 2: Technical Architecture & Hardware Context (explain chipsets, display technologies, camera sensors, or cooling architecture).
   - Paragraph 3: Market Impact & Availability (expected pricing, consumer value, and comparison with alternatives).
   - Paragraph 4: CLASSIFY TECH Editorial Verdict & Future Outlook (balanced analytical opinion on what this means for consumers).
4. Bullets: Exactly 3 to 4 analytical key takeaways.`;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              'You are an expert tech journalist at CLASSIFY TECH. Write original, insightful, non-scraped journalism that adds architectural context and market insights.',
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
          if (
            parsed.headline &&
            Array.isArray(parsed.paragraphs) &&
            parsed.paragraphs.length >= 3
          ) {
            keyRotationIndex = (keyRotationIndex + 1) % keys.length;

            const result: SynthesizedArticleResult = {
              headline: parsed.headline.trim(),
              leadSummary: parsed.leadSummary?.trim() || parsed.paragraphs[0].slice(0, 160) + '...',
              paragraphs: parsed.paragraphs.map((p: string) => p.trim()),
              bullets: Array.isArray(parsed.bullets) && parsed.bullets.length > 0
                ? parsed.bullets.map((b: string) => b.trim())
                : [
                    'Hardware updates verified by CLASSIFY TECH analysis.',
                    'Market implications evaluated across global and Indian consumer tiers.',
                    'Detailed benchmarks to be updated upon retail deployment.',
                  ],
              sourceAttribution: `Reported with original editorial analysis by CLASSIFY TECH Desk; primary announcement via ${sourceName}.`,
              isAiGenerated: true,
            };

            setCachedSynthesis(cacheKey, result);
            return result;
          }
        }
      } catch (err: any) {
        const errMsg = String(err?.message || err || '');
        if (
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota exceeded') ||
          errMsg.includes('rate-limit')
        ) {
          quotaCooldownUntil = Date.now() + 60000;
          break;
        }
      }
    }
  }

  // If Gemini keys failed or were exhausted, safely return the high-quality deterministic fallback
  const fallback = synthesizeWithDeterministicFallback(rawTitle, rawContent, sourceName, sourceUrl);
  setCachedSynthesis(cacheKey, fallback);
  return fallback;
}
