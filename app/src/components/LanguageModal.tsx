import React from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Check, X } from "./icons";
import { useAppTheme } from "@/theme/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/i18n/useTranslation";
import { LANGUAGES, languageLabel } from "@/i18n/translations";
import { LanguageOption } from "@/types";

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageModal({ visible, onClose }: LanguageModalProps) {
  const { colors } = useAppTheme();
  const { state, setLanguage } = useSettings();
  const { t } = useTranslation();

  const handleSelect = (option: LanguageOption) => {
    setLanguage(option.code);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel={t("settings_close")}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.sheetBg, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("settings_section_language")}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("settings_close")}
              style={[styles.closeBtn, { backgroundColor: colors.iconBg }]}
            >
              <X size={16} color={colors.text} />
            </Pressable>
          </View>

          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const selected = item.code === state.language;
              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={[
                    styles.row,
                    { borderBottomColor: colors.divider }
                  ]}
                >
                  <Text style={[styles.rowLabel, { color: colors.text }]}>
                    {languageLabel(item)}
                  </Text>
                  {selected ? <Check size={20} color={colors.accentStart} /> : null}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  sheet: {
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 12
  },
  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12
  },
  title: { fontSize: 16, fontWeight: "800" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  list: { paddingHorizontal: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1
  },
  rowLabel: { fontSize: 15, fontWeight: "700" }
});
