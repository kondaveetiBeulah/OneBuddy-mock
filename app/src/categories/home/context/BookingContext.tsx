import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Address,
  BookingDetails,
  DayOption,
  FeedbackReview,
  PaymentMethodType,
  ServiceCategory,
  ServiceProvider,
  SubService,
  TimeSlot,
  TrackingStage,
} from '../types';
import {
  MOCK_PROVIDERS,
  SAVED_ADDRESSES,
  SERVICE_CATEGORIES,
  SUB_SERVICES,
  TIME_SLOTS,
  getUpcomingDays,
  isBookingSlotPast,
} from '../data/mockData';

const BOOKINGS_STORAGE_KEY = '@onebuddy_bookings_history';
const FEEDBACK_STORAGE_KEY = '@onebuddy_feedback_list';

interface BookingContextType {
  // Location & Addresses
  currentAddress: Address | null;
  savedAddresses: Address[];
  setCurrentAddress: (address: Address | null) => void;
  addNewAddress: (addressData: Omit<Address, 'id'>) => Address;
  setLiveGpsLocation: (customStreet?: string) => void;

  // Category & SubService Selection
  selectedCategory: ServiceCategory;
  setSelectedCategory: (category: ServiceCategory) => void;
  selectedSubServices: SubService[];
  toggleSubService: (service: SubService) => void;
  isSubServiceSelected: (serviceId: string) => boolean;
  clearSelectedSubServices: () => void;

  // Date & Time Scheduling
  upcomingDays: DayOption[];
  selectedDate: DayOption;
  setSelectedDate: (date: DayOption) => void;
  timeSlots: TimeSlot[];
  selectedTimeSlot: TimeSlot | null;
  setSelectedTimeSlot: (slot: TimeSlot) => void;

  // Pricing & Coupon Calculations
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponCode: string;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // Payment Method
  selectedPaymentMethod: PaymentMethodType;
  setSelectedPaymentMethod: (method: PaymentMethodType) => void;
  customUpiId: string;
  setCustomUpiId: (id: string) => void;

  // Active Booking & Live Tracking
  activeBooking: BookingDetails | null;
  setActiveBooking: (booking: BookingDetails | null) => void;
  allBookings: BookingDetails[];
  createBooking: () => BookingDetails;
  updateTrackingStage: (stage: TrackingStage) => void;
  advanceToNextStage: () => void;
  rewindToPreviousStage: () => void;
  assignedProvider: ServiceProvider | null;
  setAssignedProvider: (provider: ServiceProvider) => void;

  // Reviews & Rating
  feedbackList: FeedbackReview[];
  submitReview: (review: Omit<FeedbackReview, 'bookingId' | 'timestamp'>) => void;
  markFeedbackDismissed: (bookingId: string) => void;
  isFeedbackDismissed: (bookingId: string) => boolean;

