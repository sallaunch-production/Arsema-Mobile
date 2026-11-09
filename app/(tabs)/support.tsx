import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useLanguage } from '../../contexts/language-context';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface ContactOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export default function SupportScreen() {
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const FAQ_ITEMS: FAQItem[] = [
    {
      id: '1',
      question: t('tabs.support.faq1Q'),
      answer: t('tabs.support.faq1A'),
    },
    {
      id: '2',
      question: t('tabs.support.faq2Q'),
      answer: t('tabs.support.faq2A'),
    },
    {
      id: '3',
      question: t('tabs.support.faq3Q'),
      answer: t('tabs.support.faq3A'),
    },
    {
      id: '4',
      question: t('tabs.support.faq4Q'),
      answer: t('tabs.support.faq4A'),
    },
    {
      id: '5',
      question: t('tabs.support.faq5Q'),
      answer: t('tabs.support.faq5A'),
    },
  ];

  const CONTACT_OPTIONS: ContactOption[] = [
    {
      id: 'email',
      icon: 'mail-outline',
      title: t('tabs.support.contactEmail'),
      description: t('tabs.support.contactEmailValue'),
    },
    {
      id: 'phone',
      icon: 'call-outline',
      title: t('tabs.support.contactPhone'),
      description: t('tabs.support.contactPhoneValue'),
    },
    {
      id: 'chat',
      icon: 'logo-whatsapp',
      title: t('tabs.support.contactChat'),
      description: t('tabs.support.contactChatDesc'),
    },
  ];

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleContactPress = (optionId: string) => {
    switch (optionId) {
      case 'email':
        Linking.openURL(`mailto:${t('tabs.support.contactEmailValue')}`);
        break;
      case 'phone':
        Linking.openURL(`tel:${t('tabs.support.contactPhoneValue').replace(/\s/g, '')}`);
        break;
      case 'chat':
        Linking.openURL('https://wa.me/622171794849');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>{t('tabs.support.title')}</Text>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('tabs.support.faqTitle')}</Text>
          {FAQ_ITEMS.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestionText}>{item.question}</Text>
                <Ionicons
                  name={
                    expandedId === item.id
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={20}
                  color={Colors.grayText}
                />
              </TouchableOpacity>
              {expandedId === item.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('tabs.support.contactTitle')}</Text>
          {CONTACT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.contactItem}
              activeOpacity={0.7}
              onPress={() => handleContactPress(option.id)}
            >
              <View style={styles.contactIcon}>
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>{option.title}</Text>
                <Text style={styles.contactDescription}>
                  {option.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.grayText}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingBottom: 14,
  },
  faqAnswerText: {
    fontSize: 13,
    color: Colors.grayText,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  contactDescription: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 24,
  },
});
