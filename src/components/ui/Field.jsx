import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

const baseInput =
  'w-full rounded-2xl border border-line bg-surface-2/60 px-4 py-3 text-ink placeholder:text-ink-3 transition-all duration-200 focus:border-acid/60 focus:bg-surface-2 focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklab,var(--accent)_18%,transparent)]';

export function Label({ children, hint, htmlFor }) {
  if (!children) return null;
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-baseline justify-between gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3"
    >
      <span>{children}</span>
      {hint && <span className="font-medium normal-case tracking-normal text-ink-3">{hint}</span>}
    </label>
  );
}

export const TextField = forwardRef(function TextField(
  { label, hint, error, prefix, suffix, className = '', id, ...props },
  ref
) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <div className={className}>
      <Label htmlFor={inputId} hint={hint}>
        {label}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          className={`${baseInput} ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-16' : ''} ${
            error ? 'border-bad/60' : ''
          }`}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-3">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-bad">{error}</p>}
    </div>
  );
});

export const TextArea = forwardRef(function TextArea(
  { label, hint, className = '', id, ...props },
  ref
) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <div className={className}>
      <Label htmlFor={inputId} hint={hint}>
        {label}
      </Label>
      <textarea ref={ref} id={inputId} className={`${baseInput} resize-none`} {...props} />
    </div>
  );
});

export function Select({ label, hint, options, className = '', id, ...props }) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <div className={className}>
      <Label htmlFor={inputId} hint={hint}>
        {label}
      </Label>
      <div className="relative">
        <select
          id={inputId}
          className={`${baseInput} cursor-pointer appearance-none pr-11`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-3"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, id }) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <label htmlFor={inputId} className="block text-sm font-semibold text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
      </div>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-300 ${
          checked ? 'border-acid-dim bg-acid' : 'border-line bg-surface-3'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1.4,0.36,1)] ${
            checked ? 'left-6 bg-acid-ink' : 'left-0.5 bg-ink-3'
          }`}
        />
      </button>
    </div>
  );
}

export default TextField;
