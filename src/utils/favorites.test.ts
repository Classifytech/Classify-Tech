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

const mockArticle2: TechArticle = {
  id: 'article-2',
  badge: 'AI',
  category: 'ALL',
  time: '5m ago',
  sourceName: 'VergeWire',
  title: 'Next Gen AI Hardware',
  desc: 'Summary of AI chips',
  img: 'https://example.com/img2.jpg',
  fullBody: ['Paragraph 2'],
  bullets: ['Bullet 2'],
};

test('isItemFavorited returns true if id exists in list', () => {
  const list: FavoriteItem[] = [
    { id: 'article-1', type: 'article', savedAt: 1000, data: mockArticle },
  ];
  assert.equal(isItemFavorited(list, 'article-1'), true);
  assert.equal(isItemFavorited(list, 'article-99'), false);
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
    { id: 'article-2', type: 'article', savedAt: 1001, data: mockArticle2 },
  ];
  const res = toggleFavoriteItem(initial, { id: 'article-1', type: 'article', data: mockArticle });
  assert.equal(res.isFavorited, false);
  assert.equal(res.updated.length, 1);
  assert.equal(res.updated[0].id, 'article-2');
});

test('removeFavoriteById removes specified item only', () => {
  const initial: FavoriteItem[] = [
    { id: 'article-1', type: 'article', savedAt: 1000, data: mockArticle },
    { id: 'article-2', type: 'article', savedAt: 1001, data: mockArticle2 },
  ];
  const result = removeFavoriteById(initial, 'article-2');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'article-1');
});

test('filterFavorites filters by all and article', () => {
  const initial: FavoriteItem[] = [
    { id: 'article-1', type: 'article', savedAt: 1000, data: mockArticle },
    { id: 'article-2', type: 'article', savedAt: 1001, data: mockArticle2 },
  ];
  assert.equal(filterFavorites(initial, 'all').length, 2);
  assert.equal(filterFavorites(initial, 'article').length, 2);
  assert.equal(filterFavorites(initial, 'article')[0].id, 'article-1');
});
