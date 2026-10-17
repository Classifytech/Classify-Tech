export interface ArticleSharePayload {
  title: string;
  text: string;
  url: string;
}

/**
 * Builds the standard Web Share API payload for a tech article.
 * Ensures the title, text, and URL are clean, safe, and formatted.
 */
export function buildArticleShareData(
  article: { title: string; sourceUrl?: string; summary?: string },
  fallbackUrl: string = 'https://classifytech.com'
): ArticleSharePayload {
  const cleanTitle = (article.title || 'CLASSIFY TECH News').trim();
  const url = (article.sourceUrl && article.sourceUrl.startsWith('http'))
    ? article.sourceUrl.trim()
    : fallbackUrl;
  
  const text = `${cleanTitle} — CLASSIFY TECH`;

  return {
    title: cleanTitle,
    text,
    url,
  };
}

/**
 * Detects whether the given navigator instance supports the native Web Share API.
 */
export function isWebShareSupported(
  nav?: any
): boolean {
  const targetNav = nav || (typeof navigator !== 'undefined' ? navigator : undefined);
  return Boolean(targetNav && typeof targetNav.share === 'function');
}

/**
 * Executes a share operation using the Web Share API when supported,
 * or gracefully delegates to the clipboard copy fallback when unsupported or when
 * share is not available.
 *
 * Catches user aborts (user closed share sheet) without treating it as an error.
 */
export async function shareArticle(
  article: { title: string; sourceUrl?: string; summary?: string },
  callbacks: {
    onSuccess: (method: 'native' | 'clipboard') => void;
    onError: (error: string) => void;
  },
  currentHref: string = typeof window !== 'undefined' ? window.location.href : 'https://classifytech.com',
  navOverride?: any
): Promise<void> {
  const shareData = buildArticleShareData(article, currentHref);
  const targetNav = navOverride || (typeof navigator !== 'undefined' ? navigator : undefined);

  if (isWebShareSupported(targetNav)) {
    try {
      await targetNav.share(shareData);
      callbacks.onSuccess('native');
      return;
    } catch (err: unknown) {
      const error = err as Error;
      // If the user cancelled/aborted the share sheet, do not trigger error or clipboard fallback
      if (error && error.name === 'AbortError') {
        return;
      }
      // Otherwise proceed to clipboard fallback
    }
  }

  // Fallback: Copy URL to clipboard
  try {
    if (targetNav && targetNav.clipboard && typeof targetNav.clipboard.writeText === 'function') {
      await targetNav.clipboard.writeText(shareData.url);
      callbacks.onSuccess('clipboard');
    } else {
      callbacks.onError('Web sharing and clipboard are not available on this device.');
    }
  } catch {
    callbacks.onError('Failed to copy article link to clipboard.');
  }
}
