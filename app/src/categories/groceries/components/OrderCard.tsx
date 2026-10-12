import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderStatus } from '../types/order.types';
import { colors, typography, spacing } from '../theme';
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
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
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);
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
      style={dynStyles.container}
      onPress={() => onPress(order)}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={dynStyles.header}>
        <View>
          <Text style={dynStyles.orderId}>{order.id}</Text>
          <Text style={dynStyles.dateText}>{formatDate(order.createdAt)}</Text>
        </View>

        <View style={[dynStyles.statusBadge, { backgroundColor: isDark ? statusColor + '33' : statusColor + '1A' }]}>
          <View style={[dynStyles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[dynStyles.statusText, { color: isDark ? '#FFFFFF' : statusColor }]}>
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>

      {/* Items Preview */}
      <View style={dynStyles.itemsPreview}>
        {firstThreeItems.map((item) => (
          <Image
            key={item.id}
            source={{ uri: item.productImage }}
            style={dynStyles.thumbnail}
          />
        ))}
        {remainingCount > 0 && (
          <View style={dynStyles.moreThumbnail}>
            <Text style={dynStyles.moreText}>+{remainingCount}</Text>
          </View>
        )}
      </View>

      {/* Delivery Address Section on Specific Order */}
      {addr && (
        <View style={dynStyles.addressBox}>
          <View style={dynStyles.addressIconWrap}>
            <Ionicons name="location-sharp" size={14} color={isDark ? '#FFFFFF' : colors.primary} />
          </View>
          <View style={dynStyles.addressInfoCol}>
            <View style={dynStyles.addressTopRow}>
              <Text style={dynStyles.addressLabel}>DELIVERY ADDRESS</Text>
              {addr.type && (
                <View style={dynStyles.addressTypeBadge}>
                  <Text style={dynStyles.addressTypeBadgeText}>
                    {addr.type.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={dynStyles.addressText} numberOfLines={2}>
              {addressFormatted || 'Delivery Address'}
            </Text>
            {(addr.name || addr.phone) && (
              <Text style={dynStyles.addressReceiverText}>
                {addr.name}{addr.phone ? ` • +91 ${addr.phone.replace('+91', '').trim()}` : ''}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={dynStyles.footer}>
        <View>
          <Text style={dynStyles.totalLabel}>
            {order.items.reduce((s, i) => s + i.quantity, 0)} Items
          </Text>
          <Text style={dynStyles.totalValue}>{formatCurrency(order.total)}</Text>
        </View>

        {order.status !== 'delivered' && order.status !== 'cancelled' && onTrackPress && (
          <TouchableOpacity
            style={dynStyles.trackButton}
            onPress={() => onTrackPress(order)}
          >
            <Ionicons name="navigate-outline" size={14} color={isDark ? '#000000' : colors.white} />
            <Text style={dynStyles.trackText}>Track Order</Text>
          </TouchableOpacity>
        )}

        {(order.status === 'delivered' || order.status === 'cancelled') && (
          <View style={dynStyles.detailsBtnRow}>
            <Text style={dynStyles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#FFFFFF' : colors.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDark ? '#000000' : colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
    shadowColor: isDark ? '#FFFFFF' : colors.black,
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
    borderBottomColor: isDark ? 'rgba(255,255,255,0.12)' : colors.borderLight,
  },
  orderId: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.textMuted,
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
    backgroundColor: isDark ? '#000000' : colors.background,
  },
  moreThumbnail: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: isDark ? 'rgba(95,163,0,0.2)' : colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.primaryDark,
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#000000' : colors.background,
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  addressIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.primaryLight,
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
    color: isDark ? '#E5E7EB' : colors.textMuted,
    letterSpacing: 0.5,
  },
  addressTypeBadge: {
    backgroundColor: isDark ? '#000000' : colors.white,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  addressTypeBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.primaryDark,
  },
  addressText: {
    fontSize: 12,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    lineHeight: 16,
  },
  addressReceiverText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: isDark ? '#E5E7EB' : colors.textSecondary,
    marginTop: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.12)' : colors.borderLight,
  },
  totalLabel: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.textMuted,
  },
  totalValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#FFFFFF' : colors.primary,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.md,
    gap: 4,
  },
  trackText: {
    color: isDark ? '#000000' : colors.white,
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
    color: isDark ? '#FFFFFF' : colors.primary,
    marginRight: 2,
  },
});
