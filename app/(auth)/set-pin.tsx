import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PinPad } from '../../components/pin-pad';
import { ScreenLayout } from '../../components/screen-layout';
import { useLanguage } from '../../contexts/language-context';

export default function SetPinScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (pin.length === 6) {
      router.push({ pathname: '/(auth)/confirm-pin' as any, params: { pin } });
    }
  }, [pin]);

  return (
    <ScreenLayout title="Sign Up">
      <PinPad
        pin={pin}
        onPinChange={setPin}
        title={t('auth.setPin.title')}
        subtitle={t('auth.setPin.subtitle')}
      />
    </ScreenLayout>
  );
}
