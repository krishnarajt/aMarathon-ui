import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { chartChrome, seriesColors } from '../../lib/palette';
import ChartFrame, { ChartTooltip } from './ChartFrame';

/**
 * Days won and targets hit, per person, over the whole challenge.
 *
 * Both are counts of periods, so they share one axis honestly. Grouped rather
 * than stacked: "hit the target" already includes the days you won, and a
 * stack would claim they add up.
 *
 * Colour here encodes the *measure*, not the person — the axis labels carry
 * identity, so spending six hues on six names would re-encode what the labels
 * already say and leave the legend unable to name either series.
 */
const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export function WinsChart({ leaderboard = [], meId, periodNoun = 'day', height = 260 }) {
  const { theme } = useTheme();
  const chrome = chartChrome(theme);

  const winColor = seriesColors(theme)[0];

  const rows = useMemo(
    () =>
      leaderboard.map((row) => ({
        name: row.display_name || row.username,
        userId: row.user_id,
        wins: row.wins,
        hits: row.targets_hit,
        logged: row.entries_logged,
        isMe: row.user_id === meId,
      })),
    [leaderboard, meId]
  );

  if (!rows.length) return null;

  const table = {
    caption: 'Wins and targets hit',
    columns: [
      { key: 'name', label: 'Who' },
      { key: 'wins', label: sentence(`${periodNoun}s won`) },
      { key: 'hits', label: 'Targets hit' },
      { key: 'logged', label: 'Logged' },
    ],
    rows: rows.map((row) => ({
      key: row.userId,
      cells: [row.name, row.wins, row.hits, row.logged],
    })),
  };

  return (
    <ChartFrame
      title="Who’s actually winning"
      subtitle={sentence(`${periodNoun}s won, and how often the target went down`)}
      table={table}
      height={height}
      legend={[
        { key: 'wins', label: sentence(`${periodNoun}s won`), color: winColor },
        { key: 'hits', label: 'Targets hit', color: chrome.muted },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 18, right: 10, left: -18, bottom: 0 }}
          barGap={2}
          barCategoryGap="28%"
        >
          <CartesianGrid stroke={chrome.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: chrome.text, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: chrome.grid }}
            interval={0}
          />
          <YAxis
            tick={{ fill: chrome.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: `color-mix(in oklab, ${chrome.axis} 10%, transparent)` }}
            content={<ChartTooltip />}
          />
          <Bar dataKey="hits" name="Targets hit" radius={[5, 5, 0, 0]} barSize={20} fill={chrome.muted} />
          <Bar
            dataKey="wins"
            name={sentence(`${periodNoun}s won`)}
            radius={[5, 5, 0, 0]}
            barSize={20}
            fill={winColor}
            isAnimationActive
            animationDuration={720}
          >
            {/* Only "me" is picked out, and by opacity rather than a hue that
                would read as a third series. */}
            {rows.map((row) => (
              <Cell key={row.userId} fill={winColor} fillOpacity={row.isMe || !meId ? 1 : 0.72} />
            ))}
            <LabelList dataKey="wins" position="top" fill={chrome.text} fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default WinsChart;
