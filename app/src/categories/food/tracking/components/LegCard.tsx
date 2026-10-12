import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import type { Leg, OrderItem } from '../data/tracking';
import { COLORS, FONTS, RADIUS } from '../theme';

interface LegCardProps {
  legs: Leg[];
  pickupDone: boolean;
  dropDone: boolean;
}

export function LegCard({ legs, pickupDone, dropDone }: LegCardProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {legs.map((leg, i) => {
        const done = i === 0 ? pickupDone : dropDone;
        const isDrop = i === 1;
        return (
          <View key={leg.kind} style={[styles.row, i > 0 && styles.rowDivided]}>
            <View style={styles.pin}>
              <Icon name="pin" size={19} color={i === 0 ? '#E25822' : '#25781B'} strokeWidth={2} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.tag}>{leg.kind.toUpperCase()}</Text>
              <Text style={styles.title} numberOfLines={1}>
                {leg.name}
              </Text>
              <Text style={styles.subtitle}>{leg.address}</Text>
            </View>
            <Text style={[styles.stamp, isDrop && styles.stampGreen]}>
              {done ? leg.doneStamp : leg.pendingStamp}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

interface OrderItemsCardProps {
  items: OrderItem[];
}

export function OrderItemsCard({ items }: OrderItemsCardProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {items.map((item, i) => (
        <View key={item.name} style={[styles.row, i > 0 && styles.rowDivided]}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {item.qty} × {item.name}
            </Text>
            {item.note ? <Text style={styles.subtitle}>{item.note}</Text> : null}
          </View>
          <Text style={styles.stamp}>{item.price}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  rowDivided: { borderTopWidth: 1, borderTopColor: COLORS.line },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSubtle,
  },
  textContainer: { flex: 1, minWidth: 0 },
  tag: { color: '#25781B', fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, fontFamily: FONTS.body },
  title: { color: COLORS.ink, fontSize: 14, fontWeight: '700', marginTop: 1, fontFamily: FONTS.body },
  subtitle: { color: COLORS.mistDim, fontSize: 12, marginTop: 2, fontFamily: FONTS.body },
  stamp: { color: COLORS.ink, fontSize: 12, fontWeight: '600', fontFamily: FONTS.body },
  stampGreen: { color: '#25781B', fontWeight: '700' },
});
