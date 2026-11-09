import { Stack } from 'expo-router';
import { KYCProvider } from '../../contexts/kyc-context';

export default function KycLayout() {
  return (
    <KYCProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="personal-details" />
        <Stack.Screen name="identity-information" />
        <Stack.Screen name="verify-id-card" />
        <Stack.Screen name="verify-face" />
        <Stack.Screen name="bank-account" />
        <Stack.Screen name="liveness-detection" />
        <Stack.Screen name="terms-and-conditions" />
        <Stack.Screen name="success" />
      </Stack>
    </KYCProvider>
  );
}
