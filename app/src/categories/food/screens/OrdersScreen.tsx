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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headIcon}>
          <ClipboardList size={18} color="#65A30D" />
        </View>
        <View>
          <Text style={styles.title}>Your Orders & Tracking</Text>
          <Text style={styles.subtitle}>Track live deliveries and re-order</Text>
        </View>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
          <Text style={styles.emptyTitle}>No Orders Placed Yet</Text>
          <Text style={styles.emptyDesc}>
            Discover delicious dishes from our 6 partner restaurants and order now!
          </Text>
          <TouchableOpacity onPress={onNavigateHome} style={styles.exploreBtn}>
            <Text style={styles.exploreText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.ordersList}>
          {orders.map((order, idx) => {
            const isLive = idx === 0;
            return (
              <View
                key={order.orderId}
                style={[
                  styles.orderCard,
                  isLive && styles.liveOrderCard,
                ]}
              >
                {/* Restaurant Head */}
                <View style={styles.orderHead}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.restName}>{order.restaurant.name}</Text>
                      {isLive ? (
                        <View style={styles.liveBadge}>
                          <Text style={styles.liveBadgeText}>LIVE ORDER</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.orderMeta}>
                      Order #{order.orderId} • {order.placedAt}
                    </Text>
                  </View>

                  <Text style={styles.orderTotal}>₹{order.finalTotal}</Text>
                </View>

                {/* Live Status Tracker */}
                {isLive ? (
                  <View style={styles.liveBanner}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Bike size={16} color="#0284C7" />
                      <View>
                        <Text style={styles.liveBannerTitle}>Rider on the Way</Text>
                        <Text style={styles.liveBannerSub}>Arriving in ~{order.estimatedDelivery}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color="#34D399" />
                      <Text style={styles.liveTime}>On Time</Text>
                    </View>
                  </View>
                ) : null}

                {/* Items */}
                <View style={styles.itemsList}>
                  {order.items.map((i) => (
                    <View key={i.item.id} style={styles.itemRow}>
                      <Text style={styles.itemText}>{i.quantity}x {i.item.name}</Text>
                      <Text style={styles.itemPrice}>₹{i.item.price * i.quantity}</Text>
                    </View>
                  ))}
                </View>

                {/* Footer Address & Reorder */}
                <View style={styles.orderFooter}>
                  <View style={styles.addressRow}>
                    <MapPin size={12} color="#65A30D" />
                    <Text style={styles.addressText} numberOfLines={1}>{order.deliveryAddress}</Text>
                  </View>

                  <TouchableOpacity onPress={() => handleReorder(order.orderId)} style={styles.reorderBtn}>
                    <RotateCw size={12} color="#4D7C0F" />
                    <Text style={styles.reorderText}>Re-Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
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


