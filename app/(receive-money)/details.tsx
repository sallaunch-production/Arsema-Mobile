import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useFormatCurrency } from '../../utils/format-currency';

export const ReceiveDetails = () => {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const { formatCurrency } = useFormatCurrency();

  const numericAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setAmount(digits);
  };

  const handleGenerateQR = () => {
    if (numericAmount <= 0) return;

    router.push({
      pathname: '/(receive-money)/qr-code',
      params: {
        amount: numericAmount.toString(),
        notes,
      },
    });
  };

  return (
    <ScreenLayout title="Receive Money">
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Amount to Receive</Text>
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

        <Text style={[styles.label, { marginTop: 24 }]}>Notes / Description (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add a description for this payment"
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
          style={[styles.generateButton, numericAmount <= 0 && styles.generateButtonDisabled]}
          onPress={handleGenerateQR}
          disabled={numericAmount <= 0}
        >
          <Text style={styles.generateButtonText}>Generate QR Code</Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
    marginTop: 16,
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
  generateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ReceiveDetails;
