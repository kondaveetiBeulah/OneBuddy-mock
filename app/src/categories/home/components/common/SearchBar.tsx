import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import { COLORS, RADII, SPACING, SHADOWS } from '../../theme';

const PLACEHOLDER_PHRASES = [
  'Search "House Cleaning"...',
  'Search "AC Service & Repair"...',
  'Search "Plumbing & Tap Leakage"...',
  'Search "Kitchen Deep Cleaning"...',
  'Search "Water Tank Cleaning"...',
  'Search "Bathroom Cleaning"...',
  'Search "Electrical Repairs"...',
];

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFilterPress?: () => void;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
  useTypewriter?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
  onClear,
  onFilterPress,
  style,
  autoFocus = false,
  useTypewriter = true,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!useTypewriter || placeholder !== undefined) {
      return;
    }

    const currentPhrase = PLACEHOLDER_PHRASES[phraseIndex];
    let typingSpeed = isDeleting ? 35 : 75;

    if (!isDeleting && charIndex === currentPhrase.length) {
      // Pause when full phrase is typed
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
      return () => clearTimeout(timeout);
    } else if (isDeleting && charIndex === 0) {
      // Pause briefly then move to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % PLACEHOLDER_PHRASES.length);
      const timeout = setTimeout(() => {}, 200);
      return () => clearTimeout(timeout);
    }

    const timer = setTimeout(() => {
      if (isDeleting) {
        setCharIndex((prev) => Math.max(0, prev - 1));
        setDisplayText(currentPhrase.substring(0, charIndex - 1));
      } else {
        setCharIndex((prev) => prev + 1);
        setDisplayText(currentPhrase.substring(0, charIndex + 1));
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex, useTypewriter, placeholder]);

  const activePlaceholder = placeholder !== undefined 
    ? placeholder 
    : (displayText || 'Search "House Cleaning"...');

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputWrapper}>
        <Search size={18} color={COLORS.primary} style={styles.searchIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={activePlaceholder}
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
          autoFocus={autoFocus}
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              onChangeText('');
              if (onClear) onClear();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtn}
          >
            <X size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {onFilterPress ? (
        <TouchableOpacity
          onPress={onFilterPress}
          style={styles.filterBtn}
          activeOpacity={0.7}
        >
          <SlidersHorizontal size={18} color={COLORS.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADII.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
});
