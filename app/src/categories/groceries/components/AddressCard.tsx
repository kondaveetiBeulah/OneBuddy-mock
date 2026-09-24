import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '../types/user.types';
import { colors, typography, spacing } from '../theme';

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
      style={[styles.container, selected && styles.selectedContainer]}
      onPress={() => onSelect && onSelect(address)}
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <View style={styles.typeBadge}>
          <Ionicons name={getIcon()} size={14} color={colors.primary} />
          <Text style={styles.typeText}>{address.type.toUpperCase()}</Text>
        </View>

        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>DEFAULT</Text>
          </View>
        )}

        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={colors.primary}
            style={styles.checkIcon}
          />
        )}
      </View>

      <Text style={styles.nameText}>{address.name}</Text>
      <Text style={styles.addressText}>
        {address.houseNumber}, {address.street}, {address.area}
      </Text>
      <Text style={styles.addressText}>
        {address.city}, {address.state} - {address.pincode}
      </Text>
      {address.landmark ? (
        <Text style={styles.landmarkText}>Landmark: {address.landmark}</Text>
      ) : null}
      <Text style={styles.phoneText}>Phone: {address.phone}</Text>

      {(onEdit || onDelete) && (
        <View style={styles.actionRow}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(address)}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete(address.id)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.danger }]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedContainer: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
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
    backgroundColor: colors.background,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: spacing.borderRadius.sm,
    gap: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  defaultBadge: {
    backgroundColor: colors.secondaryLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: spacing.borderRadius.sm,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.secondaryDark,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  nameText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginVertical: 2,
  },
  addressText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  landmarkText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  phoneText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
    color: colors.primary,
  },
});
