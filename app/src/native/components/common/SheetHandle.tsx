import React from 'react';
import { View } from 'react-native';
import { useNativeColors } from '../../constants/colors';
import { createStyles } from '../../screens/Security/styles';

export const SheetHandle = () => {
  const styles = createStyles(useNativeColors());
  return <View style={styles.sheetHandle} />;
};

export default SheetHandle;
