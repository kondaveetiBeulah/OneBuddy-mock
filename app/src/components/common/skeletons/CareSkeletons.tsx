import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerBox, ShimmerCircle, ShimmerText } from '../Shimmer';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

/**
 * Skeleton for Doctor / Care Provider Card in Hospital OP & Home Visits / Consultation.
 * Matches exact dimensions from DoctorsScreen.tsx card layout.
 */
export const CareDoctorCardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';

  return (
    <View style={[styles.doctorCard, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.cardMainRow}>
        {/* Doctor Avatar Shimmer */}
        <ShimmerCircle size={56} isDark={isDark} />

        {/* Identity Details */}
        <View style={styles.doctorInfoCol}>
          <ShimmerText width="70%" height={16} borderRadius={4} isDark={isDark} />
          <ShimmerText width="45%" height={12} borderRadius={3} style={{ marginTop: 4 }} isDark={isDark} />

          {/* Hospital Row */}
          <View style={[styles.rowAlign, { marginTop: 6 }]}>
            <ShimmerBox width={14} height={14} borderRadius={3} isDark={isDark} />
            <ShimmerText width="65%" height={11} borderRadius={3} style={{ marginLeft: 6 }} isDark={isDark} />
          </View>

          {/* Location Row */}
          <View style={[styles.rowAlign, { marginTop: 4 }]}>
            <ShimmerBox width={12} height={12} borderRadius={3} isDark={isDark} />
            <ShimmerText width="50%" height={11} borderRadius={3} style={{ marginLeft: 6 }} isDark={isDark} />
          </View>

          {/* Rating and Experience */}
          <View style={[styles.rowAlign, { marginTop: 6 }]}>
            <ShimmerBox width={34} height={14} borderRadius={4} isDark={isDark} />
            <ShimmerBox width={55} height={14} borderRadius={4} style={{ marginLeft: 8 }} isDark={isDark} />
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.cardDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]} />

      {/* Footer: Fee & Action button */}
      <View style={styles.cardFooter}>
        <View>
          <ShimmerText width={40} height={10} borderRadius={2} isDark={isDark} />
          <ShimmerBox width={60} height={16} borderRadius={4} style={{ marginTop: 3 }} isDark={isDark} />
        </View>
        <ShimmerBox width={90} height={32} borderRadius={16} isDark={isDark} />
      </View>
    </View>
  );
};

/**
 * Skeleton for Hospital Card in Care / Hospital OP Booking.
 */
export const CareHospitalCardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';

  return (
    <View style={[styles.hospitalCard, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.hospitalTopRow}>
        <ShimmerBox width={44} height={44} borderRadius={10} isDark={isDark} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <ShimmerText width="65%" height={16} borderRadius={4} isDark={isDark} />
          <ShimmerText width="80%" height={11} borderRadius={3} style={{ marginTop: 4 }} isDark={isDark} />
          <ShimmerText width="40%" height={11} borderRadius={3} style={{ marginTop: 4 }} isDark={isDark} />
        </View>
        <ShimmerBox width={40} height={18} borderRadius={6} isDark={isDark} />
      </View>

      {/* Specialty pills */}
      <View style={[styles.rowAlign, { marginTop: 10, gap: 6 }]}>
        <ShimmerBox width={65} height={18} borderRadius={6} isDark={isDark} />
        <ShimmerBox width={75} height={18} borderRadius={6} isDark={isDark} />
        <ShimmerBox width={55} height={18} borderRadius={6} isDark={isDark} />
      </View>

      {/* Footer */}
      <View style={[styles.cardFooter, { marginTop: 12 }]}>
        <ShimmerBox width={85} height={16} borderRadius={4} isDark={isDark} />
        <ShimmerBox width={96} height={32} borderRadius={16} isDark={isDark} />
      </View>
    </View>
  );
};

/**
 * List of Doctor Skeletons.
 */
