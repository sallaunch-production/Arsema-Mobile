import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';

interface Beneficiary {
  id: string;
  firstName: string;
  middleName: string;
  lastName1: string;
  phone: string;
}

interface TransactionField {
  fieldName: string;
  displayName: string;
  dataType: string;
  required: boolean;
  fieldMax?: number;
  fieldMin?: number;
  exampleText?: string;
  regEx?: string;
  enumValues?: { value: string; label: string }[];
  readOnly?: boolean;
}

interface BangladeshBank {
  id: string;
  bankName: string;
  branch: string;
  routingNumber: string;
  district?: string;
}

export default function BeneficiaryDetailsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { token } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Beneficiary[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [transactionFields, setTransactionFields] = useState<TransactionField[]>([]);

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName1, setLastName1] = useState('');
  const [phone, setPhone] = useState('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [saveToDirectory, setSaveToDirectory] = useState(true);

  const destinationIso3 = params.destinationIso3Code || params.destinationCountry || '';
  const isBangladesh = destinationIso3.toUpperCase() === 'BGD';
  const serviceName = (params.serviceOptionName || '').toLowerCase();
  const isBankDeposit = isBangladesh && (serviceName.includes('bank') || serviceName.includes('deposit') || serviceName.includes('account'));

  const [bdBankQuery, setBdBankQuery] = useState('');
  const [bdBankResults, setBdBankResults] = useState<BangladeshBank[]>([]);
  const [bdBankSearching, setBdBankSearching] = useState(false);
  const [bdBankShowResults, setBdBankShowResults] = useState(false);
  const [bdSelectedBank, setBdSelectedBank] = useState<BangladeshBank | null>(null);

  const isFormValid = firstName.length > 0 && lastName1.length > 0 && phone.length > 0;

  // Fetch transaction fields on mount
  useEffect(() => {
    const fetchTransactionFields = async () => {
      try {
        const destinationCountryCode = params.destinationIso3Code || params.destinationCountry || '';
        const serviceOptionCode = params.serviceOptionCode || '';
        const serviceOptionRoutingCode = params.serviceOptionRoutingCode || '';
        const amount = params.amount || '';
        const sendCurrencyCode = params.sendCurrencyCode || 'IDR';
        const receiveCurrencyCode = params.receiveCurrencyCode || '';

        const queryParams = new URLSearchParams({
          destinationCountryCode,
          serviceOptionCode,
          amount,
          sendCurrencyCode,
          receiveCurrencyCode,
        });
        if (serviceOptionRoutingCode) {
          queryParams.append('serviceOptionRoutingCode', serviceOptionRoutingCode);
        }

        let url = `${API_BASE_URL}/v1/moneygram/transaction-fields-send?${queryParams.toString()}`;

        console.log('Fetching transaction fields:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Proxy-Token': params.proxyToken || '',
            'Content-Type': 'application/json',
          },
        });

        const text = await response.text();
        console.log('Transaction Fields Response:', text);

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          console.error('Non-JSON response:', text.substring(0, 200));
          return;
        }

        if (response.ok && data) {
          const responseData = data.data || data;

          // Extract fieldInfo array from response
          let fieldInfoList: any[] = [];
          if (Array.isArray(responseData)) {
            // Response may be array of objects with fieldInfo
            for (const item of responseData) {
              if (item.fieldInfo) {
                fieldInfoList = item.fieldInfo;
                break;
              }
            }
            // Fallback: responseData itself might be the fieldInfo array
            if (fieldInfoList.length === 0) {
              fieldInfoList = responseData;
            }
          } else if (responseData.fieldInfo) {
            fieldInfoList = responseData.fieldInfo;
          }

          console.log('FieldInfo count:', fieldInfoList.length);

          // Fields already handled by the static form
          const staticReceiverFields = [
            'receiver.name.firstName',
            'receiver.name.middleName',
            'receiver.name.lastName',
            'receiver.name.lastName1',
            'receiver.mobilePhone.number',
          ];

          // Show fields where field starts with "receiver." or "targetAccount." and required is true
          const dynamicFieldsList = fieldInfoList
            .filter((f: any) => {
              const field = f.field || f.key || '';
              const isReceiver = field.startsWith('receiver.') && !staticReceiverFields.includes(field);
              const isTargetAccount = field.startsWith('targetAccount.');
              return (isReceiver || isTargetAccount) && f.required === true;
            })
            .map((f: any) => ({
              fieldName: f.field || f.key,
              displayName: f.fieldLabel || f.displayName || f.field || f.key,
              dataType: f.dataType || 'string',
              required: true,
              fieldMax: f.fieldMax ? Number(f.fieldMax) : undefined,
              fieldMin: f.fieldMin ? Number(f.fieldMin) : undefined,
              exampleText: f.exampleText || '',
              regEx: f.regEx || '',
              enumValues: (f.enumerationItem || []).map((e: any) => {
                console.log('Enum item raw:', JSON.stringify(e));
                return {
                  value: e.value || e.code || e.key || '',
                  label: e.description || e.label || e.name || e.value || '',
                };
              }),
            }));

          console.log('Dynamic fields:', JSON.stringify(dynamicFieldsList));
          setTransactionFields(dynamicFieldsList);
        }
      } catch (error) {
        console.error('Error fetching transaction fields:', error);
      } finally {
        setIsLoadingFields(false);
      }
    };

    fetchTransactionFields();
  }, [token, params.destinationCountry, params.serviceOptionCode, params.amount, params.receiveCurrencyCode]);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/beneficiaries/search?name=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (response.ok && data) {
        const list = Array.isArray(data) ? data : (data.data || data.beneficiaries || []);
        const mapped: Beneficiary[] = list.map((b: any) => ({
          id: String(b.id || b.ID || ''),
          firstName: b.firstName || b.first_name || '',
          middleName: b.middleName || b.middle_name || '',
          lastName1: b.lastName || b.lastName1 || b.last_name || '',
          phone: b.phone || b.phoneNumber || b.phone_number || '',
        }));
        setSearchResults(mapped);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(true);
      }
    } catch {
      Alert.alert('Error', t('mg.beneficiary.searchError'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBeneficiary = (b: Beneficiary) => {
    setFirstName(b.firstName);
    setMiddleName(b.middleName);
    setLastName1(b.lastName1);
    setPhone(b.phone);
    setShowResults(false);
    setSearchQuery('');
  };

  const searchBangladeshBanks = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setBdBankResults([]);
      setBdBankShowResults(false);
      return;
    }

    setBdBankSearching(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/bangladesh-banks/search?q=${encodeURIComponent(trimmed)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      console.log('Bangladesh banks raw response:', text.substring(0, 500));

      if (response.ok && data) {
        const list = Array.isArray(data) ? data : (data.data || []);
        const mapped: BangladeshBank[] = list.map((b: any) => ({
          id: String(b.id || b.ID || b._id || ''),
          bankName: b.bank_name || b.bankName || b.bank || b.Bank_Name || b.BANK_NAME || '',
          branch: b.branch || b.branch_name || b.branchName || b.Branch_Name || b.BRANCH_NAME || b.Branch || '',
          routingNumber: String(
            b.routing_number || b.routingNumber || b.routing || b.routing_no || b.Route_No ||
            b.route_no || b.ROUTING_NUMBER || b.Routing_Number || b.routingNumber || ''
          ),
          district: b.district || b.district_name || b.District || '',
        }));
        setBdBankResults(mapped);
        setBdBankShowResults(true);
      } else {
        setBdBankResults([]);
        setBdBankShowResults(true);
      }
    } catch {
      setBdBankResults([]);
      setBdBankShowResults(true);
    } finally {
      setBdBankSearching(false);
    }
  };

  const routingFieldMatch = (name: string) =>
    name.toLowerCase().includes('routing') ||
    name.toLowerCase().includes('bankidentifier') ||
    name.toLowerCase().includes('bankrouting');

  const routingFieldName = transactionFields.find(f => routingFieldMatch(f.fieldName))?.fieldName || 'targetAccount.routingNumber';

  const handleSelectBdBank = (bank: BangladeshBank) => {
    setBdSelectedBank(bank);
    setBdBankShowResults(false);
    setBdBankQuery('');
    const fieldKey = transactionFields.find(f => routingFieldMatch(f.fieldName))?.fieldName || 'targetAccount.routingNumber';
    setDynamicFields((prev) => ({
      ...prev,
      [fieldKey]: bank.routingNumber,
    }));
  };

  const handleRemoveBdBank = () => {
    setBdSelectedBank(null);
    const fieldKey = transactionFields.find(f => routingFieldMatch(f.fieldName))?.fieldName || 'targetAccount.routingNumber';
    setDynamicFields((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const saveBeneficiary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/beneficiaries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName1,
          phone_number: phone,
        }),
      });

      const text = await response.text();
      try {
        JSON.parse(text);
      } catch {
        // non-JSON response, ignore
      }

      if (!response.ok) {
        Alert.alert('Warning', 'Beneficiary saved but server returned an error');
      }
    } catch {
      Alert.alert('Warning', 'Failed to save beneficiary to directory');
    }
  };

  const handleDynamicFieldChange = (fieldName: string, value: string) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    setDynamicFields((prev) => ({ ...prev, [fieldName]: stringValue }));
  };

  const handleNext = async () => {
    if (!isFormValid) return;

    if (saveToDirectory) {
      setIsSaving(true);
      await saveBeneficiary();
      setIsSaving(false);
    }

    console.log('Dynamic fields before submit:', JSON.stringify(dynamicFields));
    const targetAccountEntries: { key: string; value: string }[] = [];
    const receiverDynamicData: Record<string, string> = {};
    for (const [key, rawValue] of Object.entries(dynamicFields)) {
      const value = (rawValue as any) && typeof (rawValue as any) === 'object' ? String((rawValue as any).value ?? '') : String(rawValue ?? '');
      if (key.startsWith('targetAccount.')) {
        targetAccountEntries.push({ key: key.replace('targetAccount.', ''), value });
      } else if (key.startsWith('receiver.')) {
        receiverDynamicData[key] = value;
      } else {
        targetAccountEntries.push({ key, value });
      }
    }

    router.push({
      pathname: '/(moneygram)/sending-details',
      params: {
        ...params,
        beneficiaryFirstName: firstName,
        beneficiaryMiddleName: middleName,
        beneficiaryLastName1: lastName1,
        beneficiaryPhone: phone,
        targetAccount: JSON.stringify(targetAccountEntries),
        receiverFields: JSON.stringify(receiverDynamicData),
      },
    });
  };

  const renderDynamicField = (field: TransactionField) => {
    // Use the full key as identifier to avoid collisions between targetAccount and receiver fields
    const shortKey = field.fieldName;
    const value = dynamicFields[shortKey] || '';
    const hasEnum = field.enumValues && field.enumValues.length > 0;

    if (hasEnum) {
      const isOpen = openDropdown === field.fieldName;
      const selectedLabel = field.enumValues!.find((e) => e.value === value)?.label || '';

      return (
        <View key={field.fieldName}>
          <Text style={styles.label}>
            {field.displayName} {field.required && <Text style={styles.required}>*</Text>}
          </Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setOpenDropdown(field.fieldName)}
          >
            <Text style={[styles.selectText, !selectedLabel && styles.placeholderText]}>
              {selectedLabel || `Select ${field.displayName}`}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.grayText} />
          </TouchableOpacity>

          <Modal visible={isOpen} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{field.displayName}</Text>
                  <TouchableOpacity onPress={() => setOpenDropdown(null)}>
                    <Ionicons name="close" size={24} color={Colors.black} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={field.enumValues}
                  keyExtractor={(item, index) => `${item.value}_${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, value === item.value && styles.modalItemSelected]}
                      onPress={() => {
                        handleDynamicFieldChange(shortKey, item.value);
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={[styles.modalItemText, value === item.value && styles.modalItemTextSelected]}>
                        {item.label}
                      </Text>
                      {value === item.value && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
        </View>
      );
    }

    return (
      <View key={field.fieldName}>
        <Text style={styles.label}>
          {field.displayName} {field.required && <Text style={styles.required}>*</Text>}
          {field.readOnly && value ? (
            <Text style={styles.autoFilledBadge}> (auto-filled)</Text>
          ) : null}
        </Text>
        <TextInput
          style={[styles.input, field.readOnly && value ? styles.inputReadOnly : null]}
          placeholder={field.exampleText || `Enter ${field.displayName}`}
          placeholderTextColor={Colors.grayText}
          value={value}
          editable={!field.readOnly}
          onChangeText={(text) => {
            let newText = text;
            
            if (field.regEx === '[0-9]*' || field.dataType === 'NUMERIC' || field.dataType === 'INTEGER') {
              newText = text.replace(/[^0-9]/g, '');
            } else if (field.dataType === 'ALPHA') {
              newText = text.replace(/[^a-zA-Z\s\-]/g, '');
            } else if (field.dataType === 'ALPHANUMERIC' || field.dataType === 'ALPHA_NUMERIC') {
              newText = text.replace(/[^a-zA-Z0-9\s\-]/g, '');
            }
            
            handleDynamicFieldChange(shortKey, newText);
          }}
          maxLength={field.fieldMax}
          keyboardType={field.regEx === '[0-9]*' || field.dataType === 'NUMERIC' ? 'number-pad' : 'default'}
        />
      </View>
    );
  };

  return (
    <ScreenLayout title={t('mg.beneficiary.title')}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search to autofill */}
        <Text style={styles.label}>{t('mg.beneficiary.searchLabel')}</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('mg.beneficiary.searchPlaceholder')}
            placeholderTextColor={Colors.grayText}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (!text.trim()) setShowResults(false);
            }}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchIcon} disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="search" size={20} color={Colors.black} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {showResults && (
          <View style={styles.resultsContainer}>
            {searchResults.length > 0 ? (
              searchResults.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.resultItem}
                  onPress={() => handleSelectBeneficiary(b)}
                >
                  <View style={styles.resultAvatar}>
                    <Text style={styles.resultAvatarText}>
                      {b.firstName?.[0] || ''}{b.lastName1?.[0] || ''}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>
                      {b.firstName}{b.middleName ? ` ${b.middleName}` : ''} {b.lastName1}
                    </Text>
                    <Text style={styles.resultId}>{b.phone}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResultItem}>
                <Text style={styles.noResultText}>{t('mg.beneficiary.noResults')}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.separator} />

        {/* Name Fields */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>
              {t('mg.beneficiary.firstNameLabel')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('mg.beneficiary.firstNamePlaceholder')}
              placeholderTextColor={Colors.grayText}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('mg.beneficiary.middleNameLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('mg.beneficiary.middleNamePlaceholder')}
              placeholderTextColor={Colors.grayText}
              value={middleName}
              onChangeText={setMiddleName}
            />
          </View>
        </View>

        <Text style={styles.label}>
          {t('mg.beneficiary.lastNameLabel')} <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder={t('mg.beneficiary.lastNamePlaceholder')}
          placeholderTextColor={Colors.grayText}
          value={lastName1}
          onChangeText={setLastName1}
        />

        {/* Phone Number */}
        <Text style={styles.label}>
          {t('mg.beneficiary.phoneLabel')} <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder={t('mg.beneficiary.phonePlaceholder')}
          placeholderTextColor={Colors.grayText}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* Bangladesh Bank Search */}
        {isBangladesh && !isLoadingFields && (
          <View style={styles.bdBankSection}>
            <Text style={styles.label}>
              Bank & Branch <Text style={styles.required}>*</Text>
            </Text>

            {bdSelectedBank ? (
              <View style={styles.bdSelectedCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bdSelectedBankName}>{bdSelectedBank.bankName}</Text>
                  <Text style={styles.bdSelectedBranch}>{bdSelectedBank.branch}</Text>
                  {bdSelectedBank.district ? (
                    <Text style={styles.bdSelectedDistrict}>{bdSelectedBank.district}</Text>
                  ) : null}
                  <Text style={styles.bdSelectedRouting}>
                    Routing: {bdSelectedBank.routingNumber}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleRemoveBdBank} style={styles.bdRemoveBtn}>
                  <Ionicons name="close-circle" size={22} color={Colors.error || '#E53935'} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search bank or branch name..."
                    placeholderTextColor={Colors.grayText}
                    value={bdBankQuery}
                    onChangeText={(text) => {
                      setBdBankQuery(text);
                      if (!text.trim()) {
                        setBdBankShowResults(false);
                        setBdBankResults([]);
                      }
                    }}
                    onSubmitEditing={() => searchBangladeshBanks(bdBankQuery)}
                  />
                  <TouchableOpacity
                    onPress={() => searchBangladeshBanks(bdBankQuery)}
                    style={styles.searchIcon}
                    disabled={bdBankSearching}
                  >
                    {bdBankSearching ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Ionicons name="search" size={20} color={Colors.black} />
                    )}
                  </TouchableOpacity>
                </View>

                {bdBankShowResults && (
                  <View style={styles.resultsContainer}>
                    {bdBankResults.length > 0 ? (
                      bdBankResults.slice(0, 20).map((bank) => (
                        <TouchableOpacity
                          key={bank.id}
                          style={styles.resultItem}
                          onPress={() => handleSelectBdBank(bank)}
                        >
                          <View style={styles.bdBankIcon}>
                            <Ionicons name="business" size={20} color={Colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resultName} numberOfLines={1}>{bank.bankName}</Text>
                            <Text style={styles.resultId} numberOfLines={1}>{bank.branch}</Text>
                            {bank.district ? (
                              <Text style={styles.bdDistrictText} numberOfLines={1}>{bank.district}</Text>
                            ) : null}
                          </View>
                          <Text style={styles.bdRoutingSmall}>{bank.routingNumber}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.noResultItem}>
                        <Text style={styles.noResultText}>No banks found</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Dynamic Fields from API */}
        {isLoadingFields ? (
          <View style={styles.loadingFields}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('mg.beneficiary.loadingFields')}</Text>
          </View>
        ) : (
          transactionFields
            .map((field) => {
              if (isBangladesh && routingFieldMatch(field.fieldName) && bdSelectedBank) {
                return { ...field, readOnly: true };
              }
              return field;
            })
            .map((field) => renderDynamicField(field))
        )}

        {/* Save to directory */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setSaveToDirectory(!saveToDirectory)}
        >
          <View style={[styles.checkbox, saveToDirectory && styles.checkboxChecked]}>
            {saveToDirectory && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <Text style={styles.checkboxLabel}>{t('mg.beneficiary.saveDir')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, (!isFormValid || isSaving) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.nextButtonText}>{t('mg.beneficiary.nextButton')}</Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
    marginTop: 16,
  },
  required: {
    color: Colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.black,
    paddingVertical: 14,
  },
  searchIcon: {
    padding: 4,
  },
  resultsContainer: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  resultId: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 2,
  },
  noResultItem: {
    padding: 14,
    alignItems: 'center',
  },
  noResultText: {
    fontSize: 13,
    color: Colors.grayText,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.grayBorder,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.black,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: {
    fontSize: 15,
    color: Colors.black,
  },
  placeholderText: {
    color: Colors.grayText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  modalItemSelected: {
    backgroundColor: '#FFF0F0',
  },
  modalItemText: {
    fontSize: 15,
    color: Colors.black,
  },
  modalItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  loadingFields: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.grayText,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
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
  bdBankSection: {
    marginTop: 4,
  },
  bdSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
  },
  bdSelectedBankName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
  },
  bdSelectedBranch: {
    fontSize: 13,
    color: Colors.black,
    marginTop: 2,
  },
  bdSelectedDistrict: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 1,
  },
  bdSelectedRouting: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  bdRemoveBtn: {
    padding: 4,
    marginLeft: 8,
  },
  bdBankIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bdDistrictText: {
    fontSize: 11,
    color: Colors.grayText,
    marginTop: 1,
  },
  bdRoutingSmall: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  autoFilledBadge: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.primary,
  },
  inputReadOnly: {
    backgroundColor: '#F5F5F5',
    color: Colors.primary,
    fontWeight: '600',
  },
});
