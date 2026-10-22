import React, { useState, useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, useColors } from '../components/UI';
import { doctors } from '../mockData';
import { useBooking } from '../context/BookingContext';
import { CareDoctorSlideCardSkeleton } from '@/components/common/skeletons';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    reset: (config: any) => void;
  };
  onClose?: () => void;
}

const specialists = [
  'General Physician',
  'Home Nurse Care',
  'Cardiologist',
  'Gynecologist',
  'Elderly Care Nurse',
  'Psychiatrist',
  'Orthopedist',
  'Dermatologist',
  'Neurologist',
  'Dentist',
];

const specialistData: Record<string, { icon: string; iconColor: string; bgColor: string; tag: string }> = {
  'Home Nurse Care': {
    icon: 'bandage-outline',
    iconColor: '#059669',
    bgColor: '#ECFDF5',
    tag: 'Professional Nursing & Injections',
  },
  'Elderly Care Nurse': {
    icon: 'accessibility-outline',
    iconColor: '#0D9488',
    bgColor: '#F0FDFA',
    tag: 'Senior & Post-Op Recovery',
  },
  Cardiologist: {
    icon: 'heart-outline',
    iconColor: '#E53E3E',
    bgColor: '#FFF5F5',
    tag: 'Heart & Vascular Care',
  },
  Gynecologist: {
    icon: 'woman-outline',
    iconColor: '#D53F8C',
    bgColor: '#FFF5F7',
    tag: "Women's Health & Wellness",
  },
  'General Physician': {
    icon: 'medkit-outline',
    iconColor: '#2563EB',
    bgColor: '#F0F9FF',
    tag: 'Primary & Family Healthcare',
  },
  Psychiatrist: {
    icon: 'fitness-outline',
    iconColor: '#7C3AED',
    bgColor: '#FAF5FF',
    tag: 'Mental Health & Mind Care',
  },
  Orthopedist: {
    icon: 'body-outline',
    iconColor: '#EA580C',
    bgColor: '#FFF7ED',
    tag: 'Bone, Joint & Muscle Care',
  },
  Dermatologist: {
    icon: 'sparkles-outline',
    iconColor: '#DB2777',
    bgColor: '#FDF2F8',
    tag: 'Skin, Hair & Aesthetics',
  },
  Neurologist: {
    icon: 'pulse-outline',
    iconColor: '#0D9488',
    bgColor: '#F0FDFA',
    tag: 'Brain & Nervous System',
  },
  Dentist: {
    icon: 'happy-outline',
    iconColor: '#0284C7',
    bgColor: '#F0F9FF',
    tag: 'Dental & Oral Surgery',
  },
};

const HEALTH_CATEGORIES = [
  {
    id: 'fever',
    name: 'Fever & Flu',
    iconName: 'thermometer-outline',
    description: 'Cold, Cough, Viral & High Temp',
    color: '#E11D48',
    bgColor: '#FFE4E6',
    query: 'fever',
  },
  {
    id: 'nursing',
    name: 'Home Nursing',
    iconName: 'bandage-outline',
    description: 'Professional Nurse & Dressing',
    color: '#059669',
    bgColor: '#D1FAE5',
    query: 'nurse',
  },
  {
    id: 'injections',
    name: 'Injections & IV',
    iconName: 'flask-outline',
    description: 'IV Drip & Injection at Home',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    query: 'injection',
  },
  {
    id: 'elderly',
    name: 'Senior Care',
    iconName: 'accessibility-outline',
    description: 'Elderly Care & Post-Op Recovery',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    query: 'elderly',
  },
  {
    id: 'peds',
    name: 'Child Care',
    iconName: 'happy-outline',
    description: 'Pediatric Care & Vaccination',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    query: 'pediatric',
  },
  {
    id: 'derma',
    name: 'Skin Problems',
    iconName: 'sparkles-outline',
    description: 'Acne, Skin Rash & Allergy',
    color: '#D97706',
    bgColor: '#FEF3C7',
    query: 'skin',
  },
  {
    id: 'cardio',
    name: 'Heart & BP Care',
    iconName: 'heart-outline',
    description: 'Chest Pain & BP Wellness',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    query: 'cardiologist',
  },
  {
    id: 'gastro',
    name: 'Stomach & Gas',
    iconName: 'medkit-outline',
    description: 'Stomach Ache & Acidity Care',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    query: 'general physician',
  },
  {
    id: 'ortho',
    name: 'Bone & Joint Pain',
    iconName: 'body-outline',
    description: 'Joint Pain & Physio Support',
    color: '#475569',
    bgColor: '#F1F5F9',
    query: 'orthopedist',
  },
  {
    id: 'neuro',
    name: 'Migraine & Nerves',
    iconName: 'pulse-outline',
    description: 'Migraine & Nerve Health',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    query: 'neurologist',
  },
  {
    id: 'gynae',
    name: "Women's Health",
    iconName: 'woman-outline',
    description: 'Periods & Women Wellness',
    color: '#D53F8C',
    bgColor: '#FCE7F3',
    query: 'gynecologist',
  },
  {
    id: 'mental',
    name: 'Mental Health',
    iconName: 'fitness-outline',
    description: 'Stress, Sleep & Mind Care',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    query: 'psychiatrist',
  },
];

