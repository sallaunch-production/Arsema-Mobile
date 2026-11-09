import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { ScreenLayout } from '../components/screen-layout';
import { useAuth } from '../contexts/auth-context';
import { API_BASE_URL } from '../constants/api';
import { useLanguage } from '../contexts/language-context';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/notifications?limit=20&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (response.ok && data?.data) {
        const list = Array.isArray(data.data) ? data.data : [];
        setNotifications(list);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications(false);
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/v1/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'transaction':
      case 'transfer':
        return 'swap-horizontal-outline';
      case 'payment':
        return 'card-outline';
      case 'kyc':
      case 'verification':
        return 'shield-checkmark-outline';
      case 'promo':
      case 'promotion':
        return 'gift-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getIconColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'transaction':
      case 'transfer':
        return '#2196F3';
      case 'payment':
        return '#4CAF50';
      case 'kyc':
      case 'verification':
        return '#FF9800';
      case 'promo':
      case 'promotion':
        return Colors.primary;
      default:
        return Colors.grayText;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handlePress = (item: Notification) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    // Navigate based on notification type/data if needed
    if (item.data?.transaction_id) {
      router.push({
        pathname: '/(moneygram)/transaction-detail',
        params: { transactionId: item.data.transaction_id },
      });
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconColor = getIconColor(item.type);
    return (
      <TouchableOpacity
        style={[styles.notifItem, !item.is_read && styles.notifUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.notifIcon, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={getIcon(item.type) as any} size={22} color={iconColor} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notifDate}>{formatDate(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color={Colors.grayBorder} />
      <Text style={styles.emptyTitle}>{t('notifications.emptyTitle')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('notifications.emptySubtitle')}
      </Text>
    </View>
  );

  return (
    <ScreenLayout title={t('notifications.title')}>
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  notifItem: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
    alignItems: 'flex-start',
  },
  notifUnread: {
    backgroundColor: '#FFF8F8',
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    flex: 1,
    marginRight: 8,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifMessage: {
    fontSize: 13,
    color: Colors.grayText,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifDate: {
    fontSize: 11,
    color: Colors.grayText,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.grayText,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
