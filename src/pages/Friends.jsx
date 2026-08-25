import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Search, UserMinus, UserPlus, Users, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useQuery from '../hooks/useQuery';
import { relativeTime } from '../lib/format';
import { Page, Stagger, StaggerItem } from '../components/ui/Motion';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import Button from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { Avatar } from '../components/ui/Avatar';
import Sheet from '../components/ui/Sheet';

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('friends');
  const [finding, setFinding] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const friends = useQuery(useCallback(() => api.friends(), []));
  const requests = useQuery(useCallback(() => api.friendRequests(), []));

  const incoming = requests.data?.incoming ?? [];
  const outgoing = requests.data?.outgoing ?? [];

  async function respond(request, accept) {
    setBusyId(request.id);
    try {
      await api.respondToFriendRequest(request.id, accept);
      toast(
        accept ? `You and ${request.other_user.display_name} are friends.` : 'Request declined.',
        accept ? 'win' : 'info'
      );
      await Promise.all([friends.reload(), requests.reload()]);
    } catch (caught) {
      toast(caught.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function unfriend(person) {
    setBusyId(person.id);
    try {
      await api.removeFriend(person.id);
      toast(`Removed ${person.display_name}.`, 'info');
      await friends.reload();
    } catch (caught) {
      toast(caught.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  const tabs = [
    { value: 'friends', label: 'Friends', icon: Users, count: friends.data?.length ?? 0 },
    { value: 'requests', label: 'Requests', icon: UserPlus, count: incoming.length },
  ];

  return (
    <Page className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-tight sm:text-4xl">Your crew</h1>
          <p className="mt-1 text-sm text-ink-3">
            You can only add friends to a challenge, so this is the guest list.
          </p>
        </div>
        <Button icon={Search} onClick={() => setFinding(true)}>
          Find people
        </Button>
      </header>

      <Tabs id="friends" tabs={tabs} value={tab} onChange={setTab} />

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'friends' &&
          (friends.error ? (
            <ErrorState key="err" error={friends.error} onRetry={friends.reload} />
          ) : friends.loading && !friends.data ? (
            <div key="load" className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="shimmer h-16 rounded-2xl" />
              ))}
            </div>
          ) : (friends.data ?? []).length === 0 ? (
            <EmptyState
              key="empty"
              icon={Users}
              title="Nobody here yet"
              body="Search for a username and send a request. Challenges are better with someone to lose to."
              action={
                <Button icon={Search} onClick={() => setFinding(true)}>
                  Find people
                </Button>
              }
            />
          ) : (
            <Stagger key="list" className="space-y-2">
              {friends.data.map((person) => (
                <StaggerItem key={person.id}>
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
                    <Avatar user={person} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {person.display_name}
                      </p>
                      <p className="truncate text-xs text-ink-3">@{person.username}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={UserMinus}
                      onClick={() => unfriend(person)}
                      loading={busyId === person.id}
                      className="text-ink-3 hover:text-bad"
                    >
                      Remove
                    </Button>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          ))}

        {tab === 'requests' && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
          >
            <section>
              <h2 className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                Waiting on you
              </h2>
              {incoming.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">
                  Nothing to answer.
                </p>
              ) : (
                <ul className="space-y-2">
                  {incoming.map((request) => (
                    <li
                      key={request.id}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-bright/30 bg-brand/8 p-3.5"
                    >
                      <Avatar user={request.other_user} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {request.other_user.display_name}
                        </p>
                        <p className="truncate text-xs text-ink-3">
                          @{request.other_user.username} · {relativeTime(request.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={X}
                          onClick={() => respond(request, false)}
                          disabled={busyId === request.id}
                        >
                          No
                        </Button>
                        <Button
                          variant="acid"
                          size="sm"
                          icon={Check}
                          onClick={() => respond(request, true)}
                          loading={busyId === request.id}
                        >
                          Accept
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                Sent by you
              </h2>
              {outgoing.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">
                  Nothing pending.
                </p>
              ) : (
                <ul className="space-y-2">
                  {outgoing.map((request) => (
                    <li
                      key={request.id}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5"
                    >
                      <Avatar user={request.other_user} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {request.other_user.display_name}
                        </p>
                        <p className="truncate text-xs text-ink-3">
                          @{request.other_user.username} · sent {relativeTime(request.created_at)}
                        </p>
                      </div>
                      <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-wider text-ink-3">
                        Pending
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <FindPeople
        open={finding}
        onClose={() => setFinding(false)}
        meId={user?.id}
        onSent={() => Promise.all([friends.reload(), requests.reload()])}
      />
    </Page>
  );
}

/** Search-as-you-type over usernames and display names. */
function FindPeople({ open, onClose, onSent }) {
  const { toast } = useToast();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sent, setSent] = useState({});

  useEffect(() => {
    if (!open) {
      setTerm('');
      setResults([]);
      setSent({});
      return undefined;
    }
    const query = term.trim();
    if (query.length < 2) {
      setResults([]);
      return undefined;
    }
    setSearching(true);
    // 280ms is long enough that typing a name is one request, short enough that
    // it still feels like it's keeping up.
    const timer = setTimeout(() => {
      api
        .searchUsers(query)
        .then((found) => setResults(found ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 280);
    return () => clearTimeout(timer);
  }, [term, open]);

  async function send(person) {
    setSent((current) => ({ ...current, [person.id]: 'sending' }));
    try {
      const result = await api.sendFriendRequest(person.username);
      const message =
        result?.result === 'already_friends'
          ? `You’re already friends with ${person.display_name}.`
          : result?.result === 'accepted'
            ? `${person.display_name} had already asked — you’re friends now.`
            : `Request sent to ${person.display_name}.`;
      toast(message, result?.result === 'accepted' ? 'win' : 'success');
      setSent((current) => ({ ...current, [person.id]: 'sent' }));
      await onSent?.();
    } catch (caught) {
      toast(caught.message, 'error');
      setSent((current) => ({ ...current, [person.id]: undefined }));
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Find people" subtitle="Search by username or name">
      <div className="space-y-4 pb-4">
        <TextField
          label="Search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="nadia"
          autoFocus
          autoCapitalize="none"
          prefix={<Search size={15} />}
        />

        {term.trim().length >= 2 && (
          <p className="text-xs text-ink-3">
            {searching ? 'Looking…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </p>
        )}

        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {results.map((person) => (
              <motion.li
                key={person.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <Avatar user={person} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{person.display_name}</p>
                  <p className="truncate text-xs text-ink-3">@{person.username}</p>
                </div>
                <Button
                  variant={sent[person.id] === 'sent' ? 'ghost' : 'outline'}
                  size="sm"
                  icon={sent[person.id] === 'sent' ? Check : UserPlus}
                  loading={sent[person.id] === 'sending'}
                  disabled={sent[person.id] === 'sent'}
                  onClick={() => send(person)}
                >
                  {sent[person.id] === 'sent' ? 'Sent' : 'Add'}
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </Sheet>
  );
}
