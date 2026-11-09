import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';

export default function KycSuccessScreen() {
  const router = useRouter();

  const handleBackToHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScreenLayout title="Identity Verification" showBackButton={false}>
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <View style={styles.phoneIllustration}>
            <Ionicons name="phone-portrait-outline" size={48} color={Colors.primary} />
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={Colors.success}
              style={styles.shieldIcon}
            />
          </View>
        </View>

        <Text style={styles.title}>Registered Successfully!</Text>
        <Text style={styles.description}>
          Your account is now being reviewed.{'\n'}
          Allow up to 2x24 hours for MoneyGram About{'\n'}
          for final verification.
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  successCircle: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  phoneIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    position: 'absolute',
    bottom: -8,
    right: -16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomContainer: { padding: 20, paddingBottom: 36 },
  homeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
