/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from 'firebase-functions/v2';
import * as authFunctions from './modules/auth';
import * as profile from './modules/users';
import * as preferences from './modules/preferences';
import * as addresses from './modules/addresses';
import * as payments from './modules/payments';
import * as wallet from './modules/wallet';
import * as commerceOrders from './modules/orders';
import * as hospitalFunctions from './modules/hospitals';
import * as pharmacyOrders from './modules/pharmacy';
import * as bookingFunctions from './modules/bookings';
import * as rideFunctions from './modules/rides';
import * as supportFunctions from './modules/support';
import * as emailFunctions from './modules/email';
import * as careModule from './modules/care';
import * as carts from './modules/carts';
import * as notifications from './modules/notifications';
import * as catalog from './modules/catalog';
import * as searchModule from './modules/search';
import * as auditFunctions from './common/audit';
import * as adminSeedFunctions from './admin/seed';
import * as outboxJobs from './jobs/outboxWorker';
import * as emailJobs from './jobs/emailDispatcher';
import * as catalogSync from './jobs/catalogSearchSync';


// Set global options for all v2 functions (like region, memory, concurrency)
setGlobalOptions({
  region: 'asia-south1',
  maxInstances: 10,
});

// ============================================================================
// AUTHENTICATION & OTP MODULE (Fast2SMS)
// ============================================================================
export const sendMobileOtp = authFunctions.sendMobileOtp;
export const verifyMobileOtp = authFunctions.verifyMobileOtp;
export const deleteUserAccount = authFunctions.deleteUserAccount;

// ============================================================================
// IDENTITY & PROFILE MODULE
// ============================================================================
export const ensureProfile = profile.ensureProfile;
export const getMe = profile.getMe;
export const updateProfile = profile.updateProfile;
export const requestAccountDeletion = profile.requestAccountDeletion;
export const requestDataExport = profile.requestDataExport;

// ============================================================================
// PREFERENCES MODULE
// ============================================================================
export const getPreferences = preferences.getPreferences;
export const updateSettings = preferences.updateSettings;
export const updateServicePreferences = preferences.updateServicePreferences;
export const updateNotificationPreferences = preferences.updateNotificationPreferences;

// ============================================================================
// ADDRESSES MODULE
// ============================================================================
export const createAddress = addresses.createAddress;
export const updateAddress = addresses.updateAddress;
export const replaceAddresses = addresses.replaceAddresses;
export const deleteAddress = addresses.deleteAddress;
export const setDefaultAddress = addresses.setDefaultAddress;

// ============================================================================
// PAYMENTS MODULE
// ============================================================================
export const createPaymentIntent = payments.createPaymentIntent;
export const paymentWebhook = payments.paymentWebhook;
export const savePaymentMethod = payments.savePaymentMethod;
export const addPaymentMethod = payments.addPaymentMethod;
export const removePaymentMethod = payments.removePaymentMethod;
export const listPaymentMethods = payments.listPaymentMethods;
export const refundPayment = payments.refundPayment;
export const listPaymentRefunds = payments.listPaymentRefunds;

// ============================================================================
// WALLET MODULE
// ============================================================================
export const addMoney = wallet.addMoney;
export const createTopUp = wallet.createTopUp;
export const confirmTopUp = wallet.confirmTopUp;
export const chargeWallet = wallet.chargeWallet;
export const getWallet = wallet.getWallet;
export const listWalletTransactions = wallet.listWalletTransactions;

// ============================================================================
// COMMERCE & ORDERS MODULE
// ============================================================================
export const placeOrder = commerceOrders.placeOrder;
export const cancelOrder = commerceOrders.cancelOrder;
export const reorder = commerceOrders.reorder;
export const rescheduleOrder = commerceOrders.rescheduleOrder;
export const runOrderAction = commerceOrders.runOrderAction;

// ============================================================================
// HOSPITALS & HEALTHCARE MODULE (Canonical + Legacy Aliases)
// ============================================================================
export const getHospitals = hospitalFunctions.getHospitals;
export const getHospital = hospitalFunctions.getHospital;
export const getHospitalDepartments = hospitalFunctions.getHospitalDepartments;
export const getHospitalDoctors = hospitalFunctions.getHospitalDoctors;
export const getDoctorAvailability = hospitalFunctions.getDoctorAvailability;

