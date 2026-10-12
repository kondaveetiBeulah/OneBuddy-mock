import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

export const WishlistScreen: React.FC = () => {
  const { wishlistItems, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);

  return (
    <SafeAreaView style={dynStyles.container}>
      <Header
        title={`My Wishlist (${wishlistItems.length})`}
        rightIcon={
          wishlistItems.length > 0 ? (
            <TouchableOpacity onPress={clearWishlist}>
              <Text style={dynStyles.clearText}>Clear All</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {wishlistItems.length === 0 ? (
        <EmptyState
          iconName="heart-outline"
          title="Your Wishlist is Empty"
          message="Save your favorite grocery items here to order them quickly whenever you need."
          buttonTitle="Explore Products"
          onButtonPress={() => {
            navigation.navigate('Explore' as any);
          }}
        />
      ) : (
        <FlatList
          data={wishlistItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={dynStyles.gridPadding}
          columnWrapperStyle={dynStyles.columnWrapper}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              variant="grid"
              onPress={(p) =>
                navigation.navigate('ProductDetails', { productId: p.id })
              }
              onAddToCart={(p) => addToCart(p)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : colors.background,
  },
  clearText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: isDark ? '#EF4444' : colors.danger,
  },
  gridPadding: {
    padding: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
