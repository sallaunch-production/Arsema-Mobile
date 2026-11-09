# Bank Account Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to manage multiple bank accounts from profile settings (list, add, edit, delete, set primary).

**Architecture:** Two new screens in `app/(profile)/` — a list screen and a shared add/edit form — following the existing profile screen pattern (ScreenLayout + useState + plain fetch). All strings go through `useLanguage()` / `t()` for EN/ID i18n. No new context needed.

**Tech Stack:** React Native 0.83, Expo SDK 55, TypeScript, expo-router, `useAuth()` for Bearer token, `useLanguage()` for i18n.

---

### Task 1: Add Translation Keys

**Files:**
- Modify: `constants/translations.ts`

- [ ] **Step 1: Insert EN translation keys**

In `constants/translations.ts`, after line 144 (`'profile.menu.logout': 'Logout',`), insert:

```typescript
    'profile.menu.bankAccounts': 'Bank Accounts',

    // ── Bank Account Management ────────────────────────────
    'bankAccount.title': 'Bank Accounts',
    'bankAccount.addTitle': 'Add Bank Account',
    'bankAccount.editTitle': 'Edit Bank Account',
    'bankAccount.empty': 'No bank accounts added yet',
    'bankAccount.addBtn': 'Add Account',
    'bankAccount.bank': 'Bank',
    'bankAccount.bankPlaceholder': 'Select a bank',
    'bankAccount.accountName': 'Account Holder Name',
    'bankAccount.accountNamePlaceholder': 'Enter full name',
    'bankAccount.accountNumber': 'Account Number',
    'bankAccount.accountNumberPlaceholder': 'Enter account number',
    'bankAccount.accountType': 'Account Type',
    'bankAccount.isPrimary': 'Set as Primary',
    'bankAccount.primaryBadge': 'Primary',
    'bankAccount.setPrimary': 'Set as Primary',
    'bankAccount.edit': 'Edit',
    'bankAccount.delete': 'Delete',
    'bankAccount.deleteConfirmTitle': 'Delete Account',
    'bankAccount.deleteConfirmMessage': 'Are you sure you want to delete this bank account?',
    'bankAccount.deleteConfirmOk': 'Delete',
    'bankAccount.deleteConfirmCancel': 'Cancel',
    'bankAccount.savingsType': 'Savings',
    'bankAccount.checkingType': 'Checking',
    'bankAccount.submit': 'Save',
    'bankAccount.errorLoad': 'Failed to load bank accounts',
    'bankAccount.errorSave': 'Failed to save bank account',
    'bankAccount.errorDelete': 'Failed to delete bank account',
    'bankAccount.loadingBanks': 'Loading banks...',
    'bankAccount.noBanks': 'No banks available',
    'bankAccount.maskedNumber': '••••',
```

- [ ] **Step 2: Insert ID translation keys**

In `constants/translations.ts`, after line ~565 (`'profile.menu.logout': 'Keluar',` in the `id:` section), insert:

