import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';

interface Country {
  code: string;
  iso3Code: string;
  name: string;
  flag: string;
  receiveCurrencies: string[];
}

export default function DestinationCountryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ countries?: string; selectedCode?: string }>();

  const countries: Country[] = useMemo(() => {
    if (params.countries) {
      try {
        return JSON.parse(params.countries);
      } catch {
        return [];
      }
    }
    return [];
  }, [params.countries]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    params.selectedCode || null,
  );

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query),
    );
  }, [countries, searchQuery]);

  const handleSelect = (country: Country) => {
    setSelectedCountry(country.code);
    router.navigate({
      pathname: '/(moneygram)/transfer',
      params: {
        selectedCountryCode: country.code,
        selectedIso3Code: country.iso3Code,
        selectedCountryName: country.name,
        selectedCountryFlag: country.flag,
        selectedReceiveCurrencies: JSON.stringify(country.receiveCurrencies || []),
      },
    });
  };

  const renderItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryRow}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.flag}>{item.flag || '🏳️'}</Text>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.countryCode}>{item.code}</Text>
      </View>
      {selectedCountry === item.code && (
        <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenLayout title="Destination Country">
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.grayText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search country..."
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

        {filteredCountries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="earth-outline" size={48} color={Colors.grayText} />
            <Text style={styles.emptyText}>
              {countries.length === 0
                ? 'No countries available'
                : 'No countries match your search'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCountries}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.code}-${index}`}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.black,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  flag: {
    fontSize: 28,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '500',
  },
  countryCode: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.grayBorder,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.grayText,
    textAlign: 'center',
  },
});
