import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CategoryTabs from './components/CategoryTabs';
import OrderSectionList from './components/OrderSectionList';
import ScreenHeader from './components/ScreenHeader';
import { ORDERS } from './data';
import { useGroupedOrders } from './hooks/useGroupedOrders';
import { useHideWebScrollbars } from './hooks/useHideWebScrollbars';
import { createStyles } from './styles';
import { useOrdersColors } from './theme';
import type { Filter, OrderCard } from './types';

export interface OrdersAndBookingsProps {
  orders?: OrderCard[];
  onClose?: () => void;
  onAction?: (actionLabel: string, order: OrderCard) => void;
}

export default function OrdersAndBookings({
  orders = ORDERS,
  onClose,
  onAction,
}: OrdersAndBookingsProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const { colors } = useOrdersColors();
  const styles = createStyles(colors);

  useHideWebScrollbars();

  const sections = useGroupedOrders(orders, filter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScreenHeader onClose={onClose} />
        <CategoryTabs filter={filter} onChange={setFilter} />
        <OrderSectionList sections={sections} onAction={onAction} />
      </View>
    </SafeAreaView>
  );
}
