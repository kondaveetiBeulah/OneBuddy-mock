import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PREVIOUS_RIDES } from '../data';
import { PreviousRide } from '../types';
import { useRideTheme } from '../theme';

export default function PreviousRidesScreen({ isDark: isDarkProp }: { isDark?: boolean } = {}) {
  const theme = useRideTheme();
  const isDark = isDarkProp ?? theme.isDark;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#121214' }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}>
        <Text style={[styles.title, isDark && { color: '#F1F1EC' }]}>Previous rides</Text>
        <Text style={[styles.subtitle, isDark && { color: '#9BA08F' }]}>Your recent trips</Text>
      </View>

      <FlatList
        data={PREVIOUS_RIDES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, PREVIOUS_RIDES.length === 0 && { flex: 1, justifyContent: 'center' }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <Text style={[{ fontSize: 16, fontWeight: '700', color: isDark ? '#F1F1EC' : '#1E293B', marginBottom: 6 }]}>
              No orders found
            </Text>
            <Text style={[{ fontSize: 13, color: isDark ? '#9BA08F' : '#64748B', textAlign: 'center' }]}>
              Your completed and past rides will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }: { item: PreviousRide }) => (
          <TouchableOpacity
            style={[styles.row, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}
            onPress={() => Alert.alert(item.title, `${item.date}\n${item.fare}`)}
          >
            <View style={[styles.iconCircle, isDark && { backgroundColor: '#24262B' }]}>
              <Ionicons name="navigate" size={16} color="#54B713" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.rowDate, isDark && { color: '#9BA08F' }]}>{item.date}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.fare, isDark && { color: '#F1F1EC' }]}>{item.fare}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#fbbf24" />
                <Text style={[styles.ratingText, isDark && { color: '#9BA08F' }]}>{item.rating}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FCF7' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingBottom: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF7E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  rowDate: { fontSize: 13, color: '#64748b', marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  fare: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText: { fontSize: 12, color: '#64748b' },
});
