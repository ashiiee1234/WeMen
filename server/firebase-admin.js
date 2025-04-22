const admin = require('firebase-admin');

// Initialize Firebase Admin with environment variables
// In production, these should be set in your hosting environment (like Render)
function initializeFirebase() {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "wemen-5a087",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  }
  
  return admin;
}

// Get Firestore database
const getFirestore = () => {
  const adminInstance = initializeFirebase();
  return adminInstance.firestore();
};

module.exports = {
  admin: initializeFirebase,
  getFirestore
}; 