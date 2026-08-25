import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, ImageOff, Trash2 } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatMetric, formatMetricWithUnit, periodLabel, timeLeftLabel } from '../../lib/format';
import { UNITS } from '../../lib/labels';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import { TextField, TextArea } from '../ui/Field';
import Confetti from '../ui/Confetti';
import { ProgressBar } from '../ui/ProgressRing';

/**
 * Log or correct a number for one period.
 *
 * The backend upserts, so this is the same sheet whether it's the first entry
 * of the day or the fourth correction — the only difference is whether Delete
 * is offered.
 */
export function LogSheet({ open, onClose, challenge, period, entry, onSaved }) {
  const { toast } = useToast();
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const [proof, setProof] = useState(null);
  const fileInput = useRef(null);

  const unit = challenge?.unit ?? 'steps';
  const target = period?.target_value ?? 0;
  const numeric = Number(value);
  const valid = value !== '' && !Number.isNaN(numeric) && numeric >= 0;

  useEffect(() => {
    if (!open) return;
    setValue(entry?.value !== undefined && entry?.value !== null ? String(entry.value) : '');
    setNote(entry?.note ?? '');
    setError(null);
    setProof(null);
    setCelebrate(false);
  }, [open, entry?.value, entry?.note]);

  const chips = useMemo(() => {
    if (!target) return [];
    const suggestions = [target, Math.round(target * 1.1 * 10) / 10, Math.round(target * 1.25 * 10) / 10];
    return [...new Set(suggestions)].map((amount) =>
      unit === 'steps' ? Math.round(amount) : Math.round(amount * 10) / 10
    );
  }, [target, unit]);

  async function save() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await api.logEntry(period.id, numeric, note);

      if (proof && saved?.entry_uuid) {
        // Proof is optional and storage may be down; a failed upload must not
        // lose the number that was just logged.
        try {
          await api.uploadEntryImage(saved.entry_uuid, proof);
        } catch {
          toast('Number saved, but the screenshot didn’t upload.', 'error');
        }
      }

      if (numeric >= target && target > 0) {
        setCelebrate(true);
        toast(`Target down. ${formatMetric(numeric, unit)} logged.`, 'win');
      } else {
        toast('Logged.', 'success');
      }
      await onSaved?.(saved);
      // Long enough for the burst to play out before the sheet leaves.
      setTimeout(() => onClose?.(), numeric >= target && target > 0 ? 900 : 250);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    try {
      await api.deleteEntry(period.id);
      toast('Entry removed.', 'info');
      await onSaved?.(null);
      onClose?.();
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  if (!challenge || !period) return null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={challenge.name}
      subtitle={`${periodLabel(period, challenge.period_type)} · ${timeLeftLabel(period.period_end)}`}
      footer={
        <div className="flex gap-2">
          {entry && (
            <Button variant="danger" size="lg" icon={Trash2} onClick={remove} disabled={busy}>
              Delete
            </Button>
          )}
          <Button
            variant="acid"
            size="lg"
            icon={Check}
            onClick={save}
            loading={busy}
            disabled={!valid}
            full
          >
            {entry ? 'Update' : 'Log it'}
          </Button>
        </div>
      }
    >
      <div className="relative space-y-5 pb-2">
        <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />

        <div className="rounded-2xl border border-line bg-surface-2/50 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-3">
              Target
            </span>
            <span className="font-sans text-2xl font-bold text-ink [font-variant-numeric:proportional-nums]">
              {formatMetric(target, unit)}
              <span className="ml-1 text-sm font-semibold text-ink-3">
                {UNITS[unit]?.label ?? unit}
              </span>
            </span>
          </div>
          <ProgressBar value={valid ? numeric : 0} target={target} className="mt-3" />
          <p className="mt-2 text-xs text-ink-3">
            {valid && target > 0
              ? numeric >= target
                ? `${formatMetricWithUnit(numeric - target, unit)} past it. Good.`
                : `${formatMetricWithUnit(target - numeric, unit)} to go.`
              : 'Type what you actually did.'}
          </p>
        </div>

        <TextField
          label={`What you ${unit === 'steps' ? 'walked' : 'covered'}`}
          type="number"
          inputMode="decimal"
          step={unit === 'steps' ? '1' : '0.01'}
          min="0"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          suffix={UNITS[unit]?.label ?? unit}
          placeholder={String(chips[0] ?? '')}
          autoFocus
          error={error}
        />

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((amount, index) => (
              <motion.button
                key={amount}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setValue(String(amount))}
                className="rounded-full border border-line bg-surface-2/60 px-3 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:border-acid-dim hover:text-ink"
              >
                {index === 0 ? 'Exactly ' : `+${index === 1 ? '10' : '25'}% · `}
                {formatMetric(amount, unit)}
              </motion.button>
            ))}
          </div>
        )}

        <TextArea
          label="Note"
          hint="optional"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Treadmill. Raining. Etc."
        />

        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic,image/gif"
            className="hidden"
            onChange={(event) => setProof(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-left transition-colors hover:border-line-strong"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-3">
              {proof ? <Check size={16} className="text-acid-text" /> : <Camera size={16} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">
                {proof ? proof.name : 'Attach proof'}
              </span>
              <span className="block text-xs text-ink-3">
                {proof ? 'Uploads when you save' : 'Screenshot from your watch or phone'}
              </span>
            </span>
            {proof && (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  setProof(null);
                  if (fileInput.current) fileInput.current.value = '';
                }}
                onKeyDown={(event) => event.key === 'Enter' && setProof(null)}
                className="shrink-0 rounded-lg p-1.5 text-ink-3 hover:text-bad"
                aria-label="Remove attachment"
              >
                <ImageOff size={15} />
              </span>
            )}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

export default LogSheet;
