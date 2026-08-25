import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearSession, getStoredUser, isLoggedIn, onSessionLost } from '../api/client';

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  // Start from the cached user so a reload paints the app immediately and
  // verifies against the backend in the background.
  const [user, setUser] = useState(() => (isLoggedIn() ? getStoredUser() : null));
  const [checking, setChecking] = useState(() => isLoggedIn());
  const [online, setOnline] = useState(null);

  useEffect(() => onSessionLost(() => setUser(null)), []);

  useEffect(() => {
    let cancelled = false;
    if (!isLoggedIn()) {
      setChecking(false);
      return undefined;
    }
    api
      .me()
      .then((fresh) => {
        if (!cancelled) setUser(fresh);
      })
      .catch((error) => {
        // A dead backend must not sign anyone out — only a rejected session does
        // that, and the client has already cleared it by the time we get here.
        if (!cancelled && error.status === 401) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ping = () => api.health().then((ok) => !cancelled && setOnline(ok));
    ping();
    const timer = setInterval(ping, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const session = await api.login({ username, password });
    setUser(session);
    return session;
  }, []);

  const register = useCallback(async (username, password, displayName) => {
    const session = await api.register({
      username,
      password,
      display_name: displayName || username,
    });
    setUser(session);
    return session;
  }, []);

  const loginWithAuthentik = useCallback(async () => {
    const session = await api.loginWithAuthentik();
    setUser(session);
    return session;
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => clearSession());
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, checking, online, login, loginWithAuthentik, register, logout }),
    [user, checking, online, login, loginWithAuthentik, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