export const createHospitalAppointment = hospitalFunctions.createHospitalAppointment;
export const confirmHospitalAppointment = hospitalFunctions.confirmHospitalAppointment;
export const cancelHospitalAppointment = hospitalFunctions.cancelHospitalAppointment;
export const completeHospitalAppointment = hospitalFunctions.completeHospitalAppointment;

export const createPrescription = hospitalFunctions.createPrescription;
export const getUserPrescriptions = hospitalFunctions.getUserPrescriptions;
export const getPrescription = hospitalFunctions.getPrescription;

export const createMedicalDocument = hospitalFunctions.createMedicalDocument;
export const getMedicalDocuments = hospitalFunctions.getMedicalDocuments;
export const deleteMedicalDocument = hospitalFunctions.deleteMedicalDocument;

// Backwards compatibility aliases
export const searchHospitals = hospitalFunctions.searchHospitals;
export const listDoctors = hospitalFunctions.listDoctors;
export const listAvailability = hospitalFunctions.listAvailability;
export const bookAppointment = hospitalFunctions.bookAppointment;
export const cancelAppointment = hospitalFunctions.cancelAppointment;
export const getMyAppointment = hospitalFunctions.getMyAppointment;
export const listMyAppointments = hospitalFunctions.listMyAppointments;
export const updateAppointmentStatus = hospitalFunctions.updateAppointmentStatus;
export const getPrescriptions = hospitalFunctions.getPrescriptions;
export const issuePrescription = hospitalFunctions.issuePrescription;
export const createMedicalDocumentMetadata = hospitalFunctions.createMedicalDocumentMetadata;
export const listMedicalDocuments = hospitalFunctions.listMedicalDocuments;

// ============================================================================
// PHARMACY & MEDICINE DELIVERY MODULE
// ============================================================================
export const getPharmacies = pharmacyOrders.getPharmacies;
export const getPharmacy = pharmacyOrders.getPharmacy;
export const getMedicines = pharmacyOrders.getMedicines;
export const getMedicine = pharmacyOrders.getMedicine;
export const searchPharmacies = pharmacyOrders.searchPharmacies;
export const listMedicines = pharmacyOrders.listMedicines;
export const uploadPrescription = pharmacyOrders.uploadPrescription;
export const placeMedicineOrder = pharmacyOrders.placeMedicineOrder;


// ============================================================================
// CARE & HOME SERVICE BOOKINGS MODULE
// ============================================================================
export const getServiceProviders = bookingFunctions.getServiceProviders;
export const getServiceProvider = bookingFunctions.getServiceProvider;
export const createServiceBooking = bookingFunctions.createServiceBooking;
export const getUserServiceBookings = bookingFunctions.getUserServiceBookings;
export const getServiceBooking = bookingFunctions.getServiceBooking;
export const updateServiceBookingStatus = bookingFunctions.updateServiceBookingStatus;
export const cancelServiceBooking = bookingFunctions.cancelServiceBooking;
export const listProviders = bookingFunctions.listProviders;
export const listCareProviders = bookingFunctions.listCareProviders;
export const quoteBooking = bookingFunctions.quoteBooking;
export const createBooking = bookingFunctions.createBooking;
export const createCareBooking = bookingFunctions.createCareBooking;
export const cancelBooking = bookingFunctions.cancelBooking;
export const cancelCareBooking = bookingFunctions.cancelCareBooking;
export const rateBooking = bookingFunctions.rateBooking;
export const updateBookingStatus = bookingFunctions.updateBookingStatus;
export const getMyBooking = bookingFunctions.getMyBooking;
export const listMyBookings = bookingFunctions.listMyBookings;