```typescript
    'profile.menu.bankAccounts': 'Rekening Bank',

    // ── Bank Account Management ────────────────────────────
    'bankAccount.title': 'Rekening Bank',
    'bankAccount.addTitle': 'Tambah Rekening Bank',
    'bankAccount.editTitle': 'Edit Rekening Bank',
    'bankAccount.empty': 'Belum ada rekening bank',
    'bankAccount.addBtn': 'Tambah Rekening',
    'bankAccount.bank': 'Bank',
    'bankAccount.bankPlaceholder': 'Pilih bank',
    'bankAccount.accountName': 'Nama Pemilik Rekening',
    'bankAccount.accountNamePlaceholder': 'Masukkan nama lengkap',
    'bankAccount.accountNumber': 'Nomor Rekening',
    'bankAccount.accountNumberPlaceholder': 'Masukkan nomor rekening',
    'bankAccount.accountType': 'Jenis Rekening',
    'bankAccount.isPrimary': 'Jadikan Utama',
    'bankAccount.primaryBadge': 'Utama',
    'bankAccount.setPrimary': 'Jadikan Utama',
    'bankAccount.edit': 'Edit',
    'bankAccount.delete': 'Hapus',
    'bankAccount.deleteConfirmTitle': 'Hapus Rekening',
    'bankAccount.deleteConfirmMessage': 'Yakin ingin menghapus rekening bank ini?',
    'bankAccount.deleteConfirmOk': 'Hapus',
    'bankAccount.deleteConfirmCancel': 'Batal',
    'bankAccount.savingsType': 'Tabungan',
    'bankAccount.checkingType': 'Giro',
    'bankAccount.submit': 'Simpan',
    'bankAccount.errorLoad': 'Gagal memuat rekening bank',
    'bankAccount.errorSave': 'Gagal menyimpan rekening bank',
    'bankAccount.errorDelete': 'Gagal menghapus rekening bank',
    'bankAccount.loadingBanks': 'Memuat bank...',
    'bankAccount.noBanks': 'Tidak ada bank tersedia',
    'bankAccount.maskedNumber': '••••',
```

- [ ] **Step 3: Type-check**

```bash
rtk npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
rtk git add constants/translations.ts
rtk git commit -m "feat: add bank account management translation keys"
```

---

### Task 2: Add Profile Menu Item

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Add menu item**

In `app/(tabs)/profile.tsx`, find the `menuItems` array and add `bank-accounts` after the `personal` item:

```typescript
  const menuItems: MenuItem[] = [
    { id: 'personal', icon: 'person-outline', label: t('profile.menu.personal') },
    { id: 'bank-accounts', icon: 'wallet-outline', label: t('profile.menu.bankAccounts') },
    { id: 'security', icon: 'shield-outline', label: t('profile.menu.security') },
    { id: 'notifications', icon: 'notifications-outline', label: t('profile.menu.notifications') },
    { id: 'language', icon: 'language-outline', label: t('profile.menu.language') },
    { id: 'about', icon: 'information-circle-outline', label: t('profile.menu.about') },
    { id: 'delete-account', icon: 'trash-outline', label: t('profile.menu.deleteAccount'), isDestructive: true },
    { id: 'logout', icon: 'log-out-outline', label: t('profile.menu.logout'), isLogout: true },
  ];
```

- [ ] **Step 2: Add navigation case**

In the same file, inside the `onPress` handler, add a branch for `bank-accounts` before the `isLogout` check:

```typescript
                } else if (item.id === 'bank-accounts') {
                  router.push('/(profile)/bank-accounts' as any);
                } else if (item.isLogout) {
```

- [ ] **Step 3: Type-check**

```bash
rtk npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
rtk git add app/\(tabs\)/profile.tsx
rtk git commit -m "feat: add bank accounts menu item to profile"
```

---

### Task 3: Create Bank Accounts List Screen

**Files:**
- Create: `app/(profile)/bank-accounts.tsx`

- [ ] **Step 1: Create the file**

Create `app/(profile)/bank-accounts.tsx` with this complete content:

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { API_BASE_URL } from '../../constants/api';

interface BankAccount {
  id: string;
  bank_name: string;
  bank_code: string;
  account_name: string;
  account_number: string;
  account_type: string;
  is_primary: boolean;
}

