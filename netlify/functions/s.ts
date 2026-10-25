export const handler = async (event: any) => {
  const code = event.queryStringParameters?.code || (event.path || '').replace(/^\/s\/?/, '').trim();

  if (!code || !/^[a-zA-Z0-9_-]{4,20}$/.test(code)) {
    return {
      statusCode: 302,
      headers: { Location: '/' },
      body: '',
    };
  }

  try {
    const cfRes = await fetch(`https://classify.classifytechz.workers.dev/api/resolve/${encodeURIComponent(code)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    if (cfRes.ok) {
      const data: any = await cfRes.json();
      if (data && data.success && data.affiliateUrl) {
        return {
          statusCode: 302,
          headers: {
            Location: data.affiliateUrl,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: '',
        };
      }
    }
  } catch (err) {
    console.error(`Netlify function error in /s/${code}:`, err);
  }

  return {
    statusCode: 302,
    headers: { Location: '/' },
    body: '',
  };
};
