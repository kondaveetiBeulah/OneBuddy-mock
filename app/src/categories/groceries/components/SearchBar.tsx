import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, useGroceryColors } from '../theme/colors';
import { typography, spacing } from '../theme';

export const DEFAULT_ROTATING_CATEGORIES = [
  'Groceries',
  'Fruits',
  'Vegetables',
  'Dairy Products',
  'Snacks',
  'House Necessities',
  'Cosmetics',
  'Toys',
  'Stationery',
  'Gifts',
  'Jewellery',
  'Ice Creams',
  'Atta, Rice & Dals',
  'Pet Care',
  'Electronics',
];

interface SearchBarProps {
  placeholder?: string;
  rotatingCategories?: string[];
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
  onClear?: () => void;
  onPress?: () => void;
  onVoicePress?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  rotatingCategories = DEFAULT_ROTATING_CATEGORIES,
  value = '',
  onChangeText,
  onSubmitEditing,
  onClear,
  onPress,
  onVoicePress,
  editable = true,
  autoFocus = false,
  style,
}) => {
  const colors = useGroceryColors();
  const [categoryIndex, setCategoryIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (placeholder) return;
    if (value && value.length > 0) return;

    const interval = setInterval(() => {
      // 1. Move up and fade out current item
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -20,
          duration: 320,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        // 2. Next category item
        setCategoryIndex((prev) => (prev + 1) % rotatingCategories.length);
        // 3. Reset position below
        translateY.setValue(20);
        // 4. Slide in from bottom and fade in
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 360,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [value, placeholder, rotatingCategories.length]);

  const content = (
    <View style={[styles.container, { backgroundColor: colors.inputBg || colors.cardBackground, borderColor: colors.borderLight, shadowColor: colors.shadow }, style]}>
      <Ionicons
        name="search-outline"
        size={20}
        color={colors.primary}
        style={styles.searchIcon}
      />
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary, pointerEvents: (editable ? 'auto' : 'none') as any }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={editable}
          autoFocus={autoFocus}
        />
        {!placeholder && value.length === 0 && (
          <View style={[styles.placeholderContainer, { pointerEvents: 'none' as any }]}>
            <Text style={[styles.placeholderPrefix, { color: colors.textMuted }]}>Search for </Text>
            <View style={styles.rollingTextWrapper}>
              <Animated.Text
                style={[
                  styles.placeholderRollingText, { color: colors.textSecondary },
                  {
                    transform: [{ translateY }],
                    opacity,
                  },
                ]}
                numberOfLines={1}
              >
                "{rotatingCategories[categoryIndex]}"
              </Animated.Text>
            </View>
          </View>
        )}
      </View>

      {/* Clear Text Icon */}
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted as string} />
        </TouchableOpacity>
      )}

      {/* Voice Assistant Mic Icon */}
      {onVoicePress && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            onVoicePress();
          }}
          style={[styles.micBtn, { backgroundColor: colors.primaryLight }]}
          activeOpacity={0.7}
          accessibilityLabel="Voice Search"
        >
          <Ionicons name="mic" size={18} color={colors.primary as string} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (!editable && onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.inputBg || colors.cardBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowColor: colors.shadow,
    elevation: 2,
    marginVertical: spacing.xs,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.sm,
    paddingVertical: 0,
  },
  placeholderContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderPrefix: {
    fontSize: typography.sizes.sm,
  },
  rollingTextWrapper: {
    flex: 1,
    height: 26,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  placeholderRollingText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 4,
    marginLeft: 2,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
