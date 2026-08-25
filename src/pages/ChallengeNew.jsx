import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dices,
  Footprints,
  Rocket,
  Route as RouteIcon,
  Users,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import useQuery from '../hooks/useQuery';
import { formatMetric } from '../lib/format';
import { PERIOD_TYPES, UNITS, WIN_RULES } from '../lib/labels';
import { Page } from '../components/ui/Motion';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { TextArea, TextField } from '../components/ui/Field';
import { SegmentedControl } from '../components/ui/Tabs';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/Feedback';

const STEPS = ['The basics', 'The numbers', 'The crew'];

const PRESETS = {
  steps: [
    { label: 'Casual', min: 5000, max: 8000 },
    { label: 'Serious', min: 8000, max: 12000 },
    { label: 'Unwell', min: 12000, max: 20000 },
  ],
  distance: [
    { label: 'Casual', min: 2, max: 5 },
    { label: 'Serious', min: 5, max: 10 },
    { label: 'Unwell', min: 10, max: 21 },
  ],
};

export default function ChallengeNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const friends = useQuery(useCallback(() => api.friends(), []));

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    metric: 'steps',
    unit: 'steps',
    target_min: 6000,
    target_max: 12000,
    period_type: 'daily',
    win_rule: 'highest_above_target',
    invite: [],
    ends_at: '',
  });

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  function changeMetric(metric) {
    const preset = PRESETS[metric][1];
    set({
      metric,
      // Steps must be the "steps" unit and distance must not be — the backend
      // rejects any other pairing, so switching metric resets both together.
      unit: metric === 'steps' ? 'steps' : 'km',
      target_min: preset.min,
      target_max: preset.max,
    });
  }

  const canContinue = useMemo(() => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1)
      return (
        Number(form.target_min) > 0 &&
        Number(form.target_max) >= Number(form.target_min)
      );
    return true;
  }, [step, form]);

  function go(next) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  async function create() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        metric: form.metric,
        unit: form.unit,
        target_min: Number(form.target_min),
        target_max: Number(form.target_max),
        period_type: form.period_type,
        win_rule: form.win_rule,
        invite: form.invite,
      };
      // A date input gives a local midnight; the API wants an instant.
      if (form.ends_at) payload.ends_at = new Date(`${form.ends_at}T23:59:59`).toISOString();

      const challenge = await api.createChallenge(payload);
      toast(`${challenge.name} is live. First target is up.`, 'win');
      navigate(`/challenges/${challenge.challenge_uuid}`, { replace: true });
    } catch (caught) {
      setError(caught.message);
      toast(caught.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const unitLabel = UNITS[form.unit]?.label ?? form.unit;

  return (
    <Page className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link
          to="/challenges"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          Challenges
        </Link>
        <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">Start something</h1>
      </header>

      <div className="flex items-center gap-2">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => index < step && go(index)}
            disabled={index > step}
            className="group flex-1 text-left"
          >
            <span className="relative block h-1.5 overflow-hidden rounded-full bg-surface-3">
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full bg-acid"
                initial={false}
                animate={{ width: index <= step ? '100%' : '0%' }}
                transition={{ type: 'spring', stiffness: 220, damping: 30 }}
              />
            </span>
            <span
              className={`mt-2 block text-[0.65rem] font-bold uppercase tracking-[0.12em] ${
                index <= step ? 'text-ink' : 'text-ink-3'
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      <Card glow className="overflow-hidden p-5 sm:p-6">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -32 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            {step === 0 && (
              <div className="space-y-5">
                <TextField
                  label="Name it"
                  value={form.name}
                  onChange={(event) => set({ name: event.target.value })}
                  placeholder="Dawn Patrol"
                  maxLength={80}
                  autoFocus
                />
                <TextArea
                  label="Trash talk"
                  hint="optional"
                  rows={3}
                  value={form.description}
                  onChange={(event) => set({ description: event.target.value })}
                  placeholder="Whoever moves first, moves best."
                />
                <div>
                  <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                    What are we counting?
                  </p>
                  <SegmentedControl
                    id="metric"
                    value={form.metric}
                    onChange={changeMetric}
                    options={[
                      { value: 'steps', label: 'Steps', icon: Footprints },
                      { value: 'distance', label: 'Distance', icon: RouteIcon },
                    ]}
                  />
                </div>
                {form.metric === 'distance' && (
                  <SegmentedControl
                    id="unit"
                    value={form.unit}
                    onChange={(unit) => set({ unit })}
                    options={[
                      { value: 'km', label: 'Kilometres' },
                      { value: 'mi', label: 'Miles' },
                    ]}
                  />
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                    Target range
                  </p>
                  <p className="mb-3 text-sm text-ink-3">
                    Every {PERIOD_TYPES[form.period_type]?.noun} the app picks a number somewhere in
                    here. Nobody knows it until it lands.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS[form.metric].map((preset) => {
                      const chosen =
                        Number(form.target_min) === preset.min &&
                        Number(form.target_max) === preset.max;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => set({ target_min: preset.min, target_max: preset.max })}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                            chosen
                              ? 'border-acid-dim bg-acid text-acid-ink'
                              : 'border-line bg-surface-2/60 text-ink-2 hover:border-line-strong hover:text-ink'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <TextField
                      label="Lowest"
                      type="number"
                      min="1"
                      step={form.metric === 'steps' ? '100' : '0.5'}
                      value={form.target_min}
                      onChange={(event) => set({ target_min: event.target.value })}
                      suffix={unitLabel}
                    />
                    <TextField
                      label="Highest"
                      type="number"
                      min="1"
                      step={form.metric === 'steps' ? '100' : '0.5'}
                      value={form.target_max}
                      onChange={(event) => set({ target_max: event.target.value })}
                      suffix={unitLabel}
                      error={
                        Number(form.target_max) < Number(form.target_min)
                          ? 'Must be at least the lowest'
                          : undefined
                      }
                    />
                  </div>

                  <RangePreview
                    min={Number(form.target_min)}
                    max={Number(form.target_max)}
                    unit={form.unit}
                  />
                </div>

                <div>
                  <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                    How often
                  </p>
                  <SegmentedControl
                    id="period"
                    value={form.period_type}
                    onChange={(period_type) => set({ period_type })}
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'hourly', label: 'Hourly' },
                    ]}
                  />
                  <p className="mt-2 text-xs text-ink-3">
                    {PERIOD_TYPES[form.period_type]?.blurb}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                    How you win
                  </p>
                  <div className="space-y-2">
                    {Object.entries(WIN_RULES).map(([value, rule]) => {
                      const chosen = form.win_rule === value;
                      return (
                        <motion.button
                          key={value}
                          type="button"
                          whileTap={{ scale: 0.99 }}
                          onClick={() => set({ win_rule: value })}
                          className={`block w-full rounded-2xl border p-3.5 text-left transition-colors ${
                            chosen
                              ? 'border-brand-bright bg-brand/12'
                              : 'border-line bg-surface-2/40 hover:border-line-strong'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-ink">{rule.label}</span>
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                                chosen ? 'border-brand-bright bg-brand-bright' : 'border-line'
                              }`}
                            >
                              {chosen && <Check size={12} className="text-white" />}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-ink-3">
                            {rule.blurb}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                    Who’s in
                  </p>
                  {friends.loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="shimmer h-14 rounded-2xl" />
                      ))}
                    </div>
                  ) : (friends.data ?? []).length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="No friends yet"
                      body="You can start solo — the target still lands every day — and invite people once they accept."
                      action={
                        <Link to="/friends">
                          <Button variant="outline" size="sm">
                            Find people
                          </Button>
                        </Link>
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      {friends.data.map((friend) => {
                        const chosen = form.invite.includes(friend.username);
                        return (
                          <motion.button
                            key={friend.id}
                            type="button"
                            whileTap={{ scale: 0.99 }}
                            onClick={() =>
                              set({
                                invite: chosen
                                  ? form.invite.filter((name) => name !== friend.username)
                                  : [...form.invite, friend.username],
                              })
                            }
                            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                              chosen
                                ? 'border-acid-dim bg-acid/10'
                                : 'border-line bg-surface-2/40 hover:border-line-strong'
                            }`}
                          >
                            <Avatar user={friend} size="md" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">
                                {friend.display_name}
                              </span>
                              <span className="block truncate text-xs text-ink-3">
                                @{friend.username}
                              </span>
                            </span>
                            <span
                              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                                chosen ? 'border-acid-dim bg-acid' : 'border-line'
                              }`}
                            >
                              {chosen && <Check size={13} className="text-acid-ink" />}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <TextField
                  label="End date"
                  hint="optional — runs forever without one"
                  type="date"
                  value={form.ends_at}
                  onChange={(event) => set({ ends_at: event.target.value })}
                />

                <Summary form={form} unitLabel={unitLabel} />

                {error && (
                  <p className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm font-medium text-bad">
                    {error}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => (step === 0 ? navigate('/challenges') : go(step - 1))}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button iconRight={ArrowRight} onClick={() => go(step + 1)} disabled={!canContinue}>
            Continue
          </Button>
        ) : (
          <Button variant="acid" icon={Rocket} onClick={create} loading={busy}>
            Launch it
          </Button>
        )}
      </div>
    </Page>
  );
}

/** Shows the band a target gets drawn from, with the midpoint called out. */
function RangePreview({ min, max, unit }) {
  if (!(min > 0) || !(max >= min)) return null;
  const middle = (min + max) / 2;
  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface-2/50 p-4">
      <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-3">
        <Dices size={12} aria-hidden />
        Each target lands somewhere in here
      </div>
      <div className="relative mt-4 h-2 rounded-full bg-surface-3">
        <span className="absolute inset-y-0 inset-x-0 rounded-full bg-[linear-gradient(90deg,var(--brand),var(--accent))]" />
        <span className="absolute -top-0.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-bg bg-ink" />
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="tabular font-semibold text-ink-2">{formatMetric(min, unit)}</span>
        <span className="tabular text-ink-3">avg {formatMetric(middle, unit)}</span>
        <span className="tabular font-semibold text-ink-2">{formatMetric(max, unit)}</span>
      </div>
    </div>
  );
}

function Summary({ form, unitLabel }) {
  const rows = [
    ['Counting', form.metric === 'steps' ? 'Steps' : `Distance in ${unitLabel}`],
    [
      'Target',
      `${formatMetric(Number(form.target_min), form.unit)}–${formatMetric(
        Number(form.target_max),
        form.unit
      )} ${unitLabel}`,
    ],
    ['Cadence', PERIOD_TYPES[form.period_type]?.label],
    ['Winner', WIN_RULES[form.win_rule]?.label],
    ['Inviting', form.invite.length ? form.invite.map((name) => `@${name}`).join(', ') : 'Just you'],
  ];

  return (
    <div className="rounded-2xl border border-line bg-surface-2/40 p-4">
      <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-3">
        Before you launch
      </p>
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 text-sm">
            <dt className="shrink-0 text-ink-3">{label}</dt>
            <dd className="text-right font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
