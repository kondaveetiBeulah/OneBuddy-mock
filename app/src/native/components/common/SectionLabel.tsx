import React, { ReactNode } from 'react';
import { Text } from 'react-native';
import { useNativeColors } from '../../constants/colors';
import { createStyles } from '../../screens/Security/styles';

export const SectionLabel = ({ children }: { children: ReactNode }) => {
  const colors = useNativeColors();
  const styles = createStyles(colors);
  return <Text style={styles.sectionLabel}>{children}</Text>;
};

export default SectionLabel;
