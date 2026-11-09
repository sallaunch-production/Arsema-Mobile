import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useFormatCurrency } from '../../utils/format-currency';

export const ReviewScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { formatCurrency } = useFormatCurrency();

  const handleConfirm = () => {
    router.push({
      pathname: '/(send-money)/enter-pin',
      params: {
        bankName: params.bankName,
        accountNumber: params.accountNumber,
        recipientName: params.recipientName,
        amount: params.amount,
        transferFee: params.transferFee,
        totalAmount: params.totalAmount,
        notes: params.notes,
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScreenLayout title="Review Transfer">
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Recipient Name</Text>
            <Text style={styles.summaryValue}>{params.recipientName}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bank</Text>
            <Text style={styles.summaryValue}>{params.bankName}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Account Number</Text>
            <Text style={styles.summaryValue}>{params.accountNumber}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>
              IDR {formatCurrency(params.amount)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transfer Fee</Text>
            <Text style={[styles.summaryValue, styles.freeText]}>
              IDR {formatCurrency(params.transferFee)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              IDR {formatCurrency(params.totalAmount)}
            </Text>
          </View>

          {params.notes ? (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Notes</Text>
                <Text style={[styles.summaryValue, styles.notesValue]}>
                  {params.notes}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Confirm & Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.grayBorder,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.grayText,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'right',
    flex: 1,
  },
  freeText: {
    color: Colors.success,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    flex: 1,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'right',
    flex: 1,
  },
  notesValue: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: Colors.grayText,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReviewScreen;
