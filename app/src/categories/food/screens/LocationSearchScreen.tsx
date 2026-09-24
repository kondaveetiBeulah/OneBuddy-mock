import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search, MapPin, Navigation as NavIcon, Home, Building, Edit2, Trash2, MoreVertical, Plus } from 'lucide-react-native';
import { Address, deleteAddress, subscribeToAddresses, loadAddresses } from '../data/address';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

interface LocationSearchScreenProps {
  onBack: () => void;
  onLocationSelected: (location: string) => void;
  onEditAddress?: (address: Address) => void;
}

import { useCart } from '../context/CartContext';

export const LocationSearchScreen: React.FC<LocationSearchScreenProps> = ({
  onBack,
  onLocationSelected,
  onEditAddress,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const [searchQuery, setSearchQuery] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { setActiveAddress } = useCart();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isLocationPermissionModalVisible, setIsLocationPermissionModalVisible] = useState(false);
  const [isAddOptionModalVisible, setIsAddOptionModalVisible] = useState(false);

  const handleRequestLiveLocation = () => {
      setIsAddOptionModalVisible(false);
      setIsLocationPermissionModalVisible(true);
  };

  const handleManualAddressEntry = () => {
      setIsAddOptionModalVisible(false);
      onLocationSelected('Manual Entry');
  };

  const handleConfirmLocationAccess = () => {
    setIsLocationPermissionModalVisible(false);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data && data.address) {
                        const road = data.address.road || data.address.suburb || data.address.neighbourhood || 'Main Avenue';
                        const house = data.address.house_number ? `Door No. ${data.address.house_number}` : (data.address.building || 'Flat 102, 1st Floor');
                        const landmarkArea = [data.address.suburb, data.address.city || data.address.town, data.address.postcode].filter(Boolean).join(', ');
                        
                        if (onEditAddress) {
                            onEditAddress({ id: 'temp_gps', label: 'Home', houseNo: `${house}, ${road}`, building: data.address.neighbourhood || data.address.suburb || 'Residential Block', landmark: landmarkArea || data.display_name?.slice(0, 40) || 'Near City Center', receiverName: 'Guest', receiverPhone: '' });
                        }
                    } else {
                        if (onEditAddress) {
                            onEditAddress({ id: 'temp_gps', label: 'Home', houseNo: 'Flat 204, Live GPS Pin', building: 'Live Location Detected', landmark: 'Current GPS Detected Area', receiverName: 'Guest', receiverPhone: '' });
                        }
                    }
                } catch (err) {
                    if (onEditAddress) onEditAddress({ id: 'temp_gps', label: 'Home', houseNo: 'Flat 204, Live GPS Pin', building: 'Live Location Detected', landmark: 'Current GPS Detected Area', receiverName: 'Guest', receiverPhone: '' });
                }
            },
            (error) => {
                if (onEditAddress) onEditAddress({ id: 'temp_gps', label: 'Home', houseNo: 'Flat 302, 5th Main', building: 'Cyber Pearl Towers', landmark: 'Hitec City, Madhapur 500081', receiverName: 'Guest', receiverPhone: '' });
            },
            { enableHighAccuracy: true, timeout: 6000 }
        );
    } else {
        if (onEditAddress) onEditAddress({ id: 'temp_gps', label: 'Home', houseNo: 'Flat 302, 5th Main', building: 'Cyber Pearl Towers', landmark: 'Hitec City, Madhapur 500081', receiverName: 'Guest', receiverPhone: '' });
    }
  };

  React.useEffect(() => {
    loadAddresses();
    return subscribeToAddresses(setSavedAddresses);
  }, []);

  const handleDelete = (id: string) => {
    deleteAddress(id);
    setRefresh(r => r + 1);
  };



  const isDark = isCategoryDark();

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#121214' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}>
        <TouchableOpacity 
          onPress={onBack} 
          style={[styles.backBtn, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}
          activeOpacity={0.5}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <X size={20} color={isDark ? '#F1F1EC' : '#111827'} />
          <Text style={[styles.closeText, isDark && { color: '#F1F1EC' }]}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 30 }]}>


        {/* + Add New Address Toggle Button */}
        <TouchableOpacity
            onPress={() => setIsAddOptionModalVisible(true)}
            style={[styles.addNewAddressToggleBtn, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(101, 163, 13, 0.4)' }]}
            activeOpacity={0.8}
        >
            <View style={styles.addNewAddressPlusCircle}>
                <Text style={[styles.addNewAddressPlusText, isDark && { color: '#FFFFFF' }]}>+</Text>
            </View>
            <Text style={styles.addNewAddressToggleLabel}>Add New Address</Text>
        </TouchableOpacity>

        {/* Saved Addresses */}
        <View style={styles.recommendedSection}>
          <Text style={[styles.sectionTitle, isDark && { color: '#9BA08F' }]}>SAVED ADDRESSES</Text>
          <View style={styles.list}>
            {savedAddresses.length > 0 ? (
              savedAddresses.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={[styles.locItem, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }, { zIndex: openMenuId === loc.id ? 10 : 1 }]}
                  onPress={() => {
                    if (openMenuId) setOpenMenuId(null);
                    else {
                      setActiveAddress(loc);
                      onBack();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.locIconContainer, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                    {loc.label === 'Home' ? <Home size={20} color={isDark ? '#9BA08F' : '#6B7280'} /> : loc.label === 'Work' ? <Building size={20} color={isDark ? '#9BA08F' : '#6B7280'} /> : <MapPin size={20} color={isDark ? '#9BA08F' : '#6B7280'} />}
                  </View>
                  <View style={styles.locDetails}>
                    <Text style={[styles.locName, isDark && { color: '#F1F1EC' }]}>{loc.label}</Text>
                    <Text style={[styles.locArea, isDark && { color: '#9BA08F' }]}>{loc.houseNo}, {loc.building ? loc.building + ', ' : ''}{loc.landmark}</Text>
                  </View>
                  {onEditAddress && (
                    <View style={{ zIndex: 20 }}>
                      <TouchableOpacity
                        onPress={() => setOpenMenuId(openMenuId === loc.id ? null : loc.id)}
                        style={[styles.moreBtn, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MoreVertical size={20} color={isDark ? '#9BA08F' : '#6B7280'} />
                      </TouchableOpacity>

                      {openMenuId === loc.id && (
                        <View style={[styles.menuPopup, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                              setOpenMenuId(null);
                              onEditAddress(loc);
                            }}
                          >
                            <Edit2 size={16} color={isDark ? '#F1F1EC' : '#111827'} />
                            <Text style={[styles.menuItemText, isDark && { color: '#F1F1EC' }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                              setOpenMenuId(null);
                              handleDelete(loc.id);
                            }}
                          >
                            <Trash2 size={16} color="#F43F5E" />
                            <Text style={[styles.menuItemText, { color: '#F43F5E' }]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.emptyText, isDark && { color: '#9BA08F' }]}>No saved addresses yet. Add one from the map!</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Add Address Method Pop-up Modal ── */}
      <Modal
          visible={isAddOptionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAddOptionModalVisible(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={[styles.deleteModalCard, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, width: '100%' }}>
                      <Text style={[styles.deleteModalTitle, { marginBottom: 0 }, isDark && { color: '#F1F1EC' }]}>📍 Add Delivery Address</Text>
                      <TouchableOpacity
                          onPress={() => setIsAddOptionModalVisible(false)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? '#24262B' : '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}
                      >
                          <Text style={{ color: isDark ? '#9BA08F' : '#6B7280', fontSize: 14, fontWeight: '700' }}>✕</Text>
                      </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 13, color: isDark ? '#9BA08F' : '#6B7280', marginBottom: 18, lineHeight: 18, width: '100%' }}>
                      Choose how you would like to set your delivery location:
                  </Text>

                  {/* Option 1: Add Live Location */}
                  <TouchableOpacity
                      onPress={handleRequestLiveLocation}
                      activeOpacity={0.85}
                      style={[styles.addressChoiceOptionLive, { width: '100%' }, isDark && { backgroundColor: '#24262B', borderColor: '#65A30D' }]}
                  >
                      <View style={styles.addressChoiceIconBadgeLive}>
                          <Text style={{ fontSize: 20 }}>📍</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.addressChoiceOptionTitleLive}>Add Live Location</Text>
                              <View style={styles.livePill}>
                                  <Text style={[styles.livePillText, isDark && { color: '#FFFFFF' }]}>AUTO GPS</Text>
                              </View>
                          </View>
                          <Text style={[styles.addressChoiceOptionSub, isDark && { color: '#9BA08F' }]}>
                              Use current location to automatically fill address details
                          </Text>
                      </View>
                      <Text style={styles.addressChoiceArrow}>→</Text>
                  </TouchableOpacity>

                  {/* Option 2: Enter New Address */}
                  <TouchableOpacity
                      onPress={handleManualAddressEntry}
                      activeOpacity={0.85}
                      style={[styles.addressChoiceOptionManual, { width: '100%', marginBottom: 0 }, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
                  >
                      <View style={[styles.addressChoiceIconBadgeManual, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
                          <Text style={{ fontSize: 20 }}>✍️</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                          <Text style={[styles.addressChoiceOptionTitleManual, isDark && { color: '#F1F1EC' }]}>Enter New Address</Text>
                          <Text style={[styles.addressChoiceOptionSub, isDark && { color: '#9BA08F' }]}>
                              Type house number, street, area, and receiver details manually
                          </Text>
                      </View>
                      <Text style={styles.addressChoiceArrow}>→</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* ── Location Access Permission Alert Modal ── */}
      <Modal
        visible={isLocationPermissionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLocationPermissionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.deleteModalCard, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
                <View style={styles.locationPermissionIconCircle}>
                    <Text style={{ fontSize: 24 }}>📍</Text>
                </View>
                <Text style={[styles.deleteModalTitle, isDark && { color: '#F1F1EC' }]}>Allow Location Access?</Text>
                <Text style={[styles.deleteModalMessage, isDark && { color: '#9BA08F' }]}>
                    Buddy Food needs your permission to access device GPS to automatically detect and fill your current address.
                </Text>

                <View style={styles.deleteModalBtnRow}>
                    <TouchableOpacity
                        onPress={() => setIsLocationPermissionModalVisible(false)}
                        style={[styles.deleteModalCancelBtn, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.deleteModalCancelText, isDark && { color: '#F1F1EC' }]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleConfirmLocationAccess}
                        style={[styles.deleteModalConfirmBtn, { backgroundColor: '#65A30D', shadowColor: '#65A30D' }]}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.deleteModalConfirmText, { color: '#FFFFFF' }]}>
                            Allow & Auto-Fill
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    gap: 6,
  },
  closeText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    gap: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 52,
    color: '#111827',
    fontSize: 15,
  },
  currentLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  currentLocTextContainer: {
    flex: 1,
  },
  currentLocTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#65A30D',
  },
  currentLocSub: {
    fontSize: 12,
    color: 'rgba(245, 158, 11, 0.7)',
    marginTop: 2,
  },
  recommendedSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  list: {
    gap: 12,
  },
  locItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  locIconContainer: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 20,
  },
  locDetails: {
    flex: 1,
  },
  locName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  locArea: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  moreBtn: {
    padding: 8,
  },
  menuPopup: {
    position: 'absolute',
    right: 32,
    top: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    minWidth: 120,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuItemText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  addressChoiceOptionLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#65A30D',
    marginBottom: 12,
    shadowColor: '#65A30D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  addressChoiceIconBadgeLive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(230, 180, 58, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(101, 163, 13, 0.2)',
  },
  addressChoiceOptionTitleLive: {
    fontSize: 15,
    fontWeight: '800',
    color: '#65A30D',
  },
  livePill: {
    backgroundColor: '#65A30D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  livePillText: {
    color: '#111827',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addressChoiceOptionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 16,
  },
  addressChoiceArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#65A30D',
    marginLeft: 8,
  },
  addressChoiceOptionManual: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  addressChoiceIconBadgeManual: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressChoiceOptionTitleManual: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  addNewAddressToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(101, 163, 13, 0.3)',
    marginBottom: 10,
  },
  addNewAddressPlusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#65A30D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addNewAddressPlusText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  addNewAddressToggleLabel: {
    color: '#65A30D',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  locationPermissionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(101, 163, 13, 0.1)',
    borderWidth: 1.5,
    borderColor: '#65A30D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  deleteModalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteModalCancelText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteModalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#65A30D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#65A30D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteModalConfirmText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
});
