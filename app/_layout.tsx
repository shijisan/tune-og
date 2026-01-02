import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import "../assets/global.css";
import { MusicProvider } from '../context/MusicContext';


export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <MusicProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerTitle: "Settings" }} />
        </Stack>
        <StatusBar style="auto" />
      </MusicProvider>
    </ThemeProvider>
  );
}