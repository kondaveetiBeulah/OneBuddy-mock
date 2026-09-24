import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNativeColors } from '../../constants/colors';
import { createStyles } from '../../screens/Security/styles';
import { SheetHandle } from '../common/SheetHandle';
import { YellowButton } from '../common/YellowButton';

export interface VerifyProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onStartVerification: () => void;
}

export const VerifyProfileSheet = ({
  visible,
  onClose,
  onStartVerification,
}: VerifyProfileSheetProps) => {
  const styles = createStyles(useNativeColors());
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <SheetHandle />
          <View style={styles.verifyIconWrap}>
            <Text style={styles.verifyIcon}>🛡️</Text>
          </View>
          <Text style={styles.sheetTitleCenter}>Verify Your Profile</Text>
          <Text style={styles.sheetDescCenter}>
            Verified users get a trust badge on their profile and faster
            approvals on high-value orders. This usually takes less than a
            minute.
          </Text>
          <YellowButton
            label="Start Verification"
            onPress={onStartVerification}
            style={{ marginTop: 20 }}
          />
          <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
            <Text style={styles.cancelLinkText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default VerifyProfileSheet;
