import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useHomeTheme, RADII, SPACING, SHADOWS } from '../../theme';

interface ModalContainerProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  hideHeader?: boolean;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  contentStyle,
  hideHeader = false,
}) => {
  const { colors } = useHomeTheme();
  const showHeader = !hideHeader && (!!title || !!subtitle);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.backdrop }]}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[styles.sheetContent, { backgroundColor: colors.surface }, contentStyle]}
            >
              {/* Drag Handle Indicator */}
              <View style={[styles.handleBar, { backgroundColor: colors.borderDark }]} />

              {showHeader && (
                <View style={styles.headerRow}>
                  <View style={styles.titleWrapper}>
                    {title ? <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text> : null}
                    {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.body}>{children}</View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.xxl,
    maxHeight: '85%',
    ...SHADOWS.float,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: RADII.pill,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  titleWrapper: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    marginTop: SPACING.xs,
  },
});
