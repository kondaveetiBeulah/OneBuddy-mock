import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { Header } from '../components/Header';
import { useUser } from '../context/UserContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: keyof RootStackParamList;
}

const MENU_ITEMS: MenuItem[] = [
  { id: '1', title: 'My Orders', icon: 'bag-handle-outline', route: 'Orders' },
  { id: '2', title: 'Wishlist', icon: 'heart-outline', route: 'Wishlist' },
  { id: '3', title: 'My Addresses', icon: 'location-outline', route: 'Address' },
  { id: '4', title: 'Edit Profile', icon: 'person-outline', route: 'EditProfile' },
  { id: '5', title: 'Settings', icon: 'settings-outline', route: 'Settings' },
  { id: '6', title: 'Help & Support', icon: 'help-circle-outline', route: 'HelpSupport' },
  { id: '7', title: 'Privacy & Security', icon: 'shield-outline', route: 'PrivacySecurity' },
  { id: '8', title: 'About 1Buddy', icon: 'information-circle-outline', route: 'About' },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useUser();

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Account" />

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        {/* User Info Header Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrapper}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={32} color={colors.white} />
            )}
          </View>

          <View style={styles.userInfoCol}>
            <Text style={styles.userName}>{user?.name || 'Anjali'}</Text>
            <Text style={styles.userSub}>{user?.email || 'anjali@example.com'}</Text>
            <Text style={styles.userSub}>+91 {user?.phone || '9876543210'}</Text>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Menu Items List */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuRow}
              onPress={() => navigation.navigate(item.route as any)}
            >
              <View style={styles.menuIconBg}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <View style={[styles.menuIconBg, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            </View>
            <Text style={styles.logoutTitle}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>1Buddy Grocery v1.0.0 (Phase 1)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollPadding: {
    padding: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfoCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  userSub: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  logoutTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.danger,
  },
  versionText: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
