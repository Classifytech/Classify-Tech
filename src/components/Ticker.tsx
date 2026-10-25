import React from 'react';
import { Radio } from 'lucide-react';

export const Ticker: React.FC = () => {
  return (
    <div className="ticker-bar bg-slate-100 dark:bg-[#070b14] border-b border-slate-200 dark:border-cyan-500/25 py-2 px-3 flex items-center gap-2.5 w-full max-w-full overflow-hidden">
      <div className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-[#ff2a85] to-[#8a2be2] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
        <Radio className="w-3 h-3 animate-pulse" /> LIVE WIRE
      </div>

      <div className="w-full overflow-hidden relative min-w-0">
        <div className="ticker-track gap-8 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-2">
            🌐 <strong>Qualcomm / MediaTek Flagship Wire:</strong> Snapdragon 8 Elite & Dimensity 9400 next-gen flagships exceed 2.85M points on AnTuTu v10!
          </span>
          <span className="inline-flex items-center gap-2">
            🇮🇳 <strong>Xiaomi India Release:</strong> Stable HyperOS 2.0 (Android 15) rollout arrives on POCO F6 5G, POCO X6 Pro & Redmi Note 14 Pro+.
          </span>
          <span className="inline-flex items-center gap-2">
            📸 <strong>Flagship Camera Showcase:</strong> High-resolution optical samples with Sony IMX920 & LYT-808 sensors published below!
          </span>
          <span className="inline-flex items-center gap-2">
            ⚡ <strong>Universal Loot Hub:</strong> Verified direct retail price cuts live on POCO X6 Pro 5G and iQOO Neo 9 Pro.
          </span>
          <span className="inline-flex items-center gap-2">
            ⚔️ <strong>16-Point Comparator:</strong> Compare processor fabrication, AnTuTu v10, camera OIS, UFS storage & 5G bands without horizontal scrolling!
          </span>
        </div>
      </div>
    </div>
  );
};
