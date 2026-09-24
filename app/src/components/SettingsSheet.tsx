import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  ChevronRight,
  Grid,
  HelpCircle,
  Info,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
  X,
} from 'lucide-react-native';

import BuddyAvatar from './BuddyAvatar';
import { useProfile } from '@/context/ProfileContext';
import { useAppTheme } from '@/theme/ThemeContext';
import { useOtpAuth } from '@/auth/OtpAuthContext';
import { useServicePreferences } from '@/native/screens/ServicePreferences';
import type { RootStackParamList } from '@/navigation/types';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  onOpenEditProfile?: () => void;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Main Settings Sheet ───────────────────────────────────────────────────────
export default function SettingsSheet({
  visible,
  onClose,
  onOpenEditProfile,
}: SettingsSheetProps) {
  // Use useAppTheme() for all colors — it's fully reactive to theme changes
  const { colors, scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { profile } = useProfile();
  const { signOut } = useOtpAuth();
  const { summaryLabel } = useServicePreferences();

  // Android hardware back button — dismiss the sheet
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const navigateTo = (route: keyof RootStackParamList) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(route as never);
    }, 200);
  };

  const handleEditProfile = () => {
    navigateTo('EditProfile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your OneBuddy account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            onClose();
            await signOut();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently delete your orders, saved addresses, and profile data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            onClose();
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.backdrop}>
          <Pressable style={styles.scrimPressable} onPress={onClose} />

          {/* Sheet panel — backgroundColor uses reactive colors, no key remount needed */}
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.sheetBg,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            {/* Top Grab Handle */}
            <View style={styles.handleContainer}>
              <View
                style={[styles.handle, { backgroundColor: colors.divider }]}
              />
            </View>

            {/* Header Bar */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close settings"
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: colors.cardBgAlt }]}
              >
                <X size={18} color={colors.text} strokeWidth={2.4} />
              </Pressable>
            </View>

            <Text style={[styles.subHeader, { color: colors.textSecondary }]}>
              Changes save automatically across all your OneBuddy services.
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Hero Profile Card */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit your profile"
                onPress={handleEditProfile}
                style={({ pressed }) => [
                  styles.heroCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.88 },
                ]}
              >
                <BuddyAvatar
                  size={54}
                  styleId={profile.style}
                  color={profile.color}
                  borderRadius={18}
                />
                <View style={styles.heroMeta}>
                  <View style={styles.heroNameRow}>
                    <Text style={[styles.heroName, { color: colors.text }]}>
                      {profile.name || 'User 8225'}
                    </Text>
                    <Text style={[styles.heroPhone, { color: colors.textSecondary }]}>
                      {profile.phone || '7013138225'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.textTertiary} />
              </Pressable>

              {/* Quick Action 4-Grid */}
              <View style={styles.quickGrid}>
                {[
                  { label: 'Orders', icon: <Package size={22} color="#E66832" strokeWidth={2} />, bg: isDark ? '#2B221A' : '#FDF3EC', border: isDark ? '#423326' : '#F6DEC8', route: 'OrdersAndBookings' as const },
                  { label: 'Wallet', icon: <Wallet size={22} color="#D4A024" strokeWidth={2} />, bg: isDark ? '#2B281A' : '#FEF9EE', border: isDark ? '#453E26' : '#F6ECD0', route: 'Payments' as const },
                  { label: 'Address', icon: <MapPin size={22} color="#589E6E" strokeWidth={2} />, bg: isDark ? '#1C2B1C' : '#F3F9ED', border: isDark ? '#2E472D' : '#DEECCF', route: 'Addresses' as const },
                  { label: 'Help', icon: <HelpCircle size={22} color="#3C7FB8" strokeWidth={2} />, bg: isDark ? '#1C2530' : '#EEF6FC', border: isDark ? '#2C3E52' : '#D7E9F7', route: 'HelpSupport' as const },
                ].map(({ label, icon, bg, border, route }) => (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    onPress={() => navigateTo(route)}
                    style={({ pressed }) => [
                      styles.quickTile,
                      { backgroundColor: bg, borderColor: border },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    {icon}
                    <Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* SECTION: ACCOUNT */}
              <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>
                ACCOUNT
              </Text>
              <View style={[styles.groupCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <SettingItem icon={<User size={18} color="#589E6E" />} iconBg={isDark ? '#1F2C1E' : '#EBF6DF'} title="Profile & personal information" subtitle="Name, phone, email, and avatar" onPress={handleEditProfile} colors={colors} />
                <Divider colors={colors} />
                <SettingItem icon={<MapPin size={18} color="#589E6E" />} iconBg={isDark ? '#1F2C1E' : '#EBF6DF'} title="Addresses & delivery" subtitle="Where your orders and services arrive" badgeText="Hitech City, Hyd..." onPress={() => navigateTo('Addresses')} colors={colors} />
                <Divider colors={colors} />
                <SettingItem icon={<Wallet size={18} color="#D4A024" />} iconBg={isDark ? '#2D281A' : '#FDF6E2'} title="Payments" subtitle="Wallet, UPI, and saved cards" badgeText="Wallet" onPress={() => navigateTo('Payments')} colors={colors} />
                <Divider colors={colors} />
                <SettingItem icon={<Package size={18} color="#E66832" />} iconBg={isDark ? '#2E2218' : '#FDEFE3'} title="Orders & bookings" subtitle="Track, reorder, and manage returns" onPress={() => navigateTo('OrdersAndBookings')} colors={colors} isLast />
              </View>

              {/* SECTION: PREFERENCES */}
              <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>
                PREFERENCES
              </Text>
              <View style={[styles.groupCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <SettingItem icon={<Bell size={18} color="#3C7FB8" />} iconBg={isDark ? '#1C2530' : '#E8F3FA'} title="Notifications" subtitle="Order updates, offers, and quiet hours" badgeText="Push + SMS" onPress={() => navigateTo('Notifications')} colors={colors} />
                <Divider colors={colors} />
                <SettingItem icon={<Grid size={18} color="#8E6FD1" />} iconBg={isDark ? '#281F38' : '#F1EDF9'} title="Service preferences" subtitle="Turn services on and set how they run" badgeText={summaryLabel} onPress={() => navigateTo('ServicePreferences')} colors={colors} />
                <Divider colors={colors} />
                <SettingItem icon={<Settings size={18} color="#589E6E" />} iconBg={isDark ? '#1F2C1E' : '#EDF7E3'} title="App settings" subtitle="Theme, language, location, and privacy" onPress={() => navigateTo('AppSettings')} colors={colors} isLast />
              </View>

              {/* SECTION: PRIVACY & SUPPORT */}
              <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>
                PRIVACY & SUPPORT
              </Text>
              <View style={[styles.groupCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <SettingItem icon={<ShieldCheck size={18} color="#589E6E" />} iconBg={isDark ? '#1F2C1E' : '#EBF6DF'} title="Security & privacy" subtitle="Login, trusted contacts, and your data" onPress={() => navigateTo('SecurityPrivacy')} colors={colors} />
                <Divider colors={colors} />
                <SettingItem icon={<HelpCircle size={18} color="#3C7FB8" />} iconBg={isDark ? '#1C2530' : '#EEF6FC'} title="Help & support" subtitle="FAQs, live chat, and order issues" onPress={() => navigateTo('HelpSupport')} colors={colors} />
                <Divider colors={colors} />
                <SettingItem icon={<Info size={18} color="#589E6E" />} iconBg={isDark ? '#1F2C1E' : '#EDF7E3'} title="About OneBuddy" subtitle="Version, terms, and policies" onPress={() => navigateTo('About')} colors={colors} isLast />
              </View>

              {/* SECTION: ACCOUNT ACTIONS */}
              <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>
                ACCOUNT ACTIONS
              </Text>
              <View style={[styles.groupCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Log out"
                  onPress={handleLogout}
                  style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: isDark ? '#1F2C1E' : '#EBF6DF' }]}>
                    <LogOut size={18} color="#589E6E" />
                  </View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Log out</Text>
                </Pressable>

                <Divider colors={colors} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete account"
                  onPress={handleDeleteAccount}
                  style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: isDark ? '#331B1E' : '#FDECEE' }]}>
                    <Trash2 size={18} color="#D9383A" />
                  </View>
                  <Text style={[styles.actionTitle, { color: '#D9383A' }]}>Delete account</Text>
                </Pressable>
              </View>

              {/* Footer */}
              <View style={styles.footerWrap}>
                <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                  OneBuddy v1.0.0 · last saved 8 Sept 2026, 11:04 am
                </Text>
                <View style={styles.dotsRow}>
                  {['#F07E27', '#65B200', '#F2A81D', '#8E6FD1', '#3B9BE0'].map((c) => (
                    <View key={c} style={[styles.dot, { backgroundColor: c }]} />
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────
function SettingItem({
  icon, iconBg, title, subtitle, badgeText, onPress, colors, isLast = false,
}: {
  icon: React.ReactNode; iconBg: string; title: string; subtitle?: string;
  badgeText?: string; onPress?: () => void; colors: any; isLast?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingItem,
        pressed && { backgroundColor: colors.cardBgAlt },
      ]}
    >
      <View style={[styles.itemIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.itemRight}>
        {badgeText ? (
          <Text style={[styles.badgeText, { color: colors.accentStart }]}>{badgeText}</Text>
        ) : null}
        <ChevronRight size={17} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

function Divider({ colors }: { colors: any }) {
  return (
    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  scrimPressable: { flex: 1 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingTop: 10, paddingHorizontal: 18 },
  handleContainer: { alignItems: 'center', paddingVertical: 6 },
  handle: { width: 44, height: 4.5, borderRadius: 2.5 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  subHeader: { fontSize: 13.5, lineHeight: 18, marginTop: 4, marginBottom: 16 },
  scrollContent: { paddingBottom: 28 },
  heroCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, gap: 14 },
  heroMeta: { flex: 1 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroName: { fontSize: 17, fontWeight: '800' },
  heroPhone: { fontSize: 14, fontWeight: '500' },
  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickTile: { flex: 1, borderRadius: 18, borderWidth: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  quickLabel: { fontSize: 12.5, fontWeight: '700' },
  sectionHeading: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10, paddingHorizontal: 4 },
  groupCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 22 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
  itemIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  itemSubtitle: { fontSize: 12.5 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeText: { fontSize: 13, fontWeight: '800' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  dividerLine: { height: StyleSheet.hairlineWidth },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  actionIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontWeight: '700' },
  footerWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 8, gap: 12 },
  footerText: { fontSize: 12, fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});
