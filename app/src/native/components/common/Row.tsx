import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNativeColors } from '../../constants/colors';
import { createStyles } from '../../screens/Security/styles';

export interface RowProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  showChevron?: boolean;
}

export const Row = ({
  title,
  subtitle,
  right,
  onPress,
  disabled,
  showChevron,
}: RowProps) => {
  const colors = useNativeColors();
  const styles = createStyles(colors);
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={styles.row}
    >
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.rowRight}>
        {right}
        {showChevron && <Text style={styles.chevron}>{'>'}</Text>}
      </View>
    </Wrapper>
  );
};

export default Row;
