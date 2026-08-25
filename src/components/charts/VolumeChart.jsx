import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { chartChrome, seriesColors } from '../../lib/palette';
import { compactNumber, formatMetric, parseUTC } from '../../lib/format';
import { METRICS } from '../../lib/labels';
import { densifyActivity } from '../../lib/activity';
import ChartFrame, { ChartTooltip } from './ChartFrame';

/**
 * Daily volume for one metric across every challenge.
 *
 * One metric per chart on purpose: steps and kilometres can't share a y-axis,
 * and a second axis would be a lie about scale. The Stats page renders one of
 * these per metric the user actually has data for.
 */
export function VolumeChart({
  activity = [],
  metric = 'steps',
  unit,
  height = 240,
  cumulative = false,
  days = 90,
}) {
  const { theme } = useTheme();
  const chrome = chartChrome(theme);
  const color = seriesColors(theme)[metric === 'steps' ? 0 : 3];
  const resolvedUnit = unit ?? (metric === 'steps' ? 'steps' : 'km');

  const data = useMemo(() => {
    let running = 0;
    // Quiet days have to be present as zeroes or the axis lies about spacing.
    return densifyActivity(activity, days).map((day) => {
      const value = day.totals_by_metric?.[metric] ?? 0;
      running += value;
      return {
        date: day.date,
        label: parseUTC(`${day.date}T00:00:00`)?.toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
        }),
        value: cumulative ? running : value,
      };
    });
  }, [activity, metric, cumulative, days]);

  const hasData = data.some((row) => row.value > 0);
  if (!hasData) return null;

  const table = {
    caption: `Daily ${METRICS[metric]?.short ?? metric}`,
    columns: [
      { key: 'label', label: 'Day' },
      { key: 'value', label: cumulative ? 'Running total' : 'Total' },
    ],
    rows: data
      .slice()
      .reverse()
      .map((row) => ({ key: row.date, cells: [row.label, formatMetric(row.value, resolvedUnit)] })),
  };

  return (
    <ChartFrame
      title={metric === 'steps' ? 'Steps, day by day' : 'Distance, day by day'}
      subtitle={
        cumulative
          ? 'Everything you have put in, adding up'
          : `Across every challenge, in ${resolvedUnit}`
      }
      table={table}
      height={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id={`volume-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.26} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chrome.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: chrome.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: chrome.grid }}
            minTickGap={26}
          />
          <YAxis
            tick={{ fill: chrome.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value) => compactNumber(value)}
          />
          <Tooltip
            cursor={{ stroke: chrome.axis, strokeWidth: 1 }}
            content={<ChartTooltip formatter={(value) => formatMetric(value, resolvedUnit)} />}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={METRICS[metric]?.label ?? metric}
            stroke={color}
            strokeWidth={2}
            fill={`url(#volume-${metric})`}
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: chrome.surface }}
            isAnimationActive
            animationDuration={760}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default VolumeChart;
