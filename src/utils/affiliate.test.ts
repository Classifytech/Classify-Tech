import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSupportedRetailerUrl,
  generateShortCode,
  buildBrandedShortUrl,
  extractGhostPostFromLocation,
  COLLISION_SAFE_CHARS,
  extractUrlsFromText,
  isDummyOrBrokenLink,
  analyzeTrackingParams,
  extractDestinationFromWorkerResponse,
  saveShortCodeToCache,
  getShortCodeFromCache,
} from './affiliate.ts';

test('Retailer validation strictly accepts ONLY Amazon, Flipkart, and Myntra', () => {
  // Amazon (amazon.in, amazon.com, amzn.in, amzn.to, a.co)
  assert.equal(isSupportedRetailerUrl('https://www.amazon.in/dp/B0D12345').valid, true);
  assert.equal(isSupportedRetailerUrl('https://amazon.com/product/123').valid, true);
  assert.equal(isSupportedRetailerUrl('https://amzn.in/d/abc').valid, true);
  assert.equal(isSupportedRetailerUrl('https://amzn.to/3xyz').valid, true);
  assert.equal(isSupportedRetailerUrl('https://a.co/d/9xyz').store, 'amazon');

  // Flipkart (flipkart.com, dl.flipkart.com, fkrt.it, fkrt.cc, fkrt.co)
  assert.equal(isSupportedRetailerUrl('https://www.flipkart.com/item/p/123').valid, true);
  assert.equal(isSupportedRetailerUrl('https://dl.flipkart.com/s/xyz123').valid, true);
  assert.equal(isSupportedRetailerUrl('https://fkrt.it/p99').store, 'flipkart');
  assert.equal(isSupportedRetailerUrl('https://fkrt.cc/abc12').store, 'flipkart');
  assert.equal(isSupportedRetailerUrl('https://fkrt.co/xyz').store, 'flipkart');

  // Myntra (myntra.com, myntr.it, myntr.in)
  assert.equal(isSupportedRetailerUrl('https://www.myntra.com/product/123').valid, true);
  assert.equal(isSupportedRetailerUrl('https://myntr.it/shoe').store, 'myntra');
  assert.equal(isSupportedRetailerUrl('https://myntr.in/shirt').store, 'myntra');
});

test('Retailer validation strictly rejects unsupported stores (Ajio, Meesho, Nykaa, etc.) and unsafe schemes', () => {
  const unsupportedStores = [
    'https://www.ajio.com/clothing/p/123',
    'https://www.meesho.com/s/item',
    'https://www.nykaa.com/makeup/p/456',
    'https://www.croma.com/gadgets/p/789',
    'https://www.tatacliq.com/luxury/p/321',
    'https://www.snapdeal.com/product/xyz',
    'https://www.reliancedigital.in/electronics/p/654',
    'https://www.firstcry.com/baby/p/987',
    'https://google.com',
    'https://customstore.in/item',
  ];

  for (const url of unsupportedStores) {
    const res = isSupportedRetailerUrl(url);
    assert.equal(res.valid, false, `Expected ${url} to be rejected`);
  }

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

  const liveUrl = buildBrandedShortUrl(code, 'https://classifytech.ai.studio');
  assert.equal(liveUrl, 'https://classifytech.ai.studio/s/Ab9Xy2');
  assert.ok(!liveUrl.includes('workers.dev'));
  assert.ok(!liveUrl.includes(':3000'));

  const relUrl = buildBrandedShortUrl(code);
  assert.equal(relUrl, '/s/Ab9Xy2');
});

test('extractGhostPostFromLocation captures shortCode accurately across /s/:code, /post/:id, query, and hash', () => {
  assert.deepEqual(extractGhostPostFromLocation('/s/K7mP9q'), { code: 'K7mP9q', postId: 'post-K7mP9q' });
  assert.deepEqual(extractGhostPostFromLocation('/s/K7mP9q/'), { code: 'K7mP9q', postId: 'post-K7mP9q' });
  assert.deepEqual(extractGhostPostFromLocation('/post/post-K7mP9q'), { code: 'K7mP9q', postId: 'post-K7mP9q' });
  assert.deepEqual(extractGhostPostFromLocation('/', '?code=K7mP9q'), { code: 'K7mP9q', postId: 'post-K7mP9q' });
  assert.deepEqual(extractGhostPostFromLocation('/', '?s=K7mP9q'), { code: 'K7mP9q', postId: 'post-K7mP9q' });
  assert.deepEqual(extractGhostPostFromLocation('/', '', '#/s/K7mP9q'), { code: 'K7mP9q', postId: 'post-K7mP9q' });
  assert.equal(extractGhostPostFromLocation('/'), null);
});

