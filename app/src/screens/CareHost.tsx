import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  InteractionManager,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';
import { applyCategoryTheme } from '@/theme/categoryThemeBridge';
import CareHomeScreen from '../categories/care/components/HomeScreen';
import HospitalOpLogo from '../categories/care/components/HospitalOpLogo';
import { CareExitContext } from '../categories/care/context/CareExitContext';
import { initFpsPerformance } from '../categories/care/utils/fpsManager';

interface CareHostProps {
  visible: boolean;
  onClose: () => void;
}

function CareLoadingScreen({ isDark }: { isDark: boolean }) {
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
        <HospitalOpLogo width={48} height={48} />
      </View>
      <Text style={[styles.loadingTitle, isDark && { color: '#F1F1EC' }]}>
        One<Text style={{ color: '#65A30D' }}>Buddy</Text> Care
      </Text>
      <Text style={[styles.loadingSub, isDark && { color: '#9BA08F' }]}>
        Loading hospitals, doctors, and medicines...
      </Text>
      <ActivityIndicator size="small" color="#65A30D" style={styles.loadingIndicator} />
    </View>
  );
}

export default function CareHost({
  visible,
  onClose,
}: CareHostProps): React.JSX.Element | null {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    applyCategoryTheme(scheme);
  }, [scheme]);

  useEffect(() => {
    initFpsPerformance();
  }, []);

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
        { backgroundColor: isDark ? '#121214' : '#F8FAFC' },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#121214' : '#FFFFFF'}
      />
      <SafeAreaProvider>
        {!isReady ? (
          <CareLoadingScreen isDark={isDark} />
        ) : (
          <CareExitContext.Provider value={{ onClose }}>
            <CareHomeScreen onClose={onClose} />
          </CareExitContext.Provider>
        )}
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F7FEE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D5EBD1',
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
