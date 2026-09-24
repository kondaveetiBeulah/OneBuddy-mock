import React, { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";

interface Props {
  photo: string | null;
  onChange: (uri: string | null) => void;
}

export default function PhotoPicker({ photo, onChange }: Props) {
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  // ── Open Web File Input ──
  const openWebFileInput = (captureCamera = false) => {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (captureCamera) {
      input.capture = 'environment';
    }
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPendingPhoto(event.target.result as string);
            setRotationDegrees(0);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    setIsOptionsModalVisible(false);
  };

  // ── Open Device Camera ──
  const handleLaunchCamera = async () => {
    setIsOptionsModalVisible(false);
    if (Platform.OS === 'web') {
      openWebFileInput(true);
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Needed',
          'Please allow camera permissions to take a picture of your grocery order.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPendingPhoto(result.assets[0].uri);
        setRotationDegrees(0);
      }
    } catch (err) {
      console.error('Error opening camera:', err);
      Alert.alert('Camera Error', 'Could not open the camera. Please try selecting from gallery.');
    }
  };

  // ── Open Device Gallery / File Picker ──
  const handleLaunchGallery = async () => {
    setIsOptionsModalVisible(false);
    if (Platform.OS === 'web') {
      openWebFileInput(false);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Please allow access to your photos to attach an image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPendingPhoto(result.assets[0].uri);
        setRotationDegrees(0);
      }
    } catch (err) {
      console.error('Error opening gallery:', err);
    }
  };

  // ── Confirm / Proceed with chosen photo ──
  const handleConfirmPhoto = () => {
    if (pendingPhoto) {
      onChange(pendingPhoto);
      setPendingPhoto(null);
    }
  };

  const handleCancelPending = () => {
    setPendingPhoto(null);
    setRotationDegrees(0);
  };

  const handleRotate = () => {
    setRotationDegrees((prev) => (prev + 90) % 360);
  };

  return (
    <View>
      {/* ── Main Photo Thumbnail Box or Empty Add Button ── */}
      {photo ? (
        <View style={styles.previewContainer}>
          <View style={styles.previewWrap}>
            <Image source={{ uri: photo }} style={styles.preview} />
            <TouchableOpacity
              onPress={() => onChange(null)}
              style={styles.remove}
              accessibilityLabel="Remove photo"
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.changePhotoBtn}
            onPress={() => setIsOptionsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-reverse-outline" size={16} color={colors.primary} />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setIsOptionsModalVisible(true)}
          style={styles.box}
          activeOpacity={0.7}
          accessibilityLabel="Attach photo from camera or gallery"
        >
          <Ionicons name="camera-outline" size={26} color={colors.primary || "#5A8A2E"} />
          <Text style={styles.boxLabel}>Add Photo</Text>
        </TouchableOpacity>
      )}

      {/* ── 1. Photo Source Options Modal (Camera vs Gallery) ── */}
      <Modal
        visible={isOptionsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOptionsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOptionsModalVisible(false)}
        >
          <View style={styles.optionsSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Photo for Feedback</Text>
            <Text style={styles.sheetSubtitle}>
              Take a photo of your order or choose one from your gallery
            </Text>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleLaunchCamera}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="camera" size={22} color={colors.primary} />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Take Photo</Text>
                <Text style={styles.optionDesc}>Use your phone camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleLaunchGallery}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="images" size={22} color="#F57C00" />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Choose from Gallery</Text>
                <Text style={styles.optionDesc}>Select from photos or files</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsOptionsModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── 2. Photo Preview & "PROCEED" Modal ── */}
      <Modal
        visible={!!pendingPhoto}
        transparent
        animationType="slide"
        onRequestClose={handleCancelPending}
      >
        <View style={styles.modalOverlayDark}>
          <View style={styles.proceedModalCard}>
            {/* Header */}
            <View style={styles.proceedHeader}>
              <Text style={styles.proceedTitle}>Photo Preview</Text>
              <TouchableOpacity
                onPress={handleCancelPending}
                style={styles.closeProceedBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.proceedSubtitle}>
              Check your image before attaching it to the feedback.
            </Text>

            {/* Image Preview with optional Rotation */}
            {pendingPhoto && (
              <View style={styles.imagePreviewWrapper}>
                <Image
                  source={{ uri: pendingPhoto }}
                  style={[
                    styles.largePreviewImage,
                    { transform: [{ rotate: `${rotationDegrees}deg` }] },
                  ]}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Action Tools (Rotate / Retake) */}
            <View style={styles.toolsRow}>
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={handleRotate}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.toolBtnText}>Rotate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => {
                  setPendingPhoto(null);
                  setIsOptionsModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-reverse-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.toolBtnText}>Choose Other</Text>
              </TouchableOpacity>
            </View>

            {/* Big Green Proceed Button */}
            <TouchableOpacity
              style={styles.proceedActionBtn}
              onPress={handleConfirmPhoto}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.proceedActionBtnText}>Proceed / Attach Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelProceedBtn}
              onPress={handleCancelPending}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelProceedText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primaryMedium || "#A3C97A",
    borderRadius: 12,
    backgroundColor: colors.primaryLight || "#EDF4E3",
    alignSelf: 'flex-start',
  },
  boxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark || "#3D6B1E",
  },
  previewWrap: {
    width: 68,
    height: 68,
    position: 'relative',
  },
  preview: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight || "#EBF0E2",
  },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E53935",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  // ── Options Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary || '#1A1A1A',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: colors.textMuted || '#8E9AAB',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight || '#EBF0E2',
  },
  optionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary || '#1A1A1A',
  },
  optionDesc: {
    fontSize: 11,
    color: colors.textMuted || '#8E9AAB',
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 6,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary || '#5A6370',
  },

  // ── Proceed Modal Styles ──
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  proceedModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  proceedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  proceedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary || '#1A1A1A',
  },
  closeProceedBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedSubtitle: {
    fontSize: 12,
    color: colors.textMuted || '#8E9AAB',
    marginBottom: 14,
  },
  imagePreviewWrapper: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    backgroundColor: '#111827',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  largePreviewImage: {
    width: '100%',
    height: '100%',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary || '#1A1A1A',
  },
  proceedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary || '#5A8A2E',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  proceedActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelProceedBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelProceedText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted || '#8E9AAB',
  },
});
