import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
import { Product } from '../types/product.types';
import { useCart } from '../context/CartContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation.types';
import { VoiceSearchModal } from '../components/VoiceSearchModal';

type SearchScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Search'>;
  route?: RouteProp<RootStackParamList, 'Search'>;
};

const POPULAR_SEARCHES = [
  'Milk',
  'Tomatoes',
  'Basmati Rice',
  'Bananas',
  'Atta',
  'Tea',
  'Butter',
  'Chips',
];

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation, route }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Fresh Apples',
    'Amul Milk',
    'Fortune Oil',
  ]);
  const [searching, setSearching] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const { addToCart, getCartCount } = useCart();
  const cartCount = getCartCount();

  useEffect(() => {
    if (route?.params?.initialVoiceSearch) {
      setIsVoiceModalOpen(true);
    }
  }, [route?.params?.initialVoiceSearch]);

  useEffect(() => {
    if (query.trim().length > 0) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setSearching(true);
    const data = await productService.searchProducts(searchQuery);
    setResults(data);
    setSearching(false);
  };

  const handleSelectSearchTerm = (term: string) => {
    setQuery(term);
    if (!recentSearches.includes(term)) {
      setRecentSearches([term, ...recentSearches.slice(0, 4)]);
    }
  };

  const handleVoiceResult = (spokenText: string) => {
    setIsVoiceModalOpen(false);
    setQuery(spokenText);
    performSearch(spokenText);
    if (!recentSearches.includes(spokenText)) {
      setRecentSearches([spokenText, ...recentSearches.slice(0, 4)]);
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Search Groceries"
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

      <View style={styles.searchPadding}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          onVoicePress={() => setIsVoiceModalOpen(true)}
          autoFocus={!route?.params?.initialVoiceSearch}
        />
      </View>

      <VoiceSearchModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onResult={handleVoiceResult}
      />

      {query.trim().length === 0 ? (
        <ScrollView contentContainerStyle={styles.suggestionsContainer}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecent}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>

              {recentSearches.map((term, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.recentItem}
                  onPress={() => handleSelectSearchTerm(term)}
                >
                  <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                  <Text style={styles.recentText}>{term}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popular Searches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Searches</Text>
            <View style={styles.chipContainer}>
              {POPULAR_SEARCHES.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chip}
                  onPress={() => handleSelectSearchTerm(chip)}
                >
                  <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : searching ? (
        <LoadingState
          message={`Searching for "${query}"...`}
          subtitle="Looking up fresh grocery items"
          showLogo={false}
        />
      ) : results.length === 0 ? (
        <EmptyState
          iconName="search-outline"
          title="No Products Found"
          message={`We couldn't find any items matching "${query}".`}
        />
      ) : (
        <FlatList
          data={results}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchPadding: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cardBackground,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  suggestionsContainer: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  clearText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    fontWeight: typography.weights.semibold,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  recentText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  gridPadding: {
    padding: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
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

