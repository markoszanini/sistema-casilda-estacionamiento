import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getWallet, recargarSaldo } from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { formatARS } from '../utils/money';

const QUICK_AMOUNTS = [500, 1000, 2500];

export function WalletScreen() {
  const { userId } = useAuth();
  const [saldo, setSaldo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const wallet = await getWallet(userId);
      setSaldo(wallet.saldo_actual);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar billetera');
      setSaldo(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void loadWallet();
    }, [loadWallet]),
  );

  const onCharge = async (monto: number) => {
    if (!userId) return;
    setCharging(true);
    setError(null);
    setMessage(null);
    try {
      const result = await recargarSaldo(userId, monto);
      setSaldo(String(result.saldo_actual));
      setMessage(`${result.mensaje} (+${formatARS(result.monto_acreditado)})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar saldo');
    } finally {
      setCharging(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Billetera" subtitle="Cargar saldo (demo MercadoPago)" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Crédito</Text>
          {loading ? (
            <ActivityIndicator color={colors.green} style={styles.loader} />
          ) : (
            <Text style={styles.balance}>
              {saldo == null ? '—' : formatARS(saldo)}
            </Text>
          )}
          {message ? <Text style={styles.ok}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.section}>Cargar saldo</Text>
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
            onPress={() => void onCharge(500)}
          >
            {charging ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>Cargar con MercadoPago</Text>
            )}
          </Pressable>
        </View>
        <Text style={styles.hint}>
          Simulación de pago para la demo. El backend acredita el monto en tu billetera.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
  },
  balance: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 24,
    alignSelf: 'flex-start',
  },
  ok: {
    color: colors.green,
    marginBottom: 10,
    fontWeight: '600',
  },
  error: {
    color: '#DC2626',
    marginBottom: 12,
    fontSize: 13,
  },
  section: {
    marginTop: 4,
    marginBottom: 10,
    fontWeight: '700',
    color: colors.text,
  },
  amounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
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
  cta: {
    backgroundColor: colors.yellow,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
