import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ScreenLayout } from '../../components/screen-layout';
import { useAuth } from '../../contexts/auth-context';
import { API_BASE_URL } from '../../constants/api';
import { useLanguage } from '../../contexts/language-context';

const FRAUD_WARNING = `IMPORTANT INFORMATION - Valued MoneyGram Customer STOP !

Please Read ! MONEY TRANSFER FRAUD WARNING

Keep your money safe. If any of the below apply, DO NOT SEND the money transfer. It's a scam, and someone is trying to steal your money. If you send money, it can be paid out quickly, and you may not be able to get a refund.

Are you sending money for something a telemarketer sold you? If YES: Do not send the transaction. Sellers and telemarketers can't take money transfer payments from people in the US for something they're selling through telemarketing.

Never transfer money to a stranger. Know who you are dealing with. A money transfer is like cash.

Never send money in the following situations:
• To make a charity donation or to pay an internet merchant for supplies during a pandemic, natural disaster, or other crisis
• To receive money (example: lottery winnings, a prize, job offer, or loan)
• For a "secret shopper" opportunity or to repay an overpayment
• To pay the IRS or the police, or to get out of a warrant
• To buy a car, puppy, or another high-value or unique item, or for "escrow" on an apartment

Never send money without checking out the story. Reach out to that friend or family member you heard is in need first.

If it sounds too good to be true, it probably is.

Never give your transaction reference number to anyone other than the person you intend to receive the money. Fraudulent transactions may result in the loss of your money with no recourse. Victim of fraud? Call 1 (800) 926-9400 for assistance or visit www.moneygram.com and file a complaint.`;

