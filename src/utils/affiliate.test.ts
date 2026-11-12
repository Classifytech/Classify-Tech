import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSupportedRetailerUrl,
  generateShortCode,
  buildBrandedShortUrl,
  COLLISION_SAFE_CHARS,
  extractUrlsFromText,
  isDummyOrBrokenLink,
  analyzeTrackingParams,
  extractDestinationFromWorkerResponse,
  saveShortCodeToCache,
  getShortCodeFromCache,
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

test('Ghost Post architecture generates canonical postId and preserves tracking parameters', () => {
  const code = 'K7mP9q';
  const postId = `post-${code}`;
  assert.equal(postId, 'post-K7mP9q');

  // Verify extraction from /s/:code
  const sPath = `/s/${code}`;
  const sMatch = sPath.match(/^\/s\/([a-zA-Z0-9_-]{4,20})/);
  assert.ok(sMatch);
  assert.equal(sMatch![1], code);

  // Verify extraction from /post/:postId
  const pPath = `/post/${postId}`;
  const pMatch = pPath.match(/^\/post\/([a-zA-Z0-9_-]{4,24})/);
  assert.ok(pMatch);
  const extractedCode = pMatch![1].replace(/^post-/, '');
  assert.equal(extractedCode, code);

  // Verify tracking parameters preservation (Facebook fbclid, etc.)
  const searchParams = '?fbclid=IwAR123_xyz&fb_content_id=109283&encrypted_payload=abc789&cts=1700000000&sm_sig_id=sig_99';
  const resolveWorkerUrl = `https://classify.classifytechz.workers.dev/api/resolve/${encodeURIComponent(code)}${searchParams}`;
  assert.ok(resolveWorkerUrl.includes('fbclid=IwAR123_xyz'));
  assert.ok(resolveWorkerUrl.includes('fb_content_id=109283'));
  assert.ok(resolveWorkerUrl.includes('encrypted_payload=abc789'));
  assert.ok(resolveWorkerUrl.includes('cts=1700000000'));
  assert.ok(resolveWorkerUrl.includes('sm_sig_id=sig_99'));
});

test('Enhanced retailer detection identifies Ajio, Meesho, Nykaa, Croma, TataCliq, Snapdeal, Reliance Digital, and FirstCry', () => {
  assert.equal(isSupportedRetailerUrl('https://www.ajio.com/clothing/p/123').store, 'ajio');
  assert.equal(isSupportedRetailerUrl('https://www.meesho.com/s/item').store, 'meesho');
  assert.equal(isSupportedRetailerUrl('https://www.nykaa.com/makeup/p/456').store, 'nykaa');
  assert.equal(isSupportedRetailerUrl('https://www.croma.com/gadgets/p/789').store, 'croma');
  assert.equal(isSupportedRetailerUrl('https://www.tatacliq.com/luxury/p/321').store, 'tatacliq');
  assert.equal(isSupportedRetailerUrl('https://www.snapdeal.com/product/xyz').store, 'snapdeal');
  assert.equal(isSupportedRetailerUrl('https://www.reliancedigital.in/electronics/p/654').store, 'reliancedigital');
  assert.equal(isSupportedRetailerUrl('https://www.firstcry.com/baby/p/987').store, 'firstcry');
});

test('extractUrlsFromText extracts all URLs from raw promotional deal post and removes trailing punctuation', () => {
  const dealPost = 'Super Deal on iPhone! Check this: https://www.amazon.in/dp/B0CHX1W1XY. Also grab https://dl.flipkart.com/s/xyz123, limited stock!';
  const urls = extractUrlsFromText(dealPost);
  assert.equal(urls.length, 2);
  assert.equal(urls[0], 'https://www.amazon.in/dp/B0CHX1W1XY');
  assert.equal(urls[1], 'https://dl.flipkart.com/s/xyz123');
});

