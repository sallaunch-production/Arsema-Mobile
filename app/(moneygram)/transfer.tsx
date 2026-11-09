import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { useFormatCurrency } from '../../utils/format-currency';

type QuoteOption = 'include' | 'exclude' | 'receive';

interface Country {
  code: string;
  iso3Code: string;
  name: string;
  flag: string;
  receiveCurrencies: string[];
}

export default function TransferScreen() {
  const { t } = useLanguage();
  const { formatCurrency } = useFormatCurrency();
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedCountryCode?: string; selectedIso3Code?: string; selectedCountryName?: string; selectedCountryFlag?: string; selectedReceiveCurrencies?: string }>();
  const { token } = useAuth();

  const [destinationCountry, setDestinationCountry] = useState('');
  const [destinationCountryCode, setDestinationCountryCode] = useState('');
  const [destinationIso3Code, setDestinationIso3Code] = useState('');
  const [destinationCountryFlag, setDestinationCountryFlag] = useState('');
  const [receiveCurrencies, setReceiveCurrencies] = useState<string[]>([]);
  const [selectedReceiveCurrency, setSelectedReceiveCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [quoteBy, setQuoteBy] = useState<QuoteOption>('exclude');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [proxyToken, setProxyToken] = useState('');

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/\D/g, '');
    setAmount(numericValue);
  };

  const formattedAmount = amount ? formatCurrency(Number(amount)) : '';

  // Handle country selection from destination-country screen
  useEffect(() => {
    if (params.selectedCountryCode && params.selectedCountryName) {
      setDestinationCountryCode(params.selectedCountryCode);
      setDestinationIso3Code(params.selectedIso3Code || '');
      setDestinationCountry(params.selectedCountryName);
      setDestinationCountryFlag(params.selectedCountryFlag || '');
      if (params.selectedReceiveCurrencies) {
        try {
          const currencies: string[] = JSON.parse(params.selectedReceiveCurrencies);
          setReceiveCurrencies(currencies);
          // Prefer local currency over major international ones
          const majorCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'JPY', 'SGD'];
          const local = currencies.find(c => !majorCurrencies.includes(c));
          setSelectedReceiveCurrency(local || currencies[0] || '');
        } catch {
          setReceiveCurrencies([]);
          setSelectedReceiveCurrency('');
        }
      }
    }
  }, [params.selectedCountryCode, params.selectedIso3Code, params.selectedCountryName, params.selectedCountryFlag, params.selectedReceiveCurrencies]);

  // Fetches a short-lived proxy token required by all MoneyGram API calls.
  // Caches the token in state; pass forceRefresh=true to bypass cache (e.g. after 404).
  const fetchProxyToken = useCallback(async (forceRefresh = false): Promise<string> => {
    if (proxyToken && !forceRefresh) return proxyToken;
    try {
      if (!token) {
        throw new Error(t('mg.transfer.signInError'));
      }
      const response = await fetch(`${API_BASE_URL}/v1/moneygram/proxy-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const text = await response.text();
      console.log('=========================================');
      console.log('DEBUG: PROXY TOKEN RESPONSE BODY:');
      console.log(text);
      console.log('=========================================');
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Failed to parse proxy token response');
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error?.message || t('mg.transfer.tokenError'));
      }

      // Handle various response formats - prioritizing proxy_token and snake_case variations
      const accessToken =
        data.data?.proxy_token ||
        data.proxy_token ||
        data.data?.proxyToken ||
        data.proxyToken ||
        data.data?.access_token ||
        data.access_token ||
        data.data?.token ||
        data.token ||
        (typeof data.data === 'string' ? data.data : null) ||
        '';

      if (!accessToken) {
        console.error('No access token found in response:', data);
        throw new Error('No access token found in response');
      }

      // Clean the token (remove "Bearer " if it's already there)
      const cleanToken = accessToken.startsWith('Bearer ')
        ? accessToken.substring(7)
        : accessToken;

      console.log('Extracted proxy token:', cleanToken ? 'Token present and ready' : 'Empty after clean');

      setProxyToken(cleanToken);
      return cleanToken;
    } catch (error: any) {
      console.error('Proxy token error:', error.message);
      throw error;
    }
  }, [proxyToken, token]);

  const fetchCountriesWithToken = useCallback(async (mgToken: string) => {
    const response = await fetch(`${API_BASE_URL}/v1/moneygram/countries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Proxy-Token': mgToken || '',
        'Accept': 'application/json',
      },
    });

    const text = await response.text();
    console.log('Countries response status:', response.status);
    console.log('Countries URL:', `${API_BASE_URL}/v1/moneygram/countries`);
    if (!response.ok) {
      console.log('Countries error body:', text.substring(0, 500));
      throw { status: response.status, message: `Failed to parse countries response (status ${response.status}): ${text.substring(0, 200)}` };
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw { status: response.status, message: `Failed to parse: ${text.substring(0, 200)}` };
    }

    if (data.success === false) {
      throw { status: response.status, data };
    }

    return data;
  }, [token]);

  const fetchCountries = useCallback(async () => {
    setIsLoadingCountries(true);
    setCountriesError(false);
    try {
      let mgToken = await fetchProxyToken();
      let data: any;
      let lastError: any;

      // Retry up to 3 times on 404 (intermittent backend issue)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          data = await fetchCountriesWithToken(mgToken);
          break; // Success, exit loop
        } catch (err: any) {
          lastError = err;
          if (err?.status === 404 && attempt < 3) {
            console.log(`Countries 404 (attempt ${attempt}/3), retrying with fresh proxy token...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            mgToken = await fetchProxyToken(true);
          } else if (err?.status === 404) {
            console.log('Countries 404 after 3 attempts');
            throw new Error(t('mg.transfer.countriesError'));
          } else {
            throw new Error(err?.data?.error?.message || err?.message || 'Failed to load countries');
          }
        }
      }

      // Helper to convert ISO code to flag emoji
      const getFlagEmoji = (countryCode: string) => {
        if (!countryCode) return '🏳️';
        // Some APIs use 3-letter codes (e.g. IDN), but flags need 2 letters (e.g. ID)
        const code = countryCode.length > 2 ? countryCode.substring(0, 2) : countryCode;
        if (code.length !== 2) return '🏳️';

        const codePoints = code
          .toUpperCase()
          .split('')
          .map((char) => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
      };

      const countryList: Country[] = (data.data || data.countries || data || []).map((c: any) => {
        const code = c.iso2Code || c.code || c.iso_code || c.country_code || '';
        const iso3 = c.iso3Code || c.iso3_code || c.alpha3 || c.iso3CountryCode || '';
        const currencies = c.receiveCurrencies || c.receive_currencies || c.currencies || [];
        return {
          code,
          iso3Code: iso3,
          name: c.name || c.country_name || '',
          flag: c.flag || c.emoji || getFlagEmoji(code),
          receiveCurrencies: Array.isArray(currencies) ? currencies : [currencies],
        };
      });

      console.log('Sample Country Data:', JSON.stringify(countryList[0], null, 2));

      setCountries(countryList);
    } catch (error: any) {
      console.error('Countries error:', error.message);
      setCountriesError(true);
    } finally {
      setIsLoadingCountries(false);
    }
  }, [fetchProxyToken, fetchCountriesWithToken, token]);

  useEffect(() => {
    if (token) {
      fetchCountries();
    }
  }, [fetchCountries, token]);

  const handleSelectCountry = () => {
    router.push({
      pathname: '/(moneygram)/destination-country',
      params: {
        countries: JSON.stringify(countries),
        selectedCode: destinationCountryCode,
      },
    });
  };

  const handleNext = async () => {
    if (!destinationCountry || !amount) return;

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    const isSendMode = quoteBy !== 'receive';
    const minAmount = isSendMode ? 10000 : 10;
    const minLabel = isSendMode ? '10,000 IDR' : '10';
    if (numericAmount < minAmount) {
      setAmountError(t('mg.transfer.minAmountError').replace('{minLabel}', minLabel));
      return;
    }
    setAmountError('');
    setQuoteError('');
    setPromoError('');

    setIsLoadingQuote(true);
    try {
      const mgToken = await fetchProxyToken();
      const isSendAmount = quoteBy !== 'receive';

      const receiveCurrencyCode = selectedReceiveCurrency || (receiveCurrencies.length > 0 ? receiveCurrencies[0] : 'USD');

      const countryCode = destinationIso3Code || destinationCountryCode;

      const body = isSendAmount
        ? {
          destinationCountryCode: countryCode,
          sendAmount: {
            value: numericAmount,
            currencyCode: 'IDR',
          },
          receiveCurrencyCode,
          ...(promoCode ? { promotionCodes: [promoCode] } : {}),
        }
        : {
          destinationCountryCode: countryCode,
          receiveAmount: {
            value: numericAmount,
            currencyCode: receiveCurrencyCode,
          },
          sendCurrencyCode: 'IDR',
          receiveCurrencies,
          ...(promoCode ? { promotionCodes: [promoCode] } : {}),
        };

      console.log('Quote request body:', JSON.stringify(body));

      const response = await fetch(`${API_BASE_URL}/v1/moneygram/transactions/quote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Proxy-Token': mgToken || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();
      console.log('Quote response:', text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Failed to parse quote response');
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error?.message || 'Failed to get quote');
      }

      const quoteData = data.data || data;
      const transactions = quoteData.transactions || (Array.isArray(quoteData) ? quoteData : [quoteData]);
      const tx = transactions[0];
      const promoDetails = tx?.sendAmount?.discountsApplied?.promotionDetails
        || transactions.map((t: any) => t?.sendAmount?.discountsApplied?.promotionDetails).flat().filter(Boolean);
      if (Array.isArray(promoDetails) && promoDetails.length > 0) {
        const errored = promoDetails.find((p: any) => p.errorCode);
        if (errored) {
          setPromoError(errored.errorMessage || 'Invalid promo code. Please remove it and try again.');
          setIsLoadingQuote(false);
          return;
        }
      }

      router.push({
        pathname: '/(moneygram)/service-options',
        params: {
          destinationCountry: destinationCountryCode,
          destinationIso3Code: destinationIso3Code,
          destinationCountryName: destinationCountry,
          destinationCountryFlag: destinationCountryFlag,
          amount,
          quoteBy,
          promoCode,
          proxyToken,
          quoteResult: JSON.stringify(data.data || data),
        },
      });
    } catch (error: any) {
      console.error('Quote error:', error.message);
      setQuoteError(error.message || 'Failed to get quote');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const isFormValid = destinationCountry.length > 0 && amount.length > 0;

  return (
    <ScreenLayout title={t('mg.transfer.title')}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>{t('mg.transfer.destinationLabel')}</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={handleSelectCountry}
          disabled={isLoadingCountries}
        >
          {isLoadingCountries ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : countriesError && countries.length === 0 ? (
            <Text style={[styles.pickerText, styles.placeholderText]}>
              {t('mg.transfer.loadError')}
            </Text>
          ) : (
            <>
              <Text style={[styles.pickerText, !destinationCountry && styles.placeholderText]}>
                {destinationCountry
                  ? `${destinationCountryFlag} ${destinationCountry}`
                  : t('mg.transfer.destinationPlaceholder')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.grayText} />
            </>
          )}
        </TouchableOpacity>
        {countriesError && countries.length === 0 && !isLoadingCountries && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchCountries}
          >
            <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
            <Text style={styles.retryText}>{t('mg.transfer.retry')}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>{t('mg.transfer.amountLabel')}</Text>
        <View style={styles.amountContainer}>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={Colors.grayText}
            value={formattedAmount}
            onChangeText={handleAmountChange}
            keyboardType="number-pad"
          />
          <Text style={styles.currencyLabel}>
            {quoteBy === 'receive'
              ? (selectedReceiveCurrency ? `${t('mg.transfer.currencyReceive')} (${selectedReceiveCurrency})` : t('mg.transfer.currencyReceive'))
              : t('mg.transfer.currencySend')}
          </Text>
          {quoteBy === 'receive' && receiveCurrencies.length > 1 && (
            <View style={styles.currencyPicker}>
              {receiveCurrencies.map(currency => (
                <TouchableOpacity
                  key={currency}
                  style={[styles.currencyChip, selectedReceiveCurrency === currency && styles.currencyChipSelected]}
                  onPress={() => setSelectedReceiveCurrency(currency)}
                >
                  <Text style={[styles.currencyChipText, selectedReceiveCurrency === currency && styles.currencyChipTextSelected]}>
                    {currency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
        </View>

        <Text style={styles.label}>{t('mg.transfer.quoteByLabel')}</Text>
        <View style={styles.radioGroup}>


          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setQuoteBy('exclude')}
          >
            <View style={[styles.radio, quoteBy === 'exclude' && styles.radioSelected]}>
              {quoteBy === 'exclude' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>{t('mg.transfer.sendAmount')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setQuoteBy('receive')}
          >
            <View style={[styles.radio, quoteBy === 'receive' && styles.radioSelected]}>
              {quoteBy === 'receive' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>{t('mg.transfer.receiveAmount')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t('mg.transfer.promoLabel')}</Text>
        <TextInput
          style={[styles.input, promoError ? styles.inputError : undefined]}
          placeholder={t('mg.transfer.promoPlaceholder')}
          placeholderTextColor={Colors.grayText}
          value={promoCode}
          onChangeText={(text) => {
            setPromoCode(text);
            if (promoError) setPromoError('');
          }}
        />
        {promoError ? (
          <View style={styles.promoErrorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#E53935" />
            <Text style={styles.promoErrorText}>{promoError}</Text>
          </View>
        ) : null}
        {promoCode && promoError ? (
          <TouchableOpacity
            style={styles.removePromoButton}
            onPress={() => { setPromoCode(''); setPromoError(''); }}
          >
            <Text style={styles.removePromoText}>{t('mg.transfer.removePromo')}</Text>
          </TouchableOpacity>
        ) : null}
        {!promoError ? (
        <Text style={styles.promoHint}>
          {t('mg.transfer.promoHint')}
        </Text>
        ) : null}
      </ScrollView>

      <View style={styles.bottomContainer}>
        {quoteError ? (
          <View style={styles.quoteErrorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#E53935" />
            <Text style={styles.quoteErrorText}>{quoteError}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.nextButton, (!isFormValid || isLoadingQuote) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid || isLoadingQuote}
        >
          {isLoadingQuote ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.nextButtonText}>{t('mg.transfer.nextButton')}</Text>
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
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
    marginTop: 20,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  pickerText: {
    fontSize: 15,
    color: Colors.black,
  },
  placeholderText: {
    color: Colors.grayText,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  amountContainer: {
    gap: 4,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.black,
  },
  currencyLabel: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 4,
  },
  currencyPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    backgroundColor: Colors.white,
  },
  currencyChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  currencyChipText: {
    fontSize: 13,
    color: Colors.black,
    fontWeight: '500',
  },
  currencyChipTextSelected: {
    color: Colors.white,
  },
  radioGroup: {
    gap: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: Colors.black,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.black,
  },
  errorText: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 4,
  },
  promoHint: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 8,
    lineHeight: 18,
  },
  inputError: {
    borderColor: '#E53935',
  },
  promoErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  promoErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#E53935',
    lineHeight: 18,
  },
  removePromoButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removePromoText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
    gap: 12,
  },
  quoteErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  quoteErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#E53935',
    lineHeight: 18,
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
