import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectStore,
  isShortLink,
  convertToAffiliateUrl,
  convertNormalUrlToMyAffiliate,
  generateQuickStealthUrl,
  createStealthRedirectUrl,
  calculatePercent,
  AMAZON_TAG,
  FLIPKART_ID,
  CUSTOM_SHORT_DOMAIN,
  addToAffiliateHistory,
  isAllowedRetailerHost,
  validateAndProcessAffiliateUrl,
  generateShortCode,
  buildShortUrl,
} from './affiliate.ts';

test('Configurable short domain does not hardcode unowned domain', () => {
  assert.equal(AMAZON_TAG, 'classifytech-21');
  assert.equal(FLIPKART_ID, 'inf_ed6b592b-00d1-46f4-bdb7-6aa275ecb425');
  assert.notEqual(CUSTOM_SHORT_DOMAIN, 'https://classifytech.com');
});

test('detectStore correctly classifies Flipkart and Amazon URLs', () => {
  const fk = detectStore('https://www.flipkart.com/poco-x6-pro-5g/p/itm12345');
  assert.equal(fk.param, 'flipkart');
  assert.equal(fk.isSupported, true);

  const amz = detectStore('https://www.amazon.in/dp/B0CX21345');
  assert.equal(amz.param, 'amazon');
  assert.equal(amz.isSupported, true);

  const other = detectStore('https://example.com/product');
  assert.equal(other.param, 'go');
});

test('isShortLink detects Amazon and Flipkart short links', () => {
  assert.equal(isShortLink('https://amzn.to/3xyz'), true);
  assert.equal(isShortLink('https://amzn.in/d/abc'), true);
  assert.equal(isShortLink('https://fkrt.it/9812'), true);
  assert.equal(isShortLink('https://www.amazon.in/dp/B0CX'), false);
  assert.equal(isShortLink('https://www.flipkart.com/item'), false);
});

test('convertNormalUrlToMyAffiliate appends correct affiliate parameters for Amazon', () => {
  const amzUrl = 'https://www.amazon.in/POCO-X6-Pro-5G-Racing/dp/B0CX21345?ref=xyz';
  const monetized = convertNormalUrlToMyAffiliate(amzUrl);
  assert.ok(monetized.includes('tag=classifytech-21'));
  assert.ok(monetized.includes('linkCode=ll1'));
});

test('convertNormalUrlToMyAffiliate appends correct affiliate parameters for Flipkart', () => {
  const fkUrl = 'https://www.flipkart.com/poco-x6-pro-5g-racing-grey-512-gb/p/itm12345';
  const monetized = convertNormalUrlToMyAffiliate(fkUrl);
  assert.ok(monetized.includes('affid=inf_ed6b592b-00d1-46f4-bdb7-6aa275ecb425'));
});

test('convertNormalUrlToMyAffiliate flags shortlinks with SHORTLINK_ERROR', () => {
  assert.equal(convertNormalUrlToMyAffiliate('https://amzn.to/3xyz'), 'SHORTLINK_ERROR');
  assert.equal(convertNormalUrlToMyAffiliate('https://fkrt.it/9912'), 'SHORTLINK_ERROR');
});

test('generateQuickStealthUrl creates base64 URL with ?flipkart= or ?amazon=', () => {
  const fkRes = generateQuickStealthUrl(
    'https://www.flipkart.com/item/p/123',
    'https://classifytech.com'
  );
  assert.ok(fkRes.finalUrl.startsWith('https://classifytech.com?flipkart='));
  assert.equal(fkRes.storeParam, 'flipkart');

  const amzRes = generateQuickStealthUrl(
    'https://www.amazon.in/dp/B0CX21345',
    'https://classifytech.com'
  );
  assert.ok(amzRes.finalUrl.startsWith('https://classifytech.com?amazon='));
  assert.equal(amzRes.storeParam, 'amazon');
});

test('calculatePercent clamps correctly between 0 and 100', () => {
  assert.equal(calculatePercent(1500000, 2000000), 75);
  assert.equal(calculatePercent(0, 100), 0);
  assert.equal(calculatePercent(250, 100), 100);
});

test('addToAffiliateHistory prepends items and caps to last 5', () => {
  let history: any[] = [];
  for (let i = 1; i <= 7; i++) {
    history = addToAffiliateHistory(
      {
        originalUrl: `https://www.flipkart.com/item-${i}`,
        finalUrl: `https://classifytech.com?flipkart=b64_${i}`,
        monetizedUrl: `https://www.flipkart.com/item-${i}?affid=123`,
        store: 'flipkart',
        label: 'Flipkart Verified Link',
      },
      history,
      5
    );
  }

  assert.equal(history.length, 5);
  assert.equal(history[0].originalUrl, 'https://www.flipkart.com/item-7');
  assert.equal(history[4].originalUrl, 'https://www.flipkart.com/item-3');

  // Test deduplication: re-adding item-4 should move it to index 0
  history = addToAffiliateHistory(
    {
      originalUrl: 'https://www.flipkart.com/item-4',
      finalUrl: 'https://classifytech.com?flipkart=b64_4',
      monetizedUrl: 'https://www.flipkart.com/item-4?affid=123',
      store: 'flipkart',
      label: 'Flipkart Verified Link',
    },
    history,
    5
  );

  assert.equal(history.length, 5);
  assert.equal(history[0].originalUrl, 'https://www.flipkart.com/item-4');
});

