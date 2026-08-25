import { Link } from 'react-router-dom';
import { Footprints, Route as RouteIcon } from 'lucide-react';
import { formatDate, formatMetric } from '../../lib/format';
import { CHALLENGE_STATUS, PERIOD_TYPES, UNITS, winRuleShort } from '../../lib/labels';
import { TouchCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

/** A challenge that is over: no live numbers, just what it was and when. */
export function PastChallengeCard({ challenge }) {
  const MetricIcon = challenge.metric === 'steps' ? Footprints : RouteIcon;
  const status = CHALLENGE_STATUS[challenge.status] ?? { label: challenge.status, tone: 'muted' };

  return (
    <Link to={`/challenges/${challenge.challenge_uuid}`}>
      <TouchCard className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg leading-tight text-ink">{challenge.name}</h3>
            <p className="mt-1 truncate text-xs text-ink-3">
              {PERIOD_TYPES[challenge.period_type]?.label} · {winRuleShort(challenge.win_rule)}
            </p>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-2">
          <MetricIcon size={14} className="text-ink-3" aria-hidden />
          {formatMetric(challenge.target_min, challenge.unit)}–
          {formatMetric(challenge.target_max, challenge.unit)}{' '}
          {UNITS[challenge.unit]?.label ?? challenge.unit}
        </p>

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-ink-3">
          <Avatar user={challenge.creator} size="xs" />
          <span className="truncate">
            {challenge.creator?.display_name} · started {formatDate(challenge.starts_at)}
          </span>
        </div>
      </TouchCard>
    </Link>
  );
}

export default PastChallengeCard;
