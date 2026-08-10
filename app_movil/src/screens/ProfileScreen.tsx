import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSessions, getWallet, recargarSaldo } from '../api/client';
import type { ParkingSession } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { formatARS } from '../utils/money';

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

export function ProfileScreen() {
  const { userId, logout } = useAuth();
  const [saldo, setSaldo] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [wallet, allSessions] = await Promise.all([
        getWallet(userId),
        getSessions(),
      ]);
      setSaldo(wallet.saldo_actual);
      setSessions(
        allSessions
          .filter((s) => s.user_id === userId)
          .sort(
            (a, b) =>
              new Date(b.inicio).getTime() - new Date(a.inicio).getTime(),
          ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onCharge = async (monto: number) => {
    if (!userId) return;
    setCharging(true);
    setWalletMessage(null);
    setError(null);
    try {
      const result = await recargarSaldo(userId, monto);
      setSaldo(String(result.saldo_actual));
      setWalletMessage(
        `Carga demo OK · +${formatARS(result.monto_acreditado)} (MercadoPago)`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar saldo');
    } finally {
      setCharging(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Perfil" subtitle={`Usuario #${userId}`} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Billetera Virtual</Text>
          {loading ? (
            <ActivityIndicator color={colors.green} />
          ) : (
            <Text style={styles.balance}>
              {saldo == null ? '—' : formatARS(saldo)}
            </Text>
          )}

          <Text style={styles.manageTitle}>Cargar saldo</Text>
          <Text style={styles.manageHint}>
            Opciones de ejemplo (simulación MercadoPago)
          </Text>
          <View style={styles.amounts}>
            {QUICK_AMOUNTS.map((amount) => (
              <Pressable
                key={amount}
                style={styles.amountBtn}
                disabled={charging || loading}
                onPress={() => void onCharge(amount)}
              >
                <Text style={styles.amountText}>{formatARS(amount)}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.cta}
            disabled={charging || loading}
            onPress={() => void onCharge(1000)}
          >
            {charging ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>Cargar con MercadoPago</Text>
            )}
          </Pressable>

          {walletMessage ? <Text style={styles.ok}>{walletMessage}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <Text style={styles.section}>Historial de sesiones</Text>
        {sessions.length === 0 && !loading ? (
          <Text style={styles.hint}>Todavía no hay sesiones.</Text>
        ) : null}
        {sessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <Text style={styles.sessionTitle}>
              {session.patente} · {session.estado}
            </Text>
            <Text style={styles.sessionMeta}>
              {new Date(session.inicio).toLocaleString('es-AR')}
              {session.estado === 'FINALIZADO'
                ? ` · ${formatARS(session.costo_total)}`
                : ''}
            </Text>
          </View>
        ))}

        <Pressable style={styles.logout} onPress={() => void logout()}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
        <Text style={styles.footer}>© 2026 Municipalidad de Casilda</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 12, paddingBottom: 28 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: { color: colors.textMuted, fontWeight: '600' },
  balance: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  manageTitle: {
    marginTop: 16,
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
  },
  manageHint: {
    marginTop: 4,
    marginBottom: 10,
    color: colors.textMuted,
    fontSize: 12,
  },
  amounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  amountBtn: {
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  amountText: {
    color: colors.green,
    fontWeight: '700',
  },
  error: { color: '#DC2626', marginTop: 10 },
  ok: { color: colors.green, marginTop: 10, fontWeight: '600' },
  cta: {
    backgroundColor: colors.yellow,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  ctaText: { color: colors.white, fontWeight: '800' },
  section: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  hint: { color: colors.textMuted },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
  },
  sessionTitle: { fontWeight: '700', color: colors.text },
  sessionMeta: { marginTop: 4, color: colors.textMuted, fontSize: 13 },
  logout: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#DC2626', fontWeight: '700' },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 12,
  },
});
