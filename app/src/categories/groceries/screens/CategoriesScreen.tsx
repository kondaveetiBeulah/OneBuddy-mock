import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { Header } from '../components/Header';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { productService } from '../services/productService';
import { Category } from '../types/category.types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - spacing.md * 3) / 2;

export const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);

  useEffect(() => {
    setLoading(true);
    productService
      .getCategories()
      .then((data) => {
        if (data && data.length > 0) setCategoriesList(data);
      })
      .catch((e) => console.error('Failed to fetch categories:', e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={dynStyles.container}>
      <Header title="All Categories" showBack onBack={() => navigation.goBack()} />

      {loading && categoriesList.length === 0 ? (
        <LoadingState
          message="Loading Categories..."
          subtitle="Fetching fresh grocery aisles for you"
        />
      ) : categoriesList.length === 0 ? (
        <EmptyState
          iconName="grid-outline"
          title="No Categories Available"
          message="There are no categories listed right now. Please check back shortly."
        />
      ) : (
        <FlatList
          data={categoriesList}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={dynStyles.listPadding}
        columnWrapperStyle={dynStyles.columnWrapper}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={dynStyles.card}
            onPress={() =>
              navigation.navigate('ProductList', {
                categoryId: item.id,
                categoryName: item.name,
              })
            }
            activeOpacity={0.85}
          >
            <View style={[dynStyles.imageContainer, { backgroundColor: isDark ? 'rgba(95,163,0,0.2)' : (item.backgroundColor || colors.primaryLight) }]}>
              <Image source={{ uri: item.image }} style={dynStyles.image} resizeMode="cover" />
            </View>
            <View style={dynStyles.cardContent}>
              <Text style={dynStyles.categoryName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={dynStyles.productCount}>
                {item.productCount} Products
              </Text>
            </View>
          </TouchableOpacity>
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
  listPadding: {
    padding: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  card: {
    width: ITEM_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: isDark ? '#000000' : colors.white,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
    shadowColor: isDark ? '#FFFFFF' : colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  imageContainer: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: spacing.sm + 2,
    backgroundColor: isDark ? '#000000' : colors.white,
  },
  categoryName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
  productCount: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.textMuted,
    marginTop: 2,
  },
});
