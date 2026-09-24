// screens/AboutScreen.tsx
// Matches the provided design: a bottom-sheet-style "About OneBuddy" page
// with a banner message, and a card containing three rows:
//   1. App version   -> static value, but ALSO tappable -> AppVersionScreen
//   2. Terms of service -> navigates to TermsOfServiceScreen
//   3. Privacy policy   -> navigates to PrivacyPolicyScreen

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import SettingsRow from '../components/SettingsRow';
import { useColors, useTypography, spacing, radius } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export default function AboutScreen({ navigation }: Props) {
  const colors = useColors();
  const typography = useTypography();

  const InfoIcon = () => <Text style={[{ fontSize: 18 }, { color: colors.gold }]}>{'\u24D8'}</Text>;
  const DocIcon = () => <Text style={[{ fontSize: 18 }, { color: colors.purpleIcon }]}>{'\u2637'}</Text>;
  const ShieldIcon = () => <Text style={[{ fontSize: 18 }, { color: colors.purpleIcon }]}>{'\u26E8'}</Text>;

  const styles = React.useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    handleWrap: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.handleBar,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.cardBackground,
    },
    headerIconText: {
      fontSize: 20,
      color: colors.textPrimary,
      fontWeight: '600' as const,
    },
    headerDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    banner: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.gold,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      textAlign: 'center' as const,
    },
    card: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.sheetBackground,
      overflow: 'hidden' as const,
    },
  }), [colors]);

  const APP_VERSION = '1.0.0';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle={colors.textPrimary === '#F1F1EC' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Drag handle, purely decorative to mimic a bottom sheet */}
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.headerIconText}>{'\u2039'}</Text>
        </TouchableOpacity>

        <Text style={typography.title}>About OneBuddy</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.headerIconText}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      {/* Banner message */}
      <Text style={styles.banner}>
        Thanks for backing OneBuddy — the store page is opening.
      </Text>

      {/* Card with rows */}
      <View style={styles.card}>
        <SettingsRow
          icon={<InfoIcon />}
          iconBackground={colors.goldSoft}
          title="App version"
          subtitle="You're on the latest build"
          value={APP_VERSION}
          onPress={() => navigation.navigate('AppVersion')}
        />
        <SettingsRow
          icon={<DocIcon />}
          iconBackground={colors.purpleChip}
          title="Terms of service"
          onPress={() => navigation.navigate('TermsOfService')}
        />
        <SettingsRow
          icon={<ShieldIcon />}
          iconBackground={colors.purpleChip}
          title="Privacy policy"
          onPress={() => navigation.navigate('PrivacyPolicy')}
          showDivider={false}
        />
      </View>
    </SafeAreaView>
  );
}
