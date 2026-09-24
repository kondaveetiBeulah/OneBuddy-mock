/**
 * screens/ServicePreferencesScreen.tsx
 * -----------------------------------------------------------------------
 * Main "Service Preferences" screen:
 *   1. Clean Top Header with Back button.
 *   2. "Your five services" card — each service with icon, label/subtitle,
 *      mode selector pill ("Express ▾"), and switch.
 *   3. "Across every service" card — global toggles.
 *   4. Floating auto-dismissing toast feedback.
 * -----------------------------------------------------------------------
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { SERVICE_CATALOG } from '../constants/serviceCatalog';
import { useServicePreferences } from '../context/ServicePreferencesContext';
import { colors, radii, spacing } from '../theme/colors';
import { DeliveryMode, ServiceKey } from '../types';
import DeliveryPreferenceModal from '../components/DeliveryPreferenceModal';
import NonIntrusiveToast from '../components/NonIntrusiveToast';
import { useAppTheme } from '@/theme/ThemeContext';

export interface ServicePreferencesScreenProps {
  onBack?: () => void;
}

const GLOBAL_TOGGLES: {
  key: 'autoReorder' | 'contactlessDrop' | 'ecoBagsOnly';
  title: string;
  subtitle: string;
}[] = [
  {
    key: 'autoReorder',
    title: 'Auto reorder',
    subtitle: 'Repeat your usual orders on schedule',
  },
  {
    key: 'contactlessDrop',
    title: 'Contactless drop',
    subtitle: 'Leave orders safely at the entrance',
  },
  {
    key: 'ecoBagsOnly',
    title: 'Eco bags only',
    subtitle: 'Paper or reusable packaging where possible',
  },
];

export default function ServicePreferencesScreen({ onBack }: ServicePreferencesScreenProps) {
  const { scheme, colors: themeColors } = useAppTheme();
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();

  const {
    state,
    isHydrated,
    setServiceMode,
    setServiceEnabled,
    setGlobalToggle,
    summaryLabel,
  } = useServicePreferences();

  const [activeService, setActiveService] = useState<ServiceKey | null>(null);

  const activeMeta = activeService
    ? SERVICE_CATALOG.find((s) => s.key === activeService)
    : null;

  if (!isHydrated) {
    return (
      <View
        style={[
          styles.screen,
          styles.loadingWrap,
          { backgroundColor: isDark ? colors.bgDeep : themeColors.bg },
        ]}
      >
        <ActivityIndicator color={themeColors.accentStart || colors.goldLight} size="large" />
      </View>
    );
  }

  const bgColor = isDark ? colors.bgDeep : themeColors.bg;
  const cardBg = isDark ? colors.cardSurface : themeColors.cardBg;
  const cardBorder = isDark ? colors.cardBorder : themeColors.border;
  const rowBorder = isDark ? colors.rowBorder : themeColors.divider;
  const textColor = isDark ? '#FFFFFF' : themeColors.text;
  const textSubColor = isDark ? colors.mistDim : themeColors.textSecondary;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header Navigation */}
      <View style={[styles.topNav, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : themeColors.divider }]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Back to Settings"
          >
            <ChevronLeft size={24} color={isDark ? '#FFFFFF' : themeColors.text} />
            <Text style={[styles.backText, { color: isDark ? '#FFFFFF' : themeColors.text }]}>
              Back
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <Text style={[styles.navTitle, { color: textColor }]}>Service Preferences</Text>
        <View style={styles.backSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 70 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings main row summary tile */}
        <View
          style={[
            styles.headerRow,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : themeColors.cardBgAlt,
              borderColor: cardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.headerIconTile,
              {
                backgroundColor: isDark
                  ? 'rgba(201,162,39,0.18)'
                  : 'rgba(95,163,0,0.12)',
              },
            ]}
          >
            <Text style={styles.headerIconGlyph}>⚙️</Text>
          </View>
          <View style={styles.flex1}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Service preferences</Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDark ? colors.goldLight : themeColors.accentStart },
              ]}
            >
              {summaryLabel}
            </Text>
          </View>
        </View>

        {/* ---- Your five services ---- */}
        <Text
          style={[
            styles.groupLabel,
            { color: isDark ? colors.mistDim : themeColors.textTertiary },
          ]}
        >
          YOUR FIVE SERVICES
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {SERVICE_CATALOG.map((service, index) => {
            const pref = state.services[service.key];
            const isLast = index === SERVICE_CATALOG.length - 1;
            const isEnabled = pref?.enabled ?? true;
            return (
              <View
                key={service.key}
                style={[
                  styles.row,
                  { borderBottomColor: rowBorder },
                  isLast && styles.rowLast,
                ]}
              >
                <View
                  style={[
                    styles.svcIcon,
                    { backgroundColor: hexToRgba(service.color, 0.18) },
                  ]}
                >
                  <Text style={styles.svcIconGlyph}>{service.icon}</Text>
                </View>

                <View style={styles.flex1}>
                  <Text style={[styles.rowTitle, { color: textColor }]}>
                    {service.label}
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: textSubColor }]}>
                    {service.subtitle}
                  </Text>
                </View>

                <View style={styles.rowControls}>
                  <Pressable
                    onPress={() => isEnabled && setActiveService(service.key)}
                    disabled={!isEnabled}
                    style={({ pressed }) => [
                      styles.pill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.05)',
                        borderColor: isDark ? colors.pillBorder : themeColors.border,
                      },
                      !isEnabled && styles.pillDisabled,
                      pressed && isEnabled && styles.pillPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !isEnabled }}
                    accessibilityLabel={`${service.label} delivery mode: ${pref?.mode ?? 'Default'}`}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isDark ? colors.mist : themeColors.text },
                        !isEnabled && styles.pillTextDisabled,
                      ]}
                    >
                      {pref?.mode ?? 'Default'}
                    </Text>
                    <Text
                      style={[
                        styles.pillChevron,
                        { color: isDark ? colors.mistDim : themeColors.textSecondary },
                        !isEnabled && styles.pillTextDisabled,
                      ]}
                    >
                      ▾
                    </Text>
                  </Pressable>

                  <Switch
                    value={isEnabled}
                    onValueChange={(val) => setServiceEnabled(service.key, val)}
                    trackColor={{
                      false: isDark ? colors.switchTrackOff : themeColors.toggleOff,
                      true: service.color || themeColors.accentStart,
                    }}
                    thumbColor={themeColors.toggleThumb || '#FFFFFF'}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* ---- Across every service ---- */}
        <Text
          style={[
            styles.groupLabel,
            { color: isDark ? colors.mistDim : themeColors.textTertiary },
          ]}
        >
          ACROSS EVERY SERVICE
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {GLOBAL_TOGGLES.map((toggle, index) => {
            const isLast = index === GLOBAL_TOGGLES.length - 1;
            const value = state.globalToggles[toggle.key];
            return (
              <View
                key={toggle.key}
                style={[
                  styles.row,
                  { borderBottomColor: rowBorder },
                  isLast && styles.rowLast,
                ]}
              >
                <View
                  style={[
                    styles.iconTileDefault,
                    {
                      backgroundColor: isDark
                        ? colors.iconTileDefault
                        : themeColors.iconBg,
                    },
                  ]}
                >
                  <Text style={styles.svcIconGlyph}>
                    {toggle.key === 'autoReorder'
                      ? '🔁'
                      : toggle.key === 'contactlessDrop'
                      ? '📦'
                      : '🌿'}
                  </Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.rowTitle, { color: textColor }]}>
                    {toggle.title}
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: textSubColor }]}>
                    {toggle.subtitle}
                  </Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={(val) => setGlobalToggle(toggle.key, val)}
                  trackColor={{
                    false: isDark ? colors.switchTrackOff : themeColors.toggleOff,
                    true: themeColors.accentStart || colors.gold,
                  }}
                  thumbColor={themeColors.toggleThumb || '#FFFFFF'}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {activeMeta ? (
        <DeliveryPreferenceModal
          visible={!!activeService}
          title={`${activeMeta.label} delivery mode`}
          subtitle="Choose how this service should run by default."
          options={activeMeta.modes}
          selected={state.services[activeMeta.key]?.mode ?? activeMeta.modes[0]}
          onSelect={(mode: DeliveryMode) => setServiceMode(activeMeta.key, mode)}
          onClose={() => setActiveService(null)}
        />
      ) : null}

      <NonIntrusiveToast />
    </SafeAreaView>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  backSpacer: {
    width: 60,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  headerIconTile: {
    width: 40,
    height: 40,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconGlyph: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.card,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  svcIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileDefault: {
    width: 38,
    height: 38,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svcIconGlyph: {
    fontSize: 18,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  rowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillPressed: {
    opacity: 0.8,
  },
  pillDisabled: {
    opacity: 0.45,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextDisabled: {
    opacity: 0.6,
  },
  pillChevron: {
    fontSize: 10,
  },
});
