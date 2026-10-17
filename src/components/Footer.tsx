import React from 'react';
import { ShieldCheck, Mail, Youtube, Instagram, Send, Shield, Twitter, Facebook } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (tab: 'terms' | 'privacy' | 'affiliate' | 'editorial') => void;
  onOpenContact: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onOpenContact,
  onOpenAdmin,
}) => {
  return (
    <footer className="border-t border-white/10 bg-[#04060b] pt-8 pb-10 px-4 sm:px-8 mt-12 space-y-6 w-full text-center text-xs text-slate-400">
      
      {/* Brand Identity */}
      <div className="max-w-7xl mx-auto space-y-1.5">
        <div className="font-black text-lg sm:text-xl text-white tracking-wide">
          CLASSIFY <span className="grad-text">TECH</span>
        </div>
        <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
          Independent Tech Editorial, Smartphone Camera Photography Evaluations, 16-Point Hardware Comparator & Universal Retail Loot Deal Aggregator.
        </p>
      </div>

      {/* OFFICIAL CHANNELS: YouTube, Instagram, Telegram, Twitter, Threads, and Facebook */}
      <div className="max-w-2xl mx-auto py-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Official Channels
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
          {/* 1. YouTube */}
          <a
            href="https://youtube.com/@classifytech"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 hover:border-red-400 text-slate-300 hover:text-white flex items-center gap-1.5 text-[11px] font-bold transition shadow-sm"
            title="Official YouTube Channel"
          >
            <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>YouTube</span>
          </a>

          {/* 2. Instagram */}
          <a
            href="https://www.instagram.com/classifytechz/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/25 hover:border-pink-400 text-slate-300 hover:text-white flex items-center gap-1.5 text-[11px] font-bold transition shadow-sm"
            title="Official Instagram"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>Instagram</span>
          </a>

          {/* 3. Telegram */}
          <a
            href="https://t.me/ClassifytechGroup"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/25 hover:border-sky-400 text-slate-300 hover:text-white flex items-center gap-1.5 text-[11px] font-bold transition shadow-sm"
            title="Official Telegram Channel"
          >
            <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Telegram</span>
          </a>

          {/* 4. Twitter / X */}
          <a
            href="https://x.com/classifytechz"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-white/15 hover:border-white/40 text-slate-300 hover:text-white flex items-center gap-1.5 text-[11px] font-bold transition shadow-sm"
            title="Official Twitter / X (@classifytechz)"
          >
            <Twitter className="w-3.5 h-3.5 text-slate-200 shrink-0" />
            <span>Twitter</span>
          </a>

          {/* 5. Threads */}
          <a
            href="https://www.threads.net/@classifytechz"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/25 hover:border-purple-400 text-slate-300 hover:text-white flex items-center gap-1.5 text-[11px] font-bold transition shadow-sm"
            title="Official Threads Profile (@classifytechz)"
          >
            <svg
              className="w-3.5 h-3.5 text-purple-300 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.186 24C5.467 24 0 18.533 0 11.814 0 5.095 5.467 0 12.186 0c6.643 0 11.967 5.213 12.062 11.758h-3.411c-.092-4.664-3.897-8.384-8.651-8.384-4.786 0-8.675 3.889-8.675 8.675 0 4.786 3.889 8.675 8.675 8.675 3.498 0 6.516-2.06 7.923-5.048-1.077-.456-2.315-.716-3.642-.716-4.52 0-7.387 2.457-7.387 5.589 0 2.825 2.259 4.887 5.295 4.887 2.404 0 4.417-1.127 5.586-2.883C22.617 22.42 17.777 24 12.186 24zm-.897-10.082c-1.748 0-3.033 1.055-3.033 2.474 0 1.341 1.07 2.222 2.618 2.222 1.83 0 3.327-1.294 3.791-3.268-.934-.897-2.122-1.428-3.376-1.428z" />
            </svg>
            <span>Threads</span>
          </a>

          {/* 6. Facebook */}
          <a
            href="https://www.facebook.com/classifytechz"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-blue-600/10 border border-blue-600/25 hover:border-blue-400 text-slate-300 hover:text-white flex items-center gap-1.5 text-[11px] font-bold transition shadow-sm"
            title="Official Facebook Page (@classifytechz)"
          >
            <Facebook className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Facebook</span>
          </a>
        </div>
      </div>

      {/* LEGAL & CONTACT NAVIGATION - AD-SENSE & TERMS COMPLIANT */}
      <div className="max-w-2xl mx-auto pt-2 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-slate-300">
        <button
          onClick={() => onOpenLegal('terms')}
          className="hover:text-[#00f2fe] transition"
        >
          Terms & Conditions
        </button>
        <span className="text-slate-600">•</span>
        <button
          onClick={() => onOpenLegal('privacy')}
          className="hover:text-[#00f2fe] transition"
        >
          Privacy Policy
        </button>
        <span className="text-slate-600">•</span>
        <button
          onClick={() => onOpenLegal('affiliate')}
          className="hover:text-[#00e676] transition"
        >
          Affiliate Disclosure
        </button>
        <span className="text-slate-600">•</span>
        <button
          onClick={() => onOpenLegal('editorial')}
          className="hover:text-amber-400 transition"
        >
          Editorial Standards
        </button>
        <span className="text-slate-600">•</span>
        <button
          onClick={onOpenContact}
          className="text-[#00f2fe] hover:underline font-extrabold inline-flex items-center gap-1 transition"
        >
          <Mail className="w-3.5 h-3.5" /> Contact Us & Help Desk
        </button>
      </div>

      {/* Copyright & Discreet Admin Gate */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-[#00e676]" />
        <span>&copy; 2026 CLASSIFY TECH. All Rights Reserved. Independent Tech News & Smartphone Comparator.</span>
        <button
          onClick={onOpenAdmin}
          className="opacity-25 hover:opacity-100 transition ml-2 p-1 text-slate-600 hover:text-[#00f2fe] cursor-pointer"
          title="Editorial Console"
          aria-label="Editorial Console"
        >
          <Shield className="w-3.5 h-3.5" />
        </button>
      </div>

    </footer>
  );
};
