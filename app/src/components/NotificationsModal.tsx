import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { brand, schemes } from '@/design/tokens';

export interface AlertNotification {
  id: string;
  icon: string;
  title: string;
  timeAgo: string;
  gradient?: [string, string];
  screen?: string;
  read?: boolean;
}

export const INITIAL_ALERTS: AlertNotification[] = [
  {
    id: 'alt-1',
    icon: '🛵',
    title: 'Your Spice Route order is on the way with delivery partner Ramesh.',
    timeAgo: '2 minutes ago',
    gradient: ['#F7A768', '#F07E27'],
    read: false,
  },
  {
    id: 'alt-2',
    icon: '🩺',
    title: 'Appointment reminder: Dr. Anjali Rao tomorrow at 11:30 AM.',
    timeAgo: '1 hour ago',
    gradient: ['#6CB7EB', '#3B9BE0'],
    read: false,
  },
  {
    id: 'alt-3',
    icon: '🚗',
    title: 'Trip completed! How was your experience with driver Sunil?',
    timeAgo: 'Yesterday',
    gradient: ['#F7C359', '#F2A81D'],
    read: true,
  },
  {
    id: 'alt-4',
    icon: '🎟️',
    title: 'Coupon BUDDY50 applied! Get flat 50% off on your next grocery order.',
    timeAgo: '2 days ago',
    gradient: ['#8CCB2E', '#5FA300'],
    read: true,
  },
];

interface NotificationsModalProps {
  visible: boolean;
  alerts: AlertNotification[];
  onClose: () => void;
  onClearAll: () => void;
  onAlertPress?: (alert: AlertNotification) => void;
}

export default function NotificationsModal({
  visible,
  alerts,
  onClose,
  onClearAll,
  onAlertPress,
}: NotificationsModalProps) {
  const { scheme } = useAppTheme();
  const tokens = schemes[scheme];
  const isDark = scheme === 'dark';

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: tokens.surface1,
              borderColor: tokens.ink(0.1),
            },
          ]}
        >
          {/* Handle bar */}
          <View
            style={[
              styles.handleBar,
              { backgroundColor: isDark ? '#4B5563' : '#D1D5DB' },
            ]}
          />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: tokens.text }]}>
                Notifications & Alerts
              </Text>
              <Text style={[styles.sub, { color: tokens.textDim }]}>
                {unreadCount > 0
                  ? `${unreadCount} new update${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: tokens.surface2, borderColor: tokens.ink(0.08) },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close notifications"
            >
              <Text style={[styles.closeText, { color: tokens.textDim }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {alerts.length > 0 ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.alertList}>
                {alerts.map((item) => {
                  const cardBg = item.read
                    ? tokens.surface2
                    : isDark
                    ? 'rgba(95, 163, 0, 0.12)'
                    : '#F4FBEB';
                  const borderColor = item.read
                    ? tokens.ink(0.08)
                    : brand.gold;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.75}
                      onPress={() => onAlertPress && onAlertPress(item)}
                      style={[
                        styles.alertCard,
                        {
                          backgroundColor: cardBg,
                          borderColor: borderColor,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.iconWrap,
                          {
                            backgroundColor: item.gradient
                              ? item.gradient[0]
                              : brand.goldLight,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.alertTitle, { color: tokens.text }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.alertTime, { color: tokens.textDim }]}>
                          ⏱️ {item.timeAgo}
                        </Text>
                      </View>
                      {!item.read && (
                        <View
                          style={[
                            styles.unreadDot,
                            { backgroundColor: brand.gold },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {unreadCount > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClearAll}
                  style={styles.clearBtn}
                >
                  <Text style={[styles.clearText, { color: brand.gold }]}>
                    Mark all as read
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            <View style={styles.emptyView}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
              <Text style={[styles.emptyTitle, { color: tokens.text }]}>
                No new notifications
              </Text>
              <Text style={[styles.emptySub, { color: tokens.textDim }]}>
                We'll notify you when your orders, rides, or appointments update.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  sub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  alertList: {
    gap: 10,
    marginBottom: 16,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  alertTime: {
    fontSize: 11,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  clearBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyView: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
});
