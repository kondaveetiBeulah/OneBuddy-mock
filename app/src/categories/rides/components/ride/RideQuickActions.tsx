import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, FONTS } from '../../theme';

interface RideQuickActionsProps {
  driverFirstName: string;
  onCall: () => void;
  onMessage: () => void;
  onSafety: () => void;
  onCancel: () => void;
  isDark?: boolean;
}

export function RideQuickActions({
  driverFirstName,
  onCall,
  onMessage,
  onSafety,
  onCancel,
  isDark,
}: RideQuickActionsProps): React.JSX.Element {
  const iconStroke = isDark ? '#66D21E' : COLORS.primaryDark;

  return (
    <View style={styles.container}>
      {/* Action 1: Call - Highlighted in OneBuddy Signature Green */}
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' },
          pressed && styles.actionPressed,
        ]}
        onPress={onCall}
        accessibilityRole="button"
        accessibilityLabel={`Call ${driverFirstName}`}
      >
        <View style={[styles.iconCircle, styles.callCircle]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1.1 1A16 16 0 0 1 4 5.1 1 1 0 0 1 5 4z"
              stroke="#FFFFFF"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={[styles.actionLabel, styles.callLabel, isDark && { color: '#66D21E' }]}>Call</Text>
      </Pressable>

      {/* Action 2: Message */}
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' },
          pressed && styles.actionPressed,
        ]}
        onPress={onMessage}
        accessibilityRole="button"
        accessibilityLabel={`Message ${driverFirstName}`}
      >
        <View style={[styles.iconCircle, styles.secondaryCircle, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.18)' }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.6A8 8 0 1 1 21 11.5z"
              stroke={iconStroke}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={[styles.actionLabel, isDark && { color: '#F1F1EC' }]}>Message</Text>
      </Pressable>

      {/* Action 3: Safety */}
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' },
          pressed && styles.actionPressed,
        ]}
        onPress={onSafety}
        accessibilityRole="button"
        accessibilityLabel="Safety toolkit"
      >
        <View style={[styles.iconCircle, styles.secondaryCircle, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.18)' }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 3l7.5 3.4V12c0 4.4-3.1 8.2-7.5 9.4C7.6 20.2 4.5 16.4 4.5 12V6.4z"
              stroke={iconStroke}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={12} cy={12} r={3} fill={iconStroke} />
          </Svg>
        </View>
        <Text style={[styles.actionLabel, isDark && { color: '#F1F1EC' }]}>Safety</Text>
      </Pressable>

      {/* Action 4: Cancel */}
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' },
          pressed && styles.actionPressed,
        ]}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel ride"
      >
        <View style={[styles.iconCircle, styles.cancelCircle, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.18)' }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </View>
        <Text style={[styles.actionLabel, styles.cancelLabel, isDark && { color: '#F87171' }]}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    marginVertical: 4,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionPressed: {
    opacity: 0.65,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  callCircle: {
    backgroundColor: COLORS.primary, // OneBuddy signature vibrant green
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryCircle: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(84, 183, 19, 0.25)',
  },
  cancelCircle: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    fontFamily: FONTS.display,
    textAlign: 'center',
  },
  callLabel: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  cancelLabel: {
    color: '#DC2626',
  },
});