// ============================================================================
// RIDES MODULE
// ============================================================================
export const quoteRide = rideFunctions.quoteRide;
export const requestRide = rideFunctions.requestRide;
export const cancelRide = rideFunctions.cancelRide;
export const getRide = rideFunctions.getRide;
export const rateRides = rideFunctions.rateRides;
export const rateRide = rideFunctions.rateRide;
export const updateRideStatus = rideFunctions.updateRideStatus;
export const updateDriverLocation = rideFunctions.updateDriverLocation;
export const onRideTerminatedCleanup = rideFunctions.onRideTerminatedCleanup;
export const cleanupStaleRideLocations = rideFunctions.cleanupStaleRideLocations;


// ============================================================================
// FEEDBACK & SUPPORT MODULE
// ============================================================================
export const submitOrderFeedback = supportFunctions.submitOrderFeedback;
export const createSupportRequest = supportFunctions.createSupportRequest;
export const listMySupportRequests = supportFunctions.listMySupportRequests;

// ============================================================================
// EMAIL QUEUE & NOTIFICATIONS MODULE
// ============================================================================
export const enqueueTransactionalEmail = emailFunctions.enqueueTransactionalEmail;
export const processEmailJob = emailFunctions.processEmailJob;
export const emailProviderWebhook = emailFunctions.emailProviderWebhook;

// ============================================================================
// AUDIT & REFERENCE DATA SEEDING MODULE
// ============================================================================
export const recordAuditEvent = auditFunctions.recordAuditEvent;
export const seedReferenceData = adminSeedFunctions.seedReferenceData;

// ============================================================================
// CARE SERVICES & CATALOG MODULE (op-booking, online-consultation, home-visits, medicine-delivery)
// ============================================================================
export const getCareHospitals = careModule.getCareHospitals;
export const getCareDoctors = careModule.getCareDoctors;
export const getHomeVisitProviders = careModule.getHomeVisitProviders;
export const getCareMedicines = careModule.getCareMedicines;
export const getCareCatalog = careModule.getCareCatalog;
export const syncCareCatalogToFirestore = careModule.syncCareCatalogToFirestore;

// ============================================================================
// CARTS MODULE
// ============================================================================
export const getCart = carts.getCart;
export const setCartItem = carts.setCartItem;
export const removeCartItem = carts.removeCartItem;
export const clearCart = carts.clearCart;
export const quoteCheckout = carts.quoteCheckout;


// ============================================================================
// NOTIFICATIONS & DEVICES MODULE
// ============================================================================
export const registerDevice = notifications.registerDevice;
export const unregisterDevice = notifications.unregisterDevice;
export const listNotifications = notifications.listNotifications;
export const markNotificationRead = notifications.markNotificationRead;

// ============================================================================
// CATALOG MODULE (Admin & Public Query Callables)
// ============================================================================
export const publishRestaurant = catalog.publishRestaurant;
export const publishMenuItem = catalog.publishMenuItem;
export const publishGroceryProduct = catalog.publishGroceryProduct;
export const publishOffer = catalog.publishOffer;
export const listRestaurants = catalog.listRestaurants;
export const getRestaurant = catalog.getRestaurant;
export const listMenuItems = catalog.listMenuItems;
export const listGroceryProducts = catalog.listGroceryProducts;
export const listOffers = catalog.listOffers;
export const searchCatalog = searchModule.searchCatalog;
export const seedServiceCatalog = catalog.seedServiceCatalog;
export const listServiceCatalog = catalog.listServiceCatalog;

// ============================================================================
// OUTBOX WORKER & BACKGROUND JOBS
// ============================================================================
export const onOutboxEventCreated = outboxJobs.onOutboxEventCreated;
export const outboxScheduledWorker = outboxJobs.outboxScheduledWorker;

// ============================================================================
// EMAIL DISPATCH WORKER
// ============================================================================
export const onEmailOutboxCreated = emailJobs.onEmailOutboxCreated;
export const emailOutboxScheduledWorker = emailJobs.emailOutboxScheduledWorker;

// ============================================================================
// CATALOG SEARCH PROJECTIONS SYNC WORKERS
// ============================================================================
export const onRestaurantWritten = catalogSync.onRestaurantWritten;
export const onGroceryProductWritten = catalogSync.onGroceryProductWritten;
export const onMenuItemWritten = catalogSync.onMenuItemWritten;
export const catalogSearchSyncWorker = catalogSync.catalogSearchSyncWorker;
