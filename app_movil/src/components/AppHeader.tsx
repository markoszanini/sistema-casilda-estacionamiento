import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function AppHeader({
  title = 'Casilda Conecta',
  subtitle,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.green,
    borderBottomWidth: 3,
    borderBottomColor: colors.yellow,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.headerSubtitle,
    fontSize: 13,
    marginTop: 4,
  },
});
