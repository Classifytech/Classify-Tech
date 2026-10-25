import type { TechArticle } from '../data/newsData.ts';

export const FAVORITES_STORAGE_KEY = 'classify_favorites';

export type FavoriteType = 'article';

export interface FavoriteArticleItem {
  id: string;
  type: 'article';
  savedAt: number;
  data: TechArticle;
}

export type FavoriteItem = FavoriteArticleItem;

/**
 * Checks whether an item ID is in the favorites list
 */
export function isItemFavorited(favorites: FavoriteItem[], id: string): boolean {
  if (!Array.isArray(favorites)) return false;
  return favorites.some((fav) => fav && fav.id === id);
}

/**
 * Toggles a favorite item (adds if not present, removes if present)
 * Returns the updated list and a boolean indicating whether it was added (true) or removed (false).
 */
export function toggleFavoriteItem(
  favorites: FavoriteItem[],
  item: { id: string; type: 'article'; data: TechArticle }
): { updated: FavoriteItem[]; isFavorited: boolean } {
  const safeList = Array.isArray(favorites) ? favorites : [];
  const index = safeList.findIndex((fav) => fav.id === item.id);

  if (index >= 0) {
    const updated = safeList.filter((fav) => fav.id !== item.id);
    return { updated, isFavorited: false };
  } else {
    const newEntry: FavoriteItem = {
      id: item.id,
      type: 'article',
      savedAt: Date.now(),
      data: item.data,
    };
    return { updated: [newEntry, ...safeList], isFavorited: true };
  }
}

/**
 * Removes a favorite item by ID
 */
export function removeFavoriteById(favorites: FavoriteItem[], id: string): FavoriteItem[] {
  if (!Array.isArray(favorites)) return [];
  return favorites.filter((fav) => fav.id !== id);
}

/**
 * Filters favorites by filter tab ('all' | 'article')
 */
export function filterFavorites(
  favorites: FavoriteItem[],
  filter: 'all' | 'article'
): FavoriteItem[] {
  if (!Array.isArray(favorites)) return [];
  if (filter === 'all') return favorites;
  return favorites.filter((fav) => fav.type === filter);
}

/**
 * Reads favorites safely from localStorage
 */
export function loadFavoritesFromStorage(): FavoriteItem[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && typeof item.id === 'string' && item.type === 'article' && item.data);
    }
  } catch {}
  return [];
}

/**
 * Saves favorites safely to localStorage
 */
export function saveFavoritesToStorage(favorites: FavoriteItem[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {}
}
