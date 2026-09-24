import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/firebase/context/AuthContext';
import { subscribeToProfile, updateProfileFields } from '@/firebase/services/userService';

export type AvatarStyleId =
  | 'classic'
  | 'cap'
  | 'shades'
  | 'wave'
  | 'bun'
  | 'curls'
  | 'specs'
  | 'beard';

export interface AvatarStyle {
  id: AvatarStyleId;
  name: string;
}

export const AVATAR_STYLES: AvatarStyle[] = [
  { id: 'classic', name: 'Classic' },
  { id: 'cap', name: 'Cap' },
  { id: 'shades', name: 'Shades' },
  { id: 'wave', name: 'Wave' },
  { id: 'bun', name: 'Bun' },
  { id: 'curls', name: 'Curls' },
  { id: 'specs', name: 'Specs' },
  { id: 'beard', name: 'Beard' },
];

export interface AvatarColor {
  id: string;
  hex: string;
  name: string;
  isLogoColor?: boolean;
}

export const AVATAR_COLORS: AvatarColor[] = [
  // Classic Palettes matching reference design
  { id: 'lavender', hex: '#594B73', name: 'Lavender' },
  { id: 'plum', hex: '#2A2643', name: 'Plum' },
  { id: 'gold', hex: '#C99E2A', name: 'Gold' },
  { id: 'coral', hex: '#E8684A', name: 'Coral' },
  { id: 'fern', hex: '#589E6E', name: 'Fern' },
  { id: 'sky', hex: '#3C7FB8', name: 'Sky' },
  { id: 'violet', hex: '#8B6BC6', name: 'Violet' },
  { id: 'rose', hex: '#C74E76', name: 'Rose' },

  // OneBuddy Brand & Service Logo Colors
  { id: 'brandGreen', hex: '#65B200', name: 'Brand Green', isLogoColor: true },
  { id: 'foodOrange', hex: '#F07E27', name: 'Food Orange', isLogoColor: true },
  { id: 'rideGold', hex: '#F2A81D', name: 'Rides Amber', isLogoColor: true },
  { id: 'homePurple', hex: '#8E6FD1', name: 'Home Violet', isLogoColor: true },
  { id: 'careBlue', hex: '#3B9BE0', name: 'Care Blue', isLogoColor: true },
];

export interface ProfileData {
  name: string;
  phone: string;
  email: string;
  style: AvatarStyleId;
  color: string;
}

export const DEFAULT_PROFILE: ProfileData = {
  name: 'User 8225',
  phone: '7013138225',
  email: 'you@example.com',
  style: 'classic',
  color: '#589E6E',
};

export function resolveAvatarColor(color?: string): string {
  if (!color) return '#589E6E';
  if (color === 'brandGreen') return '#65B200';
  if (color.startsWith('#') || color.startsWith('rgb')) return color;
  const match = AVATAR_COLORS.find((c) => c.id === color);
  return match ? match.hex : '#589E6E';
}

const STORAGE_KEY = 'onebuddy:profile';

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: DEFAULT_PROFILE,
  updateProfile: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const cleanColor = resolveAvatarColor(parsed.color);
          setProfile((prev) => ({
            ...prev,
            ...parsed,
            color: cleanColor,
            style: parsed.style && parsed.style !== 'cap' ? parsed.style : 'classic',
          }));
          if (parsed.color !== cleanColor) {
            AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ ...parsed, color: cleanColor })
            ).catch(() => {});
          }
        }
      } catch {
        // Keep default
      }
    })();
  }, []);

  // Listen to Firestore profile updates when Firebase user is active
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToProfile(user.uid, (data) => {
      if (data) {
        setProfile((prev) => {
          const updated: ProfileData = {
            ...prev,
            name: data.name || prev.name,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
          };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }
    });
    return unsub;
  }, [user]);

  const updateProfile = async (data: Partial<ProfileData>) => {
    setProfile((prev) => {
      const cleanColor = data.color ? resolveAvatarColor(data.color) : prev.color;
      const updated = {
        ...prev,
        ...data,
        color: cleanColor,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    if (user) {
      const fields: Record<string, string> = {};
      if (data.name) fields.name = data.name;
      if (data.phone) fields.phone = data.phone;
      if (Object.keys(fields).length > 0) {
        updateProfileFields(user.uid, fields).catch(() => {});
      }
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
