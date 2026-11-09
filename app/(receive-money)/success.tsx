import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useFormatCurrency } from '../../utils/format-currency';

export const ReceiveSuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { formatCurrency } = useFormatCurrency();

  const amount = params.amount || '0';
  const senderName = params.senderName || 'Unknown Sender';
  const senderBank = params.senderBank || 'Unknown Bank';
  const senderAccount = params.senderAccount || '••••••••••';

  const dateTime = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleBackToHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        <Text style={styles.title}>Payment Received!</Text>
        <Text style={styles.amount}>IDR {formatCurrency(amount)}</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sender</Text>
            <Text style={styles.detailValue}>{senderName}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bank</Text>
            <Text style={styles.detailValue}>{senderBank}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account</Text>
            <Text style={styles.detailValue}>{senderAccount}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{dateTime}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 40,
    color: Colors.white,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 32,
  },
  detailsCard: {
    backgroundColor: Colors.gray,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.grayBorder,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.grayText,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'right',
    flex: 1,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
  },
  homeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ReceiveSuccessScreen;
