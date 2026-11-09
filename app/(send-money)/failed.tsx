import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

export const TransferFailedScreen = () => {
  const router = useRouter();

  const handleTryAgain = () => {
    router.replace('/(send-money)/receiver-details');
  };

  const handleBackToHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <View style={styles.errorCircle}>
              <Text style={styles.xMark}>✕</Text>
            </View>
          </View>

          <Text style={styles.title}>Transfer Failed</Text>
          <Text style={styles.message}>
            Something went wrong. Please try again.
          </Text>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
            <Text style={styles.tryAgainButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xMark: {
    fontSize: 40,
    color: Colors.white,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
  },
  tryAgainButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  tryAgainButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  homeButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TransferFailedScreen;
