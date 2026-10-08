import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand, schemes } from '@/design/tokens';
import { useAppTheme } from '@/theme/ThemeContext';
import { useNetwork } from '@/context/NetworkContext';

export interface NetworkErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void | Promise<void>;
  fullscreen?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  customActionText?: string;
}

export const NetworkErrorState: React.FC<NetworkErrorStateProps> = ({
  title = 'No Internet Connection',
  message = 'We could not connect to OneBuddy services. Please check your Wi-Fi or mobile data and try again.',
  onRetry,
  fullscreen = true,
  compact = false,
  style,
  customActionText = 'Retry Connection',
}) => {
  const { scheme } = useAppTheme();
  const tokens = schemes[scheme];
  const { checkConnection } = useNetwork();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await checkConnection();
      if (onRetry) {
        await onRetry();
      }
    } finally {
      // Keep spinner briefly for smooth feedback
      setTimeout(() => {
        setRetrying(false);
      }, 500);
    }
  };

  const isDark = scheme === 'dark';
  const iconBg = isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2';
  const iconColor = isDark ? '#F87171' : '#EF4444';
  const containerBg = fullscreen ? tokens.bgDeep : tokens.surface1;

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          {
            backgroundColor: tokens.surface1,
            borderColor: tokens.ink(0.08),
          },
          style,
        ]}
      >
        <View style={[styles.compactIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name="cloud-offline-outline" size={20} color={iconColor} />
        </View>
        <View style={styles.compactTextWrap}>
          <Text style={[styles.compactTitle, { color: tokens.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.compactMessage, { color: tokens.textDim }]} numberOfLines={1}>
            {message}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.compactRetryBtn, { backgroundColor: brand.gold }]}
          onPress={handleRetry}
          disabled={retrying}
          activeOpacity={0.8}
        >
          {retrying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.compactRetryText}>Retry</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        fullscreen ? styles.fullscreenContainer : styles.cardContainer,
        { backgroundColor: containerBg },
        style,
      ]}
    >
      {/* Pulse Outer Circle */}
      <View style={[styles.pulseCircle, { backgroundColor: iconBg }]}>
        <View style={[styles.innerCircle, { backgroundColor: isDark ? '#2D1B1F' : '#FEE2E2' }]}>
          <Ionicons name="cloud-offline-outline" size={44} color={iconColor} />
        </View>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: tokens.text }]}>{title}</Text>

      {/* Description */}
      <Text style={[styles.message, { color: tokens.textDim }]}>{message}</Text>

      {/* Retry Action Button */}
      <TouchableOpacity
        style={[styles.retryBtn, { backgroundColor: brand.gold }]}
        onPress={handleRetry}
        disabled={retrying}
        activeOpacity={0.85}
      >
        {retrying ? (
          <View style={styles.btnContent}>
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryBtnText}>Reconnecting...</Text>
          </View>
        ) : (
          <View style={styles.btnContent}>
            <Ionicons name="reload" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryBtnText}>{customActionText}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Helpful Status Tip */}
      <View style={[styles.tipBox, { backgroundColor: tokens.surface2, borderColor: tokens.ink(0.06) }]}>
        <Ionicons name="information-circle-outline" size={16} color={tokens.textDim} />
        <Text style={[styles.tipText, { color: tokens.textDim }]}>
          Tip: Toggle Airplane mode or verify mobile data permissions.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  pulseCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 320,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    minWidth: 190,
    shadowColor: brand.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 340,
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  // Compact Bar Styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 12,
  },
  compactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTextWrap: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  compactMessage: {
    fontSize: 11,
    marginTop: 2,
  },
  compactRetryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  compactRetryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
