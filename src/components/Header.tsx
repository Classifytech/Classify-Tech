import React, { useState } from 'react';
import { Newspaper, Camera, Flame, Scale, Link as LinkIcon, Mail, Menu, X, Heart, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  favoritesCount?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenContact: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  favoritesCount = 0,
  theme = 'dark',
  onToggleTheme,
  onOpenContact,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-40 glass-card border-b px-3.5 sm:px-8 py-3 w-full backdrop-blur-xl transition-colors duration-200 ${theme === 'light' ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-[#06080f]/90 border-cyan-500/20 text-slate-100'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center gap-2.5 min-w-0 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] via-[#8a2be2] to-[#ff2a85] flex items-center justify-center font-black text-black text-sm sm:text-base shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition shrink-0">
            CT
          </div>
          <div className="min-w-0">
            <div className={`font-black text-base sm:text-xl tracking-tight leading-none truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              CLASSIFY <span className="grad-text">TECH</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-[#00f2fe] mt-0.5 truncate tracking-wide">
              @classifytech • Worldwide Tech & Hardware Hub
            </div>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <a
            href="#techNewsSection"
            className="px-3 py-1.5 rounded-xl hover:bg-cyan-500/10 hover:text-[#00f2fe] transition flex items-center gap-1.5"
          >
            <Newspaper className="w-3.5 h-3.5 text-[#00f2fe]" /> Tech News & Blog
          </a>

          <a
            href="#favoritesSection"
            className="px-3 py-1.5 rounded-xl hover:bg-pink-500/10 hover:text-[#ff2a85] transition flex items-center gap-1.5 group"
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'fill-[#ff2a85] text-[#ff2a85]' : 'text-[#ff2a85]'}`} />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#ff2a85] text-white text-[10px] font-black shadow-sm group-hover:scale-105 transition">
                {favoritesCount}
              </span>
            )}
          </a>

          <a
            href="#photoSection"
            className="px-3 py-1.5 rounded-xl hover:bg-cyan-500/10 hover:text-[#00f2fe] transition flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-[#ff2a85]" /> Camera Portfolio
          </a>

          <a
            href="#lootSection"
            className="px-3 py-1.5 rounded-xl hover:bg-cyan-500/10 hover:text-[#00e676] transition flex items-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5 text-[#00e676]" /> Loot Deals
          </a>

          <a
            href="#compareSection"
            className="px-3 py-1.5 rounded-xl hover:bg-cyan-500/10 hover:text-[#c084fc] transition flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5 text-[#c084fc]" /> 16-Point Compare
          </a>

          <a
            href="#quickLinkMakerSlot"
            className="px-3 py-1.5 rounded-xl hover:bg-cyan-500/10 hover:text-[#00f2fe] transition flex items-center gap-1.5"
          >
            <LinkIcon className="w-3.5 h-3.5 text-[#00f2fe]" /> Smart Link Tool
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* High-Contrast Theme Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'high-contrast light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'High-Contrast Light' : 'Dark'} Mode`}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 hover:text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-amber-300">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="hidden sm:inline text-slate-700">Dark Mode</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenContact}
            className="px-3 sm:px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/40 hover:bg-cyan-500/25 text-[#00f2fe] font-extrabold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Help & Contact</span>
            <span className="sm:hidden">Help</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-150">
          <a
            href="#techNewsSection"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2.5 rounded-xl bg-white/5 text-slate-200 hover:text-[#00f2fe] hover:bg-cyan-500/10 flex items-center gap-2"
          >
            <Newspaper className="w-4 h-4 text-[#00f2fe]" /> Tech News
          </a>

          <a
            href="#photoSection"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2.5 rounded-xl bg-white/5 text-slate-200 hover:text-[#ff2a85] hover:bg-pink-500/10 flex items-center gap-2"
          >
            <Camera className="w-4 h-4 text-[#ff2a85]" /> Camera Portfolio
          </a>

          <a
            href="#lootSection"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2.5 rounded-xl bg-white/5 text-slate-200 hover:text-[#00e676] hover:bg-emerald-500/10 flex items-center gap-2"
          >
            <Flame className="w-4 h-4 text-[#00e676]" /> Loot Deals
          </a>

          <a
            href="#compareSection"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2.5 rounded-xl bg-white/5 text-slate-200 hover:text-[#c084fc] hover:bg-purple-500/10 flex items-center gap-2"
          >
            <Scale className="w-4 h-4 text-[#c084fc]" /> 16-Spec Compare
          </a>

          {onToggleTheme && (
            <button
              type="button"
              onClick={() => {
                onToggleTheme();
                setMobileMenuOpen(false);
              }}
              className="col-span-2 p-2.5 rounded-xl bg-white/10 border border-white/15 text-slate-200 hover:text-white flex items-center justify-center gap-2 font-bold cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300">Switch to Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-cyan-600" />
                  <span className="text-slate-800">Switch to Dark Mode</span>
                </>
              )}
            </button>
          )}

          <a
            href="#favoritesSection"
            onClick={() => setMobileMenuOpen(false)}
            className="col-span-2 p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-[#ff2a85] hover:bg-pink-500/20 flex items-center justify-center gap-2 font-bold"
          >
            <Heart className="w-4 h-4 fill-[#ff2a85] text-[#ff2a85]" />
            <span>My Favorites {favoritesCount > 0 ? `(${favoritesCount})` : ''}</span>
          </a>

          <a
            href="#quickLinkMakerSlot"
            onClick={() => setMobileMenuOpen(false)}
            className="col-span-2 p-2.5 rounded-xl bg-white/5 text-slate-200 hover:text-[#00f2fe] hover:bg-cyan-500/10 flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-4 h-4 text-[#00f2fe]" /> Smart Link Generator
          </a>
        </div>
      )}
    </header>
  );
};
