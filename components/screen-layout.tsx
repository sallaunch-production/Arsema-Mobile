import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FontSize } from '../constants/typography';

interface ScreenLayoutProps {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export function ScreenLayout({
  title,
  children,
  showBackButton = true,
  showHomeButton = true
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={[styles.redHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          {showBackButton ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          {showHomeButton ? (
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              style={styles.backButton}
            >
              <Ionicons name="home-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.whiteCard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  redHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPlaceholder: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.white,
  },
  whiteCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
