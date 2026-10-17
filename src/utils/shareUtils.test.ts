import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArticleShareData, isWebShareSupported, shareArticle } from './shareUtils.ts';

test('buildArticleShareData generates clean payload with sourceUrl', () => {
  const payload = buildArticleShareData({
    title: '  Snapdragon 8 Elite Benchmark Scores Released  ',
    sourceUrl: 'https://www.gsmarena.com/benchmark-test-news.php',
    summary: 'Detailed test results for Snapdragon 8 Elite.',
  });

  assert.equal(payload.title, 'Snapdragon 8 Elite Benchmark Scores Released');
  assert.equal(payload.text, 'Snapdragon 8 Elite Benchmark Scores Released — CLASSIFY TECH');
  assert.equal(payload.url, 'https://www.gsmarena.com/benchmark-test-news.php');
});

test('buildArticleShareData uses fallback URL when sourceUrl is missing or invalid', () => {
  const payload = buildArticleShareData(
    { title: 'New Android 16 Features' },
    'https://classifytech.com/news/123'
  );

  assert.equal(payload.title, 'New Android 16 Features');
  assert.equal(payload.url, 'https://classifytech.com/news/123');
});

test('isWebShareSupported returns false in Node environment without navigator.share', () => {
  assert.equal(isWebShareSupported(), false);
  assert.equal(isWebShareSupported({ share: () => {} }), true);
});

test('shareArticle invokes native navigator.share when available', async () => {
  let shareCalledWith: any = null;
  let successMethod: string | null = null;

  const mockNavigator = {
    share: async (data: any) => {
      shareCalledWith = data;
    },
  };

  await shareArticle(
    {
      title: 'Pixel 9 Pro Camera Review',
      sourceUrl: 'https://example.com/review',
    },
    {
      onSuccess: (method) => {
        successMethod = method;
      },
      onError: () => {
        assert.fail('Should not call onError');
      },
    },
    'https://classifytech.com',
    mockNavigator
  );

  assert.equal(successMethod, 'native');
  assert.deepEqual(shareCalledWith, {
    title: 'Pixel 9 Pro Camera Review',
    text: 'Pixel 9 Pro Camera Review — CLASSIFY TECH',
    url: 'https://example.com/review',
  });
});

test('shareArticle ignores AbortError when user cancels native share sheet', async () => {
  let successCalled = false;
  let errorCalled = false;

  const abortErr = new Error('Share canceled');
  abortErr.name = 'AbortError';

  const mockNavigator = {
    share: async () => {
      throw abortErr;
    },
  };

  await shareArticle(
    { title: 'Test Article' },
    {
      onSuccess: () => { successCalled = true; },
      onError: () => { errorCalled = true; },
    },
    'https://classifytech.com',
    mockNavigator
  );

  assert.equal(successCalled, false, 'User abort should not trigger success callback');
  assert.equal(errorCalled, false, 'User abort should not trigger error callback');
});

test('shareArticle falls back to clipboard when navigator.share is unavailable', async () => {
  let copiedText = '';
  let successMethod: string | null = null;

  const mockNavigator = {
    clipboard: {
      writeText: async (text: string) => {
        copiedText = text;
      },
    },
  };

  await shareArticle(
    {
      title: 'Nothing Phone 3 Leaks',
      sourceUrl: 'https://classifytech.com/nothing-3',
    },
    {
      onSuccess: (method) => { successMethod = method; },
      onError: (err) => { assert.fail(`Unexpected error: ${err}`); },
    },
    'https://classifytech.com',
    mockNavigator
  );

  assert.equal(successMethod, 'clipboard');
  assert.equal(copiedText, 'https://classifytech.com/nothing-3');
});
