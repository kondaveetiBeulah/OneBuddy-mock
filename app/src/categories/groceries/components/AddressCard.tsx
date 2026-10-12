import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '../types/user.types';
import { colors, typography, spacing } from '../theme';
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

interface AddressCardProps {
  address: Address;
  selected?: boolean;
  onSelect?: (address: Address) => void;
  onEdit?: (address: Address) => void;
  onDelete?: (addressId: string) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);
  const getIcon = () => {
    switch (address.type) {
      case 'home':
        return 'home-outline';
      case 'work':
        return 'briefcase-outline';
      default:
        return 'location-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[dynStyles.container, selected && dynStyles.selectedContainer]}
      onPress={() => onSelect && onSelect(address)}
      activeOpacity={0.8}
    >
      <View style={dynStyles.headerRow}>
        <View style={dynStyles.typeBadge}>
          <Ionicons name={getIcon()} size={14} color={isDark ? '#FFFFFF' : colors.primary} />
          <Text style={dynStyles.typeText}>{address.type.toUpperCase()}</Text>
        </View>

        {address.isDefault && (
          <View style={dynStyles.defaultBadge}>
            <Text style={dynStyles.defaultText}>DEFAULT</Text>
          </View>
        )}

        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={isDark ? '#FFFFFF' : colors.primary}
            style={dynStyles.checkIcon}
          />
        )}
      </View>

      <Text style={dynStyles.nameText}>{address.name}</Text>
      <Text style={dynStyles.addressText}>
        {address.houseNumber}, {address.street}, {address.area}
      </Text>
      <Text style={dynStyles.addressText}>
        {address.city}, {address.state} - {address.pincode}
      </Text>
      {address.landmark ? (
        <Text style={dynStyles.landmarkText}>Landmark: {address.landmark}</Text>
      ) : null}
      <Text style={dynStyles.phoneText}>Phone: {address.phone}</Text>

      {(onEdit || onDelete) && (
        <View style={dynStyles.actionRow}>
          {onEdit && (
            <TouchableOpacity
              style={dynStyles.actionButton}
              onPress={() => onEdit(address)}
            >
              <Ionicons name="create-outline" size={16} color={isDark ? '#FFFFFF' : colors.primary} />
              <Text style={dynStyles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={dynStyles.actionButton}
              onPress={() => onDelete(address.id)}
            >
              <Ionicons name="trash-outline" size={16} color={isDark ? '#EF4444' : colors.danger} />
              <Text style={[dynStyles.actionText, { color: isDark ? '#EF4444' : colors.danger }]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDark ? '#000000' : colors.cardBackground,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.border,
  },
  selectedContainer: {
    borderColor: isDark ? '#5FA300' : colors.primary,
    backgroundColor: isDark ? 'rgba(95,163,0,0.2)' : colors.primaryLight,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.background,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: spacing.borderRadius.sm,
    gap: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.primaryDark,
  },
  defaultBadge: {
    backgroundColor: isDark ? 'rgba(255,152,0,0.2)' : colors.secondaryLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: spacing.borderRadius.sm,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFA726' : colors.secondaryDark,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  nameText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginVertical: 2,
  },
  addressText: {
    fontSize: typography.sizes.sm,
    color: isDark ? '#E5E7EB' : colors.textSecondary,
    lineHeight: 18,
  },
  landmarkText: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.textMuted,
    marginTop: 2,
  },
  phoneText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.12)' : colors.borderLight,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: isDark ? '#FFFFFF' : colors.primary,
  },
});
