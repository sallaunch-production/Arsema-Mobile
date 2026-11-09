import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Camera as VisionCamera,
  useCameraDevice,
  type Frame,
} from 'react-native-vision-camera';
import {
  Camera as FaceCamera,
  type Face,
  type FrameFaceDetectionOptions,
} from 'react-native-vision-camera-face-detector';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useKYC } from '../../contexts/kyc-context';

const YAW_THRESHOLD = 15;
const EYE_CLOSED_THRESHOLD = 0.3;
const DWELL_DURATION_MS = 1500;
const FACE_GUIDE_SIZE = 250;

type LivenessStep = 'faceRight' | 'faceLeft' | 'blink';

interface StepConfig {
  step: LivenessStep;
  title: string;
  subtitle: string;
  icon: string;
  successMessage: string;
}

const LIVENESS_STEPS: StepConfig[] = [
  {
    step: 'faceRight',
    title: 'Hadap Kanan',
    subtitle: 'Please turn your face to the right',
    icon: 'arrow-forward',
    successMessage: 'Face right check passed!',
  },
  {
    step: 'faceLeft',
    title: 'Hadap Kiri',
    subtitle: 'Please turn your face to the left',
    icon: 'arrow-back',
    successMessage: 'Face left check passed!',
  },
  {
    step: 'blink',
    title: 'Berkedip',
    subtitle: 'Please blink your eyes slowly',
    icon: 'eye',
    successMessage: 'Blink check passed!',
  },
];

const FACE_OPTIONS: FrameFaceDetectionOptions = {
  performanceMode: 'fast',
  landmarkMode: 'none',
  contourMode: 'none',
  classificationMode: 'all',
  trackingEnabled: false,
  cameraFacing: 'front',
  autoMode: false,
};

