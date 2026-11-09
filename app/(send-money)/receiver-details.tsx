import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';

interface Bank {
  id: string;
  name: string;
}

interface MockRecipient {
  accountNumber: string;
  name: string;
}

const BANKS: Bank[] = [
  { id: 'bca', name: 'BCA' },
  { id: 'mandiri', name: 'Mandiri' },
  { id: 'bni', name: 'BNI' },
  { id: 'bri', name: 'BRI' },
  { id: 'permata', name: 'Permata' },
];

const MOCK_RECIPIENTS: MockRecipient[] = [
  { accountNumber: '1234567890', name: 'John Doe' },
  { accountNumber: '0987654321', name: 'Jane Smith' },
  { accountNumber: '1122334455', name: 'Ahmad Rizky' },
  { accountNumber: '5566778899', name: 'Siti Nurhaliza' },
  { accountNumber: '1010101010', name: 'Budi Santoso' },
];

export const ReceiverDetails = () => {
  const router = useRouter();
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);

  const handleAccountNumberChange = (value: string) => {
    setAccountNumber(value);
    const found = MOCK_RECIPIENTS.find((r) => r.accountNumber === value);
    setRecipientName(found ? found.name : '');
  };

  const handleContinue = () => {
    if (!selectedBank || !accountNumber || !recipientName) return;

    router.push({
      pathname: '/(send-money)/amount',
      params: {
        bankName: selectedBank.name,
        accountNumber,
        recipientName,
      },
    });
  };

  const isFormValid = selectedBank && accountNumber.length > 0 && recipientName.length > 0;

  return (
    <ScreenLayout title="Send Money">
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Select Bank</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowBankPicker(true)}
        >
          <Text
            style={[
              styles.pickerButtonText,
              !selectedBank && styles.placeholderText,
            ]}
          >
            {selectedBank ? selectedBank.name : 'Choose a bank'}
          </Text>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Account Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter account number"
          placeholderTextColor={Colors.grayText}
          value={accountNumber}
          onChangeText={handleAccountNumberChange}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Recipient Name</Text>
        <View style={styles.recipientContainer}>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={recipientName}
            editable={false}
            placeholder="Auto-filled after entering account number"
            placeholderTextColor={Colors.grayText}
          />
          {recipientName.length > 0 && (
            <Text style={styles.verifiedText}>✓ Verified</Text>
          )}
        </View>

        <Modal
          visible={showBankPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowBankPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowBankPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <FlatList
                data={BANKS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.bankItem,
                      selectedBank?.id === item.id && styles.bankItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedBank(item);
                      setShowBankPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.bankItemText,
                        selectedBank?.id === item.id && styles.bankItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueButton, !isFormValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isFormValid}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
    marginTop: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
  },
  pickerButtonText: {
    fontSize: 16,
    color: Colors.black,
  },
  placeholderText: {
    color: Colors.grayText,
  },
  chevron: {
    fontSize: 12,
    color: Colors.grayText,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  disabledInput: {
    backgroundColor: Colors.gray,
  },
  recipientContainer: {
    position: 'relative',
  },
  verifiedText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  bankItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  bankItemSelected: {
    backgroundColor: Colors.gray,
  },
  bankItemText: {
    fontSize: 16,
    color: Colors.black,
  },
  bankItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ReceiverDetails;
