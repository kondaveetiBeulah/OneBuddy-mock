import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, useOCColors } from '../constants/colors';

interface OneBuddyHeaderProps {
  onClose?: () => void;
  topInset?: number;
}

export const OneBuddyHeader: React.FC<OneBuddyHeaderProps> = ({ onClose, topInset = 0 }) => {
  const oc = useOCColors();

  return (
    <View style={[styles.header, { paddingTop: topInset > 0 ? topInset + 8 : 10, backgroundColor: oc.surface, borderBottomColor: oc.border }]}>
      {onClose && (
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: oc.borderSubtle }]}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          accessibilityLabel="Back to Home"
        >
          <Ionicons name="arrow-back" size={22} color={oc.textPrimary} />
        </TouchableOpacity>
      )}
      <View style={styles.brandContainer}>
        <Text style={[styles.brandTitle, { color: oc.textPrimary }]} numberOfLines={1}>
          One<Text style={styles.brandAccent}>Buddy</Text> Online Consultation
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE4',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  brandContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  brandAccent: {
    color: Colors.primary,
  },
});

