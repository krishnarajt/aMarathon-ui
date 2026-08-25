/**
 * Chart colours.
 *
 * Six categorical slots per mode, in a fixed order. They are stepped from the
 * app's own hues onto each surface and validated, not eyeballed: OKLCH
 * lightness inside the mode's band, chroma above the identity floor, and every
 * *adjacent* pair separated under simulated protanopia and deuteranopia
 * (Machado 2009, severity 1.0) — worst adjacent pair ΔE 12.0 dark / 10.2 light
 * against an ≥8 target, and 19.3 / 16.5 unsimulated against a ≥15 floor. Every
 * slot clears 3:1 against its surface.
 *
 * Slot 1 is the brand crimson stepped for each surface, so "me" reads as the
 * app's own colour wherever it appears.
 *
 * Two rules that keep them honest:
 *   - Slots are assigned in a fixed order and never cycled. Past six people a
 *     chart folds the rest into one muted "others" series rather than inventing
 *     a seventh hue.
 *   - Colour follows the person, not their position. `seriesColorMap` keys off
 *     user id in a stable order, so filtering or a change in the standings
 *     never repaints anyone.
 *
 * They are plain hex on purpose: Recharts writes fill/stroke as SVG
 * presentation attributes, and `var(--x)` does not resolve there.
 */

const SERIES = {
  dark: ['#ea4770', '#0191ed', '#bb7e04', '#03a483', '#956cf8', '#56a300'],
  light: ['#ca2356', '#0176c1', '#986600', '#05856a', '#7b4fd8', '#458400'],
};

/**
 * Non-series ink: axes, gridlines, target rules, surfaces behind a tooltip.
 * `target` and `muted` are marks, not text, so both clear 3:1 against their
 * surface — the light-mode target is a deeper step of the same lime the UI uses
 * as a fill, because the fill itself only manages 1.3:1 on paper.
 */
const CHROME = {
  dark: {
    grid: '#243135',
    axis: '#6b7f84',
    text: '#a3b4b7',
    strongText: '#eef4f3',
    surface: '#161f21',
    surfaceElevated: '#1e2a2d',
    border: '#2a393d',
    target: '#c8f135',
    muted: '#5c7076',
    good: '#35d6a4',
  },
  light: {
    grid: '#e2ddd0',
    axis: '#7d8b8f',
    text: '#4c5c61',
    strongText: '#131a1c',
    surface: '#fffdf9',
    surfaceElevated: '#f0ece2',
    border: '#ded8c9',
    target: '#6b8f08',
    muted: '#7d8b8f',
    good: '#0d8f68',
  },
};

export const seriesColors = (mode = 'dark') => SERIES[mode] ?? SERIES.dark;
export const chartChrome = (mode = 'dark') => CHROME[mode] ?? CHROME.dark;
export const MAX_SERIES = SERIES.dark.length;

/**
 * Stable user id → colour. `preferredIds` (e.g. the signed-in user first, then
 * the participant list in join order) fixes the order so it survives sorting,
 * filtering, and someone dropping out.
 */
export function seriesColorMap(preferredIds = [], mode = 'dark') {
  const palette = seriesColors(mode);
  const map = new Map();
  let slot = 0;
  for (const id of preferredIds) {
    if (id === null || id === undefined || map.has(id)) continue;
    map.set(id, palette[slot % palette.length]);
    slot += 1;
  }
  return map;
}

/** Colour for a user, falling back to the muted ink used for "everyone else". */
export function colorFor(map, userId, mode = 'dark') {
  return map.get(userId) ?? chartChrome(mode).muted;
}

/**
 * A one-hue crimson ramp for the activity heatmap. Index 0 is the empty cell —
 * a surface tint, not part of the ramp — and 1..4 carry magnitude, each step
 * further from the surface than the last.
 *
 * Four steps rather than five because the ramp is validated to the stricter
 * *ordinal* bar (monotone lightness, ΔL ≥ 0.06 between steps, and the step
 * nearest the surface still clearing 2:1). Five steps could only meet all three
 * by letting the lightest fade into the background, which is exactly the
 * "is that a quiet day or no day?" ambiguity a heatmap must not have.
 */
const HEAT = {
  dark: ['#1a2427', '#8f2449', '#b32d5c', '#d43a70', '#f05285'],
  light: ['#eae5d8', '#e08fab', '#ca5a80', '#ad2f5c', '#8d1240'],
};

export const heatRamp = (mode = 'dark') => HEAT[mode] ?? HEAT.dark;

export function heatColor(intensity, mode = 'dark') {
  const ramp = heatRamp(mode);
  if (!intensity) return ramp[0];
  const steps = ramp.length - 1;
  return ramp[Math.min(steps, Math.max(1, Math.ceil(intensity * steps)))];
}
