import test from 'node:test';
import assert from 'node:assert/strict';
import {
  synthesizeWithDeterministicFallback,
  getCachedSynthesis,
  setCachedSynthesis,
  getAvailableGeminiKeys,
  SYNTHESIS_MODEL,
  type SynthesizedArticleResult,
} from './aiSynthesizer.ts';

test('SYNTHESIS_MODEL is set to gemini-2.5-flash as primary model attempt', () => {
  assert.equal(SYNTHESIS_MODEL, 'gemini-2.5-flash');
});

test('AI Synthesizer Fallback formats structured paragraphs, bullets and source attribution without generic boilerplate', () => {
  const result = synthesizeWithDeterministicFallback(
    'Qualcomm Reveals Snapdragon 8 Elite Architecture',
    'Qualcomm announced its custom Oryon CPU cores at the annual summit. The Adreno 830 GPU achieves 40% higher rendering throughput. Early OEM flagships will launch in India and international markets.',
    'GSMArena',
    'https://www.gsmarena.com/snapdragon_8_elite_launch.php'
  );

  assert.equal(result.headline, 'Qualcomm Reveals Snapdragon 8 Elite Architecture');
  assert.ok(result.leadSummary.length > 20);
  assert.equal(result.paragraphs.length, 4);
  assert.ok(result.paragraphs[0].includes('Qualcomm Reveals Snapdragon 8 Elite Architecture'));
  assert.ok(result.paragraphs[0].includes('GSMArena'));
  assert.ok(result.paragraphs[3].includes('CLASSIFY TECH'));
  assert.ok(result.bullets.length >= 3);
  assert.ok(result.sourceAttribution.includes('GSMArena'));
  assert.ok(result.sourceAttribution.includes('CLASSIFY TECH Desk'));
  assert.equal(result.isAiGenerated, false);
});

test('AI Synthesizer in-memory cache stores and retrieves articles', () => {
  const testData: SynthesizedArticleResult = {
    headline: 'Cache Test Article',
    leadSummary: 'Cache lead summary',
    paragraphs: ['P1', 'P2', 'P3', 'P4'],
    bullets: ['B1', 'B2', 'B3'],
    sourceAttribution: 'Attribution',
    isAiGenerated: false,
  };

  setCachedSynthesis('test_article_key', testData);
  const retrieved = getCachedSynthesis('test_article_key');
  assert.ok(retrieved !== null);
  assert.equal(retrieved?.headline, 'Cache Test Article');
});

test('AI Synthesizer formats camera-specific analysis for imaging announcements', () => {
  const result = synthesizeWithDeterministicFallback(
    'Sony LYTIA Unveils Next-Gen LYT-900 1-Inch Camera Sensor',
    'Sony announced its LYT-900 1-inch stacked CMOS sensor featuring 50MP resolution and 2-layer transistor pixels. The dual-conversion gain system improves high-dynamic range capture in low-light environments.',
    'Sony Semiconductor',
    'https://www.sony-semicon.com/lyt900.html'
  );

  assert.equal(result.headline, 'Sony LYTIA Unveils Next-Gen LYT-900 1-Inch Camera Sensor');
  assert.equal(result.paragraphs.length, 4);
  assert.ok(result.paragraphs[0].includes('Optical and camera hardware developments'));
  assert.ok(result.bullets.some((b) => b.includes('Camera System')));
});

test('AI Synthesizer returns concise summary when source content is brief', () => {
  const result = synthesizeWithDeterministicFallback(
    'Firmware Update 1.0.4 Released',
    'A minor stability patch is rolling out to fix Bluetooth pairing issues.',
    'OEM Forum'
  );

  assert.equal(result.headline, 'Firmware Update 1.0.4 Released');
  assert.equal(result.paragraphs.length, 2);
  assert.ok(result.leadSummary.includes('Firmware Update 1.0.4 Released'));
  assert.ok(result.bullets.length >= 2);
});
