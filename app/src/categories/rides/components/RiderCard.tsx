import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import type { DriverProfile } from '../types/tracking';
import type { Stage } from '../tracking/engine';
import { COLORS, FONTS, RADIUS } from '../theme';

interface RiderCardProps {
  driver?: DriverProfile;
  stage?: Stage;
  onCall: () => void;
  onChat: () => void;
}

export function RiderCard({ driver, stage, onCall, onChat }: RiderCardProps): React.JSX.Element {
  // If driver profile is provided, use its rich data; otherwise fallback to stage values
  const name = driver?.name ?? stage?.riderName ?? 'Imran Khan';
  const avatar = driver?.avatar ?? stage?.avatar ?? 'IK';
  const vehicleText = driver
    ? `${driver.vehicleModel} · ${driver.vehiclePlate}`
    : stage?.riderMeta ?? 'Electric scooter · TS 09 EA 4412';
  const ratingText = driver?.rating ? `★ ${driver.rating.toFixed(1)}` : '★ 4.9';
  const deliveriesText = driver?.completedDeliveries ? `(${driver.completedDeliveries}+ orders)` : '(1.2k+ orders)';
  const isSearching = stage?.searching ?? false;

  return (
    <View style={styles.rider}>
      <View style={[styles.avatar, isSearching && styles.avatarSearching]}>
        <Text style={styles.avatarText}>{avatar}</Text>
        {!isSearching && (
          <View style={styles.badgeCheck}>
            <Text style={styles.badgeCheckText}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.riderText}>
        <View style={styles.nameRow}>
          <Text style={styles.riderName} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingText}>{ratingText}</Text>
            <Text style={styles.ratingSub}>{deliveriesText}</Text>
          </View>
        </View>
        <Text style={styles.vehicleInfo} numberOfLines={1}>
          {vehicleText}
        </Text>
      </View>

      <View style={styles.riderActions}>
        <Pressable
          style={[styles.actionBtn, styles.callBtn]}
          accessibilityRole="button"
          accessibilityLabel={`Call ${name}`}
          onPress={onCall}
        >
          <Icon name="phone" size={16} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.chatBtn]}
          accessibilityRole="button"
          accessibilityLabel={`Message ${name}`}
          onPress={onChat}
        >
          <Icon name="chat" size={16} color={COLORS.primary} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F8FBF7',
    borderWidth: 1,
    borderColor: '#E2EBE0',
    marginBottom: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(84,183,19,0.3)',
    position: 'relative',
  },
  avatarSearching: { backgroundColor: '#EDF2EC', borderColor: '#D7E2D5' },
  avatarText: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
  badgeCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeCheckText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  riderText: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  riderName: {
    color: COLORS.ink,
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: FONTS.display,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E67E22',
    fontFamily: FONTS.display,
  },
  ratingSub: {
    fontSize: 11,
    color: COLORS.mistDim,
    fontFamily: FONTS.body,
  },
  vehicleInfo: {
    color: COLORS.mistDim,
    fontSize: 12,
    marginTop: 3,
    fontFamily: FONTS.body,
  },
  riderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chatBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8DA',
  },
});
