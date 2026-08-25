import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Footprints, Route as RouteIcon, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { Wordmark } from '../components/layout/AppShell';
import { authentikLoginUrl } from '../api/client';

const TICKER = [
  '8,400 steps',
  '6.2 km',
  'first to target',
  '12,000 steps',
  'everybody eats',
  '5 km before work',
  'a 9-day streak',
  'beat rhys by 40',
];

export default function Login() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const { login, loginWithAuthentik, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignup = mode === 'signup';

  useEffect(() => {
    if (new URLSearchParams(location.search).get('authentik') !== '1') return;
    setBusy(true);
    loginWithAuthentik()
      .then(() => {
        toast('Signed in with Authentik.', 'success');
        navigate('/', { replace: true });
      })
      .catch((caught) => setError(caught.message))
      .finally(() => setBusy(false));
  }, [location.search, loginWithAuthentik, navigate, toast]);

  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      if (isSignup) {
        await register(username.trim().toLowerCase(), password, displayName.trim());
        toast(`Welcome in, ${displayName.trim() || username}.`, 'win');
      } else {
        await login(username.trim().toLowerCase(), password);
        toast('You’re in.', 'success');
      }
      navigate(location.state?.from || '/', { replace: true });
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grain relative grid min-h-[100dvh] bg-bg lg:grid-cols-[1.05fr_1fr]">
      <Showcase />

      <div className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>

          <h1 className="text-3xl leading-[1.1] sm:text-4xl">
            {isSignup ? 'Start your' : 'Back for'}{' '}
            <span className="gradient-text">{isSignup ? 'first one' : 'more'}</span>.
          </h1>
          <p className="mt-2 text-sm text-ink-2">
            {isSignup
              ? 'Pick a handle. Everything else can wait.'
              : 'Today’s number isn’t going to walk itself.'}
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="saket"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
              prefix="@"
            />

            <AnimatePresence initial={false}>
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <TextField
                    label="Display name"
                    hint="optional"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Saket"
                    autoComplete="name"
                    className="pt-0.5"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
            />

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm font-medium text-bad"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button type="submit" size="lg" full loading={busy} iconRight={ArrowRight}>
              {isSignup ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          {!isSignup && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-ink-3"><span className="h-px flex-1 bg-line" />OR<span className="h-px flex-1 bg-line" /></div>
              <Button type="button" size="lg" full disabled={busy} onClick={() => { window.location.href = authentikLoginUrl(); }}>
                Sign in with Authentik
              </Button>
              <p className="mt-3 text-center text-xs text-ink-3">
                Existing player? Sign in with your password first, then link Authentik from your profile. Nothing is overwritten.
              </p>
            </>
          )}

          <p className="mt-6 text-center text-sm text-ink-3">
            {isSignup ? 'Already playing?' : 'No account yet?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? 'login' : 'signup');
                setError(null);
              }}
              className="font-semibold text-acid-text underline-offset-4 hover:underline"
            >
              {isSignup ? 'Sign in' : 'Make one'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/** The half of the screen that has to sell the thing. Desktop only. */
function Showcase() {
  return (
    <div className="relative hidden overflow-hidden border-r border-line bg-bg-elev lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="animate-float-slow absolute -left-24 top-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--brand)_55%,transparent),transparent_70%)] blur-3xl" />
        <div
          className="animate-float-slow absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)] blur-3xl"
          style={{ animationDelay: '-5s' }}
        />
      </div>

      <div className="relative">
        <Wordmark />
      </div>

      <div className="relative max-w-lg">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 26, delay: 0.1 }}
          className="text-[3.4rem] font-extrabold leading-[0.95] tracking-[-0.03em]"
        >
          A new number
          <br />
          <span className="gradient-text">every single day.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="mt-5 max-w-md text-lg leading-relaxed text-ink-2"
        >
          Amarathon picks a target, your friends chase it, and one of you wins the day. Screenshots
          welcome. Excuses aren’t.
        </motion.p>

        <div className="mt-8 flex flex-wrap gap-2.5">
          {[
            { icon: Footprints, label: 'Steps or kilometres' },
            { icon: Trophy, label: 'Four ways to win' },
            { icon: RouteIcon, label: 'Daily, weekly, hourly' },
          ].map(({ icon: Icon, label }, index) => (
            <motion.span
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.08, type: 'spring', stiffness: 400, damping: 26 }}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-2 text-sm font-medium text-ink-2"
            >
              <Icon size={15} className="text-acid-text" aria-hidden />
              {label}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="mask-fade flex w-max">
          <div className="animate-ticker flex shrink-0 gap-8 pr-8">
            {[...TICKER, ...TICKER].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="whitespace-nowrap font-mono text-sm text-ink-3"
              >
                {item}
                <span className="ml-8 text-brand-glow">✳</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
