import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { chartChrome, seriesColorMap, MAX_SERIES } from '../../lib/palette';
import { formatMetric, periodTick, compactNumber } from '../../lib/format';
import { PERIOD_TYPES } from '../../lib/labels';
import ChartFrame, { ChartTooltip } from './ChartFrame';

/**
 * Everyone's number, period by period, against the target that was set for
 * each one.
 *
 * The target is the line the whole chart is about, so it is drawn in the
 * app's accent rather than taking a categorical slot — it is a reference, not a
 * seventh person. Past six people the tail folds away rather than inventing
 * hues the palette can't separate.
 */
export function TrendChart({
  timeseries = [],
  participants = [],
  meId,
  unit = 'steps',
  periodType = 'daily',
  title,
  subtitle,
  height = 300,
  focusUserId = null,
}) {
  const { theme } = useTheme();
  const chrome = chartChrome(theme);

  const { data, series, hidden } = useMemo(() => {
    // Fixed slot order — me first, then the participant list as the backend
    // returns it — so nobody changes colour when the standings move.
    const ordered = [
      ...(meId ? [meId] : []),
      ...participants.map((person) => person.user_id ?? person.user?.id).filter(Boolean),
    ];
    const colors = seriesColorMap(ordered, theme);

    const byId = new Map();
    for (const person of participants) {
      const id = person.user_id ?? person.user?.id;
      if (id) byId.set(id, person.display_name ?? person.user?.display_name ?? person.username);
    }
    for (const point of timeseries) {
      for (const entry of point.entries ?? []) {
        if (!byId.has(entry.user_id)) byId.set(entry.user_id, entry.display_name);
      }
    }

    const ids = [...new Set(ordered.filter((id) => byId.has(id)))];
    for (const id of byId.keys()) if (!ids.includes(id)) ids.push(id);

    const shown = ids.slice(0, MAX_SERIES);
    const rest = ids.slice(MAX_SERIES);

    const rows = timeseries.map((point) => {
      const row = {
        label: periodTick(point, periodType),
        target: point.target_value,
        periodIndex: point.period_index,
      };
      for (const entry of point.entries ?? []) {
        if (shown.includes(entry.user_id)) row[`u${entry.user_id}`] = entry.value;
      }
      return row;
    });

    return {
      data: rows,
      series: shown.map((id) => ({
        id,
        key: `u${id}`,
        name: byId.get(id) ?? `#${id}`,
        color: colors.get(id) ?? chrome.muted,
      })),
      hidden: rest.length,
    };
  }, [timeseries, participants, meId, theme, periodType, chrome.muted]);

  const noun = PERIOD_TYPES[periodType]?.noun ?? 'period';
  const resolvedTitle = title ?? `Every ${noun}, everyone`;

  const legend = [
    ...series.map((item) => ({ key: item.key, label: item.name, color: item.color })),
    { key: 'target', label: 'Target', color: chrome.target, dash: true },
  ];

  const table = {
    caption: resolvedTitle,
    columns: [
      { key: 'label', label: noun.charAt(0).toUpperCase() + noun.slice(1) },
      { key: 'target', label: 'Target' },
      ...series.map((item) => ({ key: item.key, label: item.name })),
    ],
    rows: data
      .slice()
      .reverse()
      .map((row) => ({
        key: row.periodIndex,
        cells: [
          row.label,
          formatMetric(row.target, unit),
          ...series.map((item) =>
            row[item.key] === undefined ? '—' : formatMetric(row[item.key], unit)
          ),
        ],
      })),
  };

  return (
    <ChartFrame
      title={resolvedTitle}
      subtitle={
        subtitle ??
        (hidden
          ? `${hidden} more not shown — see the table`
          : `Everyone’s number against each ${noun}’s target`)
      }
      legend={legend}
      table={table}
      height={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 14, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={chrome.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: chrome.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: chrome.grid }}
            minTickGap={22}
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
            content={<ChartTooltip formatter={(value) => formatMetric(value, unit)} />}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target"
            stroke={chrome.target}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={false}
            isAnimationActive
            animationDuration={700}
          />
          {series.map((item, index) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              stroke={item.color}
              strokeWidth={focusUserId && focusUserId !== item.id ? 1.5 : 2}
              strokeOpacity={focusUserId && focusUserId !== item.id ? 0.35 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
              connectNulls
              dot={false}
              // The surface ring keeps the hovered point readable where two
              // people land on the same number.
              activeDot={{ r: 4.5, strokeWidth: 2, stroke: chrome.surface }}
              isAnimationActive
              animationDuration={760}
              animationBegin={index * 90}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default TrendChart;
