import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { FontSize } from '../constants/typography';
import { useAuth } from '../contexts/auth-context';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/(auth)/sign-in' as any);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../logo-arsema.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Arsema Mobile</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.poweredBy}>Powered by</Text>
        <Image
          source={require('../logo-moneygram-black 1.png')}
          style={styles.moneygramLogo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  poweredBy: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
    marginBottom: 4,
  },
  moneygramLogo: {
    width: 140,
    height: 30,
  },
});
