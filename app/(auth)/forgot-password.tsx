import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { FormInput } from '../../components/form-input';
import { Button } from '../../components/button';
import { ScreenLayout } from '../../components/screen-layout';
import { API_BASE_URL, BASIC_AUTH } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';

export default function ForgotPasswordScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const isFormValid = email.length > 0 && email.includes('@');

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': BASIC_AUTH,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error?.message || 'Failed to send reset link');
      }

      setIsSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenLayout title={t('auth.forgotPassword.title')}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!isSent ? (
            <>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="lock-closed-outline" size={40} color={Colors.primary} />
                </View>
              </View>

              <Text style={styles.title}>{t('auth.forgotPassword.heading')}</Text>
              <Text style={styles.description}>
                {t('auth.forgotPassword.description')}
              </Text>

              <View style={styles.form}>
                <FormInput
                  label={t('auth.forgotPassword.emailLabel')}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.forgotPassword.emailPlaceholder')}
                  keyboardType="email-address"
                />
              </View>

              <Button
                title={t('auth.forgotPassword.button')}
                onPress={handleSubmit}
                disabled={!isFormValid}
                isLoading={isLoading}
              />
            </>
          ) : (
            <>
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
                  <Ionicons name="mail-outline" size={40} color={Colors.white} />
                </View>
              </View>

              <Text style={styles.title}>{t('auth.forgotPassword.successTitle')}</Text>
              <Text style={styles.description}>
                {t('auth.forgotPassword.successPrefix')}
                <Text style={styles.emailHighlight}>{email}</Text>. {t('auth.forgotPassword.successInstruction')}
              </Text>

              <Button
                title={t('auth.forgotPassword.backButton')}
                onPress={() => router.back()}
              />

              <Text style={styles.resendText}>
                {t('auth.forgotPassword.didntReceive')}
                <Text
                  style={styles.resendLink}
                  onPress={() => {
                    setIsSent(false);
                  }}
                >
                  {t('auth.forgotPassword.tryAgain')}
                </Text>
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FDEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleSuccess: {
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  emailHighlight: {
    fontWeight: '600',
    color: Colors.black,
  },
  form: {
    marginBottom: 24,
  },
  resendText: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
    textAlign: 'center',
    marginTop: 24,
  },
  resendLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
