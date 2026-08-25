import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useMediaQuery';

/**
 * The home screen's headline mark: how close today's number is to today's
 * target.
 *
 * Overshoot is the interesting case — beating a target by 40% is the whole
 * point of the game — so the ring keeps a second arc for everything past 100%
 * instead of clamping and throwing the information away.
 */
export function ProgressRing({
  value = 0,
  target = 1,
  size = 132,
  stroke = 10,
  color = 'var(--brand-glow)',
  overColor = 'var(--accent-mark)',
  trackColor = 'var(--surface-3)',
  children,
  className = '',
}) {
  const reduced = useReducedMotion();
  const ratio = target > 0 ? value / target : 0;
  const base = Math.min(1, Math.max(0, ratio));
  const over = Math.min(1, Math.max(0, ratio - 1));

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const spring = { type: 'spring', stiffness: 90, damping: 20, mass: 0.6 };

  return (
    <div className={`relative grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduced ? circumference * (1 - base) : circumference }}
          animate={{ strokeDashoffset: circumference * (1 - base) }}
          transition={reduced ? { duration: 0 } : spring}
        />
        {over > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={overColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - over) }}
            transition={reduced ? { duration: 0 } : { ...spring, delay: 0.35 }}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/**
 * The same reading laid flat, for lists.
 *
 * A bar can't do the ring's second lap, so it rescales instead: the track spans
 * `max(target, value)`, the fill up to the target wears the series colour, and
 * anything past it is lime with a tick where the target sits. Overlaying the
 * overshoot on the same left-anchored bar would have read as "40% lime, 60%
 * crimson", which is a different claim entirely.
 */
export function ProgressBar({ value = 0, target = 1, color = 'var(--brand-glow)', className = '' }) {
  const reduced = useReducedMotion();
  const safeValue = Math.max(0, value);
  const scale = Math.max(target, safeValue) || 1;
  const upToTarget = (Math.min(safeValue, target) / scale) * 100;
  const past = (Math.max(0, safeValue - target) / scale) * 100;
  const spring = { type: 'spring', stiffness: 120, damping: 22 };

  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-surface-3 ${className}`}>
      <motion.span
        className="absolute inset-y-0 left-0 rounded-l-full"
        style={{ backgroundColor: color, borderRadius: past > 0 ? undefined : 999 }}
        initial={{ width: reduced ? `${upToTarget}%` : 0 }}
        animate={{ width: `${upToTarget}%` }}
        transition={reduced ? { duration: 0 } : spring}
      />
      {past > 0 && (
        <>
          <motion.span
            className="absolute inset-y-0 rounded-r-full bg-acid-mark"
            style={{ left: `${upToTarget}%` }}
            initial={{ width: reduced ? `${past}%` : 0 }}
            animate={{ width: `${past}%` }}
            transition={reduced ? { duration: 0 } : { ...spring, delay: 0.22 }}
          />
          <span
            className="absolute inset-y-0 w-[2px] bg-surface"
            style={{ left: `calc(${upToTarget}% - 1px)` }}
            aria-hidden
          />
        </>
      )}
    </div>
  );
}

export default ProgressRing;
