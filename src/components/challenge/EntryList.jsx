import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, ImageIcon, Quote } from 'lucide-react';
import api from '../../api/client';
import { formatMetric, relativeTime } from '../../lib/format';
import { seriesColorMap } from '../../lib/palette';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { ProgressBar } from '../ui/ProgressRing';

/**
 * Everyone's entry for one period: the number, how it sat against the target,
 * the note, and any proof.
 *
 * Participants who logged nothing are listed too — "hasn't posted" is
 * information in a game about doing it every day.
 */
export function EntryList({ period, participants = [], unit, meId, onEdit }) {
  const { theme } = useTheme();
  const entries = period?.entries ?? [];
  const target = period?.target_value ?? 0;

  const colors = seriesColorMap(
    [meId, ...participants.map((row) => row.user?.id ?? row.user_id)].filter(Boolean),
    theme
  );

  const logged = new Set(entries.map((entry) => entry.user_id));
  const missing = participants.filter(
    (row) => row.status === 'accepted' && !logged.has(row.user?.id ?? row.user_id)
  );

  const sorted = [...entries].sort((a, b) => b.value - a.value);

  return (
    <ul className="space-y-2.5">
      {sorted.map((entry, index) => {
        const isMe = entry.user_id === meId;
        const hit = entry.value >= target;
        return (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 420, damping: 32 }}
            className={`rounded-2xl border p-3.5 ${
              isMe ? 'border-brand-bright/40 bg-brand/8' : 'border-line bg-surface'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-center font-mono text-xs text-ink-3">
                {index + 1}
              </span>
              <Avatar user={entry.user} size="sm" color={colors.get(entry.user_id)} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
                  {isMe ? 'You' : entry.user?.display_name || `#${entry.user_id}`}
                  {entry.is_winner && (
                    <Crown size={13} className="shrink-0 text-acid-text" aria-label="Winner" />
                  )}
                </p>
                <p className="truncate text-[0.7rem] text-ink-3">
                  {relativeTime(entry.updated_at || entry.created_at)}
                  {hit && ' · target hit'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular text-base font-bold text-ink">
                  {formatMetric(entry.value, unit)}
                </p>
                {target > 0 && (
                  <p className="text-[0.68rem] text-ink-3">
                    {hit ? '+' : '−'}
                    {formatMetric(Math.abs(entry.value - target), unit)}
                  </p>
                )}
              </div>
              {isMe && onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="shrink-0 rounded-lg px-2 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-acid-text hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            <ProgressBar
              value={entry.value}
              target={target}
              className="mt-3"
              color={colors.get(entry.user_id) ?? 'var(--brand-glow)'}
            />

            {entry.note && (
              <p className="mt-2.5 flex items-start gap-1.5 text-xs italic leading-relaxed text-ink-2">
                <Quote size={11} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
                {entry.note}
              </p>
            )}

            {entry.images?.length > 0 && <Proof images={entry.images} />}
          </motion.li>
        );
      })}

      {missing.map((row) => {
        const person = row.user ?? row;
        return (
          <li
            key={`missing-${person.id}`}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-3.5 py-3 opacity-70"
          >
            <span className="w-4 shrink-0" />
            <Avatar user={person} size="sm" />
            <p className="min-w-0 flex-1 truncate text-sm text-ink-3">
              {person.id === meId ? 'You haven’t' : `${person.display_name} hasn’t`} logged yet
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** Proof thumbnails. Each URL is presigned and fetched on demand. */
function Proof({ images }) {
  const [urls, setUrls] = useState({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      images.map((image) =>
        api
          .imageUrl(image.image_uuid)
          .then((result) => [image.image_uuid, result?.url])
          // Storage being unreachable degrades to a placeholder, not an error.
          .catch(() => [image.image_uuid, null])
      )
    ).then((pairs) => {
      if (!cancelled) setUrls(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [images]);

  return (
    <div className="mt-3 flex gap-2">
      {images.map((image) => {
        const url = urls[image.image_uuid];
        return (
          <a
            key={image.image_uuid}
            href={url || undefined}
            target="_blank"
            rel="noreferrer"
            className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2"
            title={image.image_name || 'Proof'}
          >
            {url ? (
              <img
                src={url}
                alt={image.image_name || 'Proof screenshot'}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-ink-3">
                <ImageIcon size={16} />
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}

export default EntryList;
