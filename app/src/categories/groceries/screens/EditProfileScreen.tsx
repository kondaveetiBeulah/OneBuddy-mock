import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { Header } from '../components/Header';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useUser } from '../context/UserContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

type EditProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  navigation,
}) => {
  const { user, updateProfile } = useUser();
  const [name, setName] = useState(user?.name || 'Anjali');
  const [email, setEmail] = useState(user?.email || 'anjali@example.com');
  const [phone, setPhone] = useState(user?.phone || '9876543210');
  const [loading, setLoading] = useState(false);
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({ name, email, phone });
      navigation.goBack();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={dynStyles.container}>
      <Header title="Edit Profile" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={dynStyles.scrollPadding}>
        <CustomInput label="Full Name" value={name} onChangeText={setName} />
        <CustomInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <CustomInput
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <CustomButton
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          size="large"
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : colors.white,
  },
  scrollPadding: {
    padding: spacing.md,
  },
});
