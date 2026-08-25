import { motion } from 'framer-motion';
import Counter from './Counter';
import Sparkline from '../charts/Sparkline';

/**
 * label · value · optional delta · optional 12-point trend.
 *
 * The value uses the font's proportional figures, not tabular: a big standalone
 * number set in tabular figures looks gappy, and nothing here needs to align
 * vertically with the tile above it.
 */
export function StatTile({
  label,
  value,
  unit,
  compact = false,
  suffix,
  delta,
  trend,
  trendColor,
  icon: Icon,
  tone = 'neutral',
  className = '',
}) {
  const tones = {
    neutral: 'border-line',
    brand: 'border-brand-bright/30',
    acid: 'border-acid-dim/30',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative overflow-hidden rounded-2xl border bg-surface p-4 ${
        tones[tone] ?? tones.neutral
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-3">{label}</p>
        {Icon && <Icon size={15} className="shrink-0 text-ink-3" aria-hidden />}
      </div>

      <p className="mt-2 flex items-baseline gap-1 font-sans text-[1.75rem] font-bold leading-none tracking-tight text-ink [font-variant-numeric:proportional-nums]">
        <Counter value={value} unit={unit} compact={compact} />
        {suffix && <span className="text-sm font-semibold text-ink-3">{suffix}</span>}
      </p>

      {delta && (
        <p
          className={`mt-1.5 text-xs font-semibold ${
            delta.direction === 'up'
              ? 'text-good'
              : delta.direction === 'down'
                ? 'text-bad'
                : 'text-ink-3'
          }`}
        >
          {delta.label}
        </p>
      )}

      {trend?.length > 1 && (
        <div className="mt-3 -mb-1">
          <Sparkline values={trend} color={trendColor} width={140} height={30} />
        </div>
      )}
    </motion.div>
  );
}

export default StatTile;
