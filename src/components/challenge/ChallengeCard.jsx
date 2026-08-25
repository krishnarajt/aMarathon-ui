import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Flame, Footprints, Route as RouteIcon, Timer, Users } from 'lucide-react';
import { formatMetric, periodLabel, timeLeftLabel } from '../../lib/format';
import { PERIOD_TYPES, UNITS, winRuleShort } from '../../lib/labels';
import { seriesColorMap } from '../../lib/palette';
import { useTheme } from '../../context/ThemeContext';
import { TouchCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import Button from '../ui/Button';
import { ProgressBar } from '../ui/ProgressRing';
import { Avatar } from '../ui/Avatar';

/**
 * A challenge as it appears in a list: today's target, where I am against it,
 * and who else has already logged.
 *
 * `card` is one entry from /stats/dashboard — the endpoint exists precisely so
 * this component doesn't have to fetch three things per row.
 */
export function ChallengeCard({ card, meId, onLog, index = 0 }) {
  const { theme } = useTheme();
  const { challenge, period, standings = [] } = card;
  const unit = challenge.unit;
  const target = period?.target_value ?? 0;
  const mine = card.my_value;
  const logged = mine !== null && mine !== undefined;
  const MetricIcon = challenge.metric === 'steps' ? Footprints : RouteIcon;

  const colors = seriesColorMap(
    [meId, ...standings.map((row) => row.user_id)].filter(Boolean),
    theme
  );

  return (
    <TouchCard glow={logged && card.hit_target} className="p-4 sm:p-5">
      <Link to={`/challenges/${challenge.challenge_uuid}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg leading-tight text-ink">{challenge.name}</h3>
              {card.current_streak > 1 && (
                <Badge tone="brand" icon={Flame}>
                  {card.current_streak}
                </Badge>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-3">
              <span className="inline-flex items-center gap-1">
                <MetricIcon size={12} aria-hidden />
                {PERIOD_TYPES[challenge.period_type]?.label ?? challenge.period_type}
              </span>
              <span aria-hidden>·</span>
              <span>{winRuleShort(challenge.win_rule)}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Users size={12} aria-hidden />
                {card.participants}
              </span>
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">
              {periodLabel(period, challenge.period_type)}
            </p>
            <p className="font-sans text-xl font-bold leading-tight text-ink [font-variant-numeric:proportional-nums]">
              {formatMetric(target, unit)}
            </p>
            <p className="text-[0.65rem] text-ink-3">{UNITS[unit]?.label ?? unit}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
            <span className={logged ? 'font-semibold text-ink' : 'text-ink-3'}>
              {logged ? `You: ${formatMetric(mine, unit)}` : 'Nothing logged yet'}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-3">
              <Timer size={11} aria-hidden />
              {timeLeftLabel(period?.period_end)}
            </span>
          </div>
          <ProgressBar value={mine ?? 0} target={target} />
        </div>

        {standings.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {standings.slice(0, 3).map((row, position) => (
              <li key={row.user_id} className="flex items-center gap-2 text-xs">
                <span className="w-4 shrink-0 text-center font-mono text-[0.65rem] text-ink-3">
                  {position + 1}
                </span>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colors.get(row.user_id) ?? 'var(--text-3)' }}
                  aria-hidden
                />
                <span
                  className={`min-w-0 flex-1 truncate ${
                    row.user_id === meId ? 'font-semibold text-ink' : 'text-ink-2'
                  }`}
                >
                  {row.user_id === meId ? 'You' : row.display_name}
                </span>
                {row.is_winner && <Crown size={12} className="shrink-0 text-acid-text" aria-hidden />}
                <span className="tabular shrink-0 font-semibold text-ink-2">
                  {formatMetric(row.value, unit)}
                </span>
              </li>
            ))}
            {card.logged_count > 3 && (
              <li className="pl-6 text-[0.7rem] text-ink-3">
                +{card.logged_count - 3} more logged
              </li>
            )}
          </ul>
        )}
      </Link>

      {onLog && period && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 * index + 0.15 }}
          className="mt-4"
        >
          <Button
            variant={logged ? 'outline' : 'acid'}
            size="sm"
            full
            onClick={(event) => {
              event.preventDefault();
              onLog(card);
            }}
          >
            {logged ? 'Change your number' : `Log ${challenge.metric === 'steps' ? 'steps' : 'distance'}`}
          </Button>
        </motion.div>
      )}
    </TouchCard>
  );
}

/** Compact row for an invitation the user hasn't answered. */
export function InviteCard({ challenge, onRespond, busy }) {
  const MetricIcon = challenge.metric === 'steps' ? Footprints : RouteIcon;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-bright/30 bg-brand/8 p-3.5">
      <Avatar user={challenge.creator} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{challenge.name}</p>
        <p className="truncate text-xs text-ink-3">
          <span className="inline-flex items-center gap-1">
            <MetricIcon size={11} aria-hidden />
            {formatMetric(challenge.target_min, challenge.unit)}–
            {formatMetric(challenge.target_max, challenge.unit)} {UNITS[challenge.unit]?.label}
          </span>
          {' · from '}
          {challenge.creator?.display_name}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" size="sm" onClick={() => onRespond(challenge, false)} disabled={busy}>
          No
        </Button>
        <Button variant="acid" size="sm" onClick={() => onRespond(challenge, true)} disabled={busy}>
          I’m in
        </Button>
      </div>
    </div>
  );
}

export default ChallengeCard;
