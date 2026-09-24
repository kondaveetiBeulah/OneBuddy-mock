import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { webNoScrollbar } from '../hooks/useHideWebScrollbars';
import { createStyles } from '../styles';
import { useOrdersColors } from '../theme';
import type { OrderCard, OrderSection } from '../types';
import OrderRow from './OrderRow';

interface OrderSectionListProps {
  sections: OrderSection[];
  onAction?: (actionLabel: string, order: OrderCard) => void;
}

export default function OrderSectionList({
  sections,
  onAction,
}: OrderSectionListProps) {
  const { colors } = useOrdersColors();
  const styles = createStyles(colors);
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
      {...webNoScrollbar}
    >
      {sections.length === 0 ? (
        <Text style={styles.emptyMsg}>
          No orders or bookings in this category yet.
        </Text>
      ) : (
        sections.map(({ group, items }) => (
          <View key={group}>
            <Text style={styles.sectionLabel}>{group.toUpperCase()}</Text>
            <View style={styles.list}>
              {items.map((order) => (
                <OrderRow key={order.id} order={order} onAction={onAction} />
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
