import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  InteractionManager,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';
import { applyCategoryTheme } from '@/theme/categoryThemeBridge';
import RidesApp from '../categories/rides/RidesApp';

interface RidesHostProps {
  visible: boolean;
  onClose: () => void;
}

function RidesLoadingScreen({ isDark }: { isDark: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.loadingContainer,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: isDark ? '#121214' : '#FFFFFF',
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: '#FFFFFF' }]}>
        <Image
          source={require('../categories/rides/assets/vehicles/car.png')}
          style={{ width: 64, height: 64 }}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.loadingTitle, isDark && { color: '#F1F1EC' }]}>
        One<Text style={{ color: '#54B713' }}>Buddy</Text> Rides
      </Text>
      <Text style={[styles.loadingSub, isDark && { color: '#9BA08F' }]}>
        Finding rides, drivers, and best fares...
      </Text>
      <ActivityIndicator size="small" color="#54B713" style={styles.loadingIndicator} />
    </View>
  );
}

export default function RidesHost({
  visible,
  onClose,
}: RidesHostProps): React.JSX.Element | null {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    applyCategoryTheme(scheme);
  }, [scheme]);

  // Synchronously apply theme before rendering screens
  applyCategoryTheme(scheme);

  useEffect(() => {
    if (!visible) {
      setIsReady(false);
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setIsReady(true);
      }, 100);
    });

    const fallbackTimer = setTimeout(() => setIsReady(true), 350);

    return () => {
      task.cancel();
      clearTimeout(fallbackTimer);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <View
      key={scheme}
      style={[
        styles.container,
        { backgroundColor: isDark ? '#121214' : '#FFFFFF' },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#121214' : '#FFFFFF'}
      />
      <SafeAreaProvider>
        {!isReady ? (
          <RidesLoadingScreen isDark={isDark} />
        ) : (
          <RidesApp onClose={onClose} isDark={isDark} />
        )}
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 8,
  },
});
