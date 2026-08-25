import { motion } from 'framer-motion';

/**
 * Horizontal tabs with a pill that slides between items.
 *
 * The slide is a shared `layoutId` rather than a measured transform, so it
 * stays correct when a tab's label changes width (a count badge appearing, for
 * instance) without any resize plumbing.
 *
 * `id` must be unique per mounted tab set — two Tabs sharing a layoutId would
 * animate the pill between them across the page.
 */
export function Tabs({ id, tabs, value, onChange, className = '', size = 'md' }) {
  const compact = size === 'sm';
  return (
    <div
      role="tablist"
      aria-label="Sections"
      className={`no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            style={active ? { color: 'var(--accent-ink)' } : undefined}
            className={`relative shrink-0 whitespace-nowrap rounded-xl font-semibold transition-colors duration-200 ${
              compact ? 'px-3 py-1.5 text-[0.78rem]' : 'px-4 py-2 text-sm'
            } ${active ? 'text-acid-ink' : 'text-ink-3 hover:text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId={`tab-pill-${id}`}
                className="absolute inset-0 rounded-xl bg-acid"
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon size={compact ? 13 : 15} aria-hidden />}
              {tab.label}
              {tab.count > 0 && (
                <span
                  style={active ? { color: 'var(--accent-ink)' } : undefined}
                  className={`ml-0.5 rounded-full px-1.5 py-px text-[0.65rem] font-bold tabular ${
                    active ? 'bg-acid-ink/15 text-acid-ink' : 'bg-brand/20 text-brand-glow'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Two-to-four exclusive options inside a form.
 *
 * The pill slides on a computed `left` rather than a shared `layoutId`: the
 * options are equal-width, so its position is arithmetic and needs no
 * measurement. That also keeps this component free of framer-motion's layout
 * projection — a control that mounts and unmounts inside an
 * `AnimatePresence mode="wait"` subtree (the create-challenge wizard shows the
 * unit picker only for distance challenges) left a projection node behind on
 * unmount, and the presence never completed its exit, so the next step of the
 * wizard rendered as an empty card.
 */
export function SegmentedControl({ id, options, value, onChange, className = '' }) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  return (
    <div
      className={`relative grid gap-1 rounded-2xl border border-line bg-surface-2/60 p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
      aria-labelledby={id ? `${id}-label` : undefined}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-1 top-1 rounded-xl bg-brand transition-[left] duration-300 ease-[cubic-bezier(0.22,1.4,0.36,1)]"
        style={{
          width: `calc((100% - 0.5rem - ${(options.length - 1) * 0.25}rem) / ${options.length})`,
          left: `calc(0.25rem + ${activeIndex} * ((100% - 0.5rem - ${
            (options.length - 1) * 0.25
          }rem) / ${options.length} + 0.25rem))`,
        }}
      />
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            style={active ? { color: 'var(--on-brand)' } : undefined}
            className={`relative z-10 rounded-xl px-2 py-2 text-center text-[0.8rem] font-semibold transition-colors duration-200 ${
              active ? 'text-on-brand' : 'text-ink-3 hover:text-ink'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {Icon && <Icon size={14} aria-hidden />}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
