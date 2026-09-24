import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { OfferBanner, Restaurant } from '../types';
import {
  fetchBanners,
  fetchRestaurants,
  subscribeBanners,
  subscribeRestaurants,
} from '../../../firebase/food-service/foodData';

interface FoodDataContextType {
  banners: OfferBanner[];
  restaurants: Restaurant[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getRestaurantById: (id: string) => Restaurant | undefined;
}

const FoodDataContext = createContext<FoodDataContextType | undefined>(undefined);

export const FoodDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedBanners, fetchedRestaurants] = await Promise.all([
        fetchBanners(),
        fetchRestaurants(),
      ]);
      setBanners(fetchedBanners);
      setRestaurants(fetchedRestaurants);
    } catch (err: any) {
      console.error('[FoodDataContext] Error refreshing data:', err);
      setError(err?.message || 'Could not load food data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let bannersLoaded = false;
    let restaurantsLoaded = false;

    const checkComplete = () => {
      if (bannersLoaded && restaurantsLoaded && active) {
        setIsLoading(false);
      }
    };

    const unsubBanners = subscribeBanners(
      (data) => {
        if (!active) return;
        setBanners(data);
        bannersLoaded = true;
        checkComplete();
      },
      (err) => {
        if (!active) return;
        setError(err.message);
        bannersLoaded = true;
        checkComplete();
      }
    );

    const unsubRestaurants = subscribeRestaurants(
      (data) => {
        if (!active) return;
        setRestaurants(data);
        restaurantsLoaded = true;
        checkComplete();
      },
      (err) => {
        if (!active) return;
        setError(err.message);
        restaurantsLoaded = true;
        checkComplete();
      }
    );

    return () => {
      active = false;
      unsubBanners();
      unsubRestaurants();
    };
  }, []);

  const getRestaurantById = useCallback(
    (id: string): Restaurant | undefined => {
      return restaurants.find((r) => r.id === id);
    },
    [restaurants]
  );

  const value = useMemo(
    () => ({
      banners,
      restaurants,
      isLoading,
      error,
      refresh,
      getRestaurantById,
    }),
    [banners, restaurants, isLoading, error, refresh, getRestaurantById]
  );

  return (
    <FoodDataContext.Provider value={value}>
      {children}
    </FoodDataContext.Provider>
  );
};

export const useFoodData = (): FoodDataContextType => {
  const context = useContext(FoodDataContext);
  if (!context) {
    throw new Error('useFoodData must be used within a FoodDataProvider');
  }
  return context;
};
