import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';
import { useFormatCurrency } from '../../utils/format-currency';

interface ServiceOption {
  id: string;
  title: string;
  estimatedDelivery: string;
  sendAmount: string;
  receiveAmount: string;
  fee: string;
  totalCollect: string;
  exchangeRate: string;
  fxRateEstimated: boolean;
  receiveAmountValue: string;
  receiveFee: string;
  receiveTax: string;
  receiveTaxRaw: number;
  receiveTotal: string;
  additionalCharges: { label: string; value: string }[];
  discountRaw: number;
  discount: string;
}

export default function ServiceOptionsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { user, token } = useAuth();
  const { formatCurrency: fmtPlain, formatCurrencyWithCode } = useFormatCurrency();
  const formatCurrency = formatCurrencyWithCode;

  const isPremium = user?.level === 'premium';
  const amount = params.amount || '0';
  const destinationCountry = params.destinationCountryName || params.destinationCountry || '';
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [kycStatus, setKycStatus] = useState<string | null>(null);

  React.useEffect(() => {
    async function fetchKycStatus() {
      if (isPremium || !token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/v1/kyc/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setKycStatus(data?.data?.status || null);
        }
      } catch (error) {
        console.error('Failed to fetch KYC status:', error);
      }
    }
    fetchKycStatus();
  }, [isPremium, token]);

  const quoteData = useMemo(() => {
    if (!params.quoteResult) return null;
    // ... (omitting unchanged map code for brevity, handling replace below)
    try {
      return JSON.parse(params.quoteResult);
    } catch {
      return null;
    }
  }, [params.quoteResult]);

  // Transform raw quote API response into display-ready service option cards.
  // Each transaction in the quote represents a different delivery method (e.g. cash pickup,
  // bank deposit) with its own fees, exchange rate, and estimated delivery time.
  const serviceOptions: ServiceOption[] = useMemo(() => {
    if (!quoteData) return [];

    const transactions = quoteData.transactions || (Array.isArray(quoteData) ? quoteData : [quoteData]);

    return transactions.map((tx: any, index: number) => {
      const sendAmount = tx.sendAmount?.amount?.value ?? tx.sendAmount?.value ?? 0;
      const sendCurrency = tx.sendAmount?.amount?.currencyCode ?? tx.sendAmount?.currencyCode ?? 'IDR';
      const sendFee = tx.sendAmount?.fees?.value ?? 0;
      const sendTax = tx.sendAmount?.taxes?.value ?? 0;
      const sendTotal = tx.sendAmount?.total?.value ?? (sendAmount + sendFee + sendTax);

      const receiveAmount = tx.receiveAmount?.amount?.value ?? tx.receiveAmount?.value ?? 0;
      const receiveCurrency = tx.receiveAmount?.amount?.currencyCode ?? tx.receiveAmount?.currencyCode ?? 'USD';
      const fxRate = tx.receiveAmount?.fxRate ?? tx.fxRate ?? 0;
      const fxRateEstimated = tx.receiveAmount?.fxRateEstimated === true;
      const receiveFee = tx.receiveAmount?.fees?.value ?? 0;
      const receiveTax = tx.receiveAmount?.taxes?.value ?? 0;
      const receiveTotal = tx.receiveAmount?.total?.value ?? (receiveAmount + receiveFee + receiveTax);

      const rawCharges = tx.additionalCharges
        || tx.sendAmount?.additionalCharges
        || tx.receiveAmount?.additionalCharges
        || [];
      const additionalCharges = (Array.isArray(rawCharges) ? rawCharges : []).map((charge: any) => ({
        label: charge.label || charge.typeCode || 'Additional Fee',
        value: formatCurrency(charge.value ?? 0, charge.currencyCode || receiveCurrency),
      }));

      const discountValue = tx.sendAmount?.discountsApplied?.totalDiscount?.value ?? 0;
      const discountCurrency = tx.sendAmount?.discountsApplied?.totalDiscount?.currencyCode ?? sendCurrency;

      // If additional charges exist, use receiveAmount.total as the displayed receive amount
      const displayReceiveAmount = additionalCharges.length > 0
        ? (tx.receiveAmount?.total?.value ?? receiveAmount)
        : receiveAmount;
      const displayReceiveCurrency = additionalCharges.length > 0
        ? (tx.receiveAmount?.total?.currencyCode ?? receiveCurrency)
        : receiveCurrency;

      const title = tx.serviceOptionName || tx.service_option_name || tx.name || `Service ${index + 1}`;
      const id = tx.transactionId || tx.serviceOptionCode || `service-${index}`;
      const estimatedDelivery = tx.estimatedDelivery || '';

      return {
        id,
        title,
        estimatedDelivery,
        sendAmount: formatCurrency(sendAmount, sendCurrency),
        receiveAmount: formatCurrency(receiveAmount, receiveCurrency),
        fee: formatCurrency(sendFee, sendCurrency),
        totalCollect: formatCurrency(sendTotal, sendCurrency),
        exchangeRate: fxRate ? `1 ${sendCurrency} = ${fxRate} ${receiveCurrency}` : '',
        fxRateEstimated,
        receiveAmountValue: formatCurrency(displayReceiveAmount, displayReceiveCurrency),
        receiveFee: formatCurrency(receiveFee, receiveCurrency),
        receiveTax: formatCurrency(receiveTax, receiveCurrency),
        receiveTaxRaw: receiveTax,
        receiveTotal: formatCurrency(receiveTotal, receiveCurrency),
        additionalCharges,
        discountRaw: discountValue,
        discount: formatCurrency(discountValue, discountCurrency),
      };
    });
  }, [quoteData]);

  const handleNext = () => {
    if (!selectedId) return;
    if (isPremium) {
      // Find selected transaction to get serviceOptionCode and receiveCurrency
      const transactions = quoteData?.transactions || (Array.isArray(quoteData) ? quoteData : [quoteData]);
      const selectedTx = transactions.find((tx: any) =>
        (tx.transactionId || tx.serviceOptionCode) === selectedId
      );
      const serviceOptionCode = selectedTx?.serviceOptionCode || selectedTx?.serviceOption || '';
      const serviceOptionRoutingCode = selectedTx?.serviceOptionRoutingCode || '';
      const serviceOptionName = selectedTx?.serviceOptionName || selectedTx?.service_option_name || '';
      const receiveCurrencyCode = selectedTx?.receiveAmount?.amount?.currencyCode || selectedTx?.receiveAmount?.currencyCode || '';

      router.push({
        pathname: '/(moneygram)/beneficiary-details',
        params: {
          ...params,
          transactionId: selectedId,
          serviceOptionCode,
          serviceOptionRoutingCode,
          serviceOptionName,
          receiveCurrencyCode,
          destinationCountry: params.destinationCountry,
          destinationCountryName: destinationCountry,
          amount,
          quoteResult: params.quoteResult || '',
        },
      });
    } else {
      router.push('/(kyc)/personal-details' as any);
    }
  };

  const renderServiceCard = (option: ServiceOption, index: number) => {
    const isSelected = selectedId === option.id;
    return (
      <TouchableOpacity
        key={option.id}
        activeOpacity={0.7}
        onPress={() => setSelectedId(option.id)}
        style={[
          styles.serviceCard,
          isSelected && styles.serviceCardHighlighted,
        ]}
      >
        <View style={styles.serviceTitleRow}>
          <Text style={[
            styles.serviceTitle,
            isSelected && styles.serviceTitleHighlighted,
          ]}>
            {option.title}
          </Text>
          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
            {isSelected && <View style={styles.radioCircleInner} />}
          </View>
        </View>

        {option.estimatedDelivery ? (
          <Text style={styles.estimatedDelivery}>{option.estimatedDelivery}</Text>
        ) : null}

        {option.exchangeRate ? (
          <Text style={styles.exchangeRate}>
            {option.exchangeRate}
            {option.fxRateEstimated ? ` (${t('mg.serviceOptions.estimatedExchangeRate')})` : ''}
          </Text>
        ) : null}

        <View style={styles.amountRow}>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>{t('mg.serviceOptions.sentAmount')}</Text>
            <Text style={styles.amountValue}>{option.sendAmount}</Text>
          </View>
          <Ionicons name="swap-horizontal" size={20} color={Colors.grayText} />
          <View style={[styles.amountCol, styles.amountColRight]}>
            <Text style={styles.amountLabel}>
              {option.fxRateEstimated ? t('mg.serviceOptions.estimatedPrefix') : ''}{t('mg.serviceOptions.receivedAmount')}
            </Text>
            <Text style={styles.amountValue}>{option.receiveAmountValue}</Text>
          </View>
        </View>

        {option.fxRateEstimated && (
          <View style={styles.estimatedBanner}>
            <Ionicons name="information-circle-outline" size={14} color="#FF9800" />
            <Text style={styles.estimatedBannerText}>
              {t('mg.serviceOptions.estimatedBanner')}
            </Text>
          </View>
        )}

        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>{t('mg.serviceOptions.fee')}</Text>
          <Text style={styles.feeValue}>{option.fee}</Text>
        </View>

        {option.discountRaw > 0 && (
          <View style={styles.feeRow}>
            <Text style={styles.discountLabel}>{t('mg.serviceOptions.discount')}</Text>
            <Text style={styles.discountValue}>- {option.discount}</Text>
          </View>
        )}

        {option.fxRateEstimated && Number(option.receiveFee.replace(/[^\d.,]/g, '').replace(',', '.')) > 0 && (
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>{t('mg.serviceOptions.estimatedFee')}</Text>
            <Text style={styles.feeValue}>{option.receiveFee}</Text>
          </View>
        )}

        {option.receiveTaxRaw > 0 && (
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>{option.fxRateEstimated ? t('mg.serviceOptions.estimatedTax') : t('mg.serviceOptions.receiveTax')}</Text>
            <Text style={styles.feeValue}>{option.receiveTax}</Text>
          </View>
        )}

        {option.additionalCharges.map((charge, i) => (
          <View key={i} style={styles.feeRow}>
            <Text style={styles.feeLabel}>{charge.label}</Text>
            <Text style={styles.feeValue}>{charge.value}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('mg.serviceOptions.totalCollect')}</Text>
          <Text style={styles.totalValue}>{option.totalCollect}</Text>
        </View>

        {option.fxRateEstimated && (
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>{t('mg.serviceOptions.estimatedTotal')}</Text>
            <Text style={[styles.feeValue, { fontWeight: '600' }]}>{option.receiveTotal}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout title={t('mg.serviceOptions.title')}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionLabel}>{t('mg.transfer.destinationLabel')}</Text>
        <View style={styles.countryDisplay}>
          <Text style={styles.countryText}>{destinationCountry}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t('mg.transfer.amountLabel')}</Text>
        <View style={styles.amountDisplay}>
          <Text style={styles.amountDisplayText}>{fmtPlain(Number(amount))}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t('mg.serviceOptions.chooseService')}</Text>

        {serviceOptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.grayText} />
            <Text style={styles.emptyText}>{t('mg.serviceOptions.noQuote')}</Text>
          </View>
        ) : (
          serviceOptions.map(renderServiceCard)
        )}

        {serviceOptions.some(o => o.fxRateEstimated) && (
          <View style={styles.disclaimerBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.grayText} />
            <Text style={styles.disclaimerText}>
              {t('mg.serviceOptions.disclaimer')}
            </Text>
          </View>
        )}

        {/* KYC Banner - only for basic users */}
        {!isPremium && (
          <View style={kycStatus === 'pending' ? styles.kycBannerPending : styles.kycBanner}>
            <View style={styles.kycContent}>
              <Ionicons
                name={kycStatus === 'pending' ? "time-outline" : "alert-circle"}
                size={20}
                color={kycStatus === 'pending' ? Colors.primary : Colors.primary}
              />
              <Text style={styles.kycText}>
                {kycStatus === 'pending'
                  ? t('mg.serviceOptions.kycPending')
                  : t('mg.serviceOptions.kycRequired')}
              </Text>
            </View>
            {kycStatus !== 'pending' && (
              <TouchableOpacity
                style={styles.verifyNowButton}
                onPress={() => router.push('/(kyc)/personal-details' as any)}
              >
                <Text style={styles.verifyNowText}>{t('mg.serviceOptions.verifyNow')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, (!selectedId || !isPremium || kycStatus === 'pending') && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedId || !isPremium || kycStatus === 'pending'}
        >
          <Text style={styles.nextButtonText}>{t('mg.serviceOptions.continueButton')}</Text>
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
    marginTop: 16,
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
  amountDisplay: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.gray,
  },
  amountDisplayText: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '500',
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  serviceCardHighlighted: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
    flex: 1,
    marginRight: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  serviceTitleHighlighted: {
    color: Colors.primary,
  },
  estimatedDelivery: {
    fontSize: 11,
    color: Colors.grayText,
    marginBottom: 2,
  },
  exchangeRate: {
    fontSize: 11,
    color: Colors.grayText,
    marginBottom: 12,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.grayText,
    flex: 1,
    lineHeight: 16,
  },
  estimatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    gap: 6,
  },
  estimatedBannerText: {
    fontSize: 11,
    color: '#FF9800',
    flex: 1,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.grayText,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  amountCol: {
    flex: 1,
  },
  amountColRight: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.grayText,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.black,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  feeLabel: {
    fontSize: 12,
    color: Colors.grayText,
  },
  feeValue: {
    fontSize: 12,
    color: Colors.black,
  },
  discountLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.black,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  kycBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kycBannerPending: {
    backgroundColor: '#E3F2FD', // Light blue for pending
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kycContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 10,
  },
  kycText: {
    fontSize: 12,
    color: Colors.black,
    flex: 1,
    lineHeight: 18,
  },
  verifyNowButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  verifyNowText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
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
