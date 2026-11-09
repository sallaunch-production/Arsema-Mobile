// app/(profile)/language.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useLanguage } from '../../contexts/language-context';

export default function LanguageScreen() {
  const { language, setLanguage, t } = useLanguage();

  const options = [
    { code: 'en' as const, label: t('profile.language.english'), flag: '🇬🇧' },
    { code: 'id' as const, label: t('profile.language.indonesian'), flag: '🇮🇩' },
  ];

  return (
    <ScreenLayout title={t('profile.language.title')}>
      <ScrollView contentContainerStyle={styles.container}>
        {options.map((option, i) => (
          <TouchableOpacity
            key={option.code}
            style={[styles.row, i < options.length - 1 && styles.rowBorder]}
            activeOpacity={0.7}
            onPress={() => setLanguage(option.code)}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.flag}>{option.flag}</Text>
              <Text style={styles.label}>{option.label}</Text>
            </View>
            {language === option.code && (
              <Ionicons name="checkmark" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flag: {
    fontSize: 24,
  },
  label: {
    fontSize: FontSize.md,
    color: Colors.black,
    fontWeight: '500',
  },
});
