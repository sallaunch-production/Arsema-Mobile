import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';

interface DropdownState {
  country: boolean;
  state: boolean;
  occupation: boolean;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ profileData?: string }>();
  const { token } = useAuth();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<{ value: string; label: string }[]>([]);
  const [states, setStates] = useState<{ value: string; label: string }[]>([]);
  const [occupations, setOccupations] = useState<{ value: string; description: string }[]>([]);

  // Form state
  const [occupation, setOccupation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  const [showDropdown, setShowDropdown] = useState<DropdownState>({
    country: false,
    state: false,
    occupation: false,
  });

  useEffect(() => {
    if (params.profileData) {
      try {
        const parsed = JSON.parse(params.profileData);
        setOccupation(parsed.occupation || '');
        setPhoneNumber(parsed.phone_number || '');
        setAddressLine1(parsed.address_line_1 || '');
        setAddressLine2(parsed.address_line_2 || '');
        setCity(parsed.city || '');
        setStateVal(parsed.state || '');
        setPostalCode(parsed.postal_code || '');
        setCountry(parsed.country || '');
      } catch (e) {
        console.error('Failed to parse profile data', e);
      }
    }
    fetchCountries();
    fetchOccupations();
  }, [params.profileData]);

  useEffect(() => {
    if (country) {
      fetchStates(country);
    } else {
      setStates([]);
    }
  }, [country]);

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/moneygram/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const mapped = data.data.map((c: any) => ({
          value: c.iso3_code || c.iso3Code || c.countryCode || '',
          label: c.name || c.country_name || c.countryName || '',
        }))
          .filter((c: any) => c.value && c.label)
          .sort((a: any, b: any) => a.label.localeCompare(b.label));
        setCountries(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const fetchStates = async (countryCode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/moneygram/countries/${countryCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data && data.data.subdivisions) {
        if (data.data.subdivisions.length > 0) {
          const mapped = data.data.subdivisions.map((s: any) => ({
            value: s.subdivisionCode || s.subdivision_code || '',
            label: s.subdivisionName || s.subdivision_name || s.name || '',
          }))
            .filter((s: any) => s.value && s.label)
            .sort((a: any, b: any) => a.label.localeCompare(b.label));
          setStates(mapped);
        } else {
          setStates([]); // Empty means free text entry
        }
      }
    } catch (error) {
      console.error('Failed to fetch states:', error);
      setStates([]);
    }
  };

  const fetchOccupations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/moneygram/enumerations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data?.occupations) {
        const itemInfo = data.data.occupations[0]?.itemInfo || [];
        setOccupations(itemInfo.map((item: any) => ({
          value: item.itemValue,
          description: item.itemDescription,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch occupations:', error);
    }
  };

  const toggleDropdown = (key: keyof DropdownState) => {
    setShowDropdown((prev) => {
      const newState = { country: false, state: false, occupation: false };
      newState[key] = !prev[key];
      return newState;
    });
  };

  const handleSave = async () => {
    if (!token) return;

    // Basic validation
    if (!occupation || !phoneNumber || !addressLine1 || !city || !stateVal || !postalCode || !country) {
      Alert.alert('Error', t('profile.editProfile.validationError'));
      return;
    }

    try {
      setIsLoading(true);
      const updateData = {
        occupation,
        phone_number: phoneNumber,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city,
        state: stateVal,
        postal_code: postalCode,
        country,
      };

      const response = await fetch(`${API_BASE_URL}/v1/customers/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', t('profile.editProfile.successMessage'), [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', data.message || t('profile.editProfile.failError'));
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', t('profile.editProfile.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderDropdownList = (
    items: { value: string; label: string }[],
    selectedValue: string,
    onSelect: (val: string) => void,
    dropdownKey: keyof DropdownState
  ) => {
    if (!showDropdown[dropdownKey]) return null;
    return (
      <View style={styles.dropdownList}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.dropdownItem, selectedValue === item.value && styles.dropdownItemSelected]}
            onPress={() => {
              onSelect(item.value);
              toggleDropdown(dropdownKey);
            }}
          >
            <Text style={[styles.dropdownItemText, selectedValue === item.value && styles.dropdownItemTextSelected]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScreenLayout title={t('profile.editProfile.title')}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

        {/* Occupation */}
        <Text style={styles.label}>{t('profile.editProfile.occupationLabel')}</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => toggleDropdown('occupation')}>
          <Text style={[styles.pickerText, !occupation && styles.placeholderText]}>
            {occupations.find(o => o.value === occupation)?.description || occupation || t('profile.editProfile.occupationPlaceholder')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.grayText} />
        </TouchableOpacity>
        {showDropdown.occupation && (
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
        )}

        {/* Phone Number */}
        <Text style={styles.label}>{t('profile.editProfile.phoneLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('profile.editProfile.phonePlaceholder')}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />

        {/* Country */}
        <Text style={styles.label}>{t('profile.editProfile.countryLabel')}</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => toggleDropdown('country')}>
          <Text style={[styles.pickerText, !country && styles.placeholderText]}>
            {countries.find(c => c.value === country)?.label || country || t('profile.editProfile.countryPlaceholder')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.grayText} />
        </TouchableOpacity>
        {renderDropdownList(countries, country, setCountry, 'country')}

        {/* State */}
        <Text style={styles.label}>{t('profile.editProfile.stateLabel')}</Text>
        {states.length > 0 ? (
          <TouchableOpacity style={styles.pickerButton} onPress={() => toggleDropdown('state')}>
            <Text style={[styles.pickerText, !stateVal && styles.placeholderText]}>
              {states.find(s => s.value === stateVal)?.label || stateVal || t('profile.editProfile.statePlaceholder')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.grayText} />
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.input}
            placeholder={t('profile.editProfile.stateInputPlaceholder')}
            value={stateVal}
            onChangeText={setStateVal}
          />
        )}
        {states.length > 0 && renderDropdownList(states, stateVal, setStateVal, 'state')}

        {/* City and Postal Code format matching KYC screen */}
        <Text style={styles.label}>{t('profile.editProfile.cityLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('profile.editProfile.cityPlaceholder')}
          value={city}
          onChangeText={setCity}
        />

        <Text style={styles.label}>{t('profile.editProfile.postalLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('profile.editProfile.postalPlaceholder')}
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="default"
        />

        {/* Address */}
        <Text style={styles.label}>{t('profile.editProfile.address1Label')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('profile.editProfile.address1Placeholder')}
          value={addressLine1}
          onChangeText={setAddressLine1}
        />

        <Text style={styles.label}>{t('profile.editProfile.address2Label')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('profile.editProfile.address2Placeholder')}
          value={addressLine2}
          onChangeText={setAddressLine2}
        />

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('profile.editProfile.saveButton')}</Text>
          )}
        </TouchableOpacity>

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
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.white,
  },
  pickerText: {
    fontSize: 15,
    color: Colors.black,
    flex: 1,
  },
  placeholderText: {
    color: Colors.grayText,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: Colors.white,
    maxHeight: 250,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF8E1',
  },
  dropdownItemText: {
    fontSize: 15,
    color: Colors.black,
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
