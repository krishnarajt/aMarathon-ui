import { motion } from 'framer-motion';

/**
 * The app's one container. `glow` adds the crimson→lime hairline along the top
 * edge that marks a card as the thing to look at.
 */
export function Card({ children, className = '', glow = false, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface ${
        glow ? 'edge-glow' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** A card that reacts to the pointer — used for anything that navigates. */
export function TouchCard({ children, className = '', glow = false, ...props }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className={`relative cursor-pointer overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-colors duration-300 hover:border-line-strong ${
        glow ? 'edge-glow' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({ children, action, icon: Icon, className = '' }) {
  return (
    <div className={`mb-3 flex items-end justify-between gap-3 ${className}`}>
      <h2 className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-ink-3">
        {Icon && <Icon size={13} aria-hidden />}
        {children}
      </h2>
      {action}
    </div>
  );
}

export default Card;