export default function LivenessDetectionScreen() {
  const router = useRouter();
  const {
    kycData,
    setLivenessPassed,
    setLivenessFaceRight,
    setLivenessFaceLeft,
    setLivenessBlink,
  } = useKYC();

  const [hasPermission, setHasPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [faceVisible, setFaceVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  const device = useCameraDevice('front');
  const cameraRef = useRef<VisionCamera>(null);
  const dwellStartRef = useRef<number | null>(null);
  const blinkPhaseRef = useRef<'waiting_close' | 'waiting_open'>('waiting_close');
  const currentStepIndexRef = useRef(0);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    const check = async () => {
      const status = await VisionCamera.getCameraPermissionStatus();
      if (status === 'granted') {
        setHasPermission(true);
      } else {
        const result = await VisionCamera.requestCameraPermission();
        setHasPermission(result === 'granted');
      }
    };
    check();
  }, []);

  useEffect(() => {
    dwellStartRef.current = null;
    blinkPhaseRef.current = 'waiting_close';
    setCountdown(0);
    setStatusMessage(LIVENESS_STEPS[currentStepIndex]?.subtitle ?? '');
  }, [currentStepIndex]);

  const completeStepRef = useRef<() => void>(() => {});
  completeStepRef.current = () => {
    isProcessingRef.current = true;
    setIsProcessing(true);
    dwellStartRef.current = null;

    const idx = currentStepIndexRef.current;
    const stepConfig = LIVENESS_STEPS[idx];
    const step = stepConfig?.step;

    if (step === 'faceRight') setLivenessFaceRight(true);
    else if (step === 'faceLeft') setLivenessFaceLeft(true);
    else if (step === 'blink') setLivenessBlink(true);

    Alert.alert('Success', stepConfig?.successMessage ?? 'Step completed!');

    setTimeout(() => {
      const nextIdx = idx + 1;
      if (nextIdx < LIVENESS_STEPS.length) {
        setCurrentStepIndex(nextIdx);
      } else {
        setLivenessPassed(true);
      }
      isProcessingRef.current = false;
      setIsProcessing(false);
    }, 1000);
  };

  const handleFaceDetection = useCallback(
    (faces: Face[], _frame: Frame) => {
      if (kycData.livenessPassed || isProcessingRef.current) return;

      if (faces.length === 0) {
        setFaceVisible(false);
        dwellStartRef.current = null;
        setCountdown(0);
        setStatusMessage('No face detected. Position your face in the frame.');
        return;
      }

      setFaceVisible(true);

      const face = faces[0];
      const idx = currentStepIndexRef.current;
      const stepConfig = LIVENESS_STEPS[idx];
      if (!stepConfig) return;

      const { yawAngle, leftEyeOpenProbability, rightEyeOpenProbability } = face;

      switch (stepConfig.step) {
        case 'faceRight': {
          if (yawAngle < -YAW_THRESHOLD) {
            if (!dwellStartRef.current) dwellStartRef.current = Date.now();
            const elapsed = Date.now() - dwellStartRef.current;
            const remaining = Math.max(0, Math.ceil((DWELL_DURATION_MS - elapsed) / 1000));
            setCountdown(remaining);
            setStatusMessage(`Hold still... ${remaining}s`);
            if (elapsed >= DWELL_DURATION_MS) completeStepRef.current();
          } else {
            dwellStartRef.current = null;
            setCountdown(0);
            setStatusMessage(stepConfig.subtitle);
          }
          break;
        }

        case 'faceLeft': {
          if (yawAngle > YAW_THRESHOLD) {
            if (!dwellStartRef.current) dwellStartRef.current = Date.now();
            const elapsed = Date.now() - dwellStartRef.current;
            const remaining = Math.max(0, Math.ceil((DWELL_DURATION_MS - elapsed) / 1000));
            setCountdown(remaining);
            setStatusMessage(`Hold still... ${remaining}s`);
            if (elapsed >= DWELL_DURATION_MS) completeStepRef.current();
          } else {
            dwellStartRef.current = null;
            setCountdown(0);
            setStatusMessage(stepConfig.subtitle);
          }
          break;
        }

        case 'blink': {
          const eyesClosed =
            leftEyeOpenProbability < EYE_CLOSED_THRESHOLD &&
            rightEyeOpenProbability < EYE_CLOSED_THRESHOLD;

          if (blinkPhaseRef.current === 'waiting_close' && eyesClosed) {
            blinkPhaseRef.current = 'waiting_open';
            setStatusMessage('Eyes closed detected. Now open your eyes.');
          } else if (blinkPhaseRef.current === 'waiting_open' && !eyesClosed) {
            setStatusMessage('Blink detected!');
            completeStepRef.current();
          } else if (blinkPhaseRef.current === 'waiting_close') {
            setStatusMessage(stepConfig.subtitle);
          }
          break;
        }
      }
    },
    [kycData.livenessPassed],
  );

  const handleRetake = () => {
    setLivenessPassed(false);
    setLivenessFaceRight(false);
    setLivenessFaceLeft(false);
    setLivenessBlink(false);
    setCurrentStepIndex(0);
    setIsProcessing(false);
    isProcessingRef.current = false;
    dwellStartRef.current = null;
    blinkPhaseRef.current = 'waiting_close';
    setStatusMessage(LIVENESS_STEPS[0].subtitle);
    setCountdown(0);
  };

  const handleConfirm = () => {
    if (!kycData.livenessPassed) {
      Alert.alert('Error', 'Complete all liveness checks first');
      return;
    }
    router.push('/(kyc)/terms-and-conditions');
  };

  const getStepStatus = (index: number): 'pending' | 'completed' | 'current' => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'pending';
  };

  const currentStep = LIVENESS_STEPS[currentStepIndex] ?? LIVENESS_STEPS[0];

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      {LIVENESS_STEPS.map((instruction, index) => {
        const status = getStepStatus(index);
        return (
          <View key={instruction.step} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                status === 'completed' && styles.stepCircleCompleted,
                status === 'current' && styles.stepCircleCurrent,
                status === 'pending' && styles.stepCirclePending,
              ]}
            >
              {status === 'completed' ? (
                <Ionicons name="checkmark" size={16} color={Colors.white} />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    status === 'current' && styles.stepNumberCurrent,
                    status === 'pending' && styles.stepNumberPending,
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                status === 'completed' && styles.stepLabelCompleted,
                status === 'current' && styles.stepLabelCurrent,
              ]}
            >
              {instruction.title}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderProgressBar = () => {
    if (countdown === 0 || isProcessing || kycData.livenessPassed) return null;
    const totalSec = DWELL_DURATION_MS / 1000;
    const progress = (totalSec - countdown) / totalSec;
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
      </View>
    );
  };

  return (
    <ScreenLayout title="Identity Verification">
      <View style={styles.content}>
        <Text style={styles.title}>Liveness Detection</Text>
        <Text style={styles.subtitle}>
          Follow the instructions. Real-time face detection will verify your identity.
        </Text>

        {renderStepIndicator()}

        <View style={styles.instructionCard}>
          <View style={styles.instructionHeader}>
            <Ionicons name={currentStep.icon as any} size={24} color={Colors.primary} />
            <Text style={styles.instructionTitle}>{currentStep.title}</Text>
          </View>
          <Text style={styles.instructionSubtitle}>{statusMessage || currentStep.subtitle}</Text>
          {renderProgressBar()}
        </View>

        <View style={styles.cameraContainer}>
          {kycData.livenessPassed ? (
            <View style={styles.previewContainer}>
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
                <Text style={styles.successTitle}>All Checks Passed!</Text>
                <Text style={styles.successSubtitle}>
                  Your identity has been verified successfully.
                </Text>
              </View>
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                <Ionicons name="refresh" size={20} color={Colors.white} />
                <Text style={styles.retakeText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          ) : hasPermission && device ? (
            <View style={styles.cameraWrapper}>
              <FaceCamera
                ref={cameraRef}
                style={styles.camera}
                device={device}
                isActive={!kycData.livenessPassed}
                faceDetectionOptions={FACE_OPTIONS}
                faceDetectionCallback={handleFaceDetection}
              />

              <View style={styles.faceGuideOverlay}>
                <View style={styles.faceGuideCircle} />
                {!faceVisible && !isProcessing && (
                  <Text style={styles.noFaceText}>Position your face here</Text>
                )}
              </View>

              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <View style={styles.processingBg}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.processingText}>
                      Verifying {currentStep.title.toLowerCase()}...
                    </Text>
                  </View>
                </View>
              )}

              {countdown > 0 && !isProcessing && (
                <View style={styles.countdownOverlay}>
                  <View style={styles.countdownCircle}>
                    <Text style={styles.countdownNumber}>{countdown}</Text>
                  </View>
                </View>
              )}

              <View style={styles.instructionOverlay}>
                <Text style={styles.instructionOverlayText}>
                  {statusMessage || currentStep.subtitle}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.permissionContainer}>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={async () => {
                  const result = await VisionCamera.requestCameraPermission();
                  setHasPermission(result === 'granted');
                }}
              >
                <Ionicons name="camera" size={48} color={Colors.primary} />
                <Text style={styles.permissionText}>Grant Camera Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, !kycData.livenessPassed && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!kycData.livenessPassed}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.grayText,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.grayText,
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 16,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.primary,
  },
  stepCircleCurrent: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  stepCirclePending: {
    backgroundColor: '#E0E0E0',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  stepNumberCurrent: {
    color: Colors.white,
  },
  stepNumberPending: {
    color: '#999999',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.grayText,
  },
  stepLabelCompleted: {
    color: Colors.primary,
  },
  stepLabelCurrent: {
    color: Colors.primary,
  },
  instructionCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 8,
  },
  instructionSubtitle: {
    fontSize: 14,
    color: Colors.grayText,
    lineHeight: 20,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  faceGuideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuideCircle: {
    width: FACE_GUIDE_SIZE,
    height: FACE_GUIDE_SIZE,
    borderRadius: FACE_GUIDE_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'transparent',
  },
  noFaceText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 16,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  processingBg: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.grayText,
    fontWeight: '600',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'center',
  },
  countdownCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  instructionOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12,
  },
  instructionOverlayText: {
    color: Colors.white,
    fontSize: 14,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.grayText,
    marginTop: 8,
    textAlign: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  retakeText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  permissionButton: {
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
