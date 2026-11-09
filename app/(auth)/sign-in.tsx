import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { FormInput } from '../../components/form-input';
import { Button } from '../../components/button';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';

export default function SignInScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, user, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isFormValid = email.length > 0 && password.length > 0;

  const handleSignIn = async () => {
    if (!isFormValid) return;
    try {
      const result = await signIn(email, password);
      // Only navigate if login was successful (result is not null)
      if (result) {
        // Check if PIN is not set, redirect to set-pin page
        if (!result.user.hasPin) {
          router.replace('/(auth)/set-pin' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
      }
      // If result is null, login failed - error was already shown via Alert
    } catch {
      // Error already shown via Alert in auth context
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.redHeader, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>{t('auth.signIn.title')}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.whiteCard}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greeting}>{t('auth.signIn.greeting')}</Text>
              <Text style={styles.subtitle}>{t('auth.signIn.subtitle')}</Text>
            </View>
          </View>

          <View style={styles.logoContainer}>
            <Image
              source={require('../../logo-arsema.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.form}>
            <FormInput
              label={t('auth.signIn.emailLabel')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.signIn.emailPlaceholder')}
              keyboardType="email-address"
            />
            <FormInput
              label={t('auth.signIn.passwordLabel')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.signIn.passwordPlaceholder')}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password' as any)}
            >
              <Text style={styles.forgotPasswordText}>{t('auth.signIn.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          <Button
            title={t('auth.signIn.button')}
            onPress={handleSignIn}
            disabled={!isFormValid}
            isLoading={isLoading}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.signIn.noAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up' as any)}>
              <Text style={styles.footerLink}>{t('auth.signIn.signUpLink')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  flex: {
    flex: 1,
  },
  redHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  whiteCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 140,
    height: 120,
  },
  form: {
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
  },
  footerLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
});
