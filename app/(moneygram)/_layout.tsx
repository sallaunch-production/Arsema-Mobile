import { Stack } from 'expo-router';

export default function MoneyGramLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="transfer" />
      <Stack.Screen name="destination-country" />
      <Stack.Screen name="send-quote" />
      <Stack.Screen name="service-options" />
      <Stack.Screen name="beneficiary-details" />
      <Stack.Screen name="sending-details" />
      <Stack.Screen name="payment-method" />
      <Stack.Screen name="review-send" />
      <Stack.Screen name="review-pin" />
      <Stack.Screen name="virtual-account" />
      <Stack.Screen name="transaction-success" />
      <Stack.Screen name="transaction-detail" />
    </Stack>
  );
}
