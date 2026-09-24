// screens/AppVersionScreen.tsx
// Opens when the user taps the "App version" row.
// Shows build/version details as its own full page.

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import DetailScreenLayout from '../components/DetailScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'AppVersion'>;

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '100';
const RELEASE_DATE = 'August 2026';

export default function AppVersionScreen({ navigation }: Props) {
  return (
    <DetailScreenLayout
      title="App version"
      onBack={() => navigation.goBack()}
      sections={[
        {
          heading: 'Current version',
          paragraphs: [
            `OneBuddy version ${APP_VERSION} (build ${BUILD_NUMBER}) — you're on the latest build available in the store.`,
          ],
        },
        {
          heading: "What's new",
          paragraphs: [
            'This release includes performance improvements, bug fixes, and a refreshed About section for easier access to app information, terms, and privacy details.',
          ],
        },
        {
          heading: 'Release details',
          paragraphs: [
            `Released: ${RELEASE_DATE}.`,
            'OneBuddy checks for updates automatically. When a new version is available, you will be notified from the store page so you can update at your convenience.',
          ],
        },
      ]}
    />
  );
}
