import React from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ScreenLayout } from '../../components/screen-layout';
import { useLanguage } from '../../contexts/language-context';
import { Colors } from '../../constants/colors';

export default function AboutScreen() {
  const { t } = useLanguage();

  return (
    <ScreenLayout title={t('profile.menu.about')}>
      <WebView
        source={{ uri: 'https://arsema.co.id' }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
});
