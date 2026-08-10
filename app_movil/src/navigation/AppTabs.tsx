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
      screenOptions={({ route }) => {
        const isHidden = route.name === 'Billetera';
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.white,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.75)',
          tabBarStyle: {
            backgroundColor: colors.green,
            borderTopWidth: 0,
            height: 72,
            paddingHorizontal: 8,
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
                paddingHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
              },
          tabBarLabelStyle: {
            fontSize: 11,
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
          tabBarItemStyle: {
            display: 'none',
            width: 0,
            flex: 0,
          },
        }}
      />
    </Tab.Navigator>
  );
}
