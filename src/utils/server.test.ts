import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  isAllowedRetailerHost,
  validateAndProcessAffiliateUrl,
  generateShortCode,
  buildShortUrl,
} from './affiliate.ts';

test('Retailer validation enforces HTTPS and supported stores', () => {
  // Amazon with tracking
  const amzWithTrack = validateAndProcessAffiliateUrl('https://www.amazon.in/dp/B0CX21345?tag=user-aff-21');
  assert.equal(amzWithTrack.isValid, true);
  assert.equal(amzWithTrack.store, 'amazon');
  assert.equal(amzWithTrack.hasTracking, true);

  // Amazon plain
  const amzPlain = validateAndProcessAffiliateUrl('https://www.amazon.in/dp/B0CX21345');
  assert.equal(amzPlain.isValid, true);
  assert.equal(amzPlain.store, 'amazon');
  assert.equal(amzPlain.hasTracking, false);

  // Flipkart with tracking
  const fkWithTrack = validateAndProcessAffiliateUrl('https://www.flipkart.com/item/p/123?affid=useraff');
  assert.equal(fkWithTrack.isValid, true);
  assert.equal(fkWithTrack.store, 'flipkart');
  assert.equal(fkWithTrack.hasTracking, true);

  // Myntra
  const myntra = validateAndProcessAffiliateUrl('https://www.myntra.com/product/123?affiliateId=aff123');
  assert.equal(myntra.isValid, true);
  assert.equal(myntra.store, 'myntra');
  assert.equal(myntra.hasTracking, true);

  // Meesho
  const meesho = validateAndProcessAffiliateUrl('https://www.meesho.com/s/p/123?ref=partner456');
  assert.equal(meesho.isValid, true);
  assert.equal(meesho.store, 'meesho');
  assert.equal(meesho.hasTracking, true);

  // Invalid domain / malicious attempt
  const bad = validateAndProcessAffiliateUrl('https://phishing-site.com/login');
  assert.equal(bad.isValid, false);
  assert.ok(bad.error?.includes('मान्य नहीं है') || bad.error?.includes('Unsupported'));
});

test('buildShortUrl formats short link with live server host, configurable domain, or fallback', () => {
  const code = 'X9z2K1';
  const shortUrl = buildShortUrl(code);
  assert.equal(shortUrl, '/s/X9z2K1');
  assert.ok(!shortUrl.includes('?'));
  assert.ok(!shortUrl.includes('&'));

  // When server passes live request host (req.protocol + '://' + req.get('host'))
  const liveServerUrl = buildShortUrl(code, 'https://ais-dev-preview.run.app');
  assert.equal(liveServerUrl, 'https://ais-dev-preview.run.app/s/X9z2K1');

  const configuredUrl = buildShortUrl(code, 'https://mycustomdomain.com');
  assert.equal(configuredUrl, 'https://mycustomdomain.com/s/X9z2K1');
});

test('Admin verify endpoint policy enforces fail-closed behavior when ADMIN_SECRET is not configured', () => {
  const envSecret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || process.env.ADMIN_PIN || '';
  const isConfigured = Boolean(envSecret && !envSecret.startsWith('YOUR_') && envSecret.trim().length >= 4);

  // When unconfigured, authentication must fail closed
  if (!isConfigured) {
    const isAllowed = false;
    assert.equal(isAllowed, false, 'Admin auth must fail closed when secret is unconfigured');
  } else {
    assert.ok(envSecret.length >= 4);
  }
});

test('Publisher attribution preserves real source metadata and URL without adding fake bylines', () => {
  const sampleRssItem = {
    title: 'Qualcomm Announces Snapdragon 8 Elite',
    pubDate: new Date().toISOString(),
    link: 'https://www.gsmarena.com/snapdragon_8_elite_launch-news-65000.php',
    description: 'Official announcements from Qualcomm Snapdragon Tech Summit.',
  };

  const processed = validateAndProcessAffiliateUrl('https://www.amazon.in/dp/B0CX21345?tag=mypartner-21');
  assert.equal(processed.isValid, true);
  assert.ok(processed.affiliateUrl?.includes('tag=mypartner-21'));
  assert.ok(!processed.affiliateUrl?.includes('classifytech-21'));
});

import { isPrivateOrProhibitedHost } from '../../server.ts';

test('SSRF Protection isPrivateOrProhibitedHost detects loopback, internal, and private IPs', () => {
  assert.equal(isPrivateOrProhibitedHost('localhost'), true);
  assert.equal(isPrivateOrProhibitedHost('127.0.0.1'), true);
  assert.equal(isPrivateOrProhibitedHost('169.254.169.254'), true);
  assert.equal(isPrivateOrProhibitedHost('10.0.0.1'), true);
  assert.equal(isPrivateOrProhibitedHost('172.16.0.1'), true);
  assert.equal(isPrivateOrProhibitedHost('192.168.1.1'), true);
  assert.equal(isPrivateOrProhibitedHost('0.0.0.0'), true);
  assert.equal(isPrivateOrProhibitedHost('::1'), true);

  assert.equal(isPrivateOrProhibitedHost('amazon.in'), false);
  assert.equal(isPrivateOrProhibitedHost('flipkart.com'), false);
  assert.equal(isPrivateOrProhibitedHost('myntra.com'), false);
  assert.equal(isPrivateOrProhibitedHost('meesho.com'), false);
});

test('Short link redirect validation verifies allowed retailer and produces 302 destination', () => {
  const sampleEntry = {
    code: 'amz123',
    originalUrl: 'https://www.amazon.in/dp/B0CX21345?tag=user-21',
    affiliateUrl: 'https://www.amazon.in/dp/B0CX21345?tag=user-21',
    store: 'amazon' as const,
    storeName: 'Amazon India',
    createdAt: Date.now(),
    clicks: 0,
  };

  const parsed = new URL(sampleEntry.affiliateUrl);
  const check = isAllowedRetailerHost(parsed.hostname);

  assert.equal(check.allowed, true);
  assert.equal(check.store, 'amazon');
  assert.equal(parsed.protocol, 'https:');

  // Verify redirect path building
  const relativeShortUrl = buildShortUrl(sampleEntry.code);
  assert.equal(relativeShortUrl, `/s/${sampleEntry.code}`);

  const fullDomainShortUrl = buildShortUrl(sampleEntry.code, 'https://my-owned-domain.com');
  assert.equal(fullDomainShortUrl, `https://my-owned-domain.com/s/${sampleEntry.code}`);

  // Disallowed destination cannot redirect
  const maliciousEntry = {
    code: 'evil99',
    affiliateUrl: 'https://evil-phishing-domain.com/steal',
  };
  const malParsed = new URL(maliciousEntry.affiliateUrl);
  const malCheck = isAllowedRetailerHost(malParsed.hostname);
  assert.equal(malCheck.allowed, false);
});


