/** Formatting helpers. Everything the backend sends is UTC. */

/**
 * Parse a timestamp from the API.
 *
 * Postgres hands back `2026-08-22T18:12:34+00:00`, SQLite (local dev) hands
 * back `2026-08-22T18:12:34` with no zone at all — and `new Date()` reads that
 * second form as *local* time, which silently shifts every chart by the
 * viewer's UTC offset. Anything without an explicit offset is treated as UTC,
 * which is what the backend guarantees it is.
 */
export function parseUTC(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const nowUTC = () => new Date();

/* ------------------------------------------------------------------ numbers */

export function formatNumber(value, { decimals } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const places = decimals ?? (Number.isInteger(value) ? 0 : 1);
  return value.toLocaleString(undefined, {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
}

/** 12,400 → 12.4k. Used where a full number would blow the layout. */
export function compactNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 10_000) return `${Math.round(value / 1000)}k`;
  if (abs >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return formatNumber(value);
}

/** Steps are whole numbers; kilometres and miles carry one decimal. */
export function formatMetric(value, unit) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (unit === 'steps') return formatNumber(Math.round(value), { decimals: 0 });
  return formatNumber(value, { decimals: 1 });
}

export function unitLabel(unit, value) {
  if (unit === 'steps') return value === 1 ? 'step' : 'steps';
  return unit || '';
}

export function formatMetricWithUnit(value, unit) {
  return `${formatMetric(value, unit)} ${unitLabel(unit, value)}`.trim();
}

export const percent = (value, total) => {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(999, (value / total) * 100));
};

/* -------------------------------------------------------------------- dates */

const DAY_MS = 86_400_000;

export function formatDate(value, options = { day: 'numeric', month: 'short' }) {
  const date = parseUTC(value);
  return date ? date.toLocaleDateString(undefined, options) : '—';
}

export function formatDateTime(value) {
  const date = parseUTC(value);
  if (!date) return '—';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Whole-day difference between two instants, in the viewer's own timezone. */
function daysBetween(a, b) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(a) - startOfDay(b)) / DAY_MS);
}

/**
 * What to call a period in a list: "Today", "Yesterday", "Tue 12 Aug", or for
 * weekly challenges the week it opens.
 */
export function periodLabel(period, periodType = 'daily', { long = false } = {}) {
  const start = parseUTC(period?.period_start);
  if (!start) return '—';
  const offset = daysBetween(new Date(), start);

  if (periodType === 'hourly') {
    return start.toLocaleString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      ...(offset === 0 ? {} : { day: 'numeric', month: 'short' }),
    });
  }
  if (periodType === 'weekly') {
    const end = parseUTC(period.period_end);
    const endLabel = end
      ? new Date(end.getTime() - DAY_MS).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
        })
      : '';
    return `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${endLabel}`;
  }

  if (offset === 0) return 'Today';
  if (offset === 1) return 'Yesterday';
  if (offset === -1) return 'Tomorrow';
  return start.toLocaleDateString(
    undefined,
    long
      ? { weekday: 'long', day: 'numeric', month: 'long' }
      : { weekday: 'short', day: 'numeric', month: 'short' }
  );
}

/** Short axis tick: "12 Aug", or "W32" for weekly challenges. */
export function periodTick(period, periodType = 'daily') {
  const start = parseUTC(period?.period_start);
  if (!start) return '';
  if (periodType === 'hourly') {
    return start.toLocaleTimeString(undefined, { hour: 'numeric' });
  }
  return start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function relativeTime(value) {
  const date = parseUTC(value);
  if (!date) return '';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const table = [
    [60, 'second', 1],
    [3600, 'minute', 60],
    [86400, 'hour', 3600],
    [604800, 'day', 86400],
    [2629800, 'week', 604800],
    [31557600, 'month', 2629800],
    [Infinity, 'year', 31557600],
  ];
  if (Math.abs(seconds) < 45) return 'just now';
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [limit, unit, divisor] of table) {
    if (Math.abs(seconds) < limit) {
      return format.format(-Math.round(seconds / divisor), unit);
    }
  }
  return '';
}

/**
 * How long is left in a period, as parts a countdown can render separately.
 * Returns null once the window has closed.
 */
export function timeLeft(periodEnd) {
  const end = parseUTC(periodEnd);
  if (!end) return null;
  const ms = end.getTime() - Date.now();
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  return {
    ms,
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

export function timeLeftLabel(periodEnd) {
  const left = timeLeft(periodEnd);
  if (!left) return 'closed';
  if (left.days >= 1) return `${left.days}d ${left.hours}h left`;
  if (left.hours >= 1) return `${left.hours}h ${left.minutes}m left`;
  return `${left.minutes}m left`;
}

/** YYYY-MM-DD in UTC — the key the activity endpoint buckets by. */
export function dayKey(value) {
  const date = parseUTC(value);
  return date ? date.toISOString().slice(0, 10) : '';
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const possessive = (name) => (name?.endsWith('s') ? `${name}’` : `${name}’s`);

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  if (hour < 22) return 'Evening';
  return 'Late one';
}