const TERMS_AND_CONDITIONS = `MoneyGram Terms and Conditions for Sending

Money

1. INTRODUCTION
1.1. The MoneyGram money transfer service (“Service”) is
available through MoneyGram’s network of agents,
authorized delegates or other permitted entities (“Agents”).
These Terms and Conditions along with the Documentation
(defined in condition 1.2) used for the Service (to which the
Terms and Conditions may be included or attached),
constitute the entire agreement (“Agreement”) between
MoneyGram and you, the individual user of the Service
(“you” or “Sender”).
1.2. You must review, fully complete and sign any and all
documentation (which may be in paper or electronic form)
related to the transfer, including all forms, receipts and
acknowledgements (collectively the “Documentation”), and
confirm that the information contained in the
Documentation is complete and accurate to use the Service.
If you do not, we may not be able to send the money
(“Transfer”). You must inform us if any of the information
you provide changes before the recipient (“Receiver”)
collects the money.

1.3. By using or attempting to use the Service in any capacity
you acknowledge that you (i) accept the terms of this
Agreement. (ii) have read the Documentation relating to the
Transfer and that (iii) the information described and/or as
provided by you in the Documentation relating to the
Transfer is accurate.

1.4. The Agreement and the Service allows you to send a
Transfer to a Receiver and allows them to (i) collect in cash
at a MoneyGram location (“cash to cash” service), (ii)
receive into their bank account or other type of physical or
virtual account, for example a mobile wallet account (“cash
to account” service); or (iii) have the money delivered to a
nominated address (the “home delivery” service). These
Terms and Conditions apply to these three types of services
except where we say they apply to a particular service(s) to
the exclusion of the other(s).
1.5. For cash to cash Transfers, you can either send money
within the same country or to a different “receive country”.
The Receiver can only collect the money in the receive
country stated in the form. Once the Agent has processed
this form and been given your money, the Receiver can
collect the money at any MoneyGram location in the receive
country during opening hours in cash in the currency stated
in the form unless condition 2 below applies. We will not
contact the Receiver when the money is ready to collect;
this is something you must do.
1.6. We do not offer the Service in all countries. You can call us,
visit our website or ask any Agent to find out the availability
of our Service, and addresses and opening times of locations
offering the Service.

2. CHARGES AND CURRENCY EXCHANGE
2.1. You must pay us the fee stated in the form. We will not charge
you any other fee for the Transfer. You can only send money in
a certain currency or currencies. The Agent will tell you whether
a payout currency is available in the receive country and (if
different to the currency in which you pay us) what exchange
rate will apply. Your chosen currency, the agreed exchange rate
and the converted amount will be stated in the form.

2.2. For cash to cash Transfers to certain countries: (i) if the
Transfer amount is stated in U.S. Dollars, and the Receiver’s
Agent does not pay out in that currency, they will convert the
money into the local currency using either their or MoneyGram
standard exchange rate; (ii) if the money (whatever foreign
currency it is sent in) is not collected 45 days, the Receiver’s
Agent may recalculate the converted amount at the time of
collection, using their MoneyGram’s standard exchange rate.

3. RESTRICTIONS ON TRANSFERS
There are limits on the amount you are able to send. The Agent
will, as necessary, tell you what they are. We may refuse to
send the money or allow it to be collected if we reasonably
believe that: (a) by doing so we might break any law,
regulation, code or other duty that applies to us; (b) doing so
may expose us to action from any government or regulator; or
(c)in may be linked with fraudulent or illegal activity.

4. CANCELLING AND REFUNDING A TRANSFER
We may be able to cancel the Transfer before the Recipient
collect or receives the money. If you wish to cancel the
Transfer and request a refund of the Transfer amount before
the Receiver collects the money, you can ask an Agent or write
to use enclosing a copy of your completed form. We aim to
process such requests promptly but in any case within 30 days.

7. ADDITIONALS CONDITIONS FOR CASH TO ACCOUNT
TRANSFERS
7.1. We will send the money to the account you specify in the
form. For information on when a payment will be credited to
such an account, you need to cantact the Receiver’s account
provider.
7.2. The Receiver’s account provider may apply its own charges to
the Transfer, which do not involve us.
7.3. If you ask us to send money to an account and the Transfer
was not made properly or never arrived, we will promptly
refund your money and our fee – unless we can show that the
account provider received the money or that there was a
mistake in the Receiver’s account details that you gave us which
were required to successfully effect the Transfer. If the
information you gave us about the Receiver was incorrect, and
we made the transfer based on that information, we will be
deemed to have made the Transfer properly but we will still
make reasonable efforts to recover the funds for you and, if you
ask us to, we will provide you with available and relevant
information to help you claim repayment of the funds.

9. OUR LIABILITY
9.1. We will not be liable to you if we break this Agreement due to:
(i) unforeseeable circumstances outside our control where we
could not avoid breaking this Agreement despite all efforts to
the contrary – this may include, for example, delays or failures
caused by industrial action, technical problems with another
system or network, mechanical breakdown or data-processing
failures; or (ii) our obligations under laws applicable to us
and/or the Service.

9.2. We are not liable to you for more than the amount of money
you send and our fee. We will not be liable for any incidental,
indirect, special or consequential losses or costs you suffer or,
as this Agreement is made with you as a cunsomer, any
business losses or costs (such as loss of business profits or
opportunities).

9.3. Our Service is for persons 17 years and over and may not be
used for escrow or trust or gambling purposes, and may only be
used for a lawful purpose. Please also read the fraud warnings
on the form. If you ask us to pay someone who turns out to
have defrauded you, or who fails to meet their obligations to
you, we will not be liable as a result.

10. OTHER TERMS
10.1.We will report money transfers to any government authorities
if we are required to do so by law.
10.2. The Transfer and use of our Service does not involve you or
the Receiver having a “deposit” or an account with
MoneyGram.

10.3. These conditions have been prepared in the English language,
which shall be the governing language for all purposes. In the
event of any conflict between the English version of the
Agreement and any translated version of the Agreement, the
English version of the Agreement shall govern and we will
communicate with you in English.

11. DATA PRIVACY
11.1.This notice applies to personal information MoneyGram
collects about you and the Receiver. The information we collect
and use, depend on the productor service you have with us,
including but not limited to, contact information and
identification information. We may share the information we
collect from you with third-parties, including affiliated
companies, to process your transactions, market our products
and services to you, detect and prevent fraud and other illegal
activities, such as money laundering activities, or to cooperate
with criminal or government investigations, in accordance to
applicable laws. In addition, the personal information we

collect may be transferred outside the country of collection for
international transfers and for processing. For details on our
privacy practices and your rights, please visit
www.moneygram.com/privacy-notice.

11.2. To opt out of receiving marketing communication from us,
you may: (i) click on the “unsubscribe” link at the bottom of the
MoneyGram marketing email you’ve received; (ii) reply
“MGISTOP” to a text or SMS message; or (iii) contact us at
privacyprogramoffice@moneygram.com.

12. CONTACT DETAILS AND CUSTOMER SERVICE INFORMATION
We are commited to ensuring that you receive high quality
service from us. In the event that you are dissatisfied with our
Service or believe an error has occurred with yor Transfer,
please contact us as soon as possible. For full details of our
complaints procedure or consumer protection advice, or to
submit a complaint, you can:
a.) call us at 001 / 007 – 8030165505 or 021 – 50851711;
b.) visit our website www.moneygram.com and submit the
online form;
c.) send an email to us at:
customerservice@moneygram.com; or
d.) write to:
PT MoneyGram Payment Systems Indonesia, GoWork.
Pondok Indah Office Tower 2, 15 th Floor Unit 1557, Jl.
Sultan Iskandar Muda Kav. V-TA, Jakarta Selatan 12310 –
Indonesia.

13. Bank Indonesia regulates licensed payment service providers in
Indonesia, including PT MoneyGram Payment Systems
Indonesia. The Service is provided by MoneyGram Payment
Systems, Inc. and made available through MoneyGram’s
Agents.
`;


