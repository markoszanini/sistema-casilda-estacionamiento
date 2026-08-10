import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { ParkScreen } from '../screens/ParkScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { colors } from '../theme/colors';

export type AppTabParamList = {
  Inicio: undefined;
  Estacionar: undefined;
  Vehiculos: undefined;
  Perfil: undefined;
  Billetera: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        tabBarStyle: {
          backgroundColor: colors.green,
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Inicio'
              ? 'home'
              : route.name === 'Estacionar'
                ? 'location'
                : route.name === 'Vehiculos'
                  ? 'car'
                  : 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Estacionar" component={ParkScreen} />
      <Tab.Screen
        name="Vehiculos"
        component={VehiclesScreen}
        options={{ title: 'Vehículos' }}
      />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen
        name="Billetera"
        component={WalletScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
}
