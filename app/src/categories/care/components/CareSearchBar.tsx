import React, { useState, useEffect, useRef, forwardRef } from 'react';
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
  TextInputProps,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';

export const DEFAULT_ROTATING_CARE_ITEMS = [
  'Apollo Hospital',
  'Dolo 650',
  'Yashoda Hospital',
  'Cardiology',
  'Paracetamol',
  'KIMS Hospital',
  'Dermatologist',
  'Pediatrician',
  'Care Hospital',
  'Orthopedics',
  'General Physician',
  'Azithromycin',
  'Neurology',
  'Dental Care',
  'Medicover Hospital',
  'Cough Syrup',
];

export interface CareSearchBarProps extends TextInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  placeholderPrefix?: string;
  rotatingItems?: string[];
  onSubmitEditing?: () => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onPress?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const CareSearchBar = forwardRef<TextInput, CareSearchBarProps>(({
  value = '',
  onChangeText,
  placeholder,
  placeholderPrefix = 'Search for ',
  rotatingItems = DEFAULT_ROTATING_CARE_ITEMS,
  onSubmitEditing,
  onClear,
  onFocus,
  onBlur,
  onPress,
  editable = true,
  autoFocus = false,
  style,
  ...rest
}, ref) => {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const [categoryIndex, setCategoryIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (placeholder) return;
    if (value && value.length > 0) return;
    if (rotatingItems.length <= 1) return;

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
        setCategoryIndex((prev) => (prev + 1) % rotatingItems.length);
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
  }, [value, placeholder, rotatingItems.length]);

  const handleClear = () => {
    if (onChangeText) onChangeText('');
    if (onClear) onClear();
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1D1E22' : '#FFFFFF',
          borderColor: isFocused
            ? '#65A30D'
            : isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : '#E5E7EB',
        },
        style,
      ]}
    >
      <Search
        size={18}
        color={isFocused ? '#65A30D' : isDark ? '#9BA08F' : '#6B7280'}
        style={styles.searchIcon}
      />

      <View style={styles.inputWrapper}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#9BA08F' : 'rgba(184, 175, 203, 0.5)'}
          autoFocus={autoFocus}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
          style={[
            styles.input,
            {
              color: isDark ? '#F1F1EC' : '#111827',
              pointerEvents: (editable ? 'auto' : 'none') as any,
            },
          ]}
          {...rest}
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
                "{rotatingItems[categoryIndex]}"
              </Animated.Text>
            </View>
          </View>
        )}
      </View>

      {/* Clear Text Icon */}
      {value && value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.iconBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Clear search"
        >
          <X size={16} color={isDark ? '#9BA08F' : '#6B7280'} />
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
});

CareSearchBar.displayName = 'CareSearchBar';

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
});

export default CareSearchBar;
