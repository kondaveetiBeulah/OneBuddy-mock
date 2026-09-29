import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Sparkles,
  Wrench,
  Wind,
  Droplets,
  ChevronRight,
} from 'lucide-react-native';
import { ServiceCategory } from '../../types';
import { COLORS, RADII, SPACING, SHADOWS } from '../../theme';

interface CategoryGridProps {
  categories: ServiceCategory[];
  onSelectCategory: (category: ServiceCategory) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2;

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onSelectCategory,
}) => {
  const renderCategoryIcon = (id: string, color: string) => {
    const iconSize = 26;
    switch (id) {
      case 'house_cleaning':
        return <Sparkles size={iconSize} color={color} />;
      case 'plumbing_services':
        return <Wrench size={iconSize} color={color} />;
      case 'ac_services':
        return <Wind size={iconSize} color={color} />;
      case 'water_services':
        return <Droplets size={iconSize} color={color} />;
      default:
        return <Sparkles size={iconSize} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.85}
            onPress={() => onSelectCategory(cat)}
            style={styles.card}
          >
            {/* Top Accent Icon & Action Chevron */}
            <View style={styles.topBar}>
              <View style={[styles.iconWrapper, { backgroundColor: `${cat.color}15` }]}>
                {renderCategoryIcon(cat.id, cat.color)}
              </View>

              <View style={[styles.chevronCircle, { backgroundColor: `${cat.color}18` }]}>
                <ChevronRight size={15} color={cat.color} />
              </View>
            </View>

            {/* Category Info */}
            <View style={styles.infoArea}>
              <Text style={styles.title} numberOfLines={1}>
                {cat.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {cat.subtitle}
              </Text>
            </View>

            {/* Clean Explore Footer */}
            <View style={styles.footerRow}>
              <Text style={[styles.exploreText, { color: cat.color }]}>Explore Options</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: ITEM_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    minHeight: 168,
    ...SHADOWS.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: RADII.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  infoArea: {
    marginVertical: SPACING.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 15,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
