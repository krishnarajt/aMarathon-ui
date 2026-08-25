import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-brand text-on-brand border border-brand-bright/40 shadow-[var(--shadow-pop)] hover:bg-brand-bright',
  acid: 'bg-acid text-acid-ink border border-acid-dim hover:bg-acid-dim',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-surface-2 hover:text-ink',
  outline: 'bg-surface/60 text-ink border border-line hover:border-line-strong hover:bg-surface-2',
  danger: 'bg-transparent text-bad border border-bad/40 hover:bg-bad/10',
  steel: 'bg-steel text-white border border-steel-bright/30 hover:bg-steel-bright',
};

const FILLED_FOREGROUNDS = {
  primary: 'var(--on-brand)',
  acid: 'var(--accent-ink)',
  steel: '#fff',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-[0.8125rem] rounded-xl gap-1.5',
  md: 'h-11 px-5 text-sm rounded-2xl gap-2',
  lg: 'h-13 px-6 text-base rounded-2xl gap-2.5',
};

/**
 * The press animation is a spring rather than a CSS transition so a fast
 * double-tap doesn't queue up two half-finished scales.
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    className = '',
    disabled,
    full = false,
    style,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      ref={ref}
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 700, damping: 30 }}
      disabled={isDisabled}
      style={
        FILLED_FOREGROUNDS[variant]
          ? { ...style, color: FILLED_FOREGROUNDS[variant] }
          : style
      }
      className={`inline-flex select-none items-center justify-center font-semibold tracking-tight transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        VARIANTS[variant] ?? VARIANTS.primary
      } ${SIZES[size] ?? SIZES.md} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        Icon && <Icon size={size === 'sm' ? 15 : 17} aria-hidden />
      )}
      {children}
      {IconRight && !loading && <IconRight size={size === 'sm' ? 15 : 17} aria-hidden />}
    </motion.button>
  );
});

export const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, className = '', size = 18, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: 'spring', stiffness: 600, damping: 26 }}
      className={`grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface/70 text-ink-2 transition-colors hover:border-line-strong hover:text-ink ${className}`}
      {...props}
    >
      <Icon size={size} aria-hidden />
    </motion.button>
  );
});

export default Button;
