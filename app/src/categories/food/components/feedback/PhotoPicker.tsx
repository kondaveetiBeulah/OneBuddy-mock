import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, X } from "lucide-react-native";
import { colors } from "../theme/colors";

interface Props {
  photo: string | null;
  onChange: (uri: string | null) => void;
}

export default function PhotoPicker({ photo, onChange }: Props) {
  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  };

  if (photo) {
    return (
      <View style={styles.previewWrap}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <TouchableOpacity
          onPress={() => onChange(null)}
          style={styles.remove}
          accessibilityLabel="Remove photo"
        >
          <X size={14} color="#111827" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={pickPhoto} style={styles.box}>
      <Camera size={22} color={colors.photoIcon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 60,
    height: 60,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.photoBoxBorder,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  previewWrap: { width: 60, height: 60 },
  preview: { width: 60, height: 60, borderRadius: 10 },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#111827",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
