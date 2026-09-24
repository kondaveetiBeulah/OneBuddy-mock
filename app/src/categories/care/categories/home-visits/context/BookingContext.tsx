import React, { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Booking, Doctor, PatientDetails, PaymentMode, TimeSlot } from '../types';

interface BookingContextValue {
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
  const [selectedDoctor, setDoctor] = useState<Doctor>();
  const [selectedDate, setDate] = useState<string>();
  const [selectedSlot, setSlot] = useState<TimeSlot>();
  const [patient, setPatient] = useState<PatientDetails>();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>();
  const [booking, setBooking] = useState<Booking>();
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);

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
    if (onBookingSuccess) {
      onBookingSuccess(newBooking);
    }
  };

  return (
    <BookingContext.Provider
      value={{
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
