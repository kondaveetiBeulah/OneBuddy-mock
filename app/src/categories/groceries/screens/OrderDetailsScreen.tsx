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
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { Header } from '../components/Header';
import { LoadingState } from '../components/LoadingState';
import { PriceSummary } from '../components/PriceSummary';
import { CustomButton } from '../components/CustomButton';
import { orderService } from '../services/orderService';
import { Order } from '../types/order.types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation.types';

type OrderDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrderDetails'>;
  route: RouteProp<RootStackParamList, 'OrderDetails'>;
};

export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !order) {
    return <LoadingState message="Loading order details..." />;
  }

  return (
    <SafeAreaView style={dynStyles.container}>
      <Header
        title={`Order ${order.id}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={dynStyles.scrollPadding}>
        {/* Status Summary Banner */}
        <View style={dynStyles.statusBanner}>
          <View style={dynStyles.statusLeft}>
            <Text style={dynStyles.statusTitle}>
              Status: {order.status.replace(/_/g, ' ').toUpperCase()}
            </Text>
            <Text style={dynStyles.statusDate}>
              Ordered on {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Itemized Products */}
        <Text style={dynStyles.sectionHeaderTitle}>Items Ordered ({order.items.length})</Text>
        <View style={dynStyles.itemsCard}>
          {order.items.map((item) => (
            <View key={item.id} style={dynStyles.itemRow}>
              <Image source={{ uri: item.productImage }} style={dynStyles.productImg} />
              <View style={dynStyles.productDetails}>
                <Text style={dynStyles.productName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={dynStyles.productMeta}>
                  {item.unit} × {item.quantity}
                </Text>
              </View>
              <Text style={dynStyles.productPrice}>
                {formatCurrency(item.discountPrice * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <PriceSummary
          summary={{
            subtotal: order.subtotal,
            discount: order.discount,
            deliveryFee: order.deliveryFee,
            tax: order.tax,
            total: order.total,
            itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
          }}
        />

        {/* Delivery Address */}
        <Text style={dynStyles.sectionHeaderTitle}>Delivery Address</Text>
        <View style={dynStyles.infoBox}>
          <Text style={dynStyles.infoName}>{order.deliveryAddress.name}</Text>
          <Text style={dynStyles.infoText}>
            {order.deliveryAddress.houseNumber}, {order.deliveryAddress.street},{' '}
            {order.deliveryAddress.area}
          </Text>
          <Text style={dynStyles.infoText}>
            {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
            {order.deliveryAddress.pincode}
          </Text>
          <Text style={dynStyles.infoPhone}>Phone: {order.deliveryAddress.phone}</Text>
        </View>

        {/* Payment & Delivery Slot Info */}
        <Text style={dynStyles.sectionHeaderTitle}>Payment & Delivery Info</Text>
        <View style={dynStyles.infoBox}>
          <View style={dynStyles.infoRow}>
            <Text style={dynStyles.infoLabel}>Payment Method</Text>
            <Text style={dynStyles.infoVal}>
              {order.paymentMethod.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
          <View style={dynStyles.infoRow}>
            <Text style={dynStyles.infoLabel}>Payment Status</Text>
            <Text style={dynStyles.infoVal}>{order.paymentStatus.toUpperCase()}</Text>
          </View>
          <View style={dynStyles.infoRow}>
            <Text style={dynStyles.infoLabel}>Delivery Slot</Text>
            <Text style={dynStyles.infoVal}>
              {order.deliverySlot.date}, {order.deliverySlot.startTime} -{' '}
              {order.deliverySlot.endTime}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : colors.background,
  },
  scrollPadding: {
    padding: spacing.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(95,163,0,0.2)' : colors.primaryLight,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? '#5FA300' : 'transparent',
  },
  statusLeft: {
    flex: 1,
  },
  statusTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.primaryDark,
  },
  statusDate: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.textMuted,
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  itemsCard: {
    backgroundColor: isDark ? '#000000' : colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.12)' : colors.borderLight,
  },
  productImg: {
    width: 48,
    height: 48,
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: isDark ? '#000000' : colors.background,
  },
  productDetails: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  productName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
  productMeta: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.textMuted,
    marginTop: 2,
  },
  productPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.primaryDark,
  },
  infoBox: {
    backgroundColor: isDark ? '#000000' : colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  infoName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
  infoText: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.textSecondary,
    marginTop: 2,
  },
  infoPhone: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.textMuted,
  },
  infoVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
});
