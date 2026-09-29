import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { HomeScreen } from './HomeScreen';
import { BookingsScreen } from './BookingsScreen';
import { HelpSupportScreen } from './HelpSupportScreen';
import { ProfileScreen } from './ProfileScreen';
import { BottomNavBar, MainTabType } from '../components/common/BottomNavBar';
import { COLORS } from '../theme';

interface MainTabScreenProps {
  navigation: any;
  route: any;
}

export const MainTabScreen: React.FC<MainTabScreenProps> = ({
  navigation,
  route,
}) => {
  const initialTab = route?.params?.initialTab || 'Home';
  const [activeTab, setActiveTab] = useState<MainTabType>(initialTab);
  const prevTabRef = useRef<MainTabType>('Home');

  const switchTab = (newTab: MainTabType) => {
    if (newTab !== activeTab) {
      prevTabRef.current = activeTab;
      setActiveTab(newTab);
    }
  };

  useEffect(() => {
    if (route?.params?.initialTab) {
      switchTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  // Hardware back button navigation between tabs
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab === 'HelpSupport') {
        if (prevTabRef.current === 'Profile') {
          setActiveTab('Profile');
          return true;
        }
        setActiveTab('Home');
        return true;
      }
      if (activeTab !== 'Home') {
        setActiveTab('Home');
        return true;
      }
      return false; // let host handle exit to OneBuddy shell
    });

    return () => sub.remove();
  }, [activeTab]);

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case 'Bookings':
        return (
          <BookingsScreen
            navigation={navigation}
            onGoHome={() => setActiveTab('Home')}
          />
        );
      case 'HelpSupport':
        return (
          <HelpSupportScreen
            navigation={navigation}
            onGoProfile={() => setActiveTab('Profile')}
          />
        );
      case 'Profile':
        return (
          <ProfileScreen
            navigation={navigation}
            onGoHome={() => setActiveTab('Home')}
          />
        );
      case 'Home':
      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderCurrentScreen()}</View>
      <BottomNavBar activeTab={activeTab} onTabPress={switchTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
});
