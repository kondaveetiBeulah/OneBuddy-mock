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
    <SafeAreaView style={styles.container}>
      <Header
        title={`Order ${order.id}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        {/* Status Summary Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusLeft}>
            <Text style={styles.statusTitle}>
              Status: {order.status.replace(/_/g, ' ').toUpperCase()}
            </Text>
            <Text style={styles.statusDate}>
              Ordered on {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Itemized Products */}
        <Text style={styles.sectionHeaderTitle}>Items Ordered ({order.items.length})</Text>
        <View style={styles.itemsCard}>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Image source={{ uri: item.productImage }} style={styles.productImg} />
              <View style={styles.productDetails}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.productMeta}>
                  {item.unit} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.productPrice}>
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
        <Text style={styles.sectionHeaderTitle}>Delivery Address</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoName}>{order.deliveryAddress.name}</Text>
          <Text style={styles.infoText}>
            {order.deliveryAddress.houseNumber}, {order.deliveryAddress.street},{' '}
            {order.deliveryAddress.area}
          </Text>
          <Text style={styles.infoText}>
            {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
            {order.deliveryAddress.pincode}
          </Text>
          <Text style={styles.infoPhone}>Phone: {order.deliveryAddress.phone}</Text>
        </View>

        {/* Payment & Delivery Slot Info */}
        <Text style={styles.sectionHeaderTitle}>Payment & Delivery Info</Text>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoVal}>
              {order.paymentMethod.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Status</Text>
            <Text style={styles.infoVal}>{order.paymentStatus.toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Slot</Text>
            <Text style={styles.infoVal}>
              {order.deliverySlot.date}, {order.deliverySlot.startTime} -{' '}
              {order.deliverySlot.endTime}
            </Text>
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
  scrollPadding: {
    padding: spacing.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.md,
  },
  statusLeft: {
    flex: 1,
  },
  statusTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  statusDate: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  itemsCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  productImg: {
    width: 48,
    height: 48,
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: colors.background,
  },
  productDetails: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  productName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  productMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  productPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  infoBox: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoPhone: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  infoVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
});
