const TONES = {
  neutral: 'border-line bg-surface-2 text-ink-2',
  brand: 'border-brand-bright/40 bg-brand/15 text-brand-glow',
  acid: 'border-acid-dim/40 bg-acid/15 text-acid-text',
  good: 'border-good/35 bg-good/12 text-good',
  warn: 'border-warn/35 bg-warn/12 text-warn',
  bad: 'border-bad/35 bg-bad/12 text-bad',
  muted: 'border-line bg-transparent text-ink-3',
};

export function Badge({ children, tone = 'neutral', icon: Icon, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${
        TONES[tone] ?? TONES.neutral
      } ${className}`}
    >
      {Icon && <Icon size={11} aria-hidden />}
      {children}
    </span>
  );
}

/** A live/offline dot. Colour alone never carries it — there is always a label. */
export function StatusDot({ tone = 'good', pulse = false, className = '' }) {
  const colors = {
    good: 'bg-good',
    warn: 'bg-warn',
    bad: 'bg-bad',
    muted: 'bg-ink-3',
  };
  return (
    <span className={`relative flex h-2 w-2 ${className}`}>
      {pulse && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
            colors[tone] ?? colors.good
          }`}
        />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${colors[tone] ?? colors.good}`} />
    </span>
  );
}

export default Badge;
