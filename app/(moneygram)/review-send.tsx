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
import { useLanguage } from '../../contexts/language-context';
import { useFormatCurrency } from '../../utils/format-currency';

export default function ReviewSendScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { formatCurrencyWithCode } = useFormatCurrency();

  const [showBeneficiary, setShowBeneficiary] = useState(true);
  const [showTransaction, setShowTransaction] = useState(true);



  const quoteData = useMemo(() => {
    if (!params.quoteResult) return null;
    try {
      const data = JSON.parse(params.quoteResult);
      const transactions = data.transactions || (Array.isArray(data) ? data : [data]);
      const tx = transactions.find((t: any) => t.transactionId === params.transactionId) || transactions[0];
      return tx;
    } catch {
      return null;
    }
  }, [params.quoteResult, params.transactionId]);

  const sendAmount = quoteData?.sendAmount?.amount?.value ?? 0;
  const sendCurrency = quoteData?.sendAmount?.amount?.currencyCode ?? 'IDR';
  const sendFee = quoteData?.sendAmount?.fees?.value ?? 0;
  const sendTotal = quoteData?.sendAmount?.total?.value ?? 0;
  const receiveAmount = quoteData?.receiveAmount?.amount?.value ?? 0;
  const receiveCurrency = quoteData?.receiveAmount?.amount?.currencyCode ?? 'USD';
  const fxRate = quoteData?.receiveAmount?.fxRate ?? 0;
  const serviceName = quoteData?.serviceOptionName ?? 'Cash Pickup';

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('en', { month: 'long' })} ${now.getFullYear()} ${now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })} GMT+7`;

  const formatCurrency = formatCurrencyWithCode;
  const handleConfirm = () => {
    router.push({
      pathname: '/(moneygram)/payment-method',
      params: {
        ...params,
      },
    });
  };

  return (
    <ScreenLayout title={t('mg.reviewSend.title')}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>{t('mg.reviewSend.dateLabel')}</Text>
            <Text style={styles.headerValue}>{dateStr}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>{t('mg.reviewSend.typeLabel')}</Text>
            <Text style={styles.headerValue}>{t('mg.reviewSend.typeValue')}</Text>
          </View>
        </View>

        {/* Beneficiary Details */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowBeneficiary(!showBeneficiary)}
        >
          <Text style={styles.sectionTitle}>{t('mg.reviewSend.beneficiarySection')}</Text>
          <Ionicons
            name={showBeneficiary ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.primary}
          />
        </TouchableOpacity>

        {showBeneficiary && (
          <View style={styles.sectionContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('mg.reviewSend.fullName')}</Text>
              <Text style={styles.detailValue}>
                {[params.beneficiaryFirstName, params.beneficiaryMiddleName, params.beneficiaryLastName1].filter(Boolean).join(' ')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('mg.reviewSend.phone')}</Text>
              <Text style={styles.detailValue}>{params.beneficiaryPhone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('mg.reviewSend.country')}</Text>
              <Text style={styles.detailValue}>{params.destinationCountryName}</Text>
            </View>
          </View>
        )}

        {/* Transaction Details */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowTransaction(!showTransaction)}
        >
          <Text style={styles.sectionTitle}>{t('mg.reviewSend.transactionSection')}</Text>
          <Ionicons
            name={showTransaction ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.primary}
          />
        </TouchableOpacity>

        {showTransaction && (
          <View style={styles.sectionContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('mg.reviewSend.destination')}</Text>
              <Text style={styles.detailValue}>{params.destinationCountryName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('mg.reviewSend.service')}</Text>
              <Text style={[styles.detailValue, { textAlign: 'right', flex: 1 }]}>
                {serviceName}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('mg.reviewSend.amount')}</Text>
              <Text style={styles.detailValue}>{formatCurrency(sendAmount, sendCurrency)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('mg.reviewSend.fxRate')}</Text>
              <Text style={styles.detailValue}>{fxRate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('mg.reviewSend.receiveAmount')}</Text>
              <Text style={styles.detailValue}>{formatCurrency(receiveAmount, receiveCurrency)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('mg.reviewSend.fee')}</Text>
              <Text style={styles.detailValue}>{formatCurrency(sendFee, sendCurrency)}</Text>
            </View>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('mg.reviewSend.total')}</Text>
          <Text style={styles.totalValue}>{formatCurrency(sendTotal, sendCurrency)}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>{t('mg.reviewSend.continueButton')}</Text>
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
  headerInfo: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontSize: 12,
    color: Colors.grayText,
  },
  headerValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: 14,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.grayText,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.black,
    maxWidth: '55%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
