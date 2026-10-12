import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ClipboardList, Heart } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useFilter } from '../../context/FilterContext';

import { isCategoryDark } from '@/theme/categoryThemeBridge';

interface BottomNavBarProps {
  activeScreen: string;
  onNavigate: (screen: 'home' | 'restaurant-menu' | 'orders' | 'favorites' | 'cart') => void;
  onFocusSearch?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeScreen,
  onNavigate,
  onFocusSearch,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);
  const { totalItemCount, favorites } = useCart();
  const { triggerSearchFocus } = useFilter();
  const isDark = isCategoryDark();

  const getIconColor = (screen: string) => {
    if (activeScreen === screen) {
      return isDark ? '#A3E635' : '#65A30D';
    }
    return isDark ? '#E5E7EB' : '#6B7280';
  };

  return (
    <View style={[styles.navBar, { paddingBottom: bottomInset + 8 }, isDark && { backgroundColor: '#000000', borderTopColor: 'rgba(255, 255, 255, 0.15)' }]}>
      {/* Home */}
      <TouchableOpacity
        onPress={() => onNavigate('home')}
        style={styles.navItem}
      >
        <Home
          size={20}
          color={getIconColor('home')}
        />
        <Text
          style={[
            styles.navText,
            isDark && { color: '#E5E7EB' },
            activeScreen === 'home' && (isDark ? { color: '#A3E635', fontWeight: 'bold' } : styles.navTextActive),
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Orders */}
      <TouchableOpacity
        onPress={() => onNavigate('orders')}
        style={styles.navItem}
      >
        <ClipboardList
          size={20}
          color={getIconColor('orders')}
        />
        <Text
          style={[
            styles.navText,
            isDark && { color: '#E5E7EB' },
            activeScreen === 'orders' && (isDark ? { color: '#A3E635', fontWeight: 'bold' } : styles.navTextActive),
          ]}
        >
          Orders
        </Text>
      </TouchableOpacity>

      {/* Favorites */}
      <TouchableOpacity
        onPress={() => onNavigate('favorites')}
        style={styles.navItem}
      >
        <Heart
          size={20}
          color={getIconColor('favorites')}
        />
        <Text
          style={[
            styles.navText,
            isDark && { color: '#E5E7EB' },
            activeScreen === 'favorites' && (isDark ? { color: '#A3E635', fontWeight: 'bold' } : styles.navTextActive),
          ]}
        >
          Favorites
        </Text>
      </TouchableOpacity>


    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 8,
    paddingBottom: 16,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
  },
  navText: {
    fontSize: 10,
    color: '#6B7280',
  },
  navTextActive: {
    color: '#65A30D',
    fontWeight: 'bold',
  },
  cartIconWrapper: {
    position: 'relative',
  },
  iconWrapper: {
    position: 'relative',
  },
  favBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#F43F5E',
    borderRadius: 8,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cartDotBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#65A30D',
    borderRadius: 8,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartDotText: {
    color: '#111827',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
