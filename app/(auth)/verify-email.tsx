import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { OtpInput } from '../../components/otp-input';
import { Button } from '../../components/button';
import { useAuth } from '../../contexts/auth-context';
import { ScreenLayout } from '../../components/screen-layout';
import { useLanguage } from '../../contexts/language-context';

const RESEND_COOLDOWN = 60;

export default function VerifyEmailScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, verifyEmail, resendOtp, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    const success = await verifyEmail(otp);
    if (success) {
      router.replace('/(auth)/sign-in' as any);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    await resendOtp();
    setIsResending(false);
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    <ScreenLayout title="Sign Up" showBackButton={false}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={64} color={Colors.primary} />
        </View>

        <Text style={styles.title}>{t('auth.verifyEmail.title')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.verifyEmail.subtitle')}{'\n'}
          {user?.email || 'your email'}
        </Text>
        <Text style={styles.validText}>{t('auth.verifyEmail.validity')}</Text>

        <View style={styles.otpContainer}>
          <OtpInput value={otp} onChangeText={setOtp} />
        </View>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={cooldown > 0 || isResending}
        >
          <Text
            style={[
              styles.resendText,
              (cooldown > 0 || isResending) && styles.resendTextDisabled,
            ]}
          >
            {isResending
              ? t('auth.verifyEmail.sending')
              : cooldown > 0
                ? t('auth.verifyEmail.resendIn').replace('{cooldown}', String(cooldown))
                : t('auth.verifyEmail.didntReceive') + t('auth.verifyEmail.resend')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={t('auth.verifyEmail.button')}
          onPress={handleVerify}
          disabled={otp.length !== 6}
          isLoading={isLoading}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  validText: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
    marginBottom: 32,
  },
  otpContainer: {
    width: '100%',
  },
  resendButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: Colors.grayText,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
});
