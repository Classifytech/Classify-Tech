import React, { useState, useEffect } from 'react';
import {
  Scale,
  X,
  Shield,
  FileText,
  Award,
  Mail,
  Server,
  EyeOff,
  Lock,
  Link2,
  Cloud,
  CheckCircle2,
} from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: 'terms' | 'privacy' | 'editorial';
  onClose: () => void;
  onOpenContact: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
  onOpenContact,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'editorial'>(initialTab);

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
      <div className="glass-card max-w-4xl w-full rounded-3xl border border-cyan-400/40 overflow-hidden shadow-2xl mt-6 sm:mt-auto mb-4 sm:mb-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-950/95">
        
        {/* Header with safe mobile top padding */}
        <div className="p-4 sm:p-6 pt-5 sm:pt-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-[#00f2fe] flex items-center justify-center text-lg shrink-0 border border-cyan-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
              <Scale className="w-5 h-5 text-cyan-600 dark:text-[#00f2fe]" />
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                CLASSIFY TECH • Legal Policies &amp; Privacy Transparency
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Official terms of service, Smart Affiliate Link Studio rules, Google AdSense compliance, and editorial standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Legal Modal"
            className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-[#00f2fe] hover:text-black text-slate-700 dark:text-white flex items-center justify-center transition shrink-0 cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation with 3D Water-Drop Pills */}
        <div className="px-3 sm:px-6 py-3 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 flex gap-2.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-2 cursor-pointer pill-3d ${
              activeTab === 'terms' ? 'pill-3d-active' : ''
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> 1. Terms &amp; Conditions
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-2 cursor-pointer pill-3d ${
              activeTab === 'privacy' ? 'pill-3d-active' : ''
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> 2. Privacy Policy &amp; AdSense
          </button>

          <button
            onClick={() => setActiveTab('editorial')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-2 cursor-pointer pill-3d ${
              activeTab === 'editorial' ? 'pill-3d-active' : ''
            }`}
          >
            <Award className="w-3.5 h-3.5" /> 3. Editorial Standards &amp; Grievances
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-7 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          {/* TAB 1: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#00f2fe]">
                    Terms and Conditions of Use (Terms of Service)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Independent digital tech publication, interactive smartphone comparator, and utility link management tool
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                    Governing Law: India
                  </span>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed">
                Welcome to <strong>CLASSIFY TECH</strong> (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;, or the &quot;Platform&quot;). CLASSIFY TECH is an independent digital media publication, 16-point smartphone hardware comparator, flagship photography showcase, and utility link management tool. By accessing or utilizing any feature of this website, you agree to be bound by these Terms and Conditions. If you do not agree, you must discontinue use immediately.
              </p>

              {/* CLAUSE 1: FAIR DEALING & FAIR USE */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-400/40 space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#00f2fe]" />
                  <span>1. Fair Dealing, Fair Use &amp; Intellectual Property</span>
                </h4>
                <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
                  <p>
                    • <strong>Indian Copyright Act, 1957 (Section 52):</strong> Device hardware specifications, benchmark metrics, camera samples, and syndicated RSS news feeds are compiled under fair dealing principles for private study, research, criticism, review, and reporting of current events.
                  </p>
                  <p>
                    • <strong>U.S. Fair Use Doctrine (17 U.S.C. § 107):</strong> Materials are curated for transformative educational analysis, hardware comparison, and critical appraisal. All trademarks, device names, and brand marks belong exclusively to their respective owners.
                  </p>
                  <p>
                    • <strong>Benchmark Methodology:</strong> Synthetic performance metrics (AnTuTu v10, Geekbench 6, 3DMark) are compiled from manufacturer technical whitepapers and accredited labs. Actual device performance may vary based on ambient temperature, firmware version, and thermal management.
                  </p>
                </div>
              </div>

              {/* CLAUSE 2: NOTICE & TAKEDOWN */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>2. Copyright Notice, Takedown &amp; Section 79 IT Act Intermediary Process</span>
                </h4>
                <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
                  <p>
                    CLASSIFY TECH adheres to intermediary guidelines under <strong>Section 79 of the Information Technology Act, 2000 (India)</strong> and the IT Rules 2021. If you believe any content infringes your intellectual property, submit a written notice to our designated desk:
                  </p>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1">
                    <p className="text-white font-bold">Designated Grievance &amp; Takedown Desk:</p>
                    <p className="text-slate-300">Email: <strong className="text-[#00f2fe]">Classifytechz@gmail.com</strong></p>
                    <p className="text-slate-400 text-[11px]">
                      Target Review: Written acknowledgment within 24–36 business hours; formal resolution or takedown within 15 working days.
                    </p>
                  </div>
                </div>
              </div>

              {/* CLAUSE 3: AFFILIATE DISCLOSURE */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-400/40 space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#00f2fe]" />
                  <span>3. Smart Affiliate Link Studio &amp; Transparent Earnings Disclosure</span>
                </h4>
                <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
                  <p>
                    • <strong>100% Free Service:</strong> CLASSIFY TECH does not charge users any subscription fee or surcharge to use our link tools or comparison suites.
                  </p>
                  <p>
                    • <strong>Affiliate Earnings Disclosure:</strong> CLASSIFY TECH participates in the Amazon Associates Program, Flipkart Affiliate Program, and Myntra Affiliate Program. When you click or generate an affiliate link and make a purchase, CLASSIFY TECH may earn a small referral commission at zero additional cost to you.
                  </p>
                  <p>
                    • <strong>Merchant Disclaimers:</strong> Short links route directly to official merchant product listings. CLASSIFY TECH does not operate retailer storefronts or fulfillment centers, and does not guarantee continuous inventory or real-time retailer pricing parity.
                  </p>
                  <p>
                    • <strong>Prohibited Uses:</strong> Users must not use the link shortening utility for phishing, malware dissemination, spamming, or unsafe URL schemes (<code>javascript:</code>, <code>data:</code>).
                  </p>
                </div>
              </div>

              {/* CLAUSE 4: DISCLAIMER OF WARRANTIES */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                  4. Disclaimer of Warranties &amp; Limitation of Liability
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  CLASSIFY TECH is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. Under no circumstances shall CLASSIFY TECH or its operators be liable for direct, indirect, incidental, or consequential damages resulting from technical specification reliance, merchant order fulfillment, or service latency. Governed by the substantive laws of India.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY & DATA */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#00f2fe]">
                    Privacy Policy &amp; Data Processing Notice
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compliant with DPDP Act 2023 (India), IT Rules 2021, GDPR, and CCPA
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    Zero-Surveillance Architecture
                  </span>
                </div>
              </div>

              {/* SECTION 1: INFORMATION WE COLLECT */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-400/40 space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00f2fe]" />
                  <span>1. Information We Collect (Actual System Audit)</span>
                </h4>
                <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
                  <p>
                    • <strong>Local Browser Storage (Client-Side Only):</strong> Your personal preferences reside exclusively on your device:
                    <br />
                    - <code className="text-[#00f2fe]">classify_affiliate_history</code>: Recent short links for creator convenience.
                    <br />
                    - <code className="text-[#00f2fe]">classify_custom_phones_db</code>: User-added smartphone comparisons.
                    <br />
                    - <code className="text-[#00f2fe]">classify_favorites_articles</code>: Bookmarked tech stories.
                    <br />
                    - <code className="text-[#00f2fe]">classify_theme_mode</code>: Dark/light mode visual preference.
                  </p>
                  <p>
                    • <strong>Voluntary Contact Inquiries:</strong> When submitting an inquiry via our Contact Desk or reporting a story, we collect your name, email address, topic, and message text solely to investigate and reply.
                  </p>
                  <p>
                    • <strong>Server In-Memory Transient Caches:</strong> Temporary caching for RSS feeds (15-min TTL) and Gemini article synthesis (2-hr TTL). No PII is logged.
                  </p>
                  <p>
                    • <strong>Diagnostic Server Records:</strong> Contact submissions (<code className="text-[#00f2fe]">data/contact_messages.json</code>) with 30-day auto-purge; error logs with 7-day auto-purge.
                  </p>
                  <p>
                    • <strong>Zero Persistent Accounts:</strong> No user registration, passwords, or credit card numbers are collected or stored.
                  </p>
                </div>
              </div>

              {/* SECTION 2: LEGAL BASES FOR PROCESSING */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                  2. Legal Bases for Processing
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  We process data under legitimate interests (operating our free hardware comparator and tech publication), explicit user consent (answering voluntary contact inquiries and editorial fact-checks), and compliance with legal obligations under the Information Technology Act, 2000 and DPDP Act, 2023.
                </p>
              </div>

              {/* SECTION 3: ADVERTISING & COOKIES NOTICE */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-purple-400" />
                  <span>3. Advertising &amp; Cookies Notice (Current Pre-Launch Status)</span>
                </h4>
                <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
                  <p>
                    • <strong>Current Status:</strong> CLASSIFY TECH does not currently deploy Google AdSense ad units, DoubleClick DART ad cookies, or third-party ad networks on this pre-launch website. The site is currently ad-free.
                  </p>
                  <p>
                    • <strong>Future Integration Notice:</strong> Prior to enabling third-party advertising partners upon future domain deployment, this policy will be updated with full disclosures and opt-out controls for interest-based advertising (including Google Ads Settings at{' '}
                    <a
                      href="https://adssettings.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline hover:text-cyan-300"
                    >
                      https://adssettings.google.com
                    </a>).
                  </p>
                </div>
              </div>

              {/* SECTION 4: THIRD-PARTY SERVICES & AFFILIATE REDIRECTION */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                  4. Third-Party Services &amp; Affiliate Redirection
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  When accessing external partner stores (Amazon, Flipkart, Myntra) via shortened links, users are routed directly to official merchant listings. CLASSIFY TECH conducts zero merchant-side tracking and has no visibility into shopping carts, payment instruments, or checkout transactions on third-party domains.
                </p>
              </div>

              {/* SECTION 5: DATA STORAGE, RETENTION & DELETION */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                  5. Data Storage, Retention &amp; Deletion
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Browser local storage remains under your sole physical control and can be purged at any moment. Contact messages are retained up to thirty (30) days for inquiry resolution before automated erasure. Server diagnostic logs auto-purge every seven (7) days. No user information is ever sold, rented, or bartered to third-party data brokers.
                </p>
              </div>

              {/* SECTION 6: USER RIGHTS */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-400/40 space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00e676]" />
                  <span>6. User Rights (DPDP Act 2023, GDPR &amp; CCPA)</span>
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Under the Digital Personal Data Protection Act, 2023 (India) and international privacy frameworks, you have the right to request: (1) access to and summary of submitted communications, (2) correction of inaccurate details, (3) permanent erasure of your inquiry records, and (4) withdrawal of consent.
                </p>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1">
                  <p className="text-white font-bold">Designated Grievance &amp; Data Protection Officer:</p>
                  <p className="text-slate-300">Editorial Compliance Desk • CLASSIFY TECH</p>
                  <p className="text-slate-300">
                    Official Email: <strong className="text-[#00f2fe]">Classifytechz@gmail.com</strong>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Timelines: Written acknowledgment within 24–48 hours; substantive resolution within 15 working days.
                  </p>
                </div>
              </div>

              {/* SECTION 7: POLICY UPDATES & CONTACT */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                  7. Policy Updates &amp; Contact Information
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  We reserve the right to revise this Privacy Policy to reflect technical or statutory advancements. Revisions become effective upon publication. For inquiries, contact our Editorial Compliance Desk at <strong className="text-[#00f2fe]">Classifytechz@gmail.com</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: EDITORIAL STANDARDS & GRIEVANCES */}
          {activeTab === 'editorial' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#00f2fe]">
                    Editorial Standards, AI Disclosure &amp; Grievance Policy
                  </h3>
                  <p className="text-xs text-slate-400">
                    Responsible journalism, fact-checking against primary sources &amp; prompt public corrections
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                    Ethical Journalism
                  </span>
                </div>
              </div>

              {/* EDITORIAL CLAUSE 1: AI-ASSISTED EDITORIAL DISCLOSURE */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-400/40 space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00f2fe]" />
                  <span>1. AI-Assisted Editorial Disclosure</span>
                </h4>
                <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
                  <p>
                    CLASSIFY TECH utilizes advanced artificial intelligence models (including Google Gemini) as an <strong>assistive editorial tool</strong> to analyze complex engineering specifications, synthesize multi-source news dispatches, and structure analytical comparisons.
                  </p>
                  <p>
                    AI models do not replace human editorial judgment. Every AI-assisted story is structured to preserve factual integrity, extract verified manufacturer claims, provide balanced market context, and prominently link to original primary reporting.
                  </p>
                </div>
              </div>

              {/* EDITORIAL CLAUSE 2: FACT-CHECKING */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>2. Fact-Checking Against Primary Sources</span>
                </h4>
                <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
                  <p>
                    Our editorial team verifies hardware specifications, battery charging protocols, camera sensor physical dimensions, and silicon process nodes against primary sources:
                  </p>
                  <p>
                    • Official manufacturer technical whitepapers and launch announcements.
                    <br />
                    • Regulatory agency filings (e.g., BIS, FCC, 3C, TENAA, Bluetooth SIG).
                    <br />
                    • Standardized benchmark suites (AnTuTu v10, Geekbench 6, 3DMark).
                  </p>
                </div>
              </div>

              {/* EDITORIAL CLAUSE 3: CORRECTIONS & GRIEVANCE */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#00f2fe]" />
                  <span>3. Corrections &amp; Public Grievance Redressal</span>
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm">
                  We believe in rapid, transparent corrections. If you notice a typographical error, an outdated retail pricing figure, an incorrect camera sensor attribution, or wish to report a copyright concern, please notify our team:
                </p>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1">
                  <p className="text-white font-bold">Editorial Desk &amp; Grievance Redressal:</p>
                  <p className="text-slate-300">Email: <strong className="text-[#00f2fe]">Classifytechz@gmail.com</strong></p>
                  <p className="text-slate-400 text-[11px]">
                    Acknowledgment: Within 24–48 hours; specification review and public correction within 3 business days.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenContact();
                    }}
                    className="grad-btn px-4 py-2 rounded-xl text-xs font-black cursor-pointer inline-flex items-center gap-1.5 text-black"
                  >
                    <Mail className="w-3.5 h-3.5 text-black" /> Open Contact &amp; Grievance Desk
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
