import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';

// Safely load the native Voice library when running on iOS/Android
let Voice: any = null;
if (Platform.OS !== 'web') {
  try {
    const voiceModule = require('@react-native-voice/voice');
    Voice = voiceModule.default || voiceModule;
  } catch (e) {
    Voice = null;
  }
}

interface VoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onResult: (spokenText: string) => void;
}

const SAMPLE_SUGGESTIONS = [
  'Fresh Apples',
  'Amul Milk',
  'Tomatoes',
  'Basmati Rice',
  'Butter',
  'Snacks',
  'Farm Bread',
  'Eggs',
];

export const cleanVoiceQuery = (rawText: string): string => {
  let text = rawText.trim();
  text = text.replace(
    /^(search for|search|find|show me|look for|buy|get me|i want|give me|bring me)\s+/i,
    ''
  );
  text = text.replace(/[.,?!]+$/, '').trim();
  return text || rawText.trim();
};

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  visible,
  onClose,
  onResult,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const recognitionRef = useRef<any>(null); // For Web
  const transcriptRef = useRef<string>('');
  const autoSubmitTimerRef = useRef<any>(null);
  const isSubmittedRef = useRef<boolean>(false);

  // Pulse Waveform animation loop
  useEffect(() => {
    if (visible && isListening) {
      const createPulse = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1.45,
              duration: 900,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 900,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ])
        );
      };

      const p1 = createPulse(pulseAnim1, 0);
      const p2 = createPulse(pulseAnim2, 300);
      const p3 = createPulse(pulseAnim3, 600);

      p1.start();
      p2.start();
      p3.start();

      return () => {
        p1.stop();
        p2.stop();
        p3.stop();
      };
    }
  }, [visible, isListening]);

  // Configure Native Voice Listeners (iOS / Android)
  useEffect(() => {
    if (Platform.OS !== 'web' && Voice) {
      Voice.onSpeechStart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      Voice.onSpeechEnd = () => {
        setIsListening(false);
      };

      Voice.onSpeechError = (e: any) => {
        setIsListening(false);
        const err = e?.error?.message || e?.error?.code || 'Voice recognition error.';
        if (!transcriptRef.current) {
          setErrorMessage('No speech recognized. Please tap the mic and try again.');
        }
      };

      Voice.onSpeechResults = (e: any) => {
        const text = e?.value?.[0] || '';
        if (text) {
          setLiveTranscript(text);
          transcriptRef.current = text;

          if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
          autoSubmitTimerRef.current = setTimeout(() => {
            handleCompleteRecognition(text);
          }, 1100);
        }
      };

      Voice.onSpeechPartialResults = (e: any) => {
        const text = e?.value?.[0] || '';
        if (text) {
          setLiveTranscript(text);
          transcriptRef.current = text;
        }
      };
    }

    return () => {
      if (Platform.OS !== 'web' && Voice) {
        try {
          Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
        } catch (e) {}
      }
    };
  }, []);

  // Modal Visibility Lifecycle
  useEffect(() => {
    if (visible) {
      setLiveTranscript('');
      transcriptRef.current = '';
      setErrorMessage(null);
      isSubmittedRef.current = false;
      startVoiceRecognition();
    } else {
      stopVoiceRecognition();
    }

    return () => {
      stopVoiceRecognition();
    };
  }, [visible]);

  const startVoiceRecognition = async () => {
    if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);

    setErrorMessage(null);
    transcriptRef.current = '';
    setLiveTranscript('');
    isSubmittedRef.current = false;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // ── Web Speech Recognition API ──
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsListening(false);
        const isSecure = window.isSecureContext ?? (window.location?.protocol === 'https:' || window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');
        if (!isSecure && window.location?.hostname !== 'localhost' && window.location?.hostname !== '127.0.0.1') {
          setErrorMessage(
            'Voice search requires HTTPS on mobile browsers. Please access via HTTPS or tap a suggestion.'
          );
        } else {
          setErrorMessage(
            'Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.'
          );
        }
        return;
      }

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
          recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        const deviceLang =
          typeof navigator !== 'undefined' && navigator.language
            ? navigator.language
            : 'en-IN';
        recognition.lang = deviceLang;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = 0; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              final += (res[0]?.transcript || '') + ' ';
            } else {
              interim += (res[0]?.transcript || '');
            }
          }

          const currentSpoken = (final + interim).trim();
          if (currentSpoken) {
            setLiveTranscript(currentSpoken);
            transcriptRef.current = currentSpoken;

            if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
            autoSubmitTimerRef.current = setTimeout(() => {
              handleCompleteRecognition(currentSpoken);
            }, 1100);
          }
        };

        recognition.onerror = (event: any) => {
          const errorType = event.error;
          if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
            setIsListening(false);
            setErrorMessage('Microphone access denied. Please allow microphone permissions in browser settings.');
          } else if (errorType === 'no-speech') {
            setIsListening(false);
            if (!transcriptRef.current) {
              setErrorMessage('No speech detected. Tap microphone to speak again.');
            }
          } else if (errorType === 'network') {
            setIsListening(false);
            setErrorMessage('Network connection error. Check your internet.');
          } else if (errorType !== 'aborted') {
            setIsListening(false);
            if (!transcriptRef.current) {
              setErrorMessage('Could not recognize voice. Tap mic to retry.');
            }
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (transcriptRef.current && !isSubmittedRef.current) {
            handleCompleteRecognition(transcriptRef.current);
          }
        };

        recognition.start();
      } catch (e: any) {
        setIsListening(false);
        setErrorMessage('Could not activate microphone. Tap the mic to retry.');
      }
    } else {
      // ── Native Mobile (iOS / Android) ──
      if (!Voice) {
        setIsListening(true);
        setErrorMessage('Listening... Tap a suggestion below or search term.');
        return;
      }

      try {
        setErrorMessage(null);
        await Voice.stop().catch(() => {});
        await Voice.start('en-IN');
        setIsListening(true);
      } catch (e: any) {
        console.warn('Native voice start error:', e);
        setIsListening(false);
        setErrorMessage('Microphone permission required. Tap a suggestion or retry.');
      }
    }
  };

  const stopVoiceRecognition = async () => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }

    if (Platform.OS === 'web') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    } else {
      if (Voice) {
        try {
          await Voice.stop();
        } catch (e) {}
      }
    }
    setIsListening(false);
  };

  const handleCompleteRecognition = (text: string) => {
    if (isSubmittedRef.current) return;
    const cleaned = cleanVoiceQuery(text);
    if (cleaned) {
      isSubmittedRef.current = true;
      stopVoiceRecognition();
      onResult(cleaned);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    isSubmittedRef.current = true;
    stopVoiceRecognition();
    onResult(suggestion);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.title}>Voice Search</Text>
          <Text style={styles.subtitle}>
            {isListening
              ? 'Listening... Speak the product name clearly'
              : errorMessage || 'Tap microphone to speak'}
          </Text>

          <View style={styles.micWrapper}>
            {isListening && (
              <>
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    styles.ripple3,
                    { transform: [{ scale: pulseAnim3 }] },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    styles.ripple2,
                    { transform: [{ scale: pulseAnim2 }] },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    styles.ripple1,
                    { transform: [{ scale: pulseAnim1 }] },
                  ]}
                />
              </>
            )}

            <TouchableOpacity
              style={[
                styles.micCircle,
                isListening ? styles.micCircleActive : styles.micCircleInactive,
              ]}
              onPress={() =>
                isListening ? stopVoiceRecognition() : startVoiceRecognition()
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={38}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.transcriptBox}>
            {liveTranscript ? (
              <Text style={styles.liveTranscriptText}>"{liveTranscript}"</Text>
            ) : errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
              <Text style={styles.waitingText}>
                Say "Fresh Apples", "Amul Milk", "Tomatoes", "Rice"...
              </Text>
            )}
          </View>

          {liveTranscript.length > 0 && (
            <TouchableOpacity
              style={styles.searchNowBtn}
              onPress={() => handleCompleteRecognition(liveTranscript)}
              activeOpacity={0.85}
            >
              <Ionicons name="search" size={16} color={colors.white} />
              <Text style={styles.searchNowBtnText}>
                Search "{cleanVoiceQuery(liveTranscript)}"
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />
          <Text style={styles.suggestionsLabel}>Or tap a quick product:</Text>
          <View style={styles.chipsRow}>
            {SAMPLE_SUGGESTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.suggestionChip}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.75}
              >
                <Text style={styles.suggestionChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 18, 30, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  micWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  rippleCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
  },
  ripple1: { opacity: 0.25 },
  ripple2: { opacity: 0.15 },
  ripple3: { opacity: 0.08 },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },
  micCircleActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
  },
  micCircleInactive: {
    backgroundColor: colors.textMuted,
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  transcriptBox: {
    minHeight: 48,
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  liveTranscriptText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12.5,
    color: colors.danger,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  searchNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 10,
  },
  searchNowBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    width: '100%',
    marginVertical: 10,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primaryMedium,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});