import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, X, MessageSquare, ShieldCheck, Clock, User, AtSign, HelpCircle } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      onShowToast('Please complete all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      onShowToast('Please provide a valid email address.');
      return;
    }

    if (trimmedMessage.length < 10) {
      onShowToast('Message must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          category,
          message: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        const feedbackMsg = data.deliveryServiceConfigured
          ? 'Inquiry dispatched to editorial team mailbox.'
          : 'Inquiry logged to local editorial queue. (External email delivery service is not configured in environment).';
        setSubmissionFeedback(feedbackMsg);
        onShowToast(data.message || 'Inquiry recorded successfully!');
        setTimeout(() => {
          setName('');
          setEmail('');
          setMessage('');
          setSubmitted(false);
          setSubmissionFeedback('');
          onClose();
        }, 3000);
      } else {
        onShowToast(data.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch {
      onShowToast('Network error: Contact service is currently unavailable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div className="glass-card max-w-2xl w-full rounded-3xl border border-cyan-400/40 overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col bg-slate-950/95">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-[#00f2fe] flex items-center justify-center text-lg shrink-0 border border-cyan-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 id="contact-modal-title" className="text-base sm:text-xl font-black text-white">Contact Us & Help Desk</h2>
              <p className="text-xs text-slate-400">Official Editorial & Reader Inquiries • CLASSIFY TECH</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Contact Modal"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#00f2fe] hover:text-black text-white flex items-center justify-center transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          
          {/* Revealed Email Box - ONLY SHOWN HERE UPON MODAL OPEN */}
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-wider text-[#00f2fe] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00e676]" /> Verified Official Email Desk
              </div>
              <div className="text-sm font-semibold text-white">
                Direct Contact: <a href="mailto:Classifytechz@gmail.com" className="text-[#00f2fe] underline font-bold hover:text-white transition">Classifytechz@gmail.com</a>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Average response window: 12 to 24 business hours
              </div>
            </div>
            <a
              href="mailto:Classifytechz@gmail.com?subject=Inquiry%20from%20CLASSIFY%20TECH%20Reader"
              className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00f2fe] border border-cyan-400/50 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition shrink-0"
            >
              Open Email App <Mail className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Interactive In-App Form */}
          {submitted ? (
            <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#00e676] mx-auto animate-bounce" />
              <h3 className="text-lg font-black text-white">Inquiry Recorded</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {submissionFeedback || 'Your message has been safely logged with the CLASSIFY TECH desk.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#00f2fe]" /> Send Direct Web Message
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> No signup required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="contact-name" className="block text-[11px] font-bold text-slate-300 uppercase">Your Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl bg-black border border-white/15 pl-9 pr-3 py-2 text-xs text-white focus:border-[#00f2fe] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-email" className="block text-[11px] font-bold text-slate-300 uppercase">Your Email *</label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="e.g. alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl bg-black border border-white/15 pl-9 pr-3 py-2 text-xs text-white focus:border-[#00f2fe] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="contact-category" className="block text-[11px] font-bold text-slate-300 uppercase">Topic / Category</label>
                <select
                  id="contact-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl bg-black border border-white/15 px-3 py-2 text-xs text-white focus:border-[#00f2fe] outline-none"
                >
                  <option value="General Inquiry">General Reader Inquiry</option>
                  <option value="Fact-Check & Correction">Fact-Check / Hardware Specification Correction</option>
                  <option value="Photography & Camera Review">Smartphone Photography & Camera Sample Review</option>
                  <option value="Sponsorship & Deals">Business, Partnership & Affiliate Deals</option>
                  <option value="Copyright & DMCA">Copyright / DMCA Attribution Notice</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="contact-message" className="block text-[11px] font-bold text-slate-300 uppercase">Message *</label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  placeholder="Detail your question, feedback, or correction request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl bg-black border border-white/15 px-3.5 py-2.5 text-xs text-white focus:border-[#00f2fe] outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-500">
                  Your privacy is respected. Messages are governed by our Privacy Policy.
                </p>
                <button
                  type="submit"
                  className="grad-btn px-6 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 w-full sm:w-auto justify-center"
                >
                  Submit Inquiry <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">CLASSIFY TECH Help Desk</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
