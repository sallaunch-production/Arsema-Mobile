# Settings Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Notification Settings, Language Settings (EN/ID across all screens), and Delete Account request flow.

**Architecture:** AsyncStorage-backed language context wraps the whole app; all hardcoded strings replaced with `t(key)` calls from `useLanguage()`; notification preferences stored in AsyncStorage and checked before showing foreground banners; delete account submits to backend then signs out.

**Tech Stack:** React Native, Expo SDK 55, TypeScript, `@react-native-async-storage/async-storage`, `expo-router`, `react-native-safe-area-context`

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Install | `package.json` | Add AsyncStorage dependency |
| Create | `constants/translations.ts` | All EN + ID strings |
| Create | `contexts/language-context.tsx` | Language state + `t()` helper |
| Modify | `app/_layout.tsx` | Wrap with LanguageProvider |
| Create | `app/(profile)/notification-settings.tsx` | 3-toggle screen |
| Modify | `hooks/use-push-notifications.ts` | Filter foreground notifs |
| Create | `app/(profile)/language.tsx` | EN/ID selector screen |
| Modify | `app/(auth)/sign-in.tsx` | Apply translations |
| Modify | `app/(auth)/sign-up.tsx` | Apply translations |
| Modify | `app/(auth)/verify-email.tsx` | Apply translations |
| Modify | `app/(auth)/forgot-password.tsx` | Apply translations |
| Modify | `app/(auth)/set-pin.tsx` | Apply translations |
| Modify | `app/(auth)/confirm-pin.tsx` | Apply translations |
| Modify | `app/(tabs)/index.tsx` | Apply translations |
| Modify | `app/(tabs)/transaction.tsx` | Apply translations |
| Modify | `app/(tabs)/support.tsx` | Apply translations |
| Modify | `app/(tabs)/profile.tsx` | Apply translations + wire navigation + add delete account |
| Modify | `app/notifications.tsx` | Apply translations |
| Modify | `app/(profile)/personal-information.tsx` | Apply translations |
| Modify | `app/(profile)/edit-profile.tsx` | Apply translations |
| Modify | `app/(moneygram)/transfer.tsx` | Apply translations |
| Modify | `app/(moneygram)/service-options.tsx` | Apply translations |
| Modify | `app/(moneygram)/beneficiary-details.tsx` | Apply translations |
| Modify | `app/(moneygram)/sending-details.tsx` | Apply translations |
| Modify | `app/(moneygram)/review-send.tsx` | Apply translations |
| Modify | `app/(moneygram)/payment-method.tsx` | Apply translations |
| Modify | `app/(moneygram)/review-pin.tsx` | Apply translations |
| Modify | `app/(moneygram)/virtual-account.tsx` | Apply translations |
| Modify | `app/(moneygram)/transaction-success.tsx` | Apply translations |
| Modify | `app/(moneygram)/transaction-detail.tsx` | Apply translations |
| Modify | `app/(kyc)/personal-details.tsx` | Apply translations |
| Modify | `app/(kyc)/identity-information.tsx` | Apply translations |
| Create | `app/(profile)/delete-account.tsx` | Delete request screen |

---

## Task 1: Install AsyncStorage

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

```bash
cd /Users/afry/Project/arsema-mg-react-native
npm install @react-native-async-storage/async-storage --legacy-peer-deps
```

Expected output: `added 1 package` (or similar, no errors)

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @react-native-async-storage/async-storage"
```

---

## Task 2: Create Translations

**Files:**
- Create: `constants/translations.ts`

- [ ] **Step 1: Create the file with all EN and ID strings**

```typescript
// constants/translations.ts
// All user-facing strings for EN and ID.
// Key format: <group>.<screen>.<element>
// Usage: const { t } = useLanguage(); t('auth.signIn.title')

export type TranslationKey = keyof typeof translations.en;

