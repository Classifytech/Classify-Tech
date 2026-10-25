import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateOrProhibitedHost } from './security.ts';

test('SSRF Protection - isPrivateOrProhibitedHost comprehensive check', () => {
  // IPv4 Private/Reserved
  assert.equal(isPrivateOrProhibitedHost('127.0.0.1'), true, 'IPv4 loopback');
  assert.equal(isPrivateOrProhibitedHost('10.255.255.255'), true, 'IPv4 10.0.0.0/8');
  assert.equal(isPrivateOrProhibitedHost('172.16.0.0'), true, 'IPv4 172.16.0.0/12');
  assert.equal(isPrivateOrProhibitedHost('192.168.1.1'), true, 'IPv4 192.168.0.0/16');
  assert.equal(isPrivateOrProhibitedHost('169.254.169.254'), true, 'IPv4 link-local');
  assert.equal(isPrivateOrProhibitedHost('0.0.0.0'), true, 'IPv4 zero address');
  assert.equal(isPrivateOrProhibitedHost('224.0.0.1'), true, 'IPv4 multicast');
  assert.equal(isPrivateOrProhibitedHost('240.0.0.1'), true, 'IPv4 reserved');

  // IPv6 Loopback / Local
  assert.equal(isPrivateOrProhibitedHost('::1'), true, 'IPv6 loopback');
  assert.equal(isPrivateOrProhibitedHost('fe80::1'), true, 'IPv6 link-local');
  assert.equal(isPrivateOrProhibitedHost('fc00::'), true, 'IPv6 unique local');
  assert.equal(isPrivateOrProhibitedHost('fd00::'), true, 'IPv6 unique local');

  // IPv4-mapped IPv6
  assert.equal(isPrivateOrProhibitedHost('::ffff:127.0.0.1'), true, 'IPv4-mapped IPv6 loopback');
  assert.equal(isPrivateOrProhibitedHost('::ffff:169.254.169.254'), true, 'IPv4-mapped IPv6 metadata');
  assert.equal(isPrivateOrProhibitedHost('::ffff:192.168.0.1'), true, 'IPv4-mapped IPv6 private');

  // Deceptive / Malformed
  assert.equal(isPrivateOrProhibitedHost('127.0.0.1.xip.io'), true, 'DNS rebinding attempt via xip.io style');
  assert.equal(isPrivateOrProhibitedHost('0.0.0.0'), true, 'Zero address');
  assert.equal(isPrivateOrProhibitedHost('256.256.256.256'), true, 'Malformed IPv4 literal (out of range)');
  assert.equal(isPrivateOrProhibitedHost('::'), true, 'IPv6 any address');

  // Hostnames
  assert.equal(isPrivateOrProhibitedHost('localhost'), true, 'localhost');
  assert.equal(isPrivateOrProhibitedHost('foo.localhost'), true, 'sub.localhost');
  assert.equal(isPrivateOrProhibitedHost('host.docker.internal'), true, 'docker internal');
  assert.equal(isPrivateOrProhibitedHost('metadata.google.internal'), true, 'google internal');
  assert.equal(isPrivateOrProhibitedHost('server.local'), true, 'mDNS .local');

  // Legitimate
  assert.equal(isPrivateOrProhibitedHost('www.gsmarena.com'), false, 'Legitimate domain');
  assert.equal(isPrivateOrProhibitedHost('androidauthority.com'), false, 'Legitimate domain');
  assert.equal(isPrivateOrProhibitedHost('8.8.8.8'), false, 'Public IP (Google DNS)');
  assert.equal(isPrivateOrProhibitedHost('1.1.1.1'), false, 'Public IP (Cloudflare)');
});

test('SSRF Protection - Deceptive Hostnames', () => {
  // These should be blocked if they resolve to private IPs, 
  // but isPrivateOrProhibitedHost (string check) blocks obvious local/reserved patterns.
  assert.equal(isPrivateOrProhibitedHost('localhost.example.com'), false, 'Technically a public domain unless it matches reserved suffixes');
  assert.equal(isPrivateOrProhibitedHost('127.0.0.1.nip.io'), true, 'Common DNS rebinding pattern');
});
