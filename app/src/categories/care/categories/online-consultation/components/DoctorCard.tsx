import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Doctor } from '../types/doctor';
import { Colors, useOCColors } from '../constants/colors';
import { RatingStars } from './RatingStars';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  onBookPress?: () => void;
  selectedMode?: 'video' | 'audio';
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onPress,
  onBookPress,
  selectedMode = 'video',
}) => {
  const [imageError, setImageError] = React.useState(false);
  const oc = useOCColors();

  const fallbackUri = doctor.gender === 'female'
    ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop';

  const avatarUri = imageError || !doctor.avatar ? fallbackUri : doctor.avatar;

  const fee = selectedMode === 'audio' && doctor.audioConsultationFee
    ? doctor.audioConsultationFee
    : doctor.consultationFee;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.card, { backgroundColor: oc.surface, borderColor: oc.borderSubtle }]}
    >
      <View style={styles.mainRow}>
        {/* Doctor Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </View>

        {/* Doctor Main Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.doctorName, { color: oc.textPrimary }]} numberOfLines={1}>
              {doctor.name}
            </Text>
          </View>

          <Text style={[styles.specialtyText, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]} numberOfLines={1}>
            {doctor.specialty}
          </Text>

          <Text style={[styles.degreesText, { color: oc.textMuted }]} numberOfLines={1}>
            {doctor.degrees}
          </Text>

          <View style={styles.hospitalRow}>
            <Ionicons name="business-outline" size={13} color={oc.textSecondary} />
            <Text style={[styles.hospitalText, { color: oc.textSecondary }]} numberOfLines={1}>
              {doctor.hospital}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.experienceBadge, { backgroundColor: oc.isDark ? '#082F49' : '#E0F2FE' }]}>
              <Feather name="award" size={12} color={oc.isDark ? '#38BDF8' : '#0284C7'} />
              <Text style={[styles.experienceText, { color: oc.isDark ? '#38BDF8' : '#0369A1' }]}>{doctor.experienceYears}+ yrs</Text>
            </View>
            <RatingStars rating={doctor.rating} size={12} />
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: oc.borderSubtle }]} />

      {/* Pricing and Action Button */}
      <View style={styles.bottomRow}>
        <View style={styles.priceContainer}>
          <Text style={[styles.feeLabel, { color: oc.textMuted }]}>Consultation Fee</Text>
          <View style={styles.feeAmountRow}>
            <Text style={[styles.feeAmount, { color: oc.textPrimary }]}>₹{fee}</Text>
            <Text style={[styles.feePerSession, { color: oc.textMuted }]}>/ session</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={onBookPress || onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2.5,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  specialtyText: {
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginTop: 1,
  },
  degreesText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  hospitalText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  experienceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F0',
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  priceContainer: {
    justifyContent: 'center',
  },
  feeLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  feeAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  feePerSession: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
