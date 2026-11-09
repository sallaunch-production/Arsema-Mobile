import { Stack } from 'expo-router';

export default function ReceiveMoneyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="details" />
      <Stack.Screen name="qr-code" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
