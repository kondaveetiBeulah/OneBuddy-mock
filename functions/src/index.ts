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
// COMMERCE MODULE
// ============================================================================
export const placeOrder = commerceOrders.placeOrder;
export const cancelOrder = commerceOrders.cancelOrder;
export const reorder = commerceOrders.reorder;
export const runOrderAction = commerceOrders.runOrderAction;


