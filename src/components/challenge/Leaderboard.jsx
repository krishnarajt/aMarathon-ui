import { motion } from 'framer-motion';
import { Crown, Flame } from 'lucide-react';
import { formatMetric } from '../../lib/format';
import { seriesColorMap } from '../../lib/palette';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/Feedback';
import { Medal } from 'lucide-react';

/**
 * Standings for the whole challenge. Sorted by the backend (wins, then targets
 * hit, then volume) — resorting here would disagree with the API's own idea of
 * who's ahead.
 *
 * On phones the table becomes cards: five numeric columns do not survive a
 * 360px viewport, and horizontal scroll inside a page that already scrolls is
 * worse than a taller list.
 */
export function Leaderboard({ rows = [], loading, unit, meId, periodNoun = 'day' }) {
  const { theme } = useTheme();

  if (loading && !rows.length) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="shimmer h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <EmptyState icon={Medal} title="Nothing to rank yet" body="Log a number and this fills in." />;
  }

  const colors = seriesColorMap([meId, ...rows.map((row) => row.user_id)].filter(Boolean), theme);

  return (
    <>
      {/* Phone: one card per person */}
      <ul className="space-y-2 lg:hidden">
        {rows.map((row, index) => (
          <motion.li
            key={row.user_id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 32 }}
            className={`rounded-2xl border p-3.5 ${
              row.user_id === meId ? 'border-brand-bright/40 bg-brand/8' : 'border-line bg-surface'
            }`}
          >
            <div className="flex items-center gap-3">
              <Rank index={index} />
              <Avatar user={{ ...row, id: row.user_id }} size="sm" color={colors.get(row.user_id)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {row.user_id === meId ? 'You' : row.display_name}
                </p>
                <p className="truncate text-[0.7rem] text-ink-3">
                  {row.entries_logged} logged
                  {row.participant_status !== 'accepted' && ` · ${row.participant_status}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular text-base font-bold text-ink">{row.wins}</p>
                <p className="text-[0.62rem] uppercase tracking-wider text-ink-3">won</p>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-line pt-2.5 text-center">
              <Cell label="Hits" value={row.targets_hit} />
              <Cell label="Streak" value={row.current_streak} icon={row.current_streak > 2} />
              <Cell label="Best" value={formatMetric(row.best_value, unit)} />
              <Cell label="Avg" value={formatMetric(row.average_value, unit)} />
            </dl>
          </motion.li>
        ))}
      </ul>

      {/* Desktop: a real table */}
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-[0.65rem] uppercase tracking-[0.12em] text-ink-3">
              <th scope="col" className="py-3 pl-4 text-left font-bold">
                #
              </th>
              <th scope="col" className="py-3 text-left font-bold">
                Who
              </th>
              <th scope="col" className="py-3 text-right font-bold">
                {periodNoun}s won
              </th>
              <th scope="col" className="py-3 text-right font-bold">
                Targets hit
              </th>
              <th scope="col" className="py-3 text-right font-bold">
                Streak
              </th>
              <th scope="col" className="py-3 text-right font-bold">
                Best
              </th>
              <th scope="col" className="py-3 text-right font-bold">
                Average
              </th>
              <th scope="col" className="py-3 pr-4 text-right font-bold">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <motion.tr
                key={row.user_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className={`border-b border-line/60 last:border-0 ${
                  row.user_id === meId ? 'bg-brand/8' : ''
                }`}
              >
                <td className="py-3 pl-4">
                  <Rank index={index} />
                </td>
                <td className="py-3">
                  <span className="flex items-center gap-2.5">
                    <Avatar
                      user={{ ...row, id: row.user_id }}
                      size="xs"
                      color={colors.get(row.user_id)}
                    />
                    <span className="font-semibold text-ink">
                      {row.user_id === meId ? 'You' : row.display_name}
                    </span>
                    {row.participant_status !== 'accepted' && (
                      <span className="text-[0.65rem] uppercase tracking-wider text-ink-3">
                        {row.participant_status}
                      </span>
                    )}
                  </span>
                </td>
                <td className="tabular py-3 text-right font-bold text-ink">{row.wins}</td>
                <td className="tabular py-3 text-right text-ink-2">{row.targets_hit}</td>
                <td className="tabular py-3 text-right text-ink-2">
                  <span className="inline-flex items-center gap-1">
                    {row.current_streak > 2 && (
                      <Flame size={12} className="text-brand-glow" aria-hidden />
                    )}
                    {row.current_streak}
                  </span>
                </td>
                <td className="tabular py-3 text-right text-ink-2">
                  {formatMetric(row.best_value, unit)}
                </td>
                <td className="tabular py-3 text-right text-ink-2">
                  {formatMetric(row.average_value, unit)}
                </td>
                <td className="tabular py-3 pr-4 text-right text-ink-2">
                  {formatMetric(row.total_value, unit)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Rank({ index }) {
  if (index === 0) {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-acid text-acid-ink">
        <Crown size={14} aria-label="First" />
      </span>
    );
  }
  return (
    <span className="grid h-7 w-7 place-items-center rounded-lg border border-line font-mono text-xs text-ink-3">
      {index + 1}
    </span>
  );
}

function Cell({ label, value, icon }) {
  return (
    <div>
      <dd className="tabular flex items-center justify-center gap-1 text-sm font-semibold text-ink">
        {icon && <Flame size={11} className="text-brand-glow" aria-hidden />}
        {value}
      </dd>
      <dt className="mt-0.5 text-[0.6rem] uppercase tracking-wider text-ink-3">{label}</dt>
    </div>
  );
}

export default Leaderboard;
