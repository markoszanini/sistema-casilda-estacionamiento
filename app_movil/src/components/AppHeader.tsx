import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function AppHeader({
  title = 'Casilda Conecta',
  subtitle = 'Estacionamiento Medido',
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <Image
          source={require('../../assets/logomuni-blanco.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 52,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: colors.green,
    borderBottomWidth: 3,
    borderBottomColor: colors.yellow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
  },
  titles: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.headerSubtitle,
    fontSize: 13,
    marginTop: 2,
  },
});