interface EnumItem {
  value: string;
  description: string;
}

export default function SendingDetailsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();

  const [purposeOptions, setPurposeOptions] = useState<EnumItem[]>([]);
  const [sourceOptions, setSourceOptions] = useState<EnumItem[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<EnumItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [purpose, setPurpose] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [relationship, setRelationship] = useState('');
  const [acknowledgeInfo, setAcknowledgeInfo] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPurpose, setShowPurpose] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showRelationship, setShowRelationship] = useState(false);

  const { token } = useAuth();

  const fetchProxyToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/moneygram/proxy-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      const accessToken = data.data?.accessToken || data.accessToken;

      // Clean the token (remove "Bearer " if it's already there)
      const cleanToken = accessToken && accessToken.startsWith('Bearer ')
        ? accessToken.substring(7)
        : accessToken;

      return cleanToken;
    } catch (error) {
      console.error('Failed to fetch proxy token for enumerations:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchEnumerations = async () => {
      try {
        const mgToken = await fetchProxyToken();
        console.log('Fetching enumerations with proxy token:', mgToken ? 'Present' : 'Missing');

        const response = await fetch(`${API_BASE_URL}/v1/moneygram/enumerations`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Proxy-Token': mgToken || '',
            'Accept': 'application/json',
          },
        });

        console.log('Enumerations Response Status:', response.status);
        const data = await response.json();
        console.log('Enumerations Raw Data:', JSON.stringify(data, null, 2));

        if (response.ok && data.success !== false) {
          const enumsList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          const blockNames = enumsList.map((b: any) => b.name);
          console.log('Enumeration block names:', JSON.stringify(blockNames));

          const findBlock = (name: string) => enumsList.find((b: any) => b.name === name);

          const purposeBlock = findBlock('PURPSE_OF_TRNSCTION');
          const sourceBlock = findBlock('SOURCE_OF_FUNDS');
          const relationshipBlock = findBlock('RELATIONSHP_TO_SNDR');

          console.log('Purpose block found:', !!purposeBlock, purposeBlock?.items?.length || 0, 'items');
          console.log('Source block found:', !!sourceBlock, sourceBlock?.items?.length || 0, 'items');
          console.log('Relationship block found:', !!relationshipBlock, relationshipBlock?.items?.length || 0, 'items');

          const extractItems = (block: any): EnumItem[] | null => {
            if (!block || !Array.isArray(block.items)) return null;
            return block.items.map((i: any) => ({
              value: i.value,
              description: i.description || i.value
            }));
          };

          const purposes = extractItems(purposeBlock);
          const sources = extractItems(sourceBlock);
          const relationships = extractItems(relationshipBlock);

          if (purposes) setPurposeOptions(purposes);
          if (sources) setSourceOptions(sources);
          if (relationships) setRelationshipOptions(relationships);
        } else {
          console.warn('Enumerations API returned error, using fallbacks');
        }
      } catch (error) {
        console.error('Failed to fetch enumerations, using fallbacks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnumerations();
  }, [token]);

  const isFormValid =
    purpose.length > 0 &&
    sourceOfFunds.length > 0 &&
    relationship.length > 0 &&
    acknowledgeInfo &&
    agreeTerms;

  const closeAllDropdowns = () => {
    setShowPurpose(false);
    setShowSource(false);
    setShowRelationship(false);
  };

  const handleNext = () => {
    if (!isFormValid) return;
    router.push({
      pathname: '/(moneygram)/review-send' as any,
      params: {
        ...params,
        purpose,
        sourceOfFunds,
        relationship,
      },
    });
  };

  const renderDropdown = (
    label: string,
    selectedValue: string,
    placeholder: string,
    options: EnumItem[],
    isOpen: boolean,
    setOpen: (v: boolean) => void,
    onSelect: (v: string) => void,
  ) => {
    const selectedItem = options.find(o => o.value === selectedValue);

    return (
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={[styles.selectInput, isOpen && styles.selectInputActive]}
          onPress={() => {
            closeAllDropdowns();
            setOpen(!isOpen);
          }}
        >
          <Text style={[styles.selectText, !selectedValue && styles.placeholderText]}>
            {selectedItem ? selectedItem.description : placeholder}
          </Text>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.grayText}
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.optionsList}>
            <ScrollView style={{ maxHeight: 250 }}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    selectedValue === option.value && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                  {selectedValue === option.value && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenLayout title={t('mg.sendingDetails.title')}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderDropdown(
          t('mg.sendingDetails.purposeLabel'),
          purpose,
          t('mg.sendingDetails.purposePlaceholder'),
          purposeOptions,
          showPurpose,
          setShowPurpose,
          setPurpose,
        )}

        {renderDropdown(
          t('mg.sendingDetails.sourceLabel'),
          sourceOfFunds,
          t('mg.sendingDetails.sourcePlaceholder'),
          sourceOptions,
          showSource,
          setShowSource,
          setSourceOfFunds,
        )}

        {renderDropdown(
          t('mg.sendingDetails.relationshipLabel'),
          relationship,
          t('mg.sendingDetails.relationshipPlaceholder'),
          relationshipOptions,
          showRelationship,
          setShowRelationship,
          setRelationship,
        )}

        {/* Fraud Warning */}
        <View style={styles.infoCard}>
          <ScrollView style={styles.infoScroll} nestedScrollEnabled>
            <Text style={styles.infoText}>{FRAUD_WARNING}</Text>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAcknowledgeInfo(!acknowledgeInfo)}
        >
          <View style={[styles.checkbox, acknowledgeInfo && styles.checkboxChecked]}>
            {acknowledgeInfo && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <Text style={styles.checkboxLabel}>
            {t('mg.sendingDetails.acknowledgeLabel')}
          </Text>
        </TouchableOpacity>

        {/* Terms and Conditions */}
        <View style={styles.infoCard}>
          <ScrollView style={styles.infoScroll} nestedScrollEnabled>
            <Text style={styles.infoText}>{TERMS_AND_CONDITIONS}</Text>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreeTerms(!agreeTerms)}
        >
          <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
            {agreeTerms && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <Text style={styles.checkboxLabel}>
            {t('mg.sendingDetails.termsLabel')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, !isFormValid && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid}
        >
          <Text style={styles.nextButtonText}>{t('mg.sendingDetails.nextButton')}</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  dropdownContainer: {
    marginTop: 16,
    zIndex: 1,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectInputActive: {
    borderColor: Colors.primary,
  },
  selectText: {
    fontSize: 15,
    color: Colors.black,
  },
  placeholderText: {
    color: Colors.grayText,
  },
  optionsList: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: Colors.white,
    overflow: 'hidden',
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
  optionItemSelected: {
    backgroundColor: '#FFF0F0',
  },
  optionText: {
    fontSize: 15,
    color: Colors.black,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    height: 200,
  },
  infoScroll: {
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: Colors.black,
    lineHeight: 19,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
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
    backgroundColor: '#4A3AFF',
    borderColor: '#4A3AFF',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4A3AFF',
    flex: 1,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorder,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
