import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenLayout } from '../../components/screen-layout';
import { PinPad } from '../../components/pin-pad';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { Colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/language-context';

export default function ReviewPinScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { token } = useAuth();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pin.length === 6) {
      verifyPin();
    }
  }, [pin]);

  const verifyPin = async () => {
    if (!token) {
      Alert.alert('Error', t('mg.reviewPin.sessionExpired'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/pin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        // PIN verified, proceed to next screen
        router.push({
          pathname: '/(moneygram)/virtual-account',
          params: {
            ...params,
            pin,
          },
        });
      } else {
        Alert.alert('Error', data.message || t('mg.reviewPin.invalidPin'));
        setPin(''); // Clear PIN on error
      }
    } catch (error) {
      console.error('Verify PIN error:', error);
      Alert.alert('Error', t('mg.reviewPin.connectionError'));
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenLayout title={t('mg.reviewPin.title')}>
      <View style={styles.container}>
        <PinPad
          pin={pin}
          onPinChange={setPin}
          title={t('mg.reviewPin.subtitle')}
          subtitle=""
          disabled={isLoading}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
