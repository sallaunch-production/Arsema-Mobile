import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { API_BASE_URL } from '../../constants/api';

function getPasswordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length === 0) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 1;
  if (score === 2 || score === 3) return 2;
  return 3;
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const strength = getPasswordStrength(newPassword);

  const strengthLabel =
    strength === 1
      ? t('changePassword.strengthWeak')
      : strength === 2
      ? t('changePassword.strengthFair')
      : strength === 3
      ? t('changePassword.strengthStrong')
      : '';

  const strengthColor =
    strength === 1 ? Colors.error : strength === 2 ? '#F59E0B' : '#10B981';

  const isFormValid =
    currentPassword.length > 0 &&
    isStrongPassword(newPassword) &&
    confirmPassword === newPassword;

  const handleSubmit = async () => {
    if (!isFormValid || !token) return;

    if (newPassword !== confirmPassword) {
      setErrorMsg(t('changePassword.errorMismatch'));
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setErrorMsg(t('changePassword.errorWeak'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        let msg = t('common.error');
        try {
          const data = JSON.parse(text);
          msg = data.error?.message || data.message || msg;
        } catch {}
        throw new Error(msg);
      }

      Alert.alert(t('changePassword.successTitle'), t('changePassword.successMsg'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      setErrorMsg(error.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout title={t('changePassword.title')}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        {/* Current Password */}
        <Text style={styles.label}>{t('changePassword.currentPassword')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t('changePassword.currentPasswordPlaceholder')}
            placeholderTextColor={Colors.grayText}
            secureTextEntry={!showCurrent}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
            <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.grayText} />
          </TouchableOpacity>
        </View>

        {/* New Password */}
        <Text style={styles.label}>{t('changePassword.newPassword')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('changePassword.newPasswordPlaceholder')}
            placeholderTextColor={Colors.grayText}
            secureTextEntry={!showNew}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
            <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.grayText} />
          </TouchableOpacity>
        </View>

        {/* Strength Indicator */}
        {newPassword.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBars}>
              {[1, 2, 3].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.strengthBar,
                    strength >= level && { backgroundColor: strengthColor },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
          </View>
        )}

        {/* Confirm Password */}
        <Text style={styles.label}>{t('changePassword.confirmPassword')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('changePassword.confirmPasswordPlaceholder')}
            placeholderTextColor={Colors.grayText}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.grayText} />
          </TouchableOpacity>
        </View>
        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
          <Text style={styles.inlineError}>{t('changePassword.errorMismatch')}</Text>
        )}

        {/* Requirements hint */}
        <Text style={styles.hint}>{t('changePassword.errorWeak')}</Text>

        {/* Error */}
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>{t('changePassword.submit')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 16,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.sm,
    color: Colors.black,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.grayBorder,
  },
  strengthLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    minWidth: 48,
    textAlign: 'right',
  },
  inlineError: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: 4,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.grayText,
    marginTop: 12,
    lineHeight: 18,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
