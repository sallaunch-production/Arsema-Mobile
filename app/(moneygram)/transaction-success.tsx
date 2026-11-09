import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Share,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
const ARSEMA_LOGO = require('../../logo-arsema.png');
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { ScreenLayout } from '../../components/screen-layout';
import { useLanguage } from '../../contexts/language-context';
import { useAuth } from '../../contexts/auth-context';
import { useFormatCurrency } from '../../utils/format-currency';

export default function TransactionSuccessScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const sharingInProgress = useRef(false);
  const { formatCurrencyWithCode } = useFormatCurrency();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

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

  const commitResult = useMemo(() => {
    if (!params.commitResult) return null;
    try {
      return JSON.parse(params.commitResult);
    } catch {
      return null;
    }
  }, [params.commitResult]);

  const refNumber = commitResult?.referenceNumber
    
    || '-';

  // Build beneficiary name from params or commitResult
  const beneficiaryName = [
    params.beneficiaryFirstName || commitResult?.receiver_first_name,
    params.beneficiaryMiddleName || commitResult?.receiver_middle_name,
    params.beneficiaryLastName1 || commitResult?.receiver_last_name,
  ].filter(Boolean).join(' ').trim() || '-';
  const first = params.senderFirstName || commitResult?.sender_first_name || '';
  const middle = params.senderMiddleName || commitResult?.sender_middle_name || '';
  const last = params.senderLastName || commitResult?.sender_last_name || '';
  const senderName = [first, middle, last].filter(Boolean).join(' ').trim() || user?.name || 'N/A';
  const transactionStatus = params.transactionStatus
    || commitResult?.status
    || 'AVAILABLE';

  const formatEstimatedDate = (dateStr: string) => {
    if (!dateStr) return 'Today';
    if (dateStr.toLowerCase() === 'today') {
      const now = new Date();
      return `${now.toLocaleString('en', { month: 'short' })}, ${now.getDate()} ${now.getFullYear()}`;
    }
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.toLocaleString('en', { month: 'short' })}, ${d.getDate()} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Parse response_body from commitResult if available (from transaction detail API)
  const responseBody = useMemo(() => {
    if (!commitResult?.response_body) return null;
    if (typeof commitResult.response_body === 'string') {
      try { return JSON.parse(commitResult.response_body); } catch { return null; }
    }
    return commitResult.response_body;
  }, [commitResult]);

  const serviceName = quoteData?.serviceOptionName
    || commitResult?.service_option_name
    || responseBody?.serviceOptionName
    || 'Cash Pickup Anywhere/10 Minute Service';
  const estimatedDelivery = formatEstimatedDate(
    params.expectedPayoutDate
    || commitResult?.expected_payout_date
    || responseBody?.expectedPayoutDate
    || quoteData?.estimatedDelivery
    || 'Today'
  );
  const receiveAmount = quoteData?.receiveAmount?.amount?.value
    ?? responseBody?.receiveAmount?.amount?.value
    ?? commitResult?.receive_amount
    ?? 0;
  const receiveCurrency = quoteData?.receiveAmount?.amount?.currencyCode
    ?? responseBody?.receiveAmount?.amount?.currencyCode
    ?? commitResult?.receive_currency
    ?? 'USD';

  const formatCurrency = formatCurrencyWithCode;
  const handleCopyRef = () => {
    Alert.alert('Reference Number', refNumber, [{ text: 'OK' }]);
  };

  const handleDone = () => {
    router.replace('/(tabs)' as any);
  };

  const handleShareReceipt = async () => {
    if (sharingInProgress.current) return;
    sharingInProgress.current = true;
    const sendAmount = quoteData?.sendAmount?.amount?.value ?? 0;
    const sendCurrency = quoteData?.sendAmount?.amount?.currencyCode ?? 'IDR';
    const sendFee = quoteData?.sendAmount?.fees?.value ?? 0;
    const sendTaxes = quoteData?.sendAmount?.taxes?.value ?? 0;
    const sendTotal = quoteData?.sendAmount?.total?.value ?? 0;
    const fxRate = quoteData?.receiveAmount?.fxRate ?? 0;
    const receiveFees = quoteData?.receiveAmount?.fees?.value ?? 0;
    const receiveTaxes = quoteData?.receiveAmount?.taxes?.value ?? 0;
    const receiveTotal = quoteData?.receiveAmount?.total?.value ?? receiveAmount;
    const subdivision = params.destinationCountrySubdivisionCode ?? '';
    const countryCode = params.destinationCountryCode ?? params.destinationCountry ?? '';
    const destination = [subdivision, countryCode].filter(Boolean).join(', ');
    const now = new Date();
    const dateStr = `${now.getDate()} ${now.toLocaleString('en', { month: 'long' })} ${now.getFullYear()}`;
    const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    // Pre-compute conditional rows — avoids nested template literals which crash on Hermes
    const row = (lbl: string, val: string) =>
      '<div class="row"><div class="lbl">' + lbl + '</div><div class="val">' + val + '</div></div>';
    const destinationRow = destination ? row('Destination', destination) : '';
    const sendTaxRow = Number(sendTaxes) > 0 ? row('Taxes', formatCurrency(Number(sendTaxes), sendCurrency)) : '';
    const receiveFeesRow = Number(receiveFees) > 0 ? row('Fees', formatCurrency(Number(receiveFees), receiveCurrency)) : '';
    const receiveTaxRow = Number(receiveTaxes) > 0 ? row('Taxes', formatCurrency(Number(receiveTaxes), receiveCurrency)) : '';

    setIsGeneratingPdf(true);

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#000;padding:32px}
.center{text-align:center}
.addr{line-height:1.8;margin-bottom:14px;font-size:12px}
.date-line{text-align:center;margin:14px 0;font-size:12px}
hr{border:none;border-top:1px solid #000;margin:14px 0}
.sec{font-size:13px;font-weight:bold;margin:12px 0 8px}
.fld{font-weight:bold;margin:6px 0 2px;font-size:12px}
.indent{line-height:1.7;margin-bottom:4px;font-size:12px}
.row{display:flex;margin-bottom:5px;font-size:12px}
.lbl{font-weight:bold;min-width:155px;flex-shrink:0}
.val{flex:1}
.note{font-size:11px;color:#555;margin:4px 0;font-style:italic}
.total-row{display:flex;font-weight:bold;border-top:1px solid #000;padding-top:5px;margin-top:4px;font-size:12px}
.disc{border:1px solid #ccc;padding:20px;text-align:center;color:#666;margin-top:28px;min-height:60px;font-size:12px}
</style>
</head>
<body>
<div class="date-line">
<strong>PT MoneyGram Payments System Indonesia</strong><br/>
CUSTOMER COPY<br/>
ARTHAPOS - JAKARTA - HQ CILANDAK<br/>
JL. CILANDAK TENGAH No.36,<br/>
KEC. CILANDAK<br/>
JAKARTA, 12430<br/>
+62-21 71794849<br/>
+62-8111757737
</div>

<div class="date-line">Date <strong>${dateStr}</strong>&nbsp;&nbsp;&nbsp;Time <strong>${timeStr}</strong></div>

<hr/>

<div class="sec">Sender Information:</div>
<div class="fld">Sender Name:</div>
<div class="indent">${senderName}</div>

<hr/>

<div class="sec">Receiver Information:</div>
<div class="fld">Receiver Name:</div>
<div class="indent">${beneficiaryName}</div>

<hr/>

<div class="sec">Transaction Information</div>
${destinationRow}
${row('Service Option', serviceName)}
${row('Reference Number', refNumber)}
${row('Status', transactionStatus)}
${row('Expected Payout Date', estimatedDelivery)}
<div class="note">*Funds sent using some services may be available sooner</div>

<hr/>

<div class="sec">Send Amount</div>
${row('Amount', formatCurrency(Number(sendAmount), sendCurrency))}
${row('Fees', formatCurrency(Number(sendFee), sendCurrency))}
${sendTaxRow}
<div class="total-row"><div class="lbl">Total</div><div class="val">${formatCurrency(Number(sendTotal), sendCurrency)}</div></div>

<hr/>

<div class="sec">Receive Amount</div>
${row('Exchange Rate', '1 ' + sendCurrency + ' = ' + fxRate + ' ' + receiveCurrency)}
${row('Amount', formatCurrency(Number(receiveAmount), receiveCurrency))}
${receiveFeesRow}
${receiveTaxRow}
<div class="total-row"><div class="lbl">Total</div><div class="val">${formatCurrency(Number(receiveTotal), receiveCurrency)}</div></div>

<hr/>

<div class="disc">Please visit www.moneygram.com to view your MoneyGram Plus information Privacy Notice. Our Privacy Statement has not changed in ways that require additional notice, and you may review our Privacy Statement and practices with respect to your personal information at www.moneygram.com/privacy-notice or we will mail you a free copy upon request.</div>
</body>
</html>`;

    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Arsema Transaction Receipt',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      Alert.alert('Error', 'Failed to generate or share PDF receipt.');
    } finally {
      sharingInProgress.current = false;
      setIsGeneratingPdf(false);
    }
  };

  const statusColor = transactionStatus?.toLowerCase().includes('avail')
    || transactionStatus?.toLowerCase().includes('commit')
    || transactionStatus?.toLowerCase().includes('complete')
    ? Colors.success
    : Colors.primary;

  return (
    <ScreenLayout title="" showBackButton={false} showHomeButton={false}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={44} color={Colors.white} />
          </View>
          <Text style={styles.successText}>{t('mg.txSuccess.title')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {transactionStatus}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.refRow} onPress={handleCopyRef} activeOpacity={0.7}>
            <Text style={styles.refValue}>{refNumber}</Text>
            <View style={styles.copyBadge}>
              <Ionicons name="copy-outline" size={12} color={Colors.primary} />
              <Text style={styles.copyText}>Copy</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <DetailRow label={t('mg.txSuccess.beneficiaryLabel')} value={beneficiaryName} />
          <DetailRow label={t('mg.txSuccess.serviceLabel')} value={serviceName} />
          <DetailRow label={t('mg.txSuccess.deliveryLabel')} value={estimatedDelivery} />
          <DetailRow label={t('mg.txSuccess.statusLabel')} value={transactionStatus} bold />
          <View style={styles.divider} />
          <View style={styles.receiveRow}>
            <Text style={styles.receiveLabel}>{t('mg.txSuccess.receiveLabel')}</Text>
            <Text style={styles.receiveValue}>
              {formatCurrency(receiveAmount, receiveCurrency)}
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.grayText} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>{t('mg.txSuccess.infoTitle')}</Text>
            <Text style={styles.infoText}>{t('mg.txSuccess.infoText')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.shareButton, isGeneratingPdf && styles.buttonDisabled]}
          onPress={handleShareReceipt}
          disabled={isGeneratingPdf}
          activeOpacity={0.7}
        >
          {isGeneratingPdf ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="share-social-outline" size={20} color={Colors.primary} />
              <Text style={styles.shareButtonText}>{t('mg.txSuccess.shareButton')}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneButton} onPress={handleDone} activeOpacity={0.7}>
          <Text style={styles.doneButtonText}>{t('mg.txSuccess.doneButton')}</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, bold && detailStyles.boldValue]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: Colors.grayText,
    flexShrink: 0,
    marginRight: 12,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.black,
    textAlign: 'right',
    flex: 1,
  },
  boldValue: {
    fontWeight: '700',
    color: Colors.black,
  },
});

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  copyText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.grayBorder,
    marginVertical: 4,
    marginBottom: 14,
  },
  receiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiveLabel: {
    fontSize: 13,
    color: Colors.grayText,
  },
  receiveValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.gray,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoIconWrap: {
    marginTop: 1,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 3,
  },
  infoText: {
    fontSize: 11,
    color: Colors.grayText,
    lineHeight: 17,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 10,
  },
  shareButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
  },
  shareButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
