import { isSupportedRetailerUrl, generateShortCode } from '../../src/utils/affiliate.ts';

export const handler = async (event: any) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { url, code: clientCode, postId: clientPostId } = payload;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Please enter a valid product link.' }),
      };
    }

    const trimmedUrl = url.trim();
    const validation = isSupportedRetailerUrl(trimmedUrl);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: validation.error || 'Please enter a valid HTTP or HTTPS link.' }),
      };
    }

    const code = (clientCode && typeof clientCode === 'string' && /^[a-zA-Z0-9_-]{4,16}$/.test(clientCode.trim()))
      ? clientCode.trim()
      : generateShortCode(6);
    const postId = (clientPostId && typeof clientPostId === 'string' && clientPostId.trim())
      ? clientPostId.trim()
      : `post-${code}`;

    const cfRes = await fetch('https://classify.classifytechz.workers.dev/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: trimmedUrl,
        code,
        postId,
      }),
      signal: AbortSignal.timeout(9000),
    });

    if (cfRes.ok) {
      const data: any = await cfRes.json();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          code: data.code || code,
          postId: data.postId || postId,
          affiliateUrl: data.affiliateUrl || data.finalUrl || trimmedUrl,
          store: data.store || validation.store || 'amazon',
          storeName: data.storeName || validation.storeName || 'Amazon',
          kvSaved: data.kvSaved ?? true,
          createdAt: data.createdAt || Date.now(),
          expiresAt: data.expiresAt || (Date.now() + 31536000 * 1000),
          ttlSeconds: data.ttlSeconds || 31536000,
        }),
      };
    }

    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Cloudflare Worker V2 sync failed.' }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message || 'Server error' }),
    };
  }
};
