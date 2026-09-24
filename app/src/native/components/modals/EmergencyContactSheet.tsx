import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createStyles } from '../../screens/Security/styles';
import { SheetHandle } from '../common/SheetHandle';
import { YellowButton } from '../common/YellowButton';
import { useNativeColors } from '../../constants/colors';
import { ContactTab, PhoneContact } from '../../types';

export interface EmergencyContactSheetProps {
  visible: boolean;
  onClose: () => void;
  contactTab: ContactTab;
  setContactTab: (tab: ContactTab) => void;
  manualName: string;
  setManualName: (value: string) => void;
  manualPhone: string;
  setManualPhone: (value: string) => void;
  onSaveManual: () => void;
  contactSearch: string;
  setContactSearch: (value: string) => void;
  filteredContacts: PhoneContact[];
  onPickContact: (contact: PhoneContact) => void;
}

export const EmergencyContactSheet = ({
  visible,
  onClose,
  contactTab,
  setContactTab,
  manualName,
  setManualName,
  manualPhone,
  setManualPhone,
  onSaveManual,
  contactSearch,
  setContactSearch,
  filteredContacts,
  onPickContact,
}: EmergencyContactSheetProps) => {
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
      <View style={[styles.sheet, { maxHeight: '85%' }]}>
        <SheetHandle />
        <Text style={styles.sheetTitle}>Emergency contact</Text>

        {/* tab switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabBtn, contactTab === 'manual' && styles.tabBtnActive]}
            onPress={() => setContactTab('manual')}
          >
            <Text
              style={[
                styles.tabBtnText,
                contactTab === 'manual' && styles.tabBtnTextActive,
              ]}
            >
              Enter Manually
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, contactTab === 'contacts' && styles.tabBtnActive]}
            onPress={() => setContactTab('contacts')}
          >
            <Text
              style={[
                styles.tabBtnText,
                contactTab === 'contacts' && styles.tabBtnTextActive,
              ]}
            >
              Pick from Contacts
            </Text>
          </TouchableOpacity>
        </View>

        {contactTab === 'manual' ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.inputLabel}>Contact name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Aarav Sharma"
              placeholderTextColor={COLORS.grayDim}
              value={manualName}
              onChangeText={setManualName}
            />
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 00000 00000"
              placeholderTextColor={COLORS.grayDim}
              keyboardType="phone-pad"
              value={manualPhone}
              onChangeText={setManualPhone}
            />
            <YellowButton
              label="Save Contact"
              onPress={onSaveManual}
              disabled={!manualName.trim() || !manualPhone.trim()}
              style={{ marginTop: 20 }}
            />
          </View>
        ) : (
          <View style={{ marginTop: 16, flex: 1 }}>
            <TextInput
              style={styles.input}
              placeholder="Search contacts"
              placeholderTextColor={COLORS.grayDim}
              value={contactSearch}
              onChangeText={setContactSearch}
            />
            <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
              {filteredContacts.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.contactRow}
                  onPress={() => onPickContact(c)}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>{c.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactPhone}>{c.phone}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {filteredContacts.length === 0 && (
                <Text style={styles.emptyText}>No contacts found</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  </Modal>
  );
};

export default EmergencyContactSheet;
