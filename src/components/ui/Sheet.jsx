import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * One component, two shapes: a bottom sheet that can be flicked away on
 * phones, a centred dialog on desktop. Both from the same tree, so opening
 * state never has to know which one is on screen.
 */
export function Sheet({ open, onClose, title, subtitle, children, footer, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose?.();
    // Locking scroll on <body> keeps the page behind from drifting when the
    // sheet is dragged on iOS.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%', opacity: 0.6, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, transition: { duration: 0.22 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose?.();
            }}
            className={`relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-line bg-bg-elev shadow-[var(--shadow-soft)] sm:max-h-[85dvh] sm:rounded-[1.75rem] ${maxWidth}`}
          >
            <div className="grain absolute inset-0 -z-10" aria-hidden />
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" />
            <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-4 sm:pt-6">
              <div className="min-w-0">
                <h2 className="text-xl leading-tight">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-ink-3">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-ink-3 transition-colors hover:text-ink"
              >
                <X size={16} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">{children}</div>
            {footer && (
              <footer className="safe-bottom border-t border-line bg-surface/40 px-5 py-4">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Sheet;
