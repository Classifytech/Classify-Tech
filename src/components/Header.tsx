import React, { useState } from 'react';
import { Newspaper, Camera, Scale, Mail, Menu, X, Heart, Sun, Moon, Link2 } from 'lucide-react';

interface HeaderProps {
  favoritesCount?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenContact: () => void;
  onOpenLinkMaker?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  favoritesCount = 0,
  theme = 'dark',
  onToggleTheme,
  onOpenContact,
  onOpenLinkMaker,
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

        {/* Desktop Navigation Links (3D Tactile Pills) */}
        <nav className="hidden lg:flex items-center gap-2 text-xs font-bold">
          <a
            href="#techNewsSection"
            className="pill-3d px-3.5 py-1.5 rounded-xl text-slate-200 hover:text-[#00f2fe] flex items-center gap-1.5"
          >
            <Newspaper className="w-3.5 h-3.5 text-[#00f2fe]" /> Tech News &amp; Blog
          </a>

          <a
            href="#favoritesSection"
            className="pill-3d px-3.5 py-1.5 rounded-xl text-slate-200 hover:text-[#ff2a85] flex items-center gap-1.5 group"
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
            className="pill-3d px-3.5 py-1.5 rounded-xl text-slate-200 hover:text-[#ff2a85] flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-[#ff2a85]" /> Camera Portfolio
          </a>

          <a
            href="#compareSection"
            className="pill-3d px-3.5 py-1.5 rounded-xl text-slate-200 hover:text-[#c084fc] flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5 text-[#c084fc]" /> 16-Point Compare
          </a>

          {onOpenLinkMaker && (
            <button
              type="button"
              onClick={onOpenLinkMaker}
              className="pill-3d px-3.5 py-1.5 rounded-xl text-[#00f2fe] hover:text-white flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <Link2 className="w-3.5 h-3.5 text-[#00f2fe]" /> Smart Link Maker
            </button>
          )}
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
              className={`pill-3d px-2.5 sm:px-3 py-2 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                theme === 'light'
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-amber-300">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="hidden sm:inline text-slate-800">Dark Mode</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenContact}
            className="pill-3d px-3 sm:px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-[#00f2fe] hover:text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Help &amp; Contact</span>
            <span className="sm:hidden">Help</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className={`lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer pill-3d ${
              theme === 'light' ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-white/10 text-white'
            }`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu (Clean, neatly aligned, non-redundant) */}
      {mobileMenuOpen && (
        <div className={`lg:hidden mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-150 ${
          theme === 'light' ? 'border-slate-200' : 'border-white/10'
        }`}>
          <a
            href="#techNewsSection"
            onClick={() => setMobileMenuOpen(false)}
            className={`p-2.5 rounded-xl pill-3d flex items-center gap-2 ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-200'
            }`}
          >
            <Newspaper className="w-4 h-4 text-[#00f2fe]" /> Tech News
          </a>

          <a
            href="#photoSection"
            onClick={() => setMobileMenuOpen(false)}
            className={`p-2.5 rounded-xl pill-3d flex items-center gap-2 ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4 text-[#ff2a85]" /> Camera Portfolio
          </a>

          <a
            href="#compareSection"
            onClick={() => setMobileMenuOpen(false)}
            className={`p-2.5 rounded-xl pill-3d flex items-center gap-2 ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4 text-[#c084fc]" /> 16-Spec Compare
          </a>

          <a
            href="#favoritesSection"
            onClick={() => setMobileMenuOpen(false)}
            className={`p-2.5 rounded-xl pill-3d flex items-center gap-2 ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4 fill-[#ff2a85] text-[#ff2a85]" />
            <span>Favorites {favoritesCount > 0 ? `(${favoritesCount})` : ''}</span>
          </a>

          {onOpenLinkMaker && (
            <button
              type="button"
              onClick={() => {
                onOpenLinkMaker();
                setMobileMenuOpen(false);
              }}
              className="col-span-2 p-2.5 rounded-xl pill-3d bg-cyan-500/15 border-cyan-400/30 text-[#00f2fe] flex items-center justify-center gap-2 font-bold cursor-pointer"
            >
              <Link2 className="w-4 h-4 text-[#00f2fe]" />
              <span>Smart Link Maker</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
