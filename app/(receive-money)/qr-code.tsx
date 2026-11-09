import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useFormatCurrency } from '../../utils/format-currency';

export const QRCodeScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { formatCurrency } = useFormatCurrency();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleShare = () => {
    // Placeholder for share functionality
  };

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScreenLayout title="Receive Money">
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.amountLabel}>Amount to Receive</Text>
        <Text style={styles.amount}>IDR {formatCurrency(params.amount)}</Text>

        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <View style={styles.qrInner}>
              <View style={styles.qrCornerTL} />
              <View style={styles.qrCornerTR} />
              <View style={styles.qrCornerBL} />
              <View style={styles.qrCornerBR} />
              <Text style={styles.qrText}>QR Code</Text>
            </View>
          </View>
        </View>

        <Text style={styles.instruction}>
          Scan this QR code to send money
        </Text>

        <Text style={styles.timer}>
          This QR code expires in {formatTime(timeLeft)}
        </Text>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.grayText,
    marginTop: 20,
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 32,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 240,
    height: 240,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    padding: 16,
  },
  qrInner: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.black,
    borderTopLeftRadius: 4,
  },
  qrCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.black,
    borderTopRightRadius: 4,
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.black,
    borderBottomLeftRadius: 4,
  },
  qrCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.black,
    borderBottomRightRadius: 4,
  },
  qrText: {
    fontSize: 16,
    color: Colors.grayText,
    fontWeight: '600',
  },
  instruction: {
    fontSize: 16,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 12,
  },
  timer: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    marginBottom: 20,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  shareButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  doneButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default QRCodeScreen;
