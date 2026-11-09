import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL, BASIC_AUTH } from '../constants/api';
import { useAuth } from './auth-context';

interface KYCDocument {
  uri: string;
  base64?: string;
  type?: string;
}

interface KYCData {
  // Personal Details (from personal-details.tsx)
  firstName: string;
  middleName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  // Identity Information (from identity-information.tsx)
  identityType: string;
  identityNumber: string;
  dobDay: number;
  dobMonth: number;
  dobYear: number;
  cityOfBirth: string;
  countryOfBirth: string;
  birthState: string;
  nationality: string;
  nationalityState: string;
  expDay: number;
  expMonth: number;
  expYear: number;
  occupation: string;
  occupationDescription: string;
  gender: string;

  // Documents
  idCardImage: KYCDocument | null;
  faceImage: KYCDocument | null;

  // Bank Account
  bankName: string;
  bankCode: string;
  bankHolderName: string;
  bankAccountNumber: string;

  // Liveness
  livenessPassed: boolean;

  // Individual Liveness Checks
  livenessFaceRight: boolean;
  livenessFaceLeft: boolean;
  livenessBlink: boolean;

  // Terms
  agreeTerms: boolean;
  agreeDataSharing: boolean;
  agreeDebit: boolean;
}

interface KYCContextValue {
  kycData: KYCData;
  updateKYCData: (data: Partial<KYCData>) => void;
  setIdCardImage: (image: KYCDocument | null) => void;
  setFaceImage: (image: KYCDocument | null) => void;
  setLivenessPassed: (passed: boolean) => void;
  setLivenessFaceRight: (passed: boolean) => void;
  setLivenessFaceLeft: (passed: boolean) => void;
  setLivenessBlink: (passed: boolean) => void;
  submitKYC: () => Promise<boolean>;
  submitBankAccount: (bankData?: { bankName: string; bankCode: string; bankHolderName: string; bankAccountNumber: string }) => Promise<boolean>;
  isLoading: boolean;
}

const initialKYCData: KYCData = {
  firstName: '',
  middleName: '',
  lastName: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  identityType: '',
  identityNumber: '',
  dobDay: 0,
  dobMonth: 0,
  dobYear: 0,
  cityOfBirth: '',
  countryOfBirth: '',
  birthState: '',
  nationality: '',
  nationalityState: '',
  expDay: 0,
  expMonth: 0,
  expYear: 0,
  occupation: '',
  occupationDescription: '',
  gender: '',
  idCardImage: null,
  faceImage: null,
  bankName: '',
  bankCode: '',
  bankHolderName: '',
  bankAccountNumber: '',
  livenessPassed: false,
  livenessFaceRight: false,
  livenessFaceLeft: false,
  livenessBlink: false,
  agreeTerms: false,
  agreeDataSharing: false,
  agreeDebit: false,
};

const KYCContext = createContext<KYCContextValue | undefined>(undefined);

