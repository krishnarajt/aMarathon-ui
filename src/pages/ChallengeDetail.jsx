import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  ChartNoAxesColumn,
  Crown,
  Flame,
  Footprints,
  History,
  Medal,
  Route as RouteIcon,
  Settings2,
  Target,
  Timer,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useQuery from '../hooks/useQuery';
import { formatDate, formatMetric, periodLabel, timeLeftLabel } from '../lib/format';
import { PERIOD_TYPES, UNITS, periodNoun, winRuleBlurb, winRuleLabel } from '../lib/labels';
import { Page } from '../components/ui/Motion';
import { Card, SectionTitle } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Counter from '../components/ui/Counter';
import { ProgressRing } from '../components/ui/ProgressRing';
import { EmptyState, ErrorState, SkeletonCard } from '../components/ui/Feedback';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import LogSheet from '../components/challenge/LogSheet';
import EntryList from '../components/challenge/EntryList';
import Leaderboard from '../components/challenge/Leaderboard';
import ChallengeSettings from '../components/challenge/ChallengeSettings';
import StandingsChart from '../components/charts/StandingsChart';
import TrendChart from '../components/charts/TrendChart';
import WinsChart from '../components/charts/WinsChart';

const TABS = [
  { value: 'today', label: 'Today', icon: Zap },
  { value: 'board', label: 'Board', icon: Medal },
  { value: 'trends', label: 'Trends', icon: ChartNoAxesColumn },
  { value: 'history', label: 'History', icon: History },
  { value: 'crew', label: 'Crew', icon: Users },
];

