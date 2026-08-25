import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useMediaQuery';

const COLORS = ['#ea4770', '#c8f135', '#0191ed', '#956cf8', '#fff2f6', '#03a483'];

/**
 * A one-shot burst for the moment a target is beaten.
 *
 * Deliberately not a canvas library: 26 absolutely-positioned divs on springs
 * cost nothing next to shipping a physics engine for two seconds of confetti,
 * and it disappears completely under prefers-reduced-motion.
 */
export function Confetti({ fire, pieces = 26, onDone }) {
  const reduced = useReducedMotion();
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!fire || reduced) return undefined;
    setBurst((n) => n + 1);
    const timer = setTimeout(() => onDone?.(), 1800);
    return () => clearTimeout(timer);
  }, [fire, reduced, onDone]);

  const confetti = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => ({
        id: index,
        color: COLORS[index % COLORS.length],
        angle: (index / pieces) * Math.PI * 2 + (index % 3) * 0.2,
        distance: 90 + ((index * 37) % 130),
        rotation: ((index * 53) % 360) + 180,
        size: 5 + ((index * 7) % 7),
        delay: (index % 6) * 0.02,
      })),
    [pieces]
  );

  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center overflow-visible">
      <AnimatePresence>
        {fire && (
          <div key={burst} className="relative">
            {confetti.map((piece) => (
              <motion.span
                key={piece.id}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  x: Math.cos(piece.angle) * piece.distance,
                  y: Math.sin(piece.angle) * piece.distance + 40,
                  opacity: 0,
                  rotate: piece.rotation,
                  scale: 0.6,
                }}
                transition={{ duration: 1.15, delay: piece.delay, ease: [0.16, 0.8, 0.3, 1] }}
                className="absolute rounded-[2px]"
                style={{
                  width: piece.size,
                  height: piece.size * 1.6,
                  backgroundColor: piece.color,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Confetti;
