import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import type { DriverProfile, Stage } from '../types/tracking';
import { COLORS, FONTS, RADIUS } from '../theme';

interface RiderCardProps {
  driver?: DriverProfile;
  stage?: Stage;
  onCall: () => void;
  onChat: () => void;
}

export function RiderCard({ driver, stage, onCall, onChat }: RiderCardProps): React.JSX.Element {
  // If driver profile is provided, use its rich data; otherwise fallback to stage values
  const name = driver?.name ?? stage?.riderName ?? 'Imran Q.';
  const avatar = driver?.avatar ?? stage?.avatar ?? 'IQ';
  const subText = driver?.vehiclePlate
    ? `${driver.rating ?? 4.9} rating · ${driver.vehiclePlate}`
    : stage?.riderMeta ?? '4.9 rating · TS 09 EK 4412';
  const isSearching = stage?.searching ?? false;

  return (
    <View style={styles.rider}>
      <View style={[styles.avatar, isSearching && styles.avatarSearching]}>
        <Text style={styles.avatarText}>{avatar}</Text>
      </View>

      <View style={styles.riderText}>
        <Text style={styles.riderName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.riderMeta} numberOfLines={1}>
          {subText}
        </Text>
      </View>

      <View style={styles.riderActions}>
        <Pressable
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={`Call ${name}`}
          onPress={onCall}
        >
          <Icon name="phone" size={17} color="#25781B" strokeWidth={2.2} />
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={`Message ${name}`}
          onPress={onChat}
        >
          <Icon name="chat" size={17} color="#25781B" strokeWidth={2.2} />
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
    backgroundColor: '#F8FCF7',
    borderWidth: 1,
    borderColor: '#DDF0D8',
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EDF8EA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A8D99E',
    borderStyle: 'dashed',
  },
  avatarSearching: { backgroundColor: '#EDF2EC', borderColor: '#D7E2D5' },
  avatarText: {
    color: '#25781B',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
  riderText: {
    flex: 1,
    minWidth: 0,
  },
  riderName: {
    color: COLORS.ink,
    fontSize: 15.5,
    fontWeight: '700',
    fontFamily: FONTS.display,
  },
  riderMeta: {
    color: '#6B7A68',
    fontSize: 12.5,
    marginTop: 3,
    fontWeight: '500',
    fontFamily: FONTS.body,
  },
  riderActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7E4',
    borderWidth: 1,
    borderColor: '#CCE7C6',
  },
});
