import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Flame,
  Footprints,
  Mail,
  Plus,
  Route as RouteIcon,
  Sparkles,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useQuery from '../hooks/useQuery';
import { formatMetric, greeting, periodLabel, timeLeftLabel } from '../lib/format';
import { DONE_LINES, UNITS, pickLine } from '../lib/labels';
import { Page, Stagger, StaggerItem } from '../components/ui/Motion';
import { Card, SectionTitle } from '../components/ui/Card';
import { EmptyState, ErrorState, SkeletonCard } from '../components/ui/Feedback';
import Button from '../components/ui/Button';
import StatTile from '../components/ui/StatTile';
import Counter from '../components/ui/Counter';
import { Badge } from '../components/ui/Badge';
import { ProgressRing } from '../components/ui/ProgressRing';
import Confetti from '../components/ui/Confetti';
import ChallengeCard, { InviteCard } from '../components/challenge/ChallengeCard';
import LogSheet from '../components/challenge/LogSheet';
import ActivityHeatmap from '../components/charts/ActivityHeatmap';

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logging, setLogging] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);

  const dashboard = useQuery(useCallback(() => api.dashboard(), []));
  const activity = useQuery(useCallback(() => api.activity(126), []));

  const data = dashboard.data;
  const overview = data?.overview;
  // Memoised because `?? []` would hand a fresh array to every dependent hook
  // on every render.
  const active = useMemo(() => data?.active ?? [], [data]);

  const pending = useMemo(() => active.filter((card) => card.my_value === null), [active]);
  const hero = pending[0] ?? active[0] ?? null;

  const refresh = useCallback(() => {
    dashboard.reload();
    activity.reload();
  }, [dashboard, activity]);

  async function respondToInvite(challenge, accept) {
    setRespondingTo(challenge.challenge_uuid);
    try {
      await api.respondToChallenge(challenge.challenge_uuid, accept);
      toast(accept ? `You’re in on ${challenge.name}.` : 'Invitation declined.', accept ? 'win' : 'info');
      await dashboard.reload();
    } catch (caught) {
      toast(caught.message, 'error');
    } finally {
      setRespondingTo(null);
    }
  }

  if (dashboard.loading && !data) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-10 w-56 rounded-xl" />
        <SkeletonCard lines={4} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="shimmer h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (dashboard.error && !data) {
    return <ErrorState error={dashboard.error} onRetry={dashboard.reload} className="mt-10" />;
  }

  const totalSteps = overview?.totals_by_metric?.steps ?? 0;
  const totalDistance = overview?.totals_by_metric?.distance ?? 0;
  const recent = (activity.data ?? []).slice(-14);

  return (
    <Page className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-ink-3">
            {greeting()}, {user?.display_name?.split(' ')[0]}
          </p>
          <h1 className="mt-1 text-3xl leading-tight sm:text-4xl">
            {pending.length > 0 ? (
              <>
                <span className="gradient-text">{pending.length}</span> still to log
              </>
            ) : active.length > 0 ? (
              pickLine(DONE_LINES, active.length)
            ) : (
              'Let’s get one going'
            )}
          </h1>
        </div>
        <Link to="/challenges/new" className="hidden sm:block">
          <Button icon={Plus}>New challenge</Button>
        </Link>
      </header>

      {hero && <HeroToday card={hero} onLog={() => setLogging(hero)} />}

      {(data?.invites?.length > 0 || data?.friend_requests > 0) && (
        <section>
          <SectionTitle icon={Mail}>Waiting on you</SectionTitle>
          <div className="space-y-2.5">
            {data.invites.map((challenge) => (
              <InviteCard
                key={challenge.challenge_uuid}
                challenge={challenge}
                onRespond={respondToInvite}
                busy={respondingTo === challenge.challenge_uuid}
              />
            ))}
            {data.friend_requests > 0 && (
              <Link
                to="/friends"
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-acid-text">
                  <Users size={16} />
                </span>
                <span className="flex-1 text-sm font-semibold text-ink">
                  {data.friend_requests} friend request{data.friend_requests > 1 ? 's' : ''}
                </span>
                <ArrowRight size={16} className="text-ink-3" />
              </Link>
            )}
          </div>
        </section>
      )}

      <section>
        <SectionTitle icon={Sparkles}>All time</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Days won"
            value={overview?.wins ?? 0}
            icon={Trophy}
            tone="brand"
            trend={recent.map((day) => day.wins)}
            trendColor="var(--brand-glow)"
          />
          <StatTile
            label="Targets hit"
            value={overview?.targets_hit ?? 0}
            icon={Target}
            tone="acid"
            trend={recent.map((day) => day.targets_hit)}
            trendColor="var(--accent-mark)"
          />
          {totalSteps > 0 && (
            <StatTile
              label="Steps logged"
              value={totalSteps}
              compact
              icon={Footprints}
              trend={recent.map((day) => day.totals_by_metric?.steps ?? 0)}
            />
          )}
          {totalDistance > 0 && (
            <StatTile
              label="Distance"
              value={totalDistance}
              suffix="km"
              icon={RouteIcon}
              trend={recent.map((day) => day.totals_by_metric?.distance ?? 0)}
            />
          )}
          {totalSteps === 0 && totalDistance === 0 && (
            <StatTile label="Entries" value={overview?.entries_logged ?? 0} icon={CalendarDays} />
          )}
          {(totalSteps === 0 || totalDistance === 0) && (
            <StatTile label="Live challenges" value={overview?.challenges_active ?? 0} icon={Flame} />
          )}
        </div>
      </section>

      <section>
        <SectionTitle
          icon={Trophy}
          action={
            <Link
              to="/challenges"
              className="text-xs font-semibold text-acid-text underline-offset-4 hover:underline"
            >
              See all
            </Link>
          }
        >
          Your challenges
        </SectionTitle>

        {active.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No challenges yet"
            body="Start one, invite a friend, and the app will hand you both a number every day."
            action={
              <Link to="/challenges/new">
                <Button icon={Plus}>Start a challenge</Button>
              </Link>
            }
          />
        ) : (
          <Stagger className="grid gap-3 md:grid-cols-2">
            {active.map((card, index) => (
              <StaggerItem key={card.challenge.challenge_uuid}>
                <ChallengeCard
                  card={card}
                  meId={user?.id}
                  index={index}
                  onLog={(selected) => setLogging(selected)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      {(activity.data?.length ?? 0) > 0 && (
        <section>
          <SectionTitle icon={CalendarDays}>Your last few months</SectionTitle>
          <Card className="p-4 sm:p-5">
            <ActivityHeatmap activity={activity.data} weeks={18} />
          </Card>
        </section>
      )}

      <LogSheet
        open={Boolean(logging)}
        onClose={() => setLogging(null)}
        challenge={logging?.challenge}
        period={logging?.period}
        entry={
          logging?.my_value !== null && logging?.my_value !== undefined
            ? { value: logging.my_value, note: logging.my_note }
            : null
        }
        onSaved={refresh}
      />
    </Page>
  );
}

/**
 * The one thing the home screen leads with: the challenge most in need of a
 * number today, at a size you can act on without reading.
 */
function HeroToday({ card, onLog }) {
  const [celebrate, setCelebrate] = useState(false);
  const { challenge, period } = card;
  const unit = challenge.unit;
  const target = period?.target_value ?? 0;
  const mine = card.my_value ?? 0;
  const logged = card.my_value !== null && card.my_value !== undefined;
  const remaining = Math.max(0, target - mine);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      <Card glow className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-70 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklab, var(--brand) 55%, transparent), transparent 70%)',
          }}
          aria-hidden
        />
        <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />

        <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-7">
          <div className="flex justify-center">
            <ProgressRing value={mine} target={target} size={148} stroke={11}>
              <div className="text-center">
                <p className="font-sans text-[1.6rem] font-bold leading-none text-ink [font-variant-numeric:proportional-nums]">
                  <Counter value={mine} unit={unit} />
                </p>
                <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                  of {formatMetric(target, unit)}
                </p>
              </div>
            </ProgressRing>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={card.hit_target ? 'acid' : 'brand'}>
                {periodLabel(period, challenge.period_type)}
              </Badge>
              <span className="text-xs text-ink-3">{timeLeftLabel(period?.period_end)}</span>
              {card.current_streak > 0 && (
                <Badge tone="brand" icon={Flame}>
                  {card.current_streak} in a row
                </Badge>
              )}
            </div>

            <h2 className="mt-3 text-2xl leading-tight sm:text-3xl">
              <Link
                to={`/challenges/${challenge.challenge_uuid}`}
                className="underline-offset-4 hover:underline"
              >
                {challenge.name}
              </Link>
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              {card.hit_target ? (
                <>
                  Target’s down — you’re{' '}
                  <span className="font-semibold text-acid-text">
                    {formatMetric(mine - target, unit)} {UNITS[unit]?.label}
                  </span>{' '}
                  past it.{' '}
                  {card.my_rank === 1 ? 'Top of the board right now.' : `Currently #${card.my_rank}.`}
                </>
              ) : logged ? (
                <>
                  <span className="font-semibold text-ink">
                    {formatMetric(remaining, unit)} {UNITS[unit]?.label}
                  </span>{' '}
                  left to clear today’s number.
                </>
              ) : (
                <>
                  Nobody’s logged for you yet.{' '}
                  {card.logged_count > 0
                    ? `${card.logged_count} of your crew already have.`
                    : 'Be the first in.'}
                </>
              )}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button
                variant={card.hit_target ? 'outline' : 'acid'}
                size="lg"
                onClick={() => {
                  if (card.hit_target) setCelebrate(true);
                  onLog();
                }}
              >
                {logged ? 'Update your number' : 'Log today'}
              </Button>
              <Link to={`/challenges/${challenge.challenge_uuid}`}>
                <Button variant="ghost" size="lg" iconRight={ArrowRight}>
                  The board
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
