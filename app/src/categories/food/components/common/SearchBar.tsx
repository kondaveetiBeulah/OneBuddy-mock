import React, { useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X, Mic } from 'lucide-react-native';
import { useFilter } from '../../context/FilterContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search dishes, restaurants, or cuisines...',
  onClear,
  autoFocus = false,
}) => {
  const { searchFocusTrigger } = useFilter();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (searchFocusTrigger > 0) {
      inputRef.current?.focus();
    }
  }, [searchFocusTrigger]);

  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View style={styles.container}>
      <Search size={18} color="#6B7280" style={styles.searchIcon} />

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(184, 175, 203, 0.5)"
        autoFocus={autoFocus}
        style={styles.input}
      />

      {value.length > 0 ? (
        <TouchableOpacity onPress={handleClear} style={styles.iconBtn}>
          <X size={16} color="#6B7280" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => onChangeText('Biryani')}
          style={styles.iconBtn}
        >
          <Mic size={16} color="#65A30D" />
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    padding: 0,
  },
  iconBtn: {
    padding: 4,
    marginLeft: 6,
  },
});
