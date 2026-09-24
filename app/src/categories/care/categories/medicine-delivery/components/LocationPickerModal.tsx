import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, useMedColors } from '../theme/colors';
import { PinIcon, SearchIcon, CloseIcon } from './UiIcons';

export interface LocationItem {
  id: string;
  name: string;
  area: string;
  eta: string;
}

export const POPULAR_LOCATIONS: LocationItem[] = [
  { id: '1', name: 'Hyderabad, Telangana', area: 'Central City Hub', eta: '⚡ 15-20 mins' },
  { id: '2', name: 'Banjara Hills, Hyderabad', area: 'Road No. 1 - 12', eta: '⚡ 15-20 mins' },
  { id: '3', name: 'Jubilee Hills, Hyderabad', area: 'Checkpost & Road 36', eta: '⚡ 15-20 mins' },
  { id: '4', name: 'Hitec City, Hyderabad', area: 'Cyber Towers & Mindspace', eta: '⚡ 10-15 mins' },
  { id: '5', name: 'Madhapur, Hyderabad', area: 'Ayyappa Society & Kavuri Hills', eta: '⚡ 10-15 mins' },
  { id: '6', name: 'Gachibowli, Hyderabad', area: 'Financial District & DLF', eta: '⚡ 15-20 mins' },
  { id: '7', name: 'Kondapur, Hyderabad', area: 'Botanical Garden Road', eta: '⚡ 15-20 mins' },
  { id: '8', name: 'Kukatpally, Hyderabad', area: 'KPHB Colony & JNTU', eta: '⚡ 20-25 mins' },
  { id: '9', name: 'Begumpet, Hyderabad', area: 'Prakash Nagar & Mayur Marg', eta: '⚡ 20-25 mins' },
  { id: '10', name: 'Secunderabad, Telangana', area: 'Clock Tower & Paradise Circle', eta: '⚡ 20-30 mins' },
  { id: '11', name: 'Ameerpet, Hyderabad', area: 'SR Nagar & Mythrivanam', eta: '⚡ 20-25 mins' },
  { id: '12', name: 'Mehdipatnam, Hyderabad', area: 'Attapur & Ring Road', eta: '⚡ 20-25 mins' },
  { id: '13', name: 'Bengaluru, Karnataka', area: 'Indiranagar & Koramangala', eta: '⚡ 30-40 mins' },
  { id: '14', name: 'Mumbai, Maharashtra', area: 'Bandra & Andheri West', eta: '⚡ 30-40 mins' },
  { id: '15', name: 'Chennai, Tamil Nadu', area: 'T. Nagar & Anna Nagar', eta: '⚡ 30-40 mins' },
];

interface LocationPickerModalProps {
  visible: boolean;
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
  onClose: () => void;
}

export default function LocationPickerModal({
  visible,
  currentLocation,
  onSelectLocation,
  onClose,
}: LocationPickerModalProps) {
  const [filter, setFilter] = useState('');
  const [customInput, setCustomInput] = useState('');
  const medColors = useMedColors();

  const filtered = POPULAR_LOCATIONS.filter(
    (item) =>
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.area.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCustomSubmit = () => {
    if (customInput.trim().length > 0) {
      onSelectLocation(customInput.trim());
      setCustomInput('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: medColors.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: '82%',
                paddingHorizontal: 18,
                paddingTop: 16,
                paddingBottom: 28,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: medColors.ink }}>
                    Choose Delivery Location
                  </Text>
                  <Text style={{ fontSize: 12, color: medColors.inkSoft, marginTop: 2 }}>
                    Select your city or area for instant medicine delivery
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: medColors.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <CloseIcon size={14} color={medColors.inkSoft} />
                </TouchableOpacity>
              </View>

              {/* Search inside Modal */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: medColors.bg,
                  borderWidth: 1,
                  borderColor: medColors.line,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  marginBottom: 12,
                }}
              >
                <SearchIcon size={16} color={medColors.inkSoft} />
                <TextInput
                  value={filter}
                  onChangeText={setFilter}
                  placeholder="Search locality, area or landmark…"
                  placeholderTextColor={medColors.inkSoft}
                  style={{ flex: 1, fontSize: 13, color: medColors.ink }}
                />
                {filter.length > 0 && (
                  <TouchableOpacity onPress={() => setFilter('')}>
                    <CloseIcon size={14} color={medColors.inkSoft} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick GPS Location */}
              <TouchableOpacity
                onPress={() => {
                  onSelectLocation('Hyderabad, Telangana');
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: medColors.greenLight,
                  borderWidth: 1,
                  borderColor: medColors.greenBorder,
                  marginBottom: 14,
                }}
                activeOpacity={0.8}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="8" stroke={medColors.isDark ? '#86EFAC' : COLORS.greenDark} strokeWidth={2} />
                  <Circle cx="12" cy="12" r="3" fill={medColors.isDark ? '#86EFAC' : COLORS.greenDark} />
                  <Path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke={medColors.isDark ? '#86EFAC' : COLORS.greenDark} strokeWidth={2} strokeLinecap="round" />
                </Svg>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>
                    Use Current Location (GPS)
                  </Text>
                  <Text style={{ fontSize: 11, color: medColors.inkSoft }}>
                    Hyderabad, Telangana · Detected location
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Locations List */}
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: medColors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Available Delivery Localities ({filtered.length})
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 260 }}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {filtered.map((item) => {
                  const isSelected =
                    currentLocation.toLowerCase() === item.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        onSelectLocation(item.name);
                        onClose();
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        backgroundColor: isSelected ? medColors.greenPale : 'transparent',
                        marginBottom: 4,
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <PinIcon size={16} color={isSelected ? (medColors.isDark ? '#86EFAC' : COLORS.greenDark) : medColors.inkSoft} />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: isSelected ? '700' : '600',
                              color: isSelected ? (medColors.isDark ? '#86EFAC' : COLORS.greenDark) : medColors.ink,
                            }}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: medColors.inkSoft }} numberOfLines={1}>
                            {item.area} · <Text style={{ color: medColors.isDark ? '#86EFAC' : COLORS.greenDark, fontWeight: '600' }}>{item.eta}</Text>
                          </Text>
                        </View>
                      </View>

                      {isSelected && (
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: COLORS.green,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Custom Location input */}
              <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: medColors.line, paddingTop: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: medColors.ink, marginBottom: 6 }}>
                  Or enter your colony/society name:
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={customInput}
                    onChangeText={setCustomInput}
                    placeholder="e.g. Manikonda, Hyderabad"
                    placeholderTextColor={medColors.inkSoft}
                    style={{
                      flex: 1,
                      backgroundColor: medColors.bg,
                      borderWidth: 1,
                      borderColor: medColors.line,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 12.5,
                      color: medColors.ink,
                    }}
                    onSubmitEditing={handleCustomSubmit}
                  />
                  <TouchableOpacity
                    onPress={handleCustomSubmit}
                    disabled={!customInput.trim()}
                    style={{
                      backgroundColor: customInput.trim() ? COLORS.green : medColors.surface2,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Set</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
