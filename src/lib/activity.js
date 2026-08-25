const DAY_MS = 86_400_000;

const keyOf = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

/**
 * Fill in the days the activity endpoint left out.
 *
 * It only returns days something was logged, which is the right shape for a
 * heatmap (which builds its own calendar) and the wrong one for a line: a
 * categorical x-axis would put 15 June next to 29 July and draw a segment
 * between them as though they were consecutive. A quiet day is a zero, not a
 * gap, so this says so explicitly.
 *
 * The window ends today rather than at the last logged day — "nothing this
 * week" is worth seeing.
 */
export function densifyActivity(activity = [], days = 90) {
  const byDate = new Map(activity.map((day) => [day.date, day]));
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Start at the earlier of "days ago" and the first day with data, so a range
  // shorter than the user's history never crops what they did.
  const earliest = activity.length ? activity[0].date : null;
  let start = new Date(end.getTime() - (days - 1) * DAY_MS);
  if (earliest) {
    const [year, month, day] = earliest.split('-').map(Number);
    const firstLogged = new Date(year, month - 1, day);
    if (firstLogged > start) start = firstLogged;
  }

  const filled = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = keyOf(cursor);
    filled.push(
      byDate.get(key) ?? {
        date: key,
        entries: 0,
        targets_hit: 0,
        wins: 0,
        totals_by_metric: {},
      }
    );
  }
  return filled;
}

export default densifyActivity;
