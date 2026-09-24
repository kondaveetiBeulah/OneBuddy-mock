import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ActiveTripBannerProps {
  trip: any;
  onPress: () => void;
}

export const ActiveTripBanner: React.FC<ActiveTripBannerProps> = ({ trip, onPress }) => {
  const insets = useSafeAreaInsets();
  if (!trip) return null;

  const pickupTitle = trip.pickup?.title || trip.pickupSpotName || 'Pickup';
  const destTitle = trip.destination || trip.dropSpotName || 'Destination';

  return (
    <TouchableOpacity
      style={[
        styles.floatingTripBanner,
        { top: Math.max(insets.top, 6) + 4 },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.floatingTripLeft}>
        <View style={styles.tripLiveDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.floatingTripTitle}>Trip in progress • OneBuddy LIVE</Text>
          <Text style={styles.floatingTripSub} numberOfLines={1}>
            {pickupTitle} → {destTitle}
          </Text>
        </View>
      </View>
      <View style={styles.floatingTripBtn}>
        <Text style={styles.floatingTripBtnText}>Go to your trip</Text>
        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingTripBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  floatingTripLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 10,
  },
  tripLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#54B713',
  },
  floatingTripTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  floatingTripSub: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  floatingTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#54B713',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
  },
  floatingTripBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default ActiveTripBanner;
