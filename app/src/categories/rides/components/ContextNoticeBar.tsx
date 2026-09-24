import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { FONTS, RADIUS } from '../theme';

interface ContextNoticeBarProps {
  message?: string | null;
  type?: 'warning' | 'info' | 'delay';
  onDismiss?: () => void;
}

export function ContextNoticeBar({
  message = 'Slight delay due to heavy rains in your delivery area',
  type = 'warning',
  onDismiss,
}: ContextNoticeBarProps): React.JSX.Element | null {
  const [dismissed, setDismissed] = useState(false);

  if (!message || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const isWarning = type === 'warning' || type === 'delay';
  const bgColor = isWarning ? '#FFF7ED' : '#EFF6FF';
  const borderColor = isWarning ? '#FED7AA' : '#BFDBFE';
  const iconColor = isWarning ? '#EA580C' : '#2563EB';
  const textColor = isWarning ? '#9A3412' : '#1E40AF';
  const badgeColor = isWarning ? '#F97316' : '#3B82F6';

  return (
    <View
      style={[styles.container, { backgroundColor: bgColor, borderColor }]}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <View style={[styles.iconWrap, { backgroundColor: badgeColor + '18' }]}>
        <Icon name="alert" size={16} color={iconColor} strokeWidth={2.4} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: textColor }]}>Delivery Update</Text>
        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      </View>
      <Pressable
        onPress={handleDismiss}
        style={styles.closeBtn}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notice"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="close" size={12} color={textColor} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 14,
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.display,
    marginBottom: 1,
  },
  message: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '500',
    fontFamily: FONTS.body,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