test('isAllowedRetailerHost accepts Amazon, Flipkart, Myntra, Meesho and rejects others', () => {
  assert.equal(isAllowedRetailerHost('www.amazon.in').allowed, true);
  assert.equal(isAllowedRetailerHost('amzn.to').allowed, true);
  assert.equal(isAllowedRetailerHost('amzn.in').allowed, true);
  assert.equal(isAllowedRetailerHost('www.flipkart.com').allowed, true);
  assert.equal(isAllowedRetailerHost('fkrt.it').allowed, true);
  assert.equal(isAllowedRetailerHost('www.myntra.com').allowed, true);
  assert.equal(isAllowedRetailerHost('myntra.com').allowed, true);
  assert.equal(isAllowedRetailerHost('www.meesho.com').allowed, true);
  assert.equal(isAllowedRetailerHost('meesho.com').allowed, true);

  // Reject malicious/unsupported hosts
  assert.equal(isAllowedRetailerHost('evil.com').allowed, false);
  assert.equal(isAllowedRetailerHost('google.com').allowed, false);
  assert.equal(isAllowedRetailerHost('amazon.com.phishing.io').allowed, false);
});

test('validateAndProcessAffiliateUrl handles Amazon India correctly', () => {
  // Plain link: preserves original link without silently injecting foreign tags
  const res1 = validateAndProcessAffiliateUrl('https://www.amazon.in/dp/B0CX21345');
  assert.equal(res1.isValid, true);
  assert.equal(res1.store, 'amazon');
  assert.equal(res1.hasTracking, false);

  // Existing affiliate link: preserves user's original affiliate tag exactly
  const res2 = validateAndProcessAffiliateUrl('https://www.amazon.in/dp/B0CX21345?tag=partner-21&ref=xyz');
  assert.equal(res2.isValid, true);
  assert.ok(res2.affiliateUrl?.includes('tag=partner-21'));
  assert.equal(res2.hasTracking, true);
});

test('validateAndProcessAffiliateUrl handles Flipkart correctly', () => {
  // Plain link: preserves original link without injecting foreign affid
  const res1 = validateAndProcessAffiliateUrl('https://www.flipkart.com/poco-x6-pro/p/itm12345');
  assert.equal(res1.isValid, true);
  assert.equal(res1.store, 'flipkart');
  assert.equal(res1.hasTracking, false);

  // Existing affiliate link: preserves user's original affid exactly
  const res2 = validateAndProcessAffiliateUrl('https://www.flipkart.com/product/p/123?affid=mycustomaffid');
  assert.equal(res2.isValid, true);
  assert.ok(res2.affiliateUrl?.includes('affid=mycustomaffid'));
  assert.equal(res2.hasTracking, true);
});

test('validateAndProcessAffiliateUrl handles Myntra and Meesho with tracking preservation', () => {
  // Myntra with affiliate tracking
  const myntraAff = validateAndProcessAffiliateUrl('https://www.myntra.com/shoes/nike?affiliateId=1234&utm_source=aff');
  assert.equal(myntraAff.isValid, true);
  assert.equal(myntraAff.store, 'myntra');
  assert.equal(myntraAff.hasTracking, true);
  assert.ok(myntraAff.affiliateUrl?.includes('affiliateId=1234'));

  // Meesho with referral tracking
  const meeshoAff = validateAndProcessAffiliateUrl('https://www.meesho.com/s/p/abc?ref=partner99');
  assert.equal(meeshoAff.isValid, true);
  assert.equal(meeshoAff.store, 'meesho');
  assert.equal(meeshoAff.hasTracking, true);
  assert.ok(meeshoAff.affiliateUrl?.includes('ref=partner99'));

  // Plain Myntra without tracking
  const myntraPlain = validateAndProcessAffiliateUrl('https://www.myntra.com/tshirts/puma');
  assert.equal(myntraPlain.isValid, true);
  assert.equal(myntraPlain.hasTracking, false);
});

test('generateShortCode produces clean 6-character alphanumeric string', () => {
  const code = generateShortCode(6);
  assert.equal(code.length, 6);
  assert.match(code, /^[a-zA-Z0-9]{6}$/);

  // Uniqueness across multiple calls
  const set = new Set();
  for (let i = 0; i < 50; i++) {
    set.add(generateShortCode(6));
  }
  assert.equal(set.size, 50);
});

test('buildShortUrl formats relative link, configurable domain, and live origin', () => {
  const urlDefault = buildShortUrl('aB12xY');
  assert.equal(urlDefault, '/s/aB12xY');

  const urlCustom = buildShortUrl('aB12xY', 'https://verified-domain.com');
  assert.equal(urlCustom, 'https://verified-domain.com/s/aB12xY');

  // Live origin auto-detection simulation
  (globalThis as any).window = { location: { origin: 'https://classifytech.netlify.app' } };
  const urlLive = buildShortUrl('aB12xY');
  assert.equal(urlLive, 'https://classifytech.netlify.app/s/aB12xY');
  delete (globalThis as any).window;
});

test('createStealthRedirectUrl generates valid clickable redirect preserving user affiliate tag', () => {
  const origin = 'https://classifytech.netlify.app';
  const target = 'https://www.amazon.in/dp/B0CX123?tag=user-aff-21';
  const stealth = createStealthRedirectUrl(origin, target, 'amazon');
  assert.ok(stealth.startsWith('https://classifytech.netlify.app?amazon='));
  assert.ok(!stealth.includes(' '));
});
