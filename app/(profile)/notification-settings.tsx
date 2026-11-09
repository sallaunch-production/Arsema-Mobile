// app/(profile)/notification-settings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useLanguage } from '../../contexts/language-context';

const NOTIF_KEYS = {
  transactions: 'notif_transactions',
  promotions: 'notif_promotions',
  system: 'notif_system',
} as const;

export default function NotificationSettingsScreen() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [system, setSystem] = useState(true);

  useEffect(() => {
    const loadPrefs = async () => {
      const [tx, promo, sys] = await Promise.all([
        AsyncStorage.getItem(NOTIF_KEYS.transactions),
        AsyncStorage.getItem(NOTIF_KEYS.promotions),
        AsyncStorage.getItem(NOTIF_KEYS.system),
      ]);
      if (tx !== null) setTransactions(tx !== 'false');
      if (promo !== null) setPromotions(promo !== 'false');
      if (sys !== null) setSystem(sys !== 'false');
    };
    loadPrefs();
  }, []);

  const handleToggle = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    await AsyncStorage.setItem(key, value ? 'true' : 'false');
  };

  const rows = [
    {
      label: t('profile.notifSettings.transactions'),
      desc: t('profile.notifSettings.transactionsDesc'),
      value: transactions,
      key: NOTIF_KEYS.transactions,
      setter: setTransactions,
    },
    {
      label: t('profile.notifSettings.promotions'),
      desc: t('profile.notifSettings.promotionsDesc'),
      value: promotions,
      key: NOTIF_KEYS.promotions,
      setter: setPromotions,
    },
    {
      label: t('profile.notifSettings.system'),
      desc: t('profile.notifSettings.systemDesc'),
      value: system,
      key: NOTIF_KEYS.system,
      setter: setSystem,
    },
  ];

  return (
    <ScreenLayout title={t('profile.notifSettings.title')}>
      <ScrollView contentContainerStyle={styles.container}>
        {rows.map((row, i) => (
          <View key={row.key} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowDesc}>{row.desc}</Text>
            </View>
            <Switch
              value={row.value}
              onValueChange={(v) => handleToggle(row.key, v, row.setter)}
              trackColor={{ false: Colors.grayBorder, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
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
    paddingVertical: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  rowDesc: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
    lineHeight: 18,
  },
});
