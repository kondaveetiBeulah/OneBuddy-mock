import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, ChevronDown, ChevronLeft, ShoppingCart, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../context/CartContext';
import { FoodDeliveryIcon } from './FoodDeliveryIcon';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

interface HeaderProps {
  onNavigate: (screen: 'home' | 'restaurant-menu' | 'orders' | 'favorites' | 'location-search' | 'add-address' | 'cart') => void;
  activeScreen: string;
  onEditAddress?: (address: any) => void;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, activeScreen, onEditAddress, onBack }) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0);
  const { totalItemCount, subtotal, setIsCartDrawerOpen, favorites, activeAddress } = useCart();
  const [isAddOptionModalVisible, setIsAddOptionModalVisible] = useState(false);
  const [isLocationPermissionModalVisible, setIsLocationPermissionModalVisible] = useState(false);

  const handleRequestLiveLocation = () => {
      setIsAddOptionModalVisible(false);
      setIsLocationPermissionModalVisible(true);
  };

  const handleManualAddressEntry = () => {
      setIsAddOptionModalVisible(false);
      if (onEditAddress) onEditAddress(null);
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
                          if (onEditAddress) onEditAddress({ id: 'temp_gps', label: 'Home', houseNo: `${house}, ${road}`, building: data.address.neighbourhood || data.address.suburb || 'Residential Block', landmark: landmarkArea || data.display_name?.slice(0, 40) || 'Near City Center' });
                      } else {
                          if (onEditAddress) onEditAddress({ id: 'temp_gps', label: 'Home', houseNo: 'Flat 204, Live GPS Pin', building: 'Live Location Detected', landmark: 'Current GPS Detected Area' });
                      }
                  } catch (err) {
                      if (onEditAddress) onEditAddress({ id: 'temp_gps', label: 'Home', houseNo: 'Flat 204, Live GPS Pin', building: 'Live Location Detected', landmark: 'Current GPS Detected Area' });
                  }
              },
              (error) => {
                  if (onEditAddress) onEditAddress({ id: 'temp_gps', label: 'Home', houseNo: 'Flat 302, 5th Main', building: 'Cyber Pearl Towers', landmark: 'Hitec City, Madhapur 500081' });
              },
              { enableHighAccuracy: true, timeout: 6000 }
          );
      } else {
          if (onEditAddress) onEditAddress({ id: 'temp_gps', label: 'Home', houseNo: 'Flat 302, 5th Main', building: 'Cyber Pearl Towers', landmark: 'Hitec City, Madhapur 500081' });
      }
  };

  const displayAddress = activeAddress
    ? `${activeAddress.houseNo}, ${activeAddress.landmark || activeAddress.label || 'Saved Location'}`
    : 'Add Current Address';

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: topInset + 8 }]}>
        {/* Top Row: Logo and Right Actions */}
        <View style={styles.topRow}>
          <View style={styles.leftRow}>
            {!!onBack && (
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <ChevronLeft size={22} color={isCategoryDark() ? '#F1F1EC' : '#111827'} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => onNavigate('home')}
              activeOpacity={0.8}
              style={styles.logoBtn}
            >
              <View
                style={[styles.logoBadge, { backgroundColor: '#FFFFFF' }]}
              >
                <FoodDeliveryIcon width={38} height={38} />
              </View>
              <View>
                <Text style={styles.logoTitle}>
                  One<Text style={{ color: '#65A30D' }}>Buddy</Text>
                </Text>
                <Text style={styles.logoSub}>Food Express</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.rightRow}>
            {/* Cart Icon Button */}
            <TouchableOpacity
              key={totalItemCount > 0 ? 'active' : 'inactive'}
              onPress={() => onNavigate('cart')}
              activeOpacity={0.7}
              style={
                totalItemCount > 0
                  ? styles.cartBtn
                  : [
                    styles.iconBtn,
                    activeScreen === 'cart' && { backgroundColor: 'rgba(251, 191, 36, 0.2)', borderColor: '#65A30D' },
                  ]
              }
            >
              {totalItemCount > 0 ? (
                <View style={[styles.cartBtnGradient, { backgroundColor: '#65A30D' }]}>
                  <ShoppingCart size={15} color="#FFFFFF" />
                  <Text style={styles.cartBtnText}>₹{subtotal}</Text>
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{totalItemCount}</Text>
                  </View>
                </View>
              ) : (
                <ShoppingCart
                  size={18}
                  color={activeScreen === 'cart' ? '#65A30D' : '#6B7280'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Row: Horizontal Location Bar */}
        <TouchableOpacity
          onPress={() => onNavigate('location-search')}
          activeOpacity={0.7}
          style={styles.locationBarHorizontal}
        >
          <MapPin size={16} color="#65A30D" />
          <Text style={styles.locationTextHorizontal} numberOfLines={1}>
            {displayAddress}
          </Text>
          <ChevronDown size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* ── Add Address Method Pop-up Modal ── */}
      <Modal
          visible={isAddOptionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAddOptionModalVisible(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={styles.addressChoiceModalCard}>
                  <View style={styles.addressChoiceHeader}>
                      <Text style={styles.addressChoiceTitle}>📍 Add Delivery Address</Text>
                      <TouchableOpacity
                          onPress={() => setIsAddOptionModalVisible(false)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={styles.addressChoiceCloseBtn}
                      >
                          <Text style={styles.addressChoiceCloseText}>✕</Text>
                      </TouchableOpacity>
                  </View>
                  <Text style={styles.addressChoiceSubtitle}>
                      Choose how you would like to set your delivery location:
                  </Text>

                  {/* Option 1: Add Live Location */}
                  <TouchableOpacity
                      onPress={handleRequestLiveLocation}
                      activeOpacity={0.85}
                      style={styles.addressChoiceOptionLive}
                  >
                      <View style={styles.addressChoiceIconBadgeLive}>
                          <Text style={{ fontSize: 20 }}>📍</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.addressChoiceOptionTitleLive}>Add Live Location</Text>
                              <View style={styles.livePill}>
                                  <Text style={styles.livePillText}>AUTO GPS</Text>
                              </View>
                          </View>
                          <Text style={styles.addressChoiceOptionSub}>
                              Use current location to automatically fill address details
                          </Text>
                      </View>
                      <Text style={styles.addressChoiceArrow}>→</Text>
                  </TouchableOpacity>

                  {/* Option 2: Enter New Address */}
                  <TouchableOpacity
                      onPress={handleManualAddressEntry}
                      activeOpacity={0.85}
                      style={styles.addressChoiceOptionManual}
                  >
                      <View style={styles.addressChoiceIconBadgeManual}>
                          <Text style={{ fontSize: 20 }}>✍️</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                          <Text style={styles.addressChoiceOptionTitleManual}>Enter New Address</Text>
                          <Text style={styles.addressChoiceOptionSub}>
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
              <View style={styles.deleteModalCard}>
                  <View style={styles.locationPermissionIconCircle}>
                      <Text style={{ fontSize: 24 }}>📍</Text>
                  </View>
                  <Text style={styles.deleteModalTitle}>Allow Location Access?</Text>
                  <Text style={styles.deleteModalMessage}>
                      Buddy Food needs your permission to access device GPS to automatically detect and fill your current address.
                  </Text>

                  <View style={styles.deleteModalBtnRow}>
                      <TouchableOpacity
                          onPress={() => setIsLocationPermissionModalVisible(false)}
                          style={styles.deleteModalCancelBtn}
                          activeOpacity={0.8}
                      >
                          <Text style={styles.deleteModalCancelText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                          onPress={handleConfirmLocationAccess}
                          style={[styles.deleteModalConfirmBtn, { backgroundColor: '#65A30D', shadowColor: '#65A30D' }]}
                          activeOpacity={0.8}
                      >
                          <Text style={[styles.deleteModalConfirmText, { color: '#111827' }]}>
                              Allow & Auto-Fill
                          </Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  logoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -4,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 20,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 22,
  },
  logoSub: {
    fontSize: 11,
    color: '#F5A67D',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationBarHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    width: '100%',
  },
  locationTextHorizontal: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    position: 'relative',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: '#F43F5E',
  },
  favBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadgeText: {
    color: '#111827',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cartBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cartBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  cartBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#111827',
  },
  cartBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  cartBadgeText: {
    color: '#E8C767',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyCartBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(139, 108, 201, 0.3)',
    borderRadius: 24,
    padding: 20,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeBtn: {
    color: '#6B7280',
    fontSize: 16,
    padding: 4,
  },
  locList: {
    gap: 8,
  },
  locItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 14,
    padding: 12,
  },
  locItemActive: {
    backgroundColor: 'rgba(101, 163, 13, 0.1)',
    borderColor: '#65A30D',
  },
  locItemText: {
    fontSize: 13,
    color: '#111827',
  },
  locItemTextActive: {
    color: '#4D7C0F',
    fontWeight: 'bold',
  },
  activePill: {
    color: '#65A30D',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressChoiceModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '90%',
    borderWidth: 1.5,
    borderColor: 'rgba(101, 163, 13, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  addressChoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressChoiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  addressChoiceCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressChoiceCloseText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },
  addressChoiceSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 18,
    lineHeight: 18,
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
    backgroundColor: 'rgba(101, 163, 13, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(101, 163, 13, 0.35)',
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

