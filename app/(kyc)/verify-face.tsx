import React, { useState, useRef } from 'react';
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

export default function VerifyFaceScreen() {
  const router = useRouter();
  const { kycData, setFaceImage } = useKYC();
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
      
      setFaceImage(imageData);
      Alert.alert('Success', 'Face image captured successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setFaceImage(null);
  };

  const handleNext = () => {
    if (!kycData.faceImage) {
      Alert.alert('Error', 'Please capture your face image first');
      return;
    }
    router.push('/(kyc)/bank-account');
  };

  return (
    <ScreenLayout title="Identity Verification">
      <View style={styles.content}>
        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.subtitle}>Personal Identification and Face</Text>

        <View style={styles.cameraFrame}>
          {kycData.faceImage ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: kycData.faceImage.uri }}
                style={styles.previewImage}
                resizeMode="cover"
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
                facing="front"
              >
                <View style={styles.faceGuide}>
                  <View style={styles.faceGuideCircle} />
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
          {!kycData.faceImage && permission && permission.granted && (
            <View style={styles.idCardOverlay}>
              <View style={styles.miniIdCard}>
                <Ionicons name="card" size={20} color={Colors.primary} />
                <Text style={styles.miniIdText}>Arsema Apps</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.instruction}>
          Align yourself with the guided positioning direction while holding your identity
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, !kycData.faceImage && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!kycData.faceImage}
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
    aspectRatio: 1,
    backgroundColor: Colors.gray,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  faceGuide: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuideCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
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
  personPlaceholder: {
    alignItems: 'center',
  },
  headCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyShape: {
    width: 120,
    height: 60,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    backgroundColor: '#E0E0E0',
    marginTop: -5,
  },
  idCardOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 30,
  },
  miniIdCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  miniIdText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
  instruction: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
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
