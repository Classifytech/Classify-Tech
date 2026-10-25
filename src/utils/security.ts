/**
 * SSRF and Network Security Utilities for CLASSIFY TECH
 * Protects server-side RSS feeds, article content extraction, and outgoing requests.
 */

/**
 * Checks if a hostname or IP address resolves to loopback, link-local, private, or prohibited address space (SSRF protection).
 */
export function isPrivateOrProhibitedHost(hostname: string): boolean {
  if (!hostname || typeof hostname !== 'string') return true;
  const host = hostname.toLowerCase().trim();

  // Basic hostnames and local domains
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host === '::' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.test') ||
    host.endsWith('.invalid') ||
    host.endsWith('.example')
  ) {
    return true;
  }

  // Common DNS rebinding patterns (e.g. 127.0.0.1.nip.io, 127.0.0.1.xip.io)
  if (
    host.includes('127.0.0.1') ||
    host.includes('169.254') ||
    host.includes('10.') ||
    host.includes('192.168.')
  ) {
    if (host.endsWith('.nip.io') || host.endsWith('.xip.io') || host.endsWith('.sslip.io')) {
      return true;
    }
  }

  // IPv6 checks
  if (host.includes(':')) {
    if (
      host === '::1' ||
      host === '::' ||
      host.startsWith('fe80:') ||
      host.startsWith('fc00:') ||
      host.startsWith('fd00:') ||
      host.includes('::ffff:127.0.0.1') ||
      host.includes('::ffff:169.254.') ||
      host.includes('::ffff:192.168.') ||
      host.includes('::ffff:10.')
    ) {
      return true;
    }
  }

  // Check for IPv4 literals
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const parts = ipv4Match.slice(1).map(Number);
    const [a, b, c, d] = parts;
    if (parts.some((p) => p > 255)) return true; // Malformed / out of range

    if (a === 127) return true; // Loopback 127.0.0.0/8
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // Private 10.0.0.0/8
    if (a === 100 && b >= 64 && b <= 127) return true; // Shared 100.64.0.0/10
    if (a === 169 && b === 254) return true; // Link-local 169.254.0.0/16
    if (a === 172 && b >= 16 && b <= 31) return true; // Private 172.16.0.0/12
    if (a === 192 && b === 0 && c === 0) return true; // IETF Protocol 192.0.0.0/24
    if (a === 192 && b === 0 && c === 2) return true; // TEST-NET-1 192.0.2.0/24
    if (a === 192 && b === 88 && c === 99) return true; // 6to4 Relay 192.88.99.0/24
    if (a === 192 && b === 168) return true; // Private 192.168.0.0/16
    if (a === 198 && b >= 18 && b <= 19) return true; // Benchmarking 198.18.0.0/15
    if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2 198.51.100.0/24
    if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3 203.0.113.0/24
    if (a >= 224) return true; // Multicast (224.0.0.0/4) and Reserved (240.0.0.0/4)
  }

  return false;
}
