import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Phone, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SalimProfileCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        cardRef.current &&
        !cardRef.current.contains(event.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div id="designed-by-salim-container" className="relative">
      {/* Floating Card Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="salim-profile-card"
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-84 sm:w-[380px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="salim-card-title"
          >
            {/* Top Row: Avatar, Info & Close Button */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-3 ring-cyan-500 shadow-md overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                    <img
                      src="/Salim.png"
                      alt="Md. Salim Hossain"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                {/* Name & Title */}
                <div>
                  <h3
                    id="salim-card-title"
                    className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
                  >
                    Md. Salim Hossain
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-cyan-600 dark:text-cyan-400 mt-0.5">
                    SO, Sun Pharmaceuticals EZ Ltd.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                id="btn-close-salim-card"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Close Profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subtle Divider */}
            <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

            {/* Details List matching user screenshot */}
            <div className="space-y-3 text-xs sm:text-sm">
              {/* HQ */}
              <div className="flex items-center space-x-2.5">
                <span className="text-base leading-none select-none">📍</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">HQ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
                  ENGLISH ROAD-AZU-DHAKA
                </span>
              </div>

              {/* Mail */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center space-x-2.5">
                  <div className="w-5 h-5 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Mail:</span>
                  <a
                    href="mailto:salimbd.ga@gmail.com"
                    className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                    title="salimbd.ga@gmail.com"
                  >
                    Mailbox
                  </a>
                </div>
                <div className="flex items-center space-x-1">
                  <a
                    href="mailto:salimbd.ga@gmail.com"
                    className="text-[11px] text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                  >
                    salimbd.ga@gmail.com
                  </a>
                  <button
                    onClick={() => copyToClipboard('salimbd.ga@gmail.com', 'email')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Copy email"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center space-x-2.5">
                  <div className="w-5 h-5 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Mobile:</span>
                  <a
                    href="tel:01737462871"
                    className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                    title="01737462871"
                  >
                    Call Me
                  </a>
                </div>
                <div className="flex items-center space-x-1">
                  <a
                    href="tel:01737462871"
                    className="text-[11px] font-mono text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                  >
                    01737462871
                  </a>
                  <button
                    onClick={() => copyToClipboard('01737462871', 'phone')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Copy phone number"
                  >
                    {copiedField === 'phone' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pill Badge */}
      <button
        id="btn-floating-salim-badge"
        ref={badgeRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center space-x-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white pl-1.5 pr-4 py-1.5 rounded-full shadow-2xl border border-slate-700/90 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        aria-expanded={isOpen}
        aria-label="Toggle Salim profile card"
      >
        {/* Avatar with Cyan Ring */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-cyan-500 overflow-hidden shrink-0 shadow-sm bg-slate-800">
          <img
            src="/Salim.png"
            alt="Salim"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="font-medium text-xs sm:text-sm text-slate-100 tracking-wide select-none">
          Designed By Salim
        </span>
      </button>
    </div>
  );
};
