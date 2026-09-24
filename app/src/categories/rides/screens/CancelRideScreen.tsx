import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, RideDetails } from '../types';
import { COLORS, SIZES } from '../constants/theme';
import { CANCEL_REASONS } from '../data';
import { useRideTheme } from '../theme';

interface CancelRideProps {
  route?: {
    params: {
      rideDetails: RideDetails;
    };
  };
  navigation?: any;
  onCancelComplete?: () => void;
  onKeepSearching?: () => void;
  isDark?: boolean;
}

export const CancelRideScreen = ({
  route,
  navigation,
  onCancelComplete,
  onKeepSearching,
  isDark: isDarkProp,
}: CancelRideProps) => {
  const theme = useRideTheme();
  const isDark = isDarkProp ?? theme.isDark;
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    setTimeout(() => {
      setShowConfirmation(true);
    }, 200);
  };

  const handleCancelRide = () => {
    Alert.alert('Success', 'Your ride has been cancelled successfully.', [
      {
        text: 'OK',
        onPress: () => {
          if (onCancelComplete) {
            onCancelComplete();
          } else if (navigation?.navigate) {
            navigation.navigate('PickupSelection', {});
          }
        },
      },
    ]);
  };

  const handleKeepSearching = () => {
    if (onKeepSearching) {
      onKeepSearching();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  if (showConfirmation) {
    return (
      <SafeAreaView style={[styles.container, isDark && { backgroundColor: '#121214' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowConfirmation(false)}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#F1F1EC' : COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.confirmationContent}>
          <View style={[styles.warningIconContainer, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Ionicons name="warning-outline" size={48} color={COLORS.danger} />
          </View>
          <Text style={[styles.confirmationTitle, isDark && { color: '#F1F1EC' }]}>
            Are you sure you want to cancel this ride?
          </Text>
          <Text style={[styles.confirmationSubtitle, isDark && { color: '#9BA08F' }]}>
            Your driver is already on the way.
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.18)', borderColor: '#EF4444' }]}
              onPress={handleCancelRide}
            >
              <Text style={styles.cancelBtnText}>Cancel My Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.keepSearchingBtn]}
              onPress={handleKeepSearching}
            >
              <Text style={styles.keepSearchingBtnText}>Keep Searching</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: '#121214' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleKeepSearching}>
          <Ionicons name="close" size={24} color={isDark ? '#F1F1EC' : COLORS.text} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, isDark && { color: '#F1F1EC' }]}>Why are you cancelling?</Text>

      <ScrollView contentContainerStyle={styles.reasonsContainer}>
        {CANCEL_REASONS.map((reason, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.reasonRow, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}
            onPress={() => handleReasonSelect(reason)}
          >
            <Text style={[styles.reasonText, isDark && { color: '#F1F1EC' }]}>{reason}</Text>
            <View style={styles.radioButton}>
              {selectedReason === reason && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FCF7',
  },
  header: {
    paddingHorizontal: SIZES.medium,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginHorizontal: SIZES.medium,
    marginBottom: SIZES.large,
  },
  reasonsContainer: {
    paddingHorizontal: SIZES.medium,
  },
  reasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  reasonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  radioButton: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#54B713',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#54B713',
  },
  confirmationContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.large,
  },
  warningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.large,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: SIZES.small,
  },
  confirmationSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: SIZES.xxlarge,
  },
  actionButtons: {
    width: '100%',
    gap: SIZES.medium,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  },
  keepSearchingBtn: {
    backgroundColor: '#54B713',
    shadowColor: '#54B713',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  keepSearchingBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default CancelRideScreen;
