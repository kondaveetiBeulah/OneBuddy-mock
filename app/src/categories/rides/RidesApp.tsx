import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from './components/BottomTabBar';
import ActiveTripBanner from './components/ActiveTripBanner';
import RideScreen from './screens/RideScreen';
import PreviousRidesScreen from './screens/PreviousRidesScreen';
import ProfileScreen from './screens/ProfileScreen';
import { TabKey } from './types';

// ── Error Boundary ──────────────────────────────────────────────────────────
type EBState = { hasError: boolean; error: string; stack: string };
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  EBState
> {
  state: EBState = { hasError: false, error: '', stack: '' };

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error: error.message, stack: error.stack ?? '' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={eb.container}>
          <ScrollView contentContainerStyle={eb.content}>
            <Text style={eb.title}>🚨 App Crashed</Text>
            <Text style={eb.label}>Error:</Text>
            <Text style={eb.msg}>{this.state.error}</Text>
            <Text style={eb.label}>Stack:</Text>
            <Text style={eb.stack}>{this.state.stack}</Text>
            <TouchableOpacity
              style={eb.btn}
              onPress={() => this.setState({ hasError: false, error: '', stack: '' })}
            >
              <Text style={eb.btnText}>Retry</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#dc2626', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#64748b', marginTop: 12 },
  msg: { fontSize: 14, color: '#0f172a', marginTop: 4 },
  stack: { fontSize: 11, color: '#475569', marginTop: 4, fontFamily: 'monospace' },
  btn: {
    marginTop: 24,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
// ────────────────────────────────────────────────────────────────────────────

import { useRideTheme } from './theme';

export interface RidesAppProps {
  onClose?: () => void;
  isDark?: boolean;
}

export default function RidesApp({ onClose, isDark: isDarkProp }: RidesAppProps) {
  const theme = useRideTheme();
  const isDark = isDarkProp ?? theme.isDark;

  const [activeTab, setActiveTab] = useState<TabKey>('ride');
  // Bumped every time we leave the Profile tab, so ProfileScreen resets to its list view.
  const [profileResetKey, setProfileResetKey] = useState(0);
  // Bumped whenever the Home tab is clicked so RideScreen returns to home page.
  const [homeResetKey, setHomeResetKey] = useState(0);
  // Global active trip in progress state
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [openTrackingTrigger, setOpenTrackingTrigger] = useState(0);

  const handleOpenActiveTrip = () => {
    setActiveTab('ride');
    setOpenTrackingTrigger((k) => k + 1);
  };

  const handleChangeTab = (tab: TabKey) => {
    if (tab === 'ride') {
      setHomeResetKey((k) => k + 1);
    }
    if (tab !== 'profile' && activeTab !== tab) {
      setProfileResetKey((k) => k + 1);
    }
    setActiveTab(tab);
  };

  // Handle back button at tab level: return to 'ride' tab if on previous or profile tab
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab !== 'ride') {
        setActiveTab('ride');
        setHomeResetKey((k) => k + 1);
        return true;
      }
      return false; // let RideScreen handle back navigation when on ride tab
    });
    return () => sub.remove();
  }, [activeTab]);

  // Show floating persistent notification banner across every page until cancelled
  const showBanner = !!activeTrip && (!isTrackingActive || activeTab !== 'ride');

  return (
    <ErrorBoundary>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? '#121214' : '#F8FCF7' },
        ]}
        edges={['bottom']}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? '#121214' : '#FFFFFF'}
        />

        {/* Floating Trip In Progress banner persistent across all pages */}
        {showBanner && (
          <ActiveTripBanner
            trip={activeTrip}
            onPress={handleOpenActiveTrip}
          />
        )}

        <View style={styles.screenArea}>
          {activeTab === 'ride' && (
            <RideScreen
              homeResetKey={homeResetKey}
              activeTrip={activeTrip}
              setActiveTrip={setActiveTrip}
              setIsTrackingActive={setIsTrackingActive}
              openTrackingTrigger={openTrackingTrigger}
              onExit={onClose}
              isDark={isDark}
            />
          )}
          {activeTab === 'previous' && <PreviousRidesScreen isDark={isDark} />}
          {activeTab === 'profile' && <ProfileScreen resetKey={profileResetKey} isDark={isDark} />}
        </View>

        <BottomTabBar activeTab={activeTab} onChange={handleChangeTab} isDark={isDark} />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FCF7', position: 'relative' },
  screenArea: { flex: 1 },
});
