import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '@/context/NetworkContext';

export const OfflineBanner: React.FC = () => {
  const { isConnected, isChecking, checkConnection } = useNetwork();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setWasOffline(true);
      setShowRestored(false);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14,
      }).start();
    } else if (wasOffline) {
      // Just came back online!
      setShowRestored(true);
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -80,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          setShowRestored(false);
          setWasOffline(false);
        });
      }, 2200);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-80);
    }
  }, [isConnected, wasOffline, slideAnim]);

  if (isConnected && !showRestored) {
    return null;
  }

  const isRestored = isConnected && showRestored;

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          paddingTop: Math.max(insets.top, 8) + 6,
          backgroundColor: isRestored ? '#15803D' : '#DC2626',
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.contentRow}>
        <Ionicons
          name={isRestored ? 'checkmark-circle' : 'cloud-offline'}
          size={18}
          color="#FFFFFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.bannerText}>
          {isRestored
            ? 'Back online! Connection restored.'
            : 'No internet connection. Waiting for network...'}
        </Text>

        {!isRestored && (
          <TouchableOpacity
            style={styles.retryChip}
            onPress={() => checkConnection()}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.retryChipText}>Retry</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  retryChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryChipText: {
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
