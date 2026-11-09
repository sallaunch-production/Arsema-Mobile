import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';
import { useFormatCurrency } from '../../utils/format-currency';

const ARSEMA_LOGO = require('../../assets/logo-arsema.png');

export default function TransactionDetailScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const { token } = useAuth();
  const { formatCurrencyWithCode } = useFormatCurrency();

  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const sharingInProgress = useRef(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      console.log('fetchDetail triggered:', { transactionId, hasToken: !!token });

      if (!transactionId) {
        setError('Missing transaction ID');
        setIsLoading(false);
        return;
      }

      if (!token) {
        // Wait for token to be available
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // 1. Try completed-transactions first

        let response = await fetch(`${API_BASE_URL}/v1/moneygram/completed-transactions/mg/${transactionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let data;
        try {
          data = await response.json();
          console.log('Completed Response Data:', data);
        } catch (e) {
          console.log('Completed response not JSON');
          data = { success: false };
        }

        if (!response.ok || data.success === false || !data.data) {
          // 2. Fallback to regular transactions
          console.log('Fallback to regular transactions/mg/', transactionId);
          response = await fetch(`${API_BASE_URL}/v1/moneygram/transactions/mg/${transactionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          try {
            data = await response.json();
            console.log('Fallback Response Data:', data);
          } catch (e) {
            console.log('Fallback response not JSON');
            data = { success: false };
          }
        }

        if (response.ok && data.success !== false && data.data) {
          setTransactionData(data.data);
          console.log(data.data);
          setTransactionStatus(data.data?.status);
        } else {
          console.log('Details not found in any endpoint');
          setError('Transaction details not found');
        }
      } catch (err) {
        console.error('Fetch detail catch error:', err);
        setError('Failed to connect to server');
      } finally {
        console.log('Fetch detail complete, setting isLoading to false');
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [transactionId, token]);

  // Merge transaction data with its response_body (JSON string from backend)
  // to create a unified details object for display.
  const details = useMemo(() => {
    if (!transactionData) return null;
    let merged = { ...transactionData };
    try {
      if (typeof transactionData.response_body === 'string' && transactionData.response_body) {
        const parsed = JSON.parse(transactionData.response_body);
        merged = { ...merged, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse response_body', e);
    }
    return merged;
  }, [transactionData]);

  // For COMMITTED transactions, fetch the sub-status from MoneyGram
  // (e.g. "Available for pickup") and update the displayed status.
  useEffect(() => {
    const fetchSubStatus = async () => {
      if ((details?.status === 'COMMITTED' || details?.status === 'PROCESSING') && transactionId && token) {

        try {
          const response = await fetch(`${API_BASE_URL}/v1/moneygram/transactions/${transactionId}/status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();

          if (data.success !== false && data.data?.transactionSubStatus) {
            setSubStatus(data.data?.transactionSubStatus[0].subStatus + ' - ' + data.data?.transactionSubStatus[0].message);
            setTransactionStatus(data.data?.transactionStatus);
          }
        } catch (err) {
          console.error('Failed to fetch transaction sub-status:', err);
        }
      }
    };

    fetchSubStatus();
  }, [details?.status, transactionId, token]);

  const formatCurrency = formatCurrencyWithCode;

  const handleCheckPaymentStatus = async () => {
    console.log(transactionId);
    if (!transactionId) {
      Alert.alert('Error', 'Transaction ID not found');
      return;
    }

    setIsCheckingStatus(true);
    try {
      const url = `${API_BASE_URL}/v1/moneygram/transactions/${transactionId}/status`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned unexpected response. Status: ' + response.status);
      }

      const isPaid = data.data?.transactionStatus === "UNFUNDED";

      if (isPaid) {
        // Commit transaction
        console.log(transactionId);
        const commitUrl = `${API_BASE_URL}/v1/moneygram/transactions/${transactionId}/commit`;
        const commitResponse = await fetch(commitUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fundingSource: {
              tenderType: 'CASH',
            },
          }),
        });

        const commitText = await commitResponse.text();
        console.log(commitText);
        let commitData: any;
        try {
          commitData = JSON.parse(commitText);
          if (commitData.success === false) {
            Alert.alert(
              commitData.error?.message
            );
            return;
          }
        } catch {
          throw new Error('Invalid commit response');
        }

        const alreadyCommitted = commitData?.message?.toLowerCase().includes('already been committed')
          || commitData?.error?.message?.toLowerCase().includes('already been committed');

        if (!commitResponse.ok && !alreadyCommitted && commitData?.success === false) {
          throw new Error(commitData?.error?.message || commitData?.message || 'Failed to commit transaction');
        }

        let result = commitData?.data || commitData;

        // If no referenceNumber or already committed, fetch transaction detail
        const refNum = result?.referenceNumber || result?.reference_number || '';
        if (!refNum || alreadyCommitted) {
          try {
            const detailRes = await fetch(
              `${API_BASE_URL}/v1/moneygram/completed-transactions/mg/${transactionId}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const detailData = await detailRes.json();
            if (detailData?.data) {
              result = { ...result, ...detailData.data };
            }
          } catch (e) {
            console.error('Failed to fetch transaction detail:', e);
          }
        }

        router.replace({
          pathname: '/(moneygram)/transaction-success',
          params: {
            referenceNumber: result.referenceNumber || result.reference_number || result.mg_reference_number || '',
            expectedPayoutDate: result.expectedPayoutDate || result.expected_payout_date || '',
            transactionStatus: result.status || (alreadyCommitted ? 'COMMITTED' : 'AVAILABLE'),
            commitResult: JSON.stringify(result),
          },
        });
      } else {
        Alert.alert(
          'Status transactions is: ' + data.data?.transactionStatus,
          'We still process your status.Please wait a moment.',
        );
      }
    } catch (error: any) {
      console.error('Check Payment Status Error:', error);
      Alert.alert('Error', error.message || 'Failed to check payment status.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleShareReceipt = async () => {
    if (!details) return;
    if (sharingInProgress.current) return;
    sharingInProgress.current = true;

    setIsGeneratingPdf(true);
    try {
      const logoAsset = Image.resolveAssetSource(ARSEMA_LOGO);
      const now = details.updated_at ? new Date(details.updated_at) : new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      const refNumber = details.reference_number || 'N/A';
      const getBeneficiaryName = () => {
        if (details.receiver?.name?.firstName) {
          const n = details.receiver.name;
          const middle = n.middleName || n.middle_name || '';
          return [n.firstName, middle, n.lastName].filter(Boolean).join(' ');
        }
        const first = details.receiver_first_name || details.receiverFirstName || '';
        const middle = details.receiver_middle_name || details.receiver_middleName || details.receiverMiddleName || '';
        const last = details.receiver_last_name || details.receiverLastName || '';
        return [first, middle, last].filter(Boolean).join(' ').trim() || 'N/A';
      };
      const beneficiaryName = getBeneficiaryName();

      const serviceName = details.service_option_name || details.service_name || 'Send Service';
      const sendAmount = details.send_amount || details.amount || 0;
      const sendCurrency = details.send_currency || 'IDR';
      const sendFee = details.sendAmount?.fees?.value || details.fee || 0;
      const sendTotal = details.sendAmount?.total?.value || (Number(sendAmount) + Number(sendFee));
      const receiveAmount = details.receive_amount || details.received_amount || 0;
      const receiveCurrency = details.receiveAmount?.amount?.currencyCode || details.receive_currency || 'USD';
      const fxRate = details.fx_rate || details.exchange_rate || 0;

      const destinationCountry = details.destination_country_name || details.destinationCountryName || details.destination_country || details.destinationCountry || 'N/A';

      const formatPayoutDate = (dateStr: string) => {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
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

      const expectedPayoutDateRaw = details.expected_payout_date || details.expectedPayoutDate || details.payout_date || 'N/A';
      const expectedPayoutDate = formatPayoutDate(expectedPayoutDateRaw);

      const sendTaxes = details.sendAmount?.taxes?.value ?? 0;
      const receiveFees = details.receiveAmount?.fees?.value ?? 0;
      const receiveTaxes = details.receiveAmount?.taxes?.value ?? 0;
      const receiveTotal = details.receiveAmount?.total?.value ?? receiveAmount;
      const subdivision = details.destinationCountrySubdivisionCode || details.destination_subdivision || '';
      const destination = [subdivision, destinationCountry].filter(s => s && s !== 'N/A').join(', ') || destinationCountry;
      const now2 = new Date();
      const timeStr = now2.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

      // Pre-compute conditional rows — avoids nested template literals which crash on Hermes
      const row2 = (lbl: string, val: string) =>
        '<div class="row"><div class="lbl">' + lbl + '</div><div class="val">' + val + '</div></div>';
      const destinationRow = destination ? row2('Destination', destination) : '';
      const sendTaxRow = Number(sendTaxes) > 0 ? row2('Taxes', formatCurrency(Number(sendTaxes), sendCurrency)) : '';
      const receiveFeesRow = Number(receiveFees) > 0 ? row2('Fees', formatCurrency(Number(receiveFees), receiveCurrency)) : '';
      const receiveTaxRow = Number(receiveTaxes) > 0 ? row2('Taxes', formatCurrency(Number(receiveTaxes), receiveCurrency)) : '';

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#000;padding:32px}
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
${row2('Service Option', serviceName)}
${row2('Reference Number', refNumber)}
${row2('Status', transactionData.status)}
${row2('Expected Payout Date', expectedPayoutDate)}
<div class="note">*Funds sent using some services may be available sooner</div>

<hr/>

<div class="sec">Send Amount</div>
${row2('Amount', formatCurrency(Number(sendAmount), sendCurrency))}
${row2('Fees', formatCurrency(Number(sendFee), sendCurrency))}
${sendTaxRow}
<div class="total-row"><div class="lbl">Total</div><div class="val">${formatCurrency(Number(sendTotal), sendCurrency)}</div></div>

<hr/>

<div class="sec">Receive Amount</div>
${row2('Exchange Rate', '1 ' + sendCurrency + ' = ' + fxRate + ' ' + receiveCurrency)}
${row2('Amount', formatCurrency(Number(receiveAmount), receiveCurrency))}
${receiveFeesRow}
${receiveTaxRow}
<div class="total-row"><div class="lbl">Total</div><div class="val">${formatCurrency(Number(receiveTotal), receiveCurrency)}</div></div>

<hr/>

<div class="disc">Please visit www.moneygram.com to view your MoneyGram Plus information Privacy Notice. Our Privacy Statement has not changed in ways that require additional notice, and you may review our Privacy Statement and practices with respect to your personal information at www.moneygram.com/privacy-notice or we will mail you a free copy upon request.</div>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (err) {
      console.error('Share error:', err);
      Alert.alert('Error', 'Failed to generate receipt');
    } finally {
      sharingInProgress.current = false;
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenLayout title={t('mg.txDetail.title')}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (error || !transactionData) {
    return (
      <ScreenLayout title={t('mg.txDetail.title')}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('mg.txDetail.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  const statusStyle = details.status?.toLowerCase().includes('complete') || details.status === 'PAID' || details.status === 'COMMITTED'
    ? { backgroundColor: '#E8F5E9', color: Colors.success }
    : details.status?.toLowerCase().includes('fail')
      ? { backgroundColor: '#FFEBEE', color: Colors.error }
      : { backgroundColor: '#FFF3E0', color: '#FF9800' };

  const getBeneficiaryName = () => {
    if (details.receiver?.name?.firstName) {
      const n = details.receiver.name;
      const middle = n.middleName || n.middle_name || '';
      return [n.firstName, middle, n.lastName].filter(Boolean).join(' ');
    }
    const first = details.receiver_first_name || details.receiverFirstName || '';
    const middle = details.receiver_middle_name || details.receiver_middleName || details.receiverMiddleName || '';
    const last = details.receiver_last_name || details.receiverLastName || '';
    return [first, middle, last].filter(Boolean).join(' ').trim() || 'N/A';
  };
  const first = details.sender_first_name || '';
  const middle = details.sender_middle_name || '';
  const last = details.sender_last_name || '';
  const senderName = [first, middle, last].filter(Boolean).join(' ').trim() || 'N/A';
  const beneficiaryName = getBeneficiaryName();
  console.log("ab " + details.send_amount);
  const refNumber = details.reference_number || 'N/A';
  const sendAmount = details.send_amount || details.amount || 0;
  const sendCurrency = details.send_currency || details.currency || 'IDR';
  const sendFee = details.fee || details.fee || 0;
  const sendTotal = details.sendAmount?.total?.value || (Number(sendAmount) + Number(sendFee));
  const receiveAmount = details.receive_amount || details.received_amount || 0;
  const receiveCurrency = details.receive_currency || details.receive_currency || 'USD';
  const destinationCountry = details.destination_country_name || details.destinationCountryName || details.destination_country || details.destinationCountry || 'N/A';

  const formatPayoutDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
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

  const expectedPayoutDateRaw = details.expected_payout_date || details.expectedPayoutDate || details.payout_date || 'N/A';
  const expectedPayoutDate = formatPayoutDate(expectedPayoutDateRaw);

  return (
    <ScreenLayout title={t('mg.txDetail.title')}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {transactionStatus?.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={styles.amountText}>
            {formatCurrency(Number(sendAmount), sendCurrency)}
          </Text>
          <Text style={styles.dateText}>
            {details.completed_at ? new Date(details.completed_at).toLocaleString('en-GB') : 'N/A'}
          </Text>
        </View>

        <View style={styles.card}>
          <DetailRow label={t('mg.txDetail.refLabel')} value={refNumber} isPrimary />
          <DetailRow label="Beneficiary" value={beneficiaryName} />
          <DetailRow label="Destination Country" value={destinationCountry} />
          <DetailRow label="Expected Payout Date" value={expectedPayoutDate} />
          <DetailRow label="Service" value={details.service_option_name || details.service_name || 'Send Service'} />
          <DetailRow label={t('mg.txDetail.statusLabel')} value={transactionStatus} />
          {subStatus && (
            <><DetailRow label="" value={subStatus} isPrimary /><DetailRow label={t('mg.txDetail.customerService')} value="" /></>
          )}
        </View>

        <View style={styles.card}>
          <DetailRow label={t('mg.txDetail.sendAmountLabel')} value={formatCurrency(sendAmount, sendCurrency)} />
          <DetailRow label={t('mg.txDetail.feeLabel')} value={formatCurrency(sendFee, sendCurrency)} />
          <View style={styles.divider} />
          <DetailRow label={t('mg.txDetail.totalLabel')} value={formatCurrency(sendTotal, sendCurrency)} semiBold />
          <View style={styles.divider} />
          <DetailRow label={t('mg.txDetail.receiveLabel')} value={formatCurrency(receiveAmount, receiveCurrency)} isPrimary big />
        </View>

        {details.status === 'PAID' && (
          <TouchableOpacity
            style={[styles.checkStatusButton, isCheckingStatus && styles.disabled]}
            onPress={handleCheckPaymentStatus}
            disabled={isCheckingStatus}
          >
            {isCheckingStatus ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.shareButtonText}>{t('mg.txDetail.checkButton')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.shareButton, isGeneratingPdf && styles.disabled]}
          onPress={handleShareReceipt}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? <ActivityIndicator color={Colors.white} /> : (
            <>
              <Ionicons name="share-social-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.shareButtonText}>{t('mg.txDetail.shareButton')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}

function DetailRow({ label, value, isPrimary, semiBold, big }: any) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[
        styles.value,
        isPrimary && { color: Colors.primary },
        semiBold && { fontWeight: '600' },
        big && { fontSize: 16, fontWeight: '700' }
      ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  amountText: { fontSize: 24, fontWeight: '700', color: Colors.black, marginBottom: 4 },
  dateText: { fontSize: 12, color: Colors.grayText },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 13, color: Colors.grayText },
  value: { fontSize: 13, fontWeight: '500', color: Colors.black, textAlign: 'right', flex: 1, marginLeft: 12 },
  divider: { height: 1, backgroundColor: Colors.grayBorder, marginVertical: 8 },
  checkStatusButton: { backgroundColor: '#FF9800', borderRadius: 25, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 8 },
  shareButton: { backgroundColor: Colors.primary, borderRadius: 25, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  shareButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  errorText: { marginTop: 16, fontSize: 16, color: Colors.grayText, textAlign: 'center' },
  backButton: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F0F0F0' },
  backButtonText: { color: Colors.black, fontWeight: '600' },
  disabled: { opacity: 0.7 },
});
