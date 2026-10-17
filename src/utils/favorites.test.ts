import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isItemFavorited,
  toggleFavoriteItem,
  removeFavoriteById,
  filterFavorites,
  type FavoriteItem,
} from './favorites.ts';
import type { TechArticle } from '../data/newsData.ts';
import type { LootDeal } from '../data/lootData.ts';

const mockArticle: TechArticle = {
  id: 'article-1',
  badge: 'TECH',
  category: 'CHIPSET',
  time: 'Just now',
  sourceName: 'TechDesk',
  title: 'Sample Snapdragon Article',
  desc: 'Short summary for testing',
  img: 'https://example.com/img.jpg',
  fullBody: ['Paragraph 1'],
  bullets: ['Bullet 1'],
};

const mockDeal: LootDeal = {
  id: 'deal-1',
  store: 'AMAZON',
  title: 'Discounted Gaming Phone',
  desc: 'Huge price cut offer',
  price: '₹19,999',
  mrp: '₹29,999',
  discount: '33% OFF',
  img: 'https://example.com/deal.jpg',
  url: 'https://amazon.in/dp/example',
  badge: 'MEGA DEAL',
};

test('isItemFavorited returns true if id exists in list', () => {
  const list: FavoriteItem[] = [
    { id: 'article-1', type: 'article', savedAt: 1000, data: mockArticle },
  ];
  assert.equal(isItemFavorited(list, 'article-1'), true);
  assert.equal(isItemFavorited(list, 'deal-1'), false);
  assert.equal(isItemFavorited([], 'article-1'), false);
});

test('toggleFavoriteItem adds non-existent item and returns isFavorited: true', () => {
  const list: FavoriteItem[] = [];
  const res = toggleFavoriteItem(list, { id: 'article-1', type: 'article', data: mockArticle });
  assert.equal(res.isFavorited, true);
  assert.equal(res.updated.length, 1);
  assert.equal(res.updated[0].id, 'article-1');
  assert.equal(res.updated[0].type, 'article');
});

test('toggleFavoriteItem removes existing item and returns isFavorited: false', () => {
  const initial: FavoriteItem[] = [
    { id: 'article-1', type: 'article', savedAt: 1000, data: mockArticle },
    { id: 'deal-1', type: 'deal', savedAt: 1001, data: mockDeal },
  ];
  const res = toggleFavoriteItem(initial, { id: 'article-1', type: 'article', data: mockArticle });
  assert.equal(res.isFavorited, false);
  assert.equal(res.updated.length, 1);
  assert.equal(res.updated[0].id, 'deal-1');
});

test('removeFavoriteById removes specified item only', () => {
  const initial: FavoriteItem[] = [
    { id: 'article-1', type: 'article', savedAt: 1000, data: mockArticle },
    { id: 'deal-1', type: 'deal', savedAt: 1001, data: mockDeal },
  ];
  const result = removeFavoriteById(initial, 'deal-1');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'article-1');
});

test('filterFavorites filters by all, article, and deal', () => {
  const initial: FavoriteItem[] = [
    { id: 'article-1', type: 'article', savedAt: 1000, data: mockArticle },
    { id: 'deal-1', type: 'deal', savedAt: 1001, data: mockDeal },
  ];
  assert.equal(filterFavorites(initial, 'all').length, 2);
  assert.equal(filterFavorites(initial, 'article').length, 1);
  assert.equal(filterFavorites(initial, 'article')[0].id, 'article-1');
  assert.equal(filterFavorites(initial, 'deal').length, 1);
  assert.equal(filterFavorites(initial, 'deal')[0].id, 'deal-1');
});
