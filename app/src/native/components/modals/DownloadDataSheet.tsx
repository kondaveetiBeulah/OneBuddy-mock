import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNativeColors } from '../../constants/colors';
import { createStyles } from '../../screens/Security/styles';
import { SheetHandle } from '../common/SheetHandle';
import { YellowButton } from '../common/YellowButton';
import { ExportFormat } from '../../types';

export interface DownloadDataSheetProps {
  visible: boolean;
  onClose: () => void;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  onRequestExport: () => void;
}

export const DownloadDataSheet = ({
  visible,
  onClose,
  exportFormat,
  setExportFormat,
  onRequestExport,
}: DownloadDataSheetProps) => {
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
          <Text style={styles.sheetTitle}>Download my data</Text>
          <Text style={styles.sheetDesc}>
            Choose a format for your export. We'll email you a secure download
            link.
          </Text>

          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[styles.formatOption, exportFormat === 'PDF' && styles.formatOptionActive]}
              onPress={() => setExportFormat('PDF')}
            >
              <Text style={styles.formatIcon}>📄</Text>
              <Text
                style={[styles.formatLabel, exportFormat === 'PDF' && styles.formatLabelActive]}
              >
                PDF
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formatOption, exportFormat === 'JSON' && styles.formatOptionActive]}
              onPress={() => setExportFormat('JSON')}
            >
              <Text style={styles.formatIcon}>{'{ }'}</Text>
              <Text
                style={[styles.formatLabel, exportFormat === 'JSON' && styles.formatLabelActive]}
              >
                JSON
              </Text>
            </TouchableOpacity>
          </View>

          <YellowButton
            label="Request Export"
            onPress={onRequestExport}
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default DownloadDataSheet;
