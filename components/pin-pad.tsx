import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FontSize } from '../constants/typography';

interface PinPadProps {
  pin: string;
  onPinChange: (pin: string) => void;
  maxLength?: number;
  title?: string;
  subtitle?: string;
  darkMode?: boolean;
  disabled?: boolean;
}

export const PinPad = ({
  pin,
  onPinChange,
  maxLength = 6,
  title,
  subtitle,
  darkMode = false,
  disabled = false,
}: PinPadProps) => {
  const bgColor = darkMode ? Colors.darkBg : Colors.white;
  const textColor = darkMode ? Colors.white : Colors.black;

  const handlePress = (digit: string) => {
    if (pin.length < maxLength) {
      onPinChange(pin + digit);
    }
  };

  const handleBackspace = () => {
    onPinChange(pin.slice(0, -1));
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'back'],
  ];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {title && <Text style={[styles.title, { color: textColor }]}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View style={styles.dotsContainer}>
        {Array.from({ length: maxLength }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < pin.length ? styles.dotFilled : styles.dotEmpty,
              index >= pin.length && !darkMode && styles.dotEmptyLight,
            ]}
          />
        ))}
      </View>

      <View style={styles.padContainer}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.key} />;
              }
              if (key === 'back') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.key}
                    onPress={handleBackspace}
                    disabled={disabled}
                  >
                    <Ionicons
                      name="backspace-outline"
                      size={28}
                      color={textColor}
                    />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.key}
                  onPress={() => handlePress(key)}
                  disabled={disabled}
                >
                  <Text style={[styles.keyText, { color: textColor }]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  dotEmpty: {
    backgroundColor: Colors.darkCard,
  },
  dotEmptyLight: {
    backgroundColor: Colors.grayBorder,
  },
  padContainer: {
    width: '100%',
    paddingHorizontal: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: FontSize.xxxl,
    fontWeight: '500',
  },
});
