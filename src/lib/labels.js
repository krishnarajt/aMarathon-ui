/** Backend enum values → the words shown on screen. */

export const METRICS = {
  steps: { label: 'Steps', short: 'steps', verb: 'walked', icon: 'footprints' },
  distance: { label: 'Distance', short: 'distance', verb: 'covered', icon: 'route' },
};

export const UNITS = {
  steps: { label: 'steps', long: 'Steps' },
  km: { label: 'km', long: 'Kilometres' },
  mi: { label: 'mi', long: 'Miles' },
};

export const PERIOD_TYPES = {
  daily: { label: 'Daily', noun: 'day', plural: 'days', blurb: 'A fresh target every midnight UTC' },
  weekly: { label: 'Weekly', noun: 'week', plural: 'weeks', blurb: 'One number to chase all week' },
  hourly: { label: 'Hourly', noun: 'hour', plural: 'hours', blurb: 'A new target every hour — chaos mode' },
};

export const WIN_RULES = {
  highest_above_target: {
    label: 'Beat it, then beat them',
    short: 'Highest over target',
    blurb: 'You have to hit the target. Of everyone who did, the biggest number wins.',
  },
  highest_value: {
    label: 'Biggest number wins',
    short: 'Highest value',
    blurb: 'Target or no target, the highest number takes the day.',
  },
  all_who_hit_target: {
    label: 'Everybody eats',
    short: 'All who hit target',
    blurb: 'Co-op. Everyone who reaches the target wins it together.',
  },
  first_to_target: {
    label: 'First past the post',
    short: 'First to target',
    blurb: 'Earliest to cross the target wins. Log it the moment you get there.',
  },
};

export const CHALLENGE_STATUS = {
  active: { label: 'Live', tone: 'good' },
  completed: { label: 'Finished', tone: 'muted' },
  cancelled: { label: 'Called off', tone: 'muted' },
};

export const PARTICIPANT_STATUS = {
  accepted: { label: 'In' },
  invited: { label: 'Invited' },
  declined: { label: 'Declined' },
  left: { label: 'Left' },
};

export const metricLabel = (metric) => METRICS[metric]?.label ?? metric;
export const winRuleLabel = (rule) => WIN_RULES[rule]?.label ?? rule;
export const winRuleShort = (rule) => WIN_RULES[rule]?.short ?? rule;
export const winRuleBlurb = (rule) => WIN_RULES[rule]?.blurb ?? '';
export const periodNoun = (type) => PERIOD_TYPES[type]?.noun ?? 'period';
export const periodPlural = (type) => PERIOD_TYPES[type]?.plural ?? 'periods';

/** Copy for the moment someone opens a challenge and nothing has happened yet. */
export const EMPTY_LINES = [
  'Nothing logged yet. Someone has to go first.',
  'A blank board. Suspicious.',
  'The target is up. The excuses are not.',
];

/** Shown on the home screen when every challenge is already logged. */
export const DONE_LINES = [
  'Everything logged. Go sit down.',
  'All squared away. Nice.',
  'Board’s clean. Enjoy it.',
];

export function pickLine(lines, seed = 0) {
  return lines[Math.abs(Math.floor(seed)) % lines.length];
}
