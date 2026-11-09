import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../contexts/auth-context';
import { useKYC } from '../../contexts/kyc-context';
import { useLanguage } from '../../contexts/language-context';

const IDENTITY_MAPPING: Record<string, string> = {
  'National ID': 'GOV',
  'Passport': 'PAS',
  'Driving License': 'DRV',
};

const IDENTITY_TYPES = Object.keys(IDENTITY_MAPPING);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CountryItem {
  code: string;
  name: string;
}

interface SubdivisionItem {
  code: string;
  name: string;
}

interface DropdownState {
  identityType: boolean;
  occupation: boolean;
  gender: boolean;
}

function formatDate(d: number, m: number, y: number): string {
  return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (day: number, month: number, year: number) => void;
  title: string;
  initialDay?: number;
  initialMonth?: number;
  initialYear?: number;
  minYear?: number;
  maxYear?: number;
}

function DatePickerModal({
  visible, onClose, onConfirm, title,
  initialDay = 1, initialMonth = 1, initialYear = 2000,
  minYear = 1930, maxYear = 2040,
}: DatePickerModalProps) {
  const { t } = useLanguage();
  const [day, setDay] = useState(initialDay);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  const daysInMonth = getDaysInMonth(month, year);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  useEffect(() => {
    if (day > daysInMonth) setDay(daysInMonth);
  }, [month, year, daysInMonth]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={dpStyles.overlay}>
        <View style={dpStyles.container}>
          <View style={dpStyles.header}>
            <Text style={dpStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>

          <View style={dpStyles.pickersRow}>
            {/* Day */}
            <View style={dpStyles.column}>
              <Text style={dpStyles.columnLabel}>{t('kyc.identity.dayColumn')}</Text>
              <ScrollView style={dpStyles.scrollCol} showsVerticalScrollIndicator={false}>
                {days.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[dpStyles.item, d === day && dpStyles.itemSelected]}
                    onPress={() => setDay(d)}
                  >
                    <Text style={[dpStyles.itemText, d === day && dpStyles.itemTextSelected]}>
                      {String(d).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Month */}
            <View style={[dpStyles.column, { flex: 1.5 }]}>
              <Text style={dpStyles.columnLabel}>{t('kyc.identity.monthColumn')}</Text>
              <ScrollView style={dpStyles.scrollCol} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, idx) => (
                  <TouchableOpacity
                    key={m}
                    style={[dpStyles.item, (idx + 1) === month && dpStyles.itemSelected]}
                    onPress={() => setMonth(idx + 1)}
                  >
                    <Text style={[dpStyles.itemText, (idx + 1) === month && dpStyles.itemTextSelected]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year */}
            <View style={dpStyles.column}>
              <Text style={dpStyles.columnLabel}>{t('kyc.identity.yearColumn')}</Text>
              <ScrollView style={dpStyles.scrollCol} showsVerticalScrollIndicator={false}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[dpStyles.item, y === year && dpStyles.itemSelected]}
                    onPress={() => setYear(y)}
                  >
                    <Text style={[dpStyles.itemText, y === year && dpStyles.itemTextSelected]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity
            style={dpStyles.confirmButton}
            onPress={() => onConfirm(day, month, year)}
          >
            <Text style={dpStyles.confirmText}>{t('kyc.identity.confirmDate')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const dpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  pickersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    height: 220,
    marginTop: 8,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.grayText,
    textAlign: 'center',
    marginBottom: 6,
  },
  scrollCol: {
    flex: 1,
  },
  item: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  itemSelected: {
    backgroundColor: '#FDEAEA',
  },
  itemText: {
    fontSize: 14,
    color: Colors.black,
  },
  itemTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

// ============================
// Main Screen
// ============================

export default function IdentityInformationScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { updateKYCData } = useKYC();
  const { t } = useLanguage();

  const [identityType, setIdentityType] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [dobDay, setDobDay] = useState(0);
  const [dobMonth, setDobMonth] = useState(0);
  const [dobYear, setDobYear] = useState(0);
  const [cityOfBirth, setCityOfBirth] = useState('');
  const [countryOfBirth, setCountryOfBirth] = useState('');
  const [birthState, setBirthState] = useState('');
  const [nationality, setNationality] = useState('');
  const [nationalityState, setNationalityState] = useState('');
  const [expDay, setExpDay] = useState(0);
  const [expMonth, setExpMonth] = useState(0);
  const [expYear, setExpYear] = useState(0);
  const [occupation, setOccupation] = useState('');
  const [gender, setGender] = useState('');

  const [showDropdown, setShowDropdown] = useState<DropdownState>({
    identityType: false,
    occupation: false,
    gender: false,
  });

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showNationalityModal, setShowNationalityModal] = useState(false);
  const [showCountryOfBirthModal, setShowCountryOfBirthModal] = useState(false);
  const [nationalities, setNationalities] = useState<CountryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [isLoadingNationalities, setIsLoadingNationalities] = useState(false);
  
  const [nationalitySubdivisions, setNationalitySubdivisions] = useState<SubdivisionItem[]>([]);
  const [birthSubdivisions, setBirthSubdivisions] = useState<SubdivisionItem[]>([]);
  
  const [showNationalityStateModal, setShowNationalityStateModal] = useState(false);
  const [showBirthStateModal, setShowBirthStateModal] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  
  const [isLoadingNationalitySubdivisions, setIsLoadingNationalitySubdivisions] = useState(false);
  const [isLoadingBirthSubdivisions, setIsLoadingBirthSubdivisions] = useState(false);
  const [occupations, setOccupations] = useState<{value: string, description: string}[]>([]);
  const [isLoadingOccupations, setIsLoadingOccupations] = useState(false);
  const [proxyToken, setProxyToken] = useState<string | null>(null);

  const hasDob = dobDay > 0 && dobMonth > 0 && dobYear > 0;
  const hasExpiry = expDay > 0 && expMonth > 0 && expYear > 0;

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

  const fetchNationalities = useCallback(async () => {
    setIsLoadingNationalities(true);
    try {
      const mgToken = await fetchProxyToken();
      const response = await fetch(`${API_BASE_URL}/v1/moneygram/countries`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Proxy-Token': mgToken || '',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success && data.data) {
        const countryList = data.data.map((c: { iso3_code?: string; iso3Code?: string; name?: string; country_name?: string }) => ({
          code: c.iso3_code || c.iso3Code || '',
          name: c.name || c.country_name || '',
        }));
        setNationalities(countryList);
      }
    } catch (error: any) {
      console.error('Nationalities error:', error.message);
    } finally {
      setIsLoadingNationalities(false);
    }
  }, [token, fetchProxyToken]);

  const fetchOccupations = useCallback(async () => {
    setIsLoadingOccupations(true);
    try {
      const mgToken = await fetchProxyToken();
      console.log('=== OCCUPATION DEBUG ===');
      console.log('Token:', token ? 'present' : 'missing');
      console.log('ProxyToken:', mgToken ? 'present' : 'missing');
      
      const response = await fetch(`${API_BASE_URL}/v1/moneygram/enumerations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Proxy-Token': mgToken || '',
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Full response structure:', JSON.stringify(data).substring(0, 500));
      
      // Extract occupations from the enumerations response
      // Response format: { data: [{ name: "OCCUPATION", items: [{ value, description }, ...] }] }
      let occupationList: {value: string, description: string}[] = [];
      
      const dataArray = data?.data;
      if (Array.isArray(dataArray)) {
        // Find the OCCUPATION object in the array
        const occupationObj = dataArray.find((item: any) => item?.name === 'OCCUPATION');
        console.log("data occ",occupationObj);
        if (occupationObj && Array.isArray(occupationObj.items)) {
          occupationList = occupationObj.items.map((item: any) => ({
            value: item.value,
            description: item.description || item.value
          }));
        }
      }
      
    
      
      if (occupationList.length > 0) {
        console.log('Setting occupations from API:', occupationList.length);
        setOccupations(occupationList);
      } else {
        // Fallback to default occupations
        console.log('Using fallback occupations');
        const fallback = [
          { value: 'ENTREPRENEUR', description: 'Entrepreneur' },
          { value: 'EMPLOYEE', description: 'Employee' },
          { value: 'STUDENT', description: 'Student' },
          { value: 'GOVERNMENT', description: 'Government' },
          { value: 'FREELANCER', description: 'Freelancer' },
          { value: 'OTHER', description: 'Other' }
        ];
        setOccupations(fallback);
      }
    } catch (error) {
      console.error('Error fetching occupations:', error);
      setOccupations([
        { value: 'ENTREPRENEUR', description: 'Entrepreneur' },
        { value: 'EMPLOYEE', description: 'Employee' },
        { value: 'STUDENT', description: 'Student' },
        { value: 'GOVERNMENT', description: 'Government' },
        { value: 'FREELANCER', description: 'Freelancer' },
        { value: 'OTHER', description: 'Other' }
      ]);
    } finally {
      console.log('Final occupations state:', occupations);
      setIsLoadingOccupations(false);
    }
  }, [token, fetchProxyToken]);

  const fetchSubdivisions = useCallback(async (countryCode: string, type: 'nationality' | 'birth') => {
    const setLoading = type === 'nationality' ? setIsLoadingNationalitySubdivisions : setIsLoadingBirthSubdivisions;
    const setSubs = type === 'nationality' ? setNationalitySubdivisions : setBirthSubdivisions;
    const setVal = type === 'nationality' ? setNationalityState : setBirthState;

    setLoading(true);
    setSubs([]);
    setVal('');
    try {
      const mgToken = await fetchProxyToken();
      const response = await fetch(`${API_BASE_URL}/v1/moneygram/countries/${countryCode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Proxy-Token': mgToken || '',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      console.log(`${type} subdivision response:`, JSON.stringify(data).substring(0, 500));

      const subs = data?.data?.subdivisions || data?.subdivisions || [];
      if (Array.isArray(subs) && subs.length > 0) {
        const subdivisionList: SubdivisionItem[] = subs.map((s: any) => ({
          code: s.code || s.subdivision_code || s.subdivisionCode || '',
          name: s.name || s.subdivision_name || s.subdivisionName || s.code || '',
        }));
        setSubs(subdivisionList);
      } else {
        setSubs([]);
      }
    } catch (error: any) {
      console.error(`${type} subdivisions error:`, error.message);
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }, [token, fetchProxyToken]);

  useEffect(() => {
    fetchNationalities();
    fetchOccupations();
  }, [fetchNationalities, fetchOccupations]);

  const filteredNationalities = searchQuery.trim()
    ? nationalities.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : nationalities;

  const getFilteredStates = (subs: SubdivisionItem[]) => stateSearch.trim()
    ? subs.filter(
        (s) =>
          s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
          s.code.toLowerCase().includes(stateSearch.toLowerCase()),
      )
    : subs;

  const isFormValid =
    identityType.length > 0 &&
    identityNumber.length > 0 &&
    hasDob &&
    cityOfBirth.length > 0 &&
    countryOfBirth.length > 0 &&
    (birthSubdivisions.length === 0 || birthState.length > 0) &&
    nationality.length > 0 &&
    (nationalitySubdivisions.length === 0 || nationalityState.length > 0) &&
    hasExpiry &&
    occupation.length > 0 &&
    gender.length > 0;

  const toggleDropdown = (key: keyof DropdownState) => {
    setShowDropdown((prev) => ({
      identityType: false,
      occupation: false,
      gender: false,
      [key]: !prev[key],
    }));
  };

  const handleNext = () => {
    // Validate form before proceeding
    if (!isFormValid) {
      return;
    }
    updateKYCData({
      identityType: IDENTITY_MAPPING[identityType] || identityType,
      identityNumber,
      dobDay,
      dobMonth,
      dobYear,
      cityOfBirth,
      countryOfBirth,
      birthState,
      nationality,
      nationalityState,
      expDay,
      expMonth,
      expYear,
      occupation,
      occupationDescription: occupations.find(o => o.value === occupation)?.description || occupation,
      gender,
    });
    router.push('/(kyc)/verify-id-card');
  };

  function renderOccupationDropdown() {
    if (!showDropdown.occupation) return null;
    return (
      <View style={styles.dropdownList}>
        {occupations.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.dropdownItem, occupation === item.value && styles.dropdownItemSelected]}
            onPress={() => {
              setOccupation(item.value);
              toggleDropdown('occupation');
            }}
          >
            <Text style={[styles.dropdownItemText, occupation === item.value && styles.dropdownItemTextSelected]}>
              {item.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderDropdown(
    items: string[],
    selected: string,
    onSelect: (val: string) => void,
    key: keyof DropdownState,
  ) {
    if (!showDropdown[key]) return null;
    return (
      <View style={styles.dropdownList}>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.dropdownItem, selected === item && styles.dropdownItemSelected]}
            onPress={() => {
              onSelect(item);
              toggleDropdown(key);
            }}
          >
            <Text style={[styles.dropdownItemText, selected === item && styles.dropdownItemTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <ScreenLayout title={t('kyc.title')}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>{t('kyc.identity.subtitle')}</Text>

        {/* Identity Type */}
        <Text style={styles.label}>{t('kyc.identity.typeLabel')}</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => toggleDropdown('identityType')}>
          <Text style={[styles.pickerText, !identityType && styles.placeholderText]}>
            {identityType || t('kyc.identity.typePlaceholder')}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.grayText} />
        </TouchableOpacity>
        {renderDropdown(IDENTITY_TYPES, identityType, setIdentityType, 'identityType')}

        {/* Identity Number */}
        <Text style={styles.label}>{t('kyc.identity.numberLabel')}</Text>
        <TextInput
          style={styles.input}
          value={identityNumber}
          onChangeText={setIdentityNumber}
          placeholder={t('kyc.identity.numberPlaceholder')}
          placeholderTextColor={Colors.grayText}
        />

        {/* Date of Birth */}
        <Text style={styles.label}>{t('kyc.identity.dobLabel')}</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDobPicker(true)}>
          <Text style={[styles.pickerText, !hasDob && styles.placeholderText]}>
            {hasDob ? formatDate(dobDay, dobMonth, dobYear) : t('kyc.identity.dobPlaceholder')}
          </Text>
          <Ionicons name="calendar-outline" size={18} color={Colors.grayText} />
        </TouchableOpacity>

        <DatePickerModal
          visible={showDobPicker}
          onClose={() => setShowDobPicker(false)}
          title={t('kyc.identity.dobModalTitle')}
          initialDay={dobDay || 1}
          initialMonth={dobMonth || 1}
          initialYear={dobYear || 2000}
          minYear={1930}
          maxYear={new Date().getFullYear()}
          onConfirm={(d, m, y) => {
            setDobDay(d);
            setDobMonth(m);
            setDobYear(y);
            setShowDobPicker(false);
          }}
        />

        {/* Country of Birth */}
        <Text style={styles.label}>{t('kyc.identity.countryOfBirthLabel')}</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCountryOfBirthModal(true)}>
          <Text style={[styles.pickerText, !countryOfBirth && styles.placeholderText]}>
            {nationalities.find(n => n.code === countryOfBirth)?.name || countryOfBirth || t('kyc.identity.countryOfBirthPlaceholder')}
          </Text>
          {isLoadingNationalities ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="chevron-down" size={16} color={Colors.grayText} />
          )}
        </TouchableOpacity>

        {/* Birth State (shown when subdivisions available) */}
        {(isLoadingBirthSubdivisions || birthSubdivisions.length > 0) && (
          <>
            <Text style={styles.label}>{t('kyc.identity.birthStateLabel')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowBirthStateModal(true)}
              disabled={isLoadingBirthSubdivisions}
            >
              <Text style={[styles.pickerText, !birthState && styles.placeholderText]}>
                {birthSubdivisions.find(s => s.code === birthState)?.name || birthState || t('kyc.identity.birthStatePlaceholder')}
              </Text>
              {isLoadingBirthSubdivisions ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="chevron-down" size={16} color={Colors.grayText} />
              )}
            </TouchableOpacity>

            <Modal visible={showBirthStateModal} animationType="slide" presentationStyle="pageSheet">
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('kyc.identity.birthStateLabel')}</Text>
                  <TouchableOpacity onPress={() => { setShowBirthStateModal(false); setStateSearch(''); }}>
                    <Ionicons name="close" size={24} color={Colors.black} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSearchContainer}>
                  <Ionicons name="search" size={18} color={Colors.grayText} />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder={t('kyc.identity.birthStatePlaceholder')}
                    placeholderTextColor={Colors.grayText}
                    value={stateSearch}
                    onChangeText={setStateSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {stateSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setStateSearch('')}>
                      <Ionicons name="close-circle" size={18} color={Colors.grayText} />
                    </TouchableOpacity>
                  )}
                </View>

                <FlatList
                  data={getFilteredStates(birthSubdivisions)}
                  keyExtractor={(item, index) => `${item.code}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, birthState === item.code && styles.modalItemSelected]}
                      onPress={() => {
                        setBirthState(item.code);
                        setShowBirthStateModal(false);
                        setStateSearch('');
                      }}
                    >
                      <Text style={[styles.modalItemText, birthState === item.code && styles.modalItemTextSelected]}>
                        {item.name}
                      </Text>
                      {birthState === item.code && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                  contentContainerStyle={styles.modalList}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </Modal>
          </>
        )}

        {/* City of Birth */}
        <Text style={styles.label}>{t('kyc.identity.cityOfBirthLabel')}</Text>
        <TextInput
          style={styles.input}
          value={cityOfBirth}
          onChangeText={setCityOfBirth}
          placeholder={t('kyc.identity.cityOfBirthPlaceholder')}
          placeholderTextColor={Colors.grayText}
        />

        {/* Nationality */}
        <Text style={styles.label}>{t('kyc.identity.nationalityLabel')}</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowNationalityModal(true)}>
          <Text style={[styles.pickerText, !nationality && styles.placeholderText]}>
            {nationalities.find(n => n.code === nationality)?.name || nationality || t('kyc.identity.nationalityPlaceholder')}
          </Text>
          {isLoadingNationalities ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="chevron-down" size={16} color={Colors.grayText} />
          )}
        </TouchableOpacity>

        <Modal visible={showNationalityModal || showCountryOfBirthModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('kyc.personalDetails.selectCountryTitle')}</Text>
              <TouchableOpacity onPress={() => { setShowNationalityModal(false); setShowCountryOfBirthModal(false); setSearchQuery(''); }}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search" size={18} color={Colors.grayText} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('kyc.personalDetails.countrySearch')}
                placeholderTextColor={Colors.grayText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.grayText} />
                </TouchableOpacity>
              )}
            </View>

            {isLoadingNationalities ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filteredNationalities}
                keyExtractor={(item, index) => `${item.code}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, (showNationalityModal ? nationality : countryOfBirth) === item.code && styles.modalItemSelected]}
                    onPress={() => {
                      if (showNationalityModal) {
                        setNationality(item.code);
                        setShowNationalityModal(false);
                        fetchSubdivisions(item.code, 'nationality');
                      } else {
                        setCountryOfBirth(item.code);
                        setShowCountryOfBirthModal(false);
                        fetchSubdivisions(item.code, 'birth');
                      }
                      setSearchQuery('');
                    }}
                  >
                    <Text style={[styles.modalItemText, (showNationalityModal ? nationality : countryOfBirth) === item.code && styles.modalItemTextSelected]}>
                      {item.name}
                    </Text>
                    {(showNationalityModal ? nationality : countryOfBirth) === item.code && (
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

        {/* Nationality State (shown when subdivisions available) */}
        {(isLoadingNationalitySubdivisions || nationalitySubdivisions.length > 0) && (
          <>
            <Text style={styles.label}>{t('kyc.identity.nationalityLabel')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowNationalityStateModal(true)}
              disabled={isLoadingNationalitySubdivisions}
            >
              <Text style={[styles.pickerText, !nationalityState && styles.placeholderText]}>
                {nationalitySubdivisions.find(s => s.code === nationalityState)?.name || nationalityState || t('kyc.identity.birthStatePlaceholder')}
              </Text>
              {isLoadingNationalitySubdivisions ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="chevron-down" size={16} color={Colors.grayText} />
              )}
            </TouchableOpacity>

            <Modal visible={showNationalityStateModal} animationType="slide" presentationStyle="pageSheet">
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('kyc.identity.nationalityLabel')}</Text>
                  <TouchableOpacity onPress={() => { setShowNationalityStateModal(false); setStateSearch(''); }}>
                    <Ionicons name="close" size={24} color={Colors.black} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSearchContainer}>
                  <Ionicons name="search" size={18} color={Colors.grayText} />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder={t('kyc.identity.birthStatePlaceholder')}
                    placeholderTextColor={Colors.grayText}
                    value={stateSearch}
                    onChangeText={setStateSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {stateSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setStateSearch('')}>
                      <Ionicons name="close-circle" size={18} color={Colors.grayText} />
                    </TouchableOpacity>
                  )}
                </View>

                <FlatList
                  data={getFilteredStates(nationalitySubdivisions)}
                  keyExtractor={(item, index) => `${item.code}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, nationalityState === item.code && styles.modalItemSelected]}
                      onPress={() => {
                        setNationalityState(item.code);
                        setShowNationalityStateModal(false);
                        setStateSearch('');
                      }}
                    >
                      <Text style={[styles.modalItemText, nationalityState === item.code && styles.modalItemTextSelected]}>
                        {item.name}
                      </Text>
                      {nationalityState === item.code && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                  contentContainerStyle={styles.modalList}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </Modal>
          </>
        )}



        {/* Expiry Date */}
        <Text style={styles.label}>{t('kyc.identity.expiryLabel')}</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowExpiryPicker(true)}>
          <Text style={[styles.pickerText, !hasExpiry && styles.placeholderText]}>
            {hasExpiry ? formatDate(expDay, expMonth, expYear) : t('kyc.identity.dobPlaceholder')}
          </Text>
          <Ionicons name="calendar-outline" size={18} color={Colors.grayText} />
        </TouchableOpacity>

        <DatePickerModal
          visible={showExpiryPicker}
          onClose={() => setShowExpiryPicker(false)}
          title={t('kyc.identity.expiryLabel')}
          initialDay={expDay || 1}
          initialMonth={expMonth || 1}
          initialYear={expYear || new Date().getFullYear() + 1}
          minYear={new Date().getFullYear()}
          maxYear={2040}
          onConfirm={(d, m, y) => {
            setExpDay(d);
            setExpMonth(m);
            setExpYear(y);
            setShowExpiryPicker(false);
          }}
        />

        {/* Occupation */}
        <Text style={styles.label}>{t('kyc.identity.occupationLabel')}</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => toggleDropdown('occupation')}>
          <Text style={[styles.pickerText, !occupation && styles.placeholderText]}>
            {occupations.find(o => o.value === occupation)?.description || occupation || t('kyc.identity.occupationPlaceholder')}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.grayText} />
        </TouchableOpacity>
        {renderOccupationDropdown()}

        {/* Gender */}
        <Text style={styles.label}>{t('kyc.identity.genderLabel')}</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => toggleDropdown('gender')}>
          <Text style={[styles.pickerText, !gender && styles.placeholderText]}>
            {gender || t('kyc.identity.genderPlaceholder')}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.grayText} />
        </TouchableOpacity>
        {renderDropdown(['Male', 'Female'], gender, setGender, 'gender')}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, !isFormValid && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid}
        >
          <Text style={styles.nextButtonText}>{t('kyc.identity.nextButton')}</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 15, fontWeight: '600', color: Colors.black, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.black, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
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
    minHeight: 46,
  },
  pickerText: { fontSize: 14, color: Colors.black },
  placeholderText: { color: Colors.grayText },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: Colors.white,
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemSelected: { backgroundColor: Colors.gray },
  dropdownItemText: { fontSize: 14, color: Colors.black },
  dropdownItemTextSelected: { color: Colors.primary, fontWeight: '600' },
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
  bottomContainer: { padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: Colors.grayBorder },
  nextButton: { backgroundColor: Colors.primary, borderRadius: 25, paddingVertical: 16, alignItems: 'center' },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
