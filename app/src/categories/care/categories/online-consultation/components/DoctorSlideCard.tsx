import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Doctor } from '../types/doctor';
import { Colors, useOCColors } from '../constants/colors';
import { RatingStars } from './RatingStars';

interface DoctorSlideCardProps {
  doctor: Doctor;
  onPress: () => void;
  onBookPress?: () => void;
  selectedMode?: 'video' | 'audio';
}

export const DoctorSlideCard: React.FC<DoctorSlideCardProps> = ({
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
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            onError={() => setImageError(true)}
          />
        </View>

        <View style={styles.infoWrapper}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: oc.textPrimary }]} numberOfLines={1}>
              {doctor.name}
            </Text>
          </View>
          <Text style={[styles.specialty, { color: oc.isDark ? '#86EFAC' : Colors.primaryDark }]} numberOfLines={1}>
            {doctor.specialty}
          </Text>
          <Text style={[styles.hospital, { color: oc.textMuted }]} numberOfLines={1}>
            {doctor.hospital}
          </Text>
          <View style={styles.ratingRow}>
            <RatingStars rating={doctor.rating} size={11} />
            <View style={[styles.expBadge, { backgroundColor: oc.isDark ? '#082F49' : '#E0F2FE' }]}>
              <Text style={[styles.expText, { color: oc.isDark ? '#38BDF8' : '#0369A1' }]}>{doctor.experienceYears}y exp</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: oc.borderSubtle }]} />

      <View style={styles.bottomRow}>
        <View>
          <Text style={[styles.feeLabel, { color: oc.textMuted }]}>Fee</Text>
          <Text style={[styles.feeAmount, { color: oc.textPrimary }]}>₹{fee}</Text>
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={onBookPress || onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>Book Slot</Text>
          <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 270,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginRight: 14,
    borderWidth: 1.2,
    borderColor: '#E6EFE4',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  specialty: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginTop: 1,
  },
  hospital: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  expBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  expText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F0',
    marginVertical: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  feeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
