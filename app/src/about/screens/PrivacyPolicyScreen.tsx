// screens/PrivacyPolicyScreen.tsx
// Opens when the user taps "Privacy policy".
// Renders the full policy as paragraph-wise sections on their own page.
// Replace the placeholder copy below with your actual legal text.

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import DetailScreenLayout from '../components/DetailScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <DetailScreenLayout
      title="Privacy policy"
      lastUpdated="August 1, 2026"
      onBack={() => navigation.goBack()}
      sections={[
        {
          heading: '1. Information we collect',
          paragraphs: [
            'We collect information you provide directly, such as your name, email address, and profile details, as well as information generated automatically while you use OneBuddy, such as device type, app usage patterns, and crash reports.',
          ],
        },
        {
          heading: '2. How we use your information',
          paragraphs: [
            'Your information is used to operate and improve OneBuddy, personalize your experience, provide customer support, and communicate important updates about the app. We do not use your data for purposes beyond what is described here without your consent.',
          ],
        },
        {
          heading: '3. Sharing of information',
          paragraphs: [
            'We do not sell your personal information. We may share limited data with trusted service providers who help us operate the app, such as hosting or analytics partners, and only to the extent necessary for them to perform their services.',
          ],
        },
        {
          heading: '4. Data storage and security',
          paragraphs: [
            'We take reasonable technical and organizational measures to protect your information from unauthorized access, alteration, or loss. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
          ],
        },
        {
          heading: '5. Your choices and rights',
          paragraphs: [
            'You may access, update, or delete certain information directly within the app. Depending on your location, you may also have additional rights under applicable data protection laws, such as requesting a copy of your data or asking us to delete it.',
          ],
        },
        {
          heading: '6. Children\u2019s privacy',
          paragraphs: [
            'OneBuddy is not intended for children under the age required by applicable law without parental consent. We do not knowingly collect personal information from children in violation of these requirements.',
          ],
        },
        {
          heading: '7. Changes to this policy',
          paragraphs: [
            'We may update this Privacy Policy periodically to reflect changes in our practices or for legal reasons. We will notify you of significant changes through the app, and continued use after changes take effect means you accept the revised policy.',
          ],
        },
        {
          heading: '8. Contact us',
          paragraphs: [
            'If you have questions or concerns about this Privacy Policy or how your information is handled, please contact our support team through the app or via our official contact channels.',
          ],
        },
      ]}
    />
  );
}
