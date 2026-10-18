(function () {
  var search = window.location.search;
  var pathname = window.location.pathname;
  var finalTarget = '';

  if (search) {
    var params = new URLSearchParams(search);
    var encodedGo = params.get('flipkart') || params.get('amazon') || params.get('meesho') || params.get('myntra') || params.get('fk') || params.get('amz') || params.get('go');
    var rawDeal = params.get('deal');

    try {
      if (encodedGo) {
        var b64 = encodedGo.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) { b64 += '='; }
        var binString = window.atob(b64);
        var bytes = new Uint8Array(binString.length);
        for (var i = 0; i < binString.length; i++) {
          bytes[i] = binString.charCodeAt(i);
        }
        finalTarget = new TextDecoder().decode(bytes);
      } else if (rawDeal) {
        finalTarget = decodeURIComponent(rawDeal);
      }
    } catch (e) {
      try {
        finalTarget = window.atob(encodedGo || '');
      } catch (err) {
        finalTarget = rawDeal || '';
      }
    }
  }

  // Support static host fallback where /s/:code was generated and saved locally
  if (!finalTarget && pathname) {
    var pathMatch = pathname.match(/^\/s\/([a-zA-Z0-9]+)/) || pathname.match(/^\/([a-zA-Z0-9]{5,10})$/);
    if (pathMatch) {
      try {
        var localStored = JSON.parse(localStorage.getItem('classify_static_shortlinks') || '{}');
        if (localStored && localStored[pathMatch[1]]) {
          finalTarget = localStored[pathMatch[1]];
        }
      } catch (e) {}
    }
  }

  if (!finalTarget) return;

  // Strict URL Validation for 4 Allowed Retailers: Amazon, Flipkart, Myntra, Meesho
  try {
    var parsedUrl = new URL(finalTarget.startsWith('http') ? finalTarget : 'https://' + finalTarget);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return;
    if (parsedUrl.username || parsedUrl.password) return; // Disallow embedded credentials

    var host = parsedUrl.hostname.toLowerCase();
    var allowedRetailer =
      host === 'amazon.in' || host.endsWith('.amazon.in') ||
      host === 'amzn.in' || host.endsWith('.amzn.in') ||
      host === 'amzn.to' || host.endsWith('.amzn.to') ||
      host === 'flipkart.com' || host.endsWith('.flipkart.com') ||
      host === 'fkrt.it' || host.endsWith('.fkrt.it') ||
      host === 'myntra.com' || host.endsWith('.myntra.com') ||
      host === 'meesho.com' || host.endsWith('.meesho.com');

    if (allowedRetailer) {
      window.location.replace(parsedUrl.toString());
    }
  } catch (e) {}
})();
