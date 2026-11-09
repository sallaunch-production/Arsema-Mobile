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

type QuoteOption = 'include' | 'exclude' | 'receive';

export default function SendQuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { formatCurrency } = useFormatCurrency();
  const [destinationCountry] = useState(params.destinationCountryName || params.destinationCountry || 'Great Britain');
  const [amount, setAmount] = useState(params.amount ? params.amount.toString().replace(/\D/g, '') : '');
  const [quoteBy, setQuoteBy] = useState<QuoteOption>((params.quoteBy as QuoteOption) || 'exclude');
  const [promoCode, setPromoCode] = useState(params.promoCode || '');

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/\D/g, '');
    setAmount(numericValue);
  };

  const formattedAmount = amount ? formatCurrency(Number(amount)) : '';

  const handleNext = () => {
    router.push({
      pathname: '/(moneygram)/service-options',
      params: {
        destinationCountry,
        amount,
        quoteBy,
        promoCode,
        quoteResult: params.quoteResult || '',
      },
    });
  };

  const isFormValid = amount.length > 0;

  return (
    <ScreenLayout title="Send Quote">
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Destination country *</Text>
        <View style={styles.countryDisplay}>
          <Text style={styles.countryText}>{destinationCountry}</Text>
        </View>

        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={formattedAmount}
          onChangeText={handleAmountChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={Colors.grayText}
        />

        <Text style={styles.label}>Quote by: *</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setQuoteBy('include')}
          >
            <View style={[styles.radio, quoteBy === 'include' && styles.radioSelected]}>
              {quoteBy === 'include' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>Include fee into the amount</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setQuoteBy('exclude')}
          >
            <View style={[styles.radio, quoteBy === 'exclude' && styles.radioSelected]}>
              {quoteBy === 'exclude' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>Exclude fee from the amount</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setQuoteBy('receive')}
          >
            <View style={[styles.radio, quoteBy === 'receive' && styles.radioSelected]}>
              {quoteBy === 'receive' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>Receive Amount</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Promo Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your promo code"
          placeholderTextColor={Colors.grayText}
          value={promoCode}
          onChangeText={setPromoCode}
        />
        <Text style={styles.promoHint}>
          Promo code will be applied to this transaction in a form of cashback to your bank account.
        </Text>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, !isFormValid && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

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
    marginTop: 20,
  },
  countryDisplay: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.gray,
  },
  countryText: {
    fontSize: 15,
    color: Colors.black,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.black,
  },
  radioGroup: {
    gap: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: Colors.black,
  },
  promoHint: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 8,
    lineHeight: 18,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
