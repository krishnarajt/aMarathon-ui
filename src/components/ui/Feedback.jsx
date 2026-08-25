import { motion } from 'framer-motion';
import { CircleAlert, RefreshCw } from 'lucide-react';
import Button from './Button';

export function Skeleton({ className = '', ...props }) {
  return <div className={`shimmer rounded-xl ${className}`} aria-hidden {...props} />;
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`rounded-[var(--radius-card)] border border-line bg-surface p-5 ${className}`}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-2/3" />
      <div className="mt-5 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className="h-3" style={{ width: `${90 - index * 18}%` }} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line px-6 py-12 text-center ${className}`}
    >
      {Icon && (
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-surface-2 text-ink-3">
          <Icon size={24} aria-hidden />
        </span>
      )}
      <h3 className="text-lg text-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-3">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

export function ErrorState({ error, onRetry, className = '' }) {
  const offline = error?.status === 0;
  return (
    <div
      className={`flex flex-col items-center rounded-[var(--radius-card)] border border-bad/25 bg-bad/5 px-6 py-10 text-center ${className}`}
    >
      <CircleAlert size={22} className="mb-3 text-bad" aria-hidden />
      <h3 className="text-base font-semibold text-ink">
        {offline ? 'Can’t reach the server' : 'That didn’t work'}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-3">
        {error?.message || 'Something went wrong on the way to the backend.'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-5">
          Try again
        </Button>
      )}
    </div>
  );
}

export default Skeleton;
