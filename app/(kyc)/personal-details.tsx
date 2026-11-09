import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { useKYC } from '../../contexts/kyc-context';
import { useLanguage } from '../../contexts/language-context';

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { updateKYCData } = useKYC();
  const { t } = useLanguage();
  const [proxyToken, setProxyToken] = useState<string | null>(null);

  // Parse user name into first, middle, and last name
  const { firstName: initialFirstName, middleName: initialMiddleName, lastName: initialLastName } = useMemo(() => {
    const nameParts = (user?.name || '').trim().split(/\s+/);
    
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], middleName: '', lastName: '' };
    } else if (nameParts.length === 2) {
      return { firstName: nameParts[0], middleName: '', lastName: nameParts[1] };
    } else {
      return { 
        firstName: nameParts[0], 
        middleName: nameParts.slice(1, -1).join(' '), 
        lastName: nameParts[nameParts.length - 1] 
      };
    }
  }, [user?.name]);

  const [firstName, setFirstName] = useState(initialFirstName);
  const [middleName, setMiddleName] = useState(initialMiddleName);
  const [lastName, setLastName] = useState(initialLastName);
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('IDN');
  const [countryName, setCountryName] = useState('Indonesia');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [countries, setCountries] = useState<{ iso3Code: string; name: string }[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [subdivisions, setSubdivisions] = useState<{ code: string; name: string }[]>([]);
  const [isLoadingSubdivisions, setIsLoadingSubdivisions] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [stateName, setStateName] = useState('');

  // Fetch countries from API
  const fetchProxyToken = useCallback(async (): Promise<string> => {
    if (proxyToken) return proxyToken;
    try {
      if (!token) {
        throw new Error('Please sign in to continue');
      }
      const response = await fetch(`${API_BASE_URL}/v1/moneygram/proxy-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error?.message || 'Failed to get proxy token');
      }

      const mgToken = data.data?.proxy_token || data.data?.mg_token || data.proxy_token || data.mg_token || '';
      setProxyToken(mgToken);
      return mgToken;
    } catch (error) {
      console.error('Error fetching proxy token:', error);
      return '';
    }
  }, [token, proxyToken]);

  // Fetch proxy token first, then fetch countries
  useEffect(() => {
    const initializeAndFetchCountries = async () => {
      try {
        // First get the proxy token
        const mgToken = await fetchProxyToken();
        console.log('Proxy token fetched:', mgToken ? 'Present' : 'Missing');
        
        // Then fetch countries with the proxy token
        const response = await fetch(`${API_BASE_URL}/v1/moneygram/countries`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Proxy-Token': mgToken || '',
            'Accept': 'application/json',
          },
        });

        console.log('Countries API response status:', response.status);

        const data = await response.json();
        if (data.success && data.data) {
          const countryList = data.data.map((c: { iso3_code?: string; iso3Code?: string; name?: string; country_name?: string }) => ({
            iso3Code: c.iso3_code || c.iso3Code || '',
            name: c.name || c.country_name || '',
          })).filter((c: { iso3Code: string; name: string }) => c.iso3Code && c.name);
          setCountries(countryList);
          if (countryList.length > 0) {
            setCountry(countryList[0].iso3Code);
            setCountryName(countryList[0].name);
          }
        } else {
          // Fallback to default countries if API fails
          setCountries([
            { iso3Code: 'IDN', name: 'Indonesia' },
            { iso3Code: 'MYS', name: 'Malaysia' },
            { iso3Code: 'SGP', name: 'Singapore' },
            { iso3Code: 'PHL', name: 'Philippines' },
            { iso3Code: 'VNM', name: 'Vietnam' },
            { iso3Code: 'THA', name: 'Thailand' },
          ]);
        }
      } catch (error) {
        // Fallback to default countries on error
        setCountries([
          { iso3Code: 'IDN', name: 'Indonesia' },
          { iso3Code: 'MYS', name: 'Malaysia' },
          { iso3Code: 'SGP', name: 'Singapore' },
          { iso3Code: 'PHL', name: 'Philippines' },
          { iso3Code: 'VNM', name: 'Vietnam' },
          { iso3Code: 'THA', name: 'Thailand' },
        ]);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    initializeAndFetchCountries();
  }, [fetchProxyToken, token]);

  const fetchSubdivisions = useCallback(async (countryCode: string) => {
    if (!countryCode || !token) return;
    setIsLoadingSubdivisions(true);
    try {
      const mgToken = await fetchProxyToken();
      const response = await fetch(`${API_BASE_URL}/v1/moneygram/countries/${countryCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Proxy-Token': mgToken || '',
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      // Adjust based on actual API response structure
      const subs = data.data?.subdivisions || data.subdivisions || [];
      setSubdivisions(Array.isArray(subs) ? subs : []);
    } catch (error) {
      console.error('Fetch subdivisions error:', error);
      setSubdivisions([]);
    } finally {
      setIsLoadingSubdivisions(false);
    }
  }, [token, fetchProxyToken]);

  useEffect(() => {
    if (country) {
      fetchSubdivisions(country);
    }
  }, [country, fetchSubdivisions]);

  const isFormValid = firstName.length > 0 && address1.length > 0 && city.length > 0 && country.length > 0;

  const handleNext = () => {
    // Save to KYC context before navigating
    updateKYCData({
      firstName,
      middleName,
      lastName,
      address1,
      address2,
      city,
      state: state || stateName,
      postalCode,
      country: country,
    });
    router.push({
      pathname: '/(kyc)/identity-information',
      params: { firstName, middleName, lastName, address1, address2, city, state: state || stateName, postalCode, country: country },
    });
  };

  return (
    <ScreenLayout title={t('kyc.title')}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.subtitle}>{t('kyc.personalDetails.subtitle')}</Text>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('kyc.personalDetails.firstNameLabel')}</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('kyc.personalDetails.firstNamePlaceholder')}
              placeholderTextColor={Colors.grayText}
              editable={false}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.labelOptional}>{t('kyc.personalDetails.middleNameLabel')}</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={middleName}
              onChangeText={setMiddleName}
              placeholder=""
              placeholderTextColor={Colors.grayText}
              editable={false}
            />
          </View>
        </View>

        <Text style={styles.label}>{t('kyc.personalDetails.lastNameLabel')}</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={lastName}
          onChangeText={setLastName}
          placeholder=""
          placeholderTextColor={Colors.grayText}
          editable={false}
        />

        <Text style={styles.label}>{t('kyc.personalDetails.address1Label')}</Text>
        <TextInput
          style={styles.input}
          value={address1}
          onChangeText={setAddress1}
          placeholder={t('kyc.personalDetails.address1Placeholder')}
          placeholderTextColor={Colors.grayText}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.labelOptional}>{t('kyc.personalDetails.address2Label')}</Text>
            <TextInput
              style={styles.input}
              value={address2}
              onChangeText={setAddress2}
              placeholder={t('kyc.personalDetails.address2Placeholder')}
              placeholderTextColor={Colors.grayText}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.labelOptional}>{t('kyc.personalDetails.buildingLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('kyc.personalDetails.address2Placeholder')}
              placeholderTextColor={Colors.grayText}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('kyc.personalDetails.countryLabel')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCountryPicker(true)}
              disabled={isLoadingCountries}
            >
              {isLoadingCountries ? (
                <ActivityIndicator size="small" color={Colors.grayText} />
              ) : (
                <>
                  <Text style={styles.pickerText}>{countryName}</Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.grayText} />
                </>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.halfField}>
            <Text style={styles.labelOptional}>{t('kyc.personalDetails.stateLabel')}</Text>
            {subdivisions.length > 0 ? (
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowStatePicker(true)}
                disabled={isLoadingSubdivisions}
              >
                {isLoadingSubdivisions ? (
                  <ActivityIndicator size="small" color={Colors.grayText} />
                ) : (
                  <>
                    <Text style={[styles.pickerText, !state && styles.placeholderText]}>
                      {stateName || state || t('kyc.personalDetails.statePlaceholder')}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={Colors.grayText} />
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder={t('kyc.personalDetails.stateInputPlaceholder')}
                placeholderTextColor={Colors.grayText}
              />
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('kyc.personalDetails.cityLabel')}</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder={t('kyc.personalDetails.cityPlaceholder')}
              placeholderTextColor={Colors.grayText}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.labelOptional}>{t('kyc.personalDetails.postalLabel')}</Text>
            <TextInput
              style={styles.input}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder={t('kyc.personalDetails.postalPlaceholder')}
              placeholderTextColor={Colors.grayText}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Modal visible={showStatePicker} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('kyc.personalDetails.selectStateTitle')}</Text>
              <TouchableOpacity onPress={() => { setShowStatePicker(false); setStateSearch(''); }}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search" size={18} color={Colors.grayText} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('kyc.personalDetails.stateSearch')}
                placeholderTextColor={Colors.grayText}
                value={stateSearch}
                onChangeText={setStateSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {isLoadingSubdivisions ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={stateSearch.trim()
                  ? subdivisions.filter(s =>
                      s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
                      s.code.toLowerCase().includes(stateSearch.toLowerCase())
                    )
                  : subdivisions
                }
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, state === item.code && styles.modalItemSelected]}
                    onPress={() => {
                      setState(item.code);
                      setStateName(item.name);
                      setShowStatePicker(false);
                      setStateSearch('');
                    }}
                  >
                    <Text style={[styles.modalItemText, state === item.code && styles.modalItemTextSelected]}>
                      {item.name}
                    </Text>
                    {state === item.code && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                contentContainerStyle={styles.modalList}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </Modal>

        <Modal visible={showCountryPicker} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('kyc.personalDetails.selectCountryTitle')}</Text>
              <TouchableOpacity onPress={() => { setShowCountryPicker(false); setCountrySearch(''); }}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search" size={18} color={Colors.grayText} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('kyc.personalDetails.countrySearch')}
                placeholderTextColor={Colors.grayText}
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {countrySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCountrySearch('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.grayText} />
                </TouchableOpacity>
              )}
            </View>

            {isLoadingCountries ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={countrySearch.trim()
                  ? countries.filter(c =>
                      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                      c.iso3Code.toLowerCase().includes(countrySearch.toLowerCase())
                    )
                  : countries
                }
                keyExtractor={(item, index) => `${item.iso3Code}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, country === item.iso3Code && styles.modalItemSelected]}
                    onPress={() => {
                      setCountry(item.iso3Code);
                      setCountryName(item.name);
                      setState('');
                      setStateName('');
                      setShowCountryPicker(false);
                      setCountrySearch('');
                    }}
                  >
                    <Text style={[styles.modalItemText, country === item.iso3Code && styles.modalItemTextSelected]}>
                      {item.name}
                    </Text>
                    {country === item.iso3Code && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                contentContainerStyle={styles.modalList}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </Modal>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, !isFormValid && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid}
        >
          <Text style={styles.nextButtonText}>{t('kyc.personalDetails.nextButton')}</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 15, fontWeight: '600', color: Colors.black, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.black, marginBottom: 6, marginTop: 14 },
  labelOptional: { fontSize: 13, fontWeight: '500', color: Colors.grayText, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.black,
  },
  inputDisabled: {
    backgroundColor: Colors.gray,
    color: Colors.grayText,
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
  pickerText: { fontSize: 14, color: Colors.black },
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.black },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  modalSearchInput: { flex: 1, fontSize: 15, color: Colors.black, padding: 0 },
  modalLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalList: { paddingHorizontal: 20, paddingBottom: 40 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  modalItemSelected: {},
  modalItemText: { fontSize: 15, color: Colors.black },
  modalItemTextSelected: { color: Colors.primary, fontWeight: '600' },
  modalSeparator: { height: 1, backgroundColor: Colors.grayBorder },
  placeholderText: { color: Colors.grayText },
  bottomContainer: { padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: Colors.grayBorder },
  nextButton: { backgroundColor: Colors.primary, borderRadius: 25, paddingVertical: 16, alignItems: 'center' },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
