import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK. 
// This gives our backend full admin access to Firestore.
admin.initializeApp();

export const db = admin.firestore();
export const auth = admin.auth();
export { admin };
