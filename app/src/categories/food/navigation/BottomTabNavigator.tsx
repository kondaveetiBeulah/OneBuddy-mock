import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FoodMainTabParamList, FoodStackParamList } from '../types/navigation.types';
import { HomeScreen } from '../screens/HomeScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { Header } from '../components/common/Header';
import { BottomNavBar } from '../components/navigation/BottomNavBar';
import { useFoodExit } from '../context/FoodExitContext';

const Tab = createBottomTabNavigator<FoodMainTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<FoodStackParamList>>();
  const { onClose } = useFoodExit();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
      tabBar={(props: BottomTabBarProps) => {
        const currentRoute = props.state.routes[props.state.index].name;
        const activeScreen =
          currentRoute === 'Home' ? 'home' : currentRoute === 'Orders' ? 'orders' : 'favorites';

        const handleNavigate = (screen: 'home' | 'restaurant-menu' | 'orders' | 'favorites' | 'cart') => {
          if (screen === 'home') {
            props.navigation.navigate('Home');
          } else if (screen === 'orders') {
            props.navigation.navigate('Orders');
          } else if (screen === 'favorites') {
            props.navigation.navigate('Favorites');
          } else if (screen === 'cart') {
            rootNavigation.navigate('Cart');
          } else if (screen === 'restaurant-menu') {
            rootNavigation.navigate('RestaurantMenu', { restaurantId: 'paradise-restaurant' });
          }
        };

        return (
          <BottomNavBar
            activeScreen={activeScreen}
            onNavigate={handleNavigate}
            onFocusSearch={() => {
              props.navigation.navigate('Home');
            }}
          />
        );
      }}
    >
      <Tab.Screen name="Home">
        {({ navigation: tabNav }) => {
          const currentTab = 'home';
          return (
            <View style={styles.container}>
              <Header
                activeScreen={currentTab}
                onNavigate={(screen) => {
                  if (screen === 'home') tabNav.navigate('Home');
                  else if (screen === 'orders') tabNav.navigate('Orders');
                  else if (screen === 'favorites') tabNav.navigate('Favorites');
                  else if (screen === 'cart') rootNavigation.navigate('Cart');
                  else if (screen === 'location-search') rootNavigation.navigate('LocationSearch');
                  else if (screen === 'add-address') rootNavigation.navigate('AddAddress', {});
                  else if (screen === 'restaurant-menu') {
                    rootNavigation.navigate('RestaurantMenu', { restaurantId: 'paradise-restaurant' });
                  }
                }}
                onEditAddress={(address) => {
                  rootNavigation.navigate('AddAddress', { initialData: address });
                }}
                onBack={onClose}
              />
              <HomeScreen
                onSelectRestaurant={(restaurantId) => {
                  rootNavigation.navigate('RestaurantMenu', { restaurantId });
                }}
                onNavigate={(screen) => {
                  if (screen === 'home') tabNav.navigate('Home');
                  else if (screen === 'orders') tabNav.navigate('Orders');
                  else if (screen === 'favorites') tabNav.navigate('Favorites');
                  else if (screen === 'restaurant-menu') {
                    rootNavigation.navigate('RestaurantMenu', { restaurantId: 'paradise-restaurant' });
                  }
                }}
              />
            </View>
          );
        }}
      </Tab.Screen>

      <Tab.Screen name="Orders">
        {({ navigation: tabNav }) => {
          const currentTab = 'orders';
          return (
            <View style={styles.container}>
              <Header
                activeScreen={currentTab}
                onNavigate={(screen) => {
                  if (screen === 'home') tabNav.navigate('Home');
                  else if (screen === 'orders') tabNav.navigate('Orders');
                  else if (screen === 'favorites') tabNav.navigate('Favorites');
                  else if (screen === 'cart') rootNavigation.navigate('Cart');
                  else if (screen === 'location-search') rootNavigation.navigate('LocationSearch');
                  else if (screen === 'add-address') rootNavigation.navigate('AddAddress', {});
                }}
                onEditAddress={(address) => {
                  rootNavigation.navigate('AddAddress', { initialData: address });
                }}
                onBack={onClose}
              />
              <OrdersScreen
                onSelectRestaurant={(restaurantId) => {
                  rootNavigation.navigate('RestaurantMenu', { restaurantId });
                }}
                onNavigateHome={() => {
                  tabNav.navigate('Home');
                }}
              />
            </View>
          );
        }}
      </Tab.Screen>

      <Tab.Screen name="Favorites">
        {({ navigation: tabNav }) => {
          const currentTab = 'favorites';
          return (
            <View style={styles.container}>
              <Header
                activeScreen={currentTab}
                onNavigate={(screen) => {
                  if (screen === 'home') tabNav.navigate('Home');
                  else if (screen === 'orders') tabNav.navigate('Orders');
                  else if (screen === 'favorites') tabNav.navigate('Favorites');
                  else if (screen === 'cart') rootNavigation.navigate('Cart');
                  else if (screen === 'location-search') rootNavigation.navigate('LocationSearch');
                  else if (screen === 'add-address') rootNavigation.navigate('AddAddress', {});
                }}
                onEditAddress={(address) => {
                  rootNavigation.navigate('AddAddress', { initialData: address });
                }}
                onBack={onClose}
              />
              <FavoritesScreen
                onSelectRestaurant={(restaurantId) => {
                  rootNavigation.navigate('RestaurantMenu', { restaurantId });
                }}
                onNavigateHome={() => {
                  tabNav.navigate('Home');
                }}
              />
            </View>
          );
        }}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
});
