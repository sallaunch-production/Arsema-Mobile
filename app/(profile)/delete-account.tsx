// app/(profile)/delete-account.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { API_BASE_URL } from '../../constants/api';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { token, signOut } = useAuth();
  const { t } = useLanguage();

  const [selectedReason, setSelectedReason] = useState('');
  const [detail, setDetail] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const reasons = [
    t('profile.deleteAccount.reason1'),
    t('profile.deleteAccount.reason2'),
    t('profile.deleteAccount.reason3'),
    t('profile.deleteAccount.reason4'),
    t('profile.deleteAccount.reason5'),
  ];

  const canSubmit = selectedReason.length > 0 && isConfirmed && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    setIsLoading(true);
    try {
      const body: Record<string, string> = { reason: selectedReason };
      if (selectedReason === t('profile.deleteAccount.reason5') && detail.trim()) {
        body.detail = detail.trim();
      }

      const response = await fetch(`${API_BASE_URL}/v1/account/delete-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          t('profile.deleteAccount.successTitle'),
          t('profile.deleteAccount.successMessage'),
          [{ text: t('common.ok'), onPress: () => { signOut(); router.replace('/(auth)/sign-in' as any); } }],
        );
      } else {
        const msg: string = data?.message || '';
        if (msg.toLowerCase().includes('pending')) {
          Alert.alert(t('profile.deleteAccount.errorTitle'), t('profile.deleteAccount.pendingError'));
        } else {
          Alert.alert(t('profile.deleteAccount.errorTitle'), msg || t('profile.editProfile.unexpectedError'));
        }
      }
    } catch {
      Alert.alert(t('profile.deleteAccount.errorTitle'), t('profile.editProfile.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenLayout title={t('profile.deleteAccount.title')}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={20} color={Colors.primary} />
          <Text style={styles.warningText}>{t('profile.deleteAccount.warning')}</Text>
        </View>

        {/* Reason Dropdown */}
        <Text style={styles.label}>{t('profile.deleteAccount.reasonLabel')}</Text>
        <TouchableOpacity
          style={[styles.dropdown, showReasons && styles.dropdownActive]}
          onPress={() => setShowReasons(!showReasons)}
        >
          <Text style={[styles.dropdownText, !selectedReason && styles.placeholder]}>
            {selectedReason || t('profile.deleteAccount.reasonPlaceholder')}
          </Text>
          <Ionicons name={showReasons ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.grayText} />
        </TouchableOpacity>

        {showReasons && (
          <View style={styles.optionsList}>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.optionItem, selectedReason === reason && styles.optionSelected]}
                onPress={() => { setSelectedReason(reason); setShowReasons(false); }}
              >
                <Text style={[styles.optionText, selectedReason === reason && styles.optionTextSelected]}>
                  {reason}
                </Text>
                {selectedReason === reason && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Detail input — only shown for "Other" */}
        {selectedReason === t('profile.deleteAccount.reason5') && (
          <View style={styles.detailContainer}>
            <Text style={styles.label}>{t('profile.deleteAccount.detailLabel')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('profile.deleteAccount.detailPlaceholder')}
              placeholderTextColor={Colors.grayText}
              multiline
              numberOfLines={4}
              value={detail}
              onChangeText={setDetail}
            />
          </View>
        )}

        {/* Confirmation Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsConfirmed(!isConfirmed)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isConfirmed && styles.checkboxChecked]}>
            {isConfirmed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <Text style={styles.checkboxLabel}>{t('profile.deleteAccount.checkbox')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>{t('profile.deleteAccount.submitButton')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  warningBanner: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primary,
    lineHeight: 20,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 4,
  },
  dropdownActive: {
    borderColor: Colors.primary,
  },
  dropdownText: {
    fontSize: FontSize.md,
    color: Colors.black,
  },
  placeholder: {
    color: Colors.grayText,
  },
  optionsList: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  optionSelected: {
    backgroundColor: '#FFF0F0',
  },
  optionText: {
    fontSize: FontSize.md,
    color: Colors.black,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  detailContainer: {
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.black,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.black,
    lineHeight: 20,
  },
  bottomContainer: {
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
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
