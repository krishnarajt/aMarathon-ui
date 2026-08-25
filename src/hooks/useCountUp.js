import { useEffect, useState } from 'react';
import { useReducedMotion } from './useMediaQuery';

/**
 * Spring a number from its previous value to the next one.
 *
 * framer-motion's `animate()` would do this, but every stat on the home screen
 * would then own a MotionValue and a subscription; this is a single rAF loop
 * per number with an ease-out that settles rather than overshoots — money
 * figures that bounce past and come back read as a glitch.
 */
export function useCountUp(target = 0, { duration = 900, enabled = true } = {}) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(enabled && !reduced ? 0 : target);

  useEffect(() => {
    if (!enabled || reduced) {
      setValue(target);
      return undefined;
    }
    const from = 0;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      // easeOutExpo: fast out of the gate, lands softly on the real number.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(from + (target - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, enabled, reduced]);

  return value;
}

export default useCountUp;
