import { Stack } from 'expo-router';

export default function SendMoneyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="receiver-details" />
      <Stack.Screen name="amount" />
      <Stack.Screen name="review" />
      <Stack.Screen name="enter-pin" />
      <Stack.Screen name="success" />
      <Stack.Screen name="failed" />
    </Stack>
  );
}
