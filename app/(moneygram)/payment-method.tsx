import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL, BASIC_AUTH } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';

interface PaymentOption {
  id: string;
  title: string;
  description: string;
  isAvailable?: boolean;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'virtual_account',
    title: 'Virtual Account',
    description: 'Transfer with Permata Virtual Account',
    isAvailable: true,
  },
  {
    id: 'qris',
    title: 'QRIS',
    description: 'Transfer with Dynamic QRIS from Permata',
    isAvailable: false, // Temporarily disabled
  },
];

export default function PaymentMethodScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { token, user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/v1/customers/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.data) {
          setProfile(data.data);
        }
      } catch (error) {
        console.error('Fetch profile error:', error);
      }
    };
    fetchProfile();
  }, [token]);

  const quoteData = useMemo(() => {
    if (!params.quoteResult) return null;
    try {
      const data = JSON.parse(params.quoteResult);
      const transactions = data.transactions || (Array.isArray(data) ? data : [data]);
      return transactions.find((t: any) => t.transactionId === params.transactionId) || transactions[0];
    } catch {
      return null;
    }
  }, [params.quoteResult, params.transactionId]);

  const handleNext = async () => {
    if (!selectedMethod) return;

    setIsLoading(true);
    try {
      const sendAmountValue = quoteData?.sendAmount?.amount?.value ?? params.amount ?? 0;
      const sendCurrency = quoteData?.sendAmount?.amount?.currencyCode ?? 'IDR';
      const receiveCurrency = quoteData?.receiveAmount?.amount?.currencyCode ?? 'USD';
      const serviceOptionCode = quoteData?.serviceOptionCode || quoteData?.serviceOption || 'WILL_CALL';
      const serviceOptionRoutingCode = quoteData?.serviceOptionRoutingCode || quoteData?.serviceOptionRouting || '';
      const nameParts = (user?.name || '').split(' ');
      const senderFirstName = nameParts[0] || '';
      const senderLastName = nameParts.slice(1).join(' ') || senderFirstName;

      const getPurposeCode = (p: string) => {
        const map: Record<string, string> = {
          'FAMILY SUPPORT': 'FAMILY_SUPPORT',
          'MEDICAL EXPENSES': 'MEDICAL',
          'OTHER': 'OTHER',
        };
        return map[p] || p;
      };

      const getSourceCode = (s: string) => {
        const map: Record<string, string> = {
          'SALARY': 'SALARY_EMPLOY',
          'BUSINESS INCOME': 'BUSINESS_INCOME',
          'OTHER': 'OTHER',
        };
        return map[s] || s;
      };

      const getRelationshipCode = (r: string) => {
        const map: Record<string, string> = {
          'BUSINESS PARTNER': 'BUSINESS_PARTNER',
          'OTHER': 'OTHER',
        };
        return map[r] || r;
      };

      // Build the update-transaction request body.
      // Merges static fields (sender/receiver from profile + form) with dynamic
      // fields (targetAccount from account-deposit-fields API, receiver extras).
      const body: any = {
        destinationCountryCode: (params.destinationIso3Code && params.destinationIso3Code.length === 3)
          ? params.destinationIso3Code
          : (params.destinationCountry && params.destinationCountry.length === 3)
            ? params.destinationCountry
            : params.destinationIso3Code || params.destinationCountry || '',
        serviceOptionCode,
        sendAmount: {
          value: Number(sendAmountValue),
          currencyCode: sendCurrency,
        },
        receiveCurrencyCode: receiveCurrency,
        sender: {
          name: {
            firstName: profile?.first_name || senderFirstName,
            lastName: profile?.last_name || senderLastName,
          },
          address: {
            line1: profile?.address || '',
            city: profile?.city || '',
            countryCode: profile?.country || '',
            countrySubdivisionCode: profile?.state || '',
            postalCode: profile?.postal_code || '',
          },
          mobilePhone: {
            number: user?.phone || profile?.phone || '',
            countryDialCode: '62',
          },
          personalDetails: {
            dateOfBirth: profile?.date_of_birth || '',
            citizenshipCountryCode: profile?.nationality || '',
            birthCity: profile?.city || '',
            birthCountryCode: profile?.birth_country_code || '',
            subdivisionCode: profile?.birth_state || '',
            genderCode: profile?.gender?.toUpperCase().replace(' ', '_') || '',
            occupationCode: profile?.occupation?.toUpperCase().replace(' ', '_') || '',
            nationalityCountryCode: profile?.nationality || '',
          },
          primaryIdentification: {
            typeCode: profile?.identity_type || '',
            id: profile?.identity_number || '',
            issueCountryCode: profile?.nationality || '',
            issueCountrySubdivisionCode: profile?.nationality_state || '',
          },
        },
        receiver: {
          name: {
            firstName: params.beneficiaryFirstName || '',
            middleName: params.beneficiaryMiddleName || '',
            lastName: params.beneficiaryLastName1 || '',
          },
          mobilePhone: {
            number: params.beneficiaryPhone || '',
            countryDialCode: '62',
          },
        },
        transactionInformation: {
          purposeOfTransactionCode: getPurposeCode(params.purpose),
          sourceOfFundsCode: getSourceCode(params.sourceOfFunds),
          relationshipToReceiver: getRelationshipCode(params.relationship),
        },
      };

      if (serviceOptionRoutingCode) {
        body.serviceOptionRoutingCode = serviceOptionRoutingCode;
      }

      if (params.targetAccount) {
        try {
          const parsed = JSON.parse(params.targetAccount);
          if (Array.isArray(parsed)) {
            body.targetAccount = parsed;
          } else {
            const entries = Object.entries(parsed).filter(([, v]) => v !== undefined && v !== null && v !== '');
            if (entries.length > 0) {
              body.targetAccount = entries.map(([key, value]) => ({ key, value }));
            }
          }
        } catch (e) {
          console.error('Failed to parse targetAccount:', e);
        }
      }

      // Merge dynamic receiver fields into receiver object
      if (params.receiverFields) {
        try {
          const receiverExtras = JSON.parse(params.receiverFields);
          for (const [key, value] of Object.entries(receiverExtras)) {
            if (!value) continue;
            // key format: "receiver.address.city" -> set body.receiver.address.city
            const parts = key.replace('receiver.', '').split('.');
            let target: any = body.receiver;
            for (let i = 0; i < parts.length - 1; i++) {
              if (!target[parts[i]]) target[parts[i]] = {};
              target = target[parts[i]];
            }
            target[parts[parts.length - 1]] = value;
          }
        } catch (e) {
          console.error('Failed to parse receiverFields:', e);
        }
      }

      const mgTransactionId = params.transactionId || quoteData?.transactionId || '';
      const requestUrl = `${API_BASE_URL}/v1/moneygram/transactions/${mgTransactionId}/update`;

      console.log('=== UPDATE TRANSACTION REQUEST ===');
      console.log('URL:', requestUrl);
      console.log('Body:', JSON.stringify(body));

      const response = await fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Proxy-Token': params.proxyToken || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();
      console.log('=== UPDATE TRANSACTION RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Body:', text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || 'Failed to create transaction');
      }

      router.push({
        pathname: '/(moneygram)/review-pin',
        params: {
          ...params,
          paymentMethod: selectedMethod,
          transactionResult: JSON.stringify(data?.data || data),
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenLayout title={t('mg.paymentMethod.title')}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = selectedMethod === option.id;
          const isAvailable = option.isAvailable !== false;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                !isAvailable && styles.optionCardDisabled
              ]}
              activeOpacity={isAvailable ? 0.7 : 1}
              onPress={() => isAvailable && setSelectedMethod(option.id)}
              disabled={!isAvailable}
            >
              <View style={[styles.radio, isSelected && styles.radioSelected, !isAvailable && styles.radioDisabled]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                  {option.id === 'virtual_account' ? t('mg.paymentMethod.vaTitle') : t('mg.paymentMethod.qrisTitle')}
                </Text>
                <Text style={styles.optionDesc}>
                  {option.id === 'virtual_account' ? t('mg.paymentMethod.vaDesc') : t('mg.paymentMethod.qrisDesc')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, (!selectedMethod || isLoading) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedMethod || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.nextButtonText}>{t('mg.paymentMethod.nextButton')}</Text>
          )}
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
    paddingBottom: 40,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  optionCardDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.gray,
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
  radioDisabled: {
    borderColor: Colors.grayBorder,
    backgroundColor: Colors.gray,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: Colors.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.grayText,
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
