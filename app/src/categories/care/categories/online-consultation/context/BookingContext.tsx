import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Timestamp } from 'firebase/firestore';
import { careService } from '@/firebase';
import { Doctor, DaySlot, TimeSlot, PatientDetails, BookingSummary } from '../types/doctor';
import { MOCK_DOCTORS } from '../data/mockData';

export interface BookingContextType {
  doctors: Doctor[];
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

const sampleDoctor: Doctor = {
  id: '',
  name: '',
  gender: 'male',
  avatar: '',
  specialty: '',
  specialtyKey: '',
  degrees: '',
  experienceYears: 0,
  hospital: '',
  location: '',
  rating: 0,
  totalReviews: 0,
  totalConsultations: 0,
  consultationFee: 0,
  audioConsultationFee: 0,
  availableModes: ['video', 'audio'],
  about: '',
  languages: [],
  nextAvailable: '',
  isTopRated: false,
  isInstantAvailable: false,
};

const initialSampleBookings: BookingSummary[] = [];

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({
  children,
  onBookingSuccess,
}: {
  children: ReactNode;
  onBookingSuccess?: (booking: BookingSummary) => void;
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'video' | 'audio'>('video');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<DaySlot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDetails>(initialPatientDetails);
  const [activeBooking, setActiveBooking] = useState<BookingSummary | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingSummary[]>(initialSampleBookings);

  React.useEffect(() => {
    let isMounted = true;
    async function loadBackendDoctors() {
      try {
        const fetched = await careService.fetchDoctors();
        if (isMounted && fetched && fetched.length > 0) {
          const mapped: Doctor[] = fetched.map((d: any) => ({
            id: d.id,
            name: d.name,
            gender: d.gender || '',
            avatar: d.avatar || '',
            specialty: d.specialty || '',
            specialtyKey: d.specialtyKey || (d.specialtyIds ? d.specialtyIds[0] : ''),
            degrees: d.degrees || '',
            experienceYears: d.experienceYears || 0,
            hospital: d.hospital || '',
            location: d.location || '',
            rating: d.rating || 0,
            totalReviews: d.ratingCount || d.totalReviews || 0,
            totalConsultations: d.totalConsultations || 0,
            consultationFee: d.consultationFee || 0,
            audioConsultationFee: d.audioConsultationFee || 0,
            availableModes: d.consultationModes || d.availableModes || [],
            about: d.about || '',
            languages: d.languages || [],
            nextAvailable: d.nextAvailable || '',
            isTopRated: Boolean(d.isTopRated),
            isInstantAvailable: Boolean(d.isInstantAvailable),
          }));
          setDoctors(mapped);
        }
      } catch (err) {
        console.warn('[BookingContext] Error fetching doctors from backend:', err);
      }
    }
    loadBackendDoctors();
    return () => {
      isMounted = false;
    };
  }, []);

  const updatePatientDetails = (details: Partial<PatientDetails>) => {
    setPatientDetails((prev) => ({ ...prev, ...details }));
  };

  const getDoctorById = (id: string): Doctor | undefined => {
    return doctors.find((d) => d.id === id);
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

    // Asynchronously create canonical appointment in Firestore via Cloud Function
    careService.bookAppointment({
      hospitalId: selectedDoctor.hospital || 'hyd-apollo',
      doctorId: selectedDoctor.id,
      departmentId: selectedDoctor.specialtyKey || 'general_physician',
      slotId: selectedSlot.id,
      mode: selectedMode === 'video' ? 'video' : 'in_person',
      patientDetails: {
        fullName: patientDetails.fullName || 'Patient',
        phone: patientDetails.phone,
        age: patientDetails.age,
        gender: (patientDetails.gender as any) || 'Male',
        email: patientDetails.email,
      },
      reasonForVisit: patientDetails.symptoms,
      paymentMethod,
      idempotencyKey: bookingId,
    }).catch((err) => {
      console.warn('[BookingContext] Server bookAppointment warning:', err);
    });

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
        doctors,
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
