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

export const TransferSuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { formatCurrency } = useFormatCurrency();

  const referenceNumber = `TRX${Date.now().toString().slice(-10)}`;
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

  const handleViewReceipt = () => {
    // Placeholder for receipt view
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        <Text style={styles.title}>Transfer Successful!</Text>
        <Text style={styles.amount}>
          IDR {formatCurrency(params.amount)}
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>{params.recipientName}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bank</Text>
            <Text style={styles.detailValue}>{params.bankName}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Number</Text>
            <Text style={styles.detailValue}>{params.accountNumber}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference Number</Text>
            <Text style={styles.detailValue}>{referenceNumber}</Text>
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

        <TouchableOpacity style={styles.receiptButton} onPress={handleViewReceipt}>
          <Text style={styles.receiptButtonText}>View Receipt</Text>
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
    marginBottom: 12,
  },
  homeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  receiptButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  receiptButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TransferSuccessScreen;
