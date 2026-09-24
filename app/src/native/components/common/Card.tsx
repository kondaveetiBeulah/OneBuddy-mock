import React, { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useNativeColors } from '../../constants/colors';
import { createStyles } from '../../screens/Security/styles';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card = ({ children, style }: CardProps) => {
  const colors = useNativeColors();
  const styles = createStyles(colors);
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

export default Card;
