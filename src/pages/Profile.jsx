import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, Globe2, LogOut, Moon, Ruler, Sun } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import useQuery from '../hooks/useQuery';
import { formatDate } from '../lib/format';
import { UNITS } from '../lib/labels';
import { Page } from '../components/ui/Motion';
import { Card, SectionTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Select, TextField, Toggle } from '../components/ui/Field';
import { SegmentedControl } from '../components/ui/Tabs';
import { Avatar } from '../components/ui/Avatar';
import { StatusDot } from '../components/ui/Badge';
import { authentikLoginUrl } from '../api/client';

// A short list beats a 400-entry dropdown; the field takes any IANA name typed
// in, and the backend only uses it to label periods.
const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Lisbon',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
];

export default function Profile() {
  const { user, setUser, logout, online } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const settings = useQuery(useCallback(() => api.settings(), []));
  const identity = useQuery(useCallback(() => api.authentikStatus(), []));

  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const avatarInput = useRef(null);

  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zones = [...new Set([detected, ...TIMEZONES].filter(Boolean))];

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('link_authentik') !== '1') return;
    api.linkAuthentik()
      .then((linked) => {
        identity.setData(linked);
        toast('Authentik linked to your existing account.', 'success');
      })
      .catch((caught) => toast(caught.message, 'error'))
      .finally(() => window.history.replaceState({}, '', '/profile'));
    // This callback is intentionally consumed once after the gateway redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveName(event) {
    event?.preventDefault();
    const nextDisplayName = displayName.trim();
    if (!nextDisplayName || nextDisplayName === user?.display_name) return;
    setSavingName(true);
    try {
      const updated = await api.updateProfile(nextDisplayName);
      setUser(updated);
      setDisplayName(updated.display_name);
      toast('Name updated.', 'success');
    } catch (caught) {
      toast(caught.message, 'error');
    } finally {
      setSavingName(false);
    }
  }

  async function uploadAvatar(file) {
    if (!file) return;
    setUploading(true);
    try {
      const updated = await api.uploadAvatar(file);
      setUser(updated);
      toast('New picture up.', 'success');
    } catch (caught) {
      toast(caught.message, 'error');
    } finally {
      setUploading(false);
      if (avatarInput.current) avatarInput.current.value = '';
    }
  }

  async function saveSetting(patch) {
    try {
      const updated = await api.updateSettings(patch);
      settings.setData(updated);
      toast('Saved.', 'success');
    } catch (caught) {
      toast(caught.message, 'error');
    }
  }

  async function changePassword() {
    if (!passwords.current || !passwords.next) return;
    setSavingPassword(true);
    try {
      await api.changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '' });
      toast('Password changed. Other sessions are signed out.', 'success');
    } catch (caught) {
      toast(caught.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <Page className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl leading-tight sm:text-4xl">You</h1>
        <p className="mt-1 text-sm text-ink-3">
          Member since {formatDate(user?.created_at, { month: 'long', year: 'numeric' })}
        </p>
      </header>

      <Card glow className="p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            className="group relative rounded-full"
            aria-label="Change profile picture"
          >
            <Avatar user={user} size="xl" />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Camera size={18} className="text-white" />
            </span>
          </button>
          <input
            ref={avatarInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic"
            className="hidden"
            onChange={(event) => uploadAvatar(event.target.files?.[0])}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-bold text-ink">{user?.display_name}</p>
            <p className="truncate text-sm text-ink-3">@{user?.username}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[0.7rem] text-ink-3">
              <StatusDot tone={online === false ? 'bad' : online ? 'good' : 'warn'} />
              {online === false ? 'Server offline' : online ? 'Server online' : 'Checking…'}
            </p>
          </div>
        </div>
        {uploading && <p className="mt-3 text-xs text-ink-3">Uploading picture…</p>}
      </Card>

      <Card className="p-5">
        <SectionTitle>Profile</SectionTitle>
        <form className="space-y-4" onSubmit={saveName}>
          <TextField
            label="Display name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={200}
          />
          <Button
            type="submit"
            icon={Check}
            loading={savingName}
            disabled={!displayName.trim() || displayName.trim() === user?.display_name}
          >
            Save
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <SectionTitle>Sign-in methods</SectionTitle>
        <p className="mb-4 text-sm text-ink-3">
          Linking adds Authentik to this player. Your challenges, friends, entries, username, and password stay untouched.
        </p>
        {identity.data?.linked ? (
          <Button type="button" onClick={async () => { const result = await api.unlinkAuthentik(); identity.setData(result); toast('Authentik unlinked.', 'success'); }}>
            Unlink Authentik{identity.data.email ? ` (${identity.data.email})` : ''}
          </Button>
        ) : (
          <Button type="button" onClick={() => { window.location.href = authentikLoginUrl('/profile?link_authentik=1'); }}>
            Link Authentik to this player
          </Button>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle icon={Sun}>Look</SectionTitle>
        <SegmentedControl
          id="theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'light', label: 'Light', icon: Sun },
          ]}
        />
      </Card>

      <Card className="p-5">
        <SectionTitle icon={Globe2}>Preferences</SectionTitle>
        {settings.loading && !settings.data ? (
          <div className="space-y-3">
            <div className="shimmer h-12 rounded-2xl" />
            <div className="shimmer h-12 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              label="Timezone"
              hint="labels only — targets still turn over at midnight UTC"
              value={settings.data?.timezone ?? 'UTC'}
              onChange={(event) => saveSetting({ timezone: event.target.value })}
              options={zones.map((zone) => ({ value: zone, label: zone }))}
            />
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                <Ruler size={12} aria-hidden />
                Preferred distance unit
              </p>
              <SegmentedControl
                id="unit"
                value={settings.data?.distance_unit ?? 'km'}
                onChange={(distance_unit) => saveSetting({ distance_unit })}
                options={[
                  { value: 'km', label: UNITS.km.long },
                  { value: 'mi', label: UNITS.mi.long },
                ]}
              />
            </div>
            <Toggle
              label="Notifications"
              description="Nudges when a target is about to close"
              checked={settings.data?.notifications_enabled ?? true}
              onChange={(notifications_enabled) => saveSetting({ notifications_enabled })}
            />
          </div>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>Password</SectionTitle>
        <div className="space-y-4">
          <TextField
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={passwords.current}
            onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
          />
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={passwords.next}
            onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
          />
          <p className="text-xs text-ink-3">Changing this signs out every other device.</p>
          <Button
            variant="outline"
            onClick={changePassword}
            loading={savingPassword}
            disabled={!passwords.current || !passwords.next}
          >
            Change password
          </Button>
        </div>
      </Card>

      <Button variant="danger" icon={LogOut} full size="lg" onClick={logout} className="mb-4">
        Sign out
      </Button>
    </Page>
  );
}
