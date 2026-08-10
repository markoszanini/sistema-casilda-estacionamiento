import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  finalizarEstacionamiento,
  getActiveSessionForUser,
  getVehicles,
  getWallet,
  iniciarEstacionamiento,
} from '../api/client';
import type { FavoriteVehicle, ParkingSession } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { OsmMap } from '../components/OsmMap';
import { DEMO_PATENTE } from '../config';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { formatARS } from '../utils/money';

export function ParkScreen() {
  const { userId } = useAuth();
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [saldo, setSaldo] = useState<string | null>(null);
  const [session, setSession] = useState<ParkingSession | null>(null);
  const [vehicle, setVehicle] = useState<FavoriteVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('Mapa de zona medido');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const [wallet, active, vehicles] = await Promise.all([
        getWallet(userId),
        getActiveSessionForUser(userId),
        getVehicles(userId),
      ]);
      setSaldo(wallet.saldo_actual);
      setSession(active);
      setVehicle(vehicles[0] ?? null);
      setMessage(
        active
          ? `ACTIVO · ${active.patente}`
          : `Patente: ${vehicles[0]?.patente ?? DEMO_PATENTE}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de API');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || status !== 'granted') return;
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch {
        // Casilda center fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onToggle = async () => {
    if (!userId) return;
    setActionLoading(true);
    setError(null);
    try {
      const patente = vehicle?.patente ?? DEMO_PATENTE;
      if (session) {
        const result = await finalizarEstacionamiento(session.id);
        setMessage(
          `Finalizado · ${formatARS(result.costo_cobrado)} · saldo ${formatARS(result.saldo_restante)}`,
        );
      } else {
        const result = await iniciarEstacionamiento(userId, patente);
        setMessage(result.mensaje);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar');
    } finally {
      setActionLoading(false);
    }
  };

  const parkingActive = Boolean(session);

  return (
    <View style={styles.container}>
      <AppHeader title="Estacionar" subtitle={message} />
      <View style={styles.saldoBar}>
        <Text style={styles.saldoLabel}>Saldo</Text>
        <Text style={styles.saldoValue}>
          {loading || saldo == null ? '—' : formatARS(saldo)}
        </Text>
      </View>
      <View style={styles.map}>
        <OsmMap
          userLatitude={userCoords?.latitude}
          userLongitude={userCoords?.longitude}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.footer}>
        <Pressable
          style={[styles.cta, parkingActive && styles.ctaStop]}
          disabled={loading || actionLoading}
          onPress={() => {
            void onToggle();
          }}
        >
          {actionLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.ctaText}>
              {parkingActive
                ? 'DETENER ESTACIONAMIENTO'
                : 'INICIAR ESTACIONAMIENTO'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  saldoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  saldoLabel: { color: colors.textMuted, fontWeight: '600' },
  saldoValue: { color: colors.green, fontWeight: '800', fontSize: 18 },
  map: { flex: 1 },
  error: { color: '#DC2626', padding: 12, textAlign: 'center' },
  footer: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cta: {
    backgroundColor: colors.yellow,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  ctaStop: { backgroundColor: '#DC2626' },
  ctaText: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
