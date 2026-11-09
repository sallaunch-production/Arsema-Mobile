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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';
import { useFormatCurrency } from '../../utils/format-currency';

interface Transaction {
  id: string;
  mg_transaction_id: string;
  recipientName: string;
  date: string;
  send_amount: number;
  send_currency: string;
  type: 'sent' | 'received' | 'local' | 'bill';
  status: string;
  serviceName: string;
  destination_country: string;
}

type FilterTab = 'sent' | 'received' | 'local' | 'bill';

export default function TransactionScreen() {
  const { t } = useLanguage();
  const { formatCurrency } = useFormatCurrency();
  const router = useRouter();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>('sent');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [serverOffset, setServerOffset] = useState(0);
  const [hasServerMore, setHasServerMore] = useState(true);

  const DISPLAY_PAGE = 20;
  const API_LIMIT = 100;

  const visibleTransactions = allTransactions.slice(0, visibleCount);
  const hasClientMore = visibleCount < allTransactions.length;
  const hasMore = hasClientMore || hasServerMore;

  const mapTransaction = (tx: any): Transaction => {
    let details = tx;
    try {
      if (tx.response_body) {
        details = JSON.parse(tx.response_body);
      }
    } catch (e) { }

    return {
      id: tx.id || tx.transaction_id || Math.random().toString(),
      mg_transaction_id: tx.mg_transaction_id,
      recipientName: tx.receiver_first_name
        ? [tx.receiver_first_name, tx.receiver_middle_name, tx.receiver_last_name].filter(Boolean).join(' ')
        : 'Unknown Recipient',
      date: tx.updated_at ? new Date(tx.updated_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Recent',
      send_amount: details.sendAmount?.total?.value || details.sendAmount?.amount?.value || tx.send_amount || tx.amount || 0,
      send_currency: details.sendAmount?.total?.currencyCode || details.sendAmount?.amount?.currencyCode || tx.send_currency || tx.currency || 'IDR',
      type: 'sent',
      status: tx.status || 'PENDING',
      serviceName: details.service_option_name || 'Send Service',
      destination_country: details.destination_country || '',
    };
  };

  const extractList = (data: any): any[] =>
    Array.isArray(data.data) ? data.data :
    Array.isArray(data.data?.data) ? data.data.data :
    Array.isArray(data.data?.transactions) ? data.data.transactions :
    Array.isArray(data.transactions) ? data.transactions :
    Array.isArray(data) ? data : [];

  const fetchTransactions = useCallback(async (showLoading = true) => {
    if (!user?.id || !token) return;

    if (showLoading) setIsLoading(true);
    try {
      if (activeTab === 'sent') {
        const response = await fetch(
          `${API_BASE_URL}/v1/moneygram/transactions?limit=${API_LIMIT}&offset=0&user_id=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (response.ok && data?.success !== false) {
          const list = extractList(data);
          const mapped = list.map(mapTransaction);
          setAllTransactions(mapped);
          setVisibleCount(DISPLAY_PAGE);
          setServerOffset(mapped.length);
          setHasServerMore(list.length >= API_LIMIT);
        } else {
          setAllTransactions([]);
          setVisibleCount(DISPLAY_PAGE);
          setServerOffset(0);
          setHasServerMore(false);
        }
      } else {
        setAllTransactions([]);
        setVisibleCount(DISPLAY_PAGE);
        setServerOffset(0);
        setHasServerMore(false);
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
      setAllTransactions([]);
      setVisibleCount(DISPLAY_PAGE);
      setServerOffset(0);
      setHasServerMore(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, token, activeTab]);

  const fetchFromServer = useCallback(async () => {
    if (!user?.id || !token || !hasServerMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/moneygram/transactions?limit=${API_LIMIT}&offset=${serverOffset}&user_id=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok && data?.success !== false) {
        const list = extractList(data);
        const mapped = list.map(mapTransaction);
        setAllTransactions(prev => [...prev, ...mapped]);
        setServerOffset(prev => prev + list.length);
        setHasServerMore(list.length >= API_LIMIT);
      } else {
        setHasServerMore(false);
      }
    } catch (error) {
      console.error('Fetch more from server error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user?.id, token, hasServerMore, isLoadingMore, serverOffset]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTransactions(false);
  };

  const loadMore = async () => {
    if (hasClientMore) {
      setVisibleCount(prev => Math.min(prev + DISPLAY_PAGE, allTransactions.length));
    } else if (hasServerMore && !isLoadingMore) {
      await fetchFromServer();
      setVisibleCount(prev => Math.min(prev + DISPLAY_PAGE, allTransactions.length + API_LIMIT));
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('complete') || s === 'paid' || s === 'committed') {
      return { backgroundColor: '#E8F5E9', color: Colors.success };
    }
    if (s.includes('fail') || s.includes('cancel')) {
      return { backgroundColor: '#FFEBEE', color: Colors.error };
    }
    return { backgroundColor: '#FFF3E0', color: '#FF9800' };
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const statusStyle = getStatusStyle(item.status);
    const amountColor = item.type === 'sent' || item.type === 'local' || item.type === 'bill'
      ? Colors.error
      : Colors.success;
    const amountPrefix = item.type === 'sent' || item.type === 'local' || item.type === 'bill'
      ? '- '
      : '+ ';

    return (

      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => router.push({
          pathname: '/(moneygram)/transaction-detail',
          params: { transactionId: item.mg_transaction_id }
        })}
      >
        <View
          style={[
            styles.transactionIcon,
            {
              backgroundColor: amountColor === Colors.error ? '#FFEBEE' : '#E8F5E9',
            },
          ]}
        >
          <Ionicons
            name={amountPrefix === '- ' ? 'arrow-up-circle' : 'arrow-down-circle'}
            size={24}
            color={amountColor}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.recipientName} numberOfLines={1}>{item.recipientName}</Text>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <Text style={styles.serviceName}>{item.destination_country}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {amountPrefix}{item.send_currency} {formatCurrency(Number(item.send_amount), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {item.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={Colors.grayBorder} />
      <Text style={styles.emptyTitle}>{t('tabs.transaction.emptyTitle')}</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'sent'
          ? t('tabs.transaction.emptySubtitle')
          : `Your ${activeTab.replace('_', ' ')} history will appear here`}
      </Text>
    </View>
  );

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'sent', label: t('tabs.transaction.tabSend') },
    { key: 'received', label: t('tabs.transaction.tabReceived') },
    { key: 'local', label: t('tabs.transaction.tabLocal') },
    { key: 'bill', label: t('tabs.transaction.tabBill') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t('tabs.transaction.title')}</Text>

      {/* Filter Tabs */}
      <View style={{ marginBottom: 16 }}>
        <FlatList
          horizontal
          data={tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                activeTab === item.key && styles.filterTabActive,
              ]}
              onPress={() => setActiveTab(item.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeTab === item.key && styles.filterTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        />
      </View>

      {/* Transaction List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={hasMore || isLoadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
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
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grayText,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
    marginRight: 8,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
  },
  serviceName: {
    fontSize: 12,
    color: Colors.black,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: Colors.grayText,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
