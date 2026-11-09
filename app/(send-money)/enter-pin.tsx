import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';

const PIN_LENGTH = 6;
const CORRECT_PIN = '123456';

export const EnterPinScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleNumberPress = (num: string) => {
    if (pin.length >= PIN_LENGTH) return;

    const newPin = pin + num;
    setPin(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      if (newPin === CORRECT_PIN) {
        router.replace({
          pathname: '/(send-money)/success',
          params: {
            bankName: params.bankName,
            accountNumber: params.accountNumber,
            recipientName: params.recipientName,
            amount: params.amount,
            transferFee: params.transferFee,
            totalAmount: params.totalAmount,
            notes: params.notes,
          },
        });
      } else {
        setError('Incorrect PIN. Please try again.');
        setTimeout(() => setPin(''), 300);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            i < pin.length ? styles.dotFilled : styles.dotEmpty,
          ]}
        />
      );
    }
    return dots;
  };

  const renderNumberPad = () => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete'],
    ];

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.numberRow}>
        {row.map((item, colIndex) => {
          if (item === '') {
            return <View key={colIndex} style={styles.numberButton} />;
          }

          if (item === 'delete') {
            return (
              <TouchableOpacity
                key={colIndex}
                style={styles.numberButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteText}>⌫</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={colIndex}
              style={styles.numberButton}
              onPress={() => handleNumberPress(item)}
            >
              <View style={styles.numberCircle}>
                <Text style={styles.numberText}>{item}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Enter your PIN</Text>
          <Text style={styles.subtitle}>
            Enter your 6-digit PIN to confirm this transaction
          </Text>
        </View>

        <View style={styles.dotsContainer}>{renderDots()}</View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.numberPad}>{renderNumberPad()}</View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
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
    backgroundColor: Colors.grayText,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: -20,
  },
  numberPad: {
    paddingHorizontal: 20,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  numberButton: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.white,
  },
  deleteText: {
    fontSize: 24,
    color: Colors.white,
  },
});

export default EnterPinScreen;
