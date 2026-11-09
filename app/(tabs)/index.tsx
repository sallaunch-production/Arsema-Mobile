import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { ServiceGrid } from '../../components/service-grid';
import { PromoCard } from '../../components/promo-card';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, token } = useAuth();
  const isPremium = user?.level === 'premium';

  const [kycStatus, setKycStatus] = React.useState<string | null>(null);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchUnreadCount = React.useCallback(async () => {
    if (!token) return;
    try {
      // Try dedicated unread-count endpoint first
      const countRes = await fetch(`${API_BASE_URL}/v1/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (countRes.ok) {
        const countData = await countRes.json();
        const count = countData?.data?.count ?? countData?.count;
        if (typeof count === 'number') {
          setUnreadCount(count);
          return;
        }
      }
      // Fallback: count is_read=false from the list
      const listRes = await fetch(`${API_BASE_URL}/v1/notifications?limit=50&offset=0`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        const list: any[] = Array.isArray(listData?.data) ? listData.data : [];
        setUnreadCount(list.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [token]);

  // Refresh every 30 seconds
  React.useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Re-fetch when screen comes back into focus (e.g. returning from notifications)
  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  React.useEffect(() => {
    async function fetchKycStatus() {
      if (isPremium || !token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/v1/kyc/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setKycStatus(data?.data?.status || null);
        }
      } catch (error) {
        console.error('Failed to fetch KYC status:', error);
      }
    }
    fetchKycStatus();
  }, [isPremium, token]);

  const handleLogout = () => {
    Alert.alert(
      t('home.logoutConfirmTitle'),
      t('home.logoutConfirmMessage'),
      [
        { text: t('home.logoutCancel'), style: 'cancel' },
        {
          text: t('home.logout'),
          style: 'destructive',
          onPress: () => {
            signOut();
            router.replace('/(auth)/sign-in' as any);
          },
        },
      ],
    );
  };

  const handleServicePress = (serviceId: string) => {
    switch (serviceId) {
      case 'send-moneygram':
        router.push('/(moneygram)/transfer');
        break;
      case 'send-money':
      case 'local-transfer':
        router.push('/(send-money)/receiver-details');
        break;
      case 'receive-money':
      case 'receive-moneygram':
        router.push('/(receive-money)/details');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.appTitle}>{t('home.title')}</Text>
          <View style={styles.topBarActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications' as any)}>
              <Ionicons name="notifications-outline" size={22} color={Colors.black} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={Colors.black} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Red Background Area */}
        <View style={styles.redSection}>
          {/* Greeting + KYC combined card */}
          <View style={styles.greetingCard}>
            <Text style={styles.greetingText}>{t('home.greeting')}</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>

            {/* KYC Banner - only for basic users */}
            {!isPremium && (
              <View style={kycStatus === 'pending' ? styles.kycBannerPending : styles.kycBanner}>
                <Text style={styles.kycText}>
                  {kycStatus === 'pending'
                    ? t('home.kycPending')
                    : t('home.kycBanner')}
                </Text>
                {kycStatus !== 'pending' && (
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => router.push('/(kyc)/personal-details')}
                  >
                    <Text style={styles.verifyButtonText}>{t('home.verify')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Service Grid Card */}
          <View style={styles.serviceCard}>
            <ServiceGrid onServicePress={handleServicePress} />
          </View>

          {/* Promo Section - white background */}
          <View style={styles.promoSection}>
            <Text style={styles.promoTitle}>{t('home.promo')}</Text>
            <PromoCard />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  appTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.black,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
    position: 'relative',
    overflow: 'visible',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -5,
    backgroundColor: '#E31E24',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
    zIndex: 10,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  redSection: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
  },
  greetingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    marginTop: 12,
  },
  greetingText: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
    marginBottom: 12,
  },
  kycBanner: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kycBannerPending: {
    backgroundColor: '#E3F2FD', // Light blue for pending status
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kycText: {
    fontSize: 12,
    color: Colors.black,
    lineHeight: 18,
    flex: 1,
    marginRight: 12,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  verifyButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    marginTop: 12,
  },
  promoSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
  },
  promoTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 16,
    backgroundColor: Colors.primary,
  },
});
