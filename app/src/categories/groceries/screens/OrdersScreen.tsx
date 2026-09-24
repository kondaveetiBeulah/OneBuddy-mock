import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import { Header } from '../components/Header';
import { OrderCard } from '../components/OrderCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { orderService } from '../services/orderService';
import { Order } from '../types/order.types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

export const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getOrders();
      if (data) setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Orders" showBack onBack={() => navigation.goBack()} />

      {loading && orders.length === 0 ? (
        <LoadingState message="Loading your orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          iconName="receipt-outline"
          title="No Orders Placed Yet"
          message="When you order fresh groceries from 1Buddy, your order history will appear here."
          buttonTitle="Start Shopping"
          onButtonPress={() => navigation.navigate('Main')}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={(o) => navigation.navigate('OrderDetails', { orderId: o.id })}
              onTrackPress={(o) =>
                navigation.navigate('OrderDetails', { orderId: o.id })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listPadding: {
    padding: spacing.md,
  },
});
