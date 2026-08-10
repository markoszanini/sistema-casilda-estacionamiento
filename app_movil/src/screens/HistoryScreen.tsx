import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSessions } from '../api/client';
import type { ParkingSession } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { DEMO_USER_ID } from '../config';
import { colors } from '../theme/colors';
import { formatARS } from '../utils/money';

export function HistoryScreen() {
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getSessions();
          if (!active) return;
          setSessions(
            data
              .filter((s) => s.user_id === DEMO_USER_ID)
              .sort(
                (a, b) =>
                  new Date(b.inicio).getTime() - new Date(a.inicio).getTime(),
              ),
          );
        } catch (err) {
          if (active) {
            setError(err instanceof Error ? err.message : 'Error al cargar historial');
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Historial" subtitle="Sesiones desde la API" />
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={colors.green} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && sessions.length === 0 ? (
          <Text style={styles.hint}>Todavía no hay sesiones para este usuario.</Text>
        ) : null}
        {sessions.map((session) => (
          <View key={session.id} style={styles.card}>
            <Text style={styles.date}>
              {new Date(session.inicio).toLocaleString('es-AR')}
            </Text>
            <Text style={styles.meta}>
              {session.patente} · {session.estado}
              {session.estado === 'FINALIZADO'
                ? ` · ${formatARS(session.costo_total)}`
                : ''}
            </Text>
          </View>
        ))}
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
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  date: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 14,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
  },
});
