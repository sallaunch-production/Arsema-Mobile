import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useFormatCurrency } from '../../utils/format-currency';

export const AmountScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const { formatCurrency } = useFormatCurrency();

  const transferFee = 0;
  const numericAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;
  const totalAmount = numericAmount + transferFee;

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setAmount(digits);
  };

  const handleContinue = () => {
    if (numericAmount <= 0) return;

    router.push({
      pathname: '/(send-money)/review',
      params: {
        bankName: params.bankName,
        accountNumber: params.accountNumber,
        recipientName: params.recipientName,
        amount: numericAmount.toString(),
        transferFee: transferFee.toString(),
        totalAmount: totalAmount.toString(),
        notes,
      },
    });
  };

  return (
    <ScreenLayout title="Send Money">
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.recipientCard}>
          <Text style={styles.recipientLabel}>Sending to</Text>
          <Text style={styles.recipientName}>{params.recipientName}</Text>
          <Text style={styles.recipientDetail}>
            {params.bankName} • {params.accountNumber}
          </Text>
        </View>

        <Text style={styles.label}>Transfer Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencyLabel}>IDR</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={Colors.grayText}
            value={amount ? formatCurrency(numericAmount) : ''}
            onChangeText={handleAmountChange}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Transfer Fee</Text>
          <Text style={styles.feeValue}>IDR 0</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>
            IDR {numericAmount > 0 ? formatCurrency(totalAmount) : '0'}
          </Text>
        </View>

        <Text style={[styles.label, { marginTop: 24 }]}>Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add a note for the recipient"
          placeholderTextColor={Colors.grayText}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueButton, numericAmount <= 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={numericAmount <= 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
  recipientCard: {
    backgroundColor: Colors.gray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  recipientLabel: {
    fontSize: 12,
    color: Colors.grayText,
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 2,
  },
  recipientDetail: {
    fontSize: 14,
    color: Colors.grayText,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    paddingVertical: 14,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  feeLabel: {
    fontSize: 14,
    color: Colors.grayText,
  },
  feeValue: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.grayBorder,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.black,
    minHeight: 80,
    backgroundColor: Colors.white,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AmountScreen;
