import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ensureWallet, getUserRole } from '../api/client';
import type { UserRole } from '../api/types';
import { appStorage } from '../storage';

const STORAGE_KEY = 'casilda.userId';

type AuthContextValue = {
  userId: number | null;
  role: UserRole;
  loading: boolean;
  login: (userId: number) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState<UserRole>('VECINO');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await appStorage.getItem(STORAGE_KEY);
        if (saved) {
          const id = Number(saved);
          setUserId(id);
          setRole(await getUserRole(id));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (nextUserId: number) => {
    await ensureWallet(nextUserId);
    const nextRole = await getUserRole(nextUserId);
    await appStorage.setItem(STORAGE_KEY, String(nextUserId));
    setRole(nextRole);
    setUserId(nextUserId);
  }, []);

  const logout = useCallback(async () => {
    await appStorage.removeItem(STORAGE_KEY);
    setUserId(null);
    setRole('VECINO');
  }, []);

  const value = useMemo(
    () => ({ userId, role, loading, login, logout }),
    [userId, role, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
