import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/auth-context';
import { LanguageProvider } from '../contexts/language-context';
import { usePushNotifications } from '../hooks/use-push-notifications';

function AppContent() {
  const { token } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  usePushNotifications({ token });

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!token && !inAuthGroup) {
      router.replace('/(auth)/sign-in' as any);
    }
  }, [token, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
