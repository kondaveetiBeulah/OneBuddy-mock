// screens/TermsOfServiceScreen.tsx
// Opens when the user taps "Terms of service".
// Renders the full terms as paragraph-wise sections on their own page.
// Replace the placeholder copy below with your actual legal text.

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import DetailScreenLayout from '../components/DetailScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'TermsOfService'>;

export default function TermsOfServiceScreen({ navigation }: Props) {
  return (
    <DetailScreenLayout
      title="Terms of service"
      lastUpdated="August 1, 2026"
      onBack={() => navigation.goBack()}
      sections={[
        {
          heading: '1. Acceptance of terms',
          paragraphs: [
            'By downloading, installing, or using OneBuddy, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use the app.',
          ],
        },
        {
          heading: '2. Description of service',
          paragraphs: [
            'OneBuddy provides tools and features designed to help you manage your daily tasks and stay connected with the services offered within the app. We may add, change, or remove features at any time to improve your experience.',
          ],
        },
        {
          heading: '3. User accounts',
          paragraphs: [
            'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Please notify us immediately if you suspect any unauthorized use of your account.',
          ],
        },
        {
          heading: '4. Acceptable use',
          paragraphs: [
            'You agree not to misuse OneBuddy, including but not limited to attempting to gain unauthorized access to our systems, interfering with other users\u2019 experience, or using the app for any unlawful purpose.',
          ],
        },
        {
          heading: '5. Subscriptions and payments',
          paragraphs: [
            'Certain features of OneBuddy may require a paid subscription. Prices, billing cycles, and cancellation terms are shown at the time of purchase through the applicable app store, and all payments are handled by that store.',
          ],
        },
        {
          heading: '6. Intellectual property',
          paragraphs: [
            'All content, trademarks, and technology within OneBuddy are the property of their respective owners and are protected by applicable intellectual property laws. You may not copy, modify, or distribute any part of the app without permission.',
          ],
        },
        {
          heading: '7. Limitation of liability',
          paragraphs: [
            'OneBuddy is provided on an "as is" basis. To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the app.',
          ],
        },
        {
          heading: '8. Changes to these terms',
          paragraphs: [
            'We may update these Terms of Service from time to time. Continued use of OneBuddy after changes are posted constitutes your acceptance of the revised terms. We encourage you to review this page periodically.',
          ],
        },
        {
          heading: '9. Contact us',
          paragraphs: [
            'If you have any questions about these Terms of Service, please reach out to our support team through the app or via our official contact channels.',
          ],
        },
      ]}
    />
  );
}
