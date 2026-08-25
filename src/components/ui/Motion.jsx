import { motion } from 'framer-motion';

/**
 * Shared motion vocabulary. Every screen and list in the app animates from
 * here, so timing stays consistent instead of each page inventing its own
 * duration.
 */

export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition = { type: 'spring', stiffness: 320, damping: 32, mass: 0.7 };

/** Children stagger in; `delayChildren` leaves room for the page itself. */
export const listVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};

export const itemVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 34 },
  },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};

export function Page({ children, className = '' }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className = '', as = 'div' }) {
  const Component = motion[as] ?? motion.div;
  return (
    <Component variants={listVariants} initial="initial" animate="animate" className={className}>
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className = '', ...props }) {
  return (
    <motion.div variants={itemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

export default Page;
