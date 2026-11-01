import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '../context/session';
import { ThemeProvider, useTheme } from '../context/theme';

function Navigation() {
  const { mode, colors } = useTheme();
  return <><StatusBar style={mode === 'dark' ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade' }} /></>;
}
export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><SessionProvider><Navigation /></SessionProvider></ThemeProvider></SafeAreaProvider>;
}
