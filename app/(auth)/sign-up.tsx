import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { FormInput } from '../../components/form-input';
import { Button } from '../../components/button';
import { useAuth } from '../../contexts/auth-context';
import { ScreenLayout } from '../../components/screen-layout';
import { useLanguage } from '../../contexts/language-context';

interface PasswordCheck {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isStrong: boolean;
}

function checkPasswordStrength(password: string): PasswordCheck {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  return { hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar, isStrong };
}

function getStrengthColor(check: PasswordCheck): { level: number; color: string } {
  const passed = [check.hasMinLength, check.hasUppercase, check.hasLowercase, check.hasNumber, check.hasSpecialChar].filter(Boolean).length;
  if (passed <= 1) return { level: 0, color: '#E31E24' };
  if (passed === 2) return { level: 1, color: '#FF6B35' };
  if (passed === 3) return { level: 2, color: '#FFA500' };
  if (passed === 4) return { level: 3, color: '#90BE6D' };
  return { level: 4, color: '#4CAF50' };
}

export default function SignUpScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { signUp, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<'privacy' | 'terms'>('privacy');

  const passwordCheck = useMemo(() => checkPasswordStrength(password), [password]);
  const strengthInfo = useMemo(() => getStrengthColor(passwordCheck), [passwordCheck]);

  const handleNameChange = (text: string) => {
    setName(text);
    if (/[^a-zA-Z\s'.,-]/.test(text)) {
      setNameError(t('auth.signUp.nameInvalidChars'));
    } else {
      setNameError('');
    }
  };

  const isFormValid =
    name.length > 0 &&
    nameError.length === 0 &&
    email.length > 0 &&
    phone.length > 0 &&
    passwordCheck.isStrong &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    agreedToTerms;

  const handleSignUp = async () => {
    if (!isFormValid) return;
    try {
      await signUp(name, email, phone, password);
      router.push('/(auth)/verify-email' as any);
    } catch {
      // Error already shown via Alert in auth context
    }
  };

  return (
    <ScreenLayout title={t('auth.signUp.title')}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.greeting}>{t('auth.signUp.greeting')}</Text>
          <Text style={styles.subtitle}>{t('auth.signUp.subtitle')}</Text>

          <View style={styles.form}>
            <FormInput
              label={t('auth.signUp.nameLabel')}
              value={name}
              onChangeText={handleNameChange}
              placeholder={t('auth.signUp.namePlaceholder')}
            />
            {nameError ? <Text style={styles.mismatchText}>{nameError}</Text> : null}
            <FormInput
              label={t('auth.signUp.emailLabel')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.signUp.emailPlaceholder')}
              keyboardType="email-address"
            />
            <FormInput
              label={t('auth.signUp.phoneLabel')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('auth.signUp.phonePlaceholder')}
              keyboardType="phone-pad"
            />
            <FormInput
              label={t('auth.signUp.passwordLabel')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.signUp.passwordPlaceholder')}
              secureTextEntry
            />

            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarBg}>
                  {[0, 1, 2, 3, 4].map((i) => {
                    const passed = [passwordCheck.hasMinLength, passwordCheck.hasLowercase, passwordCheck.hasUppercase, passwordCheck.hasNumber, passwordCheck.hasSpecialChar].filter(Boolean).length;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.strengthSegment,
                          { backgroundColor: i < passed ? strengthInfo.color : Colors.grayBorder },
                        ]}
                      />
                    );
                  })}
                </View>
                <Text style={[styles.strengthLabel, { color: strengthInfo.color }]}>
                  {[t('auth.signUp.strengthVeryWeak'), t('auth.signUp.strengthWeak'), t('auth.signUp.strengthFair'), t('auth.signUp.strengthGood'), t('auth.signUp.strengthStrong')][strengthInfo.level]}
                </Text>

                <View style={styles.checkList}>
                  <CheckItem label={t('auth.signUp.checkMinLength')} passed={passwordCheck.hasMinLength} />
                  <CheckItem label={t('auth.signUp.checkLowercase')} passed={passwordCheck.hasLowercase} />
                  <CheckItem label={t('auth.signUp.checkUppercase')} passed={passwordCheck.hasUppercase} />
                  <CheckItem label={t('auth.signUp.checkNumber')} passed={passwordCheck.hasNumber} />
                  <CheckItem label={t('auth.signUp.checkSpecial')} passed={passwordCheck.hasSpecialChar} />
                </View>
              </View>
            )}

            <FormInput
              label={t('auth.signUp.confirmPasswordLabel')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
              secureTextEntry
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.mismatchText}>{t('auth.signUp.passwordMismatch')}</Text>
            )}

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxText}>
                <Text onPress={() => setAgreedToTerms(!agreedToTerms)}>{t('auth.signUp.termsPrefix')}</Text>
                <Text
                  style={styles.link}
                  onPress={() => { setModalContent('privacy'); setModalVisible(true); }}
                >{t('auth.signUp.privacyPolicy')}</Text>
                <Text onPress={() => setAgreedToTerms(!agreedToTerms)}>{t('auth.signUp.termsAnd')}</Text>
                <Text
                  style={styles.link}
                  onPress={() => { setModalContent('terms'); setModalVisible(true); }}
                >{t('auth.signUp.termsOfService')}</Text>
              </Text>
            </View>
          </View>

          <Button
            title={t('auth.signUp.button')}
            onPress={handleSignUp}
            disabled={!isFormValid}
            isLoading={isLoading}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.signUp.hasAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in' as any)}>
              <Text style={styles.footerLink}>{t('auth.signUp.signInLink')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalContent === 'privacy' ? t('auth.signUp.privacyPolicy') : t('auth.signUp.termsOfService')}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalText}>
              {modalContent === 'privacy'
                ? `Privacy Policy for Arsema Powered by MoneyGram
Last Updated: Mar, 11 2026

Welcome to Arsema Powered by MoneyGram ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal and financial information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (the "App") and related services.

By downloading, accessing, or using Arsema Powered by MoneyGram, you agree to the terms of this Privacy Policy. If you do not agree, please do not use the App.

1. Information We Collect
To provide you with secure money transfer services, we must collect various types of information:

A. Information You Provide to Us
Personal Identification Information: Full name, date of birth, physical address, email address, and phone number.

Financial Information: Bank account numbers, routing numbers, credit/debit card details, and billing addresses.

Identity Verification Information (KYC): Government-issued identification (e.g., passport, driver's license, national ID), Social Security Number (or local equivalent), and biometric data (e.g., a selfie) required to comply with Anti-Money Laundering (AML) and Know Your Customer (KYC) regulations.

Transaction Information: Details about the funds you send or receive, including the recipient's name, contact information, and banking details.

B. Information We Collect Automatically
Device Information: Hardware model, operating system, unique device identifiers (IMEI, MAC address), mobile network information, and IP address.

Usage Data: How you interact with the App, access times, pages viewed, and the routes by which you access the App.

Location Data: With your permission, we may collect precise geolocation data to prevent fraud and comply with regional financial regulations.

2. How We Use Your Information
We use the collected information for the following purposes:

To Process Transactions: Facilitating the transfer of funds between you and your designated recipients.

To Comply with Legal Obligations: Performing KYC/AML checks, monitoring for suspicious activity, and reporting to regulatory authorities as required by law.

To Prevent Fraud and Enhance Security: Detecting, preventing, and mitigating fraud, abuse, and security breaches.

To Provide Customer Support: Resolving disputes, collecting fees, and troubleshooting problems.

To Improve Our Services: Analyzing usage patterns to enhance the App's functionality and user experience.

To Communicate with You: Sending transaction alerts, security updates, administrative messages, and marketing communications (which you can opt out of).

3. How We Share Your Information
We do not sell your personal information. We may share your data with third parties only in the following circumstances:

Financial Institutions and Processing Partners: Banks, payment gateways, and clearinghouses necessary to execute your money transfers.

Service Providers: Third-party companies that help us run our business (e.g., identity verification services, cloud storage providers, fraud monitoring services, and customer support platforms).

Legal and Regulatory Authorities: Law enforcement, government agencies, or authorized third parties when required by law, subpoena, or court order, or to protect our rights and the safety of our users.

Business Transfers: In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred.

4. Data Security
The security of your financial data is our top priority. We implement industry-standard security measures, including:

Encryption: 256-bit SSL/TLS encryption for data in transit and encryption for data at rest.

Authentication: Multi-factor authentication (MFA) and biometric login (e.g., FaceID, fingerprint) to secure your account.

Monitoring: Continuous monitoring of our systems for vulnerabilities and unauthorized access.

Note: No method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.

5. Data Retention
We will retain your personal and financial information for as long as your account is active or as needed to provide you services. However, due to strict financial regulations (such as AML laws), we may be legally required to retain your transaction history and identity records for a specific period (typically 5 to 7 years) even after you close your account.

6. Your Data Privacy Rights
Depending on your location (e.g., under GDPR, CCPA, etc.), you may have the following rights:

Access: Request a copy of the personal data we hold about you.

Correction: Request that we correct inaccurate or incomplete data.

Deletion: Request the deletion of your data (subject to our legal data retention obligations).

Opt-Out: Opt out of marketing communications at any time.

To exercise any of these rights, please contact us at the email provided below.

7. Children's Privacy
Our App is not intended for use by anyone under the age of 18 (or the age of legal majority in your jurisdiction). We do not knowingly collect personal information from minors. If we discover that a minor has provided us with personal information, we will immediately close the account and delete the data, except where required by law.

8. Changes to This Privacy Policy
We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy in the App and updating the "Last Updated" date. We may also notify you via email or a push notification.

9. Contact Us
If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact our Data Protection Officer at:

Email: helpdesk@arsema.co.id

Mailing Address: PT Artha Semesta Utama, Jl. Cilandak Tengah N36, Cilandak Barat. Cilandak, Kota Jakarta Selatan 12430, INDONESIA

Phone Support: 62-21 71794849`
                : `
Terms of Service for Arsema Powered by MoneyGram
Last Updated: Mar, 11 2026

Welcome to Arsema Powered by MoneyGram ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our mobile application (the "App") and the money transfer services we provide (collectively, the "Services").

By downloading the App, creating an account, or using our Services, you agree to be bound by these Terms. If you do not agree, please do not use the App or Services.

1. Eligibility and Account Registration
To use Arsema Powered by MoneyGram, you must meet certain requirements and successfully register for an account:

Age Requirement: You must be at least 18 years old (or the age of legal majority in your jurisdiction) and have the legal capacity to enter into a binding contract.

Identity Verification (KYC): To comply with Anti-Money Laundering (AML) laws, you must provide accurate, current, and complete information during registration. You authorize us, directly or through third parties, to make any inquiries we consider necessary to validate your identity.

Account Security: You are responsible for maintaining the confidentiality of your login credentials (passwords, PINs, biometrics). You must notify us immediately of any unauthorized use of your account.

2. Using the Services
Our App allows you to send funds to, and receive funds from, designated individuals or entities.

Funding Your Transfers: You must link a valid payment method (e.g., bank account, debit card, or credit card) to fund your transactions. You represent that you have the legal right to use any payment method linked to your account.

Processing Times: While we strive for instant transfers, processing times may vary based on the payment method, the recipient's bank, fraud checks, and the destination country.

Transaction Limits: We may impose daily, weekly, or monthly limits on the amount of money you can send or receive. These limits may change based on your account verification status.

Cancellations and Refunds: Once a money transfer has been picked up or deposited into the recipient's account, it is generally non-refundable. You may request a cancellation before the funds are deposited or picked up, subject to our review and local laws.

3. Fees and Exchange Rates
Service Fees: We charge fees for our Services, which will be clearly displayed to you in the App before you confirm a transaction. By confirming the transaction, you agree to pay these fees.

Exchange Rates: If you are sending money internationally, the transaction may be subject to a currency conversion. We will display the applicable exchange rate before you finalize the transfer. Please note that we may generate revenue from the difference between the exchange rate we offer you and the rate we receive in the wholesale market.

Third-Party Fees: Your bank or credit card issuer may charge you additional fees (such as cash advance fees or overdraft fees) related to your use of our App. We are not responsible for these fees.

4. Prohibited Activities
You agree that you will not use Arsema Powered by MoneyGram for any unlawful or prohibited purpose, including but not limited to:

Illegal Activities: Funding or engaging in fraud, money laundering, terrorism financing, or the sale of illegal goods/narcotics.

Abusing the Platform: Attempting to double-spend funds, manipulating the exchange rate, or exploiting technical glitches.

Harmful Code: Introducing viruses, trojans, worms, or other harmful material to our App or servers.

Restricted Businesses: Using the App for unlicensed gambling, adult entertainment, or businesses requiring special permits without our prior written consent.

5. Account Suspension and Termination
We reserve the right to suspend, restrict, or terminate your access to the App at any time, without notice, for any reason, including:

Violation of these Terms or our Privacy Policy.

Suspicion of fraudulent, illegal, or unauthorized activity.

Requests from law enforcement or regulatory authorities.

Your account remaining inactive for an extended period.

6. Limitation of Liability
To the maximum extent permitted by law, Arsema Powered by MoneyGram and its affiliates, officers, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your use of or inability to use the Services. Our total liability for any claims arising under these Terms shall not exceed the amount of fees you paid us in the past twelve (12) months.

7. Dispute Resolution
Contact Us First: If you have a dispute, we strongly encourage you to contact our customer support team first to seek a resolution.

Governing Law: These Terms shall be governed by and construed in accordance with the laws of [Your State/Country], without regard to its conflict of law provisions.

Arbitration: Any unresolved dispute arising out of these Terms shall be resolved through binding arbitration in [Your City/State], rather than in court, except that you may assert claims in small claims court if your claims qualify.

8. Changes to These Terms
We may modify these Terms at any time. If we make material changes, we will provide you with reasonable notice through the App or by email before the changes take effect. Your continued use of the App after the changes become effective constitutes your agreement to the updated Terms.

9. Contact Information
If you have any questions about these Terms, please contact us at:

Email: helpdesk@arsema.co.id

Mailing Address: PT Artha Semesta Utama, Jl. Cilandak Tengah N36, Cilandak Barat. Cilandak, Kota Jakarta Selatan 12430, INDONESIA

Phone: 62-21 71794849`}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScreenLayout>
  );
}

function CheckItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={passed ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={passed ? '#4CAF50' : Colors.grayText}
      />
      <Text style={[styles.checkText, passed && styles.checkTextPassed]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: FontSize.heading,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.grayText,
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  strengthContainer: {
    marginTop: -8,
    marginBottom: 16,
  },
  strengthBarBg: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: 8,
  },
  checkList: {
    gap: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkText: {
    fontSize: FontSize.xs,
    color: Colors.grayText,
  },
  checkTextPassed: {
    color: '#4CAF50',
  },
  mismatchText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: -8,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.grayBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.grayText,
    lineHeight: 20,
  },
  link: {
    color: Colors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
  },
  footerLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  modalText: {
    fontSize: 14,
    color: Colors.grayText,
    lineHeight: 24,
    paddingBottom: 40,
  },
});