export const KYCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kycData, setKYCData] = useState<KYCData>(initialKYCData);
  const [isLoading, setIsLoading] = useState(false);
  const { token, user } = useAuth();

  const updateKYCData = useCallback((data: Partial<KYCData>) => {
    setKYCData(prev => ({ ...prev, ...data }));
  }, []);

  const setIdCardImage = useCallback((image: KYCDocument | null) => {
    setKYCData(prev => ({ ...prev, idCardImage: image }));
  }, []);

  const setFaceImage = useCallback((image: KYCDocument | null) => {
    setKYCData(prev => ({ ...prev, faceImage: image }));
  }, []);

  const setLivenessPassed = useCallback((passed: boolean) => {
    setKYCData(prev => ({ ...prev, livenessPassed: passed }));
  }, []);

  const setLivenessFaceRight = useCallback((passed: boolean) => {
    setKYCData(prev => ({ ...prev, livenessFaceRight: passed }));
  }, []);

  const setLivenessFaceLeft = useCallback((passed: boolean) => {
    setKYCData(prev => ({ ...prev, livenessFaceLeft: passed }));
  }, []);

  const setLivenessBlink = useCallback((passed: boolean) => {
    setKYCData(prev => ({ ...prev, livenessBlink: passed }));
  }, []);

  const submitBankAccount = useCallback(async (bankData?: { bankName: string; bankCode: string; bankHolderName: string; bankAccountNumber: string }): Promise<boolean> => {
    if (!token || !user?.id) {
      Alert.alert('Error', 'Please sign in to continue');
      return false;
    }

    setIsLoading(true);
    try {
      const requestBody = {
        user_id: user.id,
        bank_name: bankData?.bankName ?? kycData.bankName,
        bank_code: bankData?.bankCode ?? kycData.bankCode,
        account_name: bankData?.bankHolderName ?? kycData.bankHolderName,
        account_number: bankData?.bankAccountNumber ?? kycData.bankAccountNumber,
        account_type: 'INDIVIDUAL',
      };
      console.log('Bank Account Request Body:', JSON.stringify(requestBody));

      const response = await fetch(`${API_BASE_URL}/v1/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();
      console.log('Bank API Response:', response.status, text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // If JSON parsing fails, check the response status
        console.log('JSON parse failed, response:', text);
        if (response.ok) {
          return true;
        }
        throw new Error(text || 'Invalid server response');
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error?.message || data.message || 'Failed to save bank account');
      }

      return true;
    } catch (error: any) {
      console.error('Bank Account Error:', error);
      Alert.alert('Error', error.message || 'Failed to save bank account');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, user, kycData]);

  const submitKYC = useCallback(async (): Promise<boolean> => {
    if (!token || !user?.id) {
      Alert.alert('Error', 'Please sign in to continue');
      return false;
    }

    setIsLoading(true);
    try {
      // Step 1: Create customer profile
      const customerBody = {
        first_name: kycData.firstName,
        last_name: kycData.lastName == "" ? "No Last Name" : kycData.lastName,
        date_of_birth: `${kycData.dobYear}-${String(kycData.dobMonth).padStart(2, '0')}-${String(kycData.dobDay).padStart(2, '0')}`,
        address: [kycData.address1, kycData.address2].filter(Boolean).join(', '),
        city: kycData.city,
        state: kycData.state,
        country: kycData.country,
        postal_code: kycData.postalCode,
        identity_type: kycData.identityType === 'National ID' ? 'GOV' :
          kycData.identityType === 'Passport' ? 'PAS' :
            kycData.identityType === 'Driving License' ? 'DRV' : kycData.identityType,
        identity_number: kycData.identityNumber,
        occupation: kycData.occupation,
        occupation_description: kycData.occupationDescription || kycData.occupation,
        gender: kycData.gender?.toUpperCase() || 'MALE',
        birth_city: kycData.cityOfBirth,
        birth_country_code: kycData.countryOfBirth,
        birth_state: kycData.birthState,
        nationality: kycData.nationality,
        nationality_state: kycData.nationalityState,
        source_of_funds: 'Salary',
      };

      console.log('KYC Step 1 - Create Customer:', JSON.stringify(customerBody));

      const customerResponse = await fetch(`${API_BASE_URL}/v1/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(customerBody),
      });

      const customerText = await customerResponse.text();
      console.log('KYC Step 1 Response:', customerResponse.status, customerText);

      if (!customerResponse.ok) {
        let errorMsg = 'Failed to create customer profile';
        try {
          const errorData = JSON.parse(customerText);
          errorMsg = errorData.error?.message || errorData.message || errorMsg;
        } catch { }
        throw new Error(errorMsg);
      }

      // Step 2: Submit KYC documents (form-data with files)
      const formData = new FormData();

      if (kycData.idCardImage?.uri) {
        const idCardFile = {
          uri: kycData.idCardImage.uri,
          type: kycData.idCardImage.type || 'image/jpeg',
          name: 'identity_photo.jpg',
        } as any;
        formData.append('identity_photo', idCardFile);
      }

      if (kycData.faceImage?.uri) {
        const selfieFile = {
          uri: kycData.faceImage.uri,
          type: kycData.faceImage.type || 'image/jpeg',
          name: 'selfie_photo.jpg',
        } as any;
        formData.append('selfie_photo', selfieFile);
      }

      console.log('KYC Step 2 - Submit Documents (form-data)');

      const kycResponse = await fetch(`${API_BASE_URL}/v1/kyc/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Note: Do NOT set Content-Type for form-data, fetch sets it automatically with boundary
        },
        body: formData,
      });

      const kycText = await kycResponse.text();
      console.log('KYC Step 2 Response:', kycResponse.status, kycText);

      if (!kycResponse.ok) {
        let errorMsg = 'Failed to submit KYC documents';
        try {
          const errorData = JSON.parse(kycText);
          errorMsg = errorData.error?.message || errorData.message || errorMsg;
        } catch { }
        throw new Error(errorMsg);
      }

      return true;
    } catch (error: any) {
      console.error('KYC Submit Error:', error);
      Alert.alert('Error', error.message || 'Failed to submit KYC');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, user, kycData]);

  const value: KYCContextValue = {
    kycData,
    updateKYCData,
    setIdCardImage,
    setFaceImage,
    setLivenessPassed,
    setLivenessFaceRight,
    setLivenessFaceLeft,
    setLivenessBlink,
    submitKYC,
    submitBankAccount,
    isLoading,
  };

  return <KYCContext.Provider value={value}>{children}</KYCContext.Provider>;
};

export const useKYC = (): KYCContextValue => {
  const context = useContext(KYCContext);
  if (!context) {
    throw new Error('useKYC must be used within a KYCProvider');
  }
  return context;
};