export function HomeScreen({ navigation, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const { doctorsList } = useBooking();
  const activeDoctors = doctorsList || [];
  const topDoctors = activeDoctors.slice(0, 6);
  const tc = useColors(); // theme-aware colors

  const handleCategoryPress = (catId: string, catQuery: string) => {
    setSelectedCatId((prev) => (prev === catId ? null : catId));
    navigation.navigate('Doctors', { query: catQuery, issueId: catId });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header Title: One Buddy Home Visits */}
        <View style={styles.titleOnlyContainer}>
          <View style={styles.headerLeftGroup}>
            {onClose && (
              <Pressable
                onPress={onClose}
                style={[styles.backBtn, { backgroundColor: tc.soft }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Back to Home"
              >
                <Ionicons name="arrow-back" size={22} color={tc.ink} />
              </Pressable>
            )}
            <Text style={[styles.appTitle, { color: tc.ink }]}>
              <Text style={{ color: tc.ink }}>One </Text>
              <Text style={styles.titleBuddy}>Buddy</Text>
              <Text style={{ color: tc.ink }}> Home Visits</Text>
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.search, { backgroundColor: tc.soft, borderColor: tc.border }]}>
          <Ionicons name="search" size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search symptoms, diseases or doctors..."
            placeholderTextColor="#94A3B8"
            style={[styles.searchInput, { color: tc.ink }]}
            returnKeyType="search"
            onSubmitEditing={() => navigation.navigate('Doctors', { query })}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={{ padding: 2 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {/* Common Health Issues section (Horizontal Pills) */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.headingTitle, { color: tc.ink }]}>Common Health Issues</Text>
          <Text style={[styles.subHeadingText, { color: tc.muted }]}>Tap any issue to filter specialists</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            contentContainerStyle={styles.popularPillsContainer}
          >
            {HEALTH_CATEGORIES.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => handleCategoryPress(cat.id, cat.query)}
                  style={({ pressed }) => [
                    styles.popularHealthPill,
                    { backgroundColor: tc.surface, borderColor: tc.border },
                    isSelected && styles.popularHealthPillSelected,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View
                    style={[
                      styles.popularIconBox,
                      { backgroundColor: isSelected ? colors.primary : cat.bgColor },
                    ]}
                  >
                    <Ionicons
                      name={cat.iconName as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={isSelected ? '#FFFFFF' : cat.color}
                    />
                  </View>
                  <Text style={[styles.popularTextLabel, isSelected && styles.popularTextLabelSelected, !isSelected && { color: tc.ink }]}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Featured Specialists Section */}
        <View style={styles.sectionGroup}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.headingTitle, { color: tc.ink }]}>Featured Specialists</Text>
              <Text style={[styles.subHeadingText, { color: tc.muted }]}>Slide left to browse verified specialist doctors {topDoctors.length > 0 ? `(${topDoctors.length})` : ''}</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('Doctors', {})}>
              <Text style={styles.seeAllText}>View All &gt;</Text>
            </Pressable>
          </View>

          {topDoctors.length === 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.doctorScrollContainer}
            >
              {[1, 2, 3].map((i) => (
                <CareDoctorSlideCardSkeleton key={`doc-skel-${i}`} isDark={tc.isDark} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              contentContainerStyle={styles.doctorScrollContainer}
            >
              {topDoctors.map((doc) => (
                <Pressable
                  key={doc.id}
                  style={[styles.doctorSlideCard, { backgroundColor: tc.surface, borderColor: tc.border }]}
                  onPress={() => navigation.navigate('Availability', { doctorId: doc.id })}
                >
                  <View style={styles.docHeaderRow}>
                    {doc.avatar ? (
                      <Image source={{ uri: doc.avatar }} style={styles.docAvatar} />
                    ) : (
                      <View style={styles.docInitialsBadge}>
                        <Text style={styles.docInitialsText}>{doc.initials}</Text>
                      </View>
                    )}
                    <View style={styles.docHeaderInfo}>
                      <Text style={[styles.docName, { color: tc.ink }]} numberOfLines={1}>{doc.name}</Text>
                      <Text style={styles.docSpecialtyGreen} numberOfLines={1}>{doc.specialty}</Text>
                      <Text style={[styles.docHospitalGray, { color: tc.muted }]} numberOfLines={1}>{doc.hospital}</Text>
                      <View style={styles.ratingBadgeRow}>
                        <View style={styles.ratingBadgeYellow}>
                          <Ionicons name="star" size={11} color="#D97706" />
                          <Text style={styles.ratingBadgeText}>{doc.rating.toFixed(1)}</Text>
                        </View>
                        <View style={styles.expBadgeBlue}>
                          <Text style={styles.expBadgeText}>{doc.experience}y exp</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.docCardDivider} />

                  <View style={styles.docFooterRow}>
                    <View>
                      <Text style={styles.feeLabel}>FEE</Text>
                      <Text style={[styles.feeValue, { color: tc.ink }]}>₹{doc.fee}</Text>
                    </View>
                    <View style={styles.bookBtn}>
                      <Text style={styles.bookBtnText}>Book Visit &gt;</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Popular specialists section */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.headingTitle, { color: tc.ink }]}>Popular specialists</Text>
          
          <View style={styles.specialistList}>
            {specialists.map((specialist) => {
              const data = specialistData[specialist] || {
                icon: 'person-outline',
                iconColor: colors.primary,
                bgColor: colors.soft,
                tag: 'Medical Specialist',
              };
              return (
                <Pressable
                  key={specialist}
                  onPress={() => navigation.navigate('Doctors', { query: specialist })}
                  style={[styles.specialistRowCard, { backgroundColor: tc.surface, borderColor: tc.border }]}
                >
                  <View style={[styles.specialistIconBadge, { backgroundColor: data.bgColor }]}>
                    <Ionicons name={data.icon as keyof typeof Ionicons.glyphMap} size={18} color={data.iconColor} />
                  </View>
                  <View style={styles.specialistInfo}>
                    <Text style={[styles.specialistName, { color: tc.ink }]}>{specialist}</Text>
                    <Text style={[styles.specialistTag, { color: tc.muted }]}>{data.tag}</Text>
                  </View>
                  <View style={[styles.specialistArrowBadge, { backgroundColor: tc.soft }]}>
                    <Ionicons name="chevron-forward" size={15} color={colors.primary} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28 },
  
  // Clean Title Header
  titleOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  titleBlack: {
    color: '#000000',
  },
  titleBuddy: {
    color: colors.primary,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Bar
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    fontWeight: '500',
    padding: 0,
  },

  // Section Group
  sectionGroup: {
    marginBottom: 18,
  },
  headingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subHeadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },

  // Popular Health Issues Pills
  popularPillsContainer: {
    paddingVertical: 4,
    gap: 10,
  },
  popularHealthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  popularHealthPillSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  popularIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularTextLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  popularTextLabelSelected: {
    color: colors.primaryDark,
  },

  // Featured Specialists Slider
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  doctorScrollContainer: {
    paddingVertical: 6,
    gap: 12,
  },
  doctorSlideCard: {
    width: 255,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  docInitialsBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInitialsText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  docHeaderInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  docSpecialtyGreen: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  docHospitalGray: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  ratingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ratingBadgeYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  expBadgeBlue: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  expBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  docCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  docFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Popular Specialists Vertical List
  specialistList: {
    gap: 8,
    marginTop: 4,
  },
  specialistRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 14,
    padding: 10,
    gap: 12,
  },
  specialistIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialistInfo: {
    flex: 1,
  },
  specialistName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  specialistTag: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  specialistArrowBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
