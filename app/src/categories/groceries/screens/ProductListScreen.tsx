import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { productService } from '../services/productService';
import { Product, SortOption, ProductFilter } from '../types/product.types';
import { useCart } from '../context/CartContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation.types';

type ProductListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProductList'>;
  route: RouteProp<RootStackParamList, 'ProductList'>;
};

export const ProductListScreen: React.FC<ProductListScreenProps> = ({
  navigation,
  route,
}) => {
  const { categoryId, categoryName } = route.params;
  const { addToCart, getCartCount } = useCart();
  const cartCount = getCartCount();

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('popularity');

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Filter state
  const [filterInStockOnly, setFilterInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchProducts();
  }, [categoryId, sortOption, filterInStockOnly, minRating]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const filter: ProductFilter = {
        categoryId,
        inStockOnly: filterInStockOnly,
        minRating,
      };
      const data = await productService.getProducts(filter, sortOption);
      setProductsList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = productsList.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const SORT_OPTIONS_LIST: { label: string; value: SortOption }[] = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Price: Low to High', value: 'price_low_high' },
    { label: 'Price: High to Low', value: 'price_high_low' },
    { label: 'Highest Rating', value: 'rating' },
    { label: 'Biggest Discount', value: 'discount' },
    { label: 'Newest Arrivals', value: 'newest' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={categoryName}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon={
          <TouchableOpacity
            style={styles.cartIconWrapper}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.7}
          >
            <Ionicons name="cart-outline" size={28} color={colors.textPrimary} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <View style={styles.topFilterSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder={`Search in ${categoryName}...`}
          style={styles.searchBar}
        />

        <View style={styles.filterActionsRow}>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="swap-vertical" size={16} color={colors.primary} />
            <Text style={styles.filterChipText}>
              Sort: {SORT_OPTIONS_LIST.find((s) => s.value === sortOption)?.label}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, (filterInStockOnly || minRating !== undefined) ? styles.activeFilterChip : null]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={16} color={colors.primary} />
            <Text style={styles.filterChipText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <LoadingState message={`Fetching ${categoryName}...`} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          iconName="search-outline"
          title="No Products Found"
          message={`No items match your selected filters in ${categoryName}.`}
          buttonTitle="Clear Filters"
          onButtonPress={() => {
            setSearchQuery('');
            setFilterInStockOnly(false);
            setMinRating(undefined);
            setSortOption('popularity');
          }}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridPadding}
          columnWrapperStyle={styles.columnWrapper}
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

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {SORT_OPTIONS_LIST.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.modalOptionRow}
                onPress={() => {
                  setSortOption(opt.value);
                  setShowSortModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    sortOption === opt.value && styles.selectedOptionText,
                  ]}
                >
                  {opt.label}
                </Text>
                {sortOption === opt.value && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Products</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.filterSectionTitle}>Availability</Text>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFilterInStockOnly(!filterInStockOnly)}
              >
                <Ionicons
                  name={filterInStockOnly ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.checkboxLabel}>In Stock Only</Text>
              </TouchableOpacity>

              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              <View style={styles.ratingFilterRow}>
                {[4, 3, 2].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.ratingChip,
                      minRating === r && styles.activeRatingChip,
                    ]}
                    onPress={() => setMinRating(minRating === r ? undefined : r)}
                  >
                    <Ionicons name="star" size={14} color={colors.rating} />
                    <Text style={styles.ratingChipText}>{r}★ & above</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyFilterText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topFilterSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchBar: {
    marginBottom: spacing.xs,
  },
  filterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: spacing.borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  activeFilterChip: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  gridPadding: {
    padding: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  selectedOptionText: {
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  filterSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  checkboxLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  ratingFilterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: spacing.borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  activeRatingChip: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  ratingChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  applyFilterBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  applyFilterText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  cartIconWrapper: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 19,
    height: 19,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
});

