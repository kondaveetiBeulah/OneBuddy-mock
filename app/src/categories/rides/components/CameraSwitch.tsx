import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CameraMode } from '../tracking/engine';
import { COLORS, FONTS, GUTTER } from '../theme';

interface CameraSwitchProps {
  cameraMode: CameraMode;
  onSelectMode: (mode: CameraMode) => void;
}

const MODES: CameraMode[] = ['follow', 'route'];

export function CameraSwitch({ cameraMode, onSelectMode }: CameraSwitchProps): React.JSX.Element {
  return (
    <View style={styles.camSwitch}>
      {MODES.map((mode) => {
        const active = cameraMode === mode;
        return (
          <Pressable
            key={mode}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelectMode(mode)}
            style={[styles.camBtn, active && styles.camBtnOn]}
          >
            <Text style={[styles.camText, active && styles.camTextOn]}>
              {mode === 'follow' ? 'Follow' : 'Route'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  camSwitch: {
    position: 'absolute',
    right: GUTTER,
    bottom: 18,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E0EAE0',
    shadowColor: '#182017',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  camBtn: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 11 },
  camBtnOn: { backgroundColor: COLORS.primary },
  camText: { color: COLORS.mistDim, fontSize: 12, fontWeight: '700', fontFamily: FONTS.body },
  camTextOn: { color: '#FFFFFF' },
});
