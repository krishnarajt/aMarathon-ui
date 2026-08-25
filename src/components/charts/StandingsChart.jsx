import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { chartChrome, seriesColorMap } from '../../lib/palette';
import { compactNumber, formatMetric } from '../../lib/format';
import ChartFrame, { ChartTooltip } from './ChartFrame';

/**
 * Where everyone stands in the period on show.
 *
 * Horizontal because names are words: rotating six labels under a column chart
 * to save 40px of height is a bad trade. The target is a reference line rather
 * than a second bar — it is the same measure, so it belongs on the same axis.
 */
export function StandingsChart({
  standings = [],
  target,
  unit = 'steps',
  meId,
  title = 'Today’s board',
  subtitle,
  height,
}) {
  const { theme } = useTheme();
  const chrome = chartChrome(theme);

  const rows = useMemo(() => {
    const ordered = [
      ...(meId ? [meId] : []),
      ...standings.map((row) => row.user_id),
    ];
    const colors = seriesColorMap(ordered, theme);
    return standings
      .slice()
      .sort((a, b) => b.value - a.value)
      .map((row) => ({
        ...row,
        name: row.display_name || row.username,
        color: colors.get(row.user_id) ?? chrome.muted,
      }));
  }, [standings, meId, theme, chrome.muted]);

  const chartHeight = height ?? Math.max(150, rows.length * 46 + 56);
  const max = Math.max(target ?? 0, ...rows.map((row) => row.value), 1);

  const table = {
    caption: title,
    columns: [
      { key: 'name', label: 'Who' },
      { key: 'value', label: 'Logged' },
      { key: 'target', label: 'Target' },
    ],
    rows: rows.map((row) => ({
      key: row.user_id,
      cells: [
        row.name + (row.is_winner ? ' · winner' : ''),
        formatMetric(row.value, unit),
        formatMetric(target, unit),
      ],
    })),
  };

  if (!rows.length) return null;

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle ?? `Target ${formatMetric(target, unit)} ${unit === 'steps' ? 'steps' : unit}`}
      table={table}
      height={chartHeight}
      legend={[]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          // Room at the top for the target line's own label.
          margin={{ top: 22, right: 56, left: 4, bottom: 6 }}
          barCategoryGap={10}
        >
          <XAxis type="number" domain={[0, max * 1.12]} hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: chrome.text, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={86}
          />
          <Tooltip
            cursor={{ fill: `color-mix(in oklab, ${chrome.axis} 12%, transparent)` }}
            content={<ChartTooltip formatter={(value) => formatMetric(value, unit)} />}
          />
          {target > 0 && (
            <ReferenceLine
              x={target}
              stroke={chrome.target}
              strokeWidth={2}
              strokeDasharray="5 4"
              label={{
                value: `target ${compactNumber(target)}`,
                position: 'top',
                fill: chrome.text,
                fontSize: 10,
              }}
            />
          )}
          <Bar
            dataKey="value"
            name="Logged"
            radius={[0, 6, 6, 0]}
            maxBarSize={22}
            isAnimationActive
            animationDuration={720}
          >
            {rows.map((row) => (
              <Cell key={row.user_id} fill={row.color} />
            ))}
            {/* Six bars at most, each with room at the tip — labelling every
                one is fine here in a way it never is on a line chart. */}
            <LabelList
              dataKey="value"
              position="right"
              offset={8}
              fill={chrome.text}
              fontSize={11}
              formatter={(value) => compactNumber(value)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default StandingsChart;
