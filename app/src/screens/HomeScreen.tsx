import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  ChevronDown,
  MapPin,
  Moon,
  Settings as SettingsIcon,
  Sun,
} from 'lucide-react-native';

import Sidebar, { type SidebarItem } from '@/components/Sidebar';
import CategoryCard from '@/components/CategoryCard';
import ServiceTimeline from '@/components/ServiceTimeline';
import BuddyAvatar from '@/components/BuddyAvatar';
import EditProfileSheet from '@/components/EditProfileSheet';
import SettingsSheet from '@/components/SettingsSheet';
import NotificationsModal, {
  INITIAL_ALERTS,
  type AlertNotification,
} from '@/components/NotificationsModal';
import { BRAND_IMAGES, SERVICES, brand, schemes } from '@/design/tokens';
import { useAppTheme } from '@/theme/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/context/ToastContext';
import { SERVICE_ROUTE, type RootStackParamList } from '@/navigation/types';
import { useDynamicRefreshRate } from '@/utils/useDynamicRefreshRate';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CYCLE_MS = 2500;
const CYCLE_START_DELAY_MS = 3000;
const BRAND_GREEN = '#65B200';

export default function HomeScreen() {
  const { scheme } = useAppTheme();
  const tokens = schemes[scheme];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { state, setTheme, trackServiceUsage } = useSettings();
  const { profile } = useProfile();
  const { showToast } = useToast();
  const { triggerBoost } = useDynamicRefreshRate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  // Flip animation cycle starting strictly from Food (index 0)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stepIndex = 0; // 0 to 4 (Food to Care)
    let phase = 1; // 1 = flip to photo back, 2 = unflip to 3D front

    function runStep() {
      const service = SERVICES[stepIndex];
      setActiveIndex(stepIndex);
      triggerBoost(1200);

      if (phase === 1) {
        // Flip to photo back side
        setFlippedCards((prev) => ({ ...prev, [service.id]: true }));
        stepIndex++;
        if (stepIndex >= SERVICES.length) {
          phase = 2;
          stepIndex = 0;
          timer = setTimeout(runStep, 2200);
          return;
        }
      } else {
        // Flip back to 3D gradient front side
        setFlippedCards((prev) => ({ ...prev, [service.id]: false }));
        stepIndex++;
        if (stepIndex >= SERVICES.length) {
          phase = 1;
          stepIndex = 0;
          timer = setTimeout(runStep, 2200);
          return;
        }
      }

      timer = setTimeout(runStep, 1500);
    }

    // Initial pause of 1s before starting from Food (index 0)
    timer = setTimeout(runStep, 1000);

    return () => clearTimeout(timer);
  }, [triggerBoost]);

  const toggleCardFlip = useCallback((serviceId: string) => {
    triggerBoost(1200);
    setFlippedCards((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  }, [triggerBoost]);

  const handleSelectTimeline = useCallback((index: number) => {
    triggerBoost(1200);
    setActiveIndex(index);
    const serviceId = SERVICES[index].id;
    setFlippedCards((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  }, [triggerBoost]);

  const openService = useCallback(
    (index: number) => {
      const service = SERVICES[index];
      trackServiceUsage(service.label);
      const route = SERVICE_ROUTE[service.id];
      if (route) {
        navigation.navigate(route as never);
      } else {
        showToast(`${service.label} services launching soon!`);
      }
    },
    [navigation, showToast, trackServiceUsage]
  );

  const toggleTheme = useCallback(() => {
    setTheme(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setTheme]);

  const copyCouponCode = useCallback(async () => {
    await Clipboard.setStringAsync('BUDDY50');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, []);

  const sidebarItems = useMemo<readonly SidebarItem[]>(
    () => [
      {
        icon: '⚙️',
        label: 'Settings',
        onPress: () => {
          setSidebarOpen(false);
          setTimeout(() => setSettingsOpen(true), 250);
        },
      },
      { icon: '❓', label: "FAQ's", onPress: () => go('HelpSupport') },
      { icon: '💬', label: 'Chat Support', onPress: () => go('HelpSupport') },
      { icon: '📝', label: 'Send a Query', onPress: () => go('HelpSupport') },
      { icon: '📋', label: 'My Orders', onPress: () => go('OrdersAndBookings') },
      { icon: '📍', label: 'Addresses', onPress: () => go('Addresses') },
      { icon: '💳', label: 'Payments', onPress: () => go('Payments') },
      { icon: '⭐', label: 'About OneBuddy', onPress: () => go('About') },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function go(route: keyof RootStackParamList) {
    setSidebarOpen(false);
    setTimeout(() => navigation.navigate(route as never), 260);
  }

  const isDark = scheme === 'dark';

  return (
    <View style={[styles.root, { backgroundColor: isDark ? tokens.bgDeep : '#F8FAF5' }]}>
      {/* Top Header */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: isDark ? tokens.surface1 : '#FFFFFF',
            borderBottomColor: isDark ? tokens.ink(0.08) : 'rgba(0,0,0,0.04)',
          },
        ]}
      >
        {/* Left Mascot Avatar */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit your profile"
          onPress={() => setEditProfileOpen(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [
            styles.avatarButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <BuddyAvatar
            size={42}
            styleId={profile.style}
            color={profile.color}
            borderRadius={14}
          />
        </Pressable>

        {/* Center Wordmark with Logo */}
        <View style={styles.brandRow}>
          <View style={[styles.brandMarkBadge, { backgroundColor: '#FFFFFF' }]}>
            <Image
              source={BRAND_IMAGES.mark}
              style={styles.brandMark}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.wordmark, { color: tokens.text }]}>
            One<Text style={{ color: BRAND_GREEN }}>Buddy</Text>
          </Text>
        </View>

        {/* Right Header Action Buttons */}
        <View style={styles.actions}>
          <HeaderActionButton
            label="Notifications"
            onPress={() => setNotificationsOpen(true)}
            isDark={isDark}
            tokens={tokens}
          >
            <Bell size={18} color={tokens.text} strokeWidth={2} />
            {alerts.some((a) => !a.read) && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: BRAND_GREEN,
                }}
              />
            )}
          </HeaderActionButton>

          <HeaderActionButton
            label="Switch theme"
            onPress={toggleTheme}
            isDark={isDark}
            tokens={tokens}
          >
            {isDark ? (
              <Moon size={18} color={tokens.text} strokeWidth={2} />
            ) : (
              <Sun size={18} color={tokens.text} strokeWidth={2} />
            )}
          </HeaderActionButton>

          <HeaderActionButton
            label="Settings"
            onPress={() => setSettingsOpen(true)}
            isDark={isDark}
            tokens={tokens}
          >
            <SettingsIcon size={18} color={tokens.text} strokeWidth={2} />
          </HeaderActionButton>
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: enter }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Selector Chip */}
        <Pressable
          accessibilityRole="button"
          onPress={() => go('Addresses')}
          style={[
            styles.location,
            {
              backgroundColor: isDark ? tokens.surface1 : '#EEF3E9',
              borderColor: isDark ? tokens.ink(0.1) : 'transparent',
            },
          ]}
        >
          <MapPin size={15} color={BRAND_GREEN} fill={BRAND_GREEN} />
          <Text style={[styles.locationText, { color: isDark ? tokens.text : '#3E493B' }]}>
            Hyderabad, Telangana
          </Text>
          <ChevronDown size={14} color={tokens.textDim} />
        </Pressable>

        {/* First Order Offer Banner */}
        <LinearGradient
          colors={
            isDark
              ? ['#1F2B1B', '#162214']
              : ['#EEF8E6', '#E2F3D3']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.offerBanner,
            {
              borderColor: isDark ? '#2D3F28' : '#CEE8BA',
            },
          ]}
        >
          <View style={styles.offerTextCol}>
            <Text style={styles.offerBadge}>FIRST ORDER OFFER</Text>
            <Text style={[styles.offerTitle, { color: tokens.text }]}>
              50% off, up to ₹100
            </Text>
            <Text style={[styles.offerSub, { color: tokens.textDim }]}>
              Valid on Food, Grocery, Rides,{"\n"}Care & Home
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy coupon code BUDDY50"
            onPress={copyCouponCode}
            style={({ pressed }) => [
              styles.couponButton,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.couponText}>
              {copiedCode ? 'COPIED!' : 'BUDDY50'}
            </Text>
          </Pressable>
        </LinearGradient>

        {/* Explore Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tokens.text }]}>
            Explore Categories
          </Text>
          <Text style={[styles.sectionSub, { color: tokens.textDim }]}>
            Pick a service to get started
          </Text>
        </View>

        {/* Service Stepper Timeline */}
        <ServiceTimeline activeIndex={activeIndex} onSelect={handleSelectTimeline} />

        {/* Category Cards Grid - All cards have the exact same size */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <CategoryCard
              service={SERVICES[0]}
              isFlipped={!!flippedCards[SERVICES[0].id]}
              onPress={() => openService(0)}
              onExplore={() => openService(0)}
            />
            <CategoryCard
              service={SERVICES[1]}
              isFlipped={!!flippedCards[SERVICES[1].id]}
              onPress={() => openService(1)}
              onExplore={() => openService(1)}
            />
          </View>

          <View style={styles.gridRow}>
            <CategoryCard
              service={SERVICES[2]}
              isFlipped={!!flippedCards[SERVICES[2].id]}
              onPress={() => openService(2)}
              onExplore={() => openService(2)}
            />
            <CategoryCard
              service={SERVICES[3]}
              isFlipped={!!flippedCards[SERVICES[3].id]}
              onPress={() => openService(3)}
              onExplore={() => openService(3)}
            />
          </View>

          <View style={styles.gridRow}>
            <CategoryCard
              service={SERVICES[4]}
              wide
              isFlipped={!!flippedCards[SERVICES[4].id]}
              onPress={() => openService(4)}
              onExplore={() => openService(4)}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: tokens.ink(0.06) }]}>
          <Text style={[styles.footerCopy, { color: tokens.textDim }]}>
            © 2026 onebuddy — All services, one platform
          </Text>
        </View>
      </Animated.ScrollView>

      {/* Sidebar Drawer */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        profileName={profile.name || 'Set up your profile'}
        onEditProfile={() => {
          setSidebarOpen(false);
          setEditProfileOpen(true);
        }}
        items={sidebarItems}
      />

      {/* Edit Profile Bottom Sheet */}
      <EditProfileSheet
        visible={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />

      {/* Settings Bottom Sheet Modal */}
      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenEditProfile={() => {
          setSettingsOpen(false);
          setTimeout(() => setEditProfileOpen(true), 250);
        }}
      />

      {/* Notifications & Alerts Modal */}
      <NotificationsModal
        visible={notificationsOpen}
        alerts={alerts}
        onClose={() => setNotificationsOpen(false)}
        onClearAll={() =>
          setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
        }
        onAlertPress={(alert) => {
          setAlerts((prev) =>
            prev.map((a) => (a.id === alert.id ? { ...a, read: true } : a))
          );
        }}
      />
    </View>
  );
}

function HeaderActionButton({
  label,
  onPress,
  children,
  isDark,
  tokens,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  isDark: boolean;
  tokens: any;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: isDark ? tokens.surface2 : '#FFFFFF',
          borderColor: isDark ? tokens.ink(0.12) : '#E6EAE2',
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarButton: {
    borderRadius: 22,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMarkBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  brandMark: {
    width: 18,
    height: 25,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  location: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 28,
  },
  offerTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  offerBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_GREEN,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  offerSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  couponButton: {
    backgroundColor: BRAND_GREEN,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  couponText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13.5,
  },
  grid: {
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 14,
  },
  placeholderCard: {
    flex: 1,
    aspectRatio: 3 / 4,
  },
  footer: {
    paddingTop: 36,
    marginTop: 36,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerCopy: {
    fontSize: 12,
  },
});
