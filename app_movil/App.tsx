import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AppTabs } from './src/navigation/AppTabs';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppTabs />
    </NavigationContainer>
  );
}
