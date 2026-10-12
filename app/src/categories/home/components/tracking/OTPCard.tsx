import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldCheck, Copy, Check } from 'lucide-react-native';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../../theme';

interface OTPCardProps {
  otp: string;
  providerName?: string;
}

export const OTPCard: React.FC<OTPCardProps> = ({
  otp,
  providerName = 'the service professional',
}) => {
  const { isDark, colors } = useHomeTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const digits = otp.split('');

  return (
    <View
      style={[
        styles.container,
        isDark && {
          backgroundColor: colors.surfaceSubtle,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, isDark && { backgroundColor: colors.surface }]}>
          <ShieldCheck size={20} color={isDark ? '#66D21E' : COLORS.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Service Start PIN (OTP)</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Share this 4-digit OTP with {providerName} upon arrival to begin work
          </Text>
        </View>
      </View>

      {/* 4 Digit Boxes */}
      <View style={styles.otpRow}>
        {digits.map((digit, idx) => (
          <View
            key={idx}
            style={[
              styles.digitBox,
              isDark && {
                backgroundColor: colors.surface,
                borderColor: 'rgba(84, 183, 19, 0.4)',
              },
            ]}
          >
            <Text style={[styles.digitText, isDark ? { color: '#66D21E' } : { color: COLORS.primaryDark }]}>
              {digit}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.footerRow, isDark && { borderTopColor: colors.border }]}>
        <Text style={[styles.safetyNote, { color: colors.textSecondary }]}>
          🔒 Do not share until professional arrives at your door
        </Text>

        <TouchableOpacity
          style={[styles.copyBtn, isDark && { backgroundColor: colors.surface }]}
          activeOpacity={0.7}
          onPress={handleCopy}
        >
          {copied ? (
            <>
              <Check size={14} color={isDark ? '#4ADE80' : COLORS.success} style={{ marginRight: 4 }} />
              <Text style={[styles.copyText, { color: isDark ? '#4ADE80' : COLORS.success }]}>Copied</Text>
            </>
          ) : (
            <>
              <Copy size={14} color={isDark ? '#66D21E' : COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.copyText, isDark && { color: '#66D21E' }]}>Copy OTP</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EEF2FF',
    borderRadius: RADII.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    marginVertical: SPACING.md,
    ...SHADOWS.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
    lineHeight: 16,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  digitBox: {
    width: 52,
    height: 56,
    borderRadius: RADII.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    ...SHADOWS.sm,
  },
  digitText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#C7D2FE',
  },
  safetyNote: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
    flex: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    marginLeft: SPACING.sm,
  },
  copyText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
