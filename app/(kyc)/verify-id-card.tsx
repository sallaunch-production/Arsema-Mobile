import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useKYC } from '../../contexts/kyc-context';

export default function VerifyIdCardScreen() {
  const router = useRouter();
  const { kycData, setIdCardImage } = useKYC();
  const [isCapturing, setIsCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: false,
        skipProcessing: false,
      });

      const imageData = {
        uri: photo.uri,
        type: 'image/jpeg',
      };
      
      setIdCardImage(imageData);
      Alert.alert('Success', 'ID card image captured successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setIdCardImage(null);
  };

  const handleNext = () => {
    if (!kycData.idCardImage) {
      Alert.alert('Error', 'Please capture your ID card image first');
      return;
    }
    router.push('/(kyc)/verify-face');
  };

  return (
    <ScreenLayout title="Identity Verification">
      <View style={styles.content}>
        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.subtitle}>Personal Identification</Text>

        <View style={styles.cameraFrame}>
          {kycData.idCardImage ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: kycData.idCardImage.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                <Ionicons name="camera" size={20} color={Colors.white} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : permission && permission.granted ? (
            <View style={styles.cameraContainer}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
                >
                <View style={styles.idCardGuide}>
                  <View style={styles.idCardGuideInner} />
                </View>
              </CameraView>
              <TouchableOpacity 
                style={styles.captureButtonContainer}
                onPress={handleCapture}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <View style={styles.captureButton}>
                    <Ionicons name="camera" size={28} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.permissionContainer}>
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={requestPermission}
              >
                <Ionicons name="camera" size={48} color={Colors.primary} />
                <Text style={styles.permissionText}>Grant Camera Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.instruction}>
          Line up your identity card along with the helper line provided.
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, !kycData.idCardImage && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!kycData.idCardImage}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.primary, alignSelf: 'flex-start' },
  subtitle: { fontSize: 14, color: Colors.grayText, alignSelf: 'flex-start', marginTop: 4, marginBottom: 40 },
  cameraFrame: {
    width: '100%',
    aspectRatio: 1.5,
    backgroundColor: Colors.gray,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardGuide: {
    width: '80%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardGuideInner: {
    width: '90%',
    height: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionButton: {
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  idCardOutline: {
    width: 120,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  retakeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  captureText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.grayText,
  },
  instruction: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  bottomContainer: { padding: 20, paddingBottom: 16 },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