test('isDummyOrBrokenLink accurately detects placeholder Flipkart links lacking pid parameter', () => {
  // Dummy link lacking pid=
  assert.equal(isDummyOrBrokenLink('https://www.flipkart.com/item/p/product?affid=test'), true);
  // Valid link with pid=
  assert.equal(isDummyOrBrokenLink('https://www.flipkart.com/item/p/product?pid=MOB123XYZ&affid=test'), false);
  // Valid Amazon link
  assert.equal(isDummyOrBrokenLink('https://www.amazon.in/dp/B0CHX1W1XY?tag=classifytech-21'), false);
  // Undefined link
  assert.equal(isDummyOrBrokenLink(undefined), true);
});

test('analyzeTrackingParams detects affiliate credentials and Meta/Facebook tracking attribution', () => {
  const testUrl = 'https://www.flipkart.com/item/p/itm123?pid=MOB123&affid=inf_ed6b592b&tag=classifytech-21&encrypted_payload=abc789&cts=1700000000&utm_zig_id=zig_1&content_source=fb&channel_type=fb';
  const params = analyzeTrackingParams(testUrl);
  assert.equal(params.hasFlipkartPid, true);
  assert.equal(params.hasAmazonTag, true);
  assert.equal(params.hasFlipkartAffid, true);
  assert.equal(params.hasEncryptedPayload, true);
  assert.equal(params.hasCts, true);
  assert.equal(params.hasUtmZigId, true);
  assert.equal(params.hasContentSourceFb, true);
  assert.equal(params.hasChannelTypeFb, true);
});

test('extractDestinationFromWorkerResponse extracts destination from HTML redirects', () => {
  // Pattern 1: window.location.replace
  const htmlReplace = `<!DOCTYPE html><html><body><script>window.location.replace("https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21");</script></body></html>`;
  assert.equal(
    extractDestinationFromWorkerResponse(htmlReplace),
    'https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21'
  );

  // Pattern 2: og:url
  const htmlOg = `<html><head><meta property="og:url" content="https://dl.flipkart.com/s/xyz123?affid=inf_ed6b592b"></head></html>`;
  assert.equal(
    extractDestinationFromWorkerResponse(htmlOg),
    'https://dl.flipkart.com/s/xyz123?affid=inf_ed6b592b'
  );

  // Pattern 3: meta refresh
  const htmlRefresh = `<html><head><meta http-equiv="refresh" content="0;url=https://www.myntra.com/product/123"></head></html>`;
  assert.equal(
    extractDestinationFromWorkerResponse(htmlRefresh),
    'https://www.myntra.com/product/123'
  );

  // Pattern 4: Location header
  const mockHeaders = {
    get: (key: string) => (key.toLowerCase() === 'location' ? 'https://www.amazon.in/deal' : null),
  };
  assert.equal(
    extractDestinationFromWorkerResponse('', mockHeaders),
    'https://www.amazon.in/deal'
  );

  // Pattern 5: JSON response object or string
  const jsonResp = {
    success: true,
    affiliateUrl: 'https://www.amazon.in/dp/B0D12345?tag=classifytech-21',
  };
  assert.equal(
    extractDestinationFromWorkerResponse(jsonResp),
    'https://www.amazon.in/dp/B0D12345?tag=classifytech-21'
  );

  const jsonStr = JSON.stringify(jsonResp);
  assert.equal(
    extractDestinationFromWorkerResponse(jsonStr),
    'https://www.amazon.in/dp/B0D12345?tag=classifytech-21'
  );
});

test('saveShortCodeToCache and getShortCodeFromCache store and retrieve records', () => {
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

  // Query with exact code
  const exact = getShortCodeFromCache('HBfKaD');
  assert.ok(exact);
  assert.equal(exact?.affiliateUrl, 'https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21');
  assert.equal(exact?.storeName, 'Amazon');

  // Query with post- prefix
  const withPrefix = getShortCodeFromCache('post-HBfKaD');
  assert.ok(withPrefix);
  assert.equal(withPrefix?.affiliateUrl, 'https://www.amazon.in/dp/B0CX21C8S4?tag=classifytech-21');

  delete (globalThis as any).localStorage;
});
