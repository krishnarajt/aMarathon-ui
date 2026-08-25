import { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { chartChrome } from '../../lib/palette';
import { useReducedMotion } from '../../hooks/useMediaQuery';

/**
 * A 12-ish point trace for a stat tile. Hand-rolled SVG rather than Recharts:
 * a tile can appear a dozen times on the home screen, and each ResponsiveContainer
 * carries a resize observer that this does not need.
 *
 * No axes, no labels, no tooltip — it is a shape, and the tile's own number is
 * the value. The last point gets a dot so "where it ended up" is unambiguous.
 */
export function Sparkline({
  values = [],
  color,
  width = 120,
  height = 34,
  strokeWidth = 2,
  className = '',
  fill = true,
}) {
  const { theme } = useTheme();
  const chrome = chartChrome(theme);
  const reduced = useReducedMotion();
  const gradientId = useId();
  const stroke = color ?? chrome.target;

  const { line, area, last } = useMemo(() => {
    if (values.length < 2) return { line: '', area: '', last: null };
    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const padding = strokeWidth;
    const usableHeight = height - padding * 2;

    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = padding + (1 - (value - min) / span) * usableHeight;
      return [x, y];
    });

    const path = points
      .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(' ');

    return {
      line: path,
      area: `${path} L${width},${height} L0,${height} Z`,
      last: points[points.length - 1],
    };
  }, [values, width, height, strokeWidth]);

  if (!line) return <div style={{ width, height }} className={className} aria-hidden />;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      )}
      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        vectorEffect="non-scaling-stroke"
      />
      {last && (
        <circle
          cx={last[0]}
          cy={last[1]}
          r={3}
          fill={stroke}
          stroke={chrome.surface}
          strokeWidth={2}
        />
      )}
    </svg>
  );
}

export default Sparkline;
