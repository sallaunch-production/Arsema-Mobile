import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useKYC } from '../../contexts/kyc-context';

export default function TermsAndConditionsScreen() {
  const router = useRouter();
  const { kycData, updateKYCData, submitKYC, isLoading } = useKYC();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agreeTerms = kycData.agreeTerms;
  const agreeDataSharing = kycData.agreeDataSharing;
  const agreeDebit = kycData.agreeDebit;

  const allAgreed = agreeTerms;

  const handleProceed = async () => {
    if (!allAgreed) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit KYC data to API
      const success = await submitKYC();

      if (success) {
        router.replace('/(kyc)/success');
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      Alert.alert('Error', 'Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout title="Identity Verification">
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.subtitle}>Terms and Conditions</Text>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>
            IMPORTANT INFORMATION — Valued MoneyGram Customer
          </Text>
          <Text style={styles.warningSubtitle}>Please read these terms carefully before proceeding.</Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms of Service for Arsema</Text>
          <Text style={styles.termsDate}>Last Updated: March 2026</Text>

          <Text style={styles.termsBody}>
            Welcome to Arsema ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our mobile application (the "App") and the money transfer services we provide (collectively, the "Services").
          </Text>
          <Text style={styles.termsBody}>
            By downloading the App, creating an account, or using our Services, you agree to be bound by these Terms. If you do not agree, please do not use the App or Services.
          </Text>

          <Text style={styles.sectionHeader}>1. Eligibility and Account Registration</Text>
          <Text style={styles.termsBody}>
            To use Arsema, you must meet certain requirements and successfully register for an account:
          </Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Age Requirement:</Text> You must be at least 18 years old (or the age of legal majority in your jurisdiction) and have the legal capacity to enter into a binding contract.</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Identity Verification (KYC):</Text> To comply with Anti-Money Laundering (AML) laws, you must provide accurate, current, and complete information during registration. You authorize us to make any inquiries we consider necessary to validate your identity.</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Account Security:</Text> You are responsible for maintaining the confidentiality of your login credentials (passwords, PINs, biometrics). You must notify us immediately of any unauthorized use of your account.</Text>

          <Text style={styles.sectionHeader}>2. Using the Services</Text>
          <Text style={styles.termsBody}>
            Our App allows you to send funds to, and receive funds from, designated individuals or entities.
          </Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Funding Your Transfers:</Text> You must link a valid payment method (e.g., bank account, debit card, or credit card) to fund your transactions.</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Processing Times:</Text> While we strive for instant transfers, processing times may vary based on the payment method, the recipient's bank, fraud checks, and the destination country.</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Transaction Limits:</Text> We may impose daily, weekly, or monthly limits on the amount of money you can send or receive.</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Cancellations and Refunds:</Text> Once a money transfer has been picked up or deposited, it is generally non-refundable. You may request a cancellation before the funds are deposited or picked up.</Text>

          <Text style={styles.sectionHeader}>3. Fees and Exchange Rates</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Service Fees:</Text> We charge fees for our Services, which will be clearly displayed before you confirm a transaction.</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Exchange Rates:</Text> International transactions may be subject to currency conversion. The applicable exchange rate will be displayed before you finalize the transfer.</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Third-Party Fees:</Text> Your bank or credit card issuer may charge additional fees related to your use of our App. We are not responsible for these fees.</Text>

          <Text style={styles.sectionHeader}>4. Prohibited Activities</Text>
          <Text style={styles.termsBody}>
            You agree that you will not use Arsema for any unlawful or prohibited purpose, including but not limited to:
          </Text>
          <Text style={styles.termsBullet}>• Funding or engaging in fraud, money laundering, terrorism financing, or the sale of illegal goods.</Text>
          <Text style={styles.termsBullet}>• Attempting to double-spend funds, manipulating exchange rates, or exploiting technical glitches.</Text>
          <Text style={styles.termsBullet}>• Introducing viruses, trojans, worms, or other harmful material to our App or servers.</Text>

          <Text style={styles.sectionHeader}>5. Account Suspension and Termination</Text>
          <Text style={styles.termsBody}>
            We reserve the right to suspend, restrict, or terminate your access to the App at any time, without notice, for any reason, including:
          </Text>
          <Text style={styles.termsBullet}>• Violation of these Terms or our Privacy Policy.</Text>
          <Text style={styles.termsBullet}>• Suspicion of fraudulent, illegal, or unauthorized activity.</Text>
          <Text style={styles.termsBullet}>• Requests from law enforcement or regulatory authorities.</Text>

          <Text style={styles.sectionHeader}>6. Limitation of Liability</Text>
          <Text style={styles.termsBody}>
            To the maximum extent permitted by law, Arsema and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Services. Our total liability shall not exceed the fees you paid us in the past twelve (12) months.
          </Text>

          <Text style={styles.sectionHeader}>7. Dispute Resolution</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Contact Us First:</Text> If you have a dispute, we encourage you to contact our customer support team first.</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Governing Law:</Text> These Terms shall be governed by and construed in accordance with the laws of the Republic of Indonesia.</Text>
          <Text style={styles.termsBullet}>• <Text style={styles.termsBold}>Arbitration:</Text> Any unresolved dispute shall be resolved through binding arbitration, except for claims qualifying for small claims court.</Text>

          <Text style={styles.sectionHeader}>8. Changes to These Terms</Text>
          <Text style={styles.termsBody}>
            We may modify these Terms at any time. If we make material changes, we will provide reasonable notice through the App or by email. Your continued use of the App constitutes agreement to the updated Terms.
          </Text>

          <Text style={styles.sectionHeader}>9. Contact Information</Text>
          <Text style={styles.termsBody}>
            If you have any questions about these Terms, please contact us at:
          </Text>
          <Text style={styles.termsBullet}>• Email: helpdesk@arsema.co.id</Text>
          <Text style={styles.termsBullet}>• Phone: +62 21 71794849</Text>
        </View>

        <View style={styles.checkboxSection}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => updateKYCData({ agreeTerms: !agreeTerms })}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
              {agreeTerms && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <Text style={styles.checkboxLabel}>
              By proceeding to create an account you agree to our Terms and Conditions.
            </Text>
          </TouchableOpacity>


        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.proceedButton, (!allAgreed || isSubmitting) && styles.proceedButtonDisabled]}
          onPress={handleProceed}
          disabled={!allAgreed || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.proceedButtonText}>I agree, Proceed to create the account</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 15, fontWeight: '600', color: Colors.black, marginBottom: 16 },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningTitle: { fontSize: 13, fontWeight: '700', color: Colors.black },
  warningHighlight: { color: Colors.primary },
  warningSubtitle: { fontSize: 12, color: Colors.grayText, marginTop: 4, fontWeight: '600' },
  termsSection: {
    marginBottom: 20,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  termsDate: {
    fontSize: 11,
    color: Colors.grayText,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.black,
    marginTop: 14,
    marginBottom: 6,
  },
  termsBody: {
    fontSize: 12,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  termsBullet: {
    fontSize: 12,
    color: '#555',
    lineHeight: 20,
    paddingLeft: 8,
    marginBottom: 4,
  },
  termsBold: {
    fontWeight: '700',
    color: '#333',
  },
  checkboxSection: { gap: 16 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: Colors.black,
    flex: 1,
    lineHeight: 18,
  },
  bottomContainer: { padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: Colors.grayBorder },
  proceedButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  proceedButtonDisabled: { opacity: 0.5 },
  proceedButtonText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
});
