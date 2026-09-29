import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, CalendarCheck, Headphones, User } from 'lucide-react-native';
import { useBooking } from '../../context/BookingContext';
import { useHomeTheme, RADII, SHADOWS } from '../../theme';

export type MainTabType = 'Home' | 'Bookings' | 'HelpSupport' | 'Profile';

interface BottomNavBarProps {
  activeTab: MainTabType;
  onTabPress: (tab: MainTabType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();
  const { activeBooking } = useBooking();
  const { colors, isDark } = useHomeTheme();

  const tabs: { id: MainTabType; label: string; icon: (color: string, size: number) => React.ReactNode; badge?: boolean }[] = [
    {
      id: 'Home',
      label: 'Home',
      icon: (color, size) => <Home size={size} color={color} />,
    },
    {
      id: 'Bookings',
      label: 'Bookings',
      icon: (color, size) => <CalendarCheck size={size} color={color} />,
      badge: Boolean(activeBooking && activeBooking.stage !== 'COMPLETED'),
    },
    {
      id: 'HelpSupport',
      label: 'Support',
      icon: (color, size) => <Headphones size={size} color={color} />,
    },
    {
      id: 'Profile',
      label: 'Profile',
      icon: (color, size) => <User size={size} color={color} />,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 60 + Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const iconColor = isActive ? colors.primary : colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {tab.icon(iconColor, 22)}
                {tab.badge && (
                  <View
                    style={[
                      styles.badgeDot,
                      {
                        backgroundColor: colors.primary,
                        borderColor: isDark ? colors.surface : '#FFFFFF',
                      },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: iconColor, fontWeight: isActive ? '800' : '600' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    ...SHADOWS.float,
    zIndex: 999,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    letterSpacing: -0.1,
  },
});
