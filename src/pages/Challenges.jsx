import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Archive, Mail, Plus, Trophy, Zap } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useQuery from '../hooks/useQuery';
import { Page, Stagger, StaggerItem } from '../components/ui/Motion';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState, ErrorState, SkeletonCard } from '../components/ui/Feedback';
import Button from '../components/ui/Button';
import ChallengeCard, { InviteCard } from '../components/challenge/ChallengeCard';
import LogSheet from '../components/challenge/LogSheet';
import PastChallengeCard from '../components/challenge/PastChallengeCard';

export default function Challenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('live');
  const [logging, setLogging] = useState(null);
  const [busyUuid, setBusyUuid] = useState(null);

  // The dashboard already carries today's numbers for every live challenge;
  // /challenges is only needed for the ones that have finished.
  const dashboard = useQuery(useCallback(() => api.dashboard(), []));
  const all = useQuery(useCallback(() => api.challenges(), []));

  const active = dashboard.data?.active ?? [];
  const invites = dashboard.data?.invites ?? [];
  const past = useMemo(
    () =>
      (all.data ?? []).filter(
        (challenge) => challenge.status !== 'active' || challenge.my_status === 'declined'
      ),
    [all.data]
  );

  const tabs = [
    { value: 'live', label: 'Live', icon: Zap, count: active.length },
    { value: 'invites', label: 'Invites', icon: Mail, count: invites.length },
    { value: 'past', label: 'Past', icon: Archive, count: past.length },
  ];

  async function respond(challenge, accept) {
    setBusyUuid(challenge.challenge_uuid);
    try {
      await api.respondToChallenge(challenge.challenge_uuid, accept);
      toast(accept ? `You’re in on ${challenge.name}.` : 'Declined.', accept ? 'win' : 'info');
      await Promise.all([dashboard.reload(), all.reload()]);
      if (accept) setTab('live');
    } catch (caught) {
      toast(caught.message, 'error');
    } finally {
      setBusyUuid(null);
    }
  }

  return (
    <Page className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-tight sm:text-4xl">Challenges</h1>
          <p className="mt-1 text-sm text-ink-3">Everything you’re in, and everything you were.</p>
        </div>
        <Link to="/challenges/new">
          <Button icon={Plus}>New challenge</Button>
        </Link>
      </header>

      <Tabs id="challenges" tabs={tabs} value={tab} onChange={setTab} />

      {dashboard.error && !dashboard.data ? (
        <ErrorState error={dashboard.error} onRetry={dashboard.reload} />
      ) : dashboard.loading && !dashboard.data ? (
        <div className="grid gap-3 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {tab === 'live' && (
            <Stagger key="live" className="grid gap-3 md:grid-cols-2">
              {active.length === 0 ? (
                <EmptyState
                  className="md:col-span-2"
                  icon={Trophy}
                  title="Nothing live"
                  body="Start one and invite whoever you want to beat."
                  action={
                    <Link to="/challenges/new">
                      <Button icon={Plus}>Start a challenge</Button>
                    </Link>
                  }
                />
              ) : (
                active.map((card, index) => (
                  <StaggerItem key={card.challenge.challenge_uuid}>
                    <ChallengeCard
                      card={card}
                      meId={user?.id}
                      index={index}
                      onLog={setLogging}
                    />
                  </StaggerItem>
                ))
              )}
            </Stagger>
          )}

          {tab === 'invites' && (
            <Stagger key="invites" className="space-y-2.5">
              {invites.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No invitations"
                  body="When a friend adds you to a challenge, it lands here first."
                />
              ) : (
                invites.map((challenge) => (
                  <StaggerItem key={challenge.challenge_uuid}>
                    <InviteCard
                      challenge={challenge}
                      onRespond={respond}
                      busy={busyUuid === challenge.challenge_uuid}
                    />
                  </StaggerItem>
                ))
              )}
            </Stagger>
          )}

          {tab === 'past' && (
            <Stagger key="past" className="grid gap-3 md:grid-cols-2">
              {past.length === 0 ? (
                <EmptyState
                  className="md:col-span-2"
                  icon={Archive}
                  title="Nothing in the archive"
                  body="Finished and cancelled challenges keep their history here."
                />
              ) : (
                past.map((challenge) => (
                  <StaggerItem key={challenge.challenge_uuid}>
                    <PastChallengeCard challenge={challenge} />
                  </StaggerItem>
                ))
              )}
            </Stagger>
          )}
        </AnimatePresence>
      )}

      <LogSheet
        open={Boolean(logging)}
        onClose={() => setLogging(null)}
        challenge={logging?.challenge}
        period={logging?.period}
        entry={
          logging?.my_value !== null && logging?.my_value !== undefined
            ? { value: logging.my_value, note: logging.my_note }
            : null
        }
        onSaved={dashboard.reload}
      />
    </Page>
  );
}
