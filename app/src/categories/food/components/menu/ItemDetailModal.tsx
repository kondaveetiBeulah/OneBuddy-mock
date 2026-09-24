import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Share,
} from 'react-native';
import { MenuItem, Restaurant } from '../../types';
import { DietaryBadge } from '../common/Badge';
import { X, Bookmark, Share2, Percent, Plus, Minus } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { LinearGradient } from 'expo-linear-gradient';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  restaurant: Restaurant;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  restaurant,
}) => {
  const { addToCart, toggleFavorite, isFavorite, getItemQuantity, updateQuantity } = useCart();
  const [selectedPortion, setSelectedPortion] = useState<'single' | 'full'>('single');
  const [cookingRequest, setCookingRequest] = useState('');
  const [quantity, setQuantity] = useState(1); // Local quantity for initial add

  if (!isOpen || !item) return null;

  const cartQty = getItemQuantity(item.id);

  const isBookmarked = isFavorite(restaurant.id);
  const singlePrice = item.price;
  const fullPrice = item.originalPrice ? Math.round(item.originalPrice * 1.35) : Math.round(item.price * 1.6);
  const currentUnitPrice = selectedPortion === 'single' ? singlePrice : fullPrice;
  const originalUnitPrice = selectedPortion === 'single'
    ? (item.originalPrice || Math.round(singlePrice * 1.25))
    : Math.round(fullPrice * 1.3);

  const totalPrice = currentUnitPrice * quantity;
  const totalOriginalPrice = originalUnitPrice * quantity;
  const savings = totalOriginalPrice - totalPrice;

  const handleAddToCart = () => {
    addToCart(
      {
        ...item,
        name: selectedPortion === 'full' ? `${item.name} (Full)` : item.name,
        price: currentUnitPrice,
      },
      restaurant,
      quantity
    );
    onClose();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${item.name} from ${restaurant.name} on Buddy Food!`,
      });
    } catch {}
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Floating Top Close Button */}
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.8}
          style={styles.closeBtn}
        >
          <X size={20} color={isCategoryDark() ? '#F1F1EC' : '#111827'} />
        </TouchableOpacity>

        {/* Modal Bottom Sheet Content */}
        <View style={styles.sheetContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Hero Food Image & Card Header */}
            <View style={styles.heroCard}>
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: item.image }}
                  resizeMode="cover"
                  style={styles.heroImage}
                />
                <LinearGradient
                  colors={isCategoryDark() ? ['transparent', 'rgba(29, 30, 34, 0.9)'] : ['transparent', 'rgba(0, 0, 0, 0.4)']}
                  style={styles.imageGradient}
                />
              </View>

              <View style={styles.heroMeta}>
                <View style={styles.titleRow}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.badgeRow}>
                      <DietaryBadge type={item.dietary} size="sm" />
                      {item.bestseller ? (
                        <View style={styles.bestsellerTag}>
                          <Text style={styles.bestsellerText}>Bestseller</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.dishTitle}>{item.name}</Text>
                  </View>

                  {/* Bookmark & Share */}
                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      onPress={() => toggleFavorite(restaurant.id)}
                      style={[styles.iconCircle, isBookmarked && styles.bookmarkedCircle]}
                    >
                      <Bookmark
                        size={16}
                        color={isBookmarked ? '#F43F5E' : '#6B7280'}
                        fill={isBookmarked ? '#F43F5E' : 'transparent'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleShare} style={styles.iconCircle}>
                      <Share2 size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Subtitle & Tag */}
                <View style={styles.reorderRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.reorderText}>Highly reordered</Text>
                </View>

                <Text style={styles.dishDesc}>{item.description}</Text>
              </View>
            </View>

            {/* 2. Quantity / Portion Option Group */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <Text style={styles.sectionSub}>Required • Select any 1 option</Text>

              <View style={styles.optionList}>
                {/* Single */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedPortion('single')}
                  style={[
                    styles.radioOption,
                    selectedPortion === 'single' && styles.radioOptionSelected,
                  ]}
                >
                  <View style={styles.radioLeft}>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedPortion === 'single' && styles.radioOuterSelected,
                      ]}
                    >
                      {selectedPortion === 'single' ? (
                        <View style={styles.radioInner} />
                      ) : null}
                    </View>
                    <Text style={styles.radioLabel}>Single</Text>
                  </View>
                  <Text style={styles.radioPrice}>₹{singlePrice}</Text>
                </TouchableOpacity>

                {/* Full */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedPortion('full')}
                  style={[
                    styles.radioOption,
                    selectedPortion === 'full' && styles.radioOptionSelected,
                  ]}
                >
                  <View style={styles.radioLeft}>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedPortion === 'full' && styles.radioOuterSelected,
                      ]}
                    >
                      {selectedPortion === 'full' ? (
                        <View style={styles.radioInner} />
                      ) : null}
                    </View>
                    <Text style={styles.radioLabel}>Full</Text>
                  </View>
                  <Text style={styles.radioPrice}>₹{fullPrice}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Add Cooking Request (Optional) */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>Add a cooking request (optional)</Text>
              <Text style={styles.sectionSub}>
                The restaurant will try its best to fulfil your requests. However, refunds or
                cancellations related to such requests won't be possible.
              </Text>

              <View style={styles.textInputWrap}>
                <TextInput
                  value={cookingRequest}
                  onChangeText={(t) => setCookingRequest(t.slice(0, 100))}
                  placeholder="e.g. Don't make it too spicy"
                  placeholderTextColor="rgba(184, 175, 203, 0.4)"
                  multiline
                  numberOfLines={2}
                  maxLength={100}
                  style={styles.textInput}
                />
                <Text style={styles.charCount}>{100 - cookingRequest.length}</Text>
              </View>
            </View>
          </ScrollView>

          {/* 4. Bottom Sticky Action Bar */}
          <View style={styles.bottomBar}>
            {savings > 0 ? (
              <View style={styles.discountStrip}>
                <View style={styles.discountIconCircle}>
                  <Percent size={11} color="#F3F4F6" />
                </View>
                <Text style={styles.discountStripText}>
                  Add this item to save ₹{savings}
                </Text>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              {cartQty > 0 ? (
                <View style={styles.activeStepperWrap}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, -1)}
                    style={styles.activeStepBtn}
                  >
                    <Minus size={20} color="#F43F5E" />
                  </TouchableOpacity>
                  <View style={{ alignItems: 'center', gap: 2 }}>
                    <Text style={styles.activeQtyText}>{cartQty} added</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#F43F5E' }}>₹{currentUnitPrice * cartQty}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, 1)}
                    style={styles.activeStepBtn}
                  >
                    <Plus size={20} color="#F43F5E" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleAddToCart}
                  activeOpacity={0.9}
                  style={styles.addBtnWrap}
                >
                  <LinearGradient
                    colors={['#F43F5E', '#E11D48']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addBtn}
                  >
                    <Text style={styles.addBtnText}>Add item</Text>
                    <Text style={styles.addBtnPrice}>₹{totalPrice}</Text>
                    {totalOriginalPrice > totalPrice ? (
                      <Text style={styles.addBtnOrigPrice}>₹{totalOriginalPrice}</Text>
                    ) : null}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    alignSelf: 'center',
    marginBottom: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: '88%',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  heroCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageWrap: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: '#000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  heroMeta: {
    padding: 14,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bestsellerTag: {
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  bestsellerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#65A30D',
  },
  dishTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkedCircle: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: '#F43F5E',
  },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  reorderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#34D399',
  },
  dishDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  optionList: {
    gap: 8,
    marginTop: 4,
  },
  radioOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
  },
  radioOptionSelected: {
    backgroundColor: 'rgba(101, 163, 13, 0.08)',
    borderColor: '#65A30D',
  },
  radioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#F43F5E',
    backgroundColor: '#F43F5E',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
  },
  radioPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
  },
  textInputWrap: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 10,
    position: 'relative',
  },
  textInput: {
    fontSize: 11,
    color: '#111827',
    minHeight: 45,
    textAlignVertical: 'top',
  },
  charCount: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    fontSize: 9,
    color: '#9CA3AF',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 14,
    gap: 10,
  },
  discountStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 74, 110, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  discountIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountStripText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7DD3FC',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  activeStepperWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 8,
  },
  activeStepBtn: {
    padding: 14,
  },
  activeQtyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  addBtnWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addBtnPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addBtnOrigPrice: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
  },
});
