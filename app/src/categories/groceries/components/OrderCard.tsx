import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderStatus } from '../types/order.types';
import { colors, typography, spacing } from '../theme';
import { formatCurrency, formatDate } from '../utils/helpers';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
  onTrackPress?: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onPress,
  onTrackPress,
}) => {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.danger;
      case 'out_for_delivery':
      case 'preparing':
      case 'packed':
      case 'confirmed':
        return colors.secondary;
      default:
        return colors.accent;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Packing';
      case 'packed':
        return 'Packed';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const firstThreeItems = order.items.slice(0, 3);
  const remainingCount = order.items.length - 3;
  const statusColor = getStatusColor(order.status);

  // Address line construction
  const addr = order.deliveryAddress;
  const addressFormatted = addr
    ? [
        addr.houseNumber,
        addr.street,
        addr.area,
        addr.city ? `${addr.city} - ${addr.pincode || ''}` : addr.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(order)}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>

      {/* Items Preview */}
      <View style={styles.itemsPreview}>
        {firstThreeItems.map((item) => (
          <Image
            key={item.id}
            source={{ uri: item.productImage }}
            style={styles.thumbnail}
          />
        ))}
        {remainingCount > 0 && (
          <View style={styles.moreThumbnail}>
            <Text style={styles.moreText}>+{remainingCount}</Text>
          </View>
        )}
      </View>

      {/* Delivery Address Section on Specific Order */}
      {addr && (
        <View style={styles.addressBox}>
          <View style={styles.addressIconWrap}>
            <Ionicons name="location-sharp" size={14} color={colors.primary} />
          </View>
          <View style={styles.addressInfoCol}>
            <View style={styles.addressTopRow}>
              <Text style={styles.addressLabel}>DELIVERY ADDRESS</Text>
              {addr.type && (
                <View style={styles.addressTypeBadge}>
                  <Text style={styles.addressTypeBadgeText}>
                    {addr.type.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.addressText} numberOfLines={2}>
              {addressFormatted || 'Delivery Address'}
            </Text>
            {(addr.name || addr.phone) && (
              <Text style={styles.addressReceiverText}>
                {addr.name}{addr.phone ? ` • +91 ${addr.phone.replace('+91', '').trim()}` : ''}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>
            {order.items.reduce((s, i) => s + i.quantity, 0)} Items
          </Text>
          <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
        </View>

        {order.status !== 'delivered' && order.status !== 'cancelled' && onTrackPress && (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => onTrackPress(order)}
          >
            <Ionicons name="navigate-outline" size={14} color={colors.white} />
            <Text style={styles.trackText}>Track Order</Text>
          </TouchableOpacity>
        )}

        {(order.status === 'delivered' || order.status === 'cancelled') && (
          <View style={styles.detailsBtnRow}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  orderId: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: spacing.borderRadius.round,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  itemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: colors.background,
  },
  moreThumbnail: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  addressIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addressInfoCol: {
    flex: 1,
  },
  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  addressTypeBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addressTypeBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  addressText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  addressReceiverText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginTop: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.md,
    gap: 4,
  },
  trackText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  detailsBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginRight: 2,
  },
});
