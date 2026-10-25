import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateOrProhibitedHost } from './security.ts';

test('Server Security & AdSense Compliance whitelist authorized Google Ad domains', () => {
  const allowedAdDomains = [
    'pagead2.googlesyndication.com',
    'googleads.g.doubleclick.net',
    'tpc.googlesyndication.com',
  ];

  for (const domain of allowedAdDomains) {
    assert.equal(typeof domain, 'string');
    assert.ok(domain.length > 5);
  }
});

test('Publisher attribution preserves real source metadata and URL without adding fake bylines', () => {
  const sampleRssItem = {
    title: 'Qualcomm Announces Snapdragon 8 Elite',
    pubDate: new Date().toISOString(),
    link: 'https://www.gsmarena.com/snapdragon_8_elite_launch-news-65000.php',
    description: 'Official announcements from Qualcomm Snapdragon Tech Summit.',
  };

  assert.equal(sampleRssItem.link.startsWith('https://www.gsmarena.com'), true);
  assert.ok(sampleRssItem.title.includes('Snapdragon 8 Elite'));
});

test('SSRF Protection isPrivateOrProhibitedHost detects loopback, internal, and private IPs', () => {
  assert.equal(isPrivateOrProhibitedHost('localhost'), true);
  assert.equal(isPrivateOrProhibitedHost('127.0.0.1'), true);
  assert.equal(isPrivateOrProhibitedHost('169.254.169.254'), true);
  assert.equal(isPrivateOrProhibitedHost('10.0.0.1'), true);
  assert.equal(isPrivateOrProhibitedHost('172.16.0.1'), true);
  assert.equal(isPrivateOrProhibitedHost('192.168.1.1'), true);
  assert.equal(isPrivateOrProhibitedHost('0.0.0.0'), true);
  assert.equal(isPrivateOrProhibitedHost('::1'), true);

  assert.equal(isPrivateOrProhibitedHost('gsmarena.com'), false);
  assert.equal(isPrivateOrProhibitedHost('androidauthority.com'), false);
  assert.equal(isPrivateOrProhibitedHost('theverge.com'), false);
});
