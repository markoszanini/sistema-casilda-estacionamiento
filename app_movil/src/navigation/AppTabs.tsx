import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { HomeScreen } from '../screens/HomeScreen';
import { InspectorScreen } from '../screens/InspectorScreen';
import { ParkScreen } from '../screens/ParkScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { colors } from '../theme/colors';

export type AppTabParamList = {
  Inicio: undefined;
  Estacionar: undefined;
  Inspector: undefined;
  Vehiculos: undefined;
  Perfil: undefined;
  Billetera: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

function hiddenTabOptions() {
  return {
    tabBarButton: () => null,
    tabBarItemStyle: {
      display: 'none' as const,
      width: 0,
      flex: 0,
    },
  };
}

export function AppTabs() {
  const { role } = useAuth();
  const isInspector = role === 'INSPECTOR';
  // INSPECTOR: oculta Estacionar y muestra Inspector.
  // VECINO: oculta Inspector (y con eso la cámara).
  const hideEstacionar = isInspector;
  const hideInspector = !isInspector;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const isHidden =
          route.name === 'Billetera' ||
          (hideEstacionar && route.name === 'Estacionar') ||
          (hideInspector && route.name === 'Inspector');
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.white,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.75)',
          tabBarStyle: {
            backgroundColor: colors.green,
            borderTopWidth: 0,
            height: 72,
            paddingHorizontal: 4,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarItemStyle: isHidden
            ? {
                display: 'none',
                width: 0,
                minWidth: 0,
                maxWidth: 0,
                flex: 0,
                padding: 0,
                margin: 0,
              }
            : {
                flex: 1,
                minWidth: 0,
                paddingHorizontal: 2,
                alignItems: 'center',
                justifyContent: 'center',
              },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginTop: 2,
          },
          tabBarIcon: ({ color, size, focused }) => {
            if (isHidden) return null;
            const iconName =
              route.name === 'Inicio'
                ? 'home'
                : route.name === 'Estacionar'
                  ? 'location'
                  : route.name === 'Inspector'
                    ? 'camera'
                    : route.name === 'Vehiculos'
                      ? 'car'
                      : 'person';

            return (
              <Ionicons
                name={iconName}
                size={focused ? size + 1 : size}
                color={color}
              />
            );
          },
        };
      }}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen
        name="Estacionar"
        component={ParkScreen}
        options={hideEstacionar ? hiddenTabOptions() : undefined}
      />
      <Tab.Screen
        name="Inspector"
        component={InspectorScreen}
        options={hideInspector ? hiddenTabOptions() : undefined}
      />
      <Tab.Screen
        name="Vehiculos"
        component={VehiclesScreen}
        options={{ title: 'Vehículos' }}
      />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen
        name="Billetera"
        component={WalletScreen}
        options={hiddenTabOptions()}
      />
    </Tab.Navigator>
  );
}
