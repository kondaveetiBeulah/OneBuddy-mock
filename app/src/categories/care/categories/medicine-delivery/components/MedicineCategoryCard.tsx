import React, { useState } from 'react';
import { DimensionValue, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MedicineCategory } from '../data/medicineCategories';
import { MEDICINE_IMAGES } from '../data/medicineImages';
import { COLORS, useMedColors } from '../theme/colors';
import Icon from './Icon';

interface MedicineCategoryCardProps {
  category: MedicineCategory;
  onPress: () => void;
  width?: DimensionValue;
  active?: boolean;
}

export default function MedicineCategoryCard({
  category,
  onPress,
  width = 132,
  active = false,
}: MedicineCategoryCardProps) {
  const [imgError, setImgError] = useState(false);
  const medColors = useMedColors();
  const banner =
    (category.imageKey && MEDICINE_IMAGES[category.imageKey]) ||
    MEDICINE_IMAGES['cat-' + category.id];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { width, backgroundColor: medColors.card, borderColor: active ? COLORS.green : medColors.greenBorder },
        active && styles.cardActive,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.imageWrap, { backgroundColor: medColors.isDark ? '#2A2E37' : '#FFFFFF' }, active && styles.imageWrapActive]}>
        {banner ? (
          <Image
            source={banner}
            style={styles.image}
            resizeMode="contain"
          />
        ) : !imgError && category.image ? (
          <Image
            source={{ uri: category.image }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.fallbackWrap}>
            <Icon type={category.fallbackIcon} size={28} />
          </View>
        )}
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: active ? (medColors.isDark ? '#86EFAC' : COLORS.greenDark) : medColors.ink }, active && styles.titleActive]} numberOfLines={2}>
          {category.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: COLORS.greenBorder,
    borderRadius: 16,
    padding: 7,
    marginRight: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 124,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  imageWrap: {
    width: '100%',
    height: 72,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: COLORS.greenPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
  },
  fallbackWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  textWrap: {
    paddingTop: 6,
    paddingBottom: 2,
    paddingHorizontal: 2,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
    lineHeight: 14,
  },
  cardActive: {
    borderColor: COLORS.green,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  imageWrapActive: {
    backgroundColor: '#DCFCE7',
  },
  titleActive: {
    color: COLORS.greenDark,
    fontWeight: '800',
  },
});
