import React, { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Booking, Doctor, PatientDetails, PaymentMode, TimeSlot } from '../types';
import { careService } from '@/firebase';

import { doctors as defaultDoctors } from '../mockData';

interface BookingContextValue {
  doctorsList: Doctor[];
  selectedDoctor?: Doctor;
  selectedDate?: string;
  selectedSlot?: TimeSlot;
  patient?: PatientDetails;
  paymentMode?: PaymentMode;
  booking?: Booking;
  bookingHistory: Booking[];
  chooseDoctor: (doctor: Doctor) => void;
  chooseSlot: (date: string, slot: TimeSlot) => void;
  savePatient: (patient: PatientDetails) => void;
  choosePayment: (mode: PaymentMode) => void;
  confirmBooking: (mode?: PaymentMode) => void;
  reset: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

interface BookingProviderProps extends PropsWithChildren {
  onBookingSuccess?: (booking: Booking) => void;
}

export function BookingProvider({ children, onBookingSuccess }: BookingProviderProps) {
  const [doctorsList, setDoctorsList] = useState<Doctor[]>(defaultDoctors);
  const [selectedDoctor, setDoctor] = useState<Doctor>();
  const [selectedDate, setDate] = useState<string>();
  const [selectedSlot, setSlot] = useState<TimeSlot>();
  const [patient, setPatient] = useState<PatientDetails>();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>();
  const [booking, setBooking] = useState<Booking>();
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);

  // Fetch active verified care providers from backend care service
  React.useEffect(() => {
    let isMounted = true;
    async function loadBackendProviders() {
      try {
        const providers = await careService.fetchHomeVisitProviders();
        if (isMounted && providers && providers.length > 0) {
          const mapped: Doctor[] = providers.map((p: any) => ({
            id: p.id,
            name: p.name,
            specialty: p.specialty || p.serviceTypes?.[0] || 'Certified Care Specialist',
            hospital: p.hospital || p.serviceArea || 'OneBuddy Care Network',
            location: p.location || p.serviceArea || 'Hyderabad',
            rating: p.rating || 4.9,
            experience: p.experience || 8,
            fee: p.fee || 499,
            phone: p.phone || '+919876543210',
            initials: p.initials || (p.name ? p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2) : 'CP'),
            avatar: p.avatar || p.image || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=200&auto=format&fit=crop&q=80',
            issueIds: p.issueIds || p.serviceTypes || ['nursing', 'elderly', 'checkup', 'injections'],
            symptoms: p.symptoms || p.serviceTypes || ['home care', 'nursing'],
            slots: p.slots || {},
          }));
          setDoctorsList(mapped);
        }
      } catch (err) {
        console.warn('[HomeVisits] Failed to fetch providers from backend:', err);
      }
    }
    loadBackendProviders();
    return () => {
      isMounted = false;
    };
  }, []);

  const reset = () => {
    setDoctor(undefined);
    setDate(undefined);
    setSlot(undefined);
    setPatient(undefined);
    setPaymentMode(undefined);
    setBooking(undefined);
  };

  const confirmBooking = (mode?: PaymentMode) => {
    const finalMode = mode ?? paymentMode;
    if (!selectedDoctor || !selectedDate || !selectedSlot || !patient || !finalMode) return;
    
    const newBooking: Booking = {
      id: `HV-${Date.now().toString().slice(-6)}`,
      doctor: selectedDoctor,
      patient,
      date: selectedDate,
      slot: selectedSlot,
      paymentMode: finalMode,
      consultationFee: selectedDoctor.fee,
      platformFee: 50,
      total: selectedDoctor.fee + 50,
    };

    setBooking(newBooking);
    setBookingHistory((prev) => [newBooking, ...prev]);

    // Asynchronously create canonical service booking in Firestore via Cloud Function
    careService.createCareBooking({
      idempotencyKey: newBooking.id,
      providerId: selectedDoctor.id,
      providerName: selectedDoctor.name,
      serviceType: selectedDoctor.specialty || 'Home Visit Care',
      scheduledAt: selectedDate || new Date().toISOString(),
      quotedPriceMinor: Math.round(newBooking.total * 100),
      patientDetails: {
        fullName: patient.fullName,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
      },
      addressSnapshot: {
        receiverName: patient.fullName,
        phone: patient.phone || '',
        line1: patient.address || 'Customer Address, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
      },
      paymentMethod: finalMode,
    }).catch((err) => {
      console.warn('[HomeVisits] Server createCareBooking warning:', err);
    });

    if (onBookingSuccess) {
      onBookingSuccess(newBooking);
    }
  };

  return (
    <BookingContext.Provider
      value={{
        doctorsList,
        selectedDoctor,
        selectedDate,
        selectedSlot,
        patient,
        paymentMode,
        booking,
        bookingHistory,
        chooseDoctor: setDoctor,
        chooseSlot: (date, slot) => {
          setDate(date);
          setSlot(slot);
        },
        savePatient: setPatient,
        choosePayment: setPaymentMode,
        confirmBooking,
        reset,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
};
