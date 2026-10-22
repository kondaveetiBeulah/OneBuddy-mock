import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  MapPin,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Wallet,
  Pencil,
  X,
  Check,
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { useProfile } from '@/context/ProfileContext';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';
import PaymentsHost from '@/screens/PaymentsHost';

interface ProfileScreenProps {
  navigation: any;
  onGoHome?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, onGoHome }) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const { savedAddresses } = useBooking();
  const profileCtx = useProfile();

  // Profile data from global profile context with fallbacks
  const [userName, setUserName] = useState(profileCtx?.profile?.name || '');
  const [userPhone, setUserPhone] = useState(profileCtx?.profile?.phone || '');
  const [userEmail, setUserEmail] = useState(profileCtx?.profile?.email || '');

  // Edit Profile Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNameInput, setEditNameInput] = useState(userName);
  const [editPhoneInput, setEditPhoneInput] = useState(userPhone);
  const [editEmailInput, setEditEmailInput] = useState(userEmail);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smsUpdatesEnabled, setSmsUpdatesEnabled] = useState(true);
  const [paymentsModalPage, setPaymentsModalPage] = useState<'wallet' | 'main' | null>(null);

  const handleOpenEdit = () => {
    setEditNameInput(userName);
    setEditPhoneInput(userPhone);
    setEditEmailInput(userEmail);
    setSaveSuccessMsg(false);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editNameInput.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    const cleanName = editNameInput.trim();
    const cleanPhone = editPhoneInput.trim();
    const cleanEmail = editEmailInput.trim();

    setUserName(cleanName);
    setUserPhone(cleanPhone);
    setUserEmail(cleanEmail);

    if (profileCtx?.updateProfile) {
      try {
        await profileCtx.updateProfile({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
        });
      } catch {
        // ignore
      }
    }

    setSaveSuccessMsg(true);
    setTimeout(() => {
      setEditModalVisible(false);
      setSaveSuccessMsg(false);
    }, 600);
  };

  const handleBack = () => {
    if (onGoHome) {
      onGoHome();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { initialTab: 'Home' });
    }
  };

  const menuSections = [
    {
      title: 'Account & Addresses',
      items: [
        {
          id: 'addr',
          title: 'Saved Delivery Addresses',
          subtitle: `${savedAddresses.length} addresses saved`,
          icon: <MapPin size={18} color={COLORS.primary} />,
          onPress: () => navigation.navigate('Address'),
        },
        {
          id: 'wallet',
          title: 'OneBuddy Wallet & Credits',
          subtitle: 'Available balance: ₹250.00',
          icon: <Wallet size={18} color={COLORS.secondary} />,
          badge: '₹250 Balance',
          onPress: () => {
            if (navigation && typeof navigation.navigate === 'function') {
              navigation.navigate('Wallet');
            } else {
              setPaymentsModalPage('wallet');
            }
          },
        },
        {
          id: 'payment',
          title: 'Saved Payment Methods',
          subtitle: 'UPI, Credit/Debit cards & net banking',
          icon: <CreditCard size={18} color={COLORS.accent} />,
          onPress: () => {
            if (navigation && typeof navigation.navigate === 'function') {
              navigation.navigate('SavedPayments');
            } else {
              setPaymentsModalPage('main');
            }
          },
        },
      ],
    },
    {
      title: 'Preferences & Safety',
      items: [
        {
          id: 'help',
          title: 'Help & Customer Care',
          subtitle: '24x7 resolution, FAQs & support',
          icon: <ShieldCheck size={18} color={COLORS.success} />,
          onPress: () => navigation.navigate('HelpSupport'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <Header
        title="My Profile"
        subtitle="Manage personal details and preferences"
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
      >
        {/* User Card */}
        <View style={styles.userCardSection}>
          <Card style={styles.userCard} variant="elevated">
            <View style={styles.userRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <User size={32} color={COLORS.primary} />
                </View>
                <TouchableOpacity
                  style={styles.editAvatarBtn}
                  activeOpacity={0.8}
                  onPress={handleOpenEdit}
                  accessibilityLabel="Edit Profile"
                >
                  <Pencil size={13} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.userMeta}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>{userName}</Text>
                  <TouchableOpacity
                    style={styles.pencilBadge}
                    activeOpacity={0.7}
                    onPress={handleOpenEdit}
                  >
                    <Pencil size={13} color={COLORS.primary} />
                    <Text style={styles.pencilBadgeText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.userPhone}>{userPhone}</Text>
                <Text style={styles.userEmail}>{userEmail}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Notifications Card */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Notification Preferences</Text>
          <Card style={styles.toggleCard} variant="outlined">
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Push Notifications</Text>
                <Text style={styles.toggleSubtitle}>
                  Real-time technician arrival and service updates
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={[
                styles.toggleRow,
                {
                  marginTop: SPACING.md,
                  paddingTop: SPACING.sm,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: COLORS.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>SMS & WhatsApp Alerts</Text>
                <Text style={styles.toggleSubtitle}>
                  Order OTP and invoice receipts on WhatsApp
                </Text>
              </View>
              <Switch
                value={smsUpdatesEnabled}
                onValueChange={setSmsUpdatesEnabled}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </View>

        {/* Menu Sections */}
        {menuSections.map((sec, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionHeading}>{sec.title}</Text>
            <Card style={styles.menuCard} variant="outlined">
              {sec.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    iIdx !== sec.items.length - 1 && styles.menuItemBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconWrapper}>{item.icon}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemSub}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.badge ? (
                      <Badge
                        label={item.badge}
                        variant="success"
                        size="sm"
                        style={{ marginRight: 6 }}
                      />
                    ) : null}
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* Bottom spacer */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Text style={styles.modalSub}>Update your name and contact details</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Input Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                value={editNameInput}
                onChangeText={setEditNameInput}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textMuted}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                value={editPhoneInput}
                onChangeText={setEditPhoneInput}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                value={editEmailInput}
                onChangeText={setEditEmailInput}
                placeholder="e.g. name@example.com"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>

            {/* Save Button */}
            <Button
              title={saveSuccessMsg ? 'Saved Successfully!' : 'Save Changes'}
              onPress={handleSaveProfile}
              variant={saveSuccessMsg ? 'success' : 'primary'}
              size="lg"
              leftIcon={saveSuccessMsg ? <Check size={18} color="#FFFFFF" /> : undefined}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {paymentsModalPage && (
        <PaymentsHost
          visible={true}
          asModal={true}
          initialPage={paymentsModalPage}
          onClose={() => setPaymentsModalPage(null)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: SPACING.md,
  },
  userCardSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  userCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  userMeta: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  pencilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    gap: 4,
  },
  pencilBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  toggleCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    paddingRight: SPACING.sm,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  menuItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
