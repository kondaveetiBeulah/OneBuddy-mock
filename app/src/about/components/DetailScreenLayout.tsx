// components/DetailScreenLayout.tsx
// Shared layout for any "full page" screen reached from the About menu:
// back header + scrollable body. TermsOfServiceScreen and
// PrivacyPolicyScreen both render their content through this.

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, useTypography, spacing, radius } from '../theme/theme';

interface Section {
  heading?: string;
  paragraphs: string[];
}

interface DetailScreenLayoutProps {
  title: string;
  lastUpdated?: string;
  sections: Section[];
  onBack: () => void;
}

export default function DetailScreenLayout({
  title,
  lastUpdated,
  sections,
  onBack,
}: DetailScreenLayoutProps) {
  const colors = useColors();
  const typography = useTypography();
  
  const styles = React.useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
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
      borderRadius: radius.sm,
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backArrow: {
      fontSize: 22,
      color: colors.textPrimary,
      fontWeight: '600' as const,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center' as const,
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginHorizontal: spacing.sm,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    lastUpdated: {
      ...typography.rowSubtitle,
      marginBottom: spacing.lg,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionHeading: {
      ...typography.sectionHeading,
      marginBottom: spacing.sm,
    },
    paragraph: {
      ...typography.paragraph,
      marginBottom: spacing.md,
    },
  }), [colors, typography]);
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle={colors.textPrimary === '#F1F1EC' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>{'\u2039'}</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        {/* Spacer keeps the title visually centered against the back button */}
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {lastUpdated ? (
          <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
        ) : null}

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            {section.heading ? (
              <Text style={styles.sectionHeading}>{section.heading}</Text>
            ) : null}
            {section.paragraphs.map((para, pIndex) => (
              <Text key={pIndex} style={styles.paragraph}>
                {para}
              </Text>
            ))}
          </View>
        ))}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
