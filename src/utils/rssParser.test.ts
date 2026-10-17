import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanHtmlText,
  formatSourceCredit,
  extractImageUrl,
  inferCategory,
  formatPubDate,
  transformRssItemToArticle,
  FREE_TECH_RSS_FEEDS,
  AUTO_REFRESH_INTERVAL_MS,
  type Rss2JsonItem,
} from './rssParser.ts';

test('cleanHtmlText removes tags, unwraps CDATA, and decodes HTML entities', () => {
  const dirty = '<p>Snapdragon 8 Elite is &quot;super fast&quot; &amp; efficient.&nbsp;</p>';
  const clean = cleanHtmlText(dirty);
  assert.equal(clean, 'Snapdragon 8 Elite is "super fast" & efficient.');

  const dirtyEntities = 'It&#8217;s a &#8220;breakthrough&#8221; with AI&#8230;';
  assert.equal(cleanHtmlText(dirtyEntities), 'It’s a “breakthrough” with AI…');

  const cdata = '<![CDATA[<h1>Exclusive Scoop: Xiaomi 15 Pro</h1>]]>';
  assert.equal(cleanHtmlText(cdata), 'Exclusive Scoop: Xiaomi 15 Pro');
});

test('formatSourceCredit cleans GSMArena and other outlet credits', () => {
  assert.equal(formatSourceCredit('GSMArena.com - Latest articles', 'https://www.gsmarena.com/news'), 'GSMArena');
  assert.equal(formatSourceCredit('Android Authority', 'https://www.androidauthority.com'), 'Android Authority');
  assert.equal(formatSourceCredit('Gadgets 360', 'https://gadgets360.com'), 'Gadgets 360');
  assert.equal(formatSourceCredit('9to5Google', 'https://9to5google.com'), '9to5Google');
  assert.equal(formatSourceCredit('The Verge', 'https://www.theverge.com'), 'The Verge');
});

test('extractImageUrl prioritizes thumbnail and enclosure and upgrades GSMArena thumbnails', () => {
  const itemWithThumb: Rss2JsonItem = {
    title: 'Test',
    pubDate: '',
    link: 'https://example.com',
    thumbnail: 'https://images.example.com/thumb.jpg',
  };
  assert.equal(extractImageUrl(itemWithThumb), 'https://images.example.com/thumb.jpg');

  const gsmThumb: Rss2JsonItem = {
    title: 'Test GSM',
    pubDate: '',
    link: 'https://gsmarena.com',
    thumbnail: 'https://fdn.gsmarena.com/imgroot/news/26/10/article/-184x111/gsmarena_000.jpg',
  };
  assert.equal(extractImageUrl(gsmThumb), 'https://fdn.gsmarena.com/imgroot/news/26/10/article/gsmarena_000.jpg');

  const itemWithImgTag: Rss2JsonItem = {
    title: 'Test',
    pubDate: '',
    link: 'https://example.com',
    description: '<p>Some text <img src="https://images.example.com/inline.png" alt="img" /></p>',
  };
  assert.equal(extractImageUrl(itemWithImgTag), 'https://images.example.com/inline.png');
});

test('inferCategory accurately tags chipsets, AI, India launches, gaming, and 5G', () => {
  const chip = inferCategory('Qualcomm announces Snapdragon 8s Gen 3', 'new 4nm processor');
  assert.equal(chip.category, 'CHIPSET');

  const aiArticle = inferCategory('OpenAI and Google Gemini announce new autonomous coding agents', 'latest artificial intelligence models');
  assert.equal(aiArticle.category, 'CHIPSET');
  assert.equal(aiArticle.badge, 'CHIPSET & AI');

  const india = inferCategory('POCO F6 5G launches in India with aggressive pricing', 'Xiaomi India release');
  assert.equal(india.category, 'INDIA');

  const gaming = inferCategory('BGMI receives 120FPS ultra extreme update', 'game performance');
  assert.equal(gaming.category, 'GAMING');

  const battery = inferCategory('OnePlus introduces 150W fast charging tech with 6500mAh silicon battery', 'high capacity battery');
  assert.equal(battery.category, 'GAMING');
  assert.equal(battery.badge, 'GAMING & BATTERY');

  const net = inferCategory('New 5G spectrum auction details revealed', 'telecom band n78');
  assert.equal(net.category, '5G');
});

test('transformRssItemToArticle structures full article with polished source citation and safe url', () => {
  const rawItem: Rss2JsonItem = {
    title: '<b>Dimensity 9400</b> Benchmarks Revealed',
    pubDate: '2026-10-15 10:00:00',
    link: 'https://www.gsmarena.com/test-article.php',
    description: '<p>The Dimensity 9400 chip scored 2.8 million on AnTuTu. It features an advanced All-Big-Core CPU design.</p>',
    thumbnail: 'https://fdn.gsmarena.com/imgroot/news/test.jpg',
  };

  const article = transformRssItemToArticle(rawItem, 'GSMArena.com - Latest articles');
  assert.equal(article.title, 'Dimensity 9400 Benchmarks Revealed');
  assert.equal(article.category, 'CHIPSET');
  assert.equal(article.sourceName, 'GSMArena');
  assert.equal(article.sourceUrl, 'https://www.gsmarena.com/test-article.php');
  assert.ok(article.bullets?.[0]?.includes('GSMArena'));
});

test('FREE_TECH_RSS_FEEDS contains 5 diverse sources', () => {
  assert.equal(FREE_TECH_RSS_FEEDS.length, 5);
});

test('AUTO_REFRESH_INTERVAL_MS equals exactly 15 minutes', () => {
  assert.equal(AUTO_REFRESH_INTERVAL_MS, 15 * 60 * 1000);
});

test('transformRssItemToArticle cleans snippet artifacts and retains full paragraphs without truncation', () => {
  const item: Rss2JsonItem = {
    title: 'Samsung Galaxy S25 Launch',
    pubDate: '2026-10-17 12:00:00',
    link: 'https://www.theverge.com/s25',
    content: '<p>The Galaxy S25 is powered by Snapdragon 8 Elite.</p><p>It features full satellite connectivity and 7 years of Android OS updates.</p>[&#8230;] The post appeared first on The Verge.',
    description: 'Samsung has officially announced the Galaxy S25 lineup with Snapdragon 8 Elite globally.',
  };

  const article = transformRssItemToArticle(item, 'The Verge');
  assert.equal(article.title, 'Samsung Galaxy S25 Launch');
  assert.ok(article.fullBody.length >= 2, 'Should preserve all distinct paragraphs');
  assert.ok(!article.fullBody.some(p => p.includes('[&#8230;]')), 'Artifacts should be stripped');
  assert.ok(!article.fullBody.some(p => p.includes('The post appeared first on')), 'Feed signature should be stripped');
  assert.ok(!article.desc.endsWith('...'), 'Summary description should not be abruptly cut with ellipses');
});
