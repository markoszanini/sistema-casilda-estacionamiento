import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ensureWallet } from '../api/client';
import { appStorage } from '../storage';

const STORAGE_KEY = 'casilda.userId';

type AuthContextValue = {
  userId: number | null;
  loading: boolean;
  login: (userId: number) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await appStorage.getItem(STORAGE_KEY);
        if (saved) {
          setUserId(Number(saved));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (nextUserId: number) => {
    await ensureWallet(nextUserId);
    await appStorage.setItem(STORAGE_KEY, String(nextUserId));
    setUserId(nextUserId);
  }, []);

  const logout = useCallback(async () => {
    await appStorage.removeItem(STORAGE_KEY);
    setUserId(null);
  }, []);

  const value = useMemo(
    () => ({ userId, loading, login, logout }),
    [userId, loading, login, logout],
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
