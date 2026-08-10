import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';

const PLACEHOLDER_SESSIONS = [
  { id: '1', date: '07/08/2026', duration: '45 min', amount: '$ 250' },
  { id: '2', date: '05/08/2026', duration: '1 h 10 min', amount: '$ 380' },
];

export function HistoryScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Historial" subtitle="Sesiones de estacionamiento" />
      <View style={styles.content}>
        {PLACEHOLDER_SESSIONS.map((session) => (
          <View key={session.id} style={styles.card}>
            <Text style={styles.date}>{session.date}</Text>
            <Text style={styles.meta}>
              {session.duration} · {session.amount}
            </Text>
          </View>
        ))}
        <Text style={styles.hint}>
          Próximo paso: listar sesiones reales desde `/api/sessions/`.
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
    marginTop: 8,
  },
});