export const CareDoctorListSkeleton: React.FC<{ count?: number; isDark?: boolean }> = ({
  count = 3,
  isDark: propIsDark,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.listWrap}>
      {items.map((i) => (
        <CareDoctorCardSkeleton key={`care-doc-${i}`} isDark={isDark} />
      ))}
    </View>
  );
};

/**
 * List of Hospital Skeletons for Care / OP Booking.
 */
export const CareHospitalListSkeleton: React.FC<{ count?: number; isDark?: boolean }> = ({
  count = 3,
  isDark: propIsDark,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={{ paddingHorizontal: 0 }}>
      {items.map((i) => (
        <CareHospitalCardSkeleton key={`care-hosp-${i}`} isDark={isDark} />
      ))}
    </View>
  );
};

/**
 * Skeleton for a single 2-column Medicine Product Card.
 * Matches exact dimensions and layout of ProductCard in MedicineDeliveryFlow.
 */
export const CareMedicineCardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';

  return (
    <View style={[styles.medicineCard, { backgroundColor: cardBg, borderColor }]}>
      {/* Product Image Area */}
      <ShimmerBox width="100%" height={105} borderRadius={8} isDark={isDark} />

      {/* Product Title Bars */}
      <View style={{ marginTop: 8, gap: 4 }}>
        <ShimmerText width="90%" height={13} borderRadius={3} isDark={isDark} />
        <ShimmerText width="65%" height={11} borderRadius={3} isDark={isDark} />
      </View>

      {/* Pack / Generic tag */}
      <View style={{ marginTop: 6 }}>
        <ShimmerText width="45%" height={10} borderRadius={3} isDark={isDark} />
      </View>

      {/* Price & Add Button Row */}
      <View style={[styles.rowAlign, { justifyContent: 'space-between', marginTop: 10 }]}>
        <ShimmerBox width={45} height={16} borderRadius={4} isDark={isDark} />
        <ShimmerBox width={60} height={28} borderRadius={14} isDark={isDark} />
      </View>
    </View>
  );
};

/**
 * 2-Column Grid of Medicine Skeletons for Category & Subcategory screens.
 */
export const CareMedicineGridSkeleton: React.FC<{ count?: number; isDark?: boolean }> = ({
  count = 6,
  isDark: propIsDark,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.medicineGrid}>
      {items.map((i) => (
        <View key={`med-skel-${i}`} style={{ width: '48%' }}>
          <CareMedicineCardSkeleton isDark={isDark} />
        </View>
      ))}
    </View>
  );
};

/**
 * Horizontal Slide Card Skeleton for Featured Specialists carousel.
 * Matches exact dimensions and layout of doctorSlideCard in HomeScreen.tsx.
 */
export const CareDoctorSlideCardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';

  return (
    <View style={[styles.doctorSlideCard, { backgroundColor: cardBg, borderColor }]}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <ShimmerCircle size={52} isDark={isDark} />
        <View style={{ flex: 1, gap: 5, justifyContent: 'center' }}>
          <ShimmerText width="85%" height={15} borderRadius={4} isDark={isDark} />
          <ShimmerText width="60%" height={12} borderRadius={3} isDark={isDark} />
          <ShimmerText width="70%" height={11} borderRadius={3} isDark={isDark} />
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
            <ShimmerBox width={36} height={15} borderRadius={4} isDark={isDark} />
            <ShimmerBox width={48} height={15} borderRadius={4} isDark={isDark} />
          </View>
        </View>
      </View>
      <View style={[styles.cardDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]} />
      <View style={[styles.rowAlign, { justifyContent: 'space-between' }]}>
        <View>
          <ShimmerText width={26} height={9} borderRadius={2} isDark={isDark} />
          <ShimmerBox width={45} height={16} borderRadius={4} style={{ marginTop: 2 }} isDark={isDark} />
        </View>
        <ShimmerBox width={85} height={30} borderRadius={15} isDark={isDark} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  doctorCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
  },
  doctorInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hospitalCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  hospitalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicineCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  medicineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  doctorSlideCard: {
    width: 250,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
});
