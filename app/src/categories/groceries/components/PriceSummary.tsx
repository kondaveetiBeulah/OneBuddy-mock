import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PriceSummaryData } from '../types/cart.types';
import { useGroceryColors } from '../theme/colors';
import { typography, spacing } from '../theme';
import { formatCurrency } from '../utils/helpers';

interface PriceSummaryProps {
  summary: PriceSummaryData;
  showTitle?: boolean;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  summary,
  showTitle = true,
}) => {
  const colors = useGroceryColors();
  const { subtotal, discount, deliveryFee, tax, total, itemCount } = summary;

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
      {showTitle && <Text style={[styles.title, { color: colors.textPrimary }]}>Bill Details</Text>}

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Item Total ({itemCount} items)</Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{formatCurrency(subtotal)}</Text>
      </View>

      {discount > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Product Discount</Text>
          <Text style={[styles.value, { color: colors.success }]}>
            -{formatCurrency(discount)}
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Delivery Fee</Text>
        {deliveryFee === 0 ? (
          <Text style={[styles.value, { color: colors.success, fontWeight: typography.weights.bold }]}>FREE</Text>
        ) : (
          <Text style={[styles.value, { color: colors.textPrimary }]}>{formatCurrency(deliveryFee)}</Text>
        )}
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Taxes & Charges</Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{formatCurrency(tax)}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>To Pay</Text>
        <Text style={[styles.totalValue, { color: colors.primaryDark }]}>{formatCurrency(total)}</Text>
      </View>

      {discount > 0 && (
        <View style={[styles.savingsBanner, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.savingsText, { color: colors.primaryDark }]}>
            🎉 You are saving {formatCurrency(discount)} on this order!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.sm,
  },
  value: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  totalValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  savingsBanner: {
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  savingsText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
