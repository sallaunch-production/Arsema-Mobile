import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PinPad } from '../../components/pin-pad';
import { useAuth } from '../../contexts/auth-context';
import { ScreenLayout } from '../../components/screen-layout';
import { useLanguage } from '../../contexts/language-context';

export default function ConfirmPinScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { pin: originalPin } = useLocalSearchParams<Record<string, string>>();
  const { setPin: savePin } = useAuth();
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (pin.length === 6) {
      if (pin === originalPin) {
        handleConfirm();
      } else {
        Alert.alert(t('auth.confirmPin.mismatchTitle'), t('auth.confirmPin.mismatchMessage'));
        setPin('');
      }
    }
  }, [pin]);

  const handleConfirm = async () => {
    await savePin(pin);
    router.replace('/(tabs)' as any);
  };

  return (
    <ScreenLayout title="Sign Up">
      <PinPad
        pin={pin}
        onPinChange={setPin}
        title={t('auth.confirmPin.title')}
        subtitle={t('auth.confirmPin.subtitle')}
      />
    </ScreenLayout>
  );
}
