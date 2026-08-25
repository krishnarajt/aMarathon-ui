import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Table2, ChartLine } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { chartChrome } from '../../lib/palette';

/**
 * The frame every chart in the app sits in.
 *
 * It owns the three things that are easy to skip and expensive to omit:
 * a legend whenever there is more than one series (identity is never colour
 * alone), a table view of the same numbers, and consistent chrome colours for
 * whichever theme is on.
 */
export function ChartFrame({
  title,
  subtitle,
  legend = [],
  table,
  actions,
  height = 260,
  children,
  className = '',
  id,
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className={`rounded-[var(--radius-card)] border border-line bg-surface ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-base leading-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {table && (
            <button
              type="button"
              onClick={() => setShowTable((current) => !current)}
              aria-pressed={showTable}
              className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[0.7rem] font-semibold text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
            >
              {showTable ? <ChartLine size={13} /> : <Table2 size={13} />}
              {showTable ? 'Chart' : 'Table'}
            </button>
          )}
        </div>
      </header>

      {legend.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 pt-3 sm:px-5">
          {legend.map((item) => (
            <li key={item.key ?? item.label} className="flex items-center gap-1.5 text-xs text-ink-2">
              {item.dash ? (
                // Matches the reference line's own dash pattern, so the key
                // reads as "the target" rather than a seventh person.
                <svg width="18" height="4" aria-hidden className="shrink-0">
                  <line
                    x1="0"
                    y1="2"
                    x2="18"
                    y2="2"
                    stroke={item.color}
                    strokeWidth="2"
                    strokeDasharray="5 4"
                  />
                </svg>
              ) : (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
              )}
              <span className="font-medium">{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="px-1 pb-3 pt-2 sm:px-2">
        <AnimatePresence mode="wait" initial={false}>
          {showTable && table ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-h-[320px] overflow-auto px-3 sm:px-4"
              style={{ minHeight: height }}
            >
              <DataTable {...table} />
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              id={id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              style={{ height }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export function DataTable({ columns, rows, caption }) {
  return (
    <table className="w-full border-collapse text-sm">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr className="border-b border-line">
          {columns.map((column, index) => (
            <th
              key={column.key ?? column.label}
              scope="col"
              className={`sticky top-0 bg-surface py-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-ink-3 ${
                index === 0 ? 'text-left' : 'text-right'
              }`}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.key ?? rowIndex} className="border-b border-line/60 last:border-0">
            {columns.map((column, index) => (
              <td
                key={column.key ?? column.label}
                className={`py-2 ${
                  index === 0 ? 'text-left font-medium text-ink' : 'text-right tabular text-ink-2'
                }`}
              >
                {row.cells[index]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Recharts tooltip in the app's surfaces. Series identity is a dot next to the
 * name — the text itself stays in ink tokens so a light hue is never asked to
 * be legible as type.
 */
export function ChartTooltip({ active, payload, label, formatter, footer }) {
  const { theme } = useTheme();
  const chrome = chartChrome(theme);
  if (!active || !payload?.length) return null;

  const rows = payload.filter((item) => item.value !== null && item.value !== undefined);

  return (
    <div
      className="pointer-events-none min-w-[9rem] rounded-xl border px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur"
      style={{
        backgroundColor: `color-mix(in oklab, ${chrome.surfaceElevated} 92%, transparent)`,
        borderColor: chrome.border,
      }}
    >
      {label !== undefined && label !== null && (
        <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-3">
          {label}
        </p>
      )}
      <ul className="space-y-1">
        {rows.map((item) => (
          <li key={item.dataKey ?? item.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-xs text-ink-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color ?? item.stroke ?? item.fill }}
                aria-hidden
              />
              {item.name}
            </span>
            <span className="tabular text-xs font-semibold text-ink">
              {formatter ? formatter(item.value, item) : item.value}
            </span>
          </li>
        ))}
      </ul>
      {footer && <p className="mt-1.5 border-t border-line pt-1.5 text-[0.68rem] text-ink-3">{footer}</p>}
    </div>
  );
}

export default ChartFrame;