  // Reset helper
  resetFlow: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Address State
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(SAVED_ADDRESSES);
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null);

  // Service Selection State (Empty by default to prevent preselected price across categories)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>(SERVICE_CATEGORIES[0]);
  const [selectedSubServices, setSelectedSubServices] = useState<SubService[]>([]);

  // Date & Time State
  const upcomingDays = useMemo(() => getUpcomingDays(), []);
  const [selectedDate, setSelectedDate] = useState<DayOption>(upcomingDays[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(TIME_SLOTS[0]);

  // Coupon & Payment State
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('gpay');
  const [customUpiId, setCustomUpiId] = useState<string>('');

  // Active Booking & All Stored Bookings State
  const [allBookings, setAllBookings] = useState<BookingDetails[]>([]);
  const [activeBooking, setActiveBooking] = useState<BookingDetails | null>(null);
  const [assignedProvider, setAssignedProvider] = useState<ServiceProvider | null>(MOCK_PROVIDERS[0]);
  const [feedbackList, setFeedbackList] = useState<FeedbackReview[]>([]);
  const [dismissedFeedbackIds, setDismissedFeedbackIds] = useState<string[]>([]);

  // Load bookings and feedback from local storage on startup and restore ongoing bookings
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [storedBookings, storedFeedback] = await Promise.all([
          AsyncStorage.getItem(BOOKINGS_STORAGE_KEY),
          AsyncStorage.getItem(FEEDBACK_STORAGE_KEY),
        ]);

        let parsedFeedback: FeedbackReview[] = [];
        if (storedFeedback) {
          parsedFeedback = JSON.parse(storedFeedback);
          setFeedbackList(parsedFeedback);
        }

        if (storedBookings) {
          const parsed: BookingDetails[] = JSON.parse(storedBookings);
          setAllBookings(parsed);
          // Find first booking whose scheduled slot has not passed and is NOT reviewed
          const ongoing = parsed.find(
            (b) =>
              !isBookingSlotPast(b) &&
              !b.hasReviewed &&
              !parsedFeedback.some((f) => f.bookingId === b.bookingId)
          );
          if (ongoing) {
            setActiveBooking(ongoing);
            if (ongoing.provider) setAssignedProvider(ongoing.provider);
          }
        }
      } catch (err) {
        console.error('Error loading stored bookings/feedback:', err);
      }
    };
    loadStoredData();
  }, []);

  // Toggle Sub-service (allows deselecting all)
  const toggleSubService = (service: SubService) => {
    setSelectedSubServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const isSubServiceSelected = (serviceId: string) => {
    return selectedSubServices.some((s) => s.id === serviceId);
  };

  const clearSelectedSubServices = () => {
    setSelectedSubServices([]);
  };

  // Add new address
  const addNewAddress = (addressData: Omit<Address, 'id'>): Address => {
    const newAddr: Address = {
      ...addressData,
      id: `addr-${Date.now()}`,
    };
    setSavedAddresses((prev) => [newAddr, ...prev]);
    setCurrentAddress(newAddr);
    return newAddr;
  };

  // Use live GPS location simulation
  const setLiveGpsLocation = (customStreet?: string) => {
    const liveAddr: Address = {
      id: `live-${Date.now()}`,
      type: 'Other',
      label: 'Live Location',
      street: customStreet || '100ft Ring Road, Near Sony World Signal, Koramangala',
      houseNo: 'Current Location',
      landmark: 'Live GPS Pin (Accurate)',
      city: 'Bangalore',
      pincode: '560034',
      isDefault: false,
      coordinates: { latitude: 12.9344, longitude: 77.6202 },
    };
    setSavedAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== liveAddr.id);
      return [liveAddr, ...filtered];
    });
    setCurrentAddress(liveAddr);
  };

  // Pricing calculations (Taxes & GST removed)
  const baseAmount = useMemo(() => {
    return selectedSubServices.reduce((sum, item) => sum + item.price, 0);
  }, [selectedSubServices]);

  const taxAmount = 0;

  const totalAmount = useMemo(() => {
    const total = baseAmount - discountAmount;
    return Math.max(0, total);
  }, [baseAmount, discountAmount]);

  // Coupons
  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'CLEAN20' || clean === 'SPECIAL20') {
      const disc = Math.round(baseAmount * 0.2);
      setDiscountAmount(disc);
      setCouponCode(clean);
      return { success: true, message: `Coupon ${clean} applied! You saved ₹${disc}` };
    }
    if (clean === 'PUREWATER' || clean === 'SAVE300') {
      const disc = Math.min(300, baseAmount);
      setDiscountAmount(disc);
      setCouponCode(clean);
      return { success: true, message: `Coupon ${clean} applied! You saved ₹${disc}` };
    }
    if (clean === 'COOL499') {
      const disc = Math.min(200, baseAmount);
      setDiscountAmount(disc);
      setCouponCode(clean);
      return { success: true, message: `Coupon ${clean} applied! ₹${disc} off on AC care.` };
    }
    return { success: false, message: 'Invalid coupon code. Try CLEAN20 or PUREWATER.' };
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountAmount(0);
  };

  // Create confirmed booking
  const createBooking = (): BookingDetails => {
    const randomOtp = String(Math.floor(1000 + Math.random() * 9000));
    const randomProvider = MOCK_PROVIDERS[Math.floor(Math.random() * MOCK_PROVIDERS.length)];
    const bookingAddress: Address = currentAddress || {
      id: `addr-${Date.now()}`,
      type: 'Home',
      label: 'Service Address',
      houseNo: 'Selected Location',
      street: '100ft Road, Koramangala',
      landmark: 'Bangalore',
      city: 'Bangalore',
      pincode: '560034',
    };
    
    const newBooking: BookingDetails = {
      bookingId: `HS-${Math.floor(100000 + Math.random() * 900000)}`,
      category: selectedCategory,
      selectedSubServices: [...selectedSubServices],
      date: selectedDate,
      timeSlot: selectedTimeSlot || TIME_SLOTS[0],
      address: bookingAddress,
      paymentMethod: selectedPaymentMethod,
      upiId: customUpiId || undefined,
      baseAmount,
      taxAmount,
      discountAmount,
      totalAmount,
      couponApplied: couponCode || undefined,
      provider: randomProvider,
      otp: randomOtp,
      stage: 'ASSIGNED',
      etaMinutes: 20,
      distanceKm: 3.1,
      bookingCreatedAt: new Date().toISOString(),
    };

    const saveBookings = async (list: BookingDetails[]) => {
      try {
        await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(list));
      } catch (err) {
        console.error('Failed to save bookings:', err);
      }
    };

    setActiveBooking(newBooking);
    setAssignedProvider(randomProvider);

    setAllBookings((prev) => {
      const updated = [newBooking, ...prev.filter((b) => b.bookingId !== newBooking.bookingId)];
      saveBookings(updated);
      return updated;
    });

    return newBooking;
  };

  const updateTrackingStage = (stage: TrackingStage) => {
    let newEta = 20;
    let newDist = 3.1;

    if (stage === 'CONFIRMED') {
      newEta = 25;
      newDist = 3.5;
    } else if (stage === 'ASSIGNED') {
      newEta = 20;
      newDist = 3.1;
    } else if (stage === 'EN_ROUTE') {
      newEta = 12;
      newDist = 1.9;
    } else if (stage === 'ARRIVED') {
      newEta = 0;
      newDist = 0.05;
    } else if (stage === 'IN_PROGRESS') {
      newEta = 0;
      newDist = 0;
    } else if (stage === 'COMPLETED') {
      newEta = 0;
      newDist = 0;
    }

    setActiveBooking((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        stage,
        etaMinutes: newEta,
        distanceKm: newDist,
      };
    });

    setAllBookings((prevList) => {
      const updatedList = prevList.map((item) => {
        if (item.bookingId === activeBooking?.bookingId) {
          return {
            ...item,
            stage,
            etaMinutes: newEta,
            distanceKm: newDist,
          };
        }
        return item;
      });
      AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updatedList)).catch(() => {});
      return updatedList;
    });
  };

  const stagesSequence: TrackingStage[] = [
    'CONFIRMED',
    'ASSIGNED',
    'EN_ROUTE',
    'ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
  ];

  const advanceToNextStage = () => {
    if (!activeBooking) return;
    const currentIndex = stagesSequence.indexOf(activeBooking.stage);
    if (currentIndex < stagesSequence.length - 1) {
      updateTrackingStage(stagesSequence[currentIndex + 1]);
    }
  };

  const rewindToPreviousStage = () => {
    if (!activeBooking) return;
    const currentIndex = stagesSequence.indexOf(activeBooking.stage);
    if (currentIndex > 0) {
      updateTrackingStage(stagesSequence[currentIndex - 1]);
    }
  };

  const markFeedbackDismissed = (bookingId: string) => {
    if (!bookingId) return;
    setDismissedFeedbackIds((prev) => (prev.includes(bookingId) ? prev : [...prev, bookingId]));
  };

  const isFeedbackDismissed = (bookingId: string) => {
    if (!bookingId) return false;
    return dismissedFeedbackIds.includes(bookingId);
  };

  const submitReview = (reviewData: Omit<FeedbackReview, 'bookingId' | 'timestamp'>) => {
    const bookingId = activeBooking?.bookingId || `HS-${Date.now()}`;
    const feedback: FeedbackReview = {
      ...reviewData,
      bookingId,
      timestamp: new Date().toISOString(),
    };
    setFeedbackList((prev) => {
      const updated = [feedback, ...prev];
      AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    markFeedbackDismissed(bookingId);

    // Mark the booking as reviewed and completed so it moves to Past History
    setAllBookings((prevList) => {
      const updatedList = prevList.map((item) => {
        if (item.bookingId === bookingId) {
          return {
            ...item,
            stage: 'COMPLETED' as TrackingStage,
            hasReviewed: true,
          };
        }
        return item;
      });
      AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updatedList)).catch(() => {});
      return updatedList;
    });

    setActiveBooking((prev) => {
      if (!prev || prev.bookingId === bookingId) return null;
      return prev;
    });
  };

  const resetFlow = () => {
    setActiveBooking(null);
    setCouponCode('');
    setDiscountAmount(0);
    setSelectedSubServices([]);
  };

  return (
    <BookingContext.Provider
      value={{
        currentAddress,
        savedAddresses,
        setCurrentAddress,
        addNewAddress,
        setLiveGpsLocation,
        selectedCategory,
        setSelectedCategory,
        selectedSubServices,
        toggleSubService,
        isSubServiceSelected,
        clearSelectedSubServices,
        upcomingDays,
        selectedDate,
        setSelectedDate,
        timeSlots: TIME_SLOTS,
        selectedTimeSlot,
        setSelectedTimeSlot,
        baseAmount,
        taxAmount,
        discountAmount,
        totalAmount,
        couponCode,
        applyCoupon,
        removeCoupon,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        customUpiId,
        setCustomUpiId,
        activeBooking,
        setActiveBooking,
        allBookings,
        createBooking,
        updateTrackingStage,
        advanceToNextStage,
        rewindToPreviousStage,
        assignedProvider,
        setAssignedProvider,
        feedbackList,
        submitReview,
        markFeedbackDismissed,
        isFeedbackDismissed,
        resetFlow,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
