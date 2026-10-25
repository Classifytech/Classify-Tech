import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSupportedRetailerUrl,
  generateShortCode,
  buildBrandedShortUrl,
  COLLISION_SAFE_CHARS,
} from './affiliate.ts';

test('Retailer validation accepts any valid HTTP/HTTPS product link and detects stores', () => {
  // Amazon
  assert.equal(isSupportedRetailerUrl('https://www.amazon.in/dp/B0D12345').valid, true);
  assert.equal(isSupportedRetailerUrl('https://amzn.to/3xyz').valid, true);
  assert.equal(isSupportedRetailerUrl('https://amzn.in/d/abc').valid, true);
  assert.equal(isSupportedRetailerUrl('https://amazon.com/product/123').valid, true);
  assert.equal(isSupportedRetailerUrl('https://link.amazon/xyz123').valid, true);
  assert.equal(isSupportedRetailerUrl('https://link.amazon/xyz123').store, 'amazon');

  // Flipkart
  assert.equal(isSupportedRetailerUrl('https://www.flipkart.com/item/p/123').valid, true);
  assert.equal(isSupportedRetailerUrl('https://dl.flipkart.com/s/xyz123').valid, true);
  assert.equal(isSupportedRetailerUrl('https://fkrt.it/p99').valid, true);
  assert.equal(isSupportedRetailerUrl('https://fkrt.it/p99').store, 'flipkart');

  // Myntra
  assert.equal(isSupportedRetailerUrl('https://www.myntra.com/product/123').valid, true);
  assert.equal(isSupportedRetailerUrl('https://myntr.it/shoe').valid, true);
  assert.equal(isSupportedRetailerUrl('https://myntr.it/shoe').store, 'myntra');

  // Any other valid HTTP/HTTPS URL is accepted to push to Cloudflare
  assert.equal(isSupportedRetailerUrl('https://google.com').valid, true);
  assert.equal(isSupportedRetailerUrl('https://customstore.in/item').valid, true);
});

test('Retailer validation strictly blocks unsafe schemes and malicious URLs', () => {
  assert.equal(isSupportedRetailerUrl('javascript:alert(1)').valid, false);
  assert.equal(isSupportedRetailerUrl('data:text/html,<script>evil()</script>').valid, false);
  assert.equal(isSupportedRetailerUrl('vbscript:msgbox').valid, false);
  assert.equal(isSupportedRetailerUrl('file:///etc/passwd').valid, false);
});

test('generateShortCode generates 6-character collision-safe alphanumeric code', () => {
  const code = generateShortCode(6);
  assert.equal(code.length, 6);
  for (const ch of code) {
    assert.ok(COLLISION_SAFE_CHARS.includes(ch), `Character ${ch} must be in collision safe character set`);
  }
});

test('buildBrandedShortUrl dynamically uses origin without hardcoded ports or workers.dev', () => {
  const code = 'Ab9Xy2';
  
  // With custom live domain origin
  const liveUrl = buildBrandedShortUrl(code, 'https://classifytech.ai.studio');
  assert.equal(liveUrl, 'https://classifytech.ai.studio/s/Ab9Xy2');
  assert.ok(!liveUrl.includes('workers.dev'));
  assert.ok(!liveUrl.includes(':3000'));

  // Relative fallback when origin not supplied in node
  const relUrl = buildBrandedShortUrl(code);
  assert.equal(relUrl, '/s/Ab9Xy2');
});
