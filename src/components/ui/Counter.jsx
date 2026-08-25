import useCountUp from '../../hooks/useCountUp';
import { compactNumber, formatMetric, formatNumber } from '../../lib/format';

/**
 * A number that counts up on mount. `unit` switches to metric formatting so
 * steps stay whole and kilometres keep one decimal while the value is moving.
 */
export function Counter({
  value = 0,
  unit,
  compact = false,
  decimals,
  duration = 900,
  className = '',
  animate = true,
}) {
  const current = useCountUp(Number(value) || 0, { duration, enabled: animate });
  let text;
  if (compact) text = compactNumber(current);
  else if (unit) text = formatMetric(current, unit);
  else text = formatNumber(current, { decimals: decimals ?? (Number.isInteger(value) ? 0 : 1) });

  return (
    <span className={`tabular ${className}`} aria-label={String(value)}>
      {text}
    </span>
  );
}

export default Counter;
