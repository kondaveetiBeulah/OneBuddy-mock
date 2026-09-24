import React from 'react';
import { View } from 'react-native';
import { useNativeColors } from '../../constants/colors';
import { createStyles } from '../../screens/Security/styles';

export const Divider = () => {
  const colors = useNativeColors();
  const styles = createStyles(colors);
  return <View style={styles.divider} />;
};

export default Divider;
