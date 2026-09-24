/**
 * AddressScreen.tsx
 * ------------------------------------------------------------------
 * Standalone address page for React Native. No local files, no
 * sample-data file, no navigation — the only outside dependency is the
 * app's ThemeContext, read so this screen follows the light/dark mood
 * the rest of the app is in instead of always rendering dark.
 * Drop it anywhere inside the app's providers and render <AddressScreen />.
 * ------------------------------------------------------------------
 * "Use current location" field
 * ------------------------------------------------------------------
 * The form has a "Use current location" row that pins GPS coordinates
 * and can auto-fill the address fields. Out of the box it uses
 * navigator.geolocation, which exists on React Native Web and in Expo.
 *
 * For real device GPS + reverse geocoding, pass one prop instead of
 * editing this file (keeps it dependency-free):
 *
 *   import * as Location from 'expo-location';
 *
 *   const locate = async () => {
 *     const { status } = await Location.requestForegroundPermissionsAsync();
 *     if (status !== 'granted') throw new Error('Location permission denied');
 *     const { coords } = await Location.getCurrentPositionAsync({});
 *     const [p] = await Location.reverseGeocodeAsync(coords);
 *     return {
 *       latitude: coords.latitude,
 *       longitude: coords.longitude,
 *       line1: p?.name ?? undefined,
 *       line2: [p?.street, p?.district].filter(Boolean).join(', ') || undefined,
 *       city: p?.city ?? undefined,
 *       state: p?.region ?? undefined,
 *       pincode: p?.postalCode ?? undefined,
 *     };
 *   };
 *
 *   <AddressScreen getCurrentLocation={locate} />
 * ------------------------------------------------------------------
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface Address {
  id: string;
  label: AddressLabel;
  receiverName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  /** Set when the address was pinned with "Use current location". */
  latitude?: number;
  longitude?: number;
}

/** What a location provider hands back. Every part is optional. */
export interface LocationResult {
  latitude?: number;
  longitude?: number;
  line1?: string;
  line2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface AddressScreenProps {
  /** Optional starting list. Falls back to the built-in seed data. */
  initialAddresses?: Address[];
  /** Called on every change, if the parent wants to persist. */
  onChange?: (addresses: Address[]) => void;
  /** Back button handler. Button is hidden when this is omitted. */
  onClose?: () => void;
  /**
   * Real GPS + reverse geocoding. Optional: without it the field falls
   * back to navigator.geolocation and pins coordinates only.
   */
  getCurrentLocation?: () => Promise<LocationResult>;
}

/* ------------------------------------------------------------------ */
/* Tokens                                                             */
/* ------------------------------------------------------------------ */

const DARK_C = {
  bg: '#121214',
  surface: '#1D1E22',
  surfaceAlt: '#24262B',
  border: 'rgba(255,255,255,0.08)',
  handleBar: 'rgba(255,255,255,0.2)',
  lavender: '#5FA300',
  lavenderSoft: 'rgba(126,196,0,0.14)',
  gold: '#7EC400',
  goldSoft: 'rgba(126,196,0,0.16)',
  text: '#F1F1EC',
  muted: '#9BA08F',
  danger: '#EF4444',
};

const LIGHT_C = {
  bg: '#F8FAF5',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F4E8',
  border: 'rgba(23,36,10,0.09)',
  handleBar: 'rgba(23,36,10,0.15)',
  lavender: '#5FA300',
  lavenderSoft: 'rgba(95,163,0,0.14)',
  gold: '#4C8F2C',
  goldSoft: 'rgba(76,143,44,0.16)',
  text: '#17240A',
  muted: 'rgba(23,36,10,0.65)',
  danger: '#DC2626',
};

type AddressColors = typeof DARK_C;

const LABELS: AddressLabel[] = ['Home', 'Work', 'Other'];

const SEED: Address[] = [
  {
    id: 'addr-1',
    label: 'Home',
    receiverName: 'Ravi Kumar',
    phone: '9876543210',
    line1: 'Flat 302, Sai Residency',
    line2: 'Road No. 12, Banjara Hills',
    landmark: 'Opposite Care Hospital',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Work',
    receiverName: 'Ravi Kumar',
    phone: '9876543210',
    line1: 'Level 4, Cyber Towers',
    line2: 'HITEC City',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    isDefault: false,
  },
];

const glyphFor = (label: AddressLabel) =>
  label === 'Home' ? '\u{1F3E0}' : label === 'Work' ? '\u{1F4BC}' : '\u{1F4CD}';

/* ------------------------------------------------------------------ */
/* Form state                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
  label: 'Home' as AddressLabel,
  receiverName: '',
  phone: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
};

const coordText = (lat?: number, lng?: number) =>
  lat === undefined || lng === undefined ? '' : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

type FormState = typeof EMPTY_FORM;
type Errors = Partial<Record<keyof FormState, string>>;

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

const AddressScreen = ({
  initialAddresses,
  onChange,
  onClose,
  getCurrentLocation,
}: AddressScreenProps) => {
  const { scheme } = useAppTheme();
  const C = scheme === 'dark' ? DARK_C : LIGHT_C;
  const s = createStyles(C);

  const [addresses, setAddresses] = useState<Address[]>(initialAddresses ?? SEED);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [locating, setLocating] = useState(false);
  const [locateNote, setLocateNote] = useState<string | null>(null);

  const commit = (next: Address[]) => {
    setAddresses(next);
    onChange?.(next);
  };

  /* ---------------- actions ---------------- */

