import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, useColors, Header } from '../components/UI';
import { useBooking } from '../context/BookingContext';
import { doctors, healthIssues } from '../mockData';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
  route: {
    params?: {
      issueId?: string;
      query?: string;
    };
  };
}

export function DoctorsScreen({ navigation, route }: Props) {
  const { chooseDoctor, doctorsList } = useBooking();
  const tc = useColors();
  const currentDoctors = doctorsList && doctorsList.length > 0 ? doctorsList : doctors;
  const issue = healthIssues.find((item) => item.id === route.params?.issueId);
  const query = route.params?.query?.trim().toLowerCase() ?? '';
  const searchedIssue = healthIssues.find(
    (item) => item.name.toLowerCase() === query || item.name.toLowerCase().includes(query)
  );

  const isNurseCategory = issue?.id === 'nursing' || query.includes('nurse');

  const results = currentDoctors
    .filter((doctor) => {
      if (issue) return doctor.issueIds.includes(issue.id);
      if (!query) return true;

      const nameMatch = doctor.name.toLowerCase().includes(query);
      const specialtyMatch = doctor.specialty.toLowerCase().includes(query);
      const hospitalMatch = doctor.hospital.toLowerCase().includes(query);
      const issueMatch = Boolean(searchedIssue && doctor.issueIds.includes(searchedIssue.id));
      const symptomMatch = doctor.symptoms?.some(
        (sym) => sym.toLowerCase().includes(query) || query.includes(sym.toLowerCase())
      );

      return nameMatch || specialtyMatch || hospitalMatch || issueMatch || Boolean(symptomMatch);
    })
    .sort((a, b) => b.rating - a.rating);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title={isNurseCategory ? 'Find your nurse' : 'Find your doctor'} onBack={() => navigation.goBack()} />
        <Text style={[styles.heading, { color: tc.ink }]}>
          {issue ? issue.name : query ? `Results for "${route.params?.query}"` : 'Top rated professionals'}
        </Text>
        <Text style={[styles.sub, { color: tc.muted }]}>{results.length} {isNurseCategory ? 'nurses' : 'doctors'} available for a home visit</Text>

        {results.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: tc.soft, borderColor: tc.border }]}>
            <Ionicons name="search-outline" size={38} color={tc.muted} />
            <Text style={[styles.emptyTitle, { color: tc.ink }]}>No matching doctors or nurses found</Text>
            <Text style={[styles.emptySub, { color: tc.muted }]}>Please check spelling or search for valid symptoms like "fever", "headache", "chest pain", "injection", "skin rash", or "back pain".</Text>
          </View>
        )}

        {results.map((doctor) => {
          const isNurse = doctor.name.startsWith('Nurse') || doctor.issueIds.includes('nursing');

          return (
            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]} key={doctor.id}>
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: tc.soft }]}>
                  {doctor.avatar ? (
                    <Image source={{ uri: doctor.avatar }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.initials}>{doctor.initials}</Text>
                  )}
                </View>
                <View style={styles.identity}>
                  <Text style={[styles.name, { color: tc.ink }]}>{doctor.name}</Text>
                  <Text style={styles.specialty}>{doctor.specialty}</Text>

                  <View style={styles.hospitalRow}>
                    <Ionicons name={isNurse ? "bandage-outline" : "medical-outline"} size={13} color={colors.green} />
                    <Text style={[styles.hospitalText, { color: tc.ink }]}>{doctor.hospital}</Text>
                  </View>
                  <View style={styles.location}>
                    <Ionicons name="location-outline" size={13} color={tc.muted} />
                    <Text style={[styles.muted, { color: tc.muted }]}>{doctor.location}</Text>
                  </View>
                  <View style={styles.rating}>
                    <Ionicons name="star" size={14} color="#E7A829" />
                    <Text style={[styles.ratingText, { color: tc.ink }]}>{doctor.rating}</Text>
                    <Text style={[styles.dot, { color: tc.muted }]}>·</Text>
                    <Text style={[styles.muted, { color: tc.muted }]}>{doctor.experience} yrs exp.</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: tc.border }]} />
              <View style={styles.bottom}>
                <Text style={[styles.fee, { color: tc.ink }]}>
                  ₹{doctor.fee}
                  <Text style={[styles.per, { color: tc.muted }]}> / visit</Text>
                </Text>
                <Pressable
                  style={styles.select}
                  onPress={() => {
                    chooseDoctor(doctor);
                    navigation.navigate('Availability', { doctorId: doctor.id });
                  }}
                >
                  <Text style={styles.selectText}>Book Home Visit</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { padding: 18, paddingBottom: 36 },
  heading: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 12 },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 18, fontSize: 13 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 15, marginBottom: 14, backgroundColor: colors.white },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { backgroundColor: colors.soft, width: 56, height: 56, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 56, height: 56, borderRadius: 14 },
  initials: { color: colors.darkGreen, fontWeight: '800', fontSize: 18 },
  identity: { marginLeft: 14, flex: 1 },
  name: { color: colors.ink, fontWeight: '800', fontSize: 16 },
  specialty: { color: colors.primary, fontSize: 12.5, fontWeight: '700', marginTop: 2 },
  hospitalRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  hospitalText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  ratingText: { color: colors.ink, fontWeight: '800', fontSize: 12 },
  dot: { color: colors.muted },
  muted: { color: colors.muted, fontSize: 11.5 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fee: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  per: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  select: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  selectText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  emptyCard: { backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 12, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.muted, marginTop: 6, textAlign: 'center', lineHeight: 18 },
});
