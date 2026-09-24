import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { createStyles } from './styles';
import { useNativeColors } from '../../constants/colors';
import { MOCK_PHONE_CONTACTS } from '../../constants/mockData';
import {
  ContactTab,
  EmergencyContact,
  ExportFormat,
  SecurityPrivacyScreenProps,
  SecurityPrivacyValues,
} from '../../types';
import { useToast } from '../../hooks/useToast';

import { SectionLabel } from '../../components/common/SectionLabel';
import { Card } from '../../components/common/Card';
import { Divider } from '../../components/common/Divider';
import { Row } from '../../components/common/Row';
import { Toast } from '../../components/common/Toast';

import { VerifyProfileSheet } from '../../components/modals/VerifyProfileSheet';
import { EmergencyContactSheet } from '../../components/modals/EmergencyContactSheet';
import { FamilySharingSheet } from '../../components/modals/FamilySharingSheet';
import { DownloadDataSheet } from '../../components/modals/DownloadDataSheet';

export default function SecurityPrivacyScreen({
  navigation,
  initialValues,
  onValuesChange,
}: SecurityPrivacyScreenProps) {
  const COLORS = useNativeColors();
  const styles = createStyles(COLORS);

  /* ---------------- toggles ---------------- */
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(
    initialValues?.biometric ?? true
  );
  const [verifiedProfile, setVerifiedProfile] = useState<boolean>(
    initialValues?.verifiedProfile ?? true
  );
  const [familySharing, setFamilySharing] = useState<boolean>(
    initialValues?.familySharing ?? false
  );

  /* ---------------- emergency contact ---------------- */
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: initialValues?.emergencyContact || 'Aarav',
    phone: '+91 98765 43210',
  });
  const [emergencyModalVisible, setEmergencyModalVisible] = useState<boolean>(false);
  const [contactTab, setContactTab] = useState<ContactTab>('manual');
  const [manualName, setManualName] = useState<string>('');
  const [manualPhone, setManualPhone] = useState<string>('');
  const [contactSearch, setContactSearch] = useState<string>('');

  /* ---------------- verification sheet ---------------- */
  const [verifyModalVisible, setVerifyModalVisible] = useState<boolean>(false);

  /* ---------------- family sharing ---------------- */
  const [familyModalVisible, setFamilyModalVisible] = useState<boolean>(false);
  const [familyInput, setFamilyInput] = useState<string>('');

  /* ---------------- download data ---------------- */
  const [downloadModalVisible, setDownloadModalVisible] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('PDF');

  /* ---------------- toast ---------------- */
  const { toastVisible, toastMessage, toastAnim, showToast } = useToast();

  /* ---------------- report changes back to the host ---------------- */
  const lastReportedRef = useRef<string>('');

  useEffect(() => {
    if (!onValuesChange) return;
    const values: SecurityPrivacyValues = {
      biometric: biometricEnabled,
      verifiedProfile,
      familySharing,
      emergencyContact: emergencyContact.name,
    };
    const key = JSON.stringify(values);
    if (key === lastReportedRef.current) return;
    lastReportedRef.current = key;
    onValuesChange(values);
  }, [
    biometricEnabled,
    verifiedProfile,
    familySharing,
    emergencyContact.name,
    onValuesChange,
  ]);

  /* ---------------- handlers: biometric ---------------- */
  const handleBiometricToggle = (value: boolean) => {
    if (value) {
      setBiometricEnabled(true);
      Alert.alert(
        'Face ID / Touch ID',
        'Confirm your identity to enable biometric login.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setBiometricEnabled(false),
          },
          {
            text: 'Authenticate',
            onPress: () => showToast('Biometric login enabled'),
          },
        ],
        { cancelable: true, onDismiss: () => setBiometricEnabled(false) }
      );
    } else {
      setBiometricEnabled(false);
      showToast('Biometric login disabled');
    }
  };

  /* ---------------- handlers: verified profile ---------------- */
  const handleVerifiedToggle = (value: boolean) => {
    if (value && !verifiedProfile) {
      setVerifyModalVisible(true);
      return;
    }
    setVerifiedProfile(value);
    showToast(value ? 'Verified profile updated' : 'Verified profile turned off');
  };

  const startVerification = () => {
    setVerifyModalVisible(false);
    setVerifiedProfile(true);
    showToast('Verification started. We will notify you once approved.');
  };

  /* ---------------- handlers: family sharing ---------------- */
  const handleFamilyToggle = (value: boolean) => {
    setFamilySharing(value);
    if (value) {
      setFamilyModalVisible(true);
    } else {
      showToast();
    }
  };

  const sendFamilyInvite = () => {
    if (!familyInput.trim()) return;
    setFamilyModalVisible(false);
    setFamilyInput('');
    showToast('Family invite sent');
  };

  const copyFamilyLink = () => {
    showToast('Invite link copied');
  };

  /* ---------------- handlers: emergency contact ---------------- */
  const openEmergencyModal = () => {
    setContactTab('manual');
    setManualName('');
    setManualPhone('');
    setContactSearch('');
    setEmergencyModalVisible(true);
  };

  const saveManualContact = () => {
    if (!manualName.trim() || !manualPhone.trim()) return;
    setEmergencyContact({ name: manualName.trim(), phone: manualPhone.trim() });
    setEmergencyModalVisible(false);
    showToast('Emergency contact updated');
  };

  const pickContact = (contact: { name: string; phone: string }) => {
    setEmergencyContact({ name: contact.name.split(' ')[0], phone: contact.phone });
    setEmergencyModalVisible(false);
    showToast('Emergency contact updated');
  };

  const filteredContacts = MOCK_PHONE_CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  /* ---------------- handlers: password / data ---------------- */
  const handleChangePassword = () => {
    Alert.alert(
      'Reset link sent',
      "A password reset link has been sent to your registered email address."
    );
  };

  const requestExport = () => {
    setDownloadModalVisible(false);
    showToast(`Export requested (${exportFormat}). We will email you a link.`);
  };

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <View style={styles.screen}>
      {/* ---------- Header ---------- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation && navigation.goBack && navigation.goBack()}
        >
          <Text style={styles.headerIconText}>{'‹'}</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Security & privacy</Text>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation && navigation.goBack && navigation.goBack()}
        >
          <Text style={styles.headerIconText}>{'✕'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subHeader}>
          Changes save automatically across all your OneBuddy services.
        </Text>

        {/* ---------- SIGNING IN ---------- */}
        <SectionLabel>SIGNING IN</SectionLabel>
        <Card>
          <Row
            title="Biometric login"
            subtitle="Face or fingerprint instead of a password"
            right={
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: 'rgba(255,255,255,0.14)', true: COLORS.accent }}
                thumbColor={COLORS.white}
                ios_backgroundColor="rgba(255,255,255,0.14)"
              />
            }
          />
          <Divider />
          <Row
            title="Verified profile"
            subtitle="Trust badge and faster order approvals"
            right={
              <Switch
                value={verifiedProfile}
                onValueChange={handleVerifiedToggle}
                trackColor={{ false: 'rgba(255,255,255,0.14)', true: COLORS.accent }}
                thumbColor={COLORS.white}
                ios_backgroundColor="rgba(255,255,255,0.14)"
              />
            }
          />
        </Card>

        {/* ---------- TRUSTED PEOPLE ---------- */}
        <SectionLabel>TRUSTED PEOPLE</SectionLabel>
        <Card>
          <Row
            title="Emergency contact"
            subtitle="Someone we can reach about a delivery"
            right={
              <TouchableOpacity style={styles.pillBtn} onPress={openEmergencyModal}>
                <Text style={styles.pillBtnText}>{emergencyContact.name}</Text>
              </TouchableOpacity>
            }
          />
          <Divider />
          <Row
            title="Family sharing"
            subtitle="Let trusted family place and track orders"
            right={
              <Switch
                value={familySharing}
                onValueChange={handleFamilyToggle}
                trackColor={{ false: 'rgba(255,255,255,0.14)', true: COLORS.accent }}
                thumbColor={COLORS.white}
                ios_backgroundColor="rgba(255,255,255,0.14)"
              />
            }
          />
        </Card>

        {/* ---------- YOUR DATA ---------- */}
        <SectionLabel>YOUR DATA</SectionLabel>
        <Card>
          <Row
            title="Change password"
            subtitle="We'll email you a secure reset link"
            onPress={handleChangePassword}
            showChevron
          />
          <Divider />
          <Row
            title="Download my data"
            subtitle="A copy of your orders, addresses, and profile"
            onPress={() => setDownloadModalVisible(true)}
            showChevron
          />
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast visible={toastVisible} message={toastMessage} anim={toastAnim} />

      <VerifyProfileSheet
        visible={verifyModalVisible}
        onClose={() => setVerifyModalVisible(false)}
        onStartVerification={startVerification}
      />

      <EmergencyContactSheet
        visible={emergencyModalVisible}
        onClose={() => setEmergencyModalVisible(false)}
        contactTab={contactTab}
        setContactTab={setContactTab}
        manualName={manualName}
        setManualName={setManualName}
        manualPhone={manualPhone}
        setManualPhone={setManualPhone}
        onSaveManual={saveManualContact}
        contactSearch={contactSearch}
        setContactSearch={setContactSearch}
        filteredContacts={filteredContacts}
        onPickContact={pickContact}
      />

      <FamilySharingSheet
        visible={familyModalVisible}
        onClose={() => setFamilyModalVisible(false)}
        familyInput={familyInput}
        setFamilyInput={setFamilyInput}
        onSendInvite={sendFamilyInvite}
        onCopyLink={copyFamilyLink}
      />

      <DownloadDataSheet
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        onRequestExport={requestExport}
      />
    </View>
  );
}
