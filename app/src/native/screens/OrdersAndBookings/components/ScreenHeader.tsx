import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { createStyles } from '../styles';
import { useOrdersColors } from '../theme';

interface ScreenHeaderProps {
  onClose?: () => void;
}

export default function ScreenHeader({ onClose }: ScreenHeaderProps) {
  const { colors } = useOrdersColors();
  const styles = createStyles(colors);
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders &amp; Bookings</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Text style={styles.iconBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>
        Track and manage everything across your OneBuddy services.
      </Text>
    </>
  );
}
