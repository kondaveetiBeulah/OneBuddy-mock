import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../theme/styles';
import { useApp } from '../context/AppContext';

export default function ToastOverlay() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{toast}</Text>
    </View>
  );
}
