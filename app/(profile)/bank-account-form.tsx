import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { API_BASE_URL } from '../../constants/api';

interface Bank {
  name: string;
  code: string;
}

export default function BankAccountFormScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{
    id?: string;
    bank_name?: string;
    bank_code?: string;
    account_name?: string;
    account_number?: string;
    account_type?: string;
    is_primary?: string;
  }>();

  const isEditMode = Boolean(params.id);

  // Form state — pre-filled from params in edit mode
  const [bankName, setBankName] = useState(params.bank_name ?? '');
  const [bankCode, setBankCode] = useState(params.bank_code ?? '');
  const [accountName, setAccountName] = useState(params.account_name ?? '');
  const [accountNumber, setAccountNumber] = useState(params.account_number ?? '');
  const [accountType, setAccountType] = useState<'SAVINGS' | 'CHECKING'>(
    (params.account_type as 'SAVINGS' | 'CHECKING') ?? 'SAVINGS'
  );
  const [isPrimary, setIsPrimary] = useState(params.is_primary === 'true');

  // Bank picker state
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isFormValid =
    bankName.length > 0 &&
    bankCode.length > 0 &&
    accountName.length > 0 &&
    accountNumber.length > 0;

  // Fetch bank list
  useEffect(() => {
    const fetchBanks = async () => {
      if (!token) { setIsLoadingBanks(false); return; }
      try {
        const response = await fetch(`${API_BASE_URL}/v1/banks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await response.text();
        if (!response.ok) throw new Error(text);
        const data = JSON.parse(text);
        setBanks(Array.isArray(data.data) ? data.data : []);
      } catch {
        setBanks([]);
      } finally {
        setIsLoadingBanks(false);
      }
    };
    fetchBanks();
  }, [token]);

  const handleSubmit = async () => {
    if (!isFormValid || !token) return;
    setIsSubmitting(true);
    setErrorMsg('');
    const body = JSON.stringify({
      bank_name: bankName,
      bank_code: bankCode,
      account_name: accountName,
      account_number: accountNumber,
      account_type: accountType,
      is_primary: isPrimary,
    });
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/v1/bank-accounts/${params.id}`
        : `${API_BASE_URL}/v1/bank-accounts`;
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      router.back();
    } catch {
      setErrorMsg(t('bankAccount.errorSave'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountTypes: Array<{ value: 'SAVINGS' | 'CHECKING'; label: string }> = [
    { value: 'SAVINGS', label: t('bankAccount.savingsType') },
    { value: 'CHECKING', label: t('bankAccount.checkingType') },
  ];

  return (
    <ScreenLayout title={isEditMode ? t('bankAccount.editTitle') : t('bankAccount.addTitle')}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        {/* Bank Picker */}
        <Text style={styles.label}>{t('bankAccount.bank')} *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => { setShowBankPicker(!showBankPicker); setShowTypePicker(false); }}
        >
          <Text style={[styles.pickerText, !bankName && styles.placeholderText]}>
            {bankName || t('bankAccount.bankPlaceholder')}
          </Text>
          <Ionicons name={showBankPicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.grayText} />
        </TouchableOpacity>
        {showBankPicker && (
          <View style={styles.dropdownList}>
            {isLoadingBanks ? (
              <View style={styles.dropdownCenter}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.dropdownCenterText}>{t('bankAccount.loadingBanks')}</Text>
              </View>
            ) : banks.length === 0 ? (
              <View style={styles.dropdownCenter}>
                <Text style={styles.dropdownCenterText}>{t('bankAccount.noBanks')}</Text>
              </View>
            ) : (
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {banks.map((bank) => (
                  <TouchableOpacity
                    key={bank.code}
                    style={[styles.dropdownItem, bankName === bank.name && styles.dropdownItemSelected]}
                    onPress={() => { setBankName(bank.name); setBankCode(bank.code); setShowBankPicker(false); }}
                  >
                    <Text style={[styles.dropdownItemText, bankName === bank.name && styles.dropdownItemTextSelected]}>
                      {bank.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Account Holder Name */}
        <Text style={styles.label}>{t('bankAccount.accountName')} *</Text>
        <TextInput
          style={styles.input}
          value={accountName}
          onChangeText={setAccountName}
          placeholder={t('bankAccount.accountNamePlaceholder')}
          placeholderTextColor={Colors.grayText}
        />

        {/* Account Number */}
        <Text style={styles.label}>{t('bankAccount.accountNumber')} *</Text>
        <TextInput
          style={styles.input}
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder={t('bankAccount.accountNumberPlaceholder')}
          placeholderTextColor={Colors.grayText}
          keyboardType="number-pad"
        />

        {/* Account Type Picker */}
        <Text style={styles.label}>{t('bankAccount.accountType')} *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => { setShowTypePicker(!showTypePicker); setShowBankPicker(false); }}
        >
          <Text style={styles.pickerText}>
            {accountTypes.find((a) => a.value === accountType)?.label ?? accountType}
          </Text>
          <Ionicons name={showTypePicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.grayText} />
        </TouchableOpacity>
        {showTypePicker && (
          <View style={styles.dropdownList}>
            {accountTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.dropdownItem, accountType === type.value && styles.dropdownItemSelected]}
                onPress={() => { setAccountType(type.value); setShowTypePicker(false); }}
              >
                <Text style={[styles.dropdownItemText, accountType === type.value && styles.dropdownItemTextSelected]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Primary Toggle */}
        <View style={styles.primaryRow}>
          <Text style={styles.primaryLabel}>{t('bankAccount.isPrimary')}</Text>
          <Switch
            value={isPrimary}
            onValueChange={setIsPrimary}
            trackColor={{ false: Colors.grayBorder, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        {/* Error */}
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>{t('bankAccount.submit')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.sm,
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
  pickerText: { fontSize: FontSize.sm, color: Colors.black },
  placeholderText: { color: Colors.grayText },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: Colors.white,
    maxHeight: 200,
  },
  dropdownCenter: { paddingVertical: 16, alignItems: 'center' },
  dropdownCenterText: { fontSize: FontSize.sm, color: Colors.grayText, marginTop: 8 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemSelected: { backgroundColor: Colors.gray },
  dropdownItemText: { fontSize: FontSize.sm, color: Colors.black },
  dropdownItemTextSelected: { color: Colors.primary, fontWeight: '600' },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 4,
  },
  primaryLabel: {
    fontSize: FontSize.md,
    color: Colors.black,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
