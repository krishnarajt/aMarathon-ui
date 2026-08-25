import { useEffect, useState } from 'react';
import api from '../../api/client';
import { initials } from '../../lib/format';

const SIZES = {
  xs: 'h-6 w-6 text-[0.6rem]',
  sm: 'h-8 w-8 text-[0.7rem]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-2xl',
};

/**
 * Avatars come from MinIO behind a presigned URL, so they need a round trip
 * before they can be shown. Initials on a colour derived from the username
 * cover the wait — and the common case of nobody having uploaded anything.
 *
 * `color` overrides the derived tint so a chart legend and its avatar agree.
 */
export function Avatar({ user, size = 'md', color, className = '', ring = false }) {
  const [url, setUrl] = useState(null);
  const objectKey = user?.avatar_object_key;
  const userId = user?.id;

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!objectKey || !userId) return undefined;
    api
      .avatarUrl(userId)
      .then((result) => {
        if (!cancelled) setUrl(result?.url ?? null);
      })
      // Storage being down is not worth an error state — the initials stand in.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [objectKey, userId]);

  const tint = color || tintFor(user?.username || user?.display_name || '?');

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full font-bold uppercase tracking-tight ${
        SIZES[size] ?? SIZES.md
      } ${ring ? 'ring-2 ring-bg' : ''} ${className}`}
      style={{
        backgroundColor: url ? 'transparent' : `color-mix(in oklab, ${tint} 26%, transparent)`,
        color: tint,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tint} 45%, transparent)`,
      }}
      title={user?.display_name || user?.username}
    >
      {url ? (
        <img
          src={url}
          alt={user?.display_name || user?.username || ''}
          className="h-full w-full object-cover"
          onError={() => setUrl(null)}
        />
      ) : (
        initials(user?.display_name || user?.username || '?')
      )}
    </span>
  );
}

/** Deterministic tint per username, so the same person is the same colour. */
const TINTS = ['#ea4770', '#0191ed', '#bb7e04', '#03a483', '#956cf8', '#56a300'];
export function tintFor(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

export function AvatarStack({ users = [], max = 4, size = 'sm' }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((user, index) => (
        <span key={user.id ?? index} className={index === 0 ? '' : '-ml-2'}>
          <Avatar user={user} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span
          className={`-ml-2 grid place-items-center rounded-full bg-surface-3 text-[0.65rem] font-bold text-ink-2 ring-2 ring-bg ${
            SIZES[size] ?? SIZES.sm
          }`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

export default Avatar;
