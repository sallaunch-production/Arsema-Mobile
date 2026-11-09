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
        body: JSON.stringify({
          bank_name: account.bank_name,
          bank_code: account.bank_code,
          account_name: account.account_name,
          account_number: account.account_number,
          account_type: account.account_type,
          is_primary: true,
        }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      // Enforce single primary locally — do NOT re-fetch (backend may not clear others)
      setAccounts(prev => prev.map(a => ({ ...a, is_primary: a.id === account.id })));
    } catch {
      Alert.alert(t('common.error'), t('bankAccount.errorSave'));
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
              Alert.alert(t('common.error'), t('bankAccount.errorDelete'));
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

  const formatAccountNumber = (num: string) => {
    const last4 = num.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  return (
    <ScreenLayout title={t('bankAccount.title')}>
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={56} color={Colors.grayText} />
            <Text style={styles.emptyTitle}>{t('bankAccount.empty')}</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.addButtonText}>{t('bankAccount.addBtn')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {accounts.map((account) => (
              <View key={account.id} style={[styles.card, account.is_primary && styles.cardPrimary]}>
                {/* Card Header Strip */}
                <View style={[styles.cardStrip, account.is_primary && styles.cardStripPrimary]}>
                  <View style={styles.cardStripLeft}>
                    <Ionicons
                      name="business"
                      size={16}
                      color={account.is_primary ? Colors.white : Colors.grayText}
                    />
                    <Text style={[styles.bankName, account.is_primary && styles.bankNamePrimary]}>
                      {account.bank_name}
                    </Text>
                  </View>
                  <View style={styles.cardStripRight}>
                    {account.is_primary && (
                      <View style={styles.primaryBadge}>
                        <Ionicons name="star" size={10} color={Colors.primary} />
                        <Text style={styles.primaryBadgeText}>{t('bankAccount.primaryBadge')}</Text>
                      </View>
                    )}
                    <Text style={[styles.accountType, account.is_primary && styles.accountTypePrimary]}>
                      {account.account_type}
                    </Text>
                  </View>
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <Text style={styles.accountNumber}>{formatAccountNumber(account.account_number)}</Text>
                  <Text style={styles.accountName}>{account.account_name}</Text>
                </View>

                {/* Card Actions */}
                <View style={styles.cardActions}>
                  {!account.is_primary && (
                    <TouchableOpacity
                      style={styles.actionBtnOutline}
                      onPress={() => handleSetPrimary(account)}
                      disabled={actionLoadingId === account.id}
                    >
                      {actionLoadingId === account.id ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <>
                          <Ionicons name="star-outline" size={13} color={Colors.primary} />
                          <Text style={styles.actionBtnOutlineText}>{t('bankAccount.setPrimary')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <View style={styles.actionBtnGroup}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleEdit(account)}
                      disabled={actionLoadingId === account.id}
                    >
                      <Ionicons name="pencil-outline" size={16} color={Colors.black} />
                      <Text style={styles.actionIconBtnText}>{t('bankAccount.edit')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleDelete(account)}
                      disabled={actionLoadingId === account.id}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                      <Text style={styles.actionIconBtnTextDelete}>{t('bankAccount.delete')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <Ionicons name="add" size={18} color={Colors.white} />
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
    gap: 16,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    color: Colors.grayText,
    textAlign: 'center',
  },

  // Card
  card: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPrimary: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },

  // Strip
  cardStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardStripPrimary: {
    backgroundColor: Colors.primary,
  },
  cardStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardStripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.black,
  },
  bankNamePrimary: {
    color: Colors.white,
  },
  accountType: {
    fontSize: FontSize.xs,
    color: Colors.grayText,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  accountTypePrimary: {
    color: 'rgba(255,255,255,0.8)',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  primaryBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Body
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  accountNumber: {
    fontSize: FontSize.md,
    color: Colors.black,
    fontWeight: '600',
    letterSpacing: 2,
  },
  accountName: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
  },

  // Actions
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionBtnOutlineText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 'auto',
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionIconBtnText: {
    fontSize: FontSize.xs,
    color: Colors.black,
  },
  actionIconBtnTextDelete: {
    fontSize: FontSize.xs,
    color: Colors.error,
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
