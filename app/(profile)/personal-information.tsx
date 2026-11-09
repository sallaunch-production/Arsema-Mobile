import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/language-context';

export default function PersonalInformationScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/v1/customers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setProfile(data.data);
      } else {
        // Handle case where profile might not exist (though KYC requires it)
        console.log('No profile found or error fetching profile', data);
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      Alert.alert('Error', t('profile.personalInfo.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const InfoRow = ({ label, value }: { label: string; value: string | undefined | null }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );

  return (
    <ScreenLayout title={t('profile.personalInfo.title')}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('profile.personalInfo.accountDetails')}</Text>
              <View style={styles.card}>
                <InfoRow label={t('profile.personalInfo.fullName')} value={user?.name} />
                <View style={styles.divider} />
                <InfoRow label={t('profile.personalInfo.email')} value={user?.email} />
                <View style={styles.divider} />
                <InfoRow label={t('profile.personalInfo.phone')} value={profile?.phone_number || user?.phone} />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('profile.personalInfo.profileDetails')}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => router.push({
                    pathname: '/(profile)/edit-profile' as any,
                    params: { profileData: JSON.stringify(profile) }
                  })}
                >
                  <Ionicons name="pencil" size={16} color={Colors.primary} />
                  <Text style={styles.editButtonText}>{t('profile.personalInfo.edit')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.card}>
                <InfoRow label={t('profile.personalInfo.occupation')} value={profile?.occupation} />
                <View style={styles.divider} />
                <InfoRow label={t('profile.personalInfo.address')} value={profile?.address_line_1} />
                {profile?.address_line_2 ? (
                  <>
                    <View style={styles.divider} />
                    <InfoRow label={t('profile.personalInfo.address') + ' 2'} value={profile?.address_line_2} />
                  </>
                ) : null}
                <View style={styles.divider} />
                <InfoRow label={t('profile.personalInfo.city')} value={profile?.city} />
                <View style={styles.divider} />
                <InfoRow label={t('profile.personalInfo.state')} value={profile?.state} />
                <View style={styles.divider} />
                <InfoRow label={t('profile.personalInfo.postalCode')} value={profile?.postal_code} />
                <View style={styles.divider} />
                <InfoRow label={t('profile.personalInfo.country')} value={profile?.country} />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12, // for sections without edit button
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    padding: 16,
  },
  infoRow: {
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.grayText,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.grayBorder,
    marginVertical: 12,
  },
});
