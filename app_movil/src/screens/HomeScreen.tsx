import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  finalizarEstacionamiento,
  getActiveSessionForUser,
  getVehicles,
  getWallet,
  iniciarEstacionamiento,
  getSessions,
} from '../api/client';
import type { FavoriteVehicle, ParkingSession } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { OsmMap } from '../components/OsmMap';
import { StartParkingModal } from '../components/StartParkingModal';
import { DEMO_PATENTE } from '../config';
import { useAuth } from '../context/AuthContext';
import type { AppTabParamList } from '../navigation/AppTabs';
import { colors } from '../theme/colors';
import { formatARS } from '../utils/money';

type Nav = BottomTabNavigationProp<AppTabParamList>;

export function HomeScreen() {
  const { userId } = useAuth();
  const navigation = useNavigation<Nav>();
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [saldo, setSaldo] = useState<string | null>(null);
  const [session, setSession] = useState<ParkingSession | null>(null);
  const [vehicles, setVehicles] = useState<FavoriteVehicle[]>([]);
  const [vehicle, setVehicle] = useState<FavoriteVehicle | null>(null);
  const [lastSession, setLastSession] = useState<ParkingSession | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const [wallet, activeSession, vehicleList, sessions] = await Promise.all([
        getWallet(userId),
        getActiveSessionForUser(userId),
        getVehicles(userId),
        getSessions(),
      ]);
      setSaldo(wallet.saldo_actual);
      setSession(activeSession);
      setVehicles(vehicleList);
      setVehicle(vehicleList[0] ?? null);
      const mine = sessions
        .filter((s) => s.user_id === userId)
        .sort(
          (a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime(),
        );
      setLastSession(mine[0] ?? null);
      setStatusMessage(
        activeSession
          ? `Estacionamiento ACTIVO · ${activeSession.patente}${
              activeSession.seccion ? ` · ${activeSession.seccion}` : ''
            }`
          : 'Listo para estacionar',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo hablar con la API');
      setStatusMessage('Backend offline');
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
        // Casilda fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onToggleParking = async () => {
    if (!userId) return;
    if (!session) {
      setShowStartModal(true);
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const result = await finalizarEstacionamiento(session.id);
      setSaldo(String(result.saldo_restante));
      setSession(null);
      setStatusMessage(
        `Finalizado · ${formatARS(result.costo_cobrado)} · ${result.minutos_transcurridos} min`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción');
    } finally {
      setActionLoading(false);
    }
  };

  const onStartConfirm = async (payload: {
    patente: string;
    calle: string;
    altura: number;
    duracion_minutos: number;
    medio_pago: string;
  }) => {
    if (!userId) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await iniciarEstacionamiento(userId, payload);
      setShowStartModal(false);
      setSaldo(String(result.saldo_actual));
      setStatusMessage(
        `${result.mensaje}${result.seccion ? ` · ${result.seccion}` : ''}`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción');
    } finally {
      setActionLoading(false);
    }
  };

  const parkingActive = Boolean(session);

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.card} onPress={() => navigation.navigate('Billetera')}>
          <View style={styles.walletHeader}>
            <Text style={styles.cardLabel}>Billetera Virtual</Text>
            <Text style={styles.chargeLink}>Cargar saldo ›</Text>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.green} style={{ marginVertical: 12 }} />
          ) : (
            <Text style={styles.balance}>
              {saldo == null ? '—' : formatARS(saldo)}
            </Text>
          )}
          {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Pressable>

        <Pressable
          style={[
            styles.cta,
            parkingActive && styles.ctaStop,
            (loading || actionLoading) && styles.ctaDisabled,
          ]}
          disabled={loading || actionLoading}
          onPress={() => {
            void onToggleParking();
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

        <View style={styles.mapCard}>
          <Text style={styles.sectionTitle}>Zona actual</Text>
          <View style={styles.mapBox}>
            <OsmMap
              userLatitude={userCoords?.latitude}
              userLongitude={userCoords?.longitude}
            />
          </View>
        </View>

        <View style={styles.linkCard}>
          <View style={styles.linkHeader}>
            <Text style={styles.sectionTitle}>Mis Vehículos</Text>
          </View>
          <View style={styles.vehicleRow}>
            <View style={styles.carPlaceholder}>
              <Ionicons name="car-sport" size={28} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.plate}>
                {vehicle?.patente ?? DEMO_PATENTE}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {vehicle?.alias ?? 'Principal'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.vehicleActions}>
            <Pressable
              style={styles.manageBtn}
              onPress={() => navigation.navigate('Vehiculos')}
            >
              <Text style={styles.manageBtnText}>Gestionar</Text>
            </Pressable>
            <Pressable
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Vehiculos')}
            >
              <Text style={styles.registerBtnText}>Registrar vehículo</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.linkCard}
          onPress={() => navigation.navigate('Perfil')}
        >
          <View style={styles.linkHeader}>
            <Text style={styles.sectionTitle}>Historial</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>Sesiones estacionamiento</Text>
            <Text style={styles.historyTime}>
              {lastSession
                ? new Date(lastSession.inicio).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      <StartParkingModal
        visible={showStartModal}
        vehicles={vehicles}
        loading={actionLoading}
        onCancel={() => setShowStartModal(false)}
        onConfirm={(payload) => {
          void onStartConfirm(payload);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { padding: 16, paddingBottom: 28, gap: 14 },
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
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  chargeLink: { color: colors.green, fontWeight: '700', fontSize: 13 },
  balance: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 6,
  },
  status: { marginTop: 8, color: colors.green, fontWeight: '600', fontSize: 13 },
  error: { marginTop: 8, color: '#DC2626', fontSize: 12 },
  cta: {
    backgroundColor: colors.yellow,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  ctaStop: { backgroundColor: '#DC2626' },
  ctaDisabled: { opacity: 0.7 },
  ctaText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  mapCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  mapBox: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  linkCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chevron: { fontSize: 28, color: colors.textMuted, lineHeight: 28 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  carPlaceholder: {
    width: 64,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plate: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#166534', fontSize: 12, fontWeight: '700' },
  vehicleActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  manageBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  manageBtnText: {
    color: colors.green,
    fontWeight: '700',
    fontSize: 13,
  },
  registerBtn: {
    flex: 1.3,
    backgroundColor: colors.yellow,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  registerBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLabel: { color: colors.textMuted, fontSize: 14 },
  historyTime: { color: colors.text, fontWeight: '700' },
});
