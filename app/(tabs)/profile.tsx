import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';

interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isLogout?: boolean;
  isDestructive?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, signOut } = useAuth();
  const { t } = useLanguage();

  const menuItems: MenuItem[] = [
    { id: 'personal', icon: 'person-outline', label: t('profile.menu.personal') },
    { id: 'bank-accounts', icon: 'wallet-outline', label: t('profile.menu.bankAccounts') },
    { id: 'security', icon: 'shield-outline', label: t('profile.menu.security') },
    { id: 'change-password', icon: 'lock-closed-outline', label: t('profile.menu.changePassword') },
    { id: 'notifications', icon: 'notifications-outline', label: t('profile.menu.notifications') },
    { id: 'language', icon: 'language-outline', label: t('profile.menu.language') },
    { id: 'about', icon: 'information-circle-outline', label: t('profile.menu.about') },
    { id: 'delete-account', icon: 'trash-outline', label: t('profile.menu.deleteAccount'), isDestructive: true },
    { id: 'logout', icon: 'log-out-outline', label: t('profile.menu.logout'), isLogout: true },
  ];

  const [profileData, setProfileData] = React.useState<{ name: string, email: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/v1/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success && data.data) {
          setProfileData({
            name: data.data.name || data.data.full_name || user?.name || 'User',
            email: data.data.email || user?.email || 'user@email.com'
          });
        } else {
          setProfileData({
            name: user?.name || 'User',
            email: user?.email || 'user@email.com'
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setProfileData({
          name: user?.name || 'User',
          email: user?.email || 'user@email.com'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [token, user]);

  const displayUser = profileData || { name: user?.name || 'User', email: user?.email || 'user@email.com' };

  const initials = displayUser.name
    .split(' ')
    .filter(n => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>{t('profile.title')}</Text>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{displayUser.name}</Text>
          <Text style={styles.userEmail}>{displayUser.email}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                if (item.id === 'personal') {
                  router.push('/(profile)/personal-information');
                } else if (item.id === 'notifications') {
                  router.push('/(profile)/notification-settings' as any);
                } else if (item.id === 'language') {
                  router.push('/(profile)/language' as any);
                } else if (item.id === 'delete-account') {
                  router.push('/(profile)/delete-account' as any);
                } else if (item.id === 'change-password') {
                  router.push('/(profile)/change-password' as any);
                } else if (item.id === 'bank-accounts') {
                  router.push('/(profile)/bank-accounts' as any);
                } else if (item.id === 'about') {
                  router.push('/(profile)/about');
                } else if (item.isLogout) {
                  Alert.alert(
                    t('profile.menu.logout'),
                    t('auth.signOut.confirm'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('profile.menu.logout'),
                        style: 'destructive',
                        onPress: () => signOut(),
                      },
                    ]
                  );
                } else {
                  Alert.alert(t('common.comingSoon'), t('common.comingSoonMsg').replace('{label}', item.label));
                }
              }}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.isLogout ? Colors.primary : Colors.black}
                />
                <Text
                  style={[
                    styles.menuItemLabel,
                    item.isLogout && styles.menuItemLabelLogout,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.grayText}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.grayText,
    marginTop: 4,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuItemLabel: {
    fontSize: 15,
    color: Colors.black,
  },
  menuItemLabelLogout: {
    color: Colors.primary,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 24,
  },
});
