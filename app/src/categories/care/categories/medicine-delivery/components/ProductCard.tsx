import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { styles } from '../theme/styles';
import { PRODUCTS } from '../data/products';
import { MEDICINE_IMAGES } from '../data/medicineImages';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import QtyControl from './QtyControl';

interface ProductCardProps {
  id: string;
  accent?: string;
}

export default function ProductCard({ id, accent = COLORS.green }: ProductCardProps) {
  const { cart, addToCart, openProduct, medColors } = useApp();
  const [imgError, setImgError] = useState(false);
  const p = PRODUCTS[id];
  const mrp = p.mrp ?? p.price;
  const pct = mrp > p.price ? Math.round((1 - p.price / mrp) * 100) : 0;
  const localImage = MEDICINE_IMAGES[id];

  return (
    <View style={[styles.pcard, { backgroundColor: medColors.card, borderColor: medColors.line }]}>
      {/* Tappable area: image + name + price → opens product detail */}
      <TouchableOpacity
        onPress={() => openProduct(id)}
        activeOpacity={0.8}
        style={{ flex: 1 }}
      >
        {p.rx && (
          <View style={styles.rxTag}>
            <Text style={styles.rxTagText}>Rx Required</Text>
          </View>
        )}
        <View style={[styles.pcardImg, { backgroundColor: medColors.isDark ? '#2A2E37' : '#FFFFFF' }]}>
          {localImage ? (
            <Image
              source={localImage}
              style={styles.pcardPhoto}
              resizeMode="contain"
            />
          ) : p.image && !imgError ? (
            <Image
              source={{ uri: p.image }}
              style={styles.pcardPhoto}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Icon type={p.icon} size={30} />
          )}
        </View>
        <View style={{ minHeight: 34, justifyContent: 'flex-start' }}>
          <Text style={[styles.pcardName, { color: medColors.ink }]} numberOfLines={2}>
            {p.name}
          </Text>
        </View>
        <View style={{ minHeight: 32, justifyContent: 'flex-start' }}>
          {p.pack ? (
            <Text
              style={[
                styles.pcardMeta,
                { color: medColors.isDark ? '#86EFAC' : COLORS.greenDark, fontWeight: '700', fontSize: 10.5 },
              ]}
              numberOfLines={1}
            >
              {p.pack}
            </Text>
          ) : null}
          {p.manufacturer ? (
            <Text style={[styles.pcardMeta, { color: medColors.inkSoft }]} numberOfLines={1}>
              {p.manufacturer}
            </Text>
          ) : p.generic ? (
            <Text style={[styles.pcardMeta, { color: medColors.inkSoft }]} numberOfLines={1}>
              {p.generic}
            </Text>
          ) : null}
        </View>
        <View style={styles.pcardPriceRow}>
          {mrp > p.price && <Text style={[styles.pcardStrike, { color: medColors.inkSoft }]}>₹{mrp}</Text>}
          {pct > 0 && <Text style={[styles.pcardPct, { color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }]}>{pct}% OFF</Text>}
        </View>
        <Text style={[styles.pcardFinal, { color: medColors.ink }]}>₹{p.price}</Text>
      </TouchableOpacity>

      {/*
        QtyControl is OUTSIDE the navigation TouchableOpacity.
        Tapping ADD / – / + only changes cart qty, never navigates.
      */}
      <QtyControl id={id} qty={cart[id] || 0} onChange={addToCart} accent={accent} />
    </View>
  );
}
