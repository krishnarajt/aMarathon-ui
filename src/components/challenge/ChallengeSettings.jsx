import { useState } from 'react';
import { AlertTriangle, Check, DoorOpen, Flag, Trash2 } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatMetric } from '../../lib/format';
import { WIN_RULES } from '../../lib/labels';
import { Card, SectionTitle } from '../ui/Card';
import Button from '../ui/Button';
import { Select, TextArea, TextField } from '../ui/Field';
import Sheet from '../ui/Sheet';

/**
 * Creator-only editing, plus the two exits (leave / delete).
 *
 * Changes here only affect periods generated from now on — the backend
 * snapshots each period's target and win rule when it is created — so the copy
 * says so rather than letting someone think they just rewrote last week.
 */
export function ChallengeSettings({ challenge, isCreator, onChanged, onGone }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: challenge.name,
    description: challenge.description ?? '',
    target_min: challenge.target_min,
    target_max: challenge.target_max,
    win_rule: challenge.win_rule,
  });
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const dirty =
    form.name !== challenge.name ||
    (form.description ?? '') !== (challenge.description ?? '') ||
    Number(form.target_min) !== challenge.target_min ||
    Number(form.target_max) !== challenge.target_max ||
    form.win_rule !== challenge.win_rule;

  async function save() {
    setBusy(true);
    try {
      await api.updateChallenge(challenge.challenge_uuid, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        target_min: Number(form.target_min),
        target_max: Number(form.target_max),
        win_rule: form.win_rule,
      });
      toast('Saved. Takes effect from the next target.', 'success');
      await onChanged();
    } catch (caught) {
      toast(caught.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status) {
    setBusy(true);
    try {
      await api.updateChallenge(challenge.challenge_uuid, { status });
      toast(status === 'completed' ? 'Challenge wrapped up.' : 'Challenge reopened.', 'info');
      await onChanged();
    } catch (caught) {
      toast(caught.message, 'error');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  async function destroy() {
    setBusy(true);
    try {
      await api.deleteChallenge(challenge.challenge_uuid);
      toast('Challenge deleted.', 'info');
      onGone?.();
    } catch (caught) {
      toast(caught.message, 'error');
      setBusy(false);
      setConfirm(null);
    }
  }

  async function leave() {
    setBusy(true);
    try {
      await api.leaveChallenge(challenge.challenge_uuid);
      toast('You’ve left. Your entries stay in the history.', 'info');
      onGone?.();
    } catch (caught) {
      toast(caught.message, 'error');
      setBusy(false);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      {isCreator ? (
        <>
          <Card className="p-5">
            <SectionTitle>Details</SectionTitle>
            <div className="space-y-4">
              <TextField
                label="Name"
                value={form.name}
                onChange={(event) => set({ name: event.target.value })}
              />
              <TextArea
                label="Description"
                rows={3}
                value={form.description}
                onChange={(event) => set({ description: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Lowest target"
                  type="number"
                  min="1"
                  value={form.target_min}
                  onChange={(event) => set({ target_min: event.target.value })}
                />
                <TextField
                  label="Highest target"
                  type="number"
                  min="1"
                  value={form.target_max}
                  onChange={(event) => set({ target_max: event.target.value })}
                />
              </div>
              <Select
                label="Win rule"
                value={form.win_rule}
                onChange={(event) => set({ win_rule: event.target.value })}
                options={Object.entries(WIN_RULES).map(([value, rule]) => ({
                  value,
                  label: rule.label,
                }))}
              />
              <p className="text-xs leading-relaxed text-ink-3">
                Targets already generated keep the number and the rule they were played under. This
                applies from the next one on.
              </p>
              <Button icon={Check} onClick={save} loading={busy} disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Wrap it up</SectionTitle>
            <p className="text-sm leading-relaxed text-ink-2">
              {challenge.status === 'active'
                ? 'Finishing stops new targets and closes entries. The history and standings stay.'
                : 'This challenge is finished. Reopening starts generating targets again.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {challenge.status === 'active' ? (
                <Button variant="outline" icon={Flag} onClick={() => setConfirm('complete')}>
                  Mark finished
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setStatus('active')} loading={busy}>
                  Reopen
                </Button>
              )}
              <Button variant="danger" icon={Trash2} onClick={() => setConfirm('delete')}>
                Delete challenge
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-5">
          <SectionTitle>Your options</SectionTitle>
          <p className="text-sm leading-relaxed text-ink-2">
            Only {challenge.creator?.display_name} can change the settings. You can step out
            whenever you like — everything you already logged stays where it is.
          </p>
          <Button variant="danger" icon={DoorOpen} className="mt-4" onClick={() => setConfirm('leave')}>
            Leave challenge
          </Button>
        </Card>
      )}

      <Sheet
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={
          confirm === 'delete'
            ? 'Delete this challenge?'
            : confirm === 'leave'
              ? 'Leave this challenge?'
              : 'Finish this challenge?'
        }
        maxWidth="max-w-md"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" full onClick={() => setConfirm(null)}>
              Keep it
            </Button>
            <Button
              variant={confirm === 'complete' ? 'primary' : 'danger'}
              size="lg"
              full
              loading={busy}
              onClick={() =>
                confirm === 'delete' ? destroy() : confirm === 'leave' ? leave() : setStatus('completed')
              }
            >
              {confirm === 'delete' ? 'Delete it' : confirm === 'leave' ? 'Leave' : 'Finish it'}
            </Button>
          </div>
        }
      >
        <div className="flex gap-3 pb-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden />
          <p className="text-sm leading-relaxed text-ink-2">
            {confirm === 'delete' ? (
              <>
                Every target, entry and screenshot in{' '}
                <span className="font-semibold text-ink">{challenge.name}</span> goes with it. There
                is no undo.
              </>
            ) : confirm === 'leave' ? (
              <>
                You’ll stop getting targets for{' '}
                <span className="font-semibold text-ink">{challenge.name}</span>. Your past entries
                stay so the history still adds up, and the host can invite you back.
              </>
            ) : (
              <>
                No new targets after this one. Everyone keeps their numbers, and the standings are
                final at{' '}
                <span className="font-semibold text-ink">
                  {formatMetric(challenge.target_min, challenge.unit)}–
                  {formatMetric(challenge.target_max, challenge.unit)}
                </span>
                .
              </>
            )}
          </p>
        </div>
      </Sheet>
    </div>
  );
}

export default ChallengeSettings;
