import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useCart } from '../context/CartContext';
import {
  ClipboardList,
  Clock,
  MapPin,
  Bike,
  RotateCw,
} from 'lucide-react-native';
import { useFoodData } from '../context/FoodDataContext';
import { LinearGradient } from 'expo-linear-gradient';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

interface OrdersScreenProps {
  onSelectRestaurant: (restaurantId: string) => void;
  onNavigateHome: () => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  onSelectRestaurant,
  onNavigateHome,
}) => {
  const { orders, addToCart } = useCart();
  const { restaurants } = useFoodData();
  const isDark = isCategoryDark();

  const handleReorder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.orderId === orderId);
    if (!targetOrder) return;

    const rest = restaurants.find((r) => r.id === targetOrder.restaurant.id) || targetOrder.restaurant;

    targetOrder.items.forEach((ci) => {
      addToCart(ci.item, rest, ci.quantity);
    });

    onSelectRestaurant(rest.id);
  };

  return (
    <ScrollView style={[styles.container, isDark && { backgroundColor: '#000000' }]} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, isDark && { color: '#FFFFFF' }]}>Your Orders & Tracking</Text>
          <Text style={[styles.subtitle, isDark && { color: '#E5E7EB' }]}>Track live deliveries and re-order</Text>
        </View>
      </View>

      <View style={[styles.emptyCard, isDark && { backgroundColor: '#000000', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
        <Text style={[styles.emptyTitle, isDark && { color: '#FFFFFF' }]}>No orders found</Text>
        <Text style={[styles.emptyDesc, isDark && { color: '#E5E7EB' }]}>
          Discover delicious dishes from our 6 partner restaurants and order now!
        </Text>
        <TouchableOpacity onPress={onNavigateHome} style={[styles.exploreBtn, isDark && { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.exploreText, isDark && { color: '#000000' }]}>Browse Restaurants</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  headIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(101, 163, 13, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreBtn: {
    backgroundColor: '#65A30D',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  ordersList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 10,
  },
  liveOrderCard: {
    borderColor: '#65A30D',
    backgroundColor: '#F7FEE7',
  },
  orderHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  liveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  liveBadgeText: {
    color: '#059669',
    fontSize: 8,
    fontWeight: 'bold',
  },
  orderMeta: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4D7C0F',
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
  },
  liveBannerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
  },
  liveBannerSub: {
    fontSize: 9,
    color: '#6B7280',
  },
  liveTime: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 8,
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize: 11,
    color: '#4B5563',
  },
  itemPrice: {
    fontSize: 11,
    color: '#4D7C0F',
    fontFamily: 'monospace',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  addressText: {
    fontSize: 10,
    color: '#6B7280',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  reorderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4D7C0F',
  },
});


