import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Search, X, Mic } from 'lucide-react-native';
import { useFilter } from '../../context/FilterContext';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

export const DEFAULT_ROTATING_FOOD_ITEMS = [
  'Biryani',
  'Pizza',
  'Burgers',
  'Butter Chicken',
  'Paneer Butter Masala',
  'Dosa',
  'Shawarma',
  'Fried Rice',
  'Noodles',
  'Tandoori Chicken',
  'Momos',
  'Pasta',
  'Rolls',
  'Thali',
  'Desserts',
  'Ice Cream',
];

export const DEFAULT_ROTATING_CATEGORIES = DEFAULT_ROTATING_FOOD_ITEMS;

export interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  placeholderPrefix?: string;
  rotatingItems?: string[];
  rotatingCategories?: string[];
  onSubmitEditing?: () => void;
  onClear?: () => void;
  onPress?: () => void;
  onVoicePress?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  onChangeText,
  placeholder,
  placeholderPrefix = 'Search for ',
  rotatingItems,
  rotatingCategories,
  onSubmitEditing,
  onClear,
  onPress,
  onVoicePress,
  editable = true,
  autoFocus = false,
  style,
}) => {
  const isDark = isCategoryDark();
  const itemsList = rotatingItems || rotatingCategories || DEFAULT_ROTATING_FOOD_ITEMS;
  const [categoryIndex, setCategoryIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const { searchFocusTrigger } = useFilter();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (searchFocusTrigger > 0) {
      inputRef.current?.focus();
    }
  }, [searchFocusTrigger]);

  useEffect(() => {
    if (placeholder) return;
    if (value && value.length > 0) return;
    if (itemsList.length <= 1) return;

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
        setCategoryIndex((prev) => (prev + 1) % itemsList.length);
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
  }, [value, placeholder, itemsList.length]);

  const handleClear = () => {
    if (onChangeText) onChangeText('');
    if (onClear) onClear();
  };

  const handleVoiceOrPick = () => {
    if (onVoicePress) {
      onVoicePress();
    } else if (onChangeText) {
      onChangeText(itemsList[categoryIndex]);
    }
  };

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1D1E22' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
        },
        style,
      ]}
    >
      <Search
        size={18}
        color={isDark ? '#9BA08F' : '#6B7280'}
        style={styles.searchIcon}
      />

      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#9BA08F' : 'rgba(184, 175, 203, 0.5)'}
          autoFocus={autoFocus}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          style={[
            styles.input,
            {
              color: isDark ? '#F1F1EC' : '#111827',
              pointerEvents: (editable ? 'auto' : 'none') as any,
            },
          ]}
        />

        {!placeholder && (!value || value.length === 0) && (
          <View style={[styles.placeholderContainer, { pointerEvents: 'none' as any }]}>
            <Text
              style={[
                styles.placeholderPrefix,
                { color: isDark ? '#9BA08F' : '#6B7280' },
              ]}
            >
              {placeholderPrefix}
            </Text>
            <View style={styles.rollingTextWrapper}>
              <Animated.Text
                style={[
                  styles.placeholderRollingText,
                  {
                    color: isDark ? '#F1F1EC' : '#111827',
                    transform: [{ translateY }],
                    opacity,
                  },
                ]}
                numberOfLines={1}
              >
                "{itemsList[categoryIndex]}"
              </Animated.Text>
            </View>
          </View>
        )}
      </View>

      {/* Clear Text Icon */}
      {value && value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.iconBtn} activeOpacity={0.7}>
          <X size={16} color={isDark ? '#9BA08F' : '#6B7280'} />
        </TouchableOpacity>
      )}

      {/* Voice Assistant Mic Icon */}
      {(!value || value.length === 0) && (
        <TouchableOpacity
          onPress={(e) => {
            e?.stopPropagation?.();
            handleVoiceOrPick();
          }}
          style={[
            styles.micBtn,
            {
              backgroundColor: isDark
                ? 'rgba(101, 163, 13, 0.2)'
                : 'rgba(101, 163, 13, 0.1)',
            },
          ]}
          activeOpacity={0.7}
          accessibilityLabel="Voice Search"
        >
          <Mic size={16} color="#65A30D" />
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
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
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
    fontSize: 14,
  },
  rollingTextWrapper: {
    flex: 1,
    height: 24,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  placeholderRollingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 6,
    marginLeft: 4,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
