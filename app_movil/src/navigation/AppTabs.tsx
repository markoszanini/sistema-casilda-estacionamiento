import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { colors } from '../theme/colors';

export type AppTabParamList = {
  Inicio: undefined;
  Billetera: undefined;
  Vehiculos: undefined;
  Historial: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: '#E2E8F0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Inicio'
              ? 'map'
              : route.name === 'Billetera'
                ? 'wallet'
                : route.name === 'Vehiculos'
                  ? 'car'
                  : 'time';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Billetera" component={WalletScreen} />
      <Tab.Screen
        name="Vehiculos"
        component={VehiclesScreen}
        options={{ title: 'Vehículos' }}
      />
      <Tab.Screen name="Historial" component={HistoryScreen} />
    </Tab.Navigator>
  );
}
