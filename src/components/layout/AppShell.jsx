import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChartNoAxesColumn,
  House,
  LogOut,
  Moon,
  Plus,
  Sun,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../ui/Avatar';
import { StatusDot } from '../ui/Badge';

export const NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/challenges', label: 'Challenges', icon: Trophy },
  { to: '/stats', label: 'Stats', icon: ChartNoAxesColumn },
  { to: '/friends', label: 'Crew', icon: Users },
  { to: '/profile', label: 'You', icon: UserRound },
];

/**
 * One shell, two layouts: a bottom tab bar under 1024px and a fixed rail above
 * it. Both render from the same NAV list, so a route added in one place shows
 * up in both.
 */
export default function AppShell({ children }) {
  return (
    <div className="grain relative min-h-[100dvh] bg-bg">
      <AmbientGlow />
      <SideRail />
      <div className="lg:pl-[240px]">
        <TopBar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:pb-12 lg:pt-6">
          {children}
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}

/** Two slow-drifting blooms behind everything — the app's only decoration. */
function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="animate-float-slow absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--brand)_38%,transparent),transparent_70%)] blur-3xl" />
      <div
        className="animate-float-slow absolute -right-32 top-1/3 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_70%)] blur-3xl"
        style={{ animationDelay: '-4s' }}
      />
    </div>
  );
}

function SideRail() {
  const { user, logout, online } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-line bg-bg-elev/80 px-4 py-6 backdrop-blur-xl lg:flex">
      <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
        <Wordmark />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <RailLink key={item.to} {...item} />
        ))}

        <Link
          to="/challenges/new"
          style={{ color: 'var(--accent-ink)' }}
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-acid px-4 py-3 text-sm font-bold text-acid-ink transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={17} />
          New challenge
        </Link>
      </nav>

      <div className="mt-4 space-y-3 border-t border-line pt-4">
        <div className="flex items-center gap-1.5 px-2 text-[0.68rem] font-medium text-ink-3">
          <StatusDot tone={online === false ? 'bad' : online ? 'good' : 'warn'} pulse={!!online} />
          {online === false ? 'Server offline' : online ? 'Server online' : 'Checking…'}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-2.5">
          <Avatar user={user} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user?.display_name}</p>
            <p className="truncate text-[0.7rem] text-ink-3">@{user?.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-lg p-1.5 text-ink-3 transition-colors hover:text-bad"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function RailLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink to={to} end={end} className="group relative">
      {({ isActive }) => (
        <span
          className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 ${
            isActive ? 'text-ink' : 'text-ink-3 hover:text-ink'
          }`}
        >
          {isActive && (
            <motion.span
              layoutId="rail-active"
              className="absolute inset-0 rounded-2xl border border-line-strong bg-surface"
              transition={{ type: 'spring', stiffness: 480, damping: 38 }}
            />
          )}
          <Icon size={18} className="relative z-10" aria-hidden />
          <span className="relative z-10">{label}</span>
        </span>
      )}
    </NavLink>
  );
}

function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  return (
    <header className="safe-top sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-xl lg:border-transparent lg:bg-transparent lg:backdrop-blur-none">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:justify-end">
        <Link to="/" className="lg:hidden">
          <Wordmark compact />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/challenges/new"
            aria-label="New challenge"
            className={`hidden h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold text-ink-2 transition-colors hover:border-line-strong hover:text-ink sm:flex lg:hidden ${
              pathname === '/challenges/new' ? 'hidden' : ''
            }`}
          >
            <Plus size={16} />
            New
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
          >
            <motion.span
              key={theme}
              initial={{ rotate: -70, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="grid place-items-center"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </motion.span>
          </button>
        </div>
      </div>
    </header>
  );
}

function BottomTabs() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elev/92 backdrop-blur-2xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-1 pt-1.5">
        {NAV.map((item) => (
          <TabLink key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2"
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="tab-active"
              className="absolute inset-x-2 -top-1.5 h-[3px] rounded-full bg-acid"
              transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            />
          )}
          <motion.span
            animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 26 }}
            className={isActive ? 'text-acid-text' : 'text-ink-3'}
          >
            <Icon size={21} aria-hidden />
          </motion.span>
          <span
            className={`text-[0.62rem] font-bold uppercase tracking-[0.08em] ${
              isActive ? 'text-ink' : 'text-ink-3'
            }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function Wordmark({ compact = false }) {
  return (
    <span className="flex items-center gap-2">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-brand">
        <span className="animate-pan absolute inset-0 bg-[linear-gradient(115deg,var(--brand),var(--brand-glow),var(--brand-bright),var(--brand))] opacity-90" />
        <span className="relative font-display text-lg font-extrabold text-white">A</span>
      </span>
      <span
        className={`font-display font-extrabold tracking-tight text-ink ${
          compact ? 'text-lg' : 'text-xl'
        }`}
      >
        amarathon
      </span>
    </span>
  );
}
