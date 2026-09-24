import React from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createStyles } from '../../screens/Security/styles';
import { SheetHandle } from '../common/SheetHandle';
import { YellowButton } from '../common/YellowButton';
import { useNativeColors } from '../../constants/colors';

export interface FamilySharingSheetProps {
  visible: boolean;
  onClose: () => void;
  familyInput: string;
  setFamilyInput: (value: string) => void;
  onSendInvite: () => void;
  onCopyLink: () => void;
}

export const FamilySharingSheet = ({
  visible,
  onClose,
  familyInput,
  setFamilyInput,
  onSendInvite,
  onCopyLink,
}: FamilySharingSheetProps) => {
  const COLORS = useNativeColors();
  const styles = createStyles(COLORS);
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
        <Text style={styles.sheetTitle}>Invite family</Text>
        <Text style={styles.sheetDesc}>
          Add a phone number or email address. They'll be able to place and
          track orders on your account.
        </Text>

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Phone or email</Text>
        <TextInput
          style={styles.input}
          placeholder="name@example.com or +91 00000 00000"
          placeholderTextColor={COLORS.grayDim}
          value={familyInput}
          onChangeText={setFamilyInput}
          autoCapitalize="none"
        />

        <YellowButton
          label="Send Invite"
          onPress={onSendInvite}
          disabled={!familyInput.trim()}
          style={{ marginTop: 18 }}
        />

        <TouchableOpacity style={styles.copyLinkRow} onPress={onCopyLink}>
          <Text style={styles.copyLinkIcon}>🔗</Text>
          <Text style={styles.copyLinkText}>Copy invite link instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
  );
};

export default FamilySharingSheet;