export const translations = {
  en: {
    // ── Auth ──────────────────────────────────────────────
    'auth.signIn.title': 'Sign In',
    'auth.signIn.greeting': 'Hello, there!',
    'auth.signIn.subtitle': 'Sign in to continue',
    'auth.signIn.emailLabel': 'Email Address',
    'auth.signIn.emailPlaceholder': 'Ex.: example@gmail.com',
    'auth.signIn.passwordLabel': 'Password',
    'auth.signIn.passwordPlaceholder': 'Type in your password',
    'auth.signIn.forgotPassword': 'Forgot your password ?',
    'auth.signIn.button': 'Sign in',
    'auth.signIn.noAccount': "Don't have an account?  ",
    'auth.signIn.signUpLink': 'Sign Up',

    'auth.signUp.title': 'Sign Up',
    'auth.signUp.greeting': 'Hello, there!',
    'auth.signUp.subtitle': 'Create New Account',
    'auth.signUp.nameLabel': 'Your Name',
    'auth.signUp.namePlaceholder': 'Enter your full name',
    'auth.signUp.emailLabel': 'Email Address',
    'auth.signUp.emailPlaceholder': 'Enter your email',
    'auth.signUp.phoneLabel': 'Phone Number',
    'auth.signUp.phonePlaceholder': 'Enter your phone number',
    'auth.signUp.passwordLabel': 'New Password',
    'auth.signUp.passwordPlaceholder': 'Enter your password',
    'auth.signUp.confirmPasswordLabel': 'Confirm New Password',
    'auth.signUp.confirmPasswordPlaceholder': 'Confirm your password',
    'auth.signUp.passwordMismatch': 'Passwords do not match',
    'auth.signUp.termsPrefix': 'By creating an account, you agree to our ',
    'auth.signUp.privacyPolicy': 'Privacy Policy',
    'auth.signUp.termsAnd': ' and ',
    'auth.signUp.termsOfService': 'Terms of Service',
    'auth.signUp.button': 'Create Account',
    'auth.signUp.hasAccount': 'Already have an account? ',
    'auth.signUp.signInLink': 'Sign In',
    'auth.signUp.strengthVeryWeak': 'Very Weak',
    'auth.signUp.strengthWeak': 'Weak',
    'auth.signUp.strengthFair': 'Fair',
    'auth.signUp.strengthGood': 'Good',
    'auth.signUp.strengthStrong': 'Strong',
    'auth.signUp.checkMinLength': 'At least 8 characters',
    'auth.signUp.checkLowercase': 'Lowercase letter (a-z)',
    'auth.signUp.checkUppercase': 'Uppercase letter (A-Z)',
    'auth.signUp.checkNumber': 'Number (0-9)',
    'auth.signUp.checkSpecial': 'Special character (!@#$...)',

    'auth.verifyEmail.title': 'Verify your email',
    'auth.verifyEmail.subtitle': 'We have sent a 6 digit OTP code to',
    'auth.verifyEmail.validity': 'The code is valid for 10 minutes',
    'auth.verifyEmail.sending': 'Sending...',
    'auth.verifyEmail.resendIn': 'Resend OTP in {cooldown}s',
    'auth.verifyEmail.resend': 'Resend OTP',
    'auth.verifyEmail.didntReceive': "Didn't receive the code? ",
    'auth.verifyEmail.button': 'Next',

    'auth.forgotPassword.title': 'Forgot Password',
    'auth.forgotPassword.heading': 'Reset Your Password',
    'auth.forgotPassword.description': "Enter the email address associated with your account. We'll send you a link to reset your password.",
    'auth.forgotPassword.emailLabel': 'Email Address',
    'auth.forgotPassword.emailPlaceholder': 'Enter your email',
    'auth.forgotPassword.button': 'Send Reset Link',
    'auth.forgotPassword.successTitle': 'Check Your Email',
    'auth.forgotPassword.successPrefix': "We've sent a password reset link to ",
    'auth.forgotPassword.successInstruction': 'Please check your inbox and follow the instructions.',
    'auth.forgotPassword.backButton': 'Back to Sign In',
    'auth.forgotPassword.didntReceive': "Didn't receive the email? ",
    'auth.forgotPassword.tryAgain': 'Try again',

    'auth.setPin.title': 'Set up PIN',
    'auth.setPin.subtitle': 'This is a 6 digits passcode that will always be used to secure every transaction.',

    'auth.confirmPin.title': 'Confirm PIN',
    'auth.confirmPin.subtitle': 'Make sure you enter the correct PIN',
    'auth.confirmPin.mismatchTitle': 'PIN Mismatch',
    'auth.confirmPin.mismatchMessage': 'The PINs do not match. Please try again.',

    // ── Home ──────────────────────────────────────────────
    'home.title': 'Arsema Mobile',
    'home.greeting': 'Good Afternoon,',
    'home.kycPending': 'Verification in Progress. Please allow up to 2x24 hours for our team to verify your identity. We will notify you once your account is ready to use.',
    'home.kycBanner': 'Verify your identity to get full access and Premium features.',
    'home.verify': 'Verify',
    'home.promo': 'Promo',
    'home.logout': 'Logout',
    'home.logoutConfirmTitle': 'Logout',
    'home.logoutConfirmMessage': 'Are you sure you want to logout?',
    'home.logoutCancel': 'Cancel',

    // ── Tabs ──────────────────────────────────────────────
    'tabs.transaction.title': 'Transaction History',
    'tabs.transaction.tabSend': 'Send',
    'tabs.transaction.tabReceived': 'Received',
    'tabs.transaction.tabLocal': 'Local Transfer',
    'tabs.transaction.tabBill': 'Bill Payment',
    'tabs.transaction.emptyTitle': 'No transaction history',
    'tabs.transaction.emptySubtitle': "You haven't sent any money yet",

    'tabs.support.title': 'Support',
    'tabs.support.faqTitle': 'Frequently Asked Questions',
    'tabs.support.faq1Q': 'How do I send money?',
    'tabs.support.faq1A': 'To send money, tap "Send Money" on the home screen, enter the recipient\'s details, specify the amount, and confirm the transaction.',
    'tabs.support.faq2Q': 'What are the transfer fees?',
    'tabs.support.faq2A': 'Transfer fees vary depending on the amount and destination. Domestic transfers under Rp 1,000,000 are free. Check the fee schedule in Settings for more details.',
    'tabs.support.faq3Q': 'How long do transfers take?',
    'tabs.support.faq3A': 'Domestic transfers are usually instant. International transfers may take 1-3 business days depending on the destination country.',
    'tabs.support.faq4Q': 'How do I verify my identity?',
    'tabs.support.faq4A': 'Go to Profile > Personal Information and follow the verification steps. You will need a valid government-issued ID and a selfie.',
    'tabs.support.faq5Q': 'Is my money safe?',
    'tabs.support.faq5A': 'Yes. We use bank-level encryption and are regulated by the financial authority. Your funds are kept in segregated accounts.',
    'tabs.support.contactTitle': 'Contact Us',
    'tabs.support.contactEmail': 'Email',
    'tabs.support.contactEmailValue': 'helpdesk@arsema.co.id',
    'tabs.support.contactPhone': 'Phone',
    'tabs.support.contactPhoneValue': '+62 21 71794849',
    'tabs.support.contactChat': 'Live Chat',
    'tabs.support.contactChatDesc': 'Available 24/7',

    // ── Notifications ─────────────────────────────────────
    'notifications.title': 'Notifications',
    'notifications.emptyTitle': 'No notifications',
    'notifications.emptySubtitle': "You're all caught up! New notifications will appear here.",

    // ── Profile ───────────────────────────────────────────
    'profile.title': 'Profile',
    'profile.menu.personal': 'Personal Information',
    'profile.menu.security': 'Security Settings',
    'profile.menu.notifications': 'Notification Settings',
    'profile.menu.language': 'Language',
    'profile.menu.about': 'About',
    'profile.menu.deleteAccount': 'Delete Account',
    'profile.menu.logout': 'Logout',

    'profile.personalInfo.title': 'Personal Information',
    'profile.personalInfo.accountDetails': 'Account Details',
    'profile.personalInfo.fullName': 'Full Name',
    'profile.personalInfo.email': 'Email Address',
    'profile.personalInfo.phone': 'Phone Number',
    'profile.personalInfo.profileDetails': 'Profile Details',
    'profile.personalInfo.edit': 'Edit',
    'profile.personalInfo.occupation': 'Occupation',
    'profile.personalInfo.address': 'Address',
    'profile.personalInfo.city': 'City',
    'profile.personalInfo.state': 'State / Province',
    'profile.personalInfo.postalCode': 'Postal Code',
    'profile.personalInfo.country': 'Country',
    'profile.personalInfo.loadError': 'Failed to load profile data.',

    'profile.editProfile.title': 'Edit Profile',
    'profile.editProfile.occupationLabel': 'Occupation *',
    'profile.editProfile.occupationPlaceholder': 'Choose occupation',
    'profile.editProfile.phoneLabel': 'Phone Number *',
    'profile.editProfile.phonePlaceholder': 'e.g. +6281234567890',
    'profile.editProfile.countryLabel': 'Country *',
    'profile.editProfile.countryPlaceholder': 'Choose country',
    'profile.editProfile.stateLabel': 'State / Province *',
    'profile.editProfile.statePlaceholder': 'Choose state',
    'profile.editProfile.stateInputPlaceholder': 'Enter state or province',
    'profile.editProfile.cityLabel': 'City *',
    'profile.editProfile.cityPlaceholder': 'Enter city',
    'profile.editProfile.postalLabel': 'Postal Code *',
    'profile.editProfile.postalPlaceholder': 'Enter postal code',
    'profile.editProfile.address1Label': 'Address Line 1 *',
    'profile.editProfile.address1Placeholder': 'Street address, PO Box, etc.',
    'profile.editProfile.address2Label': 'Address Line 2 (Optional)',
    'profile.editProfile.address2Placeholder': 'Apartment, suite, unit, etc.',
    'profile.editProfile.saveButton': 'Save Changes',
    'profile.editProfile.validationError': 'Please fill in all required fields.',
    'profile.editProfile.successMessage': 'Profile updated successfully!',
    'profile.editProfile.failError': 'Failed to update profile.',
    'profile.editProfile.unexpectedError': 'An unexpected error occurred.',

    'profile.notifSettings.title': 'Notification Settings',
    'profile.notifSettings.transactions': 'Transaction Updates',
    'profile.notifSettings.transactionsDesc': 'Receive notifications for transaction status changes',
    'profile.notifSettings.promotions': 'Promotions',
    'profile.notifSettings.promotionsDesc': 'Receive promotional offers and discounts',
    'profile.notifSettings.system': 'System Alerts',
    'profile.notifSettings.systemDesc': 'Important account and security notifications',

    'profile.language.title': 'Language',
    'profile.language.english': 'English',
    'profile.language.indonesian': 'Bahasa Indonesia',

    'profile.deleteAccount.title': 'Delete Account',
    'profile.deleteAccount.warning': 'This action cannot be undone. Your account and all data will be permanently deleted.',
    'profile.deleteAccount.reasonLabel': 'Reason for deleting account',
    'profile.deleteAccount.reasonPlaceholder': 'Select a reason',
    'profile.deleteAccount.reason1': 'I no longer use this service',
    'profile.deleteAccount.reason2': 'Privacy concerns',
    'profile.deleteAccount.reason3': 'Too complicated to use',
    'profile.deleteAccount.reason4': 'Switching to another service',
    'profile.deleteAccount.reason5': 'Other',
    'profile.deleteAccount.detailLabel': 'Please describe your reason',
    'profile.deleteAccount.detailPlaceholder': 'Tell us more...',
    'profile.deleteAccount.checkbox': 'I understand my account and all data will be permanently deleted',
    'profile.deleteAccount.submitButton': 'Submit Request',
    'profile.deleteAccount.successTitle': 'Request Submitted',
    'profile.deleteAccount.successMessage': 'Your delete request has been submitted. We will process it within 3-5 business days.',
    'profile.deleteAccount.pendingError': 'You have pending transactions. Please wait until they are completed before deleting your account.',
    'profile.deleteAccount.errorTitle': 'Error',

    // ── MoneyGram ─────────────────────────────────────────
    'mg.transfer.title': 'Transfer',
    'mg.transfer.destinationLabel': 'Destination country *',
    'mg.transfer.destinationPlaceholder': 'Choose your destination country',
    'mg.transfer.loadError': 'Failed to load countries',
    'mg.transfer.retry': 'Tap to retry',
    'mg.transfer.amountLabel': 'Amount *',
    'mg.transfer.currencyReceive': 'In local currency',
    'mg.transfer.currencySend': 'In IDR currency',
    'mg.transfer.quoteByLabel': 'Quote by: *',
    'mg.transfer.sendAmount': 'Send Amount (IDR)',
    'mg.transfer.receiveAmount': 'Receive Amount',
    'mg.transfer.promoLabel': 'Promo Code',
    'mg.transfer.promoPlaceholder': 'Enter your promo code',
    'mg.transfer.promoHint': 'Promo code will be applied to this transaction in a form of cashback to your bank account.',
    'mg.transfer.nextButton': 'Next',
    'mg.transfer.minAmountError': 'Minimum amount is {minLabel}',
    'mg.transfer.signInError': 'Please sign in to continue',
    'mg.transfer.tokenError': 'Failed to get proxy token',
    'mg.transfer.countriesError': 'Countries service temporarily unavailable. Please try again.',

    'mg.serviceOptions.title': 'Service Options',
    'mg.serviceOptions.destinationLabel': 'Destination country *',
    'mg.serviceOptions.amountLabel': 'Amount *',
    'mg.serviceOptions.chooseService': 'Choose your Service',
    'mg.serviceOptions.noQuote': 'No quote data available.',
    'mg.serviceOptions.estimatedReceive': 'Estimated Receive Amount',
    'mg.serviceOptions.estimatedPrefix': 'Estimated ',
    'mg.serviceOptions.receivedAmount': 'Received Amount',
    'mg.serviceOptions.fee': 'Fee',
    'mg.serviceOptions.discount': 'Discount',
    'mg.serviceOptions.estimatedFee': 'Estimated Receive Fee',
    'mg.serviceOptions.estimatedTax': 'Estimated Receive Tax',
    'mg.serviceOptions.receiveTax': 'Receive Tax',
    'mg.serviceOptions.totalCollect': 'Total Amount to Collect',
    'mg.serviceOptions.estimatedTotal': 'Estimated Receive Total',
    'mg.serviceOptions.sentAmount': 'Sent Amount',
    'mg.serviceOptions.estimatedBanner': 'Receive amounts are estimated and may vary',
    'mg.serviceOptions.disclaimer': 'Not all currencies are available at all locations. The above exchange rate is only an approximation. The actual exchange rate will be the rate that is in effect at the time the transfer is received.',
    'mg.serviceOptions.kycRequired': 'Identity verification required to complete this transaction.',
    'mg.serviceOptions.kycPending': 'Verification in Progress. Please allow up to 24 hours for our team to verify your identity. We will notify you once your account is ready to use.',
    'mg.serviceOptions.verifyNow': 'Verify Now',
    'mg.serviceOptions.continueButton': 'Continue',

    'mg.beneficiary.title': 'Beneficiary Details',
    'mg.beneficiary.searchLabel': 'Search to autofill',
    'mg.beneficiary.searchPlaceholder': 'By name or ID of beneficiary',
    'mg.beneficiary.firstNameLabel': 'First Name *',
    'mg.beneficiary.firstNamePlaceholder': 'ex.: John',
    'mg.beneficiary.middleNameLabel': 'Middle Name',
    'mg.beneficiary.middleNamePlaceholder': 'ex.: Doe',
    'mg.beneficiary.lastNameLabel': 'Last Name *',
    'mg.beneficiary.lastNamePlaceholder': 'Janssen',
    'mg.beneficiary.phoneLabel': 'Phone Number *',
    'mg.beneficiary.phonePlaceholder': 'ex.: 62839192010',
    'mg.beneficiary.loadingFields': 'Loading additional fields...',
    'mg.beneficiary.saveDir': 'Save to directory of beneficiary',
    'mg.beneficiary.nextButton': 'Next',
    'mg.beneficiary.noResults': 'No beneficiaries found',
    'mg.beneficiary.searchError': 'Failed to search beneficiaries',

    'mg.sendingDetails.title': 'Sending Details',
    'mg.sendingDetails.purposeLabel': 'Purpose of Transactions',
    'mg.sendingDetails.purposePlaceholder': 'Select a purpose',
    'mg.sendingDetails.sourceLabel': 'Source of Funds',
    'mg.sendingDetails.sourcePlaceholder': 'Select a source of funds',
    'mg.sendingDetails.relationshipLabel': 'Relationship to Beneficiary',
    'mg.sendingDetails.relationshipPlaceholder': 'Select the most related',
    'mg.sendingDetails.acknowledgeLabel': 'I acknowledge that every information given here is correct',
    'mg.sendingDetails.termsLabel': 'I have read and agree to the Terms and Conditions.',
    'mg.sendingDetails.nextButton': 'Next',

    'mg.reviewSend.title': 'Review Send via MoneyGram',
    'mg.reviewSend.dateLabel': 'Date',
    'mg.reviewSend.typeLabel': 'Transaction Type',
    'mg.reviewSend.typeValue': 'Send via MoneyGram',
    'mg.reviewSend.beneficiarySection': 'BENEFICIARY DETAILS',
    'mg.reviewSend.fullName': 'Full Name',
    'mg.reviewSend.phone': 'Phone Number',
    'mg.reviewSend.country': 'Country',
    'mg.reviewSend.transactionSection': 'TRANSACTIONS DETAILS',
    'mg.reviewSend.destination': 'Destination Country',
    'mg.reviewSend.service': 'Service',
    'mg.reviewSend.amount': 'Amount',
    'mg.reviewSend.fxRate': 'FX Rate',
    'mg.reviewSend.receiveAmount': 'Receive Amount',
    'mg.reviewSend.fee': 'Sending Fee',
    'mg.reviewSend.total': 'TOTAL',
    'mg.reviewSend.continueButton': 'Continue to Payment',

    'mg.paymentMethod.title': 'Payment Method',
    'mg.paymentMethod.vaTitle': 'Virtual Account',
    'mg.paymentMethod.vaDesc': 'Transfer with Permata Virtual Account',
    'mg.paymentMethod.qrisTitle': 'QRIS',
    'mg.paymentMethod.qrisDesc': 'Transfer with Dynamic QRIS from Permata',
    'mg.paymentMethod.nextButton': 'Next',

    'mg.reviewPin.title': 'Enter PIN',
    'mg.reviewPin.subtitle': 'Enter your PIN to confirm',
    'mg.reviewPin.sessionExpired': 'Session expired. Please sign in again.',
    'mg.reviewPin.invalidPin': 'Invalid PIN. Please try again.',
    'mg.reviewPin.connectionError': 'Failed to verify PIN. Please check your connection.',

    'mg.virtualAccount.title': 'Virtual Account',
    'mg.virtualAccount.paymentInProgress': 'Payment in progress',
    'mg.virtualAccount.vaLabel': 'Virtual Account Number',
    'mg.virtualAccount.totalLabel': 'Total Amount to Collect',
    'mg.virtualAccount.infoTitle': 'Information:',
    'mg.virtualAccount.infoText': 'Please wait while we are still processing your sending transactions.',
    'mg.virtualAccount.timerLabel': 'Please complete the transaction in the remaining time left',
    'mg.virtualAccount.checkButton': 'Check payment status',
    'mg.virtualAccount.howToPayTitle': 'HOW TO PAY',
    'mg.virtualAccount.howToPaySubtitle': 'Finish the transaction using Virtual Account Number above',
    'mg.virtualAccount.step1': '1. Copy Virtual Account Number above',
    'mg.virtualAccount.step2': '2. Open your m-banking apps or digital banking apps',
    'mg.virtualAccount.step3': '3. After logging in, choose transfer menu',
    'mg.virtualAccount.step4': '4. Transfer',
    'mg.virtualAccount.step5': '5. Enter the Virtual Account Number copied before',
    'mg.virtualAccount.step6': '6. Check the amount to be transferred',
    'mg.virtualAccount.step7': '7. Paid',
    'mg.virtualAccount.copiedTitle': 'Copied',
    'mg.virtualAccount.copiedMessage': 'Virtual Account number copied to clipboard',
    'mg.virtualAccount.timeoutError': 'Request timed out. Please try again.',
    'mg.virtualAccount.paymentPendingError': "We haven't received your payment yet. Please complete the transfer and try again in a few moments.",
    'mg.virtualAccount.errorTitle': 'Error',

    'mg.txSuccess.title': 'Transaction Success!',
    'mg.txSuccess.refLabel': 'MG Reference Number',
    'mg.txSuccess.beneficiaryLabel': 'Beneficiary',
    'mg.txSuccess.serviceLabel': 'Service',
    'mg.txSuccess.deliveryLabel': 'Estimated date of delivery',
    'mg.txSuccess.statusLabel': 'Status',
    'mg.txSuccess.receiveLabel': 'Received Amount',
    'mg.txSuccess.notesLabel': 'Notes',
    'mg.txSuccess.infoTitle': 'Information:',
    'mg.txSuccess.infoText': 'This receipt has been sent to your email.',
    'mg.txSuccess.doneButton': 'Done',
    'mg.txSuccess.shareButton': 'Share receipt',

    'mg.txDetail.title': 'Transaction Detail',
    'mg.txDetail.statusLabel': 'Status',
    'mg.txDetail.refLabel': 'Reference Number',
    'mg.txDetail.sendAmountLabel': 'Send Amount',
    'mg.txDetail.feeLabel': 'Fee',
    'mg.txDetail.totalLabel': 'Total Paid',
    'mg.txDetail.receiveLabel': 'Receive Amount',
    'mg.txDetail.checkButton': 'Check Payment Status',
    'mg.txDetail.shareButton': 'Share Receipt',
    'mg.txDetail.goBack': 'Go Back',
    'mg.txDetail.customerService': 'Please contact Arsema Customer Service',

    // ── KYC ───────────────────────────────────────────────
    'kyc.title': 'Identity Verification',
    'kyc.personalDetails.subtitle': 'Personal Details',
    'kyc.personalDetails.firstNameLabel': 'First Name *',
    'kyc.personalDetails.firstNamePlaceholder': 'First Name',
    'kyc.personalDetails.middleNameLabel': 'Middle Name',
    'kyc.personalDetails.lastNameLabel': 'Last Name 1 *',
    'kyc.personalDetails.address1Label': 'Address 1 *',
    'kyc.personalDetails.address1Placeholder': 'ex: Jl. Sudirman No. 1',
    'kyc.personalDetails.address2Label': 'Address 2',
    'kyc.personalDetails.address2Placeholder': 'Optional',
    'kyc.personalDetails.buildingLabel': 'Building Number',
    'kyc.personalDetails.countryLabel': 'Country *',
    'kyc.personalDetails.stateLabel': 'State *',
    'kyc.personalDetails.statePlaceholder': 'Select State',
    'kyc.personalDetails.stateInputPlaceholder': 'ex: West Jakarta',
    'kyc.personalDetails.cityLabel': 'City *',
    'kyc.personalDetails.cityPlaceholder': 'ex: Semarang',
    'kyc.personalDetails.postalLabel': 'Postal Code',
    'kyc.personalDetails.postalPlaceholder': 'ex: 51133',
    'kyc.personalDetails.selectStateTitle': 'Select State/Province',
    'kyc.personalDetails.stateSearch': 'Search state...',
    'kyc.personalDetails.selectCountryTitle': 'Select Country',
    'kyc.personalDetails.countrySearch': 'Search country...',
    'kyc.personalDetails.nextButton': 'Next',

    'kyc.identity.subtitle': 'Identity Information',
    'kyc.identity.typeLabel': 'Identity Type *',
    'kyc.identity.typePlaceholder': 'Choose one',
    'kyc.identity.numberLabel': 'Identity Number *',
    'kyc.identity.numberPlaceholder': 'Type the number in the identity',
    'kyc.identity.dobLabel': 'Date of Birth *',
    'kyc.identity.dobPlaceholder': 'DD-MM-YYYY',
    'kyc.identity.dobModalTitle': 'Date of Birth',
    'kyc.identity.dayColumn': 'Day',
    'kyc.identity.monthColumn': 'Month',
    'kyc.identity.yearColumn': 'Year',
    'kyc.identity.confirmDate': 'Confirm',
    'kyc.identity.countryOfBirthLabel': 'Country of Birth *',
    'kyc.identity.countryOfBirthPlaceholder': 'Choose the country',
    'kyc.identity.birthStateLabel': 'Birth State *',
    'kyc.identity.birthStatePlaceholder': 'Choose the state',
    'kyc.identity.cityOfBirthLabel': 'City of Birth *',
    'kyc.identity.cityOfBirthPlaceholder': 'Type the city of birth',
    'kyc.identity.nationalityLabel': 'Nationality *',
    'kyc.identity.nationalityPlaceholder': 'Choose the nationality',
    'kyc.identity.expiryLabel': 'Expiry Date *',
    'kyc.identity.occupationLabel': 'Occupation *',
    'kyc.identity.occupationPlaceholder': 'Choose the occupation',
    'kyc.identity.genderLabel': 'Gender *',
    'kyc.identity.genderPlaceholder': 'Choose gender',
    'kyc.identity.nextButton': 'Next',

    // ── Common ────────────────────────────────────────────
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.ok': 'OK',
    'common.error': 'Error',
    'common.loading': 'Loading...',
    'common.retry': 'Retry',
    'common.comingSoon': 'Coming Soon',
    'common.comingSoonMsg': '{label} feature is not yet available.',
  },

  id: {
    // ── Auth ──────────────────────────────────────────────
    'auth.signIn.title': 'Masuk',
    'auth.signIn.greeting': 'Halo!',
    'auth.signIn.subtitle': 'Masuk untuk melanjutkan',
    'auth.signIn.emailLabel': 'Alamat Email',
    'auth.signIn.emailPlaceholder': 'Contoh: example@gmail.com',
    'auth.signIn.passwordLabel': 'Kata Sandi',
    'auth.signIn.passwordPlaceholder': 'Masukkan kata sandi',
    'auth.signIn.forgotPassword': 'Lupa kata sandi?',
    'auth.signIn.button': 'Masuk',
    'auth.signIn.noAccount': 'Belum punya akun?  ',
    'auth.signIn.signUpLink': 'Daftar',

    'auth.signUp.title': 'Daftar',
    'auth.signUp.greeting': 'Halo!',
    'auth.signUp.subtitle': 'Buat Akun Baru',
    'auth.signUp.nameLabel': 'Nama Anda',
    'auth.signUp.namePlaceholder': 'Masukkan nama lengkap',
    'auth.signUp.emailLabel': 'Alamat Email',
    'auth.signUp.emailPlaceholder': 'Masukkan email',
    'auth.signUp.phoneLabel': 'Nomor Telepon',
    'auth.signUp.phonePlaceholder': 'Masukkan nomor telepon',
    'auth.signUp.passwordLabel': 'Kata Sandi Baru',
    'auth.signUp.passwordPlaceholder': 'Masukkan kata sandi',
    'auth.signUp.confirmPasswordLabel': 'Konfirmasi Kata Sandi',
    'auth.signUp.confirmPasswordPlaceholder': 'Konfirmasi kata sandi',
    'auth.signUp.passwordMismatch': 'Kata sandi tidak cocok',
    'auth.signUp.termsPrefix': 'Dengan membuat akun, Anda menyetujui ',
    'auth.signUp.privacyPolicy': 'Kebijakan Privasi',
    'auth.signUp.termsAnd': ' dan ',
    'auth.signUp.termsOfService': 'Syarat Layanan',
    'auth.signUp.button': 'Buat Akun',
    'auth.signUp.hasAccount': 'Sudah punya akun? ',
    'auth.signUp.signInLink': 'Masuk',
    'auth.signUp.strengthVeryWeak': 'Sangat Lemah',
    'auth.signUp.strengthWeak': 'Lemah',
    'auth.signUp.strengthFair': 'Cukup',
    'auth.signUp.strengthGood': 'Baik',
    'auth.signUp.strengthStrong': 'Kuat',
    'auth.signUp.checkMinLength': 'Minimal 8 karakter',
    'auth.signUp.checkLowercase': 'Huruf kecil (a-z)',
    'auth.signUp.checkUppercase': 'Huruf besar (A-Z)',
    'auth.signUp.checkNumber': 'Angka (0-9)',
    'auth.signUp.checkSpecial': 'Karakter khusus (!@#$...)',

    'auth.verifyEmail.title': 'Verifikasi email Anda',
    'auth.verifyEmail.subtitle': 'Kami telah mengirimkan kode OTP 6 digit ke',
    'auth.verifyEmail.validity': 'Kode berlaku selama 10 menit',
    'auth.verifyEmail.sending': 'Mengirim...',
    'auth.verifyEmail.resendIn': 'Kirim ulang OTP dalam {cooldown}d',
    'auth.verifyEmail.resend': 'Kirim Ulang OTP',
    'auth.verifyEmail.didntReceive': 'Tidak menerima kode? ',
    'auth.verifyEmail.button': 'Lanjut',

    'auth.forgotPassword.title': 'Lupa Kata Sandi',
    'auth.forgotPassword.heading': 'Atur Ulang Kata Sandi',
    'auth.forgotPassword.description': 'Masukkan alamat email yang terkait dengan akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.',
    'auth.forgotPassword.emailLabel': 'Alamat Email',
    'auth.forgotPassword.emailPlaceholder': 'Masukkan email',
    'auth.forgotPassword.button': 'Kirim Tautan Reset',
    'auth.forgotPassword.successTitle': 'Periksa Email Anda',
    'auth.forgotPassword.successPrefix': 'Kami telah mengirimkan tautan reset kata sandi ke ',
    'auth.forgotPassword.successInstruction': 'Silakan periksa kotak masuk Anda dan ikuti petunjuknya.',
    'auth.forgotPassword.backButton': 'Kembali ke Masuk',
    'auth.forgotPassword.didntReceive': 'Tidak menerima email? ',
    'auth.forgotPassword.tryAgain': 'Coba lagi',

    'auth.setPin.title': 'Atur PIN',
    'auth.setPin.subtitle': 'Ini adalah kode sandi 6 digit yang selalu digunakan untuk mengamankan setiap transaksi.',

    'auth.confirmPin.title': 'Konfirmasi PIN',
    'auth.confirmPin.subtitle': 'Pastikan Anda memasukkan PIN yang benar',
    'auth.confirmPin.mismatchTitle': 'PIN Tidak Cocok',
    'auth.confirmPin.mismatchMessage': 'PIN tidak cocok. Silakan coba lagi.',

    // ── Home ──────────────────────────────────────────────
    'home.title': 'Arsema Mobile',
    'home.greeting': 'Selamat Siang,',
    'home.kycPending': 'Verifikasi Sedang Berlangsung. Mohon tunggu hingga 2x24 jam untuk tim kami memverifikasi identitas Anda. Kami akan memberitahu Anda setelah akun siap digunakan.',
    'home.kycBanner': 'Verifikasi identitas Anda untuk mendapatkan akses penuh dan fitur Premium.',
    'home.verify': 'Verifikasi',
    'home.promo': 'Promo',
    'home.logout': 'Keluar',
    'home.logoutConfirmTitle': 'Keluar',
    'home.logoutConfirmMessage': 'Apakah Anda yakin ingin keluar?',
    'home.logoutCancel': 'Batal',

    // ── Tabs ──────────────────────────────────────────────
    'tabs.transaction.title': 'Riwayat Transaksi',
    'tabs.transaction.tabSend': 'Kirim',
    'tabs.transaction.tabReceived': 'Terima',
    'tabs.transaction.tabLocal': 'Transfer Lokal',
    'tabs.transaction.tabBill': 'Bayar Tagihan',
    'tabs.transaction.emptyTitle': 'Belum ada riwayat transaksi',
    'tabs.transaction.emptySubtitle': 'Anda belum pernah mengirim uang',

    'tabs.support.title': 'Bantuan',
    'tabs.support.faqTitle': 'Pertanyaan yang Sering Diajukan',
    'tabs.support.faq1Q': 'Bagaimana cara mengirim uang?',
    'tabs.support.faq1A': 'Untuk mengirim uang, ketuk "Kirim Uang" di layar beranda, masukkan detail penerima, tentukan jumlah, dan konfirmasi transaksi.',
    'tabs.support.faq2Q': 'Berapa biaya transfer?',
    'tabs.support.faq2A': 'Biaya transfer bervariasi tergantung jumlah dan tujuan. Transfer domestik di bawah Rp 1.000.000 gratis. Periksa jadwal biaya di Pengaturan untuk detail lebih lanjut.',
    'tabs.support.faq3Q': 'Berapa lama transfer berlangsung?',
    'tabs.support.faq3A': 'Transfer domestik biasanya instan. Transfer internasional membutuhkan 1-3 hari kerja tergantung negara tujuan.',
    'tabs.support.faq4Q': 'Bagaimana cara verifikasi identitas?',
    'tabs.support.faq4A': 'Buka Profil > Informasi Pribadi dan ikuti langkah verifikasi. Anda membutuhkan KTP/paspor yang valid dan foto selfie.',
    'tabs.support.faq5Q': 'Apakah uang saya aman?',
    'tabs.support.faq5A': 'Ya. Kami menggunakan enkripsi tingkat bank dan diatur oleh otoritas keuangan. Dana Anda disimpan di rekening terpisah.',
    'tabs.support.contactTitle': 'Hubungi Kami',
    'tabs.support.contactEmail': 'Email',
    'tabs.support.contactEmailValue': 'helpdesk@arsema.co.id',
    'tabs.support.contactPhone': 'Telepon',
    'tabs.support.contactPhoneValue': '+62 21 71794849',
    'tabs.support.contactChat': 'Live Chat',
    'tabs.support.contactChatDesc': 'Tersedia 24/7',

    // ── Notifications ─────────────────────────────────────
    'notifications.title': 'Notifikasi',
    'notifications.emptyTitle': 'Tidak ada notifikasi',
    'notifications.emptySubtitle': 'Semua sudah terbaca! Notifikasi baru akan muncul di sini.',

    // ── Profile ───────────────────────────────────────────
    'profile.title': 'Profil',
    'profile.menu.personal': 'Informasi Pribadi',
    'profile.menu.security': 'Pengaturan Keamanan',
    'profile.menu.notifications': 'Pengaturan Notifikasi',
    'profile.menu.language': 'Bahasa',
    'profile.menu.about': 'Tentang',
    'profile.menu.deleteAccount': 'Hapus Akun',
    'profile.menu.logout': 'Keluar',

    'profile.personalInfo.title': 'Informasi Pribadi',
    'profile.personalInfo.accountDetails': 'Detail Akun',
    'profile.personalInfo.fullName': 'Nama Lengkap',
    'profile.personalInfo.email': 'Alamat Email',
    'profile.personalInfo.phone': 'Nomor Telepon',
    'profile.personalInfo.profileDetails': 'Detail Profil',
    'profile.personalInfo.edit': 'Edit',
    'profile.personalInfo.occupation': 'Pekerjaan',
    'profile.personalInfo.address': 'Alamat',
    'profile.personalInfo.city': 'Kota',
    'profile.personalInfo.state': 'Provinsi',
    'profile.personalInfo.postalCode': 'Kode Pos',
    'profile.personalInfo.country': 'Negara',
    'profile.personalInfo.loadError': 'Gagal memuat data profil.',

    'profile.editProfile.title': 'Edit Profil',
    'profile.editProfile.occupationLabel': 'Pekerjaan *',
    'profile.editProfile.occupationPlaceholder': 'Pilih pekerjaan',
    'profile.editProfile.phoneLabel': 'Nomor Telepon *',
    'profile.editProfile.phonePlaceholder': 'contoh: +6281234567890',
    'profile.editProfile.countryLabel': 'Negara *',
    'profile.editProfile.countryPlaceholder': 'Pilih negara',
    'profile.editProfile.stateLabel': 'Provinsi *',
    'profile.editProfile.statePlaceholder': 'Pilih provinsi',
    'profile.editProfile.stateInputPlaceholder': 'Masukkan provinsi',
    'profile.editProfile.cityLabel': 'Kota *',
    'profile.editProfile.cityPlaceholder': 'Masukkan kota',
    'profile.editProfile.postalLabel': 'Kode Pos *',
    'profile.editProfile.postalPlaceholder': 'Masukkan kode pos',
    'profile.editProfile.address1Label': 'Alamat Baris 1 *',
    'profile.editProfile.address1Placeholder': 'Alamat jalan, PO Box, dll.',
    'profile.editProfile.address2Label': 'Alamat Baris 2 (Opsional)',
    'profile.editProfile.address2Placeholder': 'Apartemen, unit, dll.',
    'profile.editProfile.saveButton': 'Simpan Perubahan',
    'profile.editProfile.validationError': 'Harap isi semua kolom yang wajib diisi.',
    'profile.editProfile.successMessage': 'Profil berhasil diperbarui!',
    'profile.editProfile.failError': 'Gagal memperbarui profil.',
    'profile.editProfile.unexpectedError': 'Terjadi kesalahan yang tidak terduga.',

    'profile.notifSettings.title': 'Pengaturan Notifikasi',
    'profile.notifSettings.transactions': 'Pembaruan Transaksi',
    'profile.notifSettings.transactionsDesc': 'Terima notifikasi untuk perubahan status transaksi',
    'profile.notifSettings.promotions': 'Promosi',
    'profile.notifSettings.promotionsDesc': 'Terima penawaran promosi dan diskon',
    'profile.notifSettings.system': 'Peringatan Sistem',
    'profile.notifSettings.systemDesc': 'Notifikasi akun dan keamanan penting',

    'profile.language.title': 'Bahasa',
    'profile.language.english': 'English',
    'profile.language.indonesian': 'Bahasa Indonesia',

    'profile.deleteAccount.title': 'Hapus Akun',
    'profile.deleteAccount.warning': 'Tindakan ini tidak dapat dibatalkan. Akun dan semua data Anda akan dihapus secara permanen.',
    'profile.deleteAccount.reasonLabel': 'Alasan menghapus akun',
    'profile.deleteAccount.reasonPlaceholder': 'Pilih alasan',
    'profile.deleteAccount.reason1': 'Saya tidak lagi menggunakan layanan ini',
    'profile.deleteAccount.reason2': 'Masalah privasi',
    'profile.deleteAccount.reason3': 'Terlalu rumit untuk digunakan',
    'profile.deleteAccount.reason4': 'Beralih ke layanan lain',
    'profile.deleteAccount.reason5': 'Lainnya',
    'profile.deleteAccount.detailLabel': 'Jelaskan alasan Anda',
    'profile.deleteAccount.detailPlaceholder': 'Ceritakan lebih lanjut...',
    'profile.deleteAccount.checkbox': 'Saya memahami bahwa akun dan semua data saya akan dihapus secara permanen',
    'profile.deleteAccount.submitButton': 'Kirim Permintaan',
    'profile.deleteAccount.successTitle': 'Permintaan Terkirim',
    'profile.deleteAccount.successMessage': 'Permintaan penghapusan akun Anda telah dikirim. Kami akan memprosesnya dalam 3-5 hari kerja.',
    'profile.deleteAccount.pendingError': 'Anda memiliki transaksi yang masih berjalan. Mohon tunggu hingga selesai sebelum menghapus akun.',
    'profile.deleteAccount.errorTitle': 'Kesalahan',

    // ── MoneyGram ─────────────────────────────────────────
    'mg.transfer.title': 'Transfer',
    'mg.transfer.destinationLabel': 'Negara tujuan *',
    'mg.transfer.destinationPlaceholder': 'Pilih negara tujuan',
    'mg.transfer.loadError': 'Gagal memuat daftar negara',
    'mg.transfer.retry': 'Ketuk untuk mencoba lagi',
    'mg.transfer.amountLabel': 'Jumlah *',
    'mg.transfer.currencyReceive': 'Dalam mata uang lokal',
    'mg.transfer.currencySend': 'Dalam mata uang IDR',
    'mg.transfer.quoteByLabel': 'Kutipan berdasarkan: *',
    'mg.transfer.sendAmount': 'Jumlah Kirim (IDR)',
    'mg.transfer.receiveAmount': 'Jumlah Terima',
    'mg.transfer.promoLabel': 'Kode Promo',
    'mg.transfer.promoPlaceholder': 'Masukkan kode promo',
    'mg.transfer.promoHint': 'Kode promo akan diterapkan pada transaksi ini dalam bentuk cashback ke rekening bank Anda.',
    'mg.transfer.nextButton': 'Lanjut',
    'mg.transfer.minAmountError': 'Jumlah minimum adalah {minLabel}',
    'mg.transfer.signInError': 'Silakan masuk untuk melanjutkan',
    'mg.transfer.tokenError': 'Gagal mendapatkan proxy token',
    'mg.transfer.countriesError': 'Layanan negara sementara tidak tersedia. Silakan coba lagi.',

    'mg.serviceOptions.title': 'Opsi Layanan',
    'mg.serviceOptions.destinationLabel': 'Negara tujuan *',
    'mg.serviceOptions.amountLabel': 'Jumlah *',
    'mg.serviceOptions.chooseService': 'Pilih Layanan',
    'mg.serviceOptions.noQuote': 'Tidak ada data kutipan.',
    'mg.serviceOptions.estimatedReceive': 'Perkiraan Jumlah Diterima',
    'mg.serviceOptions.estimatedPrefix': 'Perkiraan ',
    'mg.serviceOptions.receivedAmount': 'Jumlah Diterima',
    'mg.serviceOptions.fee': 'Biaya',
    'mg.serviceOptions.discount': 'Diskon',
    'mg.serviceOptions.estimatedFee': 'Perkiraan Biaya Terima',
    'mg.serviceOptions.estimatedTax': 'Perkiraan Pajak Terima',
    'mg.serviceOptions.receiveTax': 'Pajak Terima',
    'mg.serviceOptions.totalCollect': 'Total yang Harus Dibayar',
    'mg.serviceOptions.estimatedTotal': 'Perkiraan Total Terima',
    'mg.serviceOptions.sentAmount': 'Jumlah Dikirim',
    'mg.serviceOptions.estimatedBanner': 'Jumlah yang diterima bersifat perkiraan dan dapat berubah',
    'mg.serviceOptions.disclaimer': 'Tidak semua mata uang tersedia di semua lokasi. Nilai tukar di atas hanyalah perkiraan. Nilai tukar aktual akan berlaku pada saat transfer diterima.',
    'mg.serviceOptions.kycRequired': 'Verifikasi identitas diperlukan untuk menyelesaikan transaksi ini.',
    'mg.serviceOptions.kycPending': 'Verifikasi Sedang Berlangsung. Mohon tunggu hingga 24 jam untuk tim kami memverifikasi identitas Anda.',
    'mg.serviceOptions.verifyNow': 'Verifikasi Sekarang',
    'mg.serviceOptions.continueButton': 'Lanjut',

    'mg.beneficiary.title': 'Detail Penerima',
    'mg.beneficiary.searchLabel': 'Cari untuk isi otomatis',
    'mg.beneficiary.searchPlaceholder': 'Berdasarkan nama atau ID penerima',
    'mg.beneficiary.firstNameLabel': 'Nama Depan *',
    'mg.beneficiary.firstNamePlaceholder': 'contoh: Budi',
    'mg.beneficiary.middleNameLabel': 'Nama Tengah',
    'mg.beneficiary.middleNamePlaceholder': 'contoh: Santoso',
    'mg.beneficiary.lastNameLabel': 'Nama Belakang *',
    'mg.beneficiary.lastNamePlaceholder': 'Santoso',
    'mg.beneficiary.phoneLabel': 'Nomor Telepon *',
    'mg.beneficiary.phonePlaceholder': 'contoh: 62839192010',
    'mg.beneficiary.loadingFields': 'Memuat kolom tambahan...',
    'mg.beneficiary.saveDir': 'Simpan ke direktori penerima',
    'mg.beneficiary.nextButton': 'Lanjut',
    'mg.beneficiary.noResults': 'Penerima tidak ditemukan',
    'mg.beneficiary.searchError': 'Gagal mencari penerima',

    'mg.sendingDetails.title': 'Detail Pengiriman',
    'mg.sendingDetails.purposeLabel': 'Tujuan Transaksi',
    'mg.sendingDetails.purposePlaceholder': 'Pilih tujuan',
    'mg.sendingDetails.sourceLabel': 'Sumber Dana',
    'mg.sendingDetails.sourcePlaceholder': 'Pilih sumber dana',
    'mg.sendingDetails.relationshipLabel': 'Hubungan dengan Penerima',
    'mg.sendingDetails.relationshipPlaceholder': 'Pilih yang paling sesuai',
    'mg.sendingDetails.acknowledgeLabel': 'Saya mengakui bahwa setiap informasi yang diberikan di sini adalah benar',
    'mg.sendingDetails.termsLabel': 'Saya telah membaca dan menyetujui Syarat dan Ketentuan.',
    'mg.sendingDetails.nextButton': 'Lanjut',

    'mg.reviewSend.title': 'Tinjau Pengiriman via MoneyGram',
    'mg.reviewSend.dateLabel': 'Tanggal',
    'mg.reviewSend.typeLabel': 'Jenis Transaksi',
    'mg.reviewSend.typeValue': 'Kirim via MoneyGram',
    'mg.reviewSend.beneficiarySection': 'DETAIL PENERIMA',
    'mg.reviewSend.fullName': 'Nama Lengkap',
    'mg.reviewSend.phone': 'Nomor Telepon',
    'mg.reviewSend.country': 'Negara',
    'mg.reviewSend.transactionSection': 'DETAIL TRANSAKSI',
    'mg.reviewSend.destination': 'Negara Tujuan',
    'mg.reviewSend.service': 'Layanan',
    'mg.reviewSend.amount': 'Jumlah',
    'mg.reviewSend.fxRate': 'Kurs',
    'mg.reviewSend.receiveAmount': 'Jumlah Diterima',
    'mg.reviewSend.fee': 'Biaya Pengiriman',
    'mg.reviewSend.total': 'TOTAL',
    'mg.reviewSend.continueButton': 'Lanjut ke Pembayaran',

    'mg.paymentMethod.title': 'Metode Pembayaran',
    'mg.paymentMethod.vaTitle': 'Virtual Account',
    'mg.paymentMethod.vaDesc': 'Transfer dengan Virtual Account Permata',
    'mg.paymentMethod.qrisTitle': 'QRIS',
    'mg.paymentMethod.qrisDesc': 'Transfer dengan Dynamic QRIS dari Permata',
    'mg.paymentMethod.nextButton': 'Lanjut',

    'mg.reviewPin.title': 'Masukkan PIN',
    'mg.reviewPin.subtitle': 'Masukkan PIN Anda untuk konfirmasi',
    'mg.reviewPin.sessionExpired': 'Sesi berakhir. Silakan masuk kembali.',
    'mg.reviewPin.invalidPin': 'PIN tidak valid. Silakan coba lagi.',
    'mg.reviewPin.connectionError': 'Gagal verifikasi PIN. Periksa koneksi Anda.',

    'mg.virtualAccount.title': 'Virtual Account',
    'mg.virtualAccount.paymentInProgress': 'Pembayaran sedang diproses',
    'mg.virtualAccount.vaLabel': 'Nomor Virtual Account',
    'mg.virtualAccount.totalLabel': 'Total yang Harus Dibayar',
    'mg.virtualAccount.infoTitle': 'Informasi:',
    'mg.virtualAccount.infoText': 'Harap tunggu sementara kami masih memproses transaksi pengiriman Anda.',
    'mg.virtualAccount.timerLabel': 'Selesaikan transaksi dalam sisa waktu yang tersedia',
    'mg.virtualAccount.checkButton': 'Cek status pembayaran',
    'mg.virtualAccount.howToPayTitle': 'CARA BAYAR',
    'mg.virtualAccount.howToPaySubtitle': 'Selesaikan transaksi menggunakan Nomor Virtual Account di atas',
    'mg.virtualAccount.step1': '1. Salin Nomor Virtual Account di atas',
    'mg.virtualAccount.step2': '2. Buka aplikasi m-banking atau digital banking',
    'mg.virtualAccount.step3': '3. Setelah login, pilih menu transfer',
    'mg.virtualAccount.step4': '4. Transfer',
    'mg.virtualAccount.step5': '5. Masukkan Nomor Virtual Account yang disalin',
    'mg.virtualAccount.step6': '6. Periksa jumlah yang akan ditransfer',
    'mg.virtualAccount.step7': '7. Bayar',
    'mg.virtualAccount.copiedTitle': 'Disalin',
    'mg.virtualAccount.copiedMessage': 'Nomor Virtual Account berhasil disalin',
    'mg.virtualAccount.timeoutError': 'Permintaan habis waktu. Silakan coba lagi.',
    'mg.virtualAccount.paymentPendingError': 'Kami belum menerima pembayaran Anda. Selesaikan transfer dan coba lagi dalam beberapa saat.',
    'mg.virtualAccount.errorTitle': 'Kesalahan',

    'mg.txSuccess.title': 'Transaksi Berhasil!',
    'mg.txSuccess.refLabel': 'Nomor Referensi MG',
    'mg.txSuccess.beneficiaryLabel': 'Penerima',
    'mg.txSuccess.serviceLabel': 'Layanan',
    'mg.txSuccess.deliveryLabel': 'Perkiraan tanggal pengiriman',
    'mg.txSuccess.statusLabel': 'Status',
    'mg.txSuccess.receiveLabel': 'Jumlah Diterima',
    'mg.txSuccess.notesLabel': 'Catatan',
    'mg.txSuccess.infoTitle': 'Informasi:',
    'mg.txSuccess.infoText': 'Bukti transaksi ini telah dikirim ke email Anda.',
    'mg.txSuccess.doneButton': 'Selesai',
    'mg.txSuccess.shareButton': 'Bagikan bukti',

    'mg.txDetail.title': 'Detail Transaksi',
    'mg.txDetail.statusLabel': 'Status',
    'mg.txDetail.refLabel': 'Nomor Referensi',
    'mg.txDetail.sendAmountLabel': 'Jumlah Dikirim',
    'mg.txDetail.feeLabel': 'Biaya',
    'mg.txDetail.totalLabel': 'Total Dibayar',
    'mg.txDetail.receiveLabel': 'Jumlah Diterima',
    'mg.txDetail.checkButton': 'Cek Status Pembayaran',
    'mg.txDetail.shareButton': 'Bagikan Bukti',
    'mg.txDetail.goBack': 'Kembali',
    'mg.txDetail.customerService': 'Silakan hubungi Layanan Pelanggan Arsema',

    // ── KYC ───────────────────────────────────────────────
    'kyc.title': 'Verifikasi Identitas',
    'kyc.personalDetails.subtitle': 'Detail Pribadi',
    'kyc.personalDetails.firstNameLabel': 'Nama Depan *',
    'kyc.personalDetails.firstNamePlaceholder': 'Nama Depan',
    'kyc.personalDetails.middleNameLabel': 'Nama Tengah',
    'kyc.personalDetails.lastNameLabel': 'Nama Belakang 1 *',
    'kyc.personalDetails.address1Label': 'Alamat 1 *',
    'kyc.personalDetails.address1Placeholder': 'contoh: Jl. Sudirman No. 1',
    'kyc.personalDetails.address2Label': 'Alamat 2',
    'kyc.personalDetails.address2Placeholder': 'Opsional',
    'kyc.personalDetails.buildingLabel': 'Nomor Gedung',
    'kyc.personalDetails.countryLabel': 'Negara *',
    'kyc.personalDetails.stateLabel': 'Provinsi *',
    'kyc.personalDetails.statePlaceholder': 'Pilih Provinsi',
    'kyc.personalDetails.stateInputPlaceholder': 'contoh: Jakarta Barat',
    'kyc.personalDetails.cityLabel': 'Kota *',
    'kyc.personalDetails.cityPlaceholder': 'contoh: Semarang',
    'kyc.personalDetails.postalLabel': 'Kode Pos',
    'kyc.personalDetails.postalPlaceholder': 'contoh: 51133',
    'kyc.personalDetails.selectStateTitle': 'Pilih Provinsi',
    'kyc.personalDetails.stateSearch': 'Cari provinsi...',
    'kyc.personalDetails.selectCountryTitle': 'Pilih Negara',
    'kyc.personalDetails.countrySearch': 'Cari negara...',
    'kyc.personalDetails.nextButton': 'Lanjut',

    'kyc.identity.subtitle': 'Informasi Identitas',
    'kyc.identity.typeLabel': 'Jenis Identitas *',
    'kyc.identity.typePlaceholder': 'Pilih salah satu',
    'kyc.identity.numberLabel': 'Nomor Identitas *',
    'kyc.identity.numberPlaceholder': 'Ketik nomor pada identitas',
    'kyc.identity.dobLabel': 'Tanggal Lahir *',
    'kyc.identity.dobPlaceholder': 'HH-BB-TTTT',
    'kyc.identity.dobModalTitle': 'Tanggal Lahir',
    'kyc.identity.dayColumn': 'Hari',
    'kyc.identity.monthColumn': 'Bulan',
    'kyc.identity.yearColumn': 'Tahun',
    'kyc.identity.confirmDate': 'Konfirmasi',
    'kyc.identity.countryOfBirthLabel': 'Negara Kelahiran *',
    'kyc.identity.countryOfBirthPlaceholder': 'Pilih negara',
    'kyc.identity.birthStateLabel': 'Provinsi Kelahiran *',
    'kyc.identity.birthStatePlaceholder': 'Pilih provinsi',
    'kyc.identity.cityOfBirthLabel': 'Kota Kelahiran *',
    'kyc.identity.cityOfBirthPlaceholder': 'Ketik kota kelahiran',
    'kyc.identity.nationalityLabel': 'Kewarganegaraan *',
    'kyc.identity.nationalityPlaceholder': 'Pilih kewarganegaraan',
    'kyc.identity.expiryLabel': 'Tanggal Kadaluarsa *',
    'kyc.identity.occupationLabel': 'Pekerjaan *',
    'kyc.identity.occupationPlaceholder': 'Pilih pekerjaan',
    'kyc.identity.genderLabel': 'Jenis Kelamin *',
    'kyc.identity.genderPlaceholder': 'Pilih jenis kelamin',
    'kyc.identity.nextButton': 'Lanjut',

    // ── Common ────────────────────────────────────────────
    'common.cancel': 'Batal',
    'common.confirm': 'Konfirmasi',
    'common.ok': 'OK',
    'common.error': 'Kesalahan',
    'common.loading': 'Memuat...',
    'common.retry': 'Coba Lagi',
    'common.comingSoon': 'Segera Hadir',
    'common.comingSoonMsg': 'Fitur {label} belum tersedia.',
  },
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add constants/translations.ts
git commit -m "feat: add EN/ID translations for all screens"
```

---

## Task 3: Create LanguageContext

**Files:**
- Create: `contexts/language-context.tsx`

- [ ] **Step 1: Create the context**

```typescript
// contexts/language-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, TranslationKey } from '../constants/translations';

const LANGUAGE_KEY = 'app_language';

type Language = 'en' | 'id';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'id') {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add contexts/language-context.tsx
git commit -m "feat: add LanguageContext with AsyncStorage persistence"
```

---

## Task 4: Wrap _layout.tsx with LanguageProvider

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add LanguageProvider to the layout**

Replace the entire content of `app/_layout.tsx` with:

```typescript
import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/auth-context';
import { LanguageProvider } from '../contexts/language-context';
import { usePushNotifications } from '../hooks/use-push-notifications';

function AppContent() {
  const { token } = useAuth();
  usePushNotifications({ token });

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: wrap app with LanguageProvider"
```

---

## Task 5: Create Notification Settings Screen

**Files:**
- Create: `app/(profile)/notification-settings.tsx`

- [ ] **Step 1: Create the screen**

```typescript
// app/(profile)/notification-settings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useLanguage } from '../../contexts/language-context';

const NOTIF_KEYS = {
  transactions: 'notif_transactions',
  promotions: 'notif_promotions',
  system: 'notif_system',
} as const;

export default function NotificationSettingsScreen() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [system, setSystem] = useState(true);

  useEffect(() => {
    const loadPrefs = async () => {
      const [tx, promo, sys] = await Promise.all([
        AsyncStorage.getItem(NOTIF_KEYS.transactions),
        AsyncStorage.getItem(NOTIF_KEYS.promotions),
        AsyncStorage.getItem(NOTIF_KEYS.system),
      ]);
      if (tx !== null) setTransactions(tx !== 'false');
      if (promo !== null) setPromotions(promo !== 'false');
      if (sys !== null) setSystem(sys !== 'false');
    };
    loadPrefs();
  }, []);

  const handleToggle = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    await AsyncStorage.setItem(key, value ? 'true' : 'false');
  };

  const rows = [
    {
      label: t('profile.notifSettings.transactions'),
      desc: t('profile.notifSettings.transactionsDesc'),
      value: transactions,
      key: NOTIF_KEYS.transactions,
      setter: setTransactions,
    },
    {
      label: t('profile.notifSettings.promotions'),
      desc: t('profile.notifSettings.promotionsDesc'),
      value: promotions,
      key: NOTIF_KEYS.promotions,
      setter: setPromotions,
    },
    {
      label: t('profile.notifSettings.system'),
      desc: t('profile.notifSettings.systemDesc'),
      value: system,
      key: NOTIF_KEYS.system,
      setter: setSystem,
    },
  ];

  return (
    <ScreenLayout title={t('profile.notifSettings.title')}>
      <ScrollView contentContainerStyle={styles.container}>
        {rows.map((row, i) => (
          <View key={row.key} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowDesc}>{row.desc}</Text>
            </View>
            <Switch
              value={row.value}
              onValueChange={(v) => handleToggle(row.key, v, row.setter)}
              trackColor={{ false: Colors.grayBorder, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        ))}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  rowDesc: {
    fontSize: FontSize.sm,
    color: Colors.grayText,
    lineHeight: 18,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(profile)/notification-settings.tsx
git commit -m "feat: add notification settings screen with 3 AsyncStorage toggles"
```

---

## Task 6: Filter Foreground Notifications by Preference

**Files:**
- Modify: `hooks/use-push-notifications.ts`

- [ ] **Step 1: Update the notification received listener to check AsyncStorage**

In `hooks/use-push-notifications.ts`, replace the `notificationListener` setup inside `useEffect` (the one with deps `[]`):

Find this block (around line 48-51):
```typescript
notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
  console.log('Notification received:', notif);
  setNotification(notif);
});
```

Replace with:
```typescript
notificationListener.current = Notifications.addNotificationReceivedListener(async (notif) => {
  console.log('Notification received:', notif);
  const notifType = notif.request.content.data?.type as string | undefined;
  const keyMap: Record<string, string> = {
    transaction: 'notif_transactions',
    promotion: 'notif_promotions',
    system: 'notif_system',
  };
  const storageKey = notifType ? keyMap[notifType] : null;
  if (storageKey) {
    const enabled = await AsyncStorage.getItem(storageKey);
    if (enabled === 'false') return;
  }
  setNotification(notif);
});
```

Also add the import at the top of the file (after existing imports):
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-push-notifications.ts
git commit -m "feat: filter foreground notifications based on AsyncStorage preferences"
```

---

## Task 7: Create Language Screen

**Files:**
- Create: `app/(profile)/language.tsx`

- [ ] **Step 1: Create the screen**

```typescript
// app/(profile)/language.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useLanguage } from '../../contexts/language-context';

export default function LanguageScreen() {
  const { language, setLanguage, t } = useLanguage();

  const options = [
    { code: 'en' as const, label: t('profile.language.english'), flag: '🇬🇧' },
    { code: 'id' as const, label: t('profile.language.indonesian'), flag: '🇮🇩' },
  ];

  return (
    <ScreenLayout title={t('profile.language.title')}>
      <ScrollView contentContainerStyle={styles.container}>
        {options.map((option, i) => (
          <TouchableOpacity
            key={option.code}
            style={[styles.row, i < options.length - 1 && styles.rowBorder]}
            activeOpacity={0.7}
            onPress={() => setLanguage(option.code)}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.flag}>{option.flag}</Text>
              <Text style={styles.label}>{option.label}</Text>
            </View>
            {language === option.code && (
              <Ionicons name="checkmark" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flag: {
    fontSize: 24,
  },
  label: {
    fontSize: FontSize.md,
    color: Colors.black,
    fontWeight: '500',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(profile)/language.tsx
git commit -m "feat: add language selector screen (EN/ID)"
```

---

## Task 8: Apply Translations — Auth Screens

**Files:**
- Modify: `app/(auth)/sign-in.tsx`
- Modify: `app/(auth)/sign-up.tsx`
- Modify: `app/(auth)/verify-email.tsx`
- Modify: `app/(auth)/forgot-password.tsx`
- Modify: `app/(auth)/set-pin.tsx`
- Modify: `app/(auth)/confirm-pin.tsx`

For each screen below, add the import and `const { t } = useLanguage();` then replace strings.

- [ ] **Step 1: Update sign-in.tsx**

Add import after existing imports:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component (first line of function body):
```typescript
const { t } = useLanguage();
```

Replace hardcoded strings:
- `'Sign in'` (ScreenLayout title) → `t('auth.signIn.title')`
- `'Hello, there!'` → `t('auth.signIn.greeting')`
- `'Sign in to continue'` → `t('auth.signIn.subtitle')`
- `'Email Address'` → `t('auth.signIn.emailLabel')`
- `'Ex.: example@gmail.com'` → `t('auth.signIn.emailPlaceholder')`
- `'Password'` → `t('auth.signIn.passwordLabel')`
- `'Type in your password'` → `t('auth.signIn.passwordPlaceholder')`
- `'Forgot your password ?'` → `t('auth.signIn.forgotPassword')`
- `'Sign in'` (button) → `t('auth.signIn.button')`
- `"Don't have an account?  "` → `t('auth.signIn.noAccount')`
- `'Sign Up'` (link) → `t('auth.signIn.signUpLink')`

- [ ] **Step 2: Update sign-up.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings using keys: `auth.signUp.*` (all keys defined in translations.ts under `auth.signUp`)

- [ ] **Step 3: Update verify-email.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings using keys: `auth.verifyEmail.*`

For the dynamic resend countdown, replace:
```typescript
`Resend OTP in ${cooldown}s`
```
with:
```typescript
t('auth.verifyEmail.resendIn').replace('{cooldown}', String(cooldown))
```

- [ ] **Step 4: Update forgot-password.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings using keys: `auth.forgotPassword.*`

- [ ] **Step 5: Update set-pin.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings: `auth.setPin.title`, `auth.setPin.subtitle`

- [ ] **Step 6: Update confirm-pin.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings: `auth.confirmPin.*`

- [ ] **Step 7: Commit**

```bash
git add app/(auth)/sign-in.tsx app/(auth)/sign-up.tsx app/(auth)/verify-email.tsx \
        app/(auth)/forgot-password.tsx app/(auth)/set-pin.tsx app/(auth)/confirm-pin.tsx
git commit -m "feat: apply translations to auth screens"
```

---

## Task 9: Apply Translations — Home & Tabs

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/transaction.tsx`
- Modify: `app/(tabs)/support.tsx`
- Modify: `app/notifications.tsx`

- [ ] **Step 1: Update app/(tabs)/index.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside `HomeScreen` component:
```typescript
const { t } = useLanguage();
```

Replace strings using keys: `home.*`

For the Alert logout dialog:
```typescript
Alert.alert(
  t('home.logoutConfirmTitle'),
  t('home.logoutConfirmMessage'),
  [
    { text: t('home.logoutCancel'), style: 'cancel' },
    { text: t('home.logout'), style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/sign-in' as any); } },
  ],
);
```

- [ ] **Step 2: Update app/(tabs)/transaction.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings using keys: `tabs.transaction.*`

- [ ] **Step 3: Update app/(tabs)/support.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings using keys: `tabs.support.*`

- [ ] **Step 4: Update app/notifications.tsx**

Add import:
```typescript
import { useLanguage } from '../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings: `notifications.title`, `notifications.emptyTitle`, `notifications.emptySubtitle`

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/index.tsx app/(tabs)/transaction.tsx app/(tabs)/support.tsx app/notifications.tsx
git commit -m "feat: apply translations to home and tab screens"
```

---

## Task 10: Apply Translations — Profile Screens + Wire Navigation

**Files:**
- Modify: `app/(tabs)/profile.tsx`
- Modify: `app/(profile)/personal-information.tsx`
- Modify: `app/(profile)/edit-profile.tsx`

- [ ] **Step 1: Update app/(tabs)/profile.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace the `MENU_ITEMS` static array with a dynamic one inside the component (so labels react to language changes):

```typescript
const menuItems: MenuItem[] = [
  { id: 'personal', icon: 'person-outline', label: t('profile.menu.personal') },
  { id: 'security', icon: 'shield-outline', label: t('profile.menu.security') },
  { id: 'notifications', icon: 'notifications-outline', label: t('profile.menu.notifications') },
  { id: 'language', icon: 'language-outline', label: t('profile.menu.language') },
  { id: 'about', icon: 'information-circle-outline', label: t('profile.menu.about') },
  { id: 'delete-account', icon: 'trash-outline', label: t('profile.menu.deleteAccount'), isDestructive: true },
  { id: 'logout', icon: 'log-out-outline', label: t('profile.menu.logout'), isLogout: true },
];
```

Update the `MenuItem` interface to add `isDestructive?`:
```typescript
interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isLogout?: boolean;
  isDestructive?: boolean;
}
```

Replace the `onPress` handler:
```typescript
onPress={() => {
  if (item.id === 'personal') {
    router.push('/(profile)/personal-information');
  } else if (item.id === 'notifications') {
    router.push('/(profile)/notification-settings' as any);
  } else if (item.id === 'language') {
    router.push('/(profile)/language' as any);
  } else if (item.id === 'delete-account') {
    router.push('/(profile)/delete-account' as any);
  } else if (item.isLogout) {
    // logout is handled elsewhere (home screen)
  } else {
    Alert.alert(t('common.comingSoon'), t('common.comingSoonMsg').replace('{label}', item.label));
  }
}}
```

Update the icon color style to also apply red for `isDestructive`:
```typescript
color={item.isLogout || item.isDestructive ? Colors.primary : Colors.black}
```

Update the label style:
```typescript
style={[
  styles.menuItemLabel,
  (item.isLogout || item.isDestructive) && styles.menuItemLabelLogout,
]}
```

Replace `'Profile'` header text with `{t('profile.title')}`.

- [ ] **Step 2: Update app/(profile)/personal-information.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings using keys: `profile.personalInfo.*`

- [ ] **Step 3: Update app/(profile)/edit-profile.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings using keys: `profile.editProfile.*`

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/profile.tsx app/(profile)/personal-information.tsx app/(profile)/edit-profile.tsx
git commit -m "feat: apply translations to profile screens, wire notification/language/delete-account navigation"
```

---

## Task 11: Apply Translations — MoneyGram Screens

**Files:**
- Modify: `app/(moneygram)/transfer.tsx`
- Modify: `app/(moneygram)/service-options.tsx`
- Modify: `app/(moneygram)/beneficiary-details.tsx`
- Modify: `app/(moneygram)/sending-details.tsx`
- Modify: `app/(moneygram)/review-send.tsx`
- Modify: `app/(moneygram)/payment-method.tsx`
- Modify: `app/(moneygram)/review-pin.tsx`
- Modify: `app/(moneygram)/virtual-account.tsx`
- Modify: `app/(moneygram)/transaction-success.tsx`
- Modify: `app/(moneygram)/transaction-detail.tsx`

For each file, add:
```typescript
import { useLanguage } from '../../contexts/language-context';
```
Add inside component:
```typescript
const { t } = useLanguage();
```

Then replace strings per the key groups: `mg.transfer.*`, `mg.serviceOptions.*`, `mg.beneficiary.*`, `mg.sendingDetails.*`, `mg.reviewSend.*`, `mg.paymentMethod.*`, `mg.reviewPin.*`, `mg.virtualAccount.*`, `mg.txSuccess.*`, `mg.txDetail.*`

Dynamic strings with `{minLabel}` in transfer.tsx:
```typescript
t('mg.transfer.minAmountError').replace('{minLabel}', minLabel)
```

- [ ] **Step 1: Update transfer.tsx, service-options.tsx, beneficiary-details.tsx, sending-details.tsx**

Apply `useLanguage` import + `const { t } = useLanguage()` + string replacements per key map above.

- [ ] **Step 2: Update review-send.tsx, payment-method.tsx, review-pin.tsx**

Apply `useLanguage` import + `const { t } = useLanguage()` + string replacements per key map above.

- [ ] **Step 3: Update virtual-account.tsx, transaction-success.tsx, transaction-detail.tsx**

Apply `useLanguage` import + `const { t } = useLanguage()` + string replacements per key map above.

- [ ] **Step 4: Commit**

```bash
git add app/(moneygram)/transfer.tsx app/(moneygram)/service-options.tsx \
        app/(moneygram)/beneficiary-details.tsx app/(moneygram)/sending-details.tsx \
        app/(moneygram)/review-send.tsx app/(moneygram)/payment-method.tsx \
        app/(moneygram)/review-pin.tsx app/(moneygram)/virtual-account.tsx \
        app/(moneygram)/transaction-success.tsx app/(moneygram)/transaction-detail.tsx
git commit -m "feat: apply translations to MoneyGram screens"
```

---

## Task 12: Apply Translations — KYC Screens

**Files:**
- Modify: `app/(kyc)/personal-details.tsx`
- Modify: `app/(kyc)/identity-information.tsx`

- [ ] **Step 1: Update personal-details.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings using keys: `kyc.title`, `kyc.personalDetails.*`

- [ ] **Step 2: Update identity-information.tsx**

Add import:
```typescript
import { useLanguage } from '../../contexts/language-context';
```

Add inside component:
```typescript
const { t } = useLanguage();
```

Replace strings using keys: `kyc.title`, `kyc.identity.*`

- [ ] **Step 3: Commit**

```bash
git add app/(kyc)/personal-details.tsx app/(kyc)/identity-information.tsx
git commit -m "feat: apply translations to KYC screens"
```

---

## Task 13: Create Delete Account Screen

**Files:**
- Create: `app/(profile)/delete-account.tsx`

- [ ] **Step 1: Create the screen**

```typescript
// app/(profile)/delete-account.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenLayout } from '../../components/screen-layout';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { API_BASE_URL } from '../../constants/api';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { token, signOut } = useAuth();
  const { t } = useLanguage();

  const [selectedReason, setSelectedReason] = useState('');
  const [detail, setDetail] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const reasons = [
    t('profile.deleteAccount.reason1'),
    t('profile.deleteAccount.reason2'),
    t('profile.deleteAccount.reason3'),
    t('profile.deleteAccount.reason4'),
    t('profile.deleteAccount.reason5'),
  ];

  const canSubmit = selectedReason.length > 0 && isConfirmed && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    setIsLoading(true);
    try {
      const body: Record<string, string> = { reason: selectedReason };
      if (selectedReason === t('profile.deleteAccount.reason5') && detail.trim()) {
        body.detail = detail.trim();
      }

      const response = await fetch(`${API_BASE_URL}/v1/account/delete-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          t('profile.deleteAccount.successTitle'),
          t('profile.deleteAccount.successMessage'),
          [{ text: t('common.ok'), onPress: () => { signOut(); router.replace('/(auth)/sign-in' as any); } }],
        );
      } else {
        const msg: string = data?.message || '';
        if (msg.toLowerCase().includes('pending')) {
          Alert.alert(t('profile.deleteAccount.errorTitle'), t('profile.deleteAccount.pendingError'));
        } else {
          Alert.alert(t('profile.deleteAccount.errorTitle'), msg || t('profile.editProfile.unexpectedError'));
        }
      }
    } catch {
      Alert.alert(t('profile.deleteAccount.errorTitle'), t('profile.editProfile.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenLayout title={t('profile.deleteAccount.title')}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={20} color={Colors.primary} />
          <Text style={styles.warningText}>{t('profile.deleteAccount.warning')}</Text>
        </View>

        {/* Reason Dropdown */}
        <Text style={styles.label}>{t('profile.deleteAccount.reasonLabel')}</Text>
        <TouchableOpacity
          style={[styles.dropdown, showReasons && styles.dropdownActive]}
          onPress={() => setShowReasons(!showReasons)}
        >
          <Text style={[styles.dropdownText, !selectedReason && styles.placeholder]}>
            {selectedReason || t('profile.deleteAccount.reasonPlaceholder')}
          </Text>
          <Ionicons name={showReasons ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.grayText} />
        </TouchableOpacity>

        {showReasons && (
          <View style={styles.optionsList}>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.optionItem, selectedReason === reason && styles.optionSelected]}
                onPress={() => { setSelectedReason(reason); setShowReasons(false); }}
              >
                <Text style={[styles.optionText, selectedReason === reason && styles.optionTextSelected]}>
                  {reason}
                </Text>
                {selectedReason === reason && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Detail input — only shown for "Other" */}
        {selectedReason === t('profile.deleteAccount.reason5') && (
          <View style={styles.detailContainer}>
            <Text style={styles.label}>{t('profile.deleteAccount.detailLabel')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('profile.deleteAccount.detailPlaceholder')}
              placeholderTextColor={Colors.grayText}
              multiline
              numberOfLines={4}
              value={detail}
              onChangeText={setDetail}
            />
          </View>
        )}

        {/* Confirmation Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsConfirmed(!isConfirmed)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isConfirmed && styles.checkboxChecked]}>
            {isConfirmed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <Text style={styles.checkboxLabel}>{t('profile.deleteAccount.checkbox')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>{t('profile.deleteAccount.submitButton')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  warningBanner: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primary,
    lineHeight: 20,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 4,
  },
  dropdownActive: {
    borderColor: Colors.primary,
  },
  dropdownText: {
    fontSize: FontSize.md,
    color: Colors.black,
  },
  placeholder: {
    color: Colors.grayText,
  },
  optionsList: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  optionSelected: {
    backgroundColor: '#FFF0F0',
  },
  optionText: {
    fontSize: FontSize.md,
    color: Colors.black,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  detailContainer: {
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.black,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.black,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(profile)/delete-account.tsx
git commit -m "feat: add delete account screen with reason dropdown and backend submission"
```

---

## Task 14: Type-Check

**Files:**
- No file changes — verification step only

- [ ] **Step 1: Run TypeScript type-check**

```bash
cd /Users/afry/Project/arsema-mg-react-native
npx tsc --noEmit
```

Expected: no errors. If there are errors about `TranslationKey`, ensure all usages of `t()` pass a valid key from `translations.ts`. If screens call `t()` with a string literal not in the translations object, add it to both `en` and `id` sections of `translations.ts`.

- [ ] **Step 2: Format code**

```bash
npx prettier --write .
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: format and type-check settings features implementation"
```

---

## Summary

| Task | What it builds |
|---|---|
| 1 | Install AsyncStorage |
| 2 | `constants/translations.ts` — all EN + ID strings |
| 3 | `contexts/language-context.tsx` — language state + `t()` |
| 4 | `app/_layout.tsx` — wrap with LanguageProvider |
| 5 | `app/(profile)/notification-settings.tsx` — 3 toggles |
| 6 | `hooks/use-push-notifications.ts` — filter by preference |
| 7 | `app/(profile)/language.tsx` — EN/ID selector |
| 8 | Auth screens translations |
| 9 | Home + tab screens translations |
| 10 | Profile screens translations + navigation wiring |
| 11 | MoneyGram screens translations |
| 12 | KYC screens translations |
| 13 | `app/(profile)/delete-account.tsx` — full flow |
| 14 | Type-check + format |
