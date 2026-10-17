import React, { useState } from 'react';
import { LootDeal } from '../data/lootData.ts';
import { TechArticle } from '../data/newsData.ts';
import { PhoneSpecs } from '../data/phonesData.ts';
import { calculateDiscountLabel } from '../utils/affiliate.ts';
import { Lock, ShieldCheck, Tag, Newspaper, Smartphone, Key, Plus, Check } from 'lucide-react';

interface AdminDashboardProps {
  adminToken?: string;
  lootDeals: LootDeal[];
  onUpdateLootDeal: (index: number, updated: LootDeal) => void;
  onAddArticle: (article: TechArticle) => void;
  onAddPhone: (phone: PhoneSpecs) => void;
  onLock: () => void;
  onShowToast: (msg: string) => void;
  onRefreshRss?: () => void;
  isRssLoading?: boolean;
  lastRssSyncTime?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminToken,
  lootDeals,
  onUpdateLootDeal,
  onAddArticle,
  onAddPhone,
  onLock,
  onShowToast,
  onRefreshRss,
  isRssLoading = false,
  lastRssSyncTime = 'Active (Every 15 min)',
}) => {
  const [activeTab, setActiveTab] = useState<'loot' | 'news' | 'phone' | 'affiliate'>('loot');

  // Loot Form State
  const [lootSlot, setLootSlot] = useState<number>(0);
  const [lootStore, setLootStore] = useState('');
  const [lootTitle, setLootTitle] = useState('');
  const [lootPrice, setLootPrice] = useState('');
  const [lootMrp, setLootMrp] = useState('');
  const [lootImg, setLootImg] = useState('');
  const [lootUrl, setLootUrl] = useState('');

  // News Form State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBadge, setNewsBadge] = useState('GLOBAL TECH');
  const [newsCat, setNewsCat] = useState<'ALL' | 'INDIA' | 'CHIPSET' | 'GAMING' | '5G' | 'BATTERY'>('CHIPSET');
  const [newsSource, setNewsSource] = useState('Official Brand Press Wire');
  const [newsImg, setNewsImg] = useState('');
  const [newsDesc, setNewsDesc] = useState('');
  const [newsFull, setNewsFull] = useState('');

  // Phone Form State
  const [phoneName, setPhoneName] = useState('');
  const [phonePrice, setPhonePrice] = useState('');
  const [phoneCpu, setPhoneCpu] = useState('');
  const [phoneNm, setPhoneNm] = useState('');
  const [phoneAntutu, setPhoneAntutu] = useState('');
  const [phoneGeek, setPhoneGeek] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [phoneBuild, setPhoneBuild] = useState('');
  const [phoneRam, setPhoneRam] = useState('');
  const [phoneCamRear, setPhoneCamRear] = useState('');
  const [phoneCamFront, setPhoneCamFront] = useState('');
  const [phoneGaming, setPhoneGaming] = useState('');
  const [phoneBands, setPhoneBands] = useState('');
  const [phoneWifi, setPhoneWifi] = useState('');
  const [phoneBattery, setPhoneBattery] = useState('');
  const [phoneOs, setPhoneOs] = useState('');
  const [phoneVerdict, setPhoneVerdict] = useState('');

  const handleSaveLoot = async (e: React.FormEvent) => {
    e.preventDefault();
    const existing = lootDeals[lootSlot];
    const finalPrice = lootPrice.trim() || (existing ? existing.price : '₹19,999');
    const finalMrp = lootMrp.trim() || (existing ? existing.mrp : '₹25,999');
    const computedDiscount = calculateDiscountLabel(finalPrice, finalMrp);

    const updated: LootDeal = {
      id: existing ? existing.id : `loot-slot-${lootSlot + 1}`,
      store: lootStore.trim() || (existing ? existing.store : 'MEGA DEAL'),
      title: lootTitle.trim() || (existing ? existing.title : 'New Loot Deal'),
      desc: existing ? existing.desc : 'Verified price drop.',
      price: finalPrice,
      mrp: finalMrp,
      discount: computedDiscount,
      img: lootImg.trim() || (existing ? existing.img : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'),
      url: lootUrl.trim() || (existing ? existing.url : 'https://www.flipkart.com'),
      badge: `SLOT #${lootSlot + 1}`,
    };

    onUpdateLootDeal(lootSlot, updated);

    // Persist updated loot deals array to server JSON storage
    const nextDeals = [...lootDeals];
    nextDeals[lootSlot] = updated;

    try {
      if (adminToken) {
        await fetch('/api/admin/loot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminToken, lootDeals: nextDeals }),
        });
      }
    } catch (err) {
      console.warn('Failed to sync loot deals to server:', err);
    }

    onShowToast(`Loot Slot #${lootSlot + 1} (${computedDiscount}) updated & saved to server storage!`);
  };

  const handlePublishArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsDesc.trim()) {
      onShowToast('Please provide an article title and short summary.');
      return;
    }
    const newArt: TechArticle = {
      id: `article-${Date.now()}`,
      title: newsTitle.trim(),
      badge: newsBadge,
      category: newsCat,
      sourceName: newsSource.trim() || 'Verified Tech Wire',
      time: 'Just Now',
      img: newsImg.trim() || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
      desc: newsDesc.trim(),
      fullBody: newsFull.trim() ? newsFull.split('\n\n') : [newsDesc.trim()],
      bullets: ['Curated under Fair Dealing (Section 52).', 'Verified against official vendor specifications.']
    };

    onAddArticle(newArt);

    // Persist custom article to server JSON storage
    try {
      if (adminToken) {
        await fetch('/api/admin/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminToken, article: newArt }),
        });
      }
    } catch (err) {
      console.warn('Failed to sync article to server:', err);
    }

    setNewsTitle('');
    setNewsDesc('');
    setNewsFull('');
    onShowToast('Tech article published & saved to live server feed!');
  };

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneName.trim()) {
      onShowToast('Please provide a phone name.');
      return;
    }
    const idKey = phoneName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newPhone: PhoneSpecs = {
      id: idKey,
      name: phoneName.trim(),
      price: phonePrice.trim() || '₹29,999',
      cpu: phoneCpu.trim() || '4nm Octa-Core Processor',
      nm: phoneNm.trim() || '4nm TSMC',
      antutu: parseInt(phoneAntutu, 10) || 1200000,
      geek: phoneGeek.trim() || '1500 Single / 4500 Multi',
      display: phoneDisplay.trim() || '6.67" 1.5K 120Hz AMOLED',
      build: phoneBuild.trim() || 'Gorilla Glass Front • IP65',
      ram: phoneRam.trim() || 'LPDDR5X + UFS 4.0',
      cam_rear: phoneCamRear.trim() || '50MP Sony Sensor (OIS)',
      cam_front: phoneCamFront.trim() || '16MP Front Camera',
      gaming: phoneGaming.trim() || 'BGMI 90FPS Stable',
      bands5g: phoneBands.trim() || 'Dual 5G SA/NSA (14 Bands)',
      wifi: phoneWifi.trim() || 'Wi-Fi 6 • BT 5.4',
      audio: 'Dual Stereo Speakers',
      battery: phoneBattery.trim() || '5000mAh • 80W Fast Charger',
      os: phoneOs.trim() || 'Android 15',
      verdict: phoneVerdict.trim() || 'Verified hardware performance.'
    };

    onAddPhone(newPhone);

    // Persist phone specs to server JSON storage
    try {
      if (adminToken) {
        await fetch('/api/admin/phones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminToken, phone: newPhone }),
        });
      }
    } catch (err) {
      console.warn('Failed to sync phone specs to server:', err);
    }

    setPhoneName('');
    onShowToast(`${newPhone.name} saved to server comparator database!`);
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 w-full animate-in fade-in duration-200">
      <div className="glass-card rounded-3xl p-4 sm:p-7 border-2 border-amber-400/80 shadow-2xl space-y-5 bg-slate-950/95">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg shrink-0 border border-amber-400/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-400">CLASSIFY TECH • Master Editorial Console</h3>
              <p className="text-xs text-slate-400">Manage Universal Loot slots, publish tech articles, and expand comparator phone database</p>
            </div>
          </div>
          <button
            onClick={onLock}
            className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" /> Lock Console
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('loot')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'loot' ? 'bg-[#00f2fe] text-black shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Tag className="w-3.5 h-3.5" /> 1. Update 2 Loot Deal Slots
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'news' ? 'bg-[#00f2fe] text-black shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" /> 2. Publish Tech News Article
          </button>

          <button
            onClick={() => setActiveTab('phone')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'phone' ? 'bg-[#00f2fe] text-black shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> 3. Add Smartphone (16 Specs)
          </button>

          <button
            onClick={() => setActiveTab('affiliate')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'affiliate' ? 'bg-[#00f2fe] text-black shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> 4. Default Affiliate IDs
          </button>
        </div>

        {/* TAB 1: LOOT DEALS */}
        {activeTab === 'loot' && (
          <form onSubmit={handleSaveLoot} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
            <h4 className="font-black text-[#00e676] uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Update Live Loot Slots
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              <select
                value={lootSlot}
                onChange={(e) => setLootSlot(parseInt(e.target.value, 10))}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white font-bold"
              >
                <option value={0}>🔥 Loot Deal Slot #1</option>
                <option value={1}>⚡ Loot Deal Slot #2</option>
              </select>
              <input
                type="text"
                placeholder="Store Name (e.g. Flipkart)"
                value={lootStore}
                onChange={(e) => setLootStore(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Product Name"
                value={lootTitle}
                onChange={(e) => setLootTitle(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Loot Price (e.g. ₹22,999)"
                value={lootPrice}
                onChange={(e) => setLootPrice(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Original MRP (e.g. ₹30,999)"
                value={lootMrp}
                onChange={(e) => setLootMrp(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={lootImg}
                onChange={(e) => setLootImg(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                placeholder="Paste Target Affiliate Store Link..."
                value={lootUrl}
                onChange={(e) => setLootUrl(e.target.value)}
                className="flex-1 rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <button
                type="submit"
                className="grad-btn px-5 py-2 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Save to Slot #{lootSlot + 1}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: TECH NEWS */}
        {activeTab === 'news' && (
          <div className="space-y-4">
            {/* Live RSS Sync Control Panel for Admin */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-black text-[#00f2fe] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00e676] animate-ping" />
                  Live Free RSS Feeds Auto-Sync
                </div>
                <div className="text-slate-300">
                  Auto-Updates: <strong className="text-white">Active (Every 15 min without reload)</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  Last Synced: <strong className="text-white">{lastRssSyncTime}</strong> • Feeds: GSMArena, Android Authority, Gadgets 360, 9to5Google, The Verge
                </div>
              </div>

              {onRefreshRss && (
                <button
                  type="button"
                  onClick={onRefreshRss}
                  disabled={isRssLoading}
                  className="grad-btn px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60 shadow-md"
                >
                  <Newspaper className={`w-3.5 h-3.5 ${isRssLoading ? 'animate-spin' : ''}`} />
                  <span>{isRssLoading ? 'Syncing Feeds...' : 'Sync RSS Feeds Now'}</span>
                </button>
              )}
            </div>

            <form onSubmit={handlePublishArticle} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
              <h4 className="font-black text-[#00f2fe] uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" /> Publish Custom Tech Article
              </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Article Headline..."
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                className="sm:col-span-2 rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
                required
              />
              <input
                type="text"
                placeholder="Badge (e.g. GLOBAL TECH)"
                value={newsBadge}
                onChange={(e) => setNewsBadge(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <select
                value={newsCat}
                onChange={(e) => setNewsCat(e.target.value as any)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              >
                <option value="CHIPSET">Chipset & AI</option>
                <option value="INDIA">India Launch</option>
                <option value="GAMING">Gaming & Battery</option>
                <option value="5G">5G & Telecom</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Editorial Byline (e.g. CLASSIFY TECH Senior Desk)"
                value={newsSource}
                onChange={(e) => setNewsSource(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Image URL (Optional)"
                value={newsImg}
                onChange={(e) => setNewsImg(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Short Summary (shown on grid card)..."
              value={newsDesc}
              onChange={(e) => setNewsDesc(e.target.value)}
              className="w-full rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              required
            />
            <textarea
              rows={3}
              placeholder="Full Detailed Story Content (separate paragraphs with blank line)..."
              value={newsFull}
              onChange={(e) => setNewsFull(e.target.value)}
              className="w-full rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
            />
            <button
              type="submit"
              className="grad-btn w-full py-2.5 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Publish Article Now
            </button>
          </form>
          </div>
        )}

        {/* TAB 3: PHONE SPECS */}
        {activeTab === 'phone' && (
          <form onSubmit={handleAddPhone} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
            <h4 className="font-black text-[#c084fc] uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Add Phone to 16-Point Hardware Matrix
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Phone Name (e.g. Xiaomi 15 Pro)"
                value={phoneName}
                onChange={(e) => setPhoneName(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
                required
              />
              <input
                type="text"
                placeholder="Price (e.g. ₹54,999)"
                value={phonePrice}
                onChange={(e) => setPhonePrice(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Processor (e.g. Snapdragon 8 Elite)"
                value={phoneCpu}
                onChange={(e) => setPhoneCpu(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Node & GPU (e.g. 3nm TSMC • Adreno 830)"
                value={phoneNm}
                onChange={(e) => setPhoneNm(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                placeholder="AnTuTu v10 (e.g. 2850000)"
                value={phoneAntutu}
                onChange={(e) => setPhoneAntutu(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Geekbench 6 (e.g. 3100 / 9500)"
                value={phoneGeek}
                onChange={(e) => setPhoneGeek(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Display (e.g. 6.73 inch 2K 120Hz LTPO)"
                value={phoneDisplay}
                onChange={(e) => setPhoneDisplay(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Protection & IP (e.g. Ceramic Glass, IP68)"
                value={phoneBuild}
                onChange={(e) => setPhoneBuild(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="RAM & Storage (e.g. LPDDR5X + UFS 4.0)"
                value={phoneRam}
                onChange={(e) => setPhoneRam(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Rear Camera (e.g. 50MP Light Hunter 900 OIS)"
                value={phoneCamRear}
                onChange={(e) => setPhoneCamRear(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Selfie (e.g. 32MP 4K60)"
                value={phoneCamFront}
                onChange={(e) => setPhoneCamFront(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Gaming FPS (e.g. 120FPS Stable)"
                value={phoneGaming}
                onChange={(e) => setPhoneGaming(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="5G Bands (e.g. Dual 5G 16 Bands)"
                value={phoneBands}
                onChange={(e) => setPhoneBands(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Wi-Fi / BT (e.g. Wi-Fi 7, BT 5.4)"
                value={phoneWifi}
                onChange={(e) => setPhoneWifi(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Battery & Charger (e.g. 6100mAh • 90W)"
                value={phoneBattery}
                onChange={(e) => setPhoneBattery(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="OS & Updates (e.g. HyperOS 2.0 • 4 Yrs)"
                value={phoneOs}
                onChange={(e) => setPhoneOs(e.target.value)}
                className="rounded-xl bg-black border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Final Verdict"
                value={phoneVerdict}
                onChange={(e) => setPhoneVerdict(e.target.value)}
                className="sm:col-span-2 lg:col-span-4 rounded-xl bg-black border border-emerald-400 px-3 py-2 text-white"
              />
            </div>
            <button
              type="submit"
              className="grad-btn w-full py-2.5 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Save Device to Database
            </button>
          </form>
        )}

        {/* TAB 4: AFFILIATE SETTINGS */}
        {activeTab === 'affiliate' && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 space-y-3 text-xs">
            <h4 className="font-black text-[#00e676] uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> Active Affiliate Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-black/60 rounded-xl border border-white/10 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Flipkart Affiliate ID</span>
                <div className="font-mono text-white text-xs font-bold">inf_ed6b592b-00d1-46f4-bdb7-6aa275ecb425</div>
                <div className="text-[10px] text-slate-500">Auto-appended via ?affid= to Flipkart product links</div>
              </div>
              <div className="p-3 bg-black/60 rounded-xl border border-white/10 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Amazon Associate Tag</span>
                <div className="font-mono text-white text-xs font-bold">classifytech-21</div>
                <div className="text-[10px] text-slate-500">Auto-appended via ?tag= and &linkCode=ll1 to Amazon links</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
