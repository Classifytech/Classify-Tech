import React, { useState, useMemo } from 'react';
import { PhoneSpecs } from '../data/phonesData.ts';
import { calculatePercent } from '../utils/affiliate.ts';
import {
  Scale,
  Sparkles,
  Smartphone,
  IndianRupee,
  Cpu,
  Atom,
  Flame,
  Tv,
  Shield,
  Layers,
  Camera,
  Video,
  Gamepad2,
  Radio,
  Wifi,
  BatteryCharging,
  Layers3,
  Award
} from 'lucide-react';

interface CompareSectionProps {
  phones: Record<string, PhoneSpecs>;
}

export const CompareSection: React.FC<CompareSectionProps> = ({ phones }) => {
  const phoneKeys = useMemo(() => Object.keys(phones), [phones]);
  const [phone1Key, setPhone1Key] = useState<string>(() => phoneKeys[0] || 'iphone-16-pro-max');
  const [phone2Key, setPhone2Key] = useState<string>(() => phoneKeys[3] || 'samsung-s25-ultra');

  const p1 = phones[phone1Key] || phones[phoneKeys[0]] || Object.values(phones)[0];
  const p2 = phones[phone2Key] || phones[phoneKeys[1]] || Object.values(phones)[1] || p1;

  const maxAntutu = Math.max(p1?.antutu || 0, p2?.antutu || 0, 1850000);
  const pct1 = calculatePercent(p1?.antutu || 0, maxAntutu);
  const pct2 = calculatePercent(p2?.antutu || 0, maxAntutu);

  // Group 100+ devices by brand for fast, organized selection
  const brandGroups = useMemo(() => {
    const groups: { label: string; keys: string[] }[] = [
      { label: '🍎 Apple iPhone', keys: [] },
      { label: '📱 Samsung Galaxy', keys: [] },
      { label: '⚡ OnePlus', keys: [] },
      { label: '🏁 iQOO Performance', keys: [] },
      { label: '📸 Vivo Zeiss Series', keys: [] },
      { label: '🏎️ Realme Speed Series', keys: [] },
      { label: '💎 Xiaomi, Redmi & POCO', keys: [] },
      { label: '🤖 Google Pixel AI', keys: [] },
      { label: '🛡️ Motorola Edge & G-Series', keys: [] },
      { label: '🎮 Asus ROG & Esports', keys: [] },
      { label: '✨ Nothing, CMF & Others', keys: [] },
    ];

    for (const key of phoneKeys) {
      const p = phones[key];
      if (!p) continue;
      const n = p.name.toLowerCase();
      if (n.includes('apple') || n.includes('iphone')) groups[0].keys.push(key);
      else if (n.includes('samsung') || n.includes('galaxy')) groups[1].keys.push(key);
      else if (n.includes('oneplus') || n.includes('nord')) groups[2].keys.push(key);
      else if (n.includes('iqoo')) groups[3].keys.push(key);
      else if (n.includes('vivo')) groups[4].keys.push(key);
      else if (n.includes('realme') || n.includes('narzo')) groups[5].keys.push(key);
      else if (n.includes('xiaomi') || n.includes('redmi') || n.includes('poco')) groups[6].keys.push(key);
      else if (n.includes('pixel') || n.includes('google')) groups[7].keys.push(key);
      else if (n.includes('motorola') || n.includes('moto') || n.includes('razr')) groups[8].keys.push(key);
      else if (n.includes('rog') || n.includes('asus') || n.includes('gt 20 pro')) groups[9].keys.push(key);
      else groups[10].keys.push(key);
    }

    return groups.filter((g) => g.keys.length > 0);
  }, [phoneKeys, phones]);

  const specRows = useMemo(() => [
    {
      icon: <IndianRupee className="w-4 h-4 text-[#00e676]" />,
      title: '1. RETAIL PRICE & STORAGE',
      v1: <span className="text-sm sm:text-base font-black text-[#00e676]">{p1.price}</span>,
      v2: <span className="text-sm sm:text-base font-black text-[#00e676]">{p2.price}</span>,
    },
    {
      icon: <Cpu className="w-4 h-4 text-[#00f2fe]" />,
      title: '2. PROCESSOR & ARCHITECTURE',
      v1: <div className="font-extrabold text-white text-xs sm:text-sm">{p1.cpu}</div>,
      v2: <div className="font-extrabold text-white text-xs sm:text-sm">{p2.cpu}</div>,
    },
    {
      icon: <Atom className="w-4 h-4 text-[#c084fc]" />,
      title: '3. FABRICATION NODE & GPU',
      v1: <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-[#00f2fe] text-xs font-bold">{p1.nm}</span>,
      v2: <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 text-xs font-bold">{p2.nm}</span>,
    },
    {
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      title: '4. ANTUTU V10 & GEEKBENCH 6',
      v1: (
        <div className="space-y-1">
          <div className="font-black text-[#00f2fe] text-sm sm:text-base">{p1.antutu.toLocaleString('en-IN')} Pts</div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#00f2fe] rounded-full transition-all duration-500" style={{ width: `${pct1}%` }} />
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono">Geekbench 6: {p1.geek}</div>
        </div>
      ),
      v2: (
        <div className="space-y-1">
          <div className="font-black text-[#c084fc] text-sm sm:text-base">{p2.antutu.toLocaleString('en-IN')} Pts</div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#c084fc] rounded-full transition-all duration-500" style={{ width: `${pct2}%` }} />
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono">Geekbench 6: {p2.geek}</div>
        </div>
      ),
    },
    {
      icon: <Tv className="w-4 h-4 text-[#00f2fe]" />,
      title: '5. DISPLAY, REFRESH & NITS',
      v1: <div className="text-xs sm:text-sm text-slate-200 font-medium">{p1.display}</div>,
      v2: <div className="text-xs sm:text-sm text-slate-200 font-medium">{p2.display}</div>,
    },
    {
      icon: <Shield className="w-4 h-4 text-[#00e676]" />,
      title: '6. PROTECTION & IP WATERPROOFING',
      v1: <div className="text-xs sm:text-sm text-slate-200 font-medium">{p1.build}</div>,
      v2: <div className="text-xs sm:text-sm text-slate-200 font-medium">{p2.build}</div>,
    },
    {
      icon: <Layers className="w-4 h-4 text-amber-300" />,
      title: '7. RAM & ROM GENERATION (SPEED)',
      v1: <div className="text-xs sm:text-sm text-amber-300 font-bold">{p1.ram}</div>,
      v2: <div className="text-xs sm:text-sm text-amber-300 font-bold">{p2.ram}</div>,
    },
    {
      icon: <Camera className="w-4 h-4 text-[#ff2a85]" />,
      title: '8. REAR CAMERA SENSOR & OIS',
      v1: <div className="text-xs sm:text-sm text-slate-200 font-medium">{p1.cam_rear}</div>,
      v2: <div className="text-xs sm:text-sm text-slate-200 font-medium">{p2.cam_rear}</div>,
    },
    {
      icon: <Video className="w-4 h-4 text-purple-400" />,
      title: '9. FRONT SELFIE CAMERA & VIDEO',
      v1: <div className="text-xs sm:text-sm text-slate-200 font-medium">{p1.cam_front}</div>,
      v2: <div className="text-xs sm:text-sm text-slate-200 font-medium">{p2.cam_front}</div>,
    },
    {
      icon: <Gamepad2 className="w-4 h-4 text-[#00e676]" />,
      title: '10. BGMI FPS & VAPOR CHAMBER COOLING',
      v1: <div className="text-xs sm:text-sm font-bold text-[#00e676]">{p1.gaming}</div>,
      v2: <div className="text-xs sm:text-sm font-bold text-[#00e676]">{p2.gaming}</div>,
    },
    {
      icon: <Radio className="w-4 h-4 text-[#00f2fe]" />,
      title: '11. 5G SA/NSA BANDS (INDIA & GLOBAL)',
      v1: <div className="text-[11px] sm:text-xs text-slate-300">{p1.bands5g}</div>,
      v2: <div className="text-[11px] sm:text-xs text-slate-300">{p2.bands5g}</div>,
    },
    {
      icon: <Wifi className="w-4 h-4 text-cyan-300" />,
      title: '12. WI-FI, BLUETOOTH & NFC',
      v1: <div className="text-[11px] sm:text-xs text-slate-300">{p1.wifi}</div>,
      v2: <div className="text-[11px] sm:text-xs text-slate-300">{p2.wifi}</div>,
    },
    {
      icon: <Layers3 className="w-4 h-4 text-purple-300" />,
      title: '13. AUDIO SPEAKERS & TUNING',
      v1: <div className="text-xs sm:text-sm text-slate-200 font-medium">{p1.audio}</div>,
      v2: <div className="text-xs sm:text-sm text-slate-200 font-medium">{p2.audio}</div>,
    },
    {
      icon: <BatteryCharging className="w-4 h-4 text-amber-400" />,
      title: '14. BATTERY CAPACITY & CHARGER',
      v1: <div className="text-xs sm:text-sm font-bold text-amber-300">{p1.battery}</div>,
      v2: <div className="text-xs sm:text-sm font-bold text-amber-300">{p2.battery}</div>,
    },
    {
      icon: <Smartphone className="w-4 h-4 text-[#00f2fe]" />,
      title: '15. OPERATING SYSTEM & UPDATES',
      v1: <div className="text-xs sm:text-sm text-[#00f2fe] font-semibold">{p1.os}</div>,
      v2: <div className="text-xs sm:text-sm text-[#c084fc] font-semibold">{p2.os}</div>,
    },
    {
      icon: <Award className="w-4 h-4 text-amber-400" />,
      title: '16. EXPERT VERDICT & BUY ADVICE',
      v1: <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-[#00e676] font-bold text-xs leading-relaxed">{p1.verdict}</div>,
      v2: <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-[#00f2fe] font-bold text-xs leading-relaxed">{p2.verdict}</div>,
    },
  ], [p1, p2, pct1, pct2]);

  return (
    <section id="compareSection" className="space-y-4 sm:space-y-6 pt-2 w-full">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto px-2 space-y-1">
        <span className="text-xs font-black text-[#00f2fe] uppercase tracking-wider inline-flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-[#00f2fe]" /> 16-Point Hardware Specifications Matrix ({phoneKeys.length}+ Devices Database)
        </span>
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
          Complete A-to-Z <span className="grad-text">Smartphone Comparator</span>
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Compare across {phoneKeys.length}+ of the latest flagship, mid-range, and budget smartphones with zero horizontal scrolling! Compare processors, real AnTuTu scores, camera sensors, and 5G bands seamlessly.
        </p>
      </div>

      {/* Sticky Device Selector Bar */}
      <div className="glass-card rounded-2xl p-3 sm:p-4 border border-cyan-500/30 shadow-xl sticky top-16 z-30 w-full bg-[#090d18]/95 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 items-center w-full">
          
          <div className="min-w-0">
            <label htmlFor="selectPhone1" className="block text-[10px] sm:text-xs font-black text-[#00f2fe] uppercase mb-1 truncate flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> Device 1 (Left)
            </label>
            <select
              id="selectPhone1"
              value={phone1Key}
              onChange={(e) => setPhone1Key(e.target.value)}
              className="w-full bg-black border border-[#00f2fe]/60 rounded-xl px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-black text-white cursor-pointer outline-none truncate shadow-inner focus:ring-1 focus:ring-[#00f2fe]"
            >
              {brandGroups.map((group) => (
                <optgroup key={group.label} label={group.label} className="bg-slate-900 text-[#00f2fe] font-bold">
                  {group.keys.map((k) => (
                    <option key={k} value={k} className="bg-black text-white font-medium">
                      {phones[k].name} ({phones[k].price.split('(')[0].trim()})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="selectPhone2" className="block text-[10px] sm:text-xs font-black text-[#c084fc] uppercase mb-1 truncate flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> Device 2 (Right)
            </label>
            <select
              id="selectPhone2"
              value={phone2Key}
              onChange={(e) => setPhone2Key(e.target.value)}
              className="w-full bg-black border border-purple-400/60 rounded-xl px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-black text-white cursor-pointer outline-none truncate shadow-inner focus:ring-1 focus:ring-purple-400"
            >
              {brandGroups.map((group) => (
                <optgroup key={group.label} label={group.label} className="bg-slate-900 text-purple-300 font-bold">
                  {group.keys.map((k) => (
                    <option key={k} value={k} className="bg-black text-white font-medium">
                      {phones[k].name} ({phones[k].price.split('(')[0].trim()})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Comparison Grid with Centered Spec Icons */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-white/15 shadow-2xl space-y-4 sm:space-y-5 w-full">
        {specRows.map((spec, i) => (
          <div key={i} className="space-y-2 w-full min-w-0">
            
            {/* Center Spec Badge */}
            <div className="spec-divider">
              <div className="px-3 sm:px-4 py-1 rounded-full bg-slate-900 border border-cyan-500/30 flex items-center gap-2 text-[10px] sm:text-xs font-black tracking-wide text-slate-200 shadow-md">
                {spec.icon}
                <span>{spec.title}</span>
              </div>
            </div>

            {/* Spec Values Columns */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center w-full">
              <div className="p-3 sm:p-4 rounded-2xl bg-black/55 border border-white/10 text-xs sm:text-sm flex flex-col justify-center min-w-0 overflow-hidden break-words">
                {spec.v1}
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-black/55 border border-white/10 text-xs sm:text-sm flex flex-col justify-center min-w-0 overflow-hidden break-words">
                {spec.v2}
              </div>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
};
