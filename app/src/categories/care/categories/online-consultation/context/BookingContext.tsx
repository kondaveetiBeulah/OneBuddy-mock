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
  id: 'doc-1',
  name: 'Dr. Rajesh Sharma',
  gender: 'male',
  avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop',
  specialty: 'Senior General Physician',
  specialtyKey: 'general_physician',
  degrees: 'MBBS, MD',
  experienceYears: 14,
  hospital: 'Apollo Multi-Specialty Hospital',
  location: 'Hyderabad',
  rating: 4.95,
  totalReviews: 840,
  totalConsultations: 3200,
  consultationFee: 499,
  audioConsultationFee: 399,
  availableModes: ['video', 'audio'],
  about: 'Senior general physician.',
  languages: ['English', 'Hindi', 'Telugu'],
  nextAvailable: 'Today in 15 mins',
  isTopRated: true,
  isInstantAvailable: true,
};

const initialSampleBookings: BookingSummary[] = [
  {
    bookingId: 'OB-MED-849201',
    doctor: sampleDoctor,
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
            gender: d.gender || 'male',
            avatar: d.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop',
            specialty: d.specialty || 'General Physician',
            specialtyKey: d.specialtyKey || (d.specialtyIds ? d.specialtyIds[0] : 'general_physician'),
            degrees: d.degrees || 'MBBS, MD',
            experienceYears: d.experienceYears || 10,
            hospital: d.hospital || 'Apollo Multi-Specialty Hospital',
            location: d.location || 'Hyderabad',
            rating: d.rating || 4.9,
            totalReviews: d.ratingCount || 500,
            totalConsultations: 2000,
            consultationFee: d.consultationFee || 499,
            audioConsultationFee: d.audioConsultationFee || 399,
            availableModes: d.consultationModes || ['video', 'audio'],
            about: d.about || '',
            languages: d.languages || ['English', 'Hindi', 'Telugu'],
            nextAvailable: d.nextAvailable || 'Today in 15 mins',
            isTopRated: d.isTopRated !== undefined ? d.isTopRated : true,
            isInstantAvailable: d.isInstantAvailable !== undefined ? d.isInstantAvailable : true,
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