export default function BankAccountsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/v1/bank-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      const data = JSON.parse(text);
      setAccounts(Array.isArray(data.data) ? data.data : []);
    } catch {
      setErrorMsg(t('bankAccount.errorLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

  // Refresh list every time screen comes into focus (e.g. after add/edit)
  useFocusEffect(
    useCallback(() => {
      fetchAccounts();
    }, [fetchAccounts])
  );

  const handleSetPrimary = async (account: BankAccount) => {
    if (!token) return;
    setActionLoadingId(account.id);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/bank-accounts/${account.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...account, is_primary: true }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      await fetchAccounts();
    } catch {
      Alert.alert('Error', t('bankAccount.errorSave'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (account: BankAccount) => {
    Alert.alert(
      t('bankAccount.deleteConfirmTitle'),
      t('bankAccount.deleteConfirmMessage'),
      [
        { text: t('bankAccount.deleteConfirmCancel'), style: 'cancel' },
        {
          text: t('bankAccount.deleteConfirmOk'),
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setActionLoadingId(account.id);
            try {
              const response = await fetch(`${API_BASE_URL}/v1/bank-accounts/${account.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              const text = await response.text();
              if (!response.ok) throw new Error(text);
              await fetchAccounts();
            } catch {
              Alert.alert('Error', t('bankAccount.errorDelete'));
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (account: BankAccount) => {
    router.push({
      pathname: '/(profile)/bank-account-form' as any,
      params: {
        id: account.id,
        bank_name: account.bank_name,
        bank_code: account.bank_code,
        account_name: account.account_name,
        account_number: account.account_number,
        account_type: account.account_type,
        is_primary: account.is_primary ? 'true' : 'false',
      },
    });
  };

  const handleAdd = () => {
    router.push('/(profile)/bank-account-form' as any);
  };

  const maskAccountNumber = (num: string) =>
    `${t('bankAccount.maskedNumber')} ${num.slice(-4)}`;

  return (
    <ScreenLayout title={t('bankAccount.title')}>
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={Colors.grayText} />
            <Text style={styles.emptyText}>{t('bankAccount.empty')}</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <Text style={styles.addButtonText}>{t('bankAccount.addBtn')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {accounts.map((account) => (
              <View key={account.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.bankName}>{account.bank_name}</Text>
                    {account.is_primary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>{t('bankAccount.primaryBadge')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.accountType}>{account.account_type}</Text>
                </View>
                <Text style={styles.accountNumber}>{maskAccountNumber(account.account_number)}</Text>
                <Text style={styles.accountName}>{account.account_name}</Text>
                <View style={styles.cardActions}>
                  {!account.is_primary && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleSetPrimary(account)}
                      disabled={actionLoadingId === account.id}
                    >
                      {actionLoadingId === account.id ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <Text style={styles.actionBtnPrimary}>{t('bankAccount.setPrimary')}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleEdit(account)}
                    disabled={actionLoadingId === account.id}
                  >
                    <Text style={styles.actionBtnText}>{t('bankAccount.edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(account)}
                    disabled={actionLoadingId === account.id}
                  >
                    <Text style={styles.actionBtnDelete}>{t('bankAccount.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <Ionicons name="add" size={18} color={Colors.white} style={{ marginRight: 6 }} />
              <Text style={styles.addButtonText}>{t('bankAccount.addBtn')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: Colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.black,
  },
  primaryBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  accountType: {
    fontSize: FontSize.xs,
    color: Colors.grayText,
    textTransform: 'capitalize',
  },
  accountNumber: {
    fontSize: FontSize.sm,
    color: Colors.black,
    fontWeight: '500',
    marginBottom: 4,
  },
  accountName: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
    paddingTop: 10,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    color: Colors.black,
  },
  actionBtnPrimary: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionBtnDelete: {
    fontSize: FontSize.sm,
    color: Colors.error,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Type-check**

```bash
rtk npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add app/\(profile\)/bank-accounts.tsx
rtk git commit -m "feat: add bank accounts list screen"
```

---

### Task 4: Create Bank Account Add/Edit Form Screen

**Files:**
- Create: `app/(profile)/bank-account-form.tsx`

- [ ] **Step 1: Create the file**

Create `app/(profile)/bank-account-form.tsx` with this complete content:

```typescript
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
    overflow: 'hidden',
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
```

- [ ] **Step 2: Type-check**

```bash
rtk npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add app/\(profile\)/bank-account-form.tsx
rtk git commit -m "feat: add bank account add/edit form screen"
```
