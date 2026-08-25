import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { heatColor, heatRamp } from '../../lib/palette';
import { formatDate, parseUTC } from '../../lib/format';

const DAY_MS = 86_400_000;
const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

/**
 * A year-in-cells view of "did I move today", built from the activity
 * endpoint's day buckets.
 *
 * Not Recharts: a calendar grid is a layout problem, not a plotting one, and
 * hand-rolling it means each cell can be a real button with a real hit target
 * on a phone. Intensity is a one-hue crimson ramp validated for monotone
 * lightness, so "more" always reads as "further from the surface".
 */
export function ActivityHeatmap({ activity = [], weeks = 18, className = '' }) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(null);
  const ramp = heatRamp(theme);

  const { columns, peak } = useMemo(() => {
    const byDay = new Map();
    let maxEntries = 0;
    for (const day of activity) {
      byDay.set(day.date, day);
      maxEntries = Math.max(maxEntries, day.entries);
    }

    // Walk back to the Monday that starts the window so columns are whole weeks.
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekday = (end.getDay() + 6) % 7; // Monday = 0
    const lastMonday = new Date(end.getTime() - weekday * DAY_MS);
    const start = new Date(lastMonday.getTime() - (weeks - 1) * 7 * DAY_MS);

    const grid = [];
    for (let week = 0; week < weeks; week += 1) {
      const column = [];
      for (let day = 0; day < 7; day += 1) {
        const date = new Date(start.getTime() + (week * 7 + day) * DAY_MS);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
          date.getDate()
        ).padStart(2, '0')}`;
        column.push({
          key,
          date,
          future: date > end,
          data: byDay.get(key) ?? null,
        });
      }
      grid.push(column);
    }
    return { columns: grid, peak: Math.max(1, maxEntries) };
  }, [activity, weeks]);

  const monthLabels = useMemo(
    () =>
      columns.map((column, index) => {
        const first = column[0].date;
        const previous = index > 0 ? columns[index - 1][0].date : null;
        const changed = !previous || previous.getMonth() !== first.getMonth();
        return changed ? first.toLocaleDateString(undefined, { month: 'short' }) : '';
      }),
    [columns]
  );

  return (
    <div className={className}>
      <div className="no-scrollbar overflow-x-auto pb-1">
        <div className="inline-flex min-w-full gap-1.5">
          <div className="mt-[18px] flex flex-col gap-[3px] pr-1">
            {WEEKDAYS.map((label, index) => (
              <span
                key={index}
                className="h-[13px] text-[0.6rem] leading-[13px] text-ink-3"
                style={{ minWidth: 22 }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {columns.map((column, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                <span className="h-[15px] text-[0.6rem] leading-[15px] text-ink-3">
                  {monthLabels[weekIndex]}
                </span>
                {column.map((cell, dayIndex) => {
                  const intensity = cell.data ? cell.data.entries / peak : 0;
                  const hit = cell.data?.targets_hit > 0;
                  return (
                    <motion.button
                      key={cell.key}
                      type="button"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: cell.future ? 0.25 : 1, scale: 1 }}
                      transition={{
                        delay: Math.min(0.5, (weekIndex * 7 + dayIndex) * 0.0022),
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                      whileHover={{ scale: 1.35, zIndex: 2 }}
                      onMouseEnter={() => setHovered(cell)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(cell)}
                      onBlur={() => setHovered(null)}
                      className="h-[13px] w-[13px] rounded-[3px] outline-none ring-offset-2 ring-offset-[var(--surface-1)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      style={{
                        backgroundColor: heatColor(intensity, theme),
                        boxShadow: hit ? 'inset 0 0 0 1px var(--accent-mark)' : undefined,
                      }}
                      aria-label={`${cell.date.toDateString()}: ${
                        cell.data ? `${cell.data.entries} logged` : 'nothing logged'
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="min-h-[1.25rem] text-xs text-ink-2">
          {hovered ? (
            hovered.data ? (
              <>
                <span className="font-semibold text-ink">
                  {formatDate(hovered.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>{' '}
                — {hovered.data.entries} logged, {hovered.data.targets_hit} on target
                {hovered.data.wins > 0 && `, ${hovered.data.wins} won`}
              </>
            ) : (
              <>
                <span className="font-semibold text-ink">
                  {formatDate(hovered.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>{' '}
                — nothing logged
              </>
            )
          ) : (
            'Each square is a day. A lime outline means you hit a target.'
          )}
        </p>
        <div className="flex items-center gap-1.5 text-[0.65rem] text-ink-3">
          <span>Quiet</span>
          {ramp.map((color) => (
            <span
              key={color}
              className="h-[11px] w-[11px] rounded-[3px]"
              style={{ backgroundColor: color }}
              aria-hidden
            />
          ))}
          <span>Busy</span>
        </div>
      </div>
    </div>
  );
}

/** Total distance/steps covered per day, for the small trend under the map. */
export function summariseActivity(activity, metric) {
  return activity.map((day) => ({
    date: day.date,
    value: day.totals_by_metric?.[metric] ?? 0,
    when: parseUTC(`${day.date}T00:00:00`),
  }));
}

export default ActivityHeatmap;
