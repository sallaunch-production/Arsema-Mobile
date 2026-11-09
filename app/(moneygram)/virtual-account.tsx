import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL, TRANSFER_VA_CREATE_URL, AUTH_KEY, AUTH_SECRET } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';
import { useFormatCurrency } from '../../utils/format-currency';
import { ActivityIndicator } from 'react-native';

const TIMER_SECONDS = 545; // 08:45

export default function VirtualAccountScreen() {
  const { t } = useLanguage();
  const { formatCurrency } = useFormatCurrency();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { token, user } = useAuth();

  const [vaNumber, setVaNumber] = useState<string>('');
  const [isLoadingVA, setIsLoadingVA] = useState(true);
  const [vaError, setVaError] = useState<string>('');

  const mgTransactionId = params.transactionId || '';

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

  const totalCollect = quoteData?.sendAmount?.total?.value || params.amount || 0;
  const sendCurrency = quoteData?.sendAmount?.total?.currencyCode || quoteData?.sendAmount?.amount?.currencyCode || 'IDR';

  const fetchVA = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    setIsLoadingVA(true);
    setVaError('');
    try {
      const totalAmount = quoteData?.sendAmount?.total?.value || params.amount || 0;
      const fullName = user?.name || 'Sender';

      console.log('=== CREATE VA REQUEST ===');
      console.log('URL:', TRANSFER_VA_CREATE_URL);
      console.log('Params:', { fullName, totalAmount: Number(totalAmount) });
      console.log('quoteData:', quoteData ? 'present' : 'null');
      console.log('params.amount:', params.amount);

      if (!totalAmount || Number(totalAmount) <= 0) {
        throw new Error('Total amount is invalid: ' + totalAmount);
      }

      const authHeader = 'Basic ' + btoa(AUTH_KEY + ':' + AUTH_SECRET);

      const response = await fetch(TRANSFER_VA_CREATE_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          full_name: fullName,
          total_amount: Number(totalAmount),
        }),
      });

      const text = await response.text();
      console.log('VA Create Response status:', response.status);
      console.log('VA Create Response body:', text);

      if (!response.ok) {
        throw new Error(`VA API error (${response.status}): ${text.substring(0, 200)}`);
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('VA API returned non-JSON response: ' + text.substring(0, 200));
      }

      if (data.virtualAccountNo) {
        setVaNumber(data.virtualAccountNo);
      } else {
        throw new Error('No virtualAccountNo in response: ' + JSON.stringify(data).substring(0, 200));
      }
    } catch (error: any) {
      console.error('Error fetching VA:', error);
      const msg = error.name === 'AbortError'
        ? t('mg.virtualAccount.timeoutError')
        : (error.message || 'Failed to create virtual account');
      setVaError(msg);
    } finally {
      clearTimeout(timeoutId);
      setIsLoadingVA(false);
    }
  };

  useEffect(() => {
    fetchVA();
  }, [user, quoteData, params.amount]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const handleCopy = async () => {
    if (vaNumber) {
      await Clipboard.setStringAsync(vaNumber);
      Alert.alert(t('mg.virtualAccount.copiedTitle'), t('mg.virtualAccount.copiedMessage'), [{ text: 'OK' }]);
    }
  };

  const handleGoHome = () => {
    router.replace('/(tabs)' as any);
  };

  // Polls the VA payment status, and if paid (UNFUNDED), commits the transaction
  // to the MoneyGram network. Handles edge case where transaction was already
  // committed by fetching reference number from completed-transactions fallback.
  const handleCheckStatus = async () => {
    if (!mgTransactionId) {
      Alert.alert('Error', 'Transaction ID not found');
      return;
    }

    setIsCheckingStatus(true);
    try {
      const url = `${API_BASE_URL}/v1/moneygram/transactions/${mgTransactionId}/check-va-status`;
      console.log('Check VA Status URL:', url);
      console.log('Transaction ID:', mgTransactionId);
      const response = await fetch(url,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            virtual_account: vaNumber,
          }),
        },
      );

      const text = await response.text();
      console.log('Check VA Status Response:', text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error('Server returned unexpected response. Status: ' + response.status);
      }

      const isPaid = data.data?.is_paid === true;

      if (isPaid) {
        // Commit transaction
        console.log('Payment confirmed. Committing transaction...');
        const commitUrl = `${API_BASE_URL}/v1/moneygram/transactions/${mgTransactionId}/commit`;
        const commitResponse = await fetch(commitUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Proxy-Token': params.proxyToken || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fundingSource: {
              tenderType: 'CASH',
            },
          }),
        });

        const commitText = await commitResponse.text();
        console.log('Commit Response:', commitText);

        let commitData: any;
        try {
          commitData = JSON.parse(commitText);
        } catch {
          throw new Error('Invalid commit response');
        }

        // Handle already committed transaction
        const alreadyCommitted = commitData?.message?.toLowerCase().includes('already been committed')
          || commitData?.error?.message?.toLowerCase().includes('already been committed');

        if (!commitResponse.ok && !alreadyCommitted && commitData?.success === false) {
          throw new Error(commitData?.error?.message || commitData?.message || 'Failed to commit transaction');
        }

        let result = commitData?.data || commitData;

        // If already committed or no referenceNumber in commit response, fetch transaction detail
        const refNum = result?.referenceNumber || result?.reference_number || '';
        if (!refNum || alreadyCommitted) {
          console.log('Fetching transaction detail for reference number...');
          try {
            const detailRes = await fetch(
              `${API_BASE_URL}/v1/moneygram/completed-transactions/mg/${mgTransactionId}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const detailText = await detailRes.text();
            console.log('Transaction Detail Response:', detailText);
            const detailData = JSON.parse(detailText);
            if (detailData?.data) {
              result = { ...result, ...detailData.data };
            }
          } catch (e) {
            console.error('Failed to fetch transaction detail:', e);
          }
        }

        console.log('Final result for success page:', JSON.stringify(result));

        router.replace({
          pathname: '/(moneygram)/transaction-success',
          params: {
            ...params,
            referenceNumber: result.referenceNumber || result.reference_number || result.mg_reference_number || '',
            expectedPayoutDate: result.expectedPayoutDate || result.expected_payout_date || '',
            transactionStatus: result.status || (alreadyCommitted ? 'COMMITTED' : 'AVAILABLE'),
            commitResult: JSON.stringify(result),
          },
        });
      } else {
        Alert.alert(
          t('mg.virtualAccount.errorTitle'),
          t('mg.virtualAccount.paymentPendingError'),
        );
      }
    } catch (error: any) {
      console.error('Check VA Status Error:', error);
      Alert.alert('Error', error.message || 'Failed to check payment status.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <ScreenLayout title={t('mg.virtualAccount.title')} showBackButton={false}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        {/* Payment in progress icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.statusText}>{t('mg.virtualAccount.paymentInProgress')}</Text>
        </View>

        {/* VA Number */}
        <Text style={styles.vaLabel}>{t('mg.virtualAccount.vaLabel')}</Text>
        <Text style={styles.generatedBy}>

        </Text>

        <View style={styles.vaContainer}>
          {isLoadingVA ? (
            <ActivityIndicator color={Colors.primary} />
          ) : vaError ? (
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: Colors.error, fontSize: 13, marginBottom: 8, textAlign: 'center' }}>{vaError}</Text>
              <TouchableOpacity onPress={fetchVA} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
                <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 13 }}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.vaNumber}>{vaNumber}</Text>
              <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                <Ionicons name="copy-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Total Amount */}
        <Text style={styles.totalLabel}>{t('mg.virtualAccount.totalLabel')}</Text>
        <Text style={styles.totalAmount}>
          {sendCurrency} {formatCurrency(Number(totalCollect), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{t('mg.virtualAccount.infoTitle')}</Text>
          <Text style={styles.infoText}>
            {t('mg.virtualAccount.infoText')}
          </Text>
        </View>

        {/* Timer */}
        <Text style={styles.timerLabel}>
          {t('mg.virtualAccount.timerLabel')}
        </Text>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{minutes} : {seconds}</Text>
        </View>


        <TouchableOpacity
          style={[styles.checkStatusButton, isCheckingStatus && styles.checkStatusButtonDisabled]}
          onPress={handleCheckStatus}
          disabled={isCheckingStatus}
        >
          {isCheckingStatus ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.checkStatusText}>{t('mg.virtualAccount.checkButton')}</Text>
          )}
        </TouchableOpacity>

        {/* How to Pay */}
        <View style={styles.howToPayCard}>
          <Text style={styles.howToPayTitle}>{t('mg.virtualAccount.howToPayTitle')}</Text>
          <Text style={styles.howToPaySubtitle}>
            {t('mg.virtualAccount.howToPaySubtitle')}
          </Text>
          <View style={styles.stepsList}>
            <Text style={styles.stepText}>{t('mg.virtualAccount.step1')}</Text>
            <Text style={styles.stepText}>{t('mg.virtualAccount.step2')}</Text>
            <Text style={styles.stepText}>{t('mg.virtualAccount.step3')}</Text>
            <Text style={styles.stepText}>{t('mg.virtualAccount.step4')}</Text>
            <Text style={styles.stepText}>{t('mg.virtualAccount.step5')}</Text>
            <Text style={styles.stepText}>{t('mg.virtualAccount.step6')}</Text>
            <Text style={styles.stepText}>{t('mg.virtualAccount.step7')}</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  vaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  generatedBy: {
    fontSize: 11,
    color: Colors.grayText,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.grayText,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 16,
  },
  vaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vaNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  copyButton: {
    padding: 4,
  },
  infoBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.grayText,
    lineHeight: 18,
  },
  timerLabel: {
    fontSize: 12,
    color: Colors.grayText,
    textAlign: 'center',
    marginBottom: 8,
  },
  timerContainer: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  goHomeButton: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 25,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  goHomeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
  },
  checkStatusButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkStatusButtonDisabled: {
    opacity: 0.6,
  },
  checkStatusText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  howToPayCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  howToPayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  howToPaySubtitle: {
    fontSize: 12,
    color: Colors.grayText,
    marginBottom: 12,
  },
  stepsList: {
    gap: 6,
  },
  stepText: {
    fontSize: 12,
    color: Colors.black,
    lineHeight: 18,
  },
});