test('extractUrlsFromText extracts all URLs from raw promotional deal post and removes trailing punctuation', () => {
  const dealPost = 'Super Deal on iPhone! Check this: https://www.amazon.in/dp/B0CHX1W1XY. Also grab https://dl.flipkart.com/s/xyz123, limited stock!';
  const urls = extractUrlsFromText(dealPost);
  assert.equal(urls.length, 2);
  assert.equal(urls[0], 'https://www.amazon.in/dp/B0CHX1W1XY');
  assert.equal(urls[1], 'https://dl.flipkart.com/s/xyz123');
});

test('isDummyOrBrokenLink accurately detects placeholder Flipkart links lacking pid parameter', () => {
  assert.equal(isDummyOrBrokenLink('https://www.flipkart.com/item/p/product?affid=test'), true);
  assert.equal(isDummyOrBrokenLink('https://www.flipkart.com/item/p/product?pid=MOB123XYZ&affid=test'), false);
  assert.equal(isDummyOrBrokenLink('https://www.amazon.in/dp/B0CHX1W1XY?tag=classifytech-21'), false);
  assert.equal(isDummyOrBrokenLink(undefined), true);
});

test('analyzeTrackingParams detects affiliate credentials and Meta/Facebook tracking attribution untouched', () => {
  const testUrl =
    'https://www.flipkart.com/item/p/itm123?pid=MOB123&affid=inf_ed6b592b-00d1-46f4-bdb7-6aa275ecb425&affiliate_id=5bp2vHe2zIpgR54z&encrypted_payload=abc789&cts=1700000000&utm_zig_id=zig_1&content_source=fb&channel_type=fb';
  const params = analyzeTrackingParams(testUrl);
  assert.equal(params.hasFlipkartPid, true);
  assert.equal(params.hasFlipkartAffid, true);
  assert.equal(params.hasMyntraAffiliateId, true);
  assert.equal(params.hasEncryptedPayload, true);
  assert.equal(params.hasCts, true);
  assert.equal(params.hasUtmZigId, true);
  assert.equal(params.hasContentSourceFb, true);
  assert.equal(params.hasChannelTypeFb, true);
});

test('extractDestinationFromWorkerResponse preserves Worker affiliateUrl untouched with tag=classifytech-21 at the end', () => {
  const workerJson = {
    success: true,
    shortCode: 'HBfKaD',
    resolvedUrl: 'https://www.amazon.in/dp/B0CX21C8S4',
    affiliateUrl: 'https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21',
    store: 'amazon',
  };
  const extracted = extractDestinationFromWorkerResponse(workerJson);
  assert.equal(extracted, 'https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21');
  assert.ok(extracted?.endsWith('tag=classifytech-21'));

  const htmlReplace = `<!DOCTYPE html><html><body><script>window.location.replace("https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21");</script></body></html>`;
  assert.equal(
    extractDestinationFromWorkerResponse(htmlReplace),
    'https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21'
  );
});

test('saveShortCodeToCache and getShortCodeFromCache store and retrieve records cleanly', () => {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k in store) delete store[k];
    },
  };

  saveShortCodeToCache({
    code: 'HBfKaD',
    affiliateUrl: 'https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21',
    store: 'amazon',
    storeName: 'Amazon',
  });

  const exact = getShortCodeFromCache('HBfKaD');
  assert.ok(exact);
  assert.equal(exact?.affiliateUrl, 'https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21');
  assert.equal(exact?.storeName, 'Amazon');

  const withPrefix = getShortCodeFromCache('post-HBfKaD');
  assert.ok(withPrefix);
  assert.equal(withPrefix?.affiliateUrl, 'https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21');

  delete (globalThis as any).localStorage;
});
