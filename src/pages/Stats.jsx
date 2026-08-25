import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChartNoAxesColumn,
  Flame,
  Footprints,
  Route as RouteIcon,
  Target,
  Trophy,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import useQuery from '../hooks/useQuery';
import { formatMetric } from '../lib/format';
import { Page } from '../components/ui/Motion';
import { Card, SectionTitle } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import Button from '../components/ui/Button';
import StatTile from '../components/ui/StatTile';
import ActivityHeatmap from '../components/charts/ActivityHeatmap';
import VolumeChart from '../components/charts/VolumeChart';

const RANGES = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: 'A year' },
];

export default function Stats() {
  const { user } = useAuth();
  const [days, setDays] = useState(90);
  const [cumulative, setCumulative] = useState(false);

  const overview = useQuery(useCallback(() => api.overview(), []));
  const activity = useQuery(useCallback(() => api.activity(days), [days]), [days]);

  // Stable identity so the derived stats below don't recompute every render.
  const rows = useMemo(() => activity.data ?? [], [activity.data]);

  const derived = useMemo(() => {
    if (!rows.length) return null;
    const byDate = new Map(rows.map((day) => [day.date, day]));

    // Streak walks back from today so a day yet to be logged doesn't read as a
    // break — same rule the per-challenge streak uses on the backend.
    let streak = 0;
    const cursor = new Date();
    for (let step = 0; step < 400; step += 1) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
        cursor.getDate()
      ).padStart(2, '0')}`;
      const day = byDate.get(key);
      if (day?.targets_hit > 0) streak += 1;
      else if (step > 0 || day) break;
      cursor.setDate(cursor.getDate() - 1);
    }

    const active = rows.filter((day) => day.entries > 0).length;
    const hit = rows.reduce((total, day) => total + day.targets_hit, 0);
    const logged = rows.reduce((total, day) => total + day.entries, 0);

    return {
      streak,
      activeDays: active,
      hitRate: logged ? Math.round((hit / logged) * 100) : 0,
      bestDay: rows.reduce(
        (best, day) => (day.entries > (best?.entries ?? -1) ? day : best),
        null
      ),
    };
  }, [rows]);

  const totals = overview.data?.totals_by_metric ?? {};
  const metrics = Object.keys(totals).filter((metric) => totals[metric] > 0);

  return (
    <Page className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-tight sm:text-4xl">Your numbers</h1>
          <p className="mt-1 text-sm text-ink-3">Everything you’ve done, across every challenge.</p>
        </div>
        <Tabs
          id="range"
          size="sm"
          tabs={RANGES.map((range) => ({ value: range.value, label: range.label }))}
          value={days}
          onChange={setDays}
        />
      </header>

      {overview.error ? (
        <ErrorState error={overview.error} onRetry={overview.reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Days won"
              value={overview.data?.wins ?? 0}
              icon={Trophy}
              tone="brand"
              trend={rows.slice(-14).map((day) => day.wins)}
              trendColor="var(--brand-glow)"
            />
            <StatTile
              label="Targets hit"
              value={overview.data?.targets_hit ?? 0}
              icon={Target}
              tone="acid"
              trend={rows.slice(-14).map((day) => day.targets_hit)}
              trendColor="var(--accent-mark)"
            />
            <StatTile
              label="Current streak"
              value={derived?.streak ?? 0}
              suffix="days"
              icon={Flame}
            />
            <StatTile
              label="Hit rate"
              value={derived?.hitRate ?? 0}
              suffix="%"
              icon={ChartNoAxesColumn}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={ChartNoAxesColumn}
              title="No history yet"
              body="Log a number in any challenge and the graphs start filling in from that day."
              action={
                <Link to="/challenges">
                  <Button variant="outline">Go log something</Button>
                </Link>
              }
            />
          ) : (
            <>
              <section>
                <SectionTitle
                  icon={CalendarDays}
                  action={
                    <span className="text-xs text-ink-3">
                      {derived?.activeDays ?? 0} active days in {days}
                    </span>
                  }
                >
                  Consistency
                </SectionTitle>
                <Card className="p-4 sm:p-5">
                  <ActivityHeatmap activity={rows} weeks={days > 120 ? 52 : days > 45 ? 18 : 8} />
                </Card>
              </section>

              <section className="space-y-4">
                <SectionTitle
                  icon={ChartNoAxesColumn}
                  action={
                    <button
                      type="button"
                      onClick={() => setCumulative((current) => !current)}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[0.7rem] font-semibold text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
                    >
                      {cumulative ? 'Per day' : 'Running total'}
                    </button>
                  }
                >
                  Volume
                </SectionTitle>
                {metrics.length === 0 && (
                  <VolumeChart activity={rows} metric="steps" cumulative={cumulative} days={days} />
                )}
                {metrics.map((metric) => (
                  <VolumeChart
                    key={metric}
                    activity={rows}
                    metric={metric}
                    cumulative={cumulative}
                    days={days}
                  />
                ))}
              </section>

              <section>
                <SectionTitle>Lifetime</SectionTitle>
                <Card className="divide-y divide-line">
                  <Row
                    icon={Footprints}
                    label="Steps logged"
                    value={formatMetric(totals.steps ?? 0, 'steps')}
                  />
                  <Row
                    icon={RouteIcon}
                    label="Distance covered"
                    value={`${formatMetric(totals.distance ?? 0, 'km')} km`}
                  />
                  <Row
                    icon={CalendarDays}
                    label="Entries logged"
                    value={overview.data?.entries_logged ?? 0}
                  />
                  <Row
                    icon={Trophy}
                    label="Challenges joined"
                    value={overview.data?.challenges_total ?? 0}
                  />
                  <Row
                    icon={Flame}
                    label="Live right now"
                    value={overview.data?.challenges_active ?? 0}
                  />
                </Card>
              </section>

              <p className="pb-2 text-center text-xs text-ink-3">
                Signed in as @{user?.username} · numbers refresh every time you open this page
              </p>
            </>
          )}
        </>
      )}
    </Page>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-3">
        <Icon size={16} aria-hidden />
      </span>
      <span className="flex-1 text-sm text-ink-2">{label}</span>
      <span className="tabular text-sm font-bold text-ink">{value}</span>
    </div>
  );
}
