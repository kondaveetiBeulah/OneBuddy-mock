import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { LoadingState } from '../components/LoadingState';
import { orderService } from '../services/orderService';
import { Order } from '../types/order.types';
import { formatCurrency } from '../utils/helpers';
import FeedbackFormScreen from '../components/FeedbackFormScreen';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation.types';

type OrderConfirmationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrderConfirmation'>;
  route: RouteProp<RootStackParamList, 'OrderConfirmation'>;
};

export const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({
  navigation,
  route,
}) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (e) {
      console.error('Failed to load order', e);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueShopping = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleLiveTrackOrder = () => {
    if (!order) return;
    const formattedDeliveryAddress = order.deliveryAddress
      ? [
          order.deliveryAddress.houseNumber,
          order.deliveryAddress.street,
          order.deliveryAddress.area,
          order.deliveryAddress.city,
        ]
          .filter(Boolean)
          .join(', ')
      : 'Flat 402, Crescent Residency, Sector 16';

    const deliveryTitle = order.deliveryAddress?.name
      ? `${(order.deliveryAddress.type || 'Home').charAt(0).toUpperCase() + (order.deliveryAddress.type || 'Home').slice(1)} · ${order.deliveryAddress.name}`
      : 'Home · Ravi';

    navigation.navigate('LiveTracking', {
      orderId: order.id,
      storeName: 'OneBuddy Darkstore',
      storeAddress: 'Golf Course Rd, Sector 18',
      deliveryAddress: formattedDeliveryAddress,
      deliveryAddressLabel: deliveryTitle,
      items: order.items,
      totalAmount: order.total,
      order,
    });
  };

  if (loading || !order) {
    return <LoadingState message="Loading your order details..." />;
  }

  // When user taps "Rate & Give Feedback", show the Feedback form
  if (showFeedback) {
    return (
      <FeedbackFormScreen
        order={order}
        onBack={() => setShowFeedback(false)}
        onContinueShopping={handleContinueShopping}
        onComplete={handleContinueShopping}
      />
    );
  }

  // Default view: "Thank You for Your Order" Page
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Success Animated Badge */}
          <View style={styles.successBadgeWrapper}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={44} color={colors.white} />
            </View>
          </View>

          {/* Thank You Heading */}
          <Text style={styles.title}>Thank You for Your Order! 🎉</Text>
          <Text style={styles.subtitle}>
            Your order has been placed successfully and is being packed fresh at 1Buddy.
          </Text>

          {/* Order Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardLabel}>Order Number</Text>
                <Text style={styles.cardOrderId}>#{order.id}</Text>
              </View>
              <View style={styles.statusPill}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primaryDark} />
                <Text style={styles.statusPillText}>Confirmed</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Delivery & Payment Details */}
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Estimated Delivery</Text>
                <Text style={styles.infoValue}>{order.estimatedDelivery || 'Within 25-35 mins'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={styles.infoLabel}>Delivery Address</Text>
                  {order.deliveryAddress?.type && (
                    <View style={styles.addressTypePill}>
                      <Text style={styles.addressTypePillText}>{order.deliveryAddress.type.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.infoValue}>
                  {[
                    order.deliveryAddress?.houseNumber,
                    order.deliveryAddress?.street,
                    order.deliveryAddress?.area,
                    order.deliveryAddress?.city ? `${order.deliveryAddress.city} - ${order.deliveryAddress.pincode || ''}` : order.deliveryAddress?.pincode,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Selected Address'}
                </Text>
                {(order.deliveryAddress?.name || order.deliveryAddress?.phone) && (
                  <Text style={styles.infoReceiverText}>
                    Receiver: {order.deliveryAddress.name}{order.deliveryAddress.phone ? ` • +91 ${order.deliveryAddress.phone.replace('+91', '').trim()}` : ''}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="card-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Payment Mode</Text>
                <Text style={styles.infoValue}>
                  {order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ').toUpperCase() : 'PAID ONLINE'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Items Summary */}
            <Text style={styles.itemsHeading}>Items Purchased ({order.items?.length || 0})</Text>
            <View style={styles.itemsList}>
              {order.items?.map((item, idx) => (
                <View key={item.id || idx} style={styles.itemRow}>
                  {item.productImage ? (
                    <Image source={{ uri: item.productImage }} style={styles.itemImg} resizeMode="contain" />
                  ) : (
                    <View style={styles.itemImgPlaceholder}>
                      <Ionicons name="basket-outline" size={16} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text style={styles.itemMeta}>
                      Qty: {item.quantity} {item.unit ? `• ${item.unit}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    {formatCurrency((item.discountPrice || item.price) * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Total Row */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount Paid</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {/* Live Track Order Button */}
            <TouchableOpacity
              style={styles.liveTrackBtn}
              onPress={handleLiveTrackOrder}
              activeOpacity={0.88}
            >
              <Ionicons name="navigate-circle-outline" size={22} color={colors.white} />
              <Text style={styles.liveTrackBtnText}>Live Track Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 540,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  successBadgeWrapper: {
    marginTop: 8,
    marginBottom: 12,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    maxWidth: 320,
    lineHeight: 19,
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  cardOrderId: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: spacing.borderRadius.round,
    borderWidth: 1,
    borderColor: colors.primaryMedium,
  },
  statusPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginTop: 1,
    lineHeight: 18,
  },
  addressTypePill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primaryMedium,
  },
  addressTypePillText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  infoReceiverText: {
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginTop: 4,
  },
  itemsHeading: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  itemsList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemImg: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.background,
    flexShrink: 0,
  },
  itemImgPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  actionContainer: {
    width: '100%',
    gap: 12,
  },
  liveTrackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: spacing.borderRadius.md,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  liveTrackBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: typography.weights.bold,
  },
  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.borderRadius.md,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  feedbackBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: typography.weights.bold,
  },
  continueShoppingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 13,
    borderRadius: spacing.borderRadius.md,
    gap: 8,
    width: '100%',
  },
  continueShoppingText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: typography.weights.bold,
  },
});
