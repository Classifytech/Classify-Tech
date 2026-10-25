import React from 'react';

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  CAMERA: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
  CHIPSET: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
  BATTERY: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1000&q=80',
  '5G': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1000&q=80',
  GAMING: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
  INDIA: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80',
  ALL: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
};

/**
 * Robust image error fallback handler that prevents infinite error loops,
 * selects a topic-tailored fallback, and guards against hotlink/referrer blocking.
 */
export function handleImageFallback(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
): void {
  const target = e.currentTarget;
  if (target.dataset.hasFallback === 'true') {
    return;
  }
  target.dataset.hasFallback = 'true';
  const catKey = (category || 'ALL').toUpperCase();
  const fallbackUrl = CATEGORY_FALLBACK_IMAGES[catKey] || CATEGORY_FALLBACK_IMAGES.ALL;
  target.src = fallbackUrl;
}