export default function ChallengeDetail() {
  const { uuid } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('today');
  const [logging, setLogging] = useState(false);

  const detail = useQuery(useCallback(() => api.challenge(uuid), [uuid]), [uuid]);
  const board = useQuery(useCallback(() => api.leaderboard(uuid), [uuid]), [uuid]);
  const series = useQuery(useCallback(() => api.timeseries(uuid, 90), [uuid]), [uuid]);
  const history = useQuery(useCallback(() => api.periods(uuid, { limit: 60 }), [uuid]), [uuid]);

  const challenge = detail.data?.challenge;
  const participants = detail.data?.participants ?? [];
  const period = detail.data?.current_period;
  const unit = challenge?.unit ?? 'steps';
  const isCreator = challenge?.creator?.id === user?.id;
  const isInvited = challenge?.my_status === 'invited';

  const myEntry = useMemo(
    () => period?.entries?.find((entry) => entry.user_id === user?.id) ?? null,
    [period, user?.id]
  );
  const myRow = useMemo(
    () => (board.data ?? []).find((row) => row.user_id === user?.id) ?? null,
    [board.data, user?.id]
  );

  const refresh = useCallback(() => {
    detail.reload();
    board.reload();
    series.reload();
    history.reload();
  }, [detail, board, series, history]);

  async function respond(accept) {
    try {
      await api.respondToChallenge(uuid, accept);
      toast(accept ? 'You’re in.' : 'Declined.', accept ? 'win' : 'info');
      if (accept) refresh();
      else navigate('/challenges');
    } catch (caught) {
      toast(caught.message, 'error');
    }
  }

  if (detail.loading && !detail.data) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-10 w-2/3 rounded-xl" />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (detail.error) {
    return (
      <Page>
        <BackLink />
        <ErrorState error={detail.error} onRetry={detail.reload} className="mt-6" />
      </Page>
    );
  }

  if (!challenge) return null;

  const MetricIcon = challenge.metric === 'steps' ? Footprints : RouteIcon;
  const target = period?.target_value ?? 0;
  const mine = myEntry?.value ?? 0;
  const noun = periodNoun(challenge.period_type);

  return (
    <Page className="space-y-6">
      <BackLink />

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl leading-tight sm:text-4xl">{challenge.name}</h1>
            {challenge.description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
                {challenge.description}
              </p>
            )}
          </div>
          <AvatarStack
            users={participants
              .filter((row) => row.status === 'accepted')
              .map((row) => row.user)}
            size="md"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand" icon={MetricIcon}>
            {formatMetric(challenge.target_min, unit)}–{formatMetric(challenge.target_max, unit)}{' '}
            {UNITS[unit]?.label}
          </Badge>
          <Badge icon={CalendarDays}>{PERIOD_TYPES[challenge.period_type]?.label}</Badge>
          <Badge icon={Trophy}>{winRuleLabel(challenge.win_rule)}</Badge>
          {challenge.status !== 'active' && <Badge tone="muted">{challenge.status}</Badge>}
        </div>
      </header>

      {isInvited && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-brand-bright/40 bg-brand/8 p-4">
          <p className="text-sm text-ink-2">
            <span className="font-semibold text-ink">
              {challenge.creator?.display_name} invited you.
            </span>{' '}
            Accept and today’s number counts for you too.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => respond(false)}>
              No thanks
            </Button>
            <Button variant="acid" size="sm" onClick={() => respond(true)}>
              I’m in
            </Button>
          </div>
        </Card>
      )}

      <Tabs
        id="challenge"
        tabs={
          isCreator
            ? [...TABS, { value: 'settings', label: 'Settings', icon: Settings2 }]
            : [...TABS, { value: 'settings', label: 'Options', icon: Settings2 }]
        }
        value={tab}
        onChange={setTab}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          {tab === 'today' && (
            <>
              {period ? (
                <>
                  <Card glow className="relative overflow-hidden p-5 sm:p-6">
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
                      <ProgressRing value={mine} target={target} size={140} stroke={11}>
                        <div className="text-center">
                          <p className="font-sans text-2xl font-bold leading-none text-ink [font-variant-numeric:proportional-nums]">
                            <Counter value={mine} unit={unit} />
                          </p>
                          <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                            of {formatMetric(target, unit)}
                          </p>
                        </div>
                      </ProgressRing>

                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                          <Badge tone="acid" icon={Target}>
                            {periodLabel(period, challenge.period_type)}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                            <Timer size={12} aria-hidden />
                            {timeLeftLabel(period.period_end)}
                          </span>
                        </div>
                        <p className="mt-3 text-lg leading-snug text-ink">
                          {myEntry
                            ? mine >= target
                              ? 'Target’s down. Anyone can still beat it.'
                              : `${formatMetric(target - mine, unit)} ${UNITS[unit]?.label} to go.`
                            : `Today wants ${formatMetric(target, unit)} ${UNITS[unit]?.label}.`}
                        </p>
                        <p className="mt-1.5 text-xs text-ink-3">{winRuleBlurb(challenge.win_rule)}</p>

                        {challenge.my_status === 'accepted' && challenge.status === 'active' && (
                          <Button
                            variant={myEntry ? 'outline' : 'acid'}
                            size="lg"
                            className="mt-4"
                            onClick={() => setLogging(true)}
                          >
                            {myEntry ? 'Update your number' : 'Log it'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>

                  {(period.entries?.length ?? 0) > 0 && (
                    <StandingsChart
                      standings={(period.entries ?? []).map((entry) => ({
                        user_id: entry.user_id,
                        username: entry.user?.username,
                        display_name: entry.user?.display_name,
                        value: entry.value,
                        is_winner: entry.is_winner,
                        hit_target: entry.value >= target,
                      }))}
                      target={target}
                      unit={unit}
                      meId={user?.id}
                      title={`The board · ${periodLabel(period, challenge.period_type)}`}
                    />
                  )}

                  <section>
                    <SectionTitle icon={Users}>Everyone’s numbers</SectionTitle>
                    <EntryList
                      period={period}
                      participants={participants}
                      unit={unit}
                      meId={user?.id}
                      onEdit={() => setLogging(true)}
                    />
                  </section>
                </>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="Hasn’t started yet"
                  body={`This one opens ${formatDate(challenge.starts_at, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}.`}
                />
              )}
            </>
          )}

          {tab === 'board' && (
            <>
              {myRow && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat label={`${noun}s won`} value={myRow.wins} icon={Crown} />
                  <MiniStat label="Targets hit" value={myRow.targets_hit} icon={Target} />
                  <MiniStat label="Streak" value={myRow.current_streak} icon={Flame} />
                  <MiniStat label="Best" value={myRow.best_value} unit={unit} icon={Trophy} />
                </div>
              )}
              <Leaderboard
                rows={board.data ?? []}
                loading={board.loading}
                unit={unit}
                meId={user?.id}
                periodNoun={noun}
              />
              <WinsChart leaderboard={board.data ?? []} meId={user?.id} periodNoun={noun} />
            </>
          )}

          {tab === 'trends' && (
            <>
              {(series.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={ChartNoAxesColumn}
                  title="No data yet"
                  body="Once a couple of numbers are logged the graphs start here."
                />
              ) : (
                <>
                  <TrendChart
                    timeseries={series.data}
                    participants={participants.map((row) => ({
                      user_id: row.user.id,
                      display_name: row.user.display_name,
                      username: row.user.username,
                    }))}
                    meId={user?.id}
                    unit={unit}
                    periodType={challenge.period_type}
                    height={320}
                  />
                  <TargetVsHit series={series.data} unit={unit} meId={user?.id} noun={noun} />
                </>
              )}
            </>
          )}

          {tab === 'history' && (
            <HistoryList
              periods={history.data ?? []}
              loading={history.loading}
              challenge={challenge}
              meId={user?.id}
            />
          )}

          {tab === 'crew' && (
            <Crew
              challenge={challenge}
              participants={participants}
              isCreator={isCreator}
              onChanged={refresh}
            />
          )}

          {tab === 'settings' && (
            <ChallengeSettings
              challenge={challenge}
              isCreator={isCreator}
              onChanged={refresh}
              onGone={() => navigate('/challenges')}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <LogSheet
        open={logging}
        onClose={() => setLogging(false)}
        challenge={challenge}
        period={period}
        entry={myEntry}
        onSaved={refresh}
      />
    </Page>
  );
}

function BackLink() {
  return (
    <Link
      to="/challenges"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-3 transition-colors hover:text-ink"
    >
      <ArrowLeft size={15} />
      Challenges
    </Link>
  );
}

function MiniStat({ label, value, unit, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5">
      <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">
        {Icon && <Icon size={11} aria-hidden />}
        {label}
      </p>
      <p className="mt-1.5 font-sans text-xl font-bold text-ink [font-variant-numeric:proportional-nums]">
        <Counter value={value ?? 0} unit={unit} compact={!unit && value > 9999} />
      </p>
    </div>
  );
}

/**
 * How often my number cleared the bar. One derived series, so no legend — the
 * title says what it is.
 */
function TargetVsHit({ series, unit, meId, noun }) {
  const mine = series
    .map((point) => {
      const entry = (point.entries ?? []).find((row) => row.user_id === meId);
      return entry ? { ...point, value: entry.value, hit: entry.hit_target } : null;
    })
    .filter(Boolean);

  if (mine.length < 2) return null;

  const hits = mine.filter((point) => point.hit).length;
  const rate = Math.round((hits / mine.length) * 100);
  const surplus =
    mine.reduce((total, point) => total + (point.value - point.target_value), 0) / mine.length;

  return (
    <Card className="p-5">
      <SectionTitle icon={Target}>Your hit rate</SectionTitle>
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="font-sans text-4xl font-bold leading-none text-ink [font-variant-numeric:proportional-nums]">
            <Counter value={rate} />
            <span className="text-xl text-ink-3">%</span>
          </p>
          <p className="mt-1.5 text-xs text-ink-3">
            {hits} of {mine.length} {noun}s cleared
          </p>
        </div>
        <div className="border-l border-line pl-6">
          <p
            className={`font-sans text-2xl font-bold leading-none [font-variant-numeric:proportional-nums] ${
              surplus >= 0 ? 'text-acid-text' : 'text-bad'
            }`}
          >
            {surplus >= 0 ? '+' : '−'}
            {formatMetric(Math.abs(surplus), unit)}
          </p>
          <p className="mt-1.5 text-xs text-ink-3">average against target</p>
        </div>
      </div>

      {/* One cell per period: filled means the target went down. Cheaper to
          read at a glance than a second line chart of the same numbers. */}
      <div className="mt-5 flex flex-wrap gap-1">
        {mine.map((point) => (
          <span
            key={point.period_id}
            title={`${formatMetric(point.value, unit)} vs ${formatMetric(point.target_value, unit)}`}
            className={`h-3.5 w-3.5 rounded-[3px] ${point.hit ? 'bg-acid-mark' : 'bg-surface-3'}`}
          />
        ))}
      </div>
    </Card>
  );
}

function HistoryList({ periods, loading, challenge, meId }) {
  const [open, setOpen] = useState(null);
  const unit = challenge.unit;

  if (loading && !periods.length) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="shimmer h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!periods.length) {
    return <EmptyState icon={History} title="No history yet" body="Come back after a day or two." />;
  }

  return (
    <ul className="space-y-2">
      {periods.map((period) => {
        const mine = period.entries?.find((entry) => entry.user_id === meId);
        const winners = period.entries?.filter((entry) => entry.is_winner) ?? [];
        const expanded = open === period.id;
        return (
          <li key={period.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : period.id)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3 p-3.5 text-left"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 font-mono text-[0.7rem] text-ink-2">
                {period.period_index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {periodLabel(period, challenge.period_type)}
                </span>
                <span className="block truncate text-xs text-ink-3">
                  Target {formatMetric(period.target_value, unit)} ·{' '}
                  {period.entries?.length ?? 0} logged
                </span>
              </span>
              <span className="shrink-0 text-right">
                {mine ? (
                  <span
                    className={`tabular text-sm font-bold ${
                      mine.value >= period.target_value ? 'text-acid-text' : 'text-ink-2'
                    }`}
                  >
                    {formatMetric(mine.value, unit)}
                  </span>
                ) : (
                  <span className="text-xs text-ink-3">—</span>
                )}
                {winners.length > 0 && (
                  <span className="mt-0.5 flex items-center justify-end gap-1 text-[0.68rem] text-ink-3">
                    <Crown size={10} aria-hidden />
                    {winners.length === 1
                      ? winners[0].user_id === meId
                        ? 'you'
                        : winners[0].user?.display_name?.split(' ')[0]
                      : `${winners.length} won`}
                  </span>
                )}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden border-t border-line"
                >
                  <div className="p-3.5">
                    <EntryList period={period} unit={unit} meId={meId} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}

function Crew({ challenge, participants, isCreator, onChanged }) {
  const { toast } = useToast();
  const friends = useQuery(useCallback(() => api.friends(), []));
  const [inviting, setInviting] = useState(null);

  const already = new Set(participants.map((row) => row.user.id));
  const invitable = (friends.data ?? []).filter((friend) => !already.has(friend.id));

  async function invite(friend) {
    setInviting(friend.username);
    try {
      await api.inviteToChallenge(challenge.challenge_uuid, [friend.username]);
      toast(`${friend.display_name} invited.`, 'success');
      await onChanged();
    } catch (caught) {
      toast(caught.message, 'error');
    } finally {
      setInviting(null);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle icon={Users}>In the challenge</SectionTitle>
        <ul className="space-y-2">
          {participants.map((row) => (
            <li
              key={row.user.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
            >
              <Avatar user={row.user} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {row.user.display_name}
                  {row.user.id === challenge.creator?.id && (
                    <span className="ml-2 text-[0.65rem] font-bold uppercase tracking-wider text-acid-text">
                      host
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-3">@{row.user.username}</p>
              </div>
              <Badge
                tone={
                  row.status === 'accepted'
                    ? 'good'
                    : row.status === 'invited'
                      ? 'warn'
                      : 'muted'
                }
              >
                {row.status}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle icon={UserPlus}>Add someone</SectionTitle>
        {invitable.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title={friends.data?.length ? 'Everyone’s already here' : 'No friends to add'}
            body={
              friends.data?.length
                ? 'All of your friends are already in this one.'
                : 'Add friends first — you can only invite people you’re connected to.'
            }
            action={
              !friends.data?.length && (
                <Link to="/friends">
                  <Button variant="outline" size="sm">
                    Find people
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <ul className="space-y-2">
            {invitable.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <Avatar user={friend} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{friend.display_name}</p>
                  <p className="truncate text-xs text-ink-3">@{friend.username}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={UserPlus}
                  onClick={() => invite(friend)}
                  loading={inviting === friend.username}
                  disabled={!isCreator && challenge.my_status !== 'accepted'}
                >
                  Invite
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
