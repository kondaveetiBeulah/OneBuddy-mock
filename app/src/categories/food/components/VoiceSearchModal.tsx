import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import type { Restaurant } from '../types';

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

export interface ParsedVoiceQuery {
  cleanedText: string;
  matchedRestaurant?: Restaurant;
  matchedItemQuery?: string;
  isSpecificItemInRestaurant: boolean;
}

export const cleanFoodVoiceQuery = (rawText: string): string => {
  let text = rawText.trim();
  text = text.replace(
    /^(search for|search|find|show me|look for|order|order me|get me|i want|give me|bring me|take me to|open)\s+/i,
    ''
  );
  text = text.replace(/[.,?!]+$/, '').trim();
  text = text.replace(/\bmefil\b/gi, 'Mehfil');
  return text || rawText.trim();
};

/**
 * Parses spoken food query for:
 * 1. Specific item in specific restaurant (e.g. "Biryani from Paradise", "Paradise Biryani", "Pizza at Pizza House")
 * 2. Restaurant only (e.g. "Paradise", "Bawarchi", "Blue Sea Restaurant", "Mehfil")
 * 3. Food item / cuisine only (e.g. "Biryani", "Butter Chicken", "Pizza")
 */
export function parseFoodVoiceQuery(
  rawQuery: string,
  restaurants: Restaurant[] = []
): ParsedVoiceQuery {
  const cleaned = cleanFoodVoiceQuery(rawQuery);
  const lower = cleaned.toLowerCase().trim();

  // Helper to match restaurant by name
  const findRestaurant = (target: string): Restaurant | undefined => {
    let t = target.toLowerCase().trim();
    if (!t) return undefined;
    if (t === 'mefil' || t === 'mefil restaurant') t = 'mehfil';
    return restaurants.find((r) => {
      const rName = r.name.toLowerCase();
      const rId = r.id.toLowerCase();
      return (
        rName === t ||
        rName.replace(/\s+restaurant$/i, '') === t ||
        (t === 'mehfil' && (rName.includes('mehfil') || rName.includes('mefil') || rId.includes('mefil'))) ||
        rName.includes(t) ||
        t.includes(rName.replace(/\s+restaurant$/i, ''))
      );
    });
  };

  // Pattern 1: "<item> from/in/at <restaurant>"
  const prepMatch = lower.match(/^(.+?)\s+(?:from|in|at)\s+(.+)$/i);
  if (prepMatch) {
    const itemPart = prepMatch[1].trim();
    const restPart = prepMatch[2].trim();
    const matchedRest = findRestaurant(restPart);
    if (matchedRest) {
      return {
        cleanedText: cleaned,
        matchedRestaurant: matchedRest,
        matchedItemQuery: itemPart,
        isSpecificItemInRestaurant: true,
      };
    }
  }

  // Pattern 2: "<restaurant>'s <item>"
  const possessiveMatch = lower.match(/^(.+?)(?:'s|s)\s+(.+)$/i);
  if (possessiveMatch) {
    const restPart = possessiveMatch[1].trim();
    const itemPart = possessiveMatch[2].trim();
    const matchedRest = findRestaurant(restPart);
    if (matchedRest) {
      return {
        cleanedText: cleaned,
        matchedRestaurant: matchedRest,
        matchedItemQuery: itemPart,
        isSpecificItemInRestaurant: true,
      };
    }
  }

  // Pattern 3: Starts with a known restaurant name, followed by dish
  // E.g. "Paradise Biryani", "Bawarchi Chicken Tikka", "Pizza House Margherita"
  for (const r of restaurants) {
    const baseName = r.name.toLowerCase().replace(/\s+restaurant$/i, '').trim();
    if (lower.startsWith(baseName) && lower.length > baseName.length) {
      const remainder = lower.slice(baseName.length).trim().replace(/^restaurant\s+/i, '');
      if (remainder.length > 0) {
        return {
          cleanedText: cleaned,
          matchedRestaurant: r,
          matchedItemQuery: remainder,
          isSpecificItemInRestaurant: true,
        };
      }
    }
  }

  // Pattern 4: Whole query is a restaurant name (or "open <restaurant>")
  const fullRestMatch = findRestaurant(lower);
  if (fullRestMatch) {
    return {
      cleanedText: cleaned,
      matchedRestaurant: fullRestMatch,
      matchedItemQuery: undefined,
      isSpecificItemInRestaurant: false,
    };
  }

  // Pattern 5: General item / cuisine
  return {
    cleanedText: cleaned,
    matchedRestaurant: undefined,
    matchedItemQuery: cleaned,
    isSpecificItemInRestaurant: false,
  };
}

export interface VoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onResult: (spokenText: string) => void;
  restaurants?: Restaurant[];
}

const SAMPLE_FOOD_SUGGESTIONS = [
  { label: 'Biryani', type: 'dish', icon: 'restaurant-outline' },
  { label: 'Paradise Restaurant', type: 'restaurant', icon: 'business-outline' },
  { label: 'Mehfil', type: 'restaurant', icon: 'business-outline' },
  { label: 'Pizza', type: 'dish', icon: 'pizza-outline' },
  { label: 'Bawarchi', type: 'restaurant', icon: 'business-outline' },
  { label: 'Biryani from Mehfil', type: 'combo', icon: 'sparkles-outline' },
  { label: 'Butter Chicken', type: 'dish', icon: 'fast-food-outline' },
  { label: 'Pizza House', type: 'restaurant', icon: 'business-outline' },
  { label: 'Paneer Butter Masala', type: 'dish', icon: 'restaurant-outline' },
  { label: 'Blue Sea Restaurant', type: 'restaurant', icon: 'business-outline' },
  { label: 'Burgers', type: 'dish', icon: 'fast-food-outline' },
  { label: 'Dosa', type: 'dish', icon: 'restaurant-outline' },
  { label: 'Biryani from Paradise', type: 'combo', icon: 'sparkles-outline' },
  { label: 'Shawarma', type: 'dish', icon: 'fast-food-outline' },
];

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  visible,
  onClose,
  onResult,
  restaurants = [],
}) => {
  const isDark = isCategoryDark();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'dishes' | 'restaurants'>('all');

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
        const isSecure =
          window.isSecureContext ??
          (window.location?.protocol === 'https:' ||
            window.location?.hostname === 'localhost' ||
            window.location?.hostname === '127.0.0.1');
        if (
          !isSecure &&
          window.location?.hostname !== 'localhost' &&
          window.location?.hostname !== '127.0.0.1'
        ) {
          setErrorMessage(
            'Voice search requires HTTPS on mobile browsers. Please tap a suggestion or use HTTPS.'
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
              interim += res[0]?.transcript || '';
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
            setErrorMessage('Microphone access denied. Please allow microphone permissions.');
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
    const cleaned = cleanFoodVoiceQuery(text);
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

  const filteredSuggestions = SAMPLE_FOOD_SUGGESTIONS.filter((item) => {
    if (selectedFilter === 'dishes') return item.type === 'dish' || item.type === 'combo';
    if (selectedFilter === 'restaurants') return item.type === 'restaurant';
    return true;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#1D1E22' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.closeBtn,
              { backgroundColor: isDark ? '#2A2B30' : '#F3F4F6' },
            ]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close"
              size={22}
              color={isDark ? '#F1F1EC' : '#6B7280'}
            />
          </TouchableOpacity>

          <Text style={[styles.title, { color: isDark ? '#F1F1EC' : '#111827' }]}>
            Food Voice Search
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9BA08F' : '#6B7280' }]}>
            {isListening
              ? 'Listening... Speak a dish, restaurant, or item from a restaurant'
              : errorMessage || 'Tap microphone to speak'}
          </Text>

          {/* ── Microphone with Animated Ripple Waves ── */}
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
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* ── Real-time Transcript or Status ── */}
          <View
            style={[
              styles.transcriptBox,
              { backgroundColor: isDark ? '#2A2B30' : '#F9FAFB' },
            ]}
          >
            {liveTranscript ? (
              <Text
                style={[
                  styles.liveTranscriptText,
                  { color: isDark ? '#F1F1EC' : '#111827' },
                ]}
              >
                "{liveTranscript}"
              </Text>
            ) : errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
              <Text
                style={[
                  styles.waitingText,
                  { color: isDark ? '#9BA08F' : '#9CA3AF' },
                ]}
              >
                Say "Biryani", "Paradise", or "Biryani from Paradise"...
              </Text>
            )}
          </View>

          {liveTranscript.length > 0 && (
            <TouchableOpacity
              style={styles.searchNowBtn}
              onPress={() => handleCompleteRecognition(liveTranscript)}
              activeOpacity={0.85}
            >
              <Ionicons name="search" size={16} color="#FFFFFF" />
              <Text style={styles.searchNowBtnText}>
                Search "{cleanFoodVoiceQuery(liveTranscript)}"
              </Text>
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB' },
            ]}
          />

          {/* ── Filter Tabs: All / Dishes / Restaurants ── */}
          <View style={styles.tabFilterRow}>
            {(['all', 'dishes', 'restaurants'] as const).map((tab) => {
              const active = selectedFilter === tab;
              const label =
                tab === 'all'
                  ? 'All'
                  : tab === 'dishes'
                  ? 'Dishes'
                  : 'Restaurants';
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedFilter(tab)}
                  style={[
                    styles.filterTab,
                    active && styles.filterTabActive,
                    {
                      backgroundColor: active
                        ? '#65A30D'
                        : isDark
                        ? '#2A2B30'
                        : '#F3F4F6',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      active
                        ? styles.filterTabTextActive
                        : { color: isDark ? '#9BA08F' : '#6B7280' },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Quick Suggestion Chips ── */}
          <ScrollView
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsRow}
            showsVerticalScrollIndicator={false}
          >
            {filteredSuggestions.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: isDark ? '#2A2B30' : '#F9FAFB',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
                  },
                ]}
                onPress={() => handleSelectSuggestion(item.label)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color="#65A30D"
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.suggestionChipText,
                    { color: isDark ? '#F1F1EC' : '#1F2937' },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: '90%',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  micWrapper: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  rippleCircle: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#65A30D',
  },
  ripple1: { opacity: 0.28 },
  ripple2: { opacity: 0.16 },
  ripple3: { opacity: 0.08 },
  micCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },
  micCircleActive: {
    backgroundColor: '#65A30D',
    shadowColor: '#65A30D',
    shadowOpacity: 0.55,
  },
  micCircleInactive: {
    backgroundColor: '#6B7280',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  transcriptBox: {
    minHeight: 46,
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveTranscriptText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600',
  },
  searchNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#65A30D',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 10,
    gap: 6,
    shadowColor: '#65A30D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  searchNowBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 10,
  },
  tabFilterRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterTabActive: {
    backgroundColor: '#65A30D',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipsScroll: {
    width: '100%',
    maxHeight: 130,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 6,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
