import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Doctor, DaySlot, TimeSlot, PatientDetails, BookingSummary } from '../types/doctor';
import { MOCK_DOCTORS } from '../data/mockData';

export interface BookingContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (catKey: string | null) => void;
  selectedMode: 'video' | 'audio';
  setSelectedMode: (mode: 'video' | 'audio') => void;
  selectedDoctor: Doctor | null;
  setSelectedDoctor: (doctor: Doctor | null) => void;
  selectedDate: DaySlot | null;
  setSelectedDate: (date: DaySlot | null) => void;
  selectedSlot: TimeSlot | null;
  setSelectedSlot: (slot: TimeSlot | null) => void;
  patientDetails: PatientDetails;
  updatePatientDetails: (details: Partial<PatientDetails>) => void;
  activeBooking: BookingSummary | null;
  bookingHistory: BookingSummary[];
  confirmBooking: (paymentMethod: string, discount?: number) => BookingSummary;
  resetBookingFlow: () => void;
  getDoctorById: (id: string) => Doctor | undefined;
}

const initialPatientDetails: PatientDetails = {
  fullName: '',
  age: '',
  gender: 'Male',
  phone: '',
  email: '',
  symptoms: '',
  selectedSymptomTags: [],
};

const initialSampleBookings: BookingSummary[] = [
  {
    bookingId: 'OB-MED-849201',
    doctor: MOCK_DOCTORS[0], // Dr. Rajesh Sharma
    date: 'Today (17 Sep)',
    time: '05:45 PM',
    mode: 'video',
    patient: {
      fullName: 'Rahul Sharma',
      age: '28',
      gender: 'Male',
      phone: '9876543210',
      email: 'rahul.sharma@example.com',
      symptoms: 'Mild fever and dry throat since yesterday morning',
      selectedSymptomTags: ['High Fever', 'Dry Cough'],
    },
    feeBreakdown: {
      consultationFee: 499,
      platformFee: 50,
      discount: 0,
      totalAmount: 549,
    },
    paymentMethod: 'UPI (GPAY)',
    meetingLink: 'https://meet.onebuddy.health/onebuddy-meet-ob-med-849201',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'confirmed',
  },
];

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({
  children,
  onBookingSuccess,
}: {
  children: ReactNode;
  onBookingSuccess?: (booking: BookingSummary) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'video' | 'audio'>('video');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<DaySlot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDetails>(initialPatientDetails);
  const [activeBooking, setActiveBooking] = useState<BookingSummary | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingSummary[]>(initialSampleBookings);

  const updatePatientDetails = (details: Partial<PatientDetails>) => {
    setPatientDetails((prev) => ({ ...prev, ...details }));
  };

  const getDoctorById = (id: string): Doctor | undefined => {
    return MOCK_DOCTORS.find((d) => d.id === id);
  };

  const confirmBooking = (paymentMethod: string, discount: number = 0): BookingSummary => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      throw new Error('Missing doctor or appointment slot');
    }

    const fee = selectedMode === 'audio' && selectedDoctor.audioConsultationFee
      ? selectedDoctor.audioConsultationFee
      : selectedDoctor.consultationFee;

    const platformFee = 50;
    const totalAmount = Math.max(0, fee + platformFee - discount);

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const bookingId = `OB-MED-${randomSuffix}`;
    const roomSlug = `onebuddy-meet-${bookingId.toLowerCase()}`;
    const meetingLink = `https://meet.onebuddy.health/${roomSlug}`;

    const newBooking: BookingSummary = {
      bookingId,
      doctor: selectedDoctor,
      date: `${selectedDate.dayLabel} (${selectedDate.dateFormatted})`,
      time: selectedSlot.time,
      mode: selectedMode,
      patient: { ...patientDetails },
      feeBreakdown: {
        consultationFee: fee,
        platformFee,
        discount,
        totalAmount,
      },
      paymentMethod,
      meetingLink,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'confirmed',
    };

    setActiveBooking(newBooking);
    setBookingHistory((prev) => [newBooking, ...prev]);
    if (onBookingSuccess) {
      onBookingSuccess(newBooking);
    }
    return newBooking;
  };

  const resetBookingFlow = () => {
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setPatientDetails(initialPatientDetails);
  };

  return (
    <BookingContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedMode,
        setSelectedMode,
        selectedDoctor,
        setSelectedDoctor,
        selectedDate,
        setSelectedDate,
        selectedSlot,
        setSelectedSlot,
        patientDetails,
        updatePatientDetails,
        activeBooking,
        bookingHistory,
        confirmBooking,
        resetBookingFlow,
        getDoctorById,
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

// Aliases for compatibility
export const OCBookingProvider = BookingProvider;
export const useOCBooking = useBooking;
