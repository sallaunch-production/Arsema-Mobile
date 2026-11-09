import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useAuth } from '../../contexts/auth-context';
import { useKYC } from '../../contexts/kyc-context';
import { API_BASE_URL } from '../../constants/api';

interface Bank {
  name: string;
  code: string;
}

export default function BankAccountScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { updateKYCData, submitBankAccount } = useKYC();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);

  // Fetch banks from API
  useEffect(() => {
    const fetchBanks = async () => {
      if (!token) {
        setIsLoadingBanks(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/v1/banks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const text = await response.text();
        console.log('Banks API Response:', response.status, text);
        
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.log('Failed to parse banks response:', text);
          setBanks([]);
          return;
        }

        if (response.ok && data.data && Array.isArray(data.data)) {
          setBanks(data.data);
        } else {
          console.log('Failed to load banks:', data.message);
          setBanks([]);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
        setBanks([]);
      } finally {
        setIsLoadingBanks(false);
      }
    };

    fetchBanks();
  }, [token]);

  const isFormValid = bankName.length > 0 && holderName.length > 0 && accountNumber.length > 0;

  const handleNext = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Store bank data in KYC context
      updateKYCData({
        bankName,
        bankCode,
        bankHolderName: holderName,
        bankAccountNumber: accountNumber,
      });

      // Call the bank account API from context with direct data
      const success = await submitBankAccount({
        bankName,
        bankCode,
        bankHolderName: holderName,
        bankAccountNumber: accountNumber,
      });
      
      if (success) {
        router.push('/(kyc)/liveness-detection');
      }
    } catch (error) {
      console.error('Error saving bank account:', error);
      Alert.alert('Error', 'Failed to save bank account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenLayout title="Identity Verification">
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.subtitle}>Bank Account Details</Text>

        <Text style={styles.label}>Bank Name *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowBankPicker(!showBankPicker)}
        >
          <Text style={[styles.pickerText, !bankName && styles.placeholderText]}>
            {bankName || 'Choose one'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.grayText} />
        </TouchableOpacity>
        {showBankPicker && (
          <View style={styles.dropdownList}>
            {isLoadingBanks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading banks...</Text>
              </View>
            ) : banks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No banks available</Text>
              </View>
            ) : (
              banks.map((bank) => (
                <TouchableOpacity
                  key={bank.code}
                  style={[styles.dropdownItem, bankName === bank.name && styles.dropdownItemSelected]}
                  onPress={() => { setBankName(bank.name); setBankCode(bank.code); setShowBankPicker(false); }}
                >
                  <Text style={[styles.dropdownItemText, bankName === bank.name && styles.dropdownItemTextSelected]}>
                    {bank.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <Text style={styles.label}>Holder Full Name *</Text>
        <TextInput
          style={styles.input}
          value={holderName}
          onChangeText={setHolderName}
          placeholder="Type the full name"
          placeholderTextColor={Colors.grayText}
        />

        <Text style={styles.label}>Accounts Number *</Text>
        <TextInput
          style={styles.input}
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="Type in the account number"
          placeholderTextColor={Colors.grayText}
          keyboardType="number-pad"
        />

        <Text style={styles.hintText}>
          You could add more bank account when you have been verified later
        </Text>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, (!isFormValid || isLoading) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 15, fontWeight: '600', color: Colors.black, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.black, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.black,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerText: { fontSize: 14, color: Colors.black },
  placeholderText: { color: Colors.grayText },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: Colors.white,
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemSelected: { backgroundColor: Colors.gray },
  dropdownItemText: { fontSize: 14, color: Colors.black },
  dropdownItemTextSelected: { color: Colors.primary, fontWeight: '600' },
  loadingContainer: { paddingVertical: 16, paddingHorizontal: 14, alignItems: 'center' },
  loadingText: { fontSize: 14, color: Colors.grayText, marginTop: 8 },
  emptyContainer: { paddingVertical: 16, paddingHorizontal: 14, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.grayText },
  hintText: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 12,
    lineHeight: 18,
  },
  bottomContainer: { padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: Colors.grayBorder },
  nextButton: { backgroundColor: Colors.primary, borderRadius: 25, paddingVertical: 16, alignItems: 'center' },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
