import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types/navigation.types';
import { colors, useGroceryColors } from '../theme/colors';
import { typography } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import { useWishlist } from '../context/WishlistContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const colors = useGroceryColors();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const tabHeight = 64 + bottomInset;
  const { wishlistCount } = useWishlist();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'none',
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabHeight,
            paddingBottom: bottomInset,
            backgroundColor: colors.cardBackground,
            borderTopColor: colors.borderLight,
            shadowColor: colors.shadow,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabel: ({ focused }) => {
          let labelText = route.name;
          if (route.name === 'Orders') labelText = 'Orders';

          return (
            <Text
              style={[
                styles.tabBarLabel,
                {
                  color: focused ? colors.primaryDark : colors.textMuted,
                  fontWeight: focused ? '700' : '500',
                },
              ]}
            >
              {labelText}
            </Text>
          );
        },
        tabBarIcon: ({ focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Explore':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Orders':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'Wishlist':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            default:
              iconName = 'square-outline';
          }

          return (
            <View
              style={[
                styles.iconWrapper,
                focused && { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={(focused ? colors.primaryDark : colors.textMuted) as string}
              />
              {route.name === 'Wishlist' && wishlistCount > 0 && (
                <View style={[styles.wishlistBadge, { backgroundColor: colors.danger, borderColor: colors.white }]}>
                  <Text style={[styles.wishlistBadgeText, { color: colors.white }]}>
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen as any}
      />
      <Tab.Screen
        name="Explore"
        component={CategoriesScreen as any}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen as any}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen as any}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.cardBackground,
    paddingTop: 6,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabBarItem: {
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    minWidth: 44,
    paddingHorizontal: 8,
    borderRadius: 15,
    position: 'relative',
  },
  wishlistBadge: {
    position: 'absolute',
    top: -3,
    right: 2,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  wishlistBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
});
