import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import AuthProvider, { useAuth } from './context/AuthContext';
import ThemeProvider from './context/ThemeContext';
import ToastProvider from './context/ToastContext';
import AppShell from './components/layout/AppShell';
import { Wordmark } from './components/layout/AppShell';
import Home from './pages/Home';
import Login from './pages/Login';

// Everything past the home screen is split out: the first paint after sign-in
// only needs the dashboard, and the charts bundle is heavy.
const Challenges = lazy(() => import('./pages/Challenges'));
const ChallengeNew = lazy(() => import('./pages/ChallengeNew'));
const ChallengeDetail = lazy(() => import('./pages/ChallengeDetail'));
const Stats = lazy(() => import('./pages/Stats'));
const Friends = lazy(() => import('./pages/Friends'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Booting() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-bg">
      <div className="animate-pulse-ring rounded-2xl">
        <Wordmark />
      </div>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="space-y-4 py-10">
      <div className="shimmer h-8 w-48 rounded-xl" />
      <div className="shimmer h-40 rounded-[var(--radius-card)]" />
      <div className="shimmer h-40 rounded-[var(--radius-card)]" />
    </div>
  );
}

function ProtectedLayout() {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <Booting />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

function Routed() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Home />} />
        <Route path="challenges" element={<Challenges />} />
        <Route path="challenges/new" element={<ChallengeNew />} />
        <Route path="challenges/:uuid" element={<ChallengeDetail />} />
        <Route path="stats" element={<Stats />} />
        <Route path="friends" element={<Friends />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routed />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
