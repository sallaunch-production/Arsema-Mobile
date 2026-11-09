import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useLanguage } from '../contexts/language-context';

interface ServiceItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ServiceGridProps {
  onServicePress?: (serviceId: string) => void;
}

export const ServiceGrid = ({ onServicePress }: ServiceGridProps) => {
  const { t } = useLanguage();

  const topRow: ServiceItem[] = [
    { id: 'send-moneygram', label: t('home.service.sendMoneygram'), icon: 'send' },
    { id: 'receive-moneygram', label: t('home.service.receiveMoneygram'), icon: 'download' },
    { id: 'local-transfer', label: t('home.service.localTransfer'), icon: 'swap-horizontal' },
  ];

  const bottomRow: ServiceItem[] = [
    { id: 'bill-payment', label: t('home.service.billPayment'), icon: 'card' },
    { id: 'more', label: t('home.service.more'), icon: 'grid-outline' },
  ];

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        {topRow.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.serviceItem}
            onPress={() => onServicePress?.(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={24} color={Colors.white} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.row}>
        {bottomRow.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.serviceItem}
            onPress={() => onServicePress?.(item.id)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              item.id === 'more' && styles.moreIconContainer,
            ]}>
              <Ionicons
                name={item.icon}
                size={22}
                color={item.id === 'more' ? Colors.primary : Colors.white}
              />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  serviceItem: {
    alignItems: 'center',
    width: 90,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moreIconContainer: {
    backgroundColor: 'rgba(227, 30, 36, 0.1)',
  },
  label: {
    fontSize: 11,
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 15,
  },
});
