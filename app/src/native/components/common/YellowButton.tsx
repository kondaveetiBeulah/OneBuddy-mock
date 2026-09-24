import React from 'react';
import { StyleProp, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useNativeColors } from '../../constants/colors';
import { createStyles } from '../../screens/Security/styles';

export interface YellowButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const YellowButton = ({ label, onPress, disabled, style }: YellowButtonProps) => {
  const styles = createStyles(useNativeColors());
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[styles.yellowBtn, disabled && styles.yellowBtnDisabled, style]}
    >
      <Text style={styles.yellowBtnText}>{label}</Text>
    </TouchableOpacity>
  );
};

export default YellowButton;
