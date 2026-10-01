/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from 'firebase-functions/v2';
import * as authFunctions from './users/auth';
import * as profile from './users/profile';
import * as addresses from './users/addresses';
import * as payments from './payments';
import * as commerceOrders from './commerce/orders';
import * as carts from './modules/carts';
import * as notifications from './modules/notifications';
import * as catalog from './modules/catalog';
import * as searchModule from './modules/search';
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
export const updateProfile = profile.updateProfile;
export const requestAccountDeletion = profile.requestAccountDeletion;
export const replaceAddresses = addresses.replaceAddresses;
export const deleteAddress = addresses.deleteAddress;
export const setDefaultAddress = addresses.setDefaultAddress;

// ============================================================================
// PAYMENTS MODULE
// ============================================================================
export const savePaymentMethod = payments.savePaymentMethod;
export const removePaymentMethod = payments.removePaymentMethod;
export const addMoney = payments.addMoney;
export const chargeWallet = payments.chargeWallet;

// ============================================================================
// COMMERCE & ORDERS MODULE
// ============================================================================
export const placeOrder = commerceOrders.placeOrder;
export const cancelOrder = commerceOrders.cancelOrder;
export const reorder = commerceOrders.reorder;
export const rescheduleOrder = commerceOrders.rescheduleOrder;
export const runOrderAction = commerceOrders.runOrderAction;

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