  const addAddress = (a: Address) =>
    commit(a.isDefault ? [...addresses.map((x) => ({ ...x, isDefault: false })), a] : [...addresses, a]);

  const updateAddress = (a: Address) =>
    commit(
      addresses.map((x) =>
        x.id === a.id ? a : a.isDefault ? { ...x, isDefault: false } : x
      )
    );

  const deleteAddress = (id: string) => commit(addresses.filter((x) => x.id !== id));

  const setDefaultAddress = (id: string) =>
    commit(addresses.map((x) => ({ ...x, isDefault: x.id === id })));

  /* ---------------- form plumbing ---------------- */

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setSheetOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({
      label: a.label,
      receiverName: a.receiverName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? '',
      landmark: a.landmark ?? '',
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      isDefault: a.isDefault,
      latitude: a.latitude,
      longitude: a.longitude,
    });
    setErrors({});
    setLocateNote(null);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingId(null);
    setLocating(false);
    setLocateNote(null);
  };

  /* ---------------- use current location ---------------- */

  /** Browser / RN-Web geolocation fallback when no prop is supplied. */
  const readBuiltInGeolocation = (): Promise<LocationResult> =>
    new Promise((resolve, reject) => {
      const geo = (globalThis as any)?.navigator?.geolocation;
      if (!geo || typeof geo.getCurrentPosition !== 'function') {
        reject(new Error('This device has no location provider wired up yet.'));
        return;
      }
      geo.getCurrentPosition(
        (pos: { coords: { latitude: number; longitude: number } }) =>
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err: { message?: string }) =>
          reject(new Error(err?.message || 'Could not read your location.')),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });

  const detectCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    setLocateNote(null);
    try {
      const r = getCurrentLocation
        ? await getCurrentLocation()
        : await readBuiltInGeolocation();

      setForm((prev) => ({
        ...prev,
        latitude: r.latitude ?? prev.latitude,
        longitude: r.longitude ?? prev.longitude,
        // Only fill blanks — never overwrite what the person typed.
        line1: prev.line1 || r.line1 || '',
        line2: prev.line2 || r.line2 || '',
        landmark: prev.landmark || r.landmark || '',
        city: prev.city || r.city || '',
        state: prev.state || r.state || '',
        pincode: prev.pincode || r.pincode || '',
      }));
      setErrors({});

      const filled = !!(r.line1 || r.city || r.state || r.pincode);
      setLocateNote(
        filled
          ? 'Location pinned and the blank fields filled in. Check them before saving.'
          : 'Location pinned. Type the house and street details yourself.'
      );
    } catch (e: any) {
      setLocateNote(e?.message || 'Could not get your location.');
    } finally {
      setLocating(false);
    }
  };

  const clearPin = () => {
    setForm((prev) => ({ ...prev, latitude: undefined, longitude: undefined }));
    setLocateNote(null);
  };

  const save = () => {
    const next: Errors = {};
    if (!form.receiverName.trim()) next.receiverName = 'Enter the name for this address';
    if (!/^\d{10}$/.test(form.phone)) next.phone = 'Enter a 10-digit mobile number';
    if (!form.line1.trim()) next.line1 = 'Enter the flat, house or building';
    if (!form.city.trim()) next.city = 'Enter the city';
    if (!form.state.trim()) next.state = 'Enter the state';
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = 'Enter a 6-digit pincode';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: Address = {
      id: editingId ?? `addr-${Date.now()}`,
      label: form.label,
      receiverName: form.receiverName.trim(),
      phone: form.phone,
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      landmark: form.landmark.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode,
      isDefault: form.isDefault,
      latitude: form.latitude,
      longitude: form.longitude,
    };

    if (editingId) updateAddress(payload);
    else addAddress(payload);
    closeSheet();
  };

  const confirmDelete = (a: Address) => {
    Alert.alert('Delete this address?', `${a.label} \u00b7 ${a.line1}`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAddress(a.id) },
    ]);
  };

  const ordered = useMemo(
    () => [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
    [addresses]
  );

  /* ---------------- small inline pieces ---------------- */

  const field = (
    key: keyof FormState,
    label: string,
    placeholder: string,
    opts: { numeric?: boolean; max?: number } = {}
  ) => (
    <View style={s.fieldWrap} key={key}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={String(form[key])}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={opts.numeric ? 'number-pad' : 'default'}
        maxLength={opts.max}
        onChangeText={(t) =>
          set(
            key as 'receiverName',
            (opts.numeric ? t.replace(/\D/g, '').slice(0, opts.max ?? 20) : t) as never
          )
        }
        style={[s.input, !!errors[key] && s.inputError]}
      />
      {!!errors[key] && <Text style={s.fieldError}>{errors[key]}</Text>}
    </View>
  );

  /* ---------------- render ---------------- */

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      <View style={s.topBar}>
        {!!onClose && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onClose}
            style={s.backBtn}
          >
            <Text style={s.backGlyph}>{'\u2039'}</Text>
          </TouchableOpacity>
        )}
        <View style={s.topText}>
          <Text style={s.topTitle}>Addresses</Text>
          <Text style={s.topSub}>
            {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {ordered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyGlyph}>{'\u{1F4CD}'}</Text>
            <Text style={s.emptyTitle}>No saved addresses yet</Text>
            <Text style={s.emptyBody}>
              Add one address and every delivery starts from the right place.
            </Text>
            <TouchableOpacity accessibilityRole="button" onPress={openAdd} style={s.emptyBtn}>
              <Text style={s.emptyBtnText}>Add an address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          ordered.map((a) => (
            <View key={a.id} style={[s.card, a.isDefault && s.cardDefault]}>
              <View style={s.cardHead}>
                <View style={s.icon}>
                  <Text style={s.iconGlyph}>{glyphFor(a.label)}</Text>
                </View>
                <View style={s.cardHeadText}>
                  <View style={s.labelRow}>
                    <Text style={s.cardLabel}>{a.label}</Text>
                    {a.isDefault && (
                      <View style={s.pill}>
                        <Text style={s.pillText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.who}>
                    {a.receiverName} {'\u00b7'} {a.phone}
                  </Text>
                </View>
              </View>

              <Text style={s.lines}>
                {[a.line1, a.line2, a.landmark].filter(Boolean).join(', ')}
              </Text>
              <Text style={s.lines}>
                {a.city}, {a.state} {a.pincode}
              </Text>
              {a.latitude !== undefined && a.longitude !== undefined && (
                <Text style={s.pinnedLine}>
                  {'\u25C9'} Pinned {coordText(a.latitude, a.longitude)}
                </Text>
              )}

              <View style={s.actions}>
                <TouchableOpacity accessibilityRole="button" onPress={() => openEdit(a)}>
                  <Text style={s.link}>Edit</Text>
                </TouchableOpacity>
                {!a.isDefault && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setDefaultAddress(a.id)}
                  >
                    <Text style={s.link}>Set as default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity accessibilityRole="button" onPress={() => confirmDelete(a)}>
                  <Text style={[s.link, s.linkDanger]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {ordered.length > 0 && (
          <TouchableOpacity accessibilityRole="button" onPress={openAdd} style={s.addBtn}>
            <Text style={s.addBtnText}>+ Add a new address</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ---------------- add / edit sheet ---------------- */}
      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={closeSheet}>
        <View style={s.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={s.sheetWrap}
          >
            <View style={s.sheet}>
              <View style={s.grab} />
              <View style={s.sheetHead}>
                <Text style={s.sheetTitle}>
                  {editingId ? 'Edit address' : 'Add a new address'}
                </Text>
                <TouchableOpacity accessibilityRole="button" onPress={closeSheet}>
                  <Text style={s.close}>Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={s.form}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={s.groupLabel}>Save as</Text>
                <View style={s.chipRow}>
                  {LABELS.map((l) => {
                    const active = form.label === l;
                    return (
                      <TouchableOpacity
                        key={l}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => set('label', l)}
                        style={[s.chip, active && s.chipActive]}
                      >
                        <Text style={[s.chipText, active && s.chipTextActive]}>{l}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={s.groupLabel}>Location</Text>
                <View style={s.locateCard}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ busy: locating }}
                    onPress={detectCurrentLocation}
                    disabled={locating}
                    style={[s.locateBtn, locating && s.locateBtnBusy]}
                  >
                    {locating ? (
                      <ActivityIndicator size="small" color={C.lavender} />
                    ) : (
                      <Text style={s.locateGlyph}>{'\u25C9'}</Text>
                    )}
                    <Text style={s.locateBtnText}>
                      {locating ? 'Finding you\u2026' : 'Use current location'}
                    </Text>
                  </TouchableOpacity>

                  <View style={s.pinRow}>
                    <Text style={s.pinLabel}>Pinned coordinates</Text>
                    <Text style={s.pinValue}>
                      {coordText(form.latitude, form.longitude) || 'Not pinned yet'}
                    </Text>
                  </View>

                  {form.latitude !== undefined && (
                    <TouchableOpacity accessibilityRole="button" onPress={clearPin}>
                      <Text style={s.clearPin}>Remove pin</Text>
                    </TouchableOpacity>
                  )}

                  {!!locateNote && <Text style={s.locateNote}>{locateNote}</Text>}
                </View>

                {field('receiverName', 'Receiver name', 'Who should we ask for?')}
                {field('phone', 'Mobile number', '10-digit number', { numeric: true, max: 10 })}
                {field('line1', 'Flat, house, building', 'Flat 302, Sai Residency')}
                {field('line2', 'Area, street, sector (optional)', 'Road No. 12, Banjara Hills')}
                {field('landmark', 'Landmark (optional)', 'Opposite Care Hospital')}
                {field('city', 'City', 'Hyderabad')}
                {field('state', 'State', 'Telangana')}
                {field('pincode', 'Pincode', '500034', { numeric: true, max: 6 })}

                <View style={s.switchRow}>
                  <View style={s.switchText}>
                    <Text style={s.switchTitle}>Use as default address</Text>
                    <Text style={s.switchSub}>Deliveries start from this address.</Text>
                  </View>
                  <Switch
                    value={form.isDefault}
                    onValueChange={(v) => set('isDefault', v)}
                    trackColor={{ false: C.border, true: 'rgba(222,187,82,0.5)' }}
                    thumbColor={form.isDefault ? C.gold : C.muted}
                  />
                </View>

                <TouchableOpacity accessibilityRole="button" onPress={save} style={s.saveBtn}>
                  <Text style={s.saveText}>{editingId ? 'Save changes' : 'Save address'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

// A factory, not a static stylesheet: colors come from the current app
// theme, so this is rebuilt from the live palette on every render instead
// of being computed once (dark-only) at import time.
function createStyles(C: AddressColors) {
  return StyleSheet.create({
  safe: { backgroundColor: C.bg, flex: 1 },

  topBar: {
    alignItems: 'center',
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: C.surface,
    borderColor: C.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    marginRight: 12,
    width: 38,
  },
  backGlyph: { color: C.text, fontSize: 22, lineHeight: 24 },
  topText: { flex: 1 },
  topTitle: { color: C.text, fontSize: 20, fontWeight: '700' },
  topSub: { color: C.muted, fontSize: 12, marginTop: 2 },

  content: { padding: 16, paddingBottom: 48 },

  card: {
    backgroundColor: C.surface,
    borderColor: C.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  cardDefault: { borderColor: 'rgba(222,187,82,0.45)' },
  cardHead: { flexDirection: 'row' },
  cardHeadText: { flex: 1, marginLeft: 12 },
  icon: {
    alignItems: 'center',
    backgroundColor: C.lavenderSoft,
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconGlyph: { fontSize: 18 },
  labelRow: { alignItems: 'center', flexDirection: 'row' },
  cardLabel: { color: C.text, fontSize: 17, fontWeight: '700', marginRight: 8 },
  pill: { backgroundColor: C.goldSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  who: { color: C.muted, fontSize: 12, marginTop: 3 },
  lines: { color: C.muted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  actions: {
    borderTopColor: C.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 12,
  },
  link: { color: C.lavender, fontSize: 14, fontWeight: '600', marginRight: 18 },
  linkDanger: { color: C.danger, marginRight: 0 },

  addBtn: {
    alignItems: 'center',
    borderColor: C.lavender,
    borderRadius: 999,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingVertical: 14,
  },
  addBtnText: { color: C.lavender, fontSize: 14, fontWeight: '700' },

  empty: {
    alignItems: 'center',
    backgroundColor: C.surface,
    borderColor: C.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  emptyGlyph: { fontSize: 30, marginBottom: 12 },
  emptyTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  emptyBody: { color: C.muted, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: C.lavenderSoft,
    borderColor: C.lavender,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  emptyBtnText: { color: C.lavender, fontSize: 14, fontWeight: '700' },

  backdrop: { backgroundColor: 'rgba(0,0,0,0.72)', flex: 1, justifyContent: 'flex-end' },
  sheetWrap: { maxHeight: '92%' },
  sheet: {
    backgroundColor: C.bg,
    borderColor: C.border,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingBottom: 16,
    paddingTop: 8,
  },
  grab: {
    alignSelf: 'center',
    backgroundColor: C.handleBar,
    borderRadius: 999,
    height: 4,
    marginBottom: 12,
    width: 46,
  },
  sheetHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  sheetTitle: { color: C.text, fontSize: 19, fontWeight: '700' },
  close: { color: C.muted, fontSize: 14 },
  form: { paddingBottom: 24, paddingHorizontal: 16 },
  groupLabel: { color: C.muted, fontSize: 12, marginBottom: 8 },
  chipRow: { flexDirection: 'row', marginBottom: 16 },
  chip: {
    backgroundColor: C.surfaceAlt,
    borderColor: C.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: C.lavenderSoft, borderColor: C.lavender },
  chipText: { color: C.muted, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: C.gold },

  locateCard: {
    backgroundColor: C.surface,
    borderColor: C.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    padding: 12,
  },
  locateBtn: {
    alignItems: 'center',
    backgroundColor: C.lavenderSoft,
    borderColor: C.lavender,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  locateBtnBusy: { opacity: 0.7 },
  locateGlyph: { color: C.lavender, fontSize: 14, marginRight: 8 },
  locateBtnText: { color: C.lavender, fontSize: 14, fontWeight: '700', marginLeft: 4 },
  pinRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pinLabel: { color: C.muted, fontSize: 12 },
  pinValue: { color: C.text, fontSize: 13, fontWeight: '600' },
  clearPin: { color: C.danger, fontSize: 12, fontWeight: '600', marginTop: 8 },
  locateNote: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
  pinnedLine: { color: C.gold, fontSize: 12, marginTop: 8 },

  fieldWrap: { marginBottom: 12 },
  fieldLabel: { color: C.muted, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: C.surfaceAlt,
    borderColor: C.border,
    borderRadius: 10,
    borderWidth: 1,
    color: C.text,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  inputError: { borderColor: C.danger },
  fieldError: { color: C.danger, fontSize: 11, marginTop: 4 },

  switchRow: {
    alignItems: 'center',
    backgroundColor: C.surface,
    borderColor: C.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 4,
    padding: 12,
  },
  switchText: { flex: 1, paddingRight: 12 },
  switchTitle: { color: C.text, fontSize: 14, fontWeight: '600' },
  switchSub: { color: C.muted, fontSize: 11, marginTop: 3 },

  saveBtn: {
    alignItems: 'center',
    backgroundColor: C.lavender,
    borderRadius: 999,
    marginTop: 16,
    paddingVertical: 15,
  },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  });
}

export default AddressScreen;
