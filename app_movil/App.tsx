import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppTabs } from './src/navigation/AppTabs';
import { LoginScreen } from './src/screens/LoginScreen';
import { colors } from './src/theme/colors';

function RootNavigator() {
  const { userId, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.green,
        }}
      >
        <ActivityIndicator color={colors.yellow} size="large" />
      </View>
    );
  }

  if (!userId) {
    return <LoginScreen />;
  }

  return <AppTabs />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
