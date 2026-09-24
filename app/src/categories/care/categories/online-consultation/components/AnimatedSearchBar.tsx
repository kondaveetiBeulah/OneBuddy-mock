import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, useOCColors } from '../constants/colors';

interface AnimatedSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
}

const PLACEHOLDERS = [
  'Search symptoms (e.g., Fever, Cough)...',
  'Search health issue (e.g., Skin Rash, Acne)...',
  'Search doctor name (e.g., Dr. Rajesh)...',
  'Search hospital name (e.g., Apollo, Fortis)...',
  'Search specialties (e.g., Cardiology, Derma)...',
];

export const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  onFocus,
  autoFocus = false,
}) => {
  const [index, setIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (value.length > 0) return;

    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -14,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        translateY.setValue(14);

        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [value, translateY, opacity]);

  const oc = useOCColors();

  return (
    <View style={[styles.container, { backgroundColor: oc.surface, borderColor: oc.border }]}>
      <Ionicons name="search" size={20} color={Colors.primary} style={styles.icon} />
      
      <View style={styles.inputWrapper}>
        {value.length === 0 && (
          <View pointerEvents="none" style={styles.placeholderContainer}>
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.placeholderText,
                {
                  color: oc.textMuted,
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            >
              {PLACEHOLDERS[index]}
            </Animated.Text>
          </View>
        )}
        <TextInput
          style={[styles.input, { color: oc.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          onFocus={onFocus}
          autoFocus={autoFocus}
          placeholder=""
          returnKeyType="search"
          placeholderTextColor="transparent"
        />
      </View>

      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clearButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={18} color={oc.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1.2,
    borderColor: '#E2EDE0',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
  },
  placeholderContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholderText: {
    fontSize: 13,
    color: '#8B9888',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'normal',
    fontWeight: '400',
  },
  input: {
    fontSize: 14,
    color: Colors.textPrimary,
    height: 48,
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
});
