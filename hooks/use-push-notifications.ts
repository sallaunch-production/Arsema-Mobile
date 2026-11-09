// Push notification hook: registers FCM device token, listens for incoming
// notifications, and handles navigation when user taps a notification.
// Uses native FCM token (not Expo Push Token) so backend sends directly via FCM V1 API.
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { type EventSubscription } from 'expo-modules-core';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface UsePushNotificationsOptions {
  token: string | null;
}

export function usePushNotifications({ token }: UsePushNotificationsOptions) {
  const [fcmToken, setFcmToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<EventSubscription>(null);
  const responseListener = useRef<EventSubscription>(null);
  // Use ref so navigation callbacks always have the latest token value
  const tokenRef = useRef<string | null>(token);
  const router = useRouter();

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    // Handle notification that launched the app from killed/background state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data as Record<string, any> | undefined;
        if (data) handleNotificationNavigation(data);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(async (notif) => {
      console.log('Notification received:', notif);
      const notifType = notif.request.content.data?.type as string | undefined;
      const keyMap: Record<string, string> = {
        transaction: 'notif_transactions',
        promotion: 'notif_promotions',
        system: 'notif_system',
      };
      const storageKey = notifType ? keyMap[notifType] : null;
      if (storageKey) {
        const enabled = await AsyncStorage.getItem(storageKey);
        if (enabled === 'false') return;
      }
      setNotification(notif);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data as Record<string, any> | undefined;
      if (data) handleNotificationNavigation(data);
    });

    registerForPushNotifications().then((deviceToken) => {
      if (deviceToken) {
        setFcmToken(deviceToken);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Send token to backend whenever both fcmToken and auth token are available
  useEffect(() => {
    if (token && fcmToken) {
      sendPushTokenToBackend(fcmToken, token);
    }
  }, [token, fcmToken]);

  const handleNotificationNavigation = (data: Record<string, any>) => {
    // If user is not logged in, redirect to sign-in first
    if (!tokenRef.current) {
      router.replace('/(auth)/sign-in' as any);
      return;
    }

    if (data.transaction_id) {
      router.push({
        pathname: '/(moneygram)/transaction-detail',
        params: { transactionId: data.transaction_id },
      });
    } else {
      router.push('/notifications');
    }
  };

  return { fcmToken, notification };
}

async function registerForPushNotifications(): Promise<string | undefined> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return undefined;
  }

  // Set up Android notification channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E31E24',
    });

    await Notifications.setNotificationChannelAsync('transactions', {
      name: 'Transactions',
      description: 'Transaction status updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E31E24',
    });
  }

  // Check and request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return undefined;
  }

  // Get native FCM device token (not Expo Push Token)
  // Backend uses this token to send directly via FCM V1 API
  try {
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    console.log('FCM device token:', tokenResponse.data);
    return tokenResponse.data as string;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return undefined;
  }
}

async function sendPushTokenToBackend(pushToken: string, authToken: string) {
  try {
    console.log('Registering FCM token to backend...');
    const response = await fetch(`${API_BASE_URL}/v1/devices/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        push_token: pushToken,
        platform: Platform.OS,
        device_name: Device.deviceName || '',
      }),
    });

    const data = await response.json();
    console.log('Push token registered:', data.success !== false ? 'OK' : 'Failed');
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
}
