import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { createStyles } from '../styles';
import { CATEGORY_TINT, useOrdersColors } from '../theme';
import type { OrderCard } from '../types';

interface OrderRowProps {
  order: OrderCard;
  onAction?: (actionLabel: string, order: OrderCard) => void;
}

export default function OrderRow({ order, onAction }: OrderRowProps) {
  const { colors, badgeColor } = useOrdersColors();
  const styles = createStyles(colors);
  const tint = CATEGORY_TINT[order.category];
  const badge = badgeColor[order.statusKind];

  return (
    <View style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: tint.bg }]}>
        <Text style={styles.cardIconText}>{order.icon}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {order.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.fg }]}>
              {order.status}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSub}>{order.subtitle}</Text>
        <View style={styles.cardActions}>
          {order.actions.map((action) => (
            <TouchableOpacity
              key={action}
              style={styles.actionBtn}
              onPress={() => onAction?.(action, order)}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
