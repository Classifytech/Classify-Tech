import React, { useState, useEffect } from 'react';
import {
  Scale,
  X,
  Shield,
  FileText,
  DollarSign,
  Award,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Lock,
  Server,
  EyeOff,
  ExternalLink,
  HelpCircle,
  Check,
} from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: 'terms' | 'privacy' | 'affiliate' | 'editorial';
  onClose: () => void;
  onOpenContact: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
  onOpenContact,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'affiliate' | 'editorial'>(initialTab);

  // Synchronize active tab whenever initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="glass-card max-w-4xl w-full rounded-3xl border border-cyan-400/40 overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col bg-slate-950/95">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-[#00f2fe] flex items-center justify-center text-lg shrink-0 border border-cyan-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-base sm:text-xl font-black text-white">
                CLASSIFY TECH • Legal Policies & Privacy Transparency
              </h2>
              <p className="text-xs text-slate-400">
                Official terms of use, smart affiliate link shortener policies, DPDP Act 2023 / GDPR data transparency, and merchant disclosures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Legal Modal"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#00f2fe] hover:text-black text-white flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-3 sm:px-6 pt-3 bg-slate-900/90 border-b border-white/10 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#00f2fe] text-black shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> 1. Terms & Conditions
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#00f2fe] text-black shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> 2. Privacy Policy & Data
          </button>

          <button
            onClick={() => setActiveTab('affiliate')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'affiliate'
                ? 'bg-[#00f2fe] text-black shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> 3. Affiliate & Commercial Disclosure
          </button>

          <button
            onClick={() => setActiveTab('editorial')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'editorial'
                ? 'bg-[#00f2fe] text-black shadow-lg'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> 4. Editorial Standards & Grievances
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-7 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          {/* =================================================================== */}
          {/* TAB 1: TERMS & CONDITIONS */}
          {/* =================================================================== */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#00f2fe]">
                    Terms and Conditions of Use (Terms of Service)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Governing access to CLASSIFY TECH website, tools, comparator, and affiliate shortener
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                    Effective: 2026 Edition
                  </span>
                </div>
              </div>

              <p className="text-slate-300">
                Welcome to <strong>CLASSIFY TECH</strong> (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;, or the &quot;Platform&quot;). By visiting, browsing, accessing, or utilizing this website and its accompanying utilities—including our <strong>Smart Affiliate Link Generator & Shortener</strong>, <strong>16-Point Smartphone Comparator</strong> (116+ devices), <strong>Flagship Photography Showcase</strong>, <strong>Universal Loot Hub</strong>, and <strong>Syndicated Tech News</strong>—you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions. If you do not agree to these terms, you must discontinue using the Platform immediately.
              </p>

              {/* CLAUSE 1: AFFILIATE LINK SHORTENER SPECIAL TERMS */}
              <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/25 border border-cyan-400/40 space-y-3.5 shadow-lg">
                <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wide">
                  <Link2 className="w-4 h-4 text-[#00f2fe]" />
                  <span>1. Smart Affiliate Link Generator & Redirection Service Policy</span>
                </div>
                
                <p className="text-slate-300 text-xs sm:text-sm">
                  CLASSIFY TECH provides a specialized link-shortening and redirection utility designed for creators, digital marketers, social publishers, and online shoppers. This utility enables users to convert long e-commerce links into clean, HTTPS-shortened URLs with current domain routing. Use of this service is governed by the following mandatory conditions:
                </p>

                <div className="space-y-3 pl-1">
                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00e676]" />
                      <span>Strict 4-Store Verification Whitelist</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Our shortener operates with a strict domain whitelist limited exclusively to genuine retail product and deal pages from four verified platforms in India: <strong>Amazon India</strong> (<code className="text-[#00f2fe]">amazon.in</code>, <code className="text-[#00f2fe]">amzn.to</code>, <code className="text-[#00f2fe]">amzn.in</code>), <strong>Flipkart</strong> (<code className="text-[#00f2fe]">flipkart.com</code>, <code className="text-[#00f2fe]">fkrt.it</code>, <code className="text-[#00f2fe]">dl.flipkart.com</code>), <strong>Myntra</strong> (<code className="text-[#00f2fe]">myntra.com</code>), and <strong>Meesho</strong> (<code className="text-[#00f2fe]">meesho.com</code>). All other web domains, arbitrary URL shorteners, personal websites, and unverified hosts are instantly rejected by our security validation filters to prevent cloaking and abuse.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <Lock className="w-3.5 h-3.5 text-[#00e676]" />
                      <span>Zero Tag Hijacking Guarantee (Creator Rights Protection)</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      We strictly enforce a <strong>Zero Tag Hijacking Policy</strong>. When a creator or marketer shortens a link containing their own affiliate tracking tags (such as an Amazon Associate <code className="text-[#00f2fe]">tag=</code>, Flipkart <code className="text-[#00f2fe]">affid=</code>, Myntra <code className="text-[#00f2fe]">utm_source=</code> / <code className="text-[#00f2fe]">affiliateId=</code>, or Meesho <code className="text-[#00f2fe]">ref=</code>), CLASSIFY TECH preserves your tracking credentials intact. We <strong>never strip, modify, replace, or overwrite</strong> your creator tags. All commissions generated via your shortened links belong 100% to you under your direct merchant affiliate agreement.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unaffiliated Link Processing & Platform Fallback</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      If a user inputs a standard, non-affiliate product link devoid of any referral tracking parameters, CLASSIFY TECH may attach platform partner affiliate tags to the destination URL. This practice helps subsidize server hosting, SSL certificates, database maintenance, and free public availability of this tool at zero cost to buyers or creators.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <ExternalLink className="w-3.5 h-3.5 text-[#00f2fe]" />
                      <span>Transparent HTTP 302 Redirection & Ad-Free Guarantee</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      All shortened URLs generated by CLASSIFY TECH (e.g. <code className="text-[#00f2fe]">https://domain/s/:code</code> or <code className="text-[#00f2fe]">https://domain/:code</code>) execute a direct, temporary HTTP 302 redirect directly to the verified destination retailer. We guarantee <strong>zero intermediate ad screens, zero paywalls, zero captcha gates, zero countdown timers, zero forced browser extensions, and zero deceptive cloaking</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Link Storage, Persistence & Click Analytics</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Shortened link mappings are stored in our secure server repository (<code className="text-[#00f2fe]">shortlinks.json</code>) with collision-free 6-character alphanumeric identifiers. Real-time click counts increment automatically upon each valid redirect. We endeavor to maintain short links permanently, but reserve the right to archive or prune dormant links that receive zero clicks over any continuous 12-month period, or links that target discontinued or delisted merchant items.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-rose-500/25 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-rose-400 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Prohibited Uses, Rate Limits & Anti-Abuse Standards</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Users agree not to utilize our link shortener for spamming, automated bulk script-flooding, phishing, malware propagation, misleading or deceptive promotional claims, or distributing links to counterfeit or contraband goods. We enforce automated rate limits (maximum 20 link creations per minute per IP) and strict Server-Side Request Forgery (SSRF) filters preventing loopback probing. We reserve the absolute right to deactivate, block, or delete any shortcode and blacklist any IP violating these rules.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Compliance with Merchant Operating Agreements</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Users shortening affiliate links are independently responsible for complying with all applicable merchant affiliate policies, including the <strong>Amazon Associates Program Operating Agreement</strong>, <strong>Flipkart Affiliate Policy</strong>, <strong>Myntra Affiliate Program Rules</strong>, and <strong>Meesho Partner Guidelines</strong>. CLASSIFY TECH acts exclusively as a technical URL shortening utility and is not liable for merchant commission reversals, cookie attribution drops, or user affiliate account actions taken by external retail platforms.
                    </p>
                  </div>
                </div>
              </div>

              {/* CLAUSE 2: THIRD-PARTY MERCHANTS */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>2. Third-Party E-Commerce & Merchant Disclaimers</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  CLASSIFY TECH is an independent digital media publication and technology comparison utility. We are <strong>not an online seller, retailer, distributor, or merchant</strong>. All orders, payments, shipments, deliveries, warranties, cancellations, customer support, and returns are handled exclusively by the respective third-party merchant (Amazon India, Flipkart, Myntra, or Meesho) under their individual terms of sale. CLASSIFY TECH assumes zero legal or financial liability for defective products, delivery delays, stock discrepancies, price adjustments, or transactional disputes arising on external retail websites.
                </p>
              </div>

              {/* CLAUSE 3: COMPARATOR & BENCHMARKS */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#00f2fe]" />
                  <span>3. 16-Point Hardware Comparison Data & Empirical Benchmarks</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Our 16-point smartphone comparator aggregates verified empirical measurements (AnTuTu v10, Geekbench 6, DxOMark, fast-charging wattage, sustained thermals) alongside official manufacturer technical specifications across 116+ smartphones. While our editorial team rigorously audits all specifications, manufacturer revisions, carrier variations, software updates, and promotional pricing fluctuate dynamically over time. All comparison data, verdict scores, and specifications are provided for consumer guidance and educational reference without express or implied warranty.
                </p>
              </div>

              {/* CLAUSE 4: CAMERA GALLERY & SHOWCASE */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>4. Flagship Photography Showcase & Image Curation</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Camera comparison samples, interactive split-sliders, and nightography crops are compiled for qualitative photographic evaluation across various lighting scenarios. Sensor specifications (e.g. 1-inch Sony LYT-900, 200MP Samsung ISOCELL HP2, periscope telephoto lenses) reflect manufacturer hardware configurations.
                </p>
              </div>

              {/* CLAUSE 5: INTELLECTUAL PROPERTY & NEWS */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>5. Intellectual Property, RSS News Feeds & Copyright Attribution</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Original editorial articles, comparator database architecture, comparison rating algorithms, photography curation, and platform code are the proprietary intellectual property of CLASSIFY TECH. Syndicated technology headlines, excerpts, and feed metadata imported via RSS feeds belong strictly to their respective original publishers (including GSMArena, The Verge, 9to5Google, Android Authority, and Gadgets 360) and are displayed with source attribution and direct links. For copyright inquiries or DMCA notices, email our Grievance Desk at <strong className="text-white">Classifytechz@gmail.com</strong>.
                </p>
              </div>

              {/* CLAUSE 6: USER CONDUCT & PROHIBITED ACTIONS */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>6. Platform Integrity & Prohibited Actions</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  You agree not to decompile, reverse-engineer, attempt unauthorized access to server files, execute automated denial-of-service (DDoS) attacks, scrape server endpoints with abusive concurrency, or bypass rate-limiting controls. Any attempt to exploit, tamper with, or compromise our link shortener or comparison infrastructure will result in immediate IP banning and necessary legal reporting.
                </p>
              </div>

              {/* CLAUSE 7: LIMITATION OF LIABILITY */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>7. Disclaimer of Warranties & Limitation of Liability</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  CLASSIFY TECH is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express, implied, or statutory. To the fullest extent permissible by applicable law, CLASSIFY TECH disclaims all liability for any direct, indirect, incidental, special, consequential, or punitive damages arising from your access to or inability to use the platform, including any short link redirection interruptions or merchant order discrepancies.
                </p>
              </div>

              {/* CLAUSE 8: GOVERNING LAW */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#00f2fe]" />
                  <span>8. Governing Law, Jurisdiction & Dispute Redressal</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  These Terms of Service are governed by and construed in accordance with the laws of India, including the Information Technology Act, 2000, and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. Any dispute arising under these terms shall be subject to the exclusive jurisdiction of the competent courts in India.
                </p>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 2: PRIVACY POLICY & DATA PROCESSING NOTICE */}
          {/* =================================================================== */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#00f2fe]">
                    Privacy Policy & Data Processing Notice
                  </h3>
                  <p className="text-xs text-slate-400">
                    Transparent privacy practices compliant with India&apos;s DPDP Act 2023, IT Act 2000, GDPR & CCPA
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    DPDP Act 2023 Compliant
                  </span>
                </div>
              </div>

              <p className="text-slate-300">
                At <strong>CLASSIFY TECH</strong>, we respect your privacy and enforce rigorous data transparency. We believe you have a fundamental right to know what information is handled when using our site. This policy outlines our data engineering practices across our <strong>Affiliate Link Shortener</strong>, <strong>Smartphone Comparator</strong>, <strong>Tech News Aggregator</strong>, and <strong>Contact & Grievance Desks</strong>.
              </p>

              {/* PRIVACY SECTION 1: AFFILIATE LINK SHORTENER DATA PRACTICE */}
              <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/25 border border-cyan-400/40 space-y-3.5 shadow-lg">
                <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wide">
                  <Shield className="w-4 h-4 text-[#00f2fe]" />
                  <span>1. Data Handling Practices for Affiliate Link Generator & Shortener</span>
                </div>

                <p className="text-slate-300 text-xs sm:text-sm">
                  Our Smart Affiliate Link Generator is built with strict privacy-by-design engineering principles:
                </p>

                <div className="space-y-2.5 pl-1">
                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#00e676]" /> Zero Registration & No PII Required
                    </span>
                    <p className="text-slate-300 text-xs">
                      You do not need to create an account, log in, or provide your name, phone number, email address, or payment details to generate shortened affiliate links. The tool is 100% publicly accessible and anonymous.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-cyan-400" /> What We Record in Server Storage
                    </span>
                    <p className="text-slate-300 text-xs">
                      When a link is shortened, the server records only: (1) the randomized 6-character shortcode, (2) the original submitted URL, (3) the verified affiliate destination URL with tracking tags intact, (4) the retailer identifier (Amazon, Flipkart, Myntra, or Meesho), (5) creation timestamp, and (6) an aggregate anonymous click counter. We do <strong>not</strong> associate shortcodes with personal identities or user profiles.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-purple-400" /> No Cross-Site Browsing Surveillance
                    </span>
                    <p className="text-slate-300 text-xs">
                      We do not place tracking pixels, spyware, or cross-domain tracking beacons on short links. Once a visitor is redirected to Amazon, Flipkart, Myntra, or Meesho, CLASSIFY TECH has zero visibility into what products the user views, adds to cart, or purchases on the merchant&apos;s website.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" /> Ephemeral Anti-Abuse Rate-Limiting
                    </span>
                    <p className="text-slate-300 text-xs">
                      To protect our server infrastructure from bot floods and DDoS attacks, a temporary, hashed IP counter is held in volatile server memory for 60 seconds (rate limit: 20 calls/min). This ephemeral record is automatically purged, is never saved to disk, and is never used for commercial profiling.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Client-Side Local Storage (<code className="text-[#00f2fe]">localStorage</code>)
                    </span>
                    <p className="text-slate-300 text-xs">
                      For your convenience, your last 5 generated links are saved in your device&apos;s browser memory under key <code className="text-[#00f2fe]">classify_affiliate_history</code>. This information lives entirely on your personal device, is never synced to any analytics server, and can be cleared instantly via the in-app &quot;Clear All&quot; button or by clearing your browser cache.
                    </p>
                  </div>
                </div>
              </div>

              {/* PRIVACY SECTION 2: OUTBOUND MERCHANT COOKIES */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>2. Outbound E-Commerce Merchant Cookies & Tracking</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  When you click on any outbound store link, short redirect link, or Universal Loot Hub deal card, you are redirected to an external retailer (Amazon India, Flipkart, Myntra, or Meesho). Those third-party platforms deploy their own first-party and third-party cookies (such as session cookies, cart cookies, and affiliate attribution tags) governed by their respective privacy statements. We encourage users to inspect each retailer&apos;s privacy policies when shopping.
                </p>
              </div>

              {/* PRIVACY SECTION 3: COMPARATOR & NEWS DATA */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>3. Comparator, Camera Showcase & Tech News Data Practices</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Smartphone comparisons, filter queries, and custom user device additions are processed entirely in client-side browser memory (<code className="text-[#00f2fe]">localStorage</code> key <code className="text-[#00f2fe]">classify_custom_phones_db</code>). No comparison history or hardware queries are transmitted or logged on our servers. Our tech news aggregator fetches public RSS feeds and caches articles server-side without recording reader IPs or reading patterns.
                </p>
              </div>

              {/* PRIVACY SECTION 4: CONTACT & FACT-CHECK SUBMISSIONS */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#00f2fe]" />
                  <span>4. Contact Desk & Editorial Corrections Data</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  When you submit an inquiry through our Contact Form or file a specification correction via the Editorial Desk, we collect your name, email address, topic category, and message text solely to evaluate your submission, verify technical data, and reply to you. We maintain a strict zero-spam guarantee: your contact information is never sold, rented, leased, or distributed to marketing brokers or third-party mailing lists.
                </p>
              </div>

              {/* PRIVACY SECTION 5: ADVERTISING & ANALYTICS NOTICE */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-purple-400" />
                  <span>5. Advertising & Behavioral Cookies Status Notice</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Google AdSense, third-party behavioral advertising networks, and cross-site tracking beacons are <strong>currently not active or integrated</strong> on CLASSIFY TECH. If behavioral advertising or third-party analytical cookies are integrated in the future, this privacy statement will be updated with explicit cookie consent banners and granular opt-out controls prior to activation.
                </p>
              </div>

              {/* PRIVACY SECTION 6: DATA SECURITY */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>6. Technical Data Security & Infrastructure Safeguards</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  We employ industry-standard technical measures to safeguard data against unauthorized access, loss, or alteration: full HTTPS (TLS 1.3) encryption in transit, strict Server-Side Request Forgery (SSRF) validation filters, input sanitization against cross-site scripting (XSS), rate-limiting barriers, and write-locked local server file storage.
                </p>
              </div>

              {/* PRIVACY SECTION 7: USER RIGHTS & GRIEVANCE OFFICER */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00e676]" />
                  <span>7. User Data Rights & Designated Grievance Officer (DPDP Act, 2023)</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  In compliance with the <strong>Digital Personal Data Protection Act, 2023 (India)</strong>, <strong>IT Rules 2021</strong>, and global standards (GDPR/CCPA), you retain the right to: (1) confirm whether your personal contact information is processed, (2) request access to or a summary of such data, (3) request correction or updating of inaccurate data, and (4) request permanent erasure of your contact submission records.
                </p>
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs space-y-1">
                  <p className="text-white font-bold">Designated Grievance Redressal Officer:</p>
                  <p className="text-slate-300">Editorial Compliance Desk • CLASSIFY TECH</p>
                  <p className="text-slate-300">
                    Official Email: <strong className="text-[#00f2fe]">Classifytechz@gmail.com</strong>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Response Time: Written acknowledgment within 24–48 hours; grievance resolution within 15 working days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 3: AFFILIATE & COMMERCIAL DISCLOSURE */}
          {/* =================================================================== */}
          {activeTab === 'affiliate' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#00f2fe]">
                    FTC & Retail Affiliate Transparency Disclosure
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compliant with FTC 16 CFR § 255 & ASCI Code for Self-Regulation in Advertising
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    100% Disclosure Transparent
                  </span>
                </div>
              </div>

              <p className="text-slate-300">
                In strict adherence to the Federal Trade Commission (FTC) guidelines, the Advertising Standards Council of India (ASCI), and our retail affiliate partner rules, please review our comprehensive commercial and affiliate disclosures.
              </p>
              
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 space-y-2">
                <h4 className="font-bold text-[#00e676] text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
                  <span>1. Curated Platform Loot Hub & Outbound Store Links</span>
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm">
                  When you click on deal slots featured in our curated Universal Loot Hub or platform product links to supported retailers (Amazon India, Flipkart, Myntra, or Meesho), the platform operator may earn a small referral commission if you complete a qualifying purchase. This occurs at <strong>absolutely zero additional cost to you</strong>; product prices remain identical to buying directly from the store.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#00f2fe]" />
                  <span>2. Smart Affiliate Link Generator (Creator Independence)</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  When creators or digital publishers utilize our Smart Link Generator to shorten their own product links, CLASSIFY TECH provides the redirection infrastructure without modifying the user&apos;s affiliate tags. Any commissions earned through user-shortened links belong 100% to the respective user under their independent affiliate account with the merchant.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>3. Editorial Autonomy & Unbiased Benchmarking</span>
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Our hardware comparisons, benchmark rankings, camera sample appraisals, and technology news reporting remain 100% editorially independent. We do not accept paid manufacturer ranking placements or manipulate AnTuTu/Geekbench ratings for affiliate incentives.
                </p>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 4: EDITORIAL & GRIEVANCE */}
          {/* =================================================================== */}
          {activeTab === 'editorial' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#00f2fe]">
                    Editorial Standards & Fact-Checking Policy
                  </h3>
                  <p className="text-xs text-slate-400">
                    Independent technology journalism, specification testing & prompt corrections
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                    Independent Journalism
                  </span>
                </div>
              </div>

              <p className="text-slate-300">
                CLASSIFY TECH is committed to accurate technology reporting, transparent specification comparison across 16 hardware criteria, and prompt public corrections.
              </p>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#00f2fe]" />
                  <span>Editorial Grievance & Corrections Channel</span>
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm">
                  If you identify an outdated retail price, a typographical error in processor specifications, an attribution update request, or a copyright concern, please inform our editorial desk.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenContact();
                    }}
                    className="grad-btn px-4 py-2 rounded-xl text-xs font-black cursor-pointer inline-flex items-center gap-1.5 text-black"
                  >
                    <Mail className="w-3.5 h-3.5 text-black" /> Open Contact & Grievance Desk
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenContact();
            }}
            className="text-xs text-[#00f2fe] hover:underline font-bold cursor-pointer"
          >
            Need Help? Contact Help Desk →
          </button>
          <button
            onClick={onClose}
            className="grad-btn px-5 py-2 rounded-xl text-xs font-black cursor-pointer text-black"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
};

