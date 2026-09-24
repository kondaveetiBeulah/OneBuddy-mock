import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, useOCColors } from '../constants/colors';

interface ServiceCardProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  iconName: string;
  iconColor: string;
  iconBgColor: string;
  onPress: () => void;
  accentBorderColor?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  subtitle,
  badgeText,
  iconName,
  iconColor,
  iconBgColor,
  onPress,
  accentBorderColor,
}) => {
  const oc = useOCColors();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: oc.surface,
          borderColor: accentBorderColor || oc.borderSubtle,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
          <Ionicons name={iconName as any} size={22} color={iconColor} />
        </View>
        {badgeText ? (
          <View style={[styles.badge, { backgroundColor: oc.isDark ? '#064E3B' : Colors.primaryLight }]}>
            <Text style={[styles.badgeText, { color: oc.isDark ? '#6EE7B7' : Colors.primaryDark }]}>{badgeText}</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.title, { color: oc.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: oc.textSecondary }]}>{subtitle}</Text>

      <View style={styles.actionRow}>
        <Text style={[styles.actionText, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>Find Doctors</Text>
        <Ionicons name="arrow-forward" size={14} color={oc.isDark ? '#86EFAC' : Colors.primaryDark} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#E6EFE4',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
