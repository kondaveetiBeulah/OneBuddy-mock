import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Linking,
  Share,
  Animated,
  Easing,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PaymentCheckoutScreen from '../../../food/components/cart/PaymentCheckoutScreen';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Colors, useOCColors } from './constants/colors';
import { BookingProvider, useBooking } from './context/BookingContext';
import { HEALTH_CATEGORIES, MOCK_DOCTORS, generateMockSlots, COMMON_SYMPTOMS } from './data/mockData';
import { Doctor, HealthCategory, DaySlot, TimeSlot, BookingSummary } from './types/doctor';

import { OneBuddyHeader } from './components/OneBuddyHeader';
import { AnimatedSearchBar } from './components/AnimatedSearchBar';
import { HealthCategoryChip } from './components/HealthCategoryChip';
import { DoctorSlideCard } from './components/DoctorSlideCard';
import { DoctorCard } from './components/DoctorCard';
import { ServiceCard } from './components/ServiceCard';
import { BookingStepper } from './components/BookingStepper';
import { RatingStars } from './components/RatingStars';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═════════════════════════════════════════════════════════════════════
// 1. OC HOME TAB SCREEN
// ═════════════════════════════════════════════════════════════════════
function OCHomeTabScreen({
  onNavigateDoctors,
  onNavigateDoctorDetail,
  onClose,
  topInset = 0,
}: {
  onNavigateDoctors: () => void;
  onNavigateDoctorDetail: (doc: Doctor) => void;
  onClose: () => void;
  topInset?: number;
}) {
  const oc = useOCColors();
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedMode,
    setSelectedMode,
    setSelectedDoctor,
  } = useBooking();

  const handleCategoryPress = (specialtyKey: string) => {
    setSelectedCategory(selectedCategory === specialtyKey ? null : specialtyKey);
  };

  const handleDoctorPress = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    onNavigateDoctorDetail(doctor);
  };

  const handleServicePress = (mode: 'video' | 'audio') => {
    setSelectedMode(mode);
    setSelectedCategory(null);
    setSearchQuery('');
    onNavigateDoctors();
  };

  const displayedDoctors = useMemo(() => {
    return MOCK_DOCTORS.filter((doc) => {
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesSpecialty = doc.specialty.toLowerCase().includes(q);
        const matchesHospital = doc.hospital.toLowerCase().includes(q);
        const matchesAbout = doc.about.toLowerCase().includes(q);
        if (!matchesName && !matchesSpecialty && !matchesHospital && !matchesAbout) {
          return false;
        }
      }
      if (selectedCategory) {
        if (doc.specialtyKey !== selectedCategory) return false;
      }
      if (selectedMode && !doc.availableModes.includes(selectedMode)) {
        return false;
      }
      return true;
    }).sort((a, b) => b.rating - a.rating);
  }, [searchQuery, selectedCategory, selectedMode]);

  const activeCategoryName = useMemo(() => {
    if (!selectedCategory) return 'Featured Specialists';
    const found = HEALTH_CATEGORIES.find((c) => c.specialtyKey === selectedCategory);
    return found ? `${found.name} Specialists` : 'Specialists';
  }, [selectedCategory]);

  return (
    <View style={[homeStyles.container, { backgroundColor: oc.background }]}>
      <OneBuddyHeader onClose={onClose} topInset={topInset} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={homeStyles.scrollContent}
      >
        {/* Sticky Search Bar */}
        <View style={homeStyles.searchSection}>
          <AnimatedSearchBar
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
          />

        </View>

        {/* 1. Health Issues Category Chips */}
        <View style={homeStyles.sectionHeader}>
          <View>
            <Text style={[homeStyles.sectionTitle, { color: oc.textPrimary }]}>Common Health Issues</Text>
            <Text style={[homeStyles.sectionSubtitle, { color: oc.textMuted }]}>
              Tap any issue to filter specialists
            </Text>
          </View>
          {selectedCategory && (
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[homeStyles.clearFilterText, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={homeStyles.categoriesScroll}
        >
          {HEALTH_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.specialtyKey;
            return (
              <HealthCategoryChip
                key={cat.id}
                category={cat}
                isSelected={isSelected}
                onPress={() => handleCategoryPress(cat.specialtyKey)}
              />
            );
          })}
        </ScrollView>

        {/* 2. Top Doctors Slider */}
        <View style={[homeStyles.sectionHeader, { marginTop: 16 }]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[homeStyles.sectionTitle, { color: oc.textPrimary }]}>{activeCategoryName}</Text>
            <Text style={[homeStyles.sectionSubtitle, { color: oc.textMuted }]}>
              Slide left to browse verified specialist doctors ({displayedDoctors.length})
            </Text>
          </View>
          <TouchableOpacity
            style={[homeStyles.viewAllBtn, { backgroundColor: oc.isDark ? '#064E3B' : Colors.primaryLight }]}
            onPress={() => {
              setSelectedCategory(null);
              setSearchQuery('');
              onNavigateDoctors();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={[homeStyles.viewAllText, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>View All</Text>
            <Ionicons name="chevron-forward" size={13} color={oc.isDark ? '#86EFAC' : Colors.primaryDark} />
          </TouchableOpacity>
        </View>

        {displayedDoctors.length === 0 ? (
          <View style={[homeStyles.emptyContainer, { backgroundColor: oc.surface, borderColor: oc.border }]}>
            <Ionicons name="search-outline" size={38} color={oc.textMuted} />
            <Text style={[homeStyles.emptyTitle, { color: oc.textPrimary }]}>No Doctors Found</Text>
            <Text style={[homeStyles.emptySubtitle, { color: oc.textMuted }]}>
              No specialists matched your filter. Tap below to reset.
            </Text>
            <TouchableOpacity
              style={homeStyles.resetBtn}
              onPress={() => {
                setSelectedCategory(null);
                setSearchQuery('');
              }}
            >
              <Text style={homeStyles.resetBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={homeStyles.sliderScroll}
          >
            {displayedDoctors.map((doc) => (
              <DoctorSlideCard
                key={doc.id}
                doctor={doc}
                selectedMode={selectedMode}
                onPress={() => handleDoctorPress(doc)}
                onBookPress={() => handleDoctorPress(doc)}
              />
            ))}
          </ScrollView>
        )}

        {/* 3. Healthcare Services: Video Call & Audio Consultation */}
        <View style={[homeStyles.sectionHeader, { marginTop: 18 }]}>
          <View>
            <Text style={[homeStyles.sectionTitle, { color: oc.textPrimary }]}>Healthcare Consultation Modes</Text>
            <Text style={[homeStyles.sectionSubtitle, { color: oc.textMuted }]}>
              Choose video consultation or instant audio call
            </Text>
          </View>
        </View>

        <View style={homeStyles.servicesGrid}>
          <ServiceCard
            title="Instant Video Call"
            subtitle="Live video diagnosis with instant digital prescription"
            iconName="videocam"
            iconColor={Colors.primary}
            iconBgColor={oc.isDark ? '#064E3B' : Colors.primaryLight}
            accentBorderColor={selectedMode === 'video' ? Colors.primary : (oc.isDark ? '#064E3B' : '#CDE8C0')}
            onPress={() => handleServicePress('video')}
          />

          <ServiceCard
            title="Audio Consultation"
            subtitle="Quick phone advice with top specialist doctors"
            iconName="call"
            iconColor="#0284C7"
            iconBgColor={oc.isDark ? '#082F49' : '#E0F2FE'}
            accentBorderColor={selectedMode === 'audio' ? '#0284C7' : (oc.isDark ? '#082F49' : '#BAE6FD')}
            onPress={() => handleServicePress('audio')}
          />
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  categoriesScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 2,
  },
  sliderScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 4,
  },
  servicesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 4,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6EFE4',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  resetBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

// ═════════════════════════════════════════════════════════════════════
// 2. DOCTORS LIST SCREEN
// ═════════════════════════════════════════════════════════════════════
function OCDoctorsListScreen({
  onNavigateDoctorDetail,
}: {
  onNavigateDoctorDetail: (doc: Doctor) => void;
}) {
  const oc = useOCColors();
  const {
    searchQuery,
    setSearchQuery,
    selectedMode,
    setSelectedDoctor,
  } = useBooking();

  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'price_low'>('rating');

  const filteredDoctors = useMemo(() => {
    return MOCK_DOCTORS.filter((doc) => {
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesSpecialty = doc.specialty.toLowerCase().includes(q);
        const matchesHospital = doc.hospital.toLowerCase().includes(q);
        const matchesAbout = doc.about.toLowerCase().includes(q);
        if (!matchesName && !matchesSpecialty && !matchesHospital && !matchesAbout) {
          return false;
        }
      }
      if (selectedMode && !doc.availableModes.includes(selectedMode)) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      if (sortBy === 'price_low') return a.consultationFee - b.consultationFee;
      return 0;
    });
  }, [searchQuery, sortBy, selectedMode]);

  const handleDoctorPress = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    onNavigateDoctorDetail(doctor);
  };

  return (
    <View style={[docListStyles.container, { backgroundColor: oc.background }]}>
      {/* Search Header */}
      <View style={[docListStyles.searchHeader, { backgroundColor: oc.surface, borderBottomColor: oc.border }]}>
        <AnimatedSearchBar
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
          autoFocus={false}
        />
      </View>

      {/* Results Header Bar */}
      <View style={docListStyles.resultsInfoRow}>
        <View style={docListStyles.sortContainer}>
          <TouchableOpacity
            style={[
              docListStyles.sortBtn,
              { backgroundColor: oc.surface, borderColor: oc.borderSubtle },
              sortBy === 'rating' && [docListStyles.sortBtnActive, { backgroundColor: oc.isDark ? '#064E3B' : Colors.primaryLight, borderColor: Colors.primary }],
            ]}
            onPress={() => setSortBy('rating')}
          >
            <Text
              style={[
                docListStyles.sortBtnText,
                { color: oc.textSecondary },
                sortBy === 'rating' && [docListStyles.sortBtnTextActive, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }],
              ]}
            >
              ★ Top Rated
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              docListStyles.sortBtn,
              { backgroundColor: oc.surface, borderColor: oc.borderSubtle },
              sortBy === 'experience' && [docListStyles.sortBtnActive, { backgroundColor: oc.isDark ? '#064E3B' : Colors.primaryLight, borderColor: Colors.primary }],
            ]}
            onPress={() => setSortBy('experience')}
          >
            <Text
              style={[
                docListStyles.sortBtnText,
                { color: oc.textSecondary },
                sortBy === 'experience' && [docListStyles.sortBtnTextActive, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }],
              ]}
            >
              Exp.
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Doctor Cards List */}
      {filteredDoctors.length === 0 ? (
        <View style={docListStyles.emptyState}>
          <Ionicons name="search-outline" size={48} color={oc.textMuted} />
          <Text style={[docListStyles.emptyTitle, { color: oc.textPrimary }]}>No Doctors Found</Text>
          <Text style={[docListStyles.emptySubtitle, { color: oc.textMuted }]}>
            Try changing your search terms or clearing your search.
          </Text>
          <TouchableOpacity
            style={docListStyles.clearFiltersBtn}
            onPress={() => setSearchQuery('')}
          >
            <Text style={docListStyles.clearFiltersText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              selectedMode={selectedMode}
              onPress={() => handleDoctorPress(item)}
              onBookPress={() => handleDoctorPress(item)}
            />
          )}
          contentContainerStyle={docListStyles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const docListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE4',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  resultsCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  countHighlight: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFE4',
  },
  sortBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sortBtnTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  clearFiltersBtn: {
    marginTop: 18,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

// ═════════════════════════════════════════════════════════════════════
// 3. DOCTOR DETAIL SCREEN
// ═════════════════════════════════════════════════════════════════════
function OCDoctorDetailScreen({
  onProceed,
  onBack,
}: {
  onProceed: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 14);

  const {
    selectedDoctor,
    setSelectedDoctor,
    selectedMode,
    setSelectedMode,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
  } = useBooking();

  const doctor = selectedDoctor || MOCK_DOCTORS[0];

  const daySlots = useMemo(() => generateMockSlots(), []);

  useEffect(() => {
    if (daySlots.length > 0 && !selectedDate) {
      setSelectedDate(daySlots[0]);
    }
  }, [daySlots]);

  const currentSlots = selectedDate ? selectedDate.slots : daySlots[0]?.slots || [];
  const morningSlots = currentSlots.filter((s) => s.period === 'morning');
  const afternoonSlots = currentSlots.filter((s) => s.period === 'afternoon');
  const eveningSlots = currentSlots.filter((s) => s.period === 'evening');

  const currentFee = selectedMode === 'audio' && doctor.audioConsultationFee
    ? doctor.audioConsultationFee
    : doctor.consultationFee;

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.isAvailable) {
      Alert.alert('Slot Unavailable', 'This time slot has already passed or is fully booked. Please choose an upcoming slot.');
      return;
    }
    setSelectedSlot(slot);
  };

  const handleProceedClick = () => {
    if (!selectedSlot || !selectedDate) {
      Alert.alert('Select a Slot', 'Please choose your preferred appointment date and time slot to proceed.');
      return;
    }
    if (!selectedDoctor) {
      setSelectedDoctor(doctor);
    }
    onProceed();
  };

  const [imageError, setImageError] = React.useState(false);
  const fallbackUri = doctor?.gender === 'female'
    ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop';
  const avatarUri = imageError || !doctor?.avatar ? fallbackUri : doctor.avatar;

  const oc = useOCColors();

  return (
    <View style={[docDetailStyles.container, { backgroundColor: oc.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={docDetailStyles.scrollContent}
      >
        <BookingStepper currentStep={1} />

        {/* Doctor Hero Card */}
        <View style={[docDetailStyles.heroCard, { backgroundColor: oc.surface, borderColor: oc.border }]}>
          <View style={docDetailStyles.heroTopRow}>
            <View style={docDetailStyles.avatarWrapper}>
              <Image
                source={{ uri: avatarUri }}
                style={docDetailStyles.avatar}
                onError={() => setImageError(true)}
              />
            </View>

            <View style={docDetailStyles.heroInfo}>
              <View style={docDetailStyles.nameRow}>
                <Text style={[docDetailStyles.doctorName, { color: oc.textPrimary }]}>{doctor.name}</Text>
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              </View>

              <Text style={[docDetailStyles.specialty, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>{doctor.specialty}</Text>
              <Text style={[docDetailStyles.degrees, { color: oc.textMuted }]}>{doctor.degrees}</Text>

              <View style={docDetailStyles.hospitalRow}>
                <Ionicons name="business-outline" size={14} color={oc.textSecondary} />
                <Text style={[docDetailStyles.hospitalName, { color: oc.textSecondary }]} numberOfLines={1}>{doctor.hospital}</Text>
              </View>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={[docDetailStyles.metricsBar, { backgroundColor: oc.borderSubtle }]}>
            <View style={docDetailStyles.metricBox}>
              <Text style={[docDetailStyles.metricValue, { color: oc.textPrimary }]}>{doctor.experienceYears}+ yrs</Text>
              <Text style={[docDetailStyles.metricLabel, { color: oc.textMuted }]}>Experience</Text>
            </View>
            <View style={[docDetailStyles.metricDivider, { backgroundColor: oc.border }]} />
            <View style={docDetailStyles.metricBox}>
              <Text style={[docDetailStyles.metricValue, { color: oc.textPrimary }]}>{doctor.rating} ★</Text>
              <Text style={[docDetailStyles.metricLabel, { color: oc.textMuted }]}>{doctor.totalReviews}+ Reviews</Text>
            </View>
            <View style={[docDetailStyles.metricDivider, { backgroundColor: oc.border }]} />
            <View style={docDetailStyles.metricBox}>
              <Text style={[docDetailStyles.metricValue, { color: oc.textPrimary }]}>{doctor.totalConsultations}+</Text>
              <Text style={[docDetailStyles.metricLabel, { color: oc.textMuted }]}>Patients</Text>
            </View>
          </View>

          {/* Consultation Mode Picker Switch */}
          <View style={docDetailStyles.modeSwitchContainer}>
            <Text style={[docDetailStyles.modeSwitchTitle, { color: oc.textPrimary }]}>Select Consultation Format:</Text>
            <View style={[docDetailStyles.modeToggleGroup, { backgroundColor: oc.borderSubtle }]}>
              <TouchableOpacity
                style={[
                  docDetailStyles.modeToggleBtn,
                  selectedMode === 'video' && docDetailStyles.modeToggleBtnActive,
                ]}
                onPress={() => setSelectedMode('video')}
              >
                <Ionicons
                  name="videocam"
                  size={16}
                  color={selectedMode === 'video' ? '#FFFFFF' : (oc.isDark ? '#86EFAC' : Colors.primaryDark)}
                />
                <Text
                  style={[
                    docDetailStyles.modeToggleText,
                    { color: selectedMode === 'video' ? '#FFFFFF' : oc.textSecondary },
                    selectedMode === 'video' && docDetailStyles.modeToggleTextActive,
                  ]}
                >
                  Video Call (₹{doctor.consultationFee})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  docDetailStyles.modeToggleBtn,
                  selectedMode === 'audio' && docDetailStyles.modeToggleBtnActive,
                ]}
                onPress={() => setSelectedMode('audio')}
              >
                <Ionicons
                  name="call"
                  size={16}
                  color={selectedMode === 'audio' ? '#FFFFFF' : (oc.isDark ? '#86EFAC' : Colors.primaryDark)}
                />
                <Text
                  style={[
                    docDetailStyles.modeToggleText,
                    { color: selectedMode === 'audio' ? '#FFFFFF' : oc.textSecondary },
                    selectedMode === 'audio' && docDetailStyles.modeToggleTextActive,
                  ]}
                >
                  Audio (₹{doctor.audioConsultationFee || doctor.consultationFee})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Doctor Bio */}
        <View style={[docDetailStyles.sectionCard, { backgroundColor: oc.surface, borderColor: oc.border }]}>
          <Text style={[docDetailStyles.sectionTitle, { color: oc.textPrimary }]}>About Doctor</Text>
          <Text style={[docDetailStyles.aboutText, { color: oc.textSecondary }]}>{doctor.about}</Text>
        </View>

        {/* Slot Selection Section */}
        <View style={[docDetailStyles.sectionCard, { backgroundColor: oc.surface, borderColor: oc.border }]}>
          <View style={docDetailStyles.slotHeaderRow}>
            <Text style={[docDetailStyles.sectionTitle, { color: oc.textPrimary }]}>Select Date & Time Slot</Text>
            <View style={docDetailStyles.slotLegend}>
              <View style={docDetailStyles.legendDotAvailable} />
              <Text style={[docDetailStyles.legendText, { color: oc.textMuted }]}>Available</Text>
              <View style={docDetailStyles.legendDotBooked} />
              <Text style={[docDetailStyles.legendText, { color: oc.textMuted }]}>Passed / Booked</Text>
            </View>
          </View>

          {/* Horizontal Date Picker */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={docDetailStyles.datePickerScroll}
          >
            {daySlots.map((day) => {
              const isSelected = selectedDate?.dateString === day.dateString;
              return (
                <TouchableOpacity
                  key={day.dateString}
                  style={[
                    docDetailStyles.dateCard,
                    { backgroundColor: isSelected ? Colors.primary : oc.borderSubtle, borderColor: isSelected ? Colors.primary : oc.border },
                    isSelected && docDetailStyles.dateCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedDate(day);
                    setSelectedSlot(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      docDetailStyles.dayLabel,
                      { color: isSelected ? '#FFFFFF' : oc.textMuted },
                      isSelected && docDetailStyles.dayLabelSelected,
                    ]}
                  >
                    {day.dayLabel}
                  </Text>
                  <Text
                    style={[
                      docDetailStyles.dateFormatted,
                      { color: isSelected ? '#FFFFFF' : oc.textPrimary },
                      isSelected && docDetailStyles.dateFormattedSelected,
                    ]}
                  >
                    {day.dateFormatted}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Morning Slots */}
          <Text style={[docDetailStyles.periodTitle, { color: oc.textSecondary }]}>🌅 Morning Slots</Text>
          <View style={docDetailStyles.slotsGrid}>
            {morningSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    docDetailStyles.slotChip,
                    { backgroundColor: isSelected ? Colors.primary : oc.surface, borderColor: isSelected ? Colors.primary : oc.border },
                    !slot.isAvailable && [docDetailStyles.slotChipBooked, { backgroundColor: oc.borderSubtle, borderColor: oc.border }],
                    isSelected && docDetailStyles.slotChipSelected,
                  ]}
                  disabled={!slot.isAvailable}
                  onPress={() => handleSlotSelect(slot)}
                >
                  <Text
                    style={[
                      docDetailStyles.slotChipText,
                      { color: isSelected ? '#FFFFFF' : (slot.isAvailable ? (oc.isDark ? '#86EFAC' : Colors.primaryDark) : oc.textMuted) },
                      !slot.isAvailable && docDetailStyles.slotChipTextBooked,
                      isSelected && docDetailStyles.slotChipTextSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Afternoon Slots */}
          <Text style={[docDetailStyles.periodTitle, { color: oc.textSecondary }]}>☀️ Afternoon Slots</Text>
          <View style={docDetailStyles.slotsGrid}>
            {afternoonSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    docDetailStyles.slotChip,
                    { backgroundColor: isSelected ? Colors.primary : oc.surface, borderColor: isSelected ? Colors.primary : oc.border },
                    !slot.isAvailable && [docDetailStyles.slotChipBooked, { backgroundColor: oc.borderSubtle, borderColor: oc.border }],
                    isSelected && docDetailStyles.slotChipSelected,
                  ]}
                  disabled={!slot.isAvailable}
                  onPress={() => handleSlotSelect(slot)}
                >
                  <Text
                    style={[
                      docDetailStyles.slotChipText,
                      { color: isSelected ? '#FFFFFF' : (slot.isAvailable ? (oc.isDark ? '#86EFAC' : Colors.primaryDark) : oc.textMuted) },
                      !slot.isAvailable && docDetailStyles.slotChipTextBooked,
                      isSelected && docDetailStyles.slotChipTextSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Evening Slots */}
          <Text style={[docDetailStyles.periodTitle, { color: oc.textSecondary }]}>🌙 Evening Slots</Text>
          <View style={docDetailStyles.slotsGrid}>
            {eveningSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    docDetailStyles.slotChip,
                    { backgroundColor: isSelected ? Colors.primary : oc.surface, borderColor: isSelected ? Colors.primary : oc.border },
                    !slot.isAvailable && [docDetailStyles.slotChipBooked, { backgroundColor: oc.borderSubtle, borderColor: oc.border }],
                    isSelected && docDetailStyles.slotChipSelected,
                  ]}
                  disabled={!slot.isAvailable}
                  onPress={() => handleSlotSelect(slot)}
                >
                  <Text
                    style={[
                      docDetailStyles.slotChipText,
                      { color: isSelected ? '#FFFFFF' : (slot.isAvailable ? (oc.isDark ? '#86EFAC' : Colors.primaryDark) : oc.textMuted) },
                      !slot.isAvailable && docDetailStyles.slotChipTextBooked,
                      isSelected && docDetailStyles.slotChipTextSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 120 + bottomInset }} />
      </ScrollView>

      {/* Sticky Bottom CTA Bar */}
      <View style={[docDetailStyles.bottomBar, { paddingBottom: bottomInset, backgroundColor: oc.surface, borderTopColor: oc.border }]}>
        <View style={docDetailStyles.bottomSlotInfo}>
          <Text style={[docDetailStyles.bottomSlotLabel, { color: oc.textMuted }]}>
            {selectedSlot ? 'Selected Slot' : 'Please Choose a Slot'}
          </Text>
          <Text style={[docDetailStyles.bottomSlotValue, { color: oc.textPrimary }]} numberOfLines={1}>
            {selectedSlot && selectedDate
              ? `${selectedDate.dayLabel}, ${selectedSlot.time}`
              : 'Tap an available time slot'}
          </Text>
          <Text style={[docDetailStyles.bottomFeeText, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>Total: ₹{currentFee + 50}</Text>
        </View>

        <TouchableOpacity
          style={[
            docDetailStyles.proceedButton,
            (!selectedSlot || !selectedDate) && docDetailStyles.proceedButtonDisabled,
          ]}
          disabled={!selectedSlot || !selectedDate}
          onPress={handleProceedClick}
          activeOpacity={0.85}
        >
          <Text style={docDetailStyles.proceedButtonText}>Proceed to Details</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const docDetailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 20 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  heroTopRow: { flexDirection: 'row', gap: 14 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 76, height: 76, borderRadius: 20, backgroundColor: '#E2E8F0' },
  heroInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doctorName: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  specialty: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark, marginTop: 2 },
  degrees: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  hospitalRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  hospitalName: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E6EFE4',
  },
  metricBox: { alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  metricLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  metricDivider: { width: 1, height: '80%', backgroundColor: '#E2E8F0', alignSelf: 'center' },
  modeSwitchContainer: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F0F4F0' },
  modeSwitchTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  modeToggleGroup: { flexDirection: 'row', gap: 8 },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  modeToggleBtnActive: { backgroundColor: Colors.primary },
  modeToggleText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  modeToggleTextActive: { color: '#FFFFFF', fontWeight: '700' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    marginBottom: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  aboutText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginTop: 8 },
  slotHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  slotLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDotAvailable: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  legendDotBooked: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1', marginLeft: 6 },
  legendText: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  datePickerScroll: { flexDirection: 'row', gap: 8, paddingVertical: 4, marginBottom: 16 },
  dateCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAF8',
    borderWidth: 1.5,
    borderColor: '#E6EFE4',
    alignItems: 'center',
    minWidth: 84,
  },
  dateCardSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 4 },
  dayLabelSelected: { color: '#FFFFFF', fontWeight: '700' },
  dateFormatted: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  dateFormattedSelected: { color: '#FFFFFF' },
  periodTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: 10, marginBottom: 8 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  slotChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CDE8C0',
    alignItems: 'center',
  },
  slotChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotChipBooked: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  slotChipText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  slotChipTextSelected: { color: '#FFFFFF' },
  slotChipTextBooked: { color: '#94A3B8', textDecorationLine: 'line-through' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EFE4',
    paddingHorizontal: 18,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomSlotInfo: { flex: 1, marginRight: 12 },
  bottomSlotLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase' },
  bottomSlotValue: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginTop: 1 },
  bottomFeeText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark, marginTop: 2 },
  proceedButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  proceedButtonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
  proceedButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

// ═════════════════════════════════════════════════════════════════════
// 4. PATIENT DETAILS SCREEN
// ═════════════════════════════════════════════════════════════════════
function OCPatientDetailsScreen({ onProceed }: { onProceed: () => void }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 14);
  const oc = useOCColors();

  const {
    patientDetails,
    updatePatientDetails,
    selectedDoctor,
    selectedDate,
    selectedSlot,
    selectedMode,
  } = useBooking();

  const [fullName, setFullName] = useState(patientDetails.fullName || '');
  const [age, setAge] = useState(patientDetails.age || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(patientDetails.gender || 'Male');
  const [phone, setPhone] = useState(patientDetails.phone || '');
  const [email, setEmail] = useState(patientDetails.email || '');
  const [symptoms, setSymptoms] = useState(patientDetails.symptoms || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(patientDetails.selectedSymptomTags || []);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const toggleSymptomTag = (tag: string) => {
    let updated: string[];
    if (selectedTags.includes(tag)) {
      updated = selectedTags.filter((t) => t !== tag);
    } else {
      updated = [...selectedTags, tag];
    }
    setSelectedTags(updated);
    if (!selectedTags.includes(tag)) {
      setSymptoms((prev) => (prev ? `${prev}, ${tag}` : tag));
    }
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = 'Please enter patient full name';
    if (!age.trim() || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 120) {
      errs.age = 'Please enter a valid age (1-120)';
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) errs.phone = 'Please enter a valid 10-digit mobile number';
    // Email is optional and not kept under validation
    if (!symptoms.trim() && selectedTags.length === 0) {
      errs.symptoms = 'Please describe patient health issues or symptoms';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceed = () => {
    if (!validate()) {
      Alert.alert('Incomplete Form', 'Please fill in the required patient details before proceeding.');
      return;
    }
    updatePatientDetails({
      fullName: fullName.trim(),
      age: age.trim(),
      gender,
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      symptoms: symptoms.trim(),
      selectedSymptomTags: selectedTags,
    });
    onProceed();
  };

  return (
    <KeyboardAvoidingView
      style={[patientStyles.container, { backgroundColor: oc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={patientStyles.scrollContent}
      >
        <BookingStepper currentStep={2} />

        {selectedDoctor && selectedDate && selectedSlot && (
          <View style={[patientStyles.summaryBar, { backgroundColor: oc.surface, borderColor: oc.border }]}>
            <View style={patientStyles.summaryLeft}>
              <View style={[patientStyles.modePill, { backgroundColor: oc.isDark ? '#064E3B' : Colors.primaryLight }]}>
                <Ionicons
                  name={selectedMode === 'video' ? 'videocam' : 'call'}
                  size={12}
                  color={oc.isDark ? '#86EFAC' : Colors.primaryDark}
                />
                <Text style={[patientStyles.modePillText, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>
                  {selectedMode === 'video' ? 'Video' : 'Audio'}
                </Text>
              </View>
              <Text style={[patientStyles.summaryDoctorText, { color: oc.textPrimary }]} numberOfLines={1}>
                {selectedDoctor.name}
              </Text>
            </View>
            <View style={patientStyles.summaryRight}>
              <Text style={[patientStyles.summaryTimeText, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>
                {selectedDate.dayLabel}, {selectedSlot.time}
              </Text>
            </View>
          </View>
        )}

        <View style={[patientStyles.card, { backgroundColor: oc.surface, borderColor: oc.border }]}>
          <Text style={[patientStyles.cardHeaderTitle, { color: oc.textPrimary }]}>Patient Information</Text>
          <Text style={[patientStyles.cardHeaderSubtitle, { color: oc.textMuted }]}>
            This information will appear on your official consultation report
          </Text>

          {/* Full Name */}
          <View style={patientStyles.fieldContainer}>
            <Text style={[patientStyles.fieldLabel, { color: oc.textPrimary }]}>
              Full Name <Text style={patientStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                patientStyles.input,
                { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary },
                errors.fullName ? patientStyles.inputError : null,
              ]}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={oc.textMuted}
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (errors.fullName) setErrors((e) => ({ ...e, fullName: '' }));
              }}
            />
            {errors.fullName ? <Text style={patientStyles.errorText}>{errors.fullName}</Text> : null}
          </View>

          {/* Age and Gender */}
          <View style={patientStyles.rowFields}>
            <View style={[patientStyles.fieldContainer, { flex: 0.4 }]}>
              <Text style={[patientStyles.fieldLabel, { color: oc.textPrimary }]}>
                Age <Text style={patientStyles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  patientStyles.input,
                  { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary },
                  errors.age ? patientStyles.inputError : null,
                ]}
                placeholder="e.g. 28"
                placeholderTextColor={oc.textMuted}
                keyboardType="numeric"
                maxLength={3}
                value={age}
                onChangeText={(t) => {
                  setAge(t);
                  if (errors.age) setErrors((e) => ({ ...e, age: '' }));
                }}
              />
              {errors.age ? <Text style={patientStyles.errorText}>{errors.age}</Text> : null}
            </View>

            <View style={[patientStyles.fieldContainer, { flex: 0.6 }]}>
              <Text style={[patientStyles.fieldLabel, { color: oc.textPrimary }]}>Gender</Text>
              <View style={[patientStyles.genderRow, { backgroundColor: oc.borderSubtle }]}>
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      patientStyles.genderChip,
                      gender === g && patientStyles.genderChipSelected,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        patientStyles.genderChipText,
                        { color: gender === g ? '#FFFFFF' : oc.textSecondary },
                        gender === g && patientStyles.genderChipTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Phone Number */}
          <View style={patientStyles.fieldContainer}>
            <Text style={[patientStyles.fieldLabel, { color: oc.textPrimary }]}>
              WhatsApp Mobile Number <Text style={patientStyles.requiredStar}>*</Text>
            </Text>
            <View style={patientStyles.phoneInputRow}>
              <View style={[patientStyles.countryCodeBox, { backgroundColor: oc.borderSubtle, borderColor: oc.border }]}>
                <Text style={[patientStyles.countryCodeText, { color: oc.textPrimary }]}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={[
                  patientStyles.input,
                  patientStyles.phoneInput,
                  { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary },
                  errors.phone ? patientStyles.inputError : null,
                ]}
                placeholder="Enter Your mobile Number"
                placeholderTextColor={oc.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  if (errors.phone) setErrors((e) => ({ ...e, phone: '' }));
                }}
              />
            </View>
            <Text style={[patientStyles.fieldHelper, { color: oc.textMuted }]}>
              Report and meeting link will be dispatched to this WhatsApp number
            </Text>
            {errors.phone ? <Text style={patientStyles.errorText}>{errors.phone}</Text> : null}
          </View>

          {/* Email Address */}
          <View style={patientStyles.fieldContainer}>
            <Text style={[patientStyles.fieldLabel, { color: oc.textPrimary }]}>
              Email Address <Text style={patientStyles.optionalText}>(Optional)</Text>
            </Text>
            <TextInput
              style={[
                patientStyles.input,
                { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary },
                errors.email ? patientStyles.inputError : null,
              ]}
              placeholder="e.g. patient@example.com"
              placeholderTextColor={oc.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: '' }));
              }}
            />
            {errors.email ? <Text style={patientStyles.errorText}>{errors.email}</Text> : null}
          </View>
        </View>

        {/* Symptoms and Health Problem */}
        <View style={[patientStyles.card, { backgroundColor: oc.surface, borderColor: oc.border }]}>
          <Text style={[patientStyles.cardHeaderTitle, { color: oc.textPrimary }]}>Health Problem & Symptoms</Text>
          <Text style={[patientStyles.cardHeaderSubtitle, { color: oc.textMuted }]}>
            Tap common symptoms or type custom medical concerns
          </Text>

          <View style={patientStyles.symptomsTagsContainer}>
            {COMMON_SYMPTOMS.map((sym) => {
              const isSelected = selectedTags.includes(sym);
              return (
                <TouchableOpacity
                  key={sym}
                  style={[
                    patientStyles.symptomTag,
                    { backgroundColor: isSelected ? (oc.isDark ? '#064E3B' : Colors.primaryLight) : oc.borderSubtle, borderColor: isSelected ? Colors.primary : oc.border },
                    isSelected && patientStyles.symptomTagSelected,
                  ]}
                  onPress={() => toggleSymptomTag(sym)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      patientStyles.symptomTagText,
                      { color: isSelected ? (oc.isDark ? '#86EFAC' : Colors.primaryDark) : oc.textSecondary },
                      isSelected && patientStyles.symptomTagTextSelected,
                    ]}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {sym}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[patientStyles.fieldContainer, { marginTop: 14 }]}>
            <Text style={[patientStyles.fieldLabel, { color: oc.textPrimary }]}>
              Detailed Description <Text style={patientStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                patientStyles.textarea,
                { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary },
                errors.symptoms ? patientStyles.inputError : null,
              ]}
              placeholder="Describe symptoms, duration, current medicines, or allergies..."
              placeholderTextColor={oc.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={symptoms}
              onChangeText={(t) => {
                setSymptoms(t);
                if (errors.symptoms) setErrors((e) => ({ ...e, symptoms: '' }));
              }}
            />
            {errors.symptoms ? <Text style={patientStyles.errorText}>{errors.symptoms}</Text> : null}
          </View>
        </View>

        <View style={{ height: 110 + bottomInset }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[patientStyles.bottomBar, { paddingBottom: bottomInset, backgroundColor: oc.surface, borderTopColor: oc.border }]}>
        <View style={patientStyles.feeReview}>
          <Text style={[patientStyles.feeReviewLabel, { color: oc.textMuted }]}>Consultation Fee</Text>
          <Text style={[patientStyles.feeReviewAmount, { color: oc.textPrimary }]}>
            ₹{(selectedMode === 'audio' && selectedDoctor?.audioConsultationFee ? selectedDoctor.audioConsultationFee : (selectedDoctor?.consultationFee || 499)) + 50}
          </Text>
        </View>

        <TouchableOpacity
          style={patientStyles.proceedBtn}
          onPress={handleProceed}
          activeOpacity={0.88}
        >
          <Text style={patientStyles.proceedBtnText}>Proceed to Payment</Text>
          <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const patientStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 20 },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    marginBottom: 14,
  },
  summaryLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  modePillText: { fontSize: 11, fontWeight: '700', color: Colors.primaryDark },
  summaryDoctorText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  summaryRight: { alignItems: 'flex-end' },
  summaryTimeText: { fontSize: 12, fontWeight: '600', color: Colors.primaryDark },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    marginBottom: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  cardHeaderSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginBottom: 14 },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  requiredStar: { color: '#DC2626' },
  optionalText: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  input: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1.5,
    borderColor: '#E2EDE0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  errorText: { fontSize: 11, color: '#DC2626', marginTop: 4, fontWeight: '500' },
  fieldHelper: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  rowFields: { flexDirection: 'row', gap: 12 },
  genderRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 3,
    height: 48,
    alignItems: 'center',
  },
  genderChip: { flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  genderChipSelected: { backgroundColor: Colors.primary },
  genderChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  genderChipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  phoneInputRow: { flexDirection: 'row', gap: 8 },
  countryCodeBox: {
    height: 48,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countryCodeText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  phoneInput: { flex: 1 },
  symptomsTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomTag: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  symptomTagSelected: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  symptomTagText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  symptomTagTextSelected: { color: Colors.primaryDark, fontWeight: '700' },
  textarea: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1.5,
    borderColor: '#E2EDE0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 85,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EFE4',
    paddingHorizontal: 18,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  feeReview: { justifyContent: 'center' },
  feeReviewLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  feeReviewAmount: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  proceedBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  proceedBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

// ═════════════════════════════════════════════════════════════════════
// 5. CHECKOUT SCREEN
// ═════════════════════════════════════════════════════════════════════
function OCCheckoutScreen({ onConfirmed, onBack }: { onConfirmed: () => void; onBack: () => void }) {
  const oc = useOCColors();
  const {
    selectedDoctor,
    selectedMode,
    confirmBooking,
  } = useBooking();

  const doctor = selectedDoctor || MOCK_DOCTORS[0];
  const fee = selectedMode === 'audio' && doctor.audioConsultationFee
    ? doctor.audioConsultationFee
    : doctor.consultationFee;
  const platformFee = 50;
  const totalAmount = fee + platformFee;

  return (
    <View style={{ flex: 1, backgroundColor: oc.background }}>
      <PaymentCheckoutScreen
        grandTotal={totalAmount}
        hideCOD={true}
        hideReceiptModal={true}
        title="Consultation Fee Payment"
        subtitle="256-bit Encrypted • Online Tele-Consult"
        onBack={onBack}
        onOrderSuccess={(details) => {
          const methodLabel = details?.paymentModeLabel || 'Online (UPI/Card)';
          confirmBooking(methodLabel, 0);
          onConfirmed();
        }}
      />
    </View>
  );
}

const checkoutStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 20 },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    marginBottom: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  modeBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primaryDark },
  doctorInfoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  doctorAvatar: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#E2E8F0' },
  doctorDetails: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  doctorSpecialty: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600', marginTop: 1 },
  doctorHospital: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  slotDetailsBox: {
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E6EFE4',
  },
  slotDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotDetailText: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  patientInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 4 },
  patientLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  patientValue: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    marginBottom: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  feeInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  billLabel: { fontSize: 13, color: Colors.textSecondary },
  billValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: '#F0F4F0', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  taxInclusive: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  totalAmount: { fontSize: 20, fontWeight: '800', color: Colors.primaryDark },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E6EFE4',
    marginBottom: 10,
    gap: 12,
  },
  paymentOptionSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  optionInfo: { flex: 1 },
  optionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  popularBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  popularBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.primaryDark },
  optionSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  upiAppsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  upiAppBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2EDE0',
  },
  upiAppBtnSelected: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  upiAppText: { fontSize: 11, fontWeight: '700', color: Colors.primaryDark },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EFE4',
    paddingHorizontal: 18,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  finalTotalInfo: { justifyContent: 'center' },
  finalTotalLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  finalTotalAmount: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  payButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  payButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

// ═════════════════════════════════════════════════════════════════════
// 6. BOOKING SUCCESS SCREEN
// ═════════════════════════════════════════════════════════════════════
function OCBookingSuccessScreen({
  onReturnHome,
  onJoinCall,
}: {
  onReturnHome: () => void;
  onJoinCall: (booking: BookingSummary) => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 14);
  const oc = useOCColors();

  const { activeBooking, bookingHistory } = useBooking();
  const [isCopied, setIsCopied] = useState(false);

  const booking = activeBooking || bookingHistory[0];

  if (!booking) {
    return (
      <View style={[successStyles.emptyContainer, { backgroundColor: oc.background }]}>
        <Text style={[successStyles.emptyText, { color: oc.textPrimary }]}>No active booking found.</Text>
        <TouchableOpacity style={successStyles.homeBtn} onPress={onReturnHome}>
          <Text style={successStyles.homeBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    bookingId,
    doctor,
    date,
    time,
    mode,
    patient,
    feeBreakdown,
    paymentMethod,
    meetingLink,
  } = booking;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(meetingLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
      Alert.alert('Link Copied! 📋', 'Video consultation link copied:\n' + meetingLink);
    } catch (e) {
      Alert.alert('Copied', meetingLink);
    }
  };

  const generateReportText = (): string => {
    return `🏥 *ONEBUDDY HEALTH CONSULTATION CONFIRMATION*\n` +
      `----------------------------------------\n` +
      `📌 *Booking ID:* ${bookingId}\n` +
      `👨‍⚕️ *Doctor:* ${doctor.name} (${doctor.specialty})\n` +
      `🏥 *Hospital:* ${doctor.hospital}\n` +
      `📅 *Date & Time:* ${date} at ${time}\n` +
      `💻 *Format:* ${mode === 'video' ? 'Online Video Consultation' : 'Audio Consultation'}\n\n` +
      `👤 *Patient Details:*\n` +
      `• Name: ${patient.fullName}\n` +
      `• Age/Gender: ${patient.age} yrs, ${patient.gender}\n` +
      `• Symptoms: ${patient.symptoms || patient.selectedSymptomTags.join(', ') || 'N/A'}\n\n` +
      `🔗 *Join Video Consultation Link:*\n${meetingLink}\n\n` +
      `💳 *Paid Amount:* ₹${feeBreakdown.totalAmount} via ${paymentMethod}\n` +
      `----------------------------------------\n` +
      `Please join 5 minutes before your scheduled slot.`;
  };

  const handleShareWhatsApp = async () => {
    const rawNumber = patient.phone.replace(/[^0-9]/g, '');
    const formattedNumber = rawNumber.length === 10 ? `91${rawNumber}` : rawNumber;
    const text = encodeURIComponent(generateReportText());
    const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${text}`;
    const webWhatsappUrl = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${text}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webWhatsappUrl);
      }
    } catch (error) {
      handleNativeShare();
    }
  };

  const handleShareEmail = async () => {
    const subject = encodeURIComponent(`OneBuddy Medical Appointment Report - ${bookingId}`);
    const body = encodeURIComponent(generateReportText());
    const mailtoUrl = `mailto:${patient.email}?subject=${subject}&body=${body}`;

    try {
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      handleNativeShare();
    }
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        title: `Appointment Confirmation - ${bookingId}`,
        message: generateReportText(),
        url: meetingLink,
      });
    } catch (e) {
      console.log('Share error', e);
    }
  };

  return (
    <View style={[successStyles.container, { backgroundColor: oc.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={successStyles.scrollContent}
      >
        {/* Success Header */}
        <View style={successStyles.successHeader}>
          <View style={successStyles.checkCircle}>
            <Ionicons name="checkmark" size={36} color="#FFFFFF" />
          </View>
          <Text style={[successStyles.successTitle, { color: oc.textPrimary }]}>Booking Confirmed!</Text>
          <Text style={[successStyles.successSubtitle, { color: oc.textSecondary }]}>
            Appointment scheduled with {doctor.name}
          </Text>
        </View>

        {/* UNIFIED PATIENT & CONSULTATION SUMMARY CARD */}
        <View style={[successStyles.summaryCard, { backgroundColor: oc.surface, borderColor: oc.border }]}>
          {/* Header ID & Status */}
          <View style={successStyles.cardHeaderRow}>
            <View>
              <Text style={[successStyles.bookingIdLabel, { color: oc.textMuted }]}>APPOINTMENT ID</Text>
              <Text style={[successStyles.bookingIdValue, { color: oc.textPrimary }]}>{bookingId}</Text>
            </View>
            <View style={[successStyles.statusPill, { backgroundColor: oc.isDark ? '#064E3B' : '#DCFCE7' }]}>
              <Text style={[successStyles.statusPillText, { color: oc.isDark ? '#86EFAC' : '#15803D' }]}>CONFIRMED ✓</Text>
            </View>
          </View>

          <View style={[successStyles.divider, { backgroundColor: oc.borderSubtle }]} />

          {/* 1. Patient Medical Details */}
          <Text style={[successStyles.sectionHeading, { color: oc.textPrimary }]}>Patient Summary</Text>
          <View style={successStyles.patientGrid}>
            <View style={successStyles.detailRow}>
              <Text style={[successStyles.detailLabel, { color: oc.textMuted }]}>Patient Name:</Text>
              <Text style={[successStyles.detailValue, { color: oc.textPrimary }]}>{patient.fullName}</Text>
            </View>
            <View style={successStyles.detailRow}>
              <Text style={[successStyles.detailLabel, { color: oc.textMuted }]}>Age / Gender:</Text>
              <Text style={[successStyles.detailValue, { color: oc.textPrimary }]}>{patient.age} Yrs • {patient.gender}</Text>
            </View>
            <View style={successStyles.detailRow}>
              <Text style={[successStyles.detailLabel, { color: oc.textMuted }]}>Mobile:</Text>
              <Text style={[successStyles.detailValue, { color: oc.textPrimary }]}>+91 {patient.phone}</Text>
            </View>
            <View style={successStyles.detailRow}>
              <Text style={[successStyles.detailLabel, { color: oc.textMuted }]}>Email:</Text>
              <Text style={[successStyles.detailValue, { color: oc.textPrimary }]}>{patient.email}</Text>
            </View>
            <View style={successStyles.detailRow}>
              <Text style={[successStyles.detailLabel, { color: oc.textMuted }]}>Reported Issues:</Text>
              <Text style={[successStyles.detailValue, { color: oc.textPrimary, flex: 1 }]}>
                {patient.symptoms || patient.selectedSymptomTags.join(', ') || 'General Consultation'}
              </Text>
            </View>
          </View>

          <View style={[successStyles.divider, { backgroundColor: oc.borderSubtle }]} />

          {/* 2. Doctor Information */}
          <Text style={[successStyles.sectionHeading, { color: oc.textPrimary }]}>Doctor Details</Text>
          <View style={successStyles.doctorRow}>
            <Image source={{ uri: doctor.avatar }} style={successStyles.doctorAvatar} />
            <View style={successStyles.doctorInfo}>
              <Text style={[successStyles.doctorName, { color: oc.textPrimary }]}>{doctor.name}</Text>
              <Text style={[successStyles.doctorSpecialty, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>{doctor.specialty}</Text>
              <Text style={[successStyles.doctorHospital, { color: oc.textMuted }]}>{doctor.hospital}</Text>
              <Text style={[successStyles.slotTimeText, { color: oc.textSecondary }]}>{date} at {time}</Text>
            </View>
          </View>

          <View style={[successStyles.divider, { backgroundColor: oc.borderSubtle }]} />

          {/* 3. Integrated Consultation Link & Controls */}
          <Text style={[successStyles.sectionHeading, { color: oc.textPrimary }]}>
            {mode === 'audio' ? 'Audio Consultation Room' : 'Video Consultation Room'}
          </Text>
          <Text style={[successStyles.meetingHint, { color: oc.textMuted }]}>
            {mode === 'audio'
              ? 'Join your encrypted voice consultation using the secure room line below:'
              : 'Join your encrypted online consultation using the secure meeting link below:'}
          </Text>

          <View style={[successStyles.meetingLinkBox, { backgroundColor: oc.borderSubtle, borderColor: oc.border }]}>
            <Text style={[successStyles.meetingLinkText, { color: oc.textPrimary }]} numberOfLines={1}>
              {meetingLink}
            </Text>
            <TouchableOpacity
              style={[successStyles.copyBtn, isCopied && successStyles.copyBtnSuccess]}
              onPress={handleCopyLink}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isCopied ? 'checkmark-done' : 'copy-outline'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={successStyles.copyBtnText}>{isCopied ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              successStyles.joinCallBtn,
              mode === 'audio' && { backgroundColor: '#0284C7' },
            ]}
            onPress={() => onJoinCall(booking)}
            activeOpacity={0.88}
          >
            <Ionicons name={mode === 'audio' ? 'call' : 'videocam'} size={18} color="#FFFFFF" />
            <Text style={successStyles.joinCallBtnText}>
              {mode === 'audio' ? 'Join Audio Call Now' : 'Join Video Call Now'}
            </Text>
          </TouchableOpacity>

          <View style={[successStyles.divider, { backgroundColor: oc.borderSubtle }]} />

          {/* 4. Direct WhatsApp & Email Share Actions */}
          <Text style={[successStyles.sectionHeading, { color: oc.textPrimary }]}>Send Report & Link Directly</Text>
          <View style={successStyles.shareButtonsRow}>
            <TouchableOpacity
              style={[successStyles.shareBtn, successStyles.whatsappBtn]}
              onPress={handleShareWhatsApp}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
              <Text style={successStyles.shareBtnText}>WhatsApp (+91 {patient.phone.slice(-4)})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[successStyles.shareBtn, successStyles.emailBtn]}
              onPress={handleShareEmail}
              activeOpacity={0.85}
            >
              <Ionicons name="mail" size={16} color="#FFFFFF" />
              <Text style={successStyles.shareBtnText}>Email to Patient</Text>
            </TouchableOpacity>
          </View>

          <View style={[successStyles.divider, { backgroundColor: oc.borderSubtle }]} />

          {/* 5. Payment Summary */}
          <Text style={[successStyles.sectionHeading, { color: oc.textPrimary }]}>Payment Summary</Text>
          <View style={successStyles.receiptRow}>
            <Text style={[successStyles.receiptLabel, { color: oc.textSecondary }]}>Consultation Fee</Text>
            <Text style={[successStyles.receiptValue, { color: oc.textPrimary }]}>₹{feeBreakdown.consultationFee}</Text>
          </View>
          <View style={successStyles.receiptRow}>
            <Text style={[successStyles.receiptLabel, { color: oc.textSecondary }]}>Platform Fee</Text>
            <Text style={[successStyles.receiptValue, { color: oc.textPrimary }]}>₹{feeBreakdown.platformFee}</Text>
          </View>
          <View style={[successStyles.receiptRow, successStyles.receiptTotalRow, { borderTopColor: oc.borderSubtle }]}>
            <Text style={[successStyles.receiptTotalLabel, { color: oc.textPrimary }]}>Total Paid Amount</Text>
            <Text style={[successStyles.receiptTotalValue, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>₹{feeBreakdown.totalAmount} (PAID)</Text>
          </View>
        </View>

        <View style={{ height: 90 + bottomInset }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[successStyles.stickyBottomBar, { paddingBottom: bottomInset, backgroundColor: oc.surface, borderTopColor: oc.border }]}>
        <TouchableOpacity
          style={successStyles.stickyHomeBtn}
          onPress={onReturnHome}
          activeOpacity={0.88}
        >
          <Ionicons name="home" size={18} color="#FFFFFF" />
          <Text style={successStyles.stickyHomeBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const successStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 20 },
  successHeader: { alignItems: 'center', marginVertical: 12 },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  successSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.2,
    borderColor: '#E6EFE4',
    marginBottom: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingIdLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  bookingIdValue: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  statusPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: '800', color: '#15803D' },
  divider: { height: 1, backgroundColor: '#F0F4F0', marginVertical: 14 },
  sectionHeading: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  patientGrid: { gap: 6 },
  detailRow: { flexDirection: 'row', gap: 8 },
  detailLabel: { width: 120, fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  detailValue: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  doctorRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  doctorAvatar: { width: 54, height: 54, borderRadius: 14, backgroundColor: '#E2E8F0' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  doctorSpecialty: { fontSize: 12, fontWeight: '600', color: Colors.primaryDark },
  doctorHospital: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  slotTimeText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginTop: 2 },
  meetingHint: { fontSize: 12, color: Colors.textMuted, marginBottom: 10 },
  meetingLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDE8C0',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 8,
  },
  meetingLinkText: { flex: 1, fontSize: 12, color: Colors.textPrimary, fontWeight: '600' },
  copyBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  copyBtnSuccess: { backgroundColor: '#16A34A' },
  copyBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  joinCallBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  joinCallBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  shareButtonsRow: { flexDirection: 'row', gap: 10 },
  shareBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  whatsappBtn: { backgroundColor: '#25D366' },
  emailBtn: { backgroundColor: '#0284C7' },
  shareBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  receiptLabel: { fontSize: 12, color: Colors.textSecondary },
  receiptValue: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  receiptTotalRow: { borderTopWidth: 1, borderTopColor: '#F0F4F0', paddingTop: 8, marginTop: 4 },
  receiptTotalLabel: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  receiptTotalValue: { fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EFE4',
    paddingHorizontal: 18,
    paddingTop: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  stickyHomeBtn: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  stickyHomeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  homeBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  homeBtnText: { color: '#FFFFFF', fontWeight: '700' },
});

// ═════════════════════════════════════════════════════════════════════
// 7. APPOINTMENTS TAB SCREEN
// ═════════════════════════════════════════════════════════════════════
function OCAppointmentsScreen({
  onFindSpecialist,
  onJoinCall,
  onClose,
  onBack,
  topInset = 0,
}: {
  onFindSpecialist: () => void;
  onJoinCall: (booking: BookingSummary) => void;
  onClose: () => void;
  onBack?: () => void;
  topInset?: number;
}) {
  const oc = useOCColors();
  const { bookingHistory } = useBooking();

  const handleCopyLink = async (link: string) => {
    try {
      await Clipboard.setStringAsync(link);
      Alert.alert('Link Copied! 📋', 'Video room link copied:\n' + link);
    } catch (e) {
      Alert.alert('Copied', link);
    }
  };

  const handleShareWhatsApp = (item: BookingSummary) => {
    const rawNumber = item.patient.phone.replace(/[^0-9]/g, '');
    const formattedNumber = rawNumber.length === 10 ? `91${rawNumber}` : rawNumber;
    const msg = encodeURIComponent(
      `🏥 *ONEBUDDY CONSULTATION DETAILS*\n` +
      `📌 Booking ID: ${item.bookingId}\n` +
      `👨‍⚕️ Doctor: ${item.doctor.name} (${item.doctor.specialty})\n` +
      `📅 Date & Time: ${item.date} at ${item.time}\n` +
      `👤 Patient: ${item.patient.fullName}\n` +
      `🔗 Video Call Link: ${item.meetingLink}`
    );
    Linking.openURL(`whatsapp://send?phone=${formattedNumber}&text=${msg}`).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${formattedNumber}&text=${msg}`);
    });
  };

  const renderBookingItem = ({ item }: { item: BookingSummary }) => (
    <View style={[apptStyles.bookingCard, { backgroundColor: oc.surface, borderColor: oc.border }]}>
      <View style={apptStyles.cardHeader}>
        <View style={apptStyles.idRow}>
          <Text style={[apptStyles.bookingIdText, { color: oc.textPrimary }]}>{item.bookingId}</Text>
          <View style={[apptStyles.statusPill, { backgroundColor: oc.isDark ? '#064E3B' : '#DCFCE7' }]}>
            <Text style={[apptStyles.statusText, { color: oc.isDark ? '#86EFAC' : '#15803D' }]}>CONFIRMED ✓</Text>
          </View>
        </View>
        <Text style={[apptStyles.dateText, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>{item.date} • {item.time}</Text>
      </View>

      <View style={[apptStyles.divider, { backgroundColor: oc.borderSubtle }]} />

      <View style={apptStyles.doctorRow}>
        <Image
          source={{
            uri:
              item.doctor.avatar ||
              (item.doctor.gender === 'female'
                ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop'
                : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop'),
          }}
          style={apptStyles.doctorAvatar}
        />
        <View style={apptStyles.doctorInfo}>
          <Text style={[apptStyles.doctorName, { color: oc.textPrimary }]}>{item.doctor.name}</Text>
          <Text style={[apptStyles.doctorSpecialty, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>{item.doctor.specialty}</Text>
          <Text style={[apptStyles.hospitalText, { color: oc.textMuted }]}>{item.doctor.hospital}</Text>
        </View>
      </View>

      <View style={[apptStyles.patientRow, { backgroundColor: oc.borderSubtle }]}>
        <Ionicons name="person-outline" size={14} color={oc.textSecondary} />
        <Text style={[apptStyles.patientName, { color: oc.textSecondary }]}>
          Patient: {item.patient.fullName} ({item.patient.age} yrs, {item.patient.gender})
        </Text>
      </View>

      <View style={[apptStyles.meetingBox, { backgroundColor: oc.isDark ? '#064E3B20' : '#F0FDF4', borderColor: oc.isDark ? '#064E3B' : '#DCFCE7' }]}>
        <View style={apptStyles.meetingTextWrapper}>
          <Ionicons name="videocam" size={14} color={Colors.primary} />
          <Text style={[apptStyles.meetingLink, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]} numberOfLines={1}>
            {item.meetingLink}
          </Text>
        </View>
        <TouchableOpacity
          style={apptStyles.copyBtn}
          onPress={() => handleCopyLink(item.meetingLink)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="copy-outline" size={14} color={oc.isDark ? '#86EFAC' : Colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <View style={apptStyles.actionRow}>
        <TouchableOpacity
          style={[
            apptStyles.joinButton,
            item.mode === 'audio' && { backgroundColor: '#0284C7' },
          ]}
          onPress={() => onJoinCall(item)}
          activeOpacity={0.88}
        >
          <Ionicons name={item.mode === 'audio' ? 'call' : 'videocam'} size={16} color="#FFFFFF" />
          <Text style={apptStyles.joinButtonText}>
            {item.mode === 'audio' ? 'Join Audio Call' : 'Join Video Call'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={apptStyles.whatsappBtn}
          onPress={() => handleShareWhatsApp(item)}
          activeOpacity={0.88}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
          <Text style={apptStyles.whatsappBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[apptStyles.container, { backgroundColor: oc.background }]}>
      <View style={[apptStyles.header, { paddingTop: topInset > 0 ? topInset + 8 : 12, backgroundColor: oc.surface, borderBottomColor: oc.border }]}>
        {onBack && (
          <TouchableOpacity
            style={[flowStyles.headerBtn, { marginRight: 10, backgroundColor: oc.borderSubtle }]}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            accessibilityLabel="Back to Home"
          >
            <Ionicons name="arrow-back" size={22} color={oc.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[apptStyles.headerTitle, { color: oc.textPrimary }]}>My Appointments</Text>
          <Text style={[apptStyles.headerSubtitle, { color: oc.textMuted }]}>
            {bookingHistory.length} scheduled online doctor consultation{bookingHistory.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[flowStyles.closeModalBtn, { backgroundColor: oc.borderSubtle }]}
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={oc.textPrimary} />
        </TouchableOpacity>
      </View>

      {bookingHistory.length === 0 ? (
        <View style={apptStyles.emptyContainer}>
          <View style={[apptStyles.emptyIconCircle, { backgroundColor: oc.isDark ? '#064E3B' : Colors.primaryLight }]}>
            <Ionicons name="calendar-outline" size={42} color={Colors.primary} />
          </View>
          <Text style={[apptStyles.emptyTitle, { color: oc.textPrimary }]}>No Appointments Booked Yet</Text>
          <Text style={[apptStyles.emptySubtitle, { color: oc.textMuted }]}>
            Consult top specialist doctors online via instant video or audio call.
          </Text>
          <TouchableOpacity
            style={apptStyles.bookNowButton}
            onPress={onFindSpecialist}
          >
            <Text style={apptStyles.bookNowButtonText}>Find a Specialist</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookingHistory}
          keyExtractor={(item) => item.bookingId}
          renderItem={renderBookingItem}
          contentContainerStyle={apptStyles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const apptStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 30, gap: 14 },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { marginBottom: 8 },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bookingIdText: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  statusPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#15803D' },
  dateText: { fontSize: 12, fontWeight: '600', color: Colors.primaryDark },
  divider: { height: 1, backgroundColor: '#F0F4F0', marginVertical: 10 },
  doctorRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  doctorAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E2E8F0' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  doctorSpecialty: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600' },
  hospitalText: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAF8',
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  patientName: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  meetingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: 10,
  },
  meetingTextWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  meetingLink: { fontSize: 11, color: Colors.primaryDark, fontWeight: '600' },
  copyBtn: { padding: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  joinButton: {
    flex: 1.2,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  joinButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  whatsappBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 16, marginBottom: 16 },
  bookNowButton: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  bookNowButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

// ═════════════════════════════════════════════════════════════════════
// 8. PROFILE TAB SCREEN
// ═════════════════════════════════════════════════════════════════════
function OCProfileScreen({
  onClose,
  onBack,
  topInset = 0,
}: {
  onClose: () => void;
  onBack?: () => void;
  topInset?: number;
}) {
  const oc = useOCColors();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('Rahul Sharma');
  const [phone, setPhone] = useState('9876543210');
  const [email, setEmail] = useState('rahul.sharma@example.com');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('28');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [city, setCity] = useState('Bangalore, India');
  const [emergencyContact, setEmergencyContact] = useState('9876500000');

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    setIsEditing(false);
    Alert.alert('Profile Saved ✅', 'Your health account details have been updated successfully.');
  };

  return (
    <View style={[profStyles.container, { backgroundColor: oc.background }]}>
      <View style={[profStyles.header, { paddingTop: topInset > 0 ? topInset + 8 : 12, backgroundColor: oc.surface, borderBottomColor: oc.border }]}>
        {onBack && (
          <TouchableOpacity
            style={[flowStyles.headerBtn, { marginRight: 10, backgroundColor: oc.borderSubtle }]}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            accessibilityLabel="Back to Home"
          >
            <Ionicons name="arrow-back" size={22} color={oc.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[profStyles.headerTitle, { color: oc.textPrimary }]}>My Health Profile</Text>
          <Text style={[profStyles.headerSubtitle, { color: oc.textMuted }]}>Manage personal and medical information</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[profStyles.actionBtn, isEditing ? profStyles.saveBtn : profStyles.editBtn]}
            onPress={isEditing ? handleSave : () => setIsEditing(true)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isEditing ? 'checkmark-sharp' : 'pencil'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={profStyles.actionBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[flowStyles.closeModalBtn, { backgroundColor: oc.borderSubtle }]}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={oc.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={profStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[profStyles.userCard, { backgroundColor: oc.surface, borderColor: oc.border }]}>
            <View style={[profStyles.avatarCircle, { backgroundColor: oc.isDark ? '#064E3B' : Colors.primaryLight }]}>
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
            <View style={profStyles.userInfo}>
              <Text style={[profStyles.userName, { color: oc.textPrimary }]}>{fullName}</Text>
              <Text style={[profStyles.userPhone, { color: oc.textSecondary }]}>+91 {phone}</Text>
              <View style={profStyles.verifiedTag}>
                <Ionicons name="shield-checkmark" size={12} color={oc.isDark ? '#86EFAC' : Colors.primaryDark} />
                <Text style={[profStyles.verifiedText, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]}>OneBuddy Health Verified</Text>
              </View>
            </View>
          </View>

          <View style={[profStyles.card, { backgroundColor: oc.surface, borderColor: oc.border }]}>
            <Text style={[profStyles.cardTitle, { color: oc.textPrimary }]}>Personal Details</Text>

            <View style={[profStyles.fieldItem, { borderBottomColor: oc.borderSubtle }]}>
              <Text style={[profStyles.fieldLabel, { color: oc.textMuted }]}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  style={[profStyles.input, { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Full Name"
                  placeholderTextColor={oc.textMuted}
                />
              ) : (
                <Text style={[profStyles.fieldValue, { color: oc.textPrimary }]}>{fullName}</Text>
              )}
            </View>

            <View style={[profStyles.fieldItem, { borderBottomColor: oc.borderSubtle }]}>
              <Text style={[profStyles.fieldLabel, { color: oc.textMuted }]}>Mobile Number</Text>
              {isEditing ? (
                <TextInput
                  style={[profStyles.input, { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary }]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="Mobile Number"
                  placeholderTextColor={oc.textMuted}
                />
              ) : (
                <Text style={[profStyles.fieldValue, { color: oc.textPrimary }]}>+91 {phone}</Text>
              )}
            </View>

            <View style={[profStyles.fieldItem, { borderBottomColor: oc.borderSubtle }]}>
              <Text style={[profStyles.fieldLabel, { color: oc.textMuted }]}>Email Address</Text>
              {isEditing ? (
                <TextInput
                  style={[profStyles.input, { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary }]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Email Address"
                  placeholderTextColor={oc.textMuted}
                />
              ) : (
                <Text style={[profStyles.fieldValue, { color: oc.textPrimary }]}>{email}</Text>
              )}
            </View>

            <View style={profStyles.rowFields}>
              <View style={[profStyles.fieldItem, { flex: 1, borderBottomColor: oc.borderSubtle }]}>
                <Text style={[profStyles.fieldLabel, { color: oc.textMuted }]}>Age</Text>
                {isEditing ? (
                  <TextInput
                    style={[profStyles.input, { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary }]}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    maxLength={3}
                    placeholder="Age"
                    placeholderTextColor={oc.textMuted}
                  />
                ) : (
                  <Text style={[profStyles.fieldValue, { color: oc.textPrimary }]}>{age} Years</Text>
                )}
              </View>

              <View style={[profStyles.fieldItem, { flex: 1, borderBottomColor: oc.borderSubtle }]}>
                <Text style={[profStyles.fieldLabel, { color: oc.textMuted }]}>Gender</Text>
                {isEditing ? (
                  <View style={profStyles.genderToggle}>
                    {(['Male', 'Female', 'Other'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          profStyles.genderBtn,
                          { backgroundColor: oc.borderSubtle, borderColor: oc.border },
                          gender === g && [profStyles.genderBtnActive, { backgroundColor: oc.isDark ? '#064E3B' : Colors.primaryLight, borderColor: Colors.primary }],
                        ]}
                        onPress={() => setGender(g)}
                      >
                        <Text
                          style={[
                            profStyles.genderBtnText,
                            { color: oc.textSecondary },
                            gender === g && [profStyles.genderBtnTextActive, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }],
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={[profStyles.fieldValue, { color: oc.textPrimary }]}>{gender}</Text>
                )}
              </View>
            </View>

            <View style={profStyles.rowFields}>
              <View style={[profStyles.fieldItem, { flex: 1, borderBottomColor: oc.borderSubtle }]}>
                <Text style={[profStyles.fieldLabel, { color: oc.textMuted }]}>Blood Group</Text>
                {isEditing ? (
                  <TextInput
                    style={[profStyles.input, { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary }]}
                    value={bloodGroup}
                    onChangeText={setBloodGroup}
                    placeholder="e.g. O+"
                    placeholderTextColor={oc.textMuted}
                  />
                ) : (
                  <Text style={[profStyles.fieldValue, { color: oc.textPrimary }]}>{bloodGroup}</Text>
                )}
              </View>

              <View style={[profStyles.fieldItem, { flex: 1, borderBottomColor: oc.borderSubtle }]}>
                <Text style={[profStyles.fieldLabel, { color: oc.textMuted }]}>Location</Text>
                {isEditing ? (
                  <TextInput
                    style={[profStyles.input, { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary }]}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor={oc.textMuted}
                  />
                ) : (
                  <Text style={[profStyles.fieldValue, { color: oc.textPrimary }]}>{city}</Text>
                )}
              </View>
            </View>

            <View style={[profStyles.fieldItem, { borderBottomWidth: 0 }]}>
              <Text style={[profStyles.fieldLabel, { color: oc.textMuted }]}>Emergency Contact</Text>
              {isEditing ? (
                <TextInput
                  style={[profStyles.input, { backgroundColor: oc.inputBackground, borderColor: oc.border, color: oc.textPrimary }]}
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                  keyboardType="phone-pad"
                  placeholder="Emergency Contact"
                  placeholderTextColor={oc.textMuted}
                />
              ) : (
                <Text style={[profStyles.fieldValue, { color: oc.textPrimary }]}>+91 {emergencyContact}</Text>
              )}
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity
              style={profStyles.saveFullBtn}
              onPress={handleSave}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={profStyles.saveFullBtnText}>Save Profile Changes</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const profStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE4',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  editBtn: { backgroundColor: Colors.primary },
  saveBtn: { backgroundColor: Colors.primaryDark },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  scrollContent: { padding: 20 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    gap: 14,
    marginBottom: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  avatarCircle: { width: 58, height: 58, borderRadius: 18, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  userPhone: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { fontSize: 11, color: Colors.primaryDark, fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
  fieldItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F0' },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.3 },
  fieldValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  input: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1.2,
    borderColor: '#CDE8C0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  rowFields: { flexDirection: 'row', gap: 14 },
  genderToggle: { flexDirection: 'row', gap: 6, marginTop: 2 },
  genderBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  genderBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  genderBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  genderBtnTextActive: { color: Colors.primaryDark, fontWeight: '700' },
  saveFullBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveFullBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

// ═════════════════════════════════════════════════════════════════════
// 9. VIDEO & AUDIO CALL SCREEN
// ═════════════════════════════════════════════════════════════════════
function OCConsultationCallScreen({
  booking,
  onEndCall,
}: {
  booking: BookingSummary;
  onEndCall: () => void;
}) {
  const isAudioCall = booking.mode === 'audio';
  const doctor = booking.doctor;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.4)).current;
  const waveAnim2 = useRef(new Animated.Value(0.8)).current;
  const waveAnim3 = useRef(new Animated.Value(0.3)).current;
  const waveAnim4 = useRef(new Animated.Value(0.9)).current;
  const waveAnim5 = useRef(new Animated.Value(0.5)).current;

  const fallbackAvatar = doctor.gender === 'female'
    ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop';
  const avatarUri = doctor.avatar || fallbackAvatar;

  useEffect(() => {
    const connectTimer = setTimeout(() => setIsConnecting(false), 2000);
    const callTimer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    const animateWave = (anim: Animated.Value, dur: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: dur, easing: Easing.linear, useNativeDriver: true }),
        ])
      );
    };

    const w1 = animateWave(waveAnim1, 400);
    const w2 = animateWave(waveAnim2, 600);
    const w3 = animateWave(waveAnim3, 350);
    const w4 = animateWave(waveAnim4, 550);
    const w5 = animateWave(waveAnim5, 480);
    w1.start(); w2.start(); w3.start(); w4.start(); w5.start();

    return () => {
      clearTimeout(connectTimer);
      clearInterval(callTimer);
      pulseLoop.stop();
      w1.stop(); w2.stop(); w3.stop(); w4.stop(); w5.stop();
    };
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCallAlert = () => {
    const callType = isAudioCall ? 'Audio Call' : 'Video Consultation';
    Alert.alert(
      `End ${callType}`,
      `Are you sure you want to end this medical ${callType.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Call', style: 'destructive', onPress: onEndCall },
      ]
    );
  };

  if (isAudioCall) {
    return (
      <View style={callStyles.audioContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
        <View style={callStyles.audioTopBar}>
          <View style={callStyles.encryptionHeader}>
            <Ionicons name="lock-closed" size={13} color="#38BDF8" />
            <Text style={callStyles.encryptionText}>End-to-End Encrypted Voice</Text>
          </View>
          <TouchableOpacity
            style={[callStyles.audioSpeakerBtn, isSpeakerOn && callStyles.audioSpeakerBtnActive]}
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={callStyles.audioCenterContent}>
          <View style={callStyles.haloContainer}>
            <Animated.View style={[callStyles.pulseRingOuter, { transform: [{ scale: pulseAnim }] }]} />
            <View style={callStyles.pulseRingInner} />
            <Image source={{ uri: avatarUri }} style={callStyles.audioDoctorAvatar} />
            <View style={callStyles.onlineAudioBadge}>
              <Ionicons name="call" size={12} color="#FFFFFF" />
            </View>
          </View>

          <Text style={callStyles.audioDoctorName}>{doctor.name}</Text>
          <Text style={callStyles.audioDoctorSpecialty}>{doctor.specialty}</Text>
          <Text style={callStyles.audioDoctorHospital}>{doctor.hospital}</Text>

          <View style={callStyles.audioStatusCard}>
            {isConnecting ? (
              <View style={callStyles.connectingRow}>
                <View style={callStyles.connectingDot} />
                <Text style={callStyles.audioConnectingText}>Connecting to Doctor...</Text>
              </View>
            ) : (
              <View style={callStyles.activeCallRow}>
                <View style={callStyles.greenLiveDot} />
                <Text style={callStyles.audioTimerText}>{formatTimer(callDuration)}</Text>
                <Text style={callStyles.audioQualityText}>• HD Voice</Text>
              </View>
            )}
          </View>

          {!isConnecting && (
            <View style={callStyles.waveformContainer}>
              {[waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5, waveAnim2, waveAnim1].map((anim, idx) => (
                <Animated.View key={idx} style={[callStyles.waveBar, { transform: [{ scaleY: anim }] }]} />
              ))}
            </View>
          )}

          <View style={callStyles.audioRxBanner}>
            <Ionicons name="document-text-outline" size={15} color="#38BDF8" />
            <Text style={callStyles.audioRxText}>Doctor is taking clinical notes for your digital Rx</Text>
          </View>
        </View>

        <View style={callStyles.audioToolbar}>
          <TouchableOpacity
            style={[callStyles.audioActionBtn, isMuted && callStyles.audioActionBtnActive]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color={isMuted ? '#EF4444' : '#FFFFFF'} />
            <Text style={callStyles.audioActionLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[callStyles.audioActionBtn, !isSpeakerOn && callStyles.audioActionBtnActive]}
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-low'} size={24} color={isSpeakerOn ? '#38BDF8' : '#FFFFFF'} />
            <Text style={callStyles.audioActionLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={callStyles.audioEndCallBtn} onPress={handleEndCallAlert} activeOpacity={0.85}>
            <Ionicons name="call" size={28} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Video call UI
  return (
    <View style={callStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={callStyles.mainFeed}>
        <Image source={{ uri: avatarUri }} style={callStyles.doctorFullVideo} resizeMode="cover" />
        <View style={callStyles.videoOverlayGradient} />
      </View>

      <View style={callStyles.topBar}>
        <View style={callStyles.doctorHeaderInfo}>
          <Text style={callStyles.doctorCallName}>{doctor.name}</Text>
          <View style={callStyles.liveCallStatus}>
            <View style={callStyles.recordingDot} />
            <Text style={callStyles.callTimerText}>
              {isConnecting ? 'Connecting Encrypted Video...' : `HD Live • ${formatTimer(callDuration)}`}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={callStyles.speakerToggleBtn} onPress={() => setIsSpeakerOn(!isSpeakerOn)}>
          <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={callStyles.selfPipContainer}>
        {isVideoOff ? (
          <View style={callStyles.selfVideoOff}>
            <Ionicons name="videocam-off" size={20} color="#94A3B8" />
            <Text style={callStyles.selfVideoOffText}>Camera Off</Text>
          </View>
        ) : (
          <View style={callStyles.selfVideoFeed}>
            <Ionicons name="person" size={28} color={Colors.primary} />
            <Text style={callStyles.selfLabel}>You</Text>
          </View>
        )}
      </View>

      {!isConnecting && (
        <View style={callStyles.ePrescriptionPrompt}>
          <Ionicons name="document-text" size={16} color={Colors.primary} />
          <Text style={callStyles.ePrescriptionText}>Doctor is preparing your digital Rx...</Text>
        </View>
      )}

      <View style={callStyles.bottomToolbar}>
        <TouchableOpacity style={[callStyles.controlBtn, isMuted && callStyles.controlBtnActive]} onPress={() => setIsMuted(!isMuted)}>
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#EF4444' : '#FFFFFF'} />
          <Text style={callStyles.controlBtnLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[callStyles.controlBtn, isVideoOff && callStyles.controlBtnActive]} onPress={() => setIsVideoOff(!isVideoOff)}>
          <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={22} color={isVideoOff ? '#EF4444' : '#FFFFFF'} />
          <Text style={callStyles.controlBtnLabel}>{isVideoOff ? 'Start Video' : 'Stop Video'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={callStyles.controlBtn} onPress={() => setIsFrontCamera(!isFrontCamera)}>
          <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
          <Text style={callStyles.controlBtnLabel}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={callStyles.endCallBtn} onPress={handleEndCallAlert} activeOpacity={0.85}>
          <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const callStyles = StyleSheet.create({
  audioContainer: { flex: 1, backgroundColor: '#0B132B', justifyContent: 'space-between' },
  audioTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50 },
  encryptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  encryptionText: { fontSize: 11, color: '#38BDF8', fontWeight: '700' },
  audioSpeakerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 255, 255, 0.12)', justifyContent: 'center', alignItems: 'center' },
  audioSpeakerBtnActive: { backgroundColor: 'rgba(56, 189, 248, 0.25)' },
  audioCenterContent: { alignItems: 'center', paddingHorizontal: 24 },
  haloContainer: { position: 'relative', width: 150, height: 150, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  pulseRingOuter: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  pulseRingInner: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(56, 189, 248, 0.25)' },
  audioDoctorAvatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#38BDF8', backgroundColor: '#1E293B' },
  onlineAudioBadge: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B132B',
  },
  audioDoctorName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  audioDoctorSpecialty: { fontSize: 14, color: '#38BDF8', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  audioDoctorHospital: { fontSize: 12, color: '#94A3B8', marginTop: 2, textAlign: 'center' },
  audioStatusCard: {
    marginTop: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  connectingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  connectingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' },
  audioConnectingText: { fontSize: 12, color: '#FCD34D', fontWeight: '600' },
  activeCallRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  audioTimerText: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
  audioQualityText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  waveformContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, marginTop: 18 },
  waveBar: { width: 4, height: 32, borderRadius: 2, backgroundColor: '#38BDF8' },
  audioRxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  audioRxText: { fontSize: 11, color: '#E2E8F0', fontWeight: '500' },
  audioToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    marginHorizontal: 20,
    marginBottom: 36,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  audioActionBtn: { alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  audioActionBtnActive: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  audioActionLabel: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
  audioEndCallBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
  },
  // Video styles
  container: { flex: 1, backgroundColor: '#0F172A' },
  mainFeed: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  doctorFullVideo: { width: '100%', height: '100%', opacity: 0.85 },
  videoOverlayGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50 },
  doctorHeaderInfo: { flex: 1 },
  doctorCallName: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  liveCallStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  callTimerText: { fontSize: 12, color: '#CBD5E1', fontWeight: '600' },
  speakerToggleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  selfPipContainer: {
    position: 'absolute',
    right: 18,
    bottom: 120,
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#1E293B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  selfVideoFeed: { flex: 1, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  selfLabel: { fontSize: 10, fontWeight: '700', color: '#CBD5E1', marginTop: 4 },
  selfVideoOff: { flex: 1, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  selfVideoOffText: { fontSize: 9, color: '#94A3B8', marginTop: 4 },
  ePrescriptionPrompt: {
    position: 'absolute',
    bottom: 110,
    left: 18,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '55%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ePrescriptionText: { fontSize: 11, fontWeight: '700', color: '#F1F5F9' },
  bottomToolbar: {
    position: 'absolute',
    bottom: 34,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  controlBtn: { alignItems: 'center', gap: 4 },
  controlBtnActive: { opacity: 0.8 },
  controlBtnLabel: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },
  endCallBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
});

// ═════════════════════════════════════════════════════════════════════
// 10. MAIN ONLINE CONSULTATION FLOW (MODAL CONTROLLER)
// ═════════════════════════════════════════════════════════════════════
type OCTab = 'Home' | 'Appointments' | 'Profile';
type OCScreen = 'tabs' | 'doctorsList' | 'doctorDetail' | 'patientDetails' | 'checkout' | 'success' | 'call';

export interface OnlineConsultationFlowProps {
  visible: boolean;
  onClose: () => void;
  onBookingSuccess?: (booking: BookingSummary) => void;
}

function OCFlowInner({ onClose }: { onClose: () => void }) {
  const ocColors = useOCColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const topInset = isIOS ? insets.top : (StatusBar.currentHeight || insets.top || 24);
  const bottomPadding = isIOS ? Math.max(insets.bottom, 14) : (insets.bottom > 0 ? insets.bottom + 8 : 18);
  const tabHeight = 54 + bottomPadding;

  const [activeTab, setActiveTab] = useState<OCTab>('Home');
  const [currentScreen, setCurrentScreen] = useState<OCScreen>('tabs');
  const [screenHistory, setScreenHistory] = useState<OCScreen[]>(['tabs']);
  const [activeCallBooking, setActiveCallBooking] = useState<BookingSummary | null>(null);

  const { resetBookingFlow, activeBooking, bookingHistory } = useBooking();

  const navigate = (screen: OCScreen) => {
    setScreenHistory((prev) => [...prev, screen]);
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (screenHistory.length <= 1) {
      onClose();
      return;
    }
    const newHistory = screenHistory.slice(0, -1);
    setScreenHistory(newHistory);
    setCurrentScreen(newHistory[newHistory.length - 1]);
  };

  const handleReturnHome = () => {
    resetBookingFlow();
    setCurrentScreen('tabs');
    setActiveTab('Home');
    setScreenHistory(['tabs']);
  };

  const handleStartCall = (booking: BookingSummary) => {
    setActiveCallBooking(booking);
    navigate('call');
  };

  const handleEndCall = () => {
    setActiveCallBooking(null);
    setCurrentScreen('tabs');
    setActiveTab('Appointments');
    setScreenHistory(['tabs']);
  };

  // Hardware/System back button handling
  useEffect(() => {
    const onHardwareBack = () => {
      if (currentScreen === 'call') {
        handleEndCall();
        return true;
      }
      if (currentScreen === 'success') {
        handleReturnHome();
        return true;
      }
      if (screenHistory.length > 1) {
        goBack();
        return true;
      }
      if (activeTab !== 'Home') {
        setActiveTab('Home');
        return true;
      }
      onClose();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [currentScreen, screenHistory, activeTab, onClose]);

  const getHeaderTitle = () => {
    switch (currentScreen) {
      case 'doctorsList': return 'Consult Specialists';
      case 'doctorDetail': return 'Doctor Profile & Slots';
      case 'patientDetails': return 'Patient Details';
      case 'checkout': return 'Review & Payment';
      case 'success': return 'Booking Confirmed';
      default: return 'Online Consultation';
    }
  };

  // Stack screen rendering (non-tab screens)
  const isStackScreen = currentScreen !== 'tabs';
  const showHeader = isStackScreen && currentScreen !== 'call' && currentScreen !== 'success' && currentScreen !== 'checkout';

  return (
    <View style={[flowStyles.container, { backgroundColor: ocColors.background }]}>
      <StatusBar barStyle={ocColors.isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent={true} />

      {/* Screen Header for stacked screens */}
      {showHeader && (
        <View style={[flowStyles.stackHeader, { paddingTop: topInset + 8, backgroundColor: ocColors.surface, borderBottomColor: ocColors.border }]}>
          <TouchableOpacity style={[flowStyles.headerBtn, { backgroundColor: ocColors.borderSubtle }]} onPress={goBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={ocColors.textPrimary} />
          </TouchableOpacity>
          <Text style={[flowStyles.stackHeaderTitle, { color: ocColors.textPrimary }]}>{getHeaderTitle()}</Text>
          <TouchableOpacity style={[flowStyles.headerBtn, { backgroundColor: ocColors.borderSubtle }]} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={ocColors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Stack: Call Screen */}
      {currentScreen === 'call' && activeCallBooking && (
        <OCConsultationCallScreen
          booking={activeCallBooking}
          onEndCall={handleEndCall}
        />
      )}

      {/* Stack: Success Screen */}
      {currentScreen === 'success' && (
        <View style={{ flex: 1, paddingTop: topInset }}>
          <OCBookingSuccessScreen
            onReturnHome={handleReturnHome}
            onJoinCall={(b) => handleStartCall(b)}
          />
        </View>
      )}

      {/* Stack: Checkout Screen */}
      {currentScreen === 'checkout' && (
        <OCCheckoutScreen
          onConfirmed={() => navigate('success')}
          onBack={goBack}
        />
      )}

      {/* Stack: Patient Details Screen */}
      {currentScreen === 'patientDetails' && (
        <OCPatientDetailsScreen
          onProceed={() => navigate('checkout')}
        />
      )}

      {/* Stack: Doctor Detail & Slot Screen */}
      {currentScreen === 'doctorDetail' && (
        <OCDoctorDetailScreen
          onProceed={() => navigate('patientDetails')}
          onBack={goBack}
        />
      )}

      {/* Stack: Doctors List Screen */}
      {currentScreen === 'doctorsList' && (
        <OCDoctorsListScreen
          onNavigateDoctorDetail={(doc) => navigate('doctorDetail')}
        />
      )}

      {/* ─── TABS VIEW (Home, Appointments, Profile) ─── */}
      {currentScreen === 'tabs' && (
        <View style={{ flex: 1 }}>
          {/* Active Tab Body */}
          <View style={{ flex: 1 }}>
            {activeTab === 'Home' && (
              <OCHomeTabScreen
                onNavigateDoctors={() => navigate('doctorsList')}
                onNavigateDoctorDetail={(doc) => navigate('doctorDetail')}
                onClose={onClose}
                topInset={topInset}
              />
            )}
            {activeTab === 'Appointments' && (
              <OCAppointmentsScreen
                onFindSpecialist={() => setActiveTab('Home')}
                onJoinCall={(b) => handleStartCall(b)}
                onClose={onClose}
                onBack={() => setActiveTab('Home')}
                topInset={topInset}
              />
            )}
            {activeTab === 'Profile' && (
              <OCProfileScreen
                onClose={onClose}
                onBack={() => setActiveTab('Home')}
                topInset={topInset}
              />
            )}
          </View>

          {/* Bottom Tab Navigation Bar */}
          <View style={[flowStyles.bottomTabBar, { height: tabHeight, paddingBottom: bottomPadding, backgroundColor: ocColors.surface, borderTopColor: ocColors.border }]}>
            <TouchableOpacity
              style={flowStyles.tabItem}
              onPress={() => setActiveTab('Home')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={activeTab === 'Home' ? 'home' : 'home-outline'}
                size={22}
                color={activeTab === 'Home' ? (ocColors.isDark ? '#86EFAC' : Colors.primaryDark) : ocColors.textMuted}
              />
              <Text style={[flowStyles.tabLabel, { color: ocColors.textMuted }, activeTab === 'Home' && [flowStyles.tabLabelActive, { color: ocColors.isDark ? '#86EFAC' : Colors.primaryDark }]]}>
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={flowStyles.tabItem}
              onPress={() => setActiveTab('Appointments')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={activeTab === 'Appointments' ? 'calendar' : 'calendar-outline'}
                size={22}
                color={activeTab === 'Appointments' ? (ocColors.isDark ? '#86EFAC' : Colors.primaryDark) : ocColors.textMuted}
              />
              <Text style={[flowStyles.tabLabel, { color: ocColors.textMuted }, activeTab === 'Appointments' && [flowStyles.tabLabelActive, { color: ocColors.isDark ? '#86EFAC' : Colors.primaryDark }]]}>
                Appointments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={flowStyles.tabItem}
              onPress={() => setActiveTab('Profile')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={activeTab === 'Profile' ? 'person' : 'person-outline'}
                size={22}
                color={activeTab === 'Profile' ? (ocColors.isDark ? '#86EFAC' : Colors.primaryDark) : ocColors.textMuted}
              />
              <Text style={[flowStyles.tabLabel, { color: ocColors.textMuted }, activeTab === 'Profile' && [flowStyles.tabLabelActive, { color: ocColors.isDark ? '#86EFAC' : Colors.primaryDark }]]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export const OnlineConsultationFlow: React.FC<OnlineConsultationFlowProps> = ({
  visible,
  onClose,
  onBookingSuccess,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <BookingProvider onBookingSuccess={onBookingSuccess}>
        <OCFlowInner onClose={onClose} />
      </BookingProvider>
    </Modal>
  );
};

const flowStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE4',
  },
  tabHeaderBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabHeaderBrandText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tabHeaderBrandAccent: {
    color: Colors.primary,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE4',
  },
  stackHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E6EFE4',
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    elevation: 8,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  tabLabelActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
});
