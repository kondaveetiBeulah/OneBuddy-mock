import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, ClipboardList, Heart, ShoppingBag } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useFilter } from '../../context/FilterContext';

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

  return (
    <View style={[styles.navBar, { paddingBottom: bottomInset + 8 }]}>
      {/* Home */}
      <TouchableOpacity
        onPress={() => onNavigate('home')}
        style={styles.navItem}
      >
        <Home
          size={20}
          color={activeScreen === 'home' ? '#65A30D' : '#6B7280'}
        />
        <Text
          style={[
            styles.navText,
            activeScreen === 'home' && styles.navTextActive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Explore / Search */}
      <TouchableOpacity
        onPress={() => {
          onNavigate('home');
          triggerSearchFocus();
          if (onFocusSearch) onFocusSearch();
        }}
        style={styles.navItem}
      >
        <Compass size={20} color="#6B7280" />
        <Text style={styles.navText}>Explore</Text>
      </TouchableOpacity>

      {/* Orders */}
      <TouchableOpacity
        onPress={() => onNavigate('orders')}
        style={styles.navItem}
      >
        <ClipboardList
          size={20}
          color={activeScreen === 'orders' ? '#65A30D' : '#6B7280'}
        />
        <Text
          style={[
            styles.navText,
            activeScreen === 'orders' && styles.navTextActive,
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
        <View style={styles.iconWrapper}>
          <Heart
            size={20}
            color={activeScreen === 'favorites' ? '#F43F5E' : '#6B7280'}
          />
          {favorites.length > 0 && (
            <View style={styles.favBadge}>
              <Text style={styles.favBadgeText}>{favorites.length}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.navText,
            activeScreen === 'favorites' && { color: '#F43F5E', fontWeight: 'bold' },
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
    color: '#111827',
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
